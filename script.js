/**
 * ERBO - Güter- und Erbrecht Rechner
 * Modernized & Refactored Codebase
 */

// ==========================================
// CONSTANTS & CONFIG
// ==========================================
const RELATIONSHIPS = {
    SPOUSE: 'Ehepartner',
    CHILD: 'Kind',
    PARENT: 'Elternteil',
    SIBLING: 'Geschwister',
    GRANDCHILD: 'Enkel',
    GRANDPARENT: 'Grosseltern',
    UNCLE_AUNT: 'OnkelTante',
    COUSIN: 'Cousin',
    OTHER: 'Anderer'
};

const COLORS = ['#2c3e50', '#e67e22', '#27ae60', '#8e44ad', '#2980b9'];

// ==========================================
// DOMAIN LOGIC: INHERITANCE CALCULATOR
// ==========================================
class InheritanceCalculator {
    constructor(familyMembers, totalAssetValue) {
        this.family = familyMembers;
        this.totalValue = totalAssetValue;
        this.shares = new Map();
        
        // Categorize family members
        this.spouses = this.filterByRegex(/ehe|gatte|gattin|partner|eingetragen/i);
        this.children = this.filterByRegex(/(^|\s)kind|kinder|sohn|tochter/i);
        this.grandchildren = this.filterByRegex(/enkel|enkelin/i);
        this.parents = this.filterByRegex(/eltern|mutter|vater/i); // Strict parent check
        this.siblings = this.filterByRegex(/geschwister|bruder|schwester/i);
        this.grandparents = this.filterByRegex(/grosseltern|grossmutter|grossvater|oma|opa/i);
        this.unclesAunts = this.filterByRegex(/onkel|tante/i);
        this.cousins = this.filterByRegex(/cousin|cousine/i);
        this.others = this.filterByRegex(/anderer|andere|erweiterte/i);

        // Heuristic: Check 'others' for misclassified relatives based on name
        // This helps if the user selected "Anderer" but typed "Onkel Hans"
        this.others = this.others.filter(p => {
            const name = p.name.toLowerCase();
            if (name.includes('onkel') || name.includes('tante')) {
                this.unclesAunts.push(p);
                return false; // Remove from others
            }
            if (name.includes('cousin') || name.includes('cousine')) {
                this.cousins.push(p);
                return false;
            }
            if (name.includes('gross') || name.includes('oma') || name.includes('opa')) {
                this.grandparents.push(p);
                return false;
            }
            return true; // Keep in others
        });
    }

    filterByRegex(regex) {
        return this.family.filter(p => regex.test(p.beziehung));
    }

    addShare(name, amount) {
        if (!name) return;
        const current = this.shares.get(name) || 0;
        this.shares.set(name, current + amount);
    }

    calculate() {
        const hasSpouse = this.spouses.length > 0;
        const hasDescendants = this.hasDescendants();
        const hasParentalLine = this.parents.length > 0 || this.siblings.length > 0;
        const hasGrandparentalLine = this.grandparents.length > 0 || this.unclesAunts.length > 0 || this.cousins.length > 0;

        // 1. Spouse + Descendants
        if (hasSpouse && hasDescendants) {
            const spouseShare = this.totalValue * 0.5;
            this.addShare(this.spouses[0].name, spouseShare);
            this.distributeToDescendants(this.totalValue - spouseShare);
        }
        // 2. Only Descendants
        else if (hasDescendants) {
            this.distributeToDescendants(this.totalValue);
        }
        // 3. Spouse + Parental Line (Parents/Siblings)
        else if (hasSpouse && hasParentalLine) {
            const spouseShare = this.totalValue * 0.75;
            this.addShare(this.spouses[0].name, spouseShare);
            this.distributeToParentalLine(this.totalValue - spouseShare);
        }
        // 4. Spouse Only (or Spouse + Grandparents - Spouse takes all)
        else if (hasSpouse) {
            // ZGB 462 Ziff 3: If no parental line, spouse takes all.
            // Grandparents/Uncles/Cousins get nothing if spouse is present.
            this.addShare(this.spouses[0].name, this.totalValue);
        }
        // 5. Only Parental Line
        else if (hasParentalLine) {
            this.distributeToParentalLine(this.totalValue);
        }
        // 6. Only Grandparental Line (3. Parentel)
        else if (hasGrandparentalLine) {
            this.distributeToGrandparentalLine(this.totalValue);
        }
        // 7. Fallback: Distribute to Others or all listed
        else if (this.others.length > 0) {
            this.distributeEvenly(this.others, this.totalValue);
        }
        else if (this.family.length > 0) {
            this.distributeEvenly(this.family, this.totalValue);
        }

        return this.shares;
    }

    hasDescendants() {
        // Check if there are children OR grandchildren (even if children are not listed/deceased)
        return this.children.length > 0 || this.grandchildren.length > 0;
    }

    distributeToDescendants(amount) {
        // Identify branches (stirpes)
        const branchNames = new Set(this.children.map(c => c.name));
        
        // Map grandchildren to their parents
        const grandchildMap = new Map();
        this.grandchildren.forEach(gc => {
            const parentName = this.extractParentName(gc.beziehung);
            if (parentName) {
                branchNames.add(parentName);
                if (!grandchildMap.has(parentName)) grandchildMap.set(parentName, []);
                grandchildMap.get(parentName).push(gc);
            } else {
                // Orphans (no parent specified)
                if (!grandchildMap.has('__orphan')) grandchildMap.set('__orphan', []);
                grandchildMap.get('__orphan').push(gc);
            }
        });

        const branches = Array.from(branchNames);
        
        // Handle case where we only have "orphan" grandchildren
        if (branches.length === 0) {
            const orphans = grandchildMap.get('__orphan') || [];
            if (orphans.length > 0) {
                this.distributeEvenly(orphans, amount);
            }
            return;
        }

        const amountPerBranch = amount / branches.length;

        branches.forEach(branchName => {
            // Check if the branch head (child) is alive/listed
            const child = this.children.find(c => c.name === branchName);
            
            if (child) {
                this.addShare(child.name, amountPerBranch);
            } else {
                // Child deceased/missing -> distribute to their children (grandchildren)
                const grandkids = grandchildMap.get(branchName) || [];
                if (grandkids.length > 0) {
                    this.distributeEvenly(grandkids, amountPerBranch);
                }
            }
        });
    }

    distributeToParentalLine(amount) {
        // Split into two halves (Mother's side, Father's side)
        // Simplified: If parents exist, they take their share. If not, their share goes to siblings.
        
        if (this.parents.length >= 2) {
            this.distributeEvenly(this.parents, amount);
        } else if (this.parents.length === 1) {
            const livingParent = this.parents[0];
            const half = amount / 2;
            this.addShare(livingParent.name, half);
            
            // Other half goes to siblings (representing deceased parent)
            if (this.siblings.length > 0) {
                this.distributeEvenly(this.siblings, half);
            } else {
                // Accretion to living parent
                this.addShare(livingParent.name, half);
            }
        } else {
            // Both parents deceased -> all to siblings
            if (this.siblings.length > 0) {
                this.distributeEvenly(this.siblings, amount);
            }
        }
    }

    distributeToGrandparentalLine(amount) {
        // 3. Parentel Logic (Simplified)
        // Priority: Grandparents -> Uncles/Aunts -> Cousins
        // If both Grandparents and Uncles exist, we assume Uncles are children of deceased grandparents
        // and thus should inherit alongside living grandparents.
        
        const beneficiaries = [];
        if (this.grandparents.length > 0) beneficiaries.push(...this.grandparents);
        if (this.unclesAunts.length > 0) beneficiaries.push(...this.unclesAunts);
        
        if (beneficiaries.length > 0) {
            this.distributeEvenly(beneficiaries, amount);
        } else if (this.cousins.length > 0) {
            this.distributeEvenly(this.cousins, amount);
        }
    }

    distributeEvenly(beneficiaries, totalAmount) {
        if (!beneficiaries.length) return;
        const share = totalAmount / beneficiaries.length;
        beneficiaries.forEach(p => this.addShare(p.name, share));
    }

    extractParentName(relationString) {
        // "Enkel von Hans" -> "Hans"
        const m1 = relationString.match(/enkel(?:in)?\s*(?:von\s*)?(.+)$/i);
        if (m1 && m1[1]) return m1[1].trim();
        const m2 = relationString.match(/enkel(?:in)?\s*\(([^)]+)\)/i);
        if (m2 && m2[1]) return m2[1].trim();
        return null;
    }
}

// ==========================================
// UI CONTROLLER
// ==========================================
class ErboApp {
    constructor() {
        this.state = {
            family: [],
            assets: [],
            step: 1,
            history: []
        };

        this.cacheDOM();
        this.loadHistory(); // Load history on startup
        this.bindEvents();
        this.render();
    }

    cacheDOM() {
        this.dom = {
            sections: {
                familie: document.getElementById('familie'),
                vermoegen: document.getElementById('vermoegen'),
                ergebnis: document.getElementById('ergebnis')
            },
            inputs: {
                name: document.getElementById('name-input'),
                relation: document.getElementById('beziehung-select'),
                assetName: document.getElementById('vermoegen-art'),
                assetValue: document.getElementById('vermoegen-wert')
            },
            lists: {
                family: document.getElementById('familien-liste'),
                assets: document.getElementById('vermoegen-liste'),
                assetBars: document.getElementById('asset-bar-container'),
                results: document.getElementById('ergebnis-content'),
                history: document.getElementById('history-list')
            },
            buttons: {
                addFamily: document.querySelector('#familie .add-button'),
                addAsset: document.querySelector('#vermoegen .add-button'),
                nextFamilie: document.getElementById('complete-familie'),
                nextVermoegen: document.getElementById('complete-vermoegen'),
                clearHistory: document.getElementById('clear-history')
            },
            steps: document.querySelectorAll('.step'),
            historySection: document.getElementById('history-section')
        };
    }

    bindEvents() {
        // Family
        this.dom.buttons.addFamily.addEventListener('click', () => this.addFamilyMember());
        this.dom.buttons.nextFamilie.addEventListener('click', () => this.nextStep('familie', 'vermoegen'));

        // Assets
        this.dom.buttons.addAsset.addEventListener('click', () => this.addAsset());
        this.dom.buttons.nextVermoegen.addEventListener('click', () => {
            this.calculateResults();
            this.nextStep('vermoegen', 'ergebnis');
        });

        // History
        if (this.dom.buttons.clearHistory) {
            this.dom.buttons.clearHistory.addEventListener('click', () => this.clearHistory());
        }
    }

    // --- Logic: Family ---

    addFamilyMember() {
        const name = this.dom.inputs.name.value.trim();
        const beziehung = this.dom.inputs.relation.value;

        if (!name || !beziehung) {
            alert("Bitte Namen und Beziehung ausfüllen.");
            return;
        }

        this.state.family.push({ name, beziehung });
        this.dom.inputs.name.value = '';
        this.dom.inputs.relation.selectedIndex = 0;
        this.dom.inputs.name.focus();
        
        this.renderFamilyList();
        this.checkFamilyStatus();
    }

    removeFamilyMember(index) {
        this.state.family.splice(index, 1);
        this.renderFamilyList();
        this.checkFamilyStatus();
    }

    renderFamilyList() {
        const container = this.dom.lists.family;
        container.innerHTML = '';

        if (this.state.family.length === 0) {
            container.classList.add('empty-state');
            container.innerHTML = '<span class="placeholder-text">Noch keine Personen hinzugefügt</span>';
            return;
        }

        container.classList.remove('empty-state');
        this.state.family.forEach((person, index) => {
            const el = document.createElement('div');
            el.className = 'liste-item';
            el.innerHTML = `
                <div>
                    <strong>${this.escapeHtml(person.name)}</strong>
                    <br><small style="color:#7f8c8d">${person.beziehung}</small>
                </div>
                <button class="delete-btn" style="color:red; background:none;">&times;</button>
            `;
            el.querySelector('.delete-btn').addEventListener('click', () => this.removeFamilyMember(index));
            container.appendChild(el);
        });
    }

    checkFamilyStatus() {
        this.dom.buttons.nextFamilie.disabled = this.state.family.length < 1;
    }

    // --- Logic: Assets ---

    addAsset() {
        const art = this.dom.inputs.assetName.value.trim();
        const wert = parseFloat(this.dom.inputs.assetValue.value);

        if (!art || isNaN(wert) || wert <= 0) {
            alert("Bitte Bezeichnung und positiven Wert eingeben.");
            return;
        }

        this.state.assets.push({ art, wert });
        this.dom.inputs.assetName.value = '';
        this.dom.inputs.assetValue.value = '';
        this.dom.inputs.assetName.focus();

        this.renderAssetList();
        this.checkAssetStatus();
    }

    removeAsset(index) {
        this.state.assets.splice(index, 1);
        this.renderAssetList();
        this.checkAssetStatus();
    }

    renderAssetList() {
        const container = this.dom.lists.assets;
        const barContainer = this.dom.lists.assetBars;
        
        container.innerHTML = '';
        barContainer.innerHTML = '';

        const total = this.getTotalAssets();

        // Header with Total
        const totalHeader = document.createElement('div');
        totalHeader.className = 'asset-total';
        totalHeader.style.marginBottom = '8px';
        totalHeader.innerHTML = `<strong>Gesamt: ${this.formatCurrency(total)}</strong>`;
        container.appendChild(totalHeader);

        if (this.state.assets.length === 0) {
            container.classList.add('empty-state');
            const msg = document.createElement('div');
            msg.innerHTML = '<span class="placeholder-text">Keine Werte erfasst</span>';
            container.appendChild(msg);
            return;
        }

        container.classList.remove('empty-state');

        this.state.assets.forEach((asset, index) => {
            // List Item
            const el = document.createElement('div');
            el.className = 'liste-item';
            el.innerHTML = `
                <div style="flex:1;">
                    <span>${this.escapeHtml(asset.art)}</span>
                    <br><small style="color:#7f8c8d">${this.formatCurrency(asset.wert)}</small>
                </div>
                <button class="delete-btn" style="color:red; background:none; border:none; font-size:1.1rem;">&times;</button>
            `;
            el.querySelector('.delete-btn').addEventListener('click', () => this.removeAsset(index));
            container.appendChild(el);

            // Bar Chart Segment
            if (total > 0) {
                const width = (asset.wert / total) * 100;
                const bar = document.createElement('div');
                bar.className = 'bar-segment';
                bar.style.width = `${width}%`;
                bar.style.backgroundColor = COLORS[index % COLORS.length];
                bar.title = `${asset.art}: ${Math.round(width)}%`;
                barContainer.appendChild(bar);
            }
        });
    }

    checkAssetStatus() {
        this.dom.buttons.nextVermoegen.disabled = this.state.assets.length < 1;
    }

    getTotalAssets() {
        return this.state.assets.reduce((sum, a) => sum + a.wert, 0);
    }

    // --- Logic: Calculation ---

    calculateResults() {
        const total = this.getTotalAssets();
        const calculator = new InheritanceCalculator(this.state.family, total);
        const shares = calculator.calculate();
        
        this.renderResults(shares, total);
        this.saveHistory(shares, total); // Save to history
    }

    renderResults(shares, total) {
        const container = this.dom.lists.results;
        let html = `
            <div class="total-sum">
                <small style="display:block; font-size:1rem; color:#7f8c8d; font-weight:400">Nachlasswert Total</small>
                ${this.formatCurrency(total)}
            </div>
            <div class="share-list">
                <h4 style="margin-bottom:15px; border-bottom: 2px solid #eee; padding-bottom:5px;">Zuteilung pro Person</h4>
        `;

        if (shares.size === 0) {
            html += `<p style="color:red">Keine Erben ermittelt.</p>`;
        } else {
            // Match shares back to person details for display
            shares.forEach((amount, name) => {
                // Find person info for subtitle
                const person = this.state.family.find(p => p.name === name) || { beziehung: 'Erbe' };
                
                html += `
                    <div class="share-item">
                        <div>
                            <span style="font-weight:600">${this.escapeHtml(name)}</span>
                            <br><span style="font-size:0.85rem; color:#7f8c8d">${person.beziehung}</span>
                        </div>
                        <div class="share-value">${this.formatCurrency(amount)}</div>
                    </div>
                `;
            });
        }

        // Check for undistributed amount
        const distributed = Array.from(shares.values()).reduce((a, b) => a + b, 0);
        const remaining = Math.max(0, total - distributed);
        
        if (remaining > 0.01) { // Float tolerance
            html += `<div style="margin-top:10px; color:#7f8c8d; font-style:italic;">
                Nicht verteilt (z.B. an Staat oder fehlende Erben): ${this.formatCurrency(remaining)}
            </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    }

    // --- Logic: History ---

    saveHistory(shares, total) {
        const entry = {
            id: Date.now(),
            date: new Date().toLocaleString('de-CH'),
            total: total,
            shares: Array.from(shares.entries()), // Convert Map to Array for JSON
            familyCount: this.state.family.length
        };

        this.state.history.unshift(entry); // Add to top
        if (this.state.history.length > 5) this.state.history.pop(); // Keep last 5

        this.persistHistory();
        this.renderHistory();
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('erbo-history');
            if (saved) {
                this.state.history = JSON.parse(saved);
                this.renderHistory();
            }
        } catch (e) {
            console.error('Failed to load history', e);
        }
    }

    persistHistory() {
        localStorage.setItem('erbo-history', JSON.stringify(this.state.history));
    }

    clearHistory() {
        this.state.history = [];
        localStorage.removeItem('erbo-history');
        this.renderHistory();
    }

    renderHistory() {
        const container = this.dom.lists.history;
        const section = this.dom.historySection;
        
        if (!container || !section) return;

        if (this.state.history.length === 0) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';
        container.innerHTML = '';

        this.state.history.forEach(entry => {
            const el = document.createElement('div');
            el.className = 'liste-item';
            el.style.flexDirection = 'column';
            el.style.alignItems = 'flex-start';
            el.style.gap = '5px';
            
            // Format shares summary
            const sharesSummary = entry.shares.map(([name, amount]) => 
                `${name}: ${this.formatCurrency(amount)}`
            ).join(', ');

            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <strong style="font-size:0.9rem;">${entry.date}</strong>
                    <span style="color:var(--primary); font-weight:600;">${this.formatCurrency(entry.total)}</span>
                </div>
                <div style="font-size:0.8rem; color:#7f8c8d; line-height:1.4;">
                    ${sharesSummary}
                </div>
            `;
            container.appendChild(el);
        });
    }

    // --- Helpers ---

    nextStep(currentId, nextId) {
        const nextSection = this.dom.sections[nextId];
        nextSection.classList.remove('locked');
        nextSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update indicators
        this.dom.steps.forEach(step => {
            step.classList.remove('active');
            if (step.dataset.step === nextId) step.classList.add('active');
        });

        // Mark current button as done
        const btn = document.getElementById(`complete-${currentId}`);
        if (btn) btn.innerHTML = 'Erledigt ✓';
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    render() {
        this.renderFamilyList();
        this.renderAssetList();
    }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ErboApp();
});