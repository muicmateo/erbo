// ========== DATA ==========
let familienMitglieder = [];
let vermoegenswerte = [];

// ========== HELPER ==========
function formatCHF(value) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
}

// ========== STEP NAVIGATION ==========
function unlockStep(stepId) {
    const section = document.getElementById(stepId);
    const indicator = document.querySelector(`.step[data-step="${stepId}"]`);
    
    section.classList.remove('locked');
    const overlay = section.querySelector('.blur-overlay');
    if (overlay) overlay.remove();
    
    if (indicator) indicator.classList.add('active');
}

// ========== 1. FAMILIE ==========
const nameInput = document.getElementById('name-input');
const beziehungSelect = document.getElementById('beziehung-select');
const familienListe = document.getElementById('familien-liste');
const addFamilyBtn = document.querySelector('#familie .add-button');
const completeFamilieBtn = document.getElementById('complete-familie');

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
            <div style="flex:1;">
                <span>${person.name}</span>
                <br><small style="color:#7f8c8d">${person.beziehung}</small>
            </div>
            <button data-index="${index}" class="delete-btn" style="color:red; background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
        `;
        familienListe.appendChild(item);
        
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
            familienMitglieder.splice(idx, 1);
            renderFamilienListe();
            checkFamilieStatus();
        });
    });
}

function checkFamilieStatus() {
    completeFamilieBtn.disabled = familienMitglieder.length === 0;
}

addFamilyBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const beziehung = beziehungSelect.value;
    
    if (!name || !beziehung) {
        alert('Bitte Name und Beziehung angeben.');
        return;
    }
    
    familienMitglieder.push({ name, beziehung });
    renderFamilienListe();
    checkFamilieStatus();
    
    nameInput.value = '';
    beziehungSelect.value = '';
});

completeFamilieBtn.addEventListener('click', () => {
    unlockStep('vermoegen');
    document.getElementById('familie').classList.remove('active');
    document.getElementById('vermoegen').classList.add('active');
});

// ========== 2. VERMÖGEN ==========
const vermoegenArtInput = document.getElementById('vermoegen-art');
const vermoegenWertInput = document.getElementById('vermoegen-wert');
const vermoegenListe = document.getElementById('vermoegen-liste');
const assetBarContainer = document.getElementById('asset-bar-container');
const addVermoegenBtn = document.querySelector('#vermoegen .add-button');
const completeVermoegenBtn = document.getElementById('complete-vermoegen');

function renderVermoegenListe() {
    vermoegenListe.innerHTML = '';
    assetBarContainer.innerHTML = '';

    if (vermoegenswerte.length === 0) {
        vermoegenListe.classList.add('empty-state');
        vermoegenListe.innerHTML = '<span class="placeholder-text">Keine Werte erfasst</span>';
        const totalNode = document.createElement('div');
        totalNode.className = 'asset-total';
        totalNode.innerHTML = `<strong>Gesamt: ${formatCHF(0)}</strong>`;
        vermoegenListe.appendChild(totalNode);
        return;
    }

    vermoegenListe.classList.remove('empty-state');
    
    const total = vermoegenswerte.reduce((sum, v) => sum + v.wert, 0);
    const colors = ['#2c3e50', '#e67e22', '#27ae60', '#8e44ad', '#2980b9'];

    const totalHeader = document.createElement('div');
    totalHeader.className = 'asset-total';
    totalHeader.style.marginBottom = '8px';
    totalHeader.innerHTML = `<strong>Gesamt: ${formatCHF(total)}</strong>`;
    vermoegenListe.appendChild(totalHeader);

    vermoegenswerte.forEach((v, index) => {
        const item = document.createElement('div');
        item.className = 'liste-item';
        item.innerHTML = `
            <div style="flex:1;">
                <span>${v.art}</span>
                <br><small style="color:#7f8c8d">${formatCHF(v.wert)}</small>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <button data-index="${index}" class="asset-delete" title="Löschen" style="color:red; background:none; border:none; font-size:1.1rem; cursor:pointer;">&times;</button>
            </div>
        `;
        vermoegenListe.appendChild(item);

        item.querySelector('.asset-delete').addEventListener('click', (e) => {
            const i = parseInt(e.currentTarget.getAttribute('data-index'), 10);
            removeAsset(i);
        });

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

function checkVermoegenStatus() {
    completeVermoegenBtn.disabled = vermoegenswerte.length === 0;
}

addVermoegenBtn.addEventListener('click', () => {
    const art = vermoegenArtInput.value.trim();
    const wert = parseFloat(vermoegenWertInput.value);
    
    if (!art || isNaN(wert)) {
        alert('Bitte Bezeichnung und Wert angeben.');
        return;
    }
    
    vermoegenswerte.push({ art, wert });
    renderVermoegenListe();
    checkVermoegenStatus();
    
    vermoegenArtInput.value = '';
    vermoegenWertInput.value = '';
});

completeVermoegenBtn.addEventListener('click', () => {
    unlockStep('ergebnis');
    document.getElementById('vermoegen').classList.remove('active');
    document.getElementById('ergebnis').classList.add('active');
    generateErgebnis();
});

// ========== 3. ERGEBNIS (Gesetzliche Erbfolge nach ZGB) ==========
function generateErgebnis() {
    const ergebnisContent = document.getElementById('ergebnis-content');
    const gesamtVermoegen = vermoegenswerte.reduce((sum, v) => sum + v.wert, 0);

    const fmt = (v) => formatCHF(v);
    
    // Helpers für exakte Dropdown-Werte
    const isSpouse = (s) => /^ehepartner/i.test(s);
    const isChild = (s) => /^kind/i.test(s);
    const isGrandchild = (s) => /^enkel/i.test(s);
    const isParent = (s) => /^elternteil/i.test(s);
    const isSibling = (s) => /^geschwister/i.test(s);
    const isGrandparent = (s) => /^grosseltern/i.test(s);
    const isUncleAunt = (s) => /^onkel\s*\/\s*tante/i.test(s);
    const isCousin = (s) => /^cousin/i.test(s);

    // Gruppierung
    const spouses = familienMitglieder.filter(p => isSpouse(p.beziehung));
    const children = familienMitglieder.filter(p => isChild(p.beziehung));
    const grandchildren = familienMitglieder.filter(p => isGrandchild(p.beziehung));
    const parents = familienMitglieder.filter(p => isParent(p.beziehung));
    const siblings = familienMitglieder.filter(p => isSibling(p.beziehung));
    const grandparents = familienMitglieder.filter(p => isGrandparent(p.beziehung));
    const unclesAunts = familienMitglieder.filter(p => isUncleAunt(p.beziehung));
    const cousins = familienMitglieder.filter(p => isCousin(p.beziehung));

    const shares = new Map();
    const addShare = (personName, amount) => {
        if (!personName || amount === 0) return;
        shares.set(personName, (shares.get(personName) || 0) + amount);
    };

    // ========== ERBRECHTSLOGIK gemäss ZGB ==========

    // 1. Parentel: Nachkommen (Art. 457 ZGB)
    if (children.length > 0) {
        if (spouses.length > 0) {
            // Ehepartner + Nachkommen (Art. 462 Ziff. 1)
            const spouseShare = gesamtVermoegen * 0.5;
            const childrenShare = gesamtVermoegen * 0.5;
            addShare(spouses[0].name, spouseShare);
            const perChild = childrenShare / children.length;
            children.forEach(c => addShare(c.name, perChild));
        } else {
            // Nur Nachkommen (Art. 457 Abs. 2)
            const perChild = gesamtVermoegen / children.length;
            children.forEach(c => addShare(c.name, perChild));
        }
    }
    // Enkel (per stirpes vereinfacht - Art. 457 Abs. 3)
    else if (grandchildren.length > 0) {
        if (spouses.length > 0) {
            const spouseShare = gesamtVermoegen * 0.5;
            const grandchildrenShare = gesamtVermoegen * 0.5;
            addShare(spouses[0].name, spouseShare);
            const perGrandchild = grandchildrenShare / grandchildren.length;
            grandchildren.forEach(gc => addShare(gc.name, perGrandchild));
        } else {
            const perGrandchild = gesamtVermoegen / grandchildren.length;
            grandchildren.forEach(gc => addShare(gc.name, perGrandchild));
        }
    }
    // 2. Parentel: Elterlicher Stamm (Art. 458 ZGB)
    else if (parents.length > 0) {
        if (spouses.length > 0) {
            // Ehepartner + Eltern (Art. 462 Ziff. 2)
            const spouseShare = gesamtVermoegen * 0.75;
            const parentsShare = gesamtVermoegen * 0.25;
            addShare(spouses[0].name, spouseShare);
            
            if (parents.length === 2) {
                // Beide Eltern leben (Art. 458 Abs. 2)
                const perParent = parentsShare / 2;
                parents.forEach(p => addShare(p.name, perParent));
            } else if (parents.length === 1 && siblings.length > 0) {
                // Ein Elternteil + Geschwister (Art. 458 Abs. 3)
                const half = parentsShare / 2;
                addShare(parents[0].name, half);
                const perSibling = half / siblings.length;
                siblings.forEach(s => addShare(s.name, perSibling));
            } else {
                // Nur ein Elternteil
                addShare(parents[0].name, parentsShare);
            }
        } else {
            // Nur Eltern, kein Ehepartner
            if (parents.length === 2) {
                const perParent = gesamtVermoegen / 2;
                parents.forEach(p => addShare(p.name, perParent));
            } else if (parents.length === 1 && siblings.length > 0) {
                const half = gesamtVermoegen / 2;
                addShare(parents[0].name, half);
                const perSibling = half / siblings.length;
                siblings.forEach(s => addShare(s.name, perSibling));
            } else {
                addShare(parents[0].name, gesamtVermoegen);
            }
        }
    }
    // Nur Geschwister (Art. 458 Abs. 3)
    else if (siblings.length > 0) {
        if (spouses.length > 0) {
            const spouseShare = gesamtVermoegen * 0.75;
            const siblingsShare = gesamtVermoegen * 0.25;
            addShare(spouses[0].name, spouseShare);
            const perSibling = siblingsShare / siblings.length;
            siblings.forEach(s => addShare(s.name, perSibling));
        } else {
            const perSibling = gesamtVermoegen / siblings.length;
            siblings.forEach(s => addShare(s.name, perSibling));
        }
    }
    // 3. Parentel: Grosselterlicher Stamm (Art. 459 ZGB)
    else if (grandparents.length > 0 || unclesAunts.length > 0 || cousins.length > 0) {
        if (spouses.length > 0) {
            // Ehepartner + Grosseltern (Art. 462 Ziff. 3) - Ehepartner erbt alles
            addShare(spouses[0].name, gesamtVermoegen);
        } else {
            // Nur Grosselterlicher Stamm
            // Vereinfachte Verteilung: alle Personen der 3. Parentel teilen gleichmässig
            const thirdParentel = [...grandparents, ...unclesAunts, ...cousins];
            if (thirdParentel.length > 0) {
                const perPerson = gesamtVermoegen / thirdParentel.length;
                thirdParentel.forEach(p => addShare(p.name, perPerson));
            }
        }
    }
    // Nur Ehepartner
    else if (spouses.length > 0) {
        addShare(spouses[0].name, gesamtVermoegen);
    }
    // Fallback
    else if (familienMitglieder.length > 0) {
        const per = gesamtVermoegen / familienMitglieder.length;
        familienMitglieder.forEach(p => addShare(p.name, per));
    }

    // ========== HTML OUTPUT ==========
    let html = `
        <div class="total-sum">
            <small style="display:block; font-size:1rem; color:#7f8c8d; font-weight:400">Nachlasswert Total</small>
            ${fmt(gesamtVermoegen)}
        </div>
        <div class="share-list">
            <h4 style="margin-bottom:15px; border-bottom: 2px solid #eee; padding-bottom:5px;">Zuteilung pro Person (Gesetzliche Erbfolge)</h4>
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
                    <div class="share-value">${fmt(amount)}</div>
                </div>
            `;
        });
    }

    const distributed = Array.from(shares.values()).reduce((a, b) => a + b, 0);
    const remaining = Math.max(0, Math.round((gesamtVermoegen - distributed) * 100) / 100);
    if (remaining > 0.01) {
        html += `<div style="margin-top:10px; color:#7f8c8d; font-size:0.9rem;">Nicht verteilt: ${fmt(remaining)}</div>`;
    }

    html += `</div>`;
    ergebnisContent.innerHTML = html;
}