// ========== DATA ==========
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

let currentScenario = 'tod'; 

// Set up scenario toggle listeners
document.getElementById('opt-tod').addEventListener('click', () => switchScenario('tod'));
document.getElementById('opt-scheidung').addEventListener('click', () => switchScenario('scheidung'));

// ========== SZENARIO LOGIK ==========
function switchScenario(szenario) {
    currentScenario = szenario;
    // Update radio button states
    document.querySelector('input[value="tod"]').checked = (szenario === 'tod');
    document.querySelector('input[value="scheidung"]').checked = (szenario === 'scheidung');
    // Update visual selection
    document.getElementById('opt-tod').classList.toggle('selected', szenario === 'tod');
    document.getElementById('opt-scheidung').classList.toggle('selected', szenario === 'scheidung');

    const sectionFamilie = document.getElementById('familie');
    const sectionInfo = document.getElementById('scheidung-info');

    if (szenario === 'scheidung') {
        sectionFamilie.style.display = 'none';
        sectionInfo.style.display = 'block';
        sectionInfo.classList.remove('hidden');
        sectionInfo.classList.add('active');
        document.getElementById('step-nav-1').innerText = "1. Modus";
        updateAssetInputsVisibility(true);
    } else {
        sectionFamilie.style.display = 'block';
        sectionInfo.style.display = 'none';
        sectionInfo.classList.remove('active');
        document.getElementById('step-nav-1').innerText = "1. Familie";
        // Check Spouse nur unter Lebenden
        const hasSpouse = familienMitglieder.some(p => p.beziehung === 'Ehepartner' && p.status === 'lebend');
        updateAssetInputsVisibility(hasSpouse);
    }
}
window.switchScenario = switchScenario;

function forceNextStep() {
    const scheidungInfo = document.getElementById('scheidung-info');
    scheidungInfo.classList.remove('active');
    scheidungInfo.style.display = 'none';
    unlockStep('vermoegen');
    document.getElementById('vermoegen').classList.add('active');
}
window.forceNextStep = forceNextStep;

function updateAssetInputsVisibility(needsDetails) {
    const detailsContainer = document.getElementById('asset-details-container');
    const subtitle = document.getElementById('asset-subtitle');
    if (needsDetails) {
        detailsContainer.style.display = 'block';
        subtitle.innerText = "Erfassen Sie Eigentümer und Art (für Güterrecht nötig).";
    } else {
        detailsContainer.style.display = 'none';
        subtitle.innerText = "Alles Vermögen gehört zum Nachlass.";
    }
}

function unlockStep(stepId) {
    const section = document.getElementById(stepId);
    const indicator = document.querySelector(`.step[data-step="${stepId}"]`);
    if (!section) {
        console.error('Could not find section:', stepId);
        return;
    }
    section.classList.remove('locked');
    const overlay = section.querySelector('.blur-overlay');
    if (overlay) overlay.remove();
    
    // Update step indicators
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    if (indicator) indicator.classList.add('active');
}

// ========== SCHRITT 1: FAMILIE ==========
const nameInput = document.getElementById('name-input');
const beziehungSelect = document.getElementById('beziehung-select');
const statusSelect = document.getElementById('status-select');
const stammGroup = document.getElementById('stamm-group');
const stammInput = document.getElementById('stamm-input');
const familienListe = document.getElementById('familien-liste');
const completeFamilieBtn = document.getElementById('complete-familie');
const noFamilyCheckbox = document.getElementById('no-family-checkbox');
const familyInputsDiv = document.getElementById('family-inputs');

// NEU: Logik für die Checkbox "Keine Verwandten"
noFamilyCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        // Alles leeren und sperren
        familienMitglieder = [];
        renderFamilienListe();
        familyInputsDiv.style.opacity = '0.5';
        familyInputsDiv.style.pointerEvents = 'none';
        completeFamilieBtn.disabled = false; // Weiter erlauben!
        
        // UI-Update für Vermögen (auf "Ledig" setzen)
        updateAssetInputsVisibility(false);
    } else {
        // Wieder entsperren
        familyInputsDiv.style.opacity = '1';
        familyInputsDiv.style.pointerEvents = 'auto';
        renderFamilienListe(); // Prüft ob Button disabled sein muss
    }
});

function toggleStammInput() {
    const val = beziehungSelect.value;
    const needsStamm = ['Enkel', 'Urenkel', 'NichteNeffe', 'Cousin'].includes(val);
    if (needsStamm) stammGroup.classList.remove('hidden');
    else stammGroup.classList.add('hidden');
}
window.toggleStammInput = toggleStammInput;

function renderFamilienListe() {
    familienListe.innerHTML = '';
    
    // Leerer Zustand
    if (familienMitglieder.length === 0) {
        // Spezialfall: Checkbox aktiviert?
        if (noFamilyCheckbox.checked) {
            familienListe.classList.remove('empty-state');
            familienListe.innerHTML = '<div style="padding:10px; color:#e67e22; font-weight:bold;">Der Staat erbt (Keine Verwandten).</div>';
            completeFamilieBtn.disabled = false;
        } else {
            familienListe.classList.add('empty-state');
            familienListe.innerHTML = '<span class="placeholder-text">Keine Personen</span>';
            completeFamilieBtn.disabled = true;
        }
        return;
    }

    familienListe.classList.remove('empty-state');
    completeFamilieBtn.disabled = false;

    const hasSpouse = familienMitglieder.some(p => p.beziehung === 'Ehepartner' && p.status === 'lebend');
    if(currentScenario === 'tod') updateAssetInputsVisibility(hasSpouse);

    familienMitglieder.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'liste-item';
        
        const statusIcon = person.status === 'verstorben' ? '⚰️' : '👤';
        const statusStyle = person.status === 'verstorben' ? 'color:#95a5a6; text-decoration:line-through;' : '';
        
        let info = `<span style="${statusStyle}"><b>${statusIcon} ${person.name}</b> <small>(${person.beziehung})</small></span>`;
        if (person.stamm && !['Kind', 'Geschwister', 'Elternteil'].includes(person.beziehung)) {
            info += `<br><small style="color:#7f8c8d; margin-left:25px;">↳ Kind von: ${person.stamm}</small>`;
        }

        item.innerHTML = `
            <div>${info}</div>
            <button onclick="removeFamily(${index})" style="color:red;border:none;background:none;cursor:pointer;">&times;</button>
        `;
        familienListe.appendChild(item);
    });
}

function removeFamily(index) {
    familienMitglieder.splice(index, 1);
    renderFamilienListe();
}
window.removeFamily = removeFamily;

document.querySelector('#familie .add-button').addEventListener('click', () => {
    const name = nameInput.value.trim();
    const beziehung = beziehungSelect.value;
    const status = statusSelect.value;
    let stamm = stammInput.value.trim();

    if (!name || !beziehung) return alert("Bitte Name und Beziehung angeben");
    
    if (beziehung === 'Ehepartner' && familienMitglieder.some(p => p.beziehung === 'Ehepartner')) {
        return alert("Es gibt nur einen Ehepartner.");
    }

    if (beziehung === 'Kind' || beziehung === 'Geschwister' || beziehung === 'Elternteil') {
        stamm = name; 
    } else {
        if (!stammGroup.classList.contains('hidden') && !stamm) {
            return alert("Bitte geben Sie an, wer der Elternteil ist.");
        }
    }

    familienMitglieder.push({ name, beziehung, status, stamm });
    renderFamilienListe();
    
    nameInput.value = '';
    stammInput.value = '';
    beziehungSelect.value = '';
    statusSelect.value = 'lebend'; 
    toggleStammInput();
});

completeFamilieBtn.addEventListener('click', () => {
    document.getElementById('familie').classList.remove('active');
    unlockStep('vermoegen');
    document.getElementById('vermoegen').classList.add('active');
});

// ========== SCHRITT 2: VERMÖGEN ==========
const vermoegenListe = document.getElementById('vermoegen-liste');
const addAssetBtn = document.querySelector('#vermoegen .add-button');
const vermoegenArt = document.getElementById('vermoegen-art');
const vermoegenWert = document.getElementById('vermoegen-wert');
const vermoegenBesitzer = document.getElementById('vermoegen-besitzer');
const vermoegenTyp = document.getElementById('vermoegen-typ');
const completeAssetBtn = document.getElementById('complete-vermoegen');

function renderVermoegen() {
    vermoegenListe.innerHTML = '';
    if (vermoegenswerte.length === 0) {
        vermoegenListe.classList.add('empty-state');
        vermoegenListe.innerHTML = '<span class="placeholder-text">Leer</span>';
        completeAssetBtn.disabled = true;
        return;
    }
    completeAssetBtn.disabled = false;
    vermoegenListe.classList.remove('empty-state');

    const detailsVisible = document.getElementById('asset-details-container').style.display !== 'none';
    let sum = 0;

    vermoegenswerte.forEach((v, index) => {
        sum += v.wert;
        const item = document.createElement('div');
        item.className = 'liste-item';
        let subText = "";
        if (detailsVisible) {
            let ownerLabel = v.besitzer === 'A' ? (currentScenario === 'tod' ? 'Erblasser' : 'Partner A') : (currentScenario === 'tod' ? 'Ehepartner' : 'Partner B');
            subText = `<br><small>${ownerLabel} | ${v.typ}</small>`;
        }
        item.innerHTML = `<div><b>${v.art}</b>${subText}</div><div style="display:flex;gap:10px;"><b>${formatCHF(v.wert)}</b><button onclick="removeAsset(${index})" style="color:red;border:none;background:none;cursor:pointer;">&times;</button></div>`;
        vermoegenListe.appendChild(item);
    });
    vermoegenListe.prepend(Object.assign(document.createElement('div'), {className:'asset-total', innerHTML:`Total: ${formatCHF(sum)}`}));
}
window.renderVermoegen = renderVermoegen;

addAssetBtn.addEventListener('click', () => {
    const art = vermoegenArt.value;
    const wert = parseFloat(vermoegenWert.value);
    if (!art || isNaN(wert)) return alert("Bitte Wert eingeben");
    const detailsVisible = document.getElementById('asset-details-container').style.display !== 'none';
    vermoegenswerte.push({art, wert, besitzer: detailsVisible ? vermoegenBesitzer.value : 'A', typ: detailsVisible ? vermoegenTyp.value : 'Eigengut' });
    renderVermoegen();
    vermoegenArt.value=''; vermoegenWert.value='';
});
completeAssetBtn.addEventListener('click', () => {
    document.getElementById('vermoegen').classList.remove('active');
    unlockStep('ergebnis');
    document.getElementById('ergebnis').classList.add('active');
    calculateResult();
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
    calculateResult();
    unlockStep('ergebnis');
    document.getElementById('ergebnis').classList.add('active');
});

// ========== SCHRITT 3: BERECHNUNG / RESULT ==========
function calculateResult() {
    const container = document.getElementById('ergebnis-content');
    container.innerHTML = '';

    // 1. GÜTERRECHT: Summen bilden
    let a_eigengut = 0, a_err = 0, b_eigengut = 0, b_err = 0;
    vermoegenswerte.forEach(v => {
        if (v.besitzer === 'A') v.typ === 'Eigengut' ? a_eigengut += v.wert : a_err += v.wert;
        else v.typ === 'Eigengut' ? b_eigengut += v.wert : b_err += v.wert;
    });
    
    const totalErrungenschaft = a_err + b_err;
    const haelfteVorschlag = totalErrungenschaft / 2;

    if (currentScenario === 'scheidung') {
        const finalA = a_eigengut + haelfteVorschlag;
        const finalB = b_eigengut + haelfteVorschlag;

        container.innerHTML = `
            <div style="text-align:center;margin-bottom:20px;">
                <h3 style="color:#e67e22">Scheidungsergebnis</h3>
                <p>Güterrechtliche Teilung (Errungenschaftsbeteiligung)</p>
            </div>
            <div class="split-view">
                <div class="result-card">
                    <h4>Partner A (Du)</h4>
                    <p>Eigengut: ${formatCHF(a_eigengut)}</p>
                    <p style="color:#7f8c8d">+ 1/2 Errungenschaft: ${formatCHF(haelfteVorschlag)}</p>
                    <hr>
                    <p class="final-sum">Endvermögen: ${formatCHF(finalA)}</p>
                </div>
                <div class="result-card">
                    <h4>Partner B</h4>
                    <p>Eigengut: ${formatCHF(b_eigengut)}</p>
                    <p style="color:#7f8c8d">+ 1/2 Errungenschaft: ${formatCHF(haelfteVorschlag)}</p>
                    <hr>
                    <p class="final-sum">Endvermögen: ${formatCHF(finalB)}</p>
                </div>
            </div>`;
        return;
    }

    // --- FALL 2: TODESFALL ---
    const livingSpouse = familienMitglieder.find(p => p.beziehung === 'Ehepartner' && p.status === 'lebend');
    let spouseGueterrecht = 0;
    let erbmasse = 0;

    if (livingSpouse) {
        spouseGueterrecht = b_eigengut + haelfteVorschlag;
        erbmasse = a_eigengut + haelfteVorschlag;
    } else {
        erbmasse = a_eigengut + a_err;
    }

    let html = `
        <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">
            <h3>1. Güterrecht</h3>
            ${livingSpouse ? `<p>Vorabzug Partner: <b>${formatCHF(spouseGueterrecht)}</b></p>` : ''}
            <div style="background:#eaf2f8; padding:10px; border-radius:5px; margin-top:10px;">
                <strong>Erbmasse: ${formatCHF(erbmasse)}</strong>
            </div>
        </div>
        <h3>2. Erbteilung</h3>`;

    let shares = [];

    // --- VERTEILUNGSLOGIK ---
    const distributeByStamm = (heirs, totalAmount, rootType) => {
        let potentialStemNames = new Set();
        heirs.forEach(h => {
            if (h.beziehung === rootType) potentialStemNames.add(h.name);
            if (h.stamm) potentialStemNames.add(h.stamm);
        });
        let validStems = [];
        potentialStemNames.forEach(stemName => {
            const root = familienMitglieder.find(p => p.name === stemName && p.beziehung === rootType && p.status === 'lebend');
            const livingDescendants = heirs.filter(h => h.stamm === stemName && h.status === 'lebend');
            if (root || livingDescendants.length > 0) validStems.push(stemName);
        });

        if (validStems.length === 0) return;

        const sharePerStem = totalAmount / validStems.length;
        validStems.forEach(stemName => {
            const rootPerson = familienMitglieder.find(p => p.name === stemName && p.beziehung === rootType);
            const isRootAlive = rootPerson && rootPerson.status === 'lebend';

            if (isRootAlive) {
                shares.push({ name: rootPerson.name, wert: sharePerStem, note: `${rootType} (lebt)` });
                const descendants = heirs.filter(h => h.stamm === stemName && h !== rootPerson);
                descendants.forEach(d => shares.push({ name: d.name, wert: 0, note: `Verdrängt durch ${rootPerson.name}` }));
            } else {
                const livingDescendants = heirs.filter(h => h.stamm === stemName && h.status === 'lebend');
                const sharePerDescendant = sharePerStem / livingDescendants.length;
                livingDescendants.forEach(d => shares.push({ name: d.name, wert: sharePerDescendant, note: `Eintritt für ${stemName}` }));
                if (rootPerson) shares.push({ name: rootPerson.name, wert: 0, note: "Verstorben" });
            }
        });
    };

    const p1 = familienMitglieder.filter(p => ['Kind', 'Enkel', 'Urenkel'].includes(p.beziehung));
    const p2 = familienMitglieder.filter(p => ['Elternteil', 'Geschwister', 'NichteNeffe'].includes(p.beziehung));
    const p3 = familienMitglieder.filter(p => ['Grosseltern', 'OnkelTante', 'Cousin'].includes(p.beziehung));

    const hasLivingP1 = p1.some(p => p.status === 'lebend');
    const hasLivingP2 = p2.some(p => p.status === 'lebend');
    const hasLivingP3 = p3.some(p => p.status === 'lebend');

    if (hasLivingP1) {
        let partSpouse = 0, partKids = erbmasse;
        if (livingSpouse) {
            partSpouse = erbmasse / 2;
            partKids = erbmasse / 2;
            shares.push({ name: livingSpouse.name, wert: partSpouse, note: "Ehepartner (1/2)" });
        }
        distributeByStamm(p1, partKids, 'Kind');
    } 
    else if (hasLivingP2) {
        let partSpouse = 0, partParents = erbmasse;
        if (livingSpouse) {
            partSpouse = erbmasse * 0.75;
            partParents = erbmasse * 0.25;
            shares.push({ name: livingSpouse.name, wert: partSpouse, note: "Ehepartner (3/4)" });
        }
        const hälfteFürSeite = partParents / 2;
        const parents = p2.filter(p => p.beziehung === 'Elternteil');
        let parentSlots = [];
        if (parents[0]) parentSlots.push(parents[0]); else parentSlots.push({name:'Unbekannt1', status:'verstorben'});
        if (parents[1]) parentSlots.push(parents[1]); else parentSlots.push({name:'Unbekannt2', status:'verstorben'});
        const siblingsAndNieces = p2.filter(p => ['Geschwister', 'NichteNeffe'].includes(p.beziehung));

        parentSlots.forEach(parent => {
            if (parent.status === 'lebend') {
                shares.push({ name: parent.name, wert: hälfteFürSeite, note: "Elternteil (lebt)" });
            } else {
                if (siblingsAndNieces.some(p => p.status === 'lebend')) {
                    distributeByStamm(siblingsAndNieces, hälfteFürSeite, 'Geschwister');
                } else {
                    shares.push({ name: "Andere Seite / Staat", wert: 0, note: "Stammseite leer" });
                }
            }
        });
    }
    else if (hasLivingP3) {
        if (livingSpouse) {
            shares.push({ name: livingSpouse.name, wert: erbmasse, note: "Alleinerbe (Art. 462 Ziff. 3)" });
        } else {
            const livingP3 = p3.filter(p => p.status === 'lebend');
            const share = erbmasse / livingP3.length;
            livingP3.forEach(p => shares.push({ name: p.name, wert: share, note: "3. Parentel" }));
        }
    }
    else {
        if (livingSpouse) {
             shares.push({ name: livingSpouse.name, wert: erbmasse, note: "Alleinerbe" });
        } else {
             // Fallback: Staat
             shares.push({ 
                 name: "Kanton / Gemeinde", 
                 wert: erbmasse, 
                 note: "Keine erbberechtigten Verwandten (Art. 466 ZGB)" 
             });
        }
    }

    shares.forEach(s => {
        if (s.wert > 0 || s.note.includes("Verdrängt") || s.note.includes("Verstorben") || s.note.includes("Staat") || s.note.includes("leer")) {
             let color = s.wert > 0 ? '#27ae60' : '#95a5a6';
             let style = s.wert === 0 ? 'text-decoration:line-through; opacity:0.7;' : '';
             html += `<div class="liste-item" style="${style}"><span><b>${s.name}</b> <small>(${s.note})</small></span><span style="color:${color};font-weight:bold;">${formatCHF(s.wert)}</span></div>`;
        }
    });

    container.innerHTML = html;
}

} // End of initializeApp()

// Helper functions for testing
function removeAsset(i) {
    if (i < 0 || i >= vermoegenswerte.length) return;
    vermoegenswerte.splice(i, 1);
    // Only call DOM function if in browser
    if (typeof renderVermoegen !== 'undefined') renderVermoegen();
}

function deleteAssetByType(type, all = false) {
    if (!type) return;
    const needle = type.trim().toLowerCase();
    if (all) {
        vermoegenswerte = vermoegenswerte.filter(v => v.art.trim().toLowerCase() !== needle);
    } else {
        const idx = vermoegenswerte.findIndex(v => v.art.trim().toLowerCase() === needle);
        if (idx !== -1) vermoegenswerte.splice(idx, 1);
    }
    // Only call DOM function if in browser
    if (typeof renderVermoegen !== 'undefined') renderVermoegen();
}

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