// State Management
let familienMitglieder = [];
let vermoegenswerte = [];
let teilungGewaehlt = false;

// Test helper functions to set state
function resetVermoegenswerte(newArray = []) {
    vermoegenswerte = newArray;
}

function resetFamilienMitglieder(newArray = []) {
    familienMitglieder = newArray;
}


// Helper to format currency
const formatCHF = (value) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
};

// Only initialize DOM-dependent code in browser environment
if (typeof module === 'undefined' || !module.exports) {
    initializeApp();
}

function initializeApp() {
// Elements
const sections = {
    familie: document.getElementById('familie'),
    vermoegen: document.getElementById('vermoegen'),
    berechnung: document.getElementById('berechnung'),
    ergebnis: document.getElementById('ergebnis')
};

// Helper to format currency
const formatCHF = (value) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
};

// Helper to update step indicator
const updateStepIndicator = (activeStepName) => {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        if (step.dataset.step === activeStepName) {
            step.classList.add('active');
        }
    });
};

// Helper to unlock next section
function unlockNextSection(currentId, nextId) {
    // Remove lock from next section
    sections[nextId].classList.remove('locked');
    
    // Scroll nicely
    sections[nextId].scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateStepIndicator(nextId);
}

// ========== 1. FAMILIE ==========
const nameInput = document.getElementById('name-input');
const beziehungSelect = document.getElementById('beziehung-select'); // Changed to Select
const familienListe = document.getElementById('familien-liste');
const completeFamilie = document.getElementById('complete-familie');

document.querySelector('#familie .add-button').addEventListener('click', () => {
    const name = nameInput.value.trim();
    const beziehung = beziehungSelect.value; // Get value from dropdown
    
    if (!name) {
        alert("Bitte geben Sie einen Namen ein.");
        return;
    }
    if (!beziehung) {
        alert("Bitte wählen Sie eine Beziehung aus.");
        return;
    }
    
    familienMitglieder.push({ name, beziehung });
    renderFamilienListe();
    
    // Reset Inputs
    nameInput.value = '';
    beziehungSelect.selectedIndex = 0;
    nameInput.focus();

    checkFamilieStatus();
});

function renderFamilienListe() {
    familienListe.innerHTML = '';
    if (familienMitglieder.length === 0) {
        familienListe.classList.add('empty-state');
        familienListe.innerHTML = '<span class="placeholder-text">Noch keine Personen hinzugefügt</span>';
        return;
    }
    
    familienListe.classList.remove('empty-state');
    familienMitglieder.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'liste-item';
        item.innerHTML = `
            <div>
                <strong>${person.name}</strong>
                <br><small style="color:#7f8c8d">${person.beziehung}</small>
            </div>
            <button onclick="removeFamilie(${index})" style="color:red; background:none;">&times;</button>
        `;
        familienListe.appendChild(item);
    });
}

function removeFamilie(index) {
    familienMitglieder.splice(index, 1);
    renderFamilienListe();
    checkFamilieStatus();
}

function checkFamilieStatus() {
    // Require at least 1 person to proceed
    if (typeof document !== 'undefined') {
        const completeFamilie = document.getElementById('complete-familie');
        if (completeFamilie) completeFamilie.disabled = familienMitglieder.length < 1;
    }
}

completeFamilie.addEventListener('click', () => {
    unlockNextSection('familie', 'vermoegen');
    completeFamilie.innerHTML = 'Erledigt ✓';
});


// ========== 2. VERMÖGEN ==========
const vermoegenArt = document.getElementById('vermoegen-art');
const vermoegenWert = document.getElementById('vermoegen-wert');
const vermoegenListe = document.getElementById('vermoegen-liste');
const completeVermoegen = document.getElementById('complete-vermoegen');
const assetBarContainer = document.getElementById('asset-bar-container');

document.querySelector('#vermoegen .add-button').addEventListener('click', () => {
    const art = vermoegenArt.value.trim();
    const wert = parseFloat(vermoegenWert.value);
    
    if (art && !isNaN(wert) && wert > 0) {
        vermoegenswerte.push({ art, wert });
        renderVermoegenListe();
        
        vermoegenArt.value = '';
        vermoegenWert.value = '';
        vermoegenArt.focus();
        
        checkVermoegenStatus();
    } else {
        alert("Bitte geben Sie eine Bezeichnung und einen positiven Wert ein.");
    }
});

function renderVermoegenListe() {
    vermoegenListe.innerHTML = '';
    assetBarContainer.innerHTML = ''; // Clear bar chart

    if (vermoegenswerte.length === 0) {
        vermoegenListe.classList.add('empty-state');
        vermoegenListe.innerHTML = '<span class="placeholder-text">Keine Werte erfasst</span>';
        return;
    }

    vermoegenListe.classList.remove('empty-state');
    
    const total = vermoegenswerte.reduce((sum, v) => sum + v.wert, 0);
    const colors = ['#2c3e50', '#e67e22', '#27ae60', '#8e44ad', '#2980b9'];

    vermoegenswerte.forEach((v, index) => {
        // List Item
        const item = document.createElement('div');
        item.className = 'liste-item';
        item.innerHTML = `<span>${v.art}</span><strong>${formatCHF(v.wert)}</strong>`;
        vermoegenListe.appendChild(item);

        // Simple Visual Bar Segment
        if (total > 0) {
            const width = (v.wert / total) * 100;
            const bar = document.createElement('div');
            bar.className = 'bar-segment';
            bar.style.width = `${width}%`;
            bar.style.backgroundColor = colors[index % colors.length];
            bar.title = `${v.art}: ${Math.round(width)}%`;
            assetBarContainer.appendChild(bar);
        }
    });
}

function checkVermoegenStatus() {
    if (typeof document !== 'undefined') {
        const completeVermoegen = document.getElementById('complete-vermoegen');
        if (completeVermoegen) completeVermoegen.disabled = vermoegenswerte.length < 1;
    }
}

completeVermoegen.addEventListener('click', () => {
    unlockNextSection('vermoegen', 'berechnung');
    completeVermoegen.innerHTML = 'Erledigt ✓';
});


// ========== 3. BERECHNUNG ==========
const completeBerechnung = document.getElementById('complete-berechnung');
const radioButtons = document.querySelectorAll('input[name="teilung"]');

radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
        teilungGewaehlt = true;
        completeBerechnung.disabled = false;
    });
});

completeBerechnung.addEventListener('click', () => {
    generateErgebnis();
    unlockNextSection('berechnung', 'ergebnis');
});

} // End of initializeApp()

// Helper functions that need to be accessible from both browser and test environments
function renderFamilienListe() {
    if (typeof document === 'undefined') return;
    const familienListe = document.getElementById('familien-liste');
    if (!familienListe) return;
    
    familienListe.innerHTML = '';
    if (familienMitglieder.length === 0) {
        familienListe.classList.add('empty-state');
        familienListe.innerHTML = '<span class="placeholder-text">Noch keine Personen hinzugefügt</span>';
        return;
    }
    
    familienListe.classList.remove('empty-state');
    familienMitglieder.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'liste-item';
        item.innerHTML = `
            <div>
                <strong>${person.name}</strong>
                <br><small style="color:#7f8c8d">${person.beziehung}</small>
            </div>
            <button onclick="removeFamilie(${index})" style="color:red; background:none;">&times;</button>
        `;
        familienListe.appendChild(item);
    });
}

function removeFamilie(index) {
    familienMitglieder.splice(index, 1);
    renderFamilienListe();
    checkFamilieStatus();
}

function checkFamilieStatus() {
    // Require at least 1 person to proceed
    if (typeof document !== 'undefined') {
        const completeFamilie = document.getElementById('complete-familie');
        if (completeFamilie) completeFamilie.disabled = familienMitglieder.length < 1;
    }
}

function checkVermoegenStatus() {
    if (typeof document !== 'undefined') {
        const completeVermoegen = document.getElementById('complete-vermoegen');
        if (completeVermoegen) completeVermoegen.disabled = vermoegenswerte.length < 1;
    }
}

// ========== 4. ERGEBNIS ==========
// ...existing code...
function generateErgebnis() {
    const ergebnisContent = document.getElementById('ergebnis-content');
    const gesamtVermoegen = vermoegenswerte.reduce((sum, v) => sum + v.wert, 0);

    // Hilfsfunktionen zur Erkennung
    const isSpouse = (s) => /ehe|gatte|gattin|partner|eingetragen/i.test(s);
    const isChild = (s) => /(^|\s)kind|kinder|sohn|tochter/i.test(s);
    const isGrandchild = (s) => /enkel|enkelin/i.test(s);
    const parseGrandchildParent = (rel) => {
        // erkennt "Enkel von NAME" oder "Enkel (NAME)"
        const m1 = rel.match(/enkel(?:in)?\s*(?:von\s*)?(.+)$/i);
        if (m1 && m1[1]) return m1[1].trim();
        const m2 = rel.match(/enkel(?:in)?\s*\(([^)]+)\)/i);
        if (m2 && m2[1]) return m2[1].trim();
        return null;
    };
    const isParent = (s) => /eltern|mutter|vater|oma|opa|grosseltern|grossmutter|grossvater/i.test(s);
    const isSibling = (s) => /geschwister|bruder|schwester|halbbruder|halbschwester/i.test(s);
    const isGrandparent = (s) => /grosseltern|grossmutter|grossvater|oma|opa/i.test(s);

    // Index der Personen nach Name (falls mehrfach gleiche Namen, Verhalten vereinfacht)
    const personsByName = new Map();
    familienMitglieder.forEach(p => personsByName.set(p.name, p));

    // Gruppen
    const spouses = familienMitglieder.filter(p => isSpouse(p.beziehung));
    const children = familienMitglieder.filter(p => isChild(p.beziehung));
    const grandchildren = familienMitglieder.filter(p => isGrandchild(p.beziehung));
    const parents = familienMitglieder.filter(p => /mutter|vater|eltern/i.test(p.beziehung));
    const siblings = familienMitglieder.filter(p => isSibling(p.beziehung));
    const grandparents = familienMitglieder.filter(p => isGrandparent(p.beziehung));
    const others = familienMitglieder.filter(p => !spouses.includes(p) && !children.includes(p) && !parents.includes(p) && !siblings.includes(p) && !grandchildren.includes(p) && !grandparents.includes(p));

    // Aufbau der Kinder‑Äste (für per-stirpes): ermitteln Originalkinder-Namen
    const originalChildNames = new Set();
    children.forEach(c => originalChildNames.add(c.name));
    // füge ev. verstorbene Kinder hinzu, wenn Enkel auf sie verweisen: "Enkel von X"
    const grandchildParentMap = new Map(); // parentName -> [grandchildPersons]
    grandchildren.forEach(g => {
        const parentName = parseGrandchildParent(g.beziehung);
        if (parentName) {
            originalChildNames.add(parentName);
            if (!grandchildParentMap.has(parentName)) grandchildParentMap.set(parentName, []);
            grandchildParentMap.get(parentName).push(g);
        } else {
            // wenn kein Parent-Namen angegeben, sammeln wir unter "__orphanGrandchildren"
            if (!grandchildParentMap.has('__orphan')) grandchildParentMap.set('__orphan', []);
            grandchildParentMap.get('__orphan').push(g);
        }
    });

    // shares map
    const shares = new Map();
    const addShare = (personName, amount) => {
        if (!personName) return;
        const prev = shares.get(personName) || 0;
        shares.set(personName, prev + amount);
    };

    // Hilf: Summiere vorhandene Shares
    const sumShares = () => Array.from(shares.values()).reduce((s, v) => s + v, 0);

    // 1) Nachkommen-Fall (mit per-stirpes)
    const distributeDescendants = (totalForDescendants) => {
        // Branches = alle Originalkinder (auch wenn aktuell nicht als Personen gelistet)
        const branchNames = Array.from(originalChildNames);
        if (branchNames.length === 0) {
            // Falls keine expliziten Kinder, aber Enkel ohne Parent-Angabe, behandle Enkel als gleichmässige Erben
            const orphans = grandchildParentMap.get('__orphan') || [];
            const per = orphans.length > 0 ? totalForDescendants / orphans.length : 0;
            orphans.forEach(g => addShare(g.name, per));
            return;
        }
        const perBranch = totalForDescendants / branchNames.length;
        branchNames.forEach(bn => {
            const childPerson = personsByName.get(bn);
            if (childPerson && isChild(childPerson.beziehung)) {
                // lebender Sohn/Tochter
                addShare(childPerson.name, perBranch);
            } else {
                // toter/im System nicht als Kind eingetragener Elternteil -> seine Nachkommen (Enkel) teilen branch
                const subs = grandchildParentMap.get(bn) || [];
                if (subs.length > 0) {
                    const perSub = perBranch / subs.length;
                    subs.forEach(s => addShare(s.name, perSub));
                } else {
                    // keine bekannten Nachkommen -> diese Branch bleibt ungeteilt (verbleibt im Estate)
                    // Optional: verteile anteilig unter "others" oder lasse 0.
                }
            }
        });
    };

    // 2) Eltern/Geschwister-Fall (Elterlicher Stamm)
    const distributeParentalStamm = (parentsShareTotal) => {
        // Wenn Eltern (lebend) vorhanden -> verteilen
        if (parents.length > 0) {
            // prüfe ob beide Eltern gelistet (vereinfachend)
            if (parents.length >= 2) {
                const per = parentsShareTotal / parents.length;
                parents.forEach(p => addShare(p.name, per));
            } else {
                // nur ein Elternteil gelistet
                const livingParent = parents[0];
                // falls Geschwister vorhanden, verteile die nichtexistente Elternhälfte auf Geschwister
                // Annahme: ursprüngliche Eltern-Anteile = 2 Hälften -> die andere Hälfte geht an die Nachkommen (Geschwister)
                const half = parentsShareTotal / 2;
                addShare(livingParent.name, half);
                if (siblings.length > 0) {
                    const perSib = half / siblings.length;
                    siblings.forEach(s => addShare(s.name, perSib));
                } else {
                    // keine Geschwister -> Lebenserbe erhält ganze Eltern-Summe (vereinfachend)
                    addShare(livingParent.name, half); // add remaining half
                }
            }
        } else if (siblings.length > 0) {
            // keine Eltern mehr, Geschwister teilen alles aus elterlichem Stamm
            const per = parentsShareTotal / siblings.length;
            siblings.forEach(s => addShare(s.name, per));
        } else if (grandparents.length > 0) {
            // keine Eltern/Geschwister: Grosseltern teilen (vereinfachte Annahme: gleichmässig)
            const per = parentsShareTotal / grandparents.length;
            grandparents.forEach(gp => addShare(gp.name, per));
        } else {
            // nichts bekannt: lasse unverteilt (oder fallback)
        }
    };

    // Hauptlogik nach Priorität (vereinfachte Regeln gemäss Bilder)
    if (spouses.length > 0 && originalChildNames.size > 0) {
        // Ehegatte + Nachkommen: Ehegatte 1/2, Nachkommen 1/2 (per stirpes)
        const spouseShare = gesamtVermoegen * 0.5;
        addShare(spouses[0].name, spouseShare);
        distributeDescendants(gesamtVermoegen - spouseShare);
    } else if (originalChildNames.size > 0) {
        // Nur Nachkommen (per stirpes) teilen die ganze Erbschaft
        distributeDescendants(gesamtVermoegen);
    } else if (spouses.length > 0 && (parents.length > 0 || siblings.length > 0)) {
        // Ehegatte + elterlicher Stamm: vereinfachte Regel aus Bildern: Ehegatte 3/4, Eltern/Geschwister 1/4
        const spouseShare = gesamtVermoegen * 0.75;
        const parentsTotal = gesamtVermoegen - spouseShare; // 1/4
        addShare(spouses[0].name, spouseShare);
        distributeParentalStamm(parentsTotal);
    } else if (spouses.length > 0 && grandparents.length > 0) {
        // laut Bild Ziff.3: wenn keine Erben des elterlichen Stammes vorhanden sind, Ehegatte erbt alles
        // sichere Regel: Ehegatte erhält alles
        addShare(spouses[0].name, gesamtVermoegen);
    } else if (spouses.length > 0) {
        // Nur Ehegatte
        addShare(spouses[0].name, gesamtVermoegen);
    } else if ((parents.length > 0) || (siblings.length > 0)) {
        // Keine Ehegatten/keine Nachkommen: Elterlicher Stamm erbt
        // gesamte Estate in elterlichen Stamm
        distributeParentalStamm(gesamtVermoegen);
    } else if (grandparents.length > 0) {
        // Kein elterlicher Stamm vorhanden, Grosseltern erben (gleichmässig)
        const per = gesamtVermoegen / grandparents.length;
        grandparents.forEach(gp => addShare(gp.name, per));
    } else if (familienMitglieder.length > 0) {
        // Fallback: Gleichmässig unter allen gelisteten Personen
        const per = gesamtVermoegen / familienMitglieder.length;
        familienMitglieder.forEach(p => addShare(p.name, per));
    }

    // Ausgabe
    let html = `
        <div class="total-sum">
            <small style="display:block; font-size:1rem; color:#7f8c8d; font-weight:400">Nachlasswert Total</small>
            ${formatCHF(gesamtVermoegen)}
        </div>
        <div class="share-list">
            <h4 style="margin-bottom:15px; border-bottom: 2px solid #eee; padding-bottom:5px;">Zuteilung pro Person</h4>
    `;

    if (familienMitglieder.length === 0) {
        html += `<p style="color:red">Keine Erben definiert.</p>`;
    } else {
        familienMitglieder.forEach(person => {
            const amount = shares.get(person.name) || 0;
            html += `
                <div class="share-item">
                    <div>
                        <span style="font-weight:600">${person.name}</span>
                        <br><span style="font-size:0.85rem; color:#7f8c8d">${person.beziehung}</span>
                    </div>
                    <div class="share-value">${formatCHF(amount)}</div>
                </div>
            `;
        });
    }

    // Optional: zeige verbleibenden / nicht verteilte Summe (z.B. Branch ohne Erben)
    const distributed = sumShares();
    const remaining = Math.max(0, gesamtVermoegen - distributed);
    if (remaining > 0) {
        html += `<div style="margin-top:10px; color:#7f8c8d">Nicht verteilt (z.B. fehlende Ersatz-Erben): ${formatCHF(remaining)}</div>`;
    }

    html += `</div>`;
    ergebnisContent.innerHTML = html;
}

// ...existing code...
function renderVermoegenListe() {
    // Skip DOM updates if elements don't exist (e.g., in test environment)
    if (typeof document === 'undefined') return;
    
    const vermoegenListe = document.getElementById('vermoegen-liste');
    const assetBarContainer = document.getElementById('asset-bar-container');
    
    if (!vermoegenListe || !assetBarContainer) return;
    
    vermoegenListe.innerHTML = '';
    assetBarContainer.innerHTML = ''; // Clear bar chart

    if (vermoegenswerte.length === 0) {
        vermoegenListe.classList.add('empty-state');
        vermoegenListe.innerHTML = '<span class="placeholder-text">Keine Werte erfasst</span>';
        assetBarContainer.innerHTML = '';
        // show zero total
        const totalNode = document.createElement('div');
        totalNode.className = 'asset-total';
        totalNode.innerHTML = `<strong>Gesamt: ${formatCHF(0)}</strong>`;
        vermoegenListe.appendChild(totalNode);
        return;
    }

    vermoegenListe.classList.remove('empty-state');
    
    const total = vermoegenswerte.reduce((sum, v) => sum + v.wert, 0);
    const colors = ['#2c3e50', '#e67e22', '#27ae60', '#8e44ad', '#2980b9'];

    // show total on top
    const totalHeader = document.createElement('div');
    totalHeader.className = 'asset-total';
    totalHeader.style.marginBottom = '8px';
    totalHeader.innerHTML = `<strong>Gesamt: ${formatCHF(total)}</strong>`;
    vermoegenListe.appendChild(totalHeader);

    vermoegenswerte.forEach((v, index) => {
        // List Item
        const item = document.createElement('div');
        item.className = 'liste-item';
        item.innerHTML = `
            <div style="flex:1;">
                <span>${v.art}</span>
                <br><small style="color:#7f8c8d">${formatCHF(v.wert)}</small>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button data-index="${index}" class="asset-delete" title="Löschen" style="color:red; background:none; border:none; font-size:1.1rem;">&times;</button>
            </div>
        `;
        vermoegenListe.appendChild(item);

        // attach delete handler
        item.querySelector('.asset-delete').addEventListener('click', (e) => {
            const i = parseInt(e.currentTarget.getAttribute('data-index'), 10);
            removeAsset(i);
        });

        // Simple Visual Bar Segment
        if (total > 0) {
            const width = (v.wert / total) * 100;
            const bar = document.createElement('div');
            bar.className = 'bar-segment';
            bar.style.width = `${width}%`;
            bar.style.backgroundColor = colors[index % colors.length];
            bar.title = `${v.art}: ${Math.round(width)}%`;
            assetBarContainer.appendChild(bar);
        }
    });
}

function removeAsset(index) {
    if (index < 0 || index >= vermoegenswerte.length) return;
    vermoegenswerte.splice(index, 1);
    renderVermoegenListe();
    checkVermoegenStatus();
}

/**
 * Entfernt alle Vermögenswerte mit passendem Typennamen (case-insensitive).
 * Wenn all === false, entfernt nur das erste gefundene; wenn true, entfernt alle.
 */
function deleteAssetByType(type, all = false) {
    if (!type) return;
    const needle = type.trim().toLowerCase();
    if (all) {
        vermoegenswerte = vermoegenswerte.filter(v => v.art.trim().toLowerCase() !== needle);
    } else {
        const idx = vermoegenswerte.findIndex(v => v.art.trim().toLowerCase() === needle);
        if (idx !== -1) vermoegenswerte.splice(idx, 1);
    }
    renderVermoegenListe();
    checkVermoegenStatus();
}

// ...existing code...

// Adjusted grandparent detection to accept "groß..." spellings as well
// (replace earlier helper definitions if needed)
const isGrandparent = (s) => /grosseltern|grossmutter|grossvater|oma|opa|großeltern|großmutter|großvater/i.test(s);
const isParent = (s) => /eltern|mutter|vater|oma|opa|grosseltern|grossmutter|grossvater|großeltern|großmutter|großvater/i.test(s);
// ...existing code...

// Export functions for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCHF,
        deleteAssetByType,
        removeAsset,
        resetVermoegenswerte,
        resetFamilienMitglieder,
        getVermoegenswerte: () => vermoegenswerte,
        getFamilienMitglieder: () => familienMitglieder
    };
}