// ========== DATA ==========
let familienMitglieder = []; 
let vermoegenswerte = [];
let teilungGewaehlt = false;

function resetVermoegenswerte(newArray = []) {
    vermoegenswerte = newArray;
}

function resetFamilienMitglieder(newArray = []) {
    familienMitglieder = newArray;
}

const formatCHF = (value) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
};

if (typeof module === 'undefined' || !module.exports) {
    initializeApp();
}

function initializeApp() {
const sections = {
    familie: document.getElementById('familie'),
    vermoegen: document.getElementById('vermoegen'),
    berechnung: document.getElementById('berechnung'),
    ergebnis: document.getElementById('ergebnis')
};

let currentScenario = localStorage.getItem('erbo_last_scenario') || 'tod'; 

document.getElementById('opt-tod').addEventListener('click', () => switchScenario('tod'));
document.getElementById('opt-scheidung').addEventListener('click', () => switchScenario('scheidung'));

// Auto-Scroll-Function
function smartScroll(elementId, toBottom = false) {
    if (toBottom) {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    } else {
        const element = document.getElementById(elementId);
        const navbarHeight = 150; 
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - navbarHeight;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function lockStep(stepId) {
    const section = document.getElementById(stepId);
    const indicator = document.querySelector(`.step[data-step="${stepId}"]`);
    if (!section) return;


    section.classList.add('locked');
    section.classList.remove('active');


    if (!section.querySelector('.blur-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'blur-overlay';

        let msg = "🔒 Zuerst vorherigen Schritt abschließen";
        if (stepId === 'ergebnis') msg = "🔒";
        
        overlay.innerHTML = `<div class="lock-message">${msg}</div>`;

        section.insertBefore(overlay, section.firstChild);
    }


    if (indicator) indicator.classList.remove('active');
}

// ========== SZENARIO LOGIK ==========
function switchScenario(szenario) {

    if (currentScenario !== szenario) {
        familienMitglieder = [];
        vermoegenswerte = [];
        renderFamilienListe();
        renderVermoegen();
        document.getElementById('name-input').value = '';
        document.getElementById('vermoegen-art').value = '';
        document.getElementById('vermoegen-wert').value = '';

        document.getElementById('ergebnis-content').innerHTML = '';
        lockStep('ergebnis'); 
    }

    currentScenario = szenario;
    localStorage.setItem('erbo_last_scenario', szenario);

    document.querySelector('input[value="tod"]').checked = (szenario === 'tod');
    document.querySelector('input[value="scheidung"]').checked = (szenario === 'scheidung');

    document.getElementById('opt-tod').classList.toggle('selected', szenario === 'tod');
    document.getElementById('opt-scheidung').classList.toggle('selected', szenario === 'scheidung');

    const sectionFamilie = document.getElementById('familie');
    const sectionInfo = document.getElementById('scheidung-info');
    const simpleEstateWrapper = document.getElementById('simple-estate-wrapper');
    const familySubtitle = document.querySelector('#familie .subtitle');

    if (szenario === 'scheidung') {
        // --- MODUS SCHEIDUNG ---
        sectionFamilie.style.display = 'none';
        sectionInfo.style.display = 'none'; 
        sectionInfo.classList.remove('active');

        document.getElementById('step-nav-1').innerText = "1. Modus";
        
        if(simpleEstateWrapper) simpleEstateWrapper.style.display = 'none';

        showAssetInputs(true, true);

        unlockStep('vermoegen');
        document.getElementById('vermoegen').classList.add('active');
        smartScroll('vermoegen');
        
        lockStep('ergebnis');

    } else {
        // --- MODUS TODESFALL ---
        sectionFamilie.style.display = 'block';
        sectionInfo.style.display = 'none';
        
        document.getElementById('step-nav-1').innerText = "1. Familie";
        
        if(familySubtitle) familySubtitle.innerText = "Erfassen Sie die lebenden Verwandten.";

        if(simpleEstateWrapper) simpleEstateWrapper.style.display = 'none';
        
        if (familienMitglieder.length === 0) {
            lockStep('vermoegen');
            lockStep('ergebnis');
            
            document.getElementById('familie').classList.add('active');
            smartScroll('familie');
        }

        checkAssetDetailsRequirements();
    }
}
window.switchScenario = switchScenario;

function forceNextStep() {
    const scheidungInfo = document.getElementById('scheidung-info');
    scheidungInfo.classList.remove('active');
    scheidungInfo.style.display = 'none';
    unlockStep('vermoegen');
    document.getElementById('vermoegen').classList.add('active');
    smartScroll('vermoegen');
}
window.forceNextStep = forceNextStep;

function showAssetInputs(showOwner, showType) {
    const ownerContainer = document.getElementById('container-owner');
    const typeContainer = document.getElementById('container-type');
    const subtitle = document.getElementById('asset-subtitle');

    ownerContainer.style.display = showOwner ? 'block' : 'none';
    typeContainer.style.display = showType ? 'block' : 'none';

    if (!showOwner && !showType) {
        subtitle.innerText = "Alles fliesst direkt in die Erbmasse.";
    } else if (!showOwner && showType) {
        subtitle.innerText = "Erfassen Sie Vermögen des Verstorbenen (Güterstand relevant).";
    } else {
        subtitle.innerText = "Erfassen Sie Eigentümer und Art.";
    }
}

function checkAssetDetailsRequirements() {
    if (currentScenario === 'tod') {
        showAssetInputs(false, false);
        return;
    }

    const simpleCheckbox = document.getElementById('simple-estate-checkbox');
    if (simpleCheckbox && simpleCheckbox.checked) {
        showAssetInputs(false, false);
        return;
    }
    
    showAssetInputs(true, true);
}

function toggleAssetDetails() {
    checkAssetDetailsRequirements();
}

function unlockStep(stepId) {
    const section = document.getElementById(stepId);
    const indicator = document.querySelector(`.step[data-step="${stepId}"]`);
    if (!section) return;
    
    section.classList.remove('locked');
    const overlay = section.querySelector('.blur-overlay');
    if (overlay) overlay.remove();
    
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

noFamilyCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        familienMitglieder = [];
        renderFamilienListe();
        familyInputsDiv.style.opacity = '0.5';
        familyInputsDiv.style.pointerEvents = 'none';
        completeFamilieBtn.disabled = false;
        checkAssetDetailsRequirements();
    } else {
        familyInputsDiv.style.opacity = '1';
        familyInputsDiv.style.pointerEvents = 'auto';
        renderFamilienListe();
    }
});

function toggleStammInput() {
    const val = beziehungSelect.value;
    const needsStamm = ['Enkel', 'Urenkel', 'NichteNeffe', 'Cousin'].includes(val);
    if (needsStamm) {
        stammGroup.classList.remove('hidden');
        updateStammDropdown();
    }
    else stammGroup.classList.add('hidden');
}
window.toggleStammInput = toggleStammInput;

function updateStammDropdown() {
    stammInput.innerHTML = '<option value="" disabled selected>Elternteil wählen...</option>';
    familienMitglieder.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = p.name;
        stammInput.appendChild(opt);
    });
}

function renderFamilienListe() {
    familienListe.innerHTML = '';
    
    if (familienMitglieder.length === 0) {
        if (noFamilyCheckbox.checked) {
            familienListe.classList.remove('empty-state');
            familienListe.innerHTML = '<div style="padding:10px; color:#e67e22; font-weight:bold;">Der Staat erbt (Keine Verwandten).</div>';
            completeFamilieBtn.disabled = false;
        } else {
            familienListe.classList.add('empty-state');
            familienListe.innerHTML = '<span class="placeholder-text">Keine Personen</span>';
            completeFamilieBtn.disabled = true;
        }
        if(currentScenario === 'tod') checkAssetDetailsRequirements();
        return;
    }

    familienListe.classList.remove('empty-state');
    completeFamilieBtn.disabled = false;

    if(currentScenario === 'tod') checkAssetDetailsRequirements();

    familienMitglieder.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'liste-item';
        
        const statusIcon = person.status === 'verstorben' ? '⚰️' : '👤';
        const statusStyle = person.status === 'verstorben' ? 'color:#95a5a6; text-decoration:line-through;' : '';
        
        let info = `<span style="${statusStyle}"><b>${statusIcon} ${person.name}</b> <small>(${person.beziehung})</small></span>`;
        if (person.stamm && !['Kind', 'Geschwister', 'Elternteil'].includes(person.beziehung)) {
            info += `<br><small style="color:#7f8c8d; margin-left:25px;">↳ Kind von: ${person.stamm}</small>`;
        }

        item.innerHTML = `<div>${info}</div><button onclick="removeFamily(${index})" style="color:red;border:none;background:none;cursor:pointer;">&times;</button>`;
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
    let stamm = stammInput.value;

    if (!name || !beziehung) return alert("Bitte Name und Beziehung angeben");
    
    const exists = familienMitglieder.some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        return alert("Dieser Name existiert bereits. Bitte verwenden Sie eindeutige Namen (z.B. 'Anna B.').");
    }

    if (beziehung === 'Ehepartner' && familienMitglieder.some(p => p.beziehung === 'Ehepartner')) {
        return alert("Es gibt nur einen Ehepartner.");
    }

    if (beziehung === 'Kind' || beziehung === 'Geschwister' || beziehung === 'Elternteil') {
        stamm = name; 
    } else {
        if (!stammGroup.classList.contains('hidden') && !stamm) {
            return alert("Bitte wählen Sie ein Elternteil aus der Liste aus.");
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
    smartScroll('vermoegen');
});

// ========== SCHRITT 2: VERMÖGEN ==========
const vermoegenListe = document.getElementById('vermoegen-liste');
const addAssetBtn = document.querySelector('#vermoegen .add-button');
const vermoegenArt = document.getElementById('vermoegen-art');
const vermoegenWert = document.getElementById('vermoegen-wert');
const vermoegenBesitzer = document.getElementById('vermoegen-besitzer');
const vermoegenTyp = document.getElementById('vermoegen-typ');
const completeAssetBtn = document.getElementById('complete-vermoegen');
const simpleEstateCheckbox = document.getElementById('simple-estate-checkbox');

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

    const ownerVisible = document.getElementById('container-owner').style.display !== 'none';
    const typeVisible = document.getElementById('container-type').style.display !== 'none';

    let sum = 0;

    vermoegenswerte.forEach((v, index) => {
        sum += v.wert;
        const item = document.createElement('div');
        item.className = 'liste-item';
        let subText = "";
        
        if (!ownerVisible && !typeVisible) {
        } else if (!ownerVisible && typeVisible) {
            subText = `<br><small>Erblasser | ${v.typ}</small>`;
        } else {
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
    const art = vermoegenArt.value.trim();
    const wertStr = vermoegenWert.value;
    const wert = parseFloat(wertStr);

    if (!art) return alert("Bitte geben Sie eine Bezeichnung ein.");
    if (isNaN(wert)) return alert("Bitte geben Sie eine gültige Zahl ein.");
    if (wert < 0) return alert("Der Wert darf nicht negativ sein.");
    
    let besitzer = 'A';
    let typ = 'Eigengut';

    if (currentScenario === 'scheidung') {
        const ownerVisible = document.getElementById('container-owner').style.display !== 'none';
        const typeVisible = document.getElementById('container-type').style.display !== 'none';
        if (ownerVisible) besitzer = vermoegenBesitzer.value;
        if (typeVisible) typ = vermoegenTyp.value;
    }

    vermoegenswerte.push({art, wert, besitzer, typ});
    renderVermoegen();
    vermoegenArt.value=''; vermoegenWert.value='';
});

completeAssetBtn.addEventListener('click', () => {
    document.getElementById('vermoegen').classList.remove('active');
    unlockStep('ergebnis');
    document.getElementById('ergebnis').classList.add('active');
    calculateResult();
    smartScroll(null, true);
});

// ========== 3. BERECHNUNG ==========
const completeBerechnung = document.getElementById('complete-berechnung');
const radioButtons = document.querySelectorAll('input[name="teilung"]');

radioButtons.forEach(radio => {
    radio.addEventListener('change', () => {
        teilungGewaehlt = true;
        if(completeBerechnung) completeBerechnung.disabled = false;
    });
});

if(completeBerechnung) {
    completeBerechnung.addEventListener('click', () => {
        calculateResult();
        unlockStep('ergebnis');
        document.getElementById('ergebnis').classList.add('active');
        smartScroll(null, true);
    });
}

// ========== SCHRITT 3: BERECHNUNG RESULTAT ==========
function calculateResult() {
    const container = document.getElementById('ergebnis-content');
    container.innerHTML = '';

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
                <p>Güterrechtliche Teilung</p>
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

    const livingSpouse = familienMitglieder.find(p => p.beziehung === 'Ehepartner' && p.status === 'lebend');
    let spouseGueterrecht = 0;
    let erbmasse = 0;

    if (livingSpouse) {
        spouseGueterrecht = 0;
        erbmasse = a_eigengut; 
    } else {
        erbmasse = a_eigengut;
    }

    let html = `
        <div style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">
            <div style="background:#eaf2f8; padding:10px; border-radius:5px; margin-top:10px;">
                <strong>Zu verteilende Erbmasse: ${formatCHF(erbmasse)}</strong>
            </div>
        </div>
        <h3>2. Erbteilung</h3>`;

    let shares = [];

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
                    shares.push({ name: "Staat / Andere Seite", wert: 0, note: "Stammseite leer" });
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
             shares.push({ name: "Kanton / Gemeinde", wert: erbmasse, note: "Keine erbberechtigten Verwandten" });
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

switchScenario(currentScenario);
}

function removeAsset(i) {
    if (i < 0 || i >= vermoegenswerte.length) return;
    vermoegenswerte.splice(i, 1);

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

    if (typeof renderVermoegen !== 'undefined') renderVermoegen();
}

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