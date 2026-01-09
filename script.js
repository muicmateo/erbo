// ========== DATA ==========
let familienMitglieder = []; // { name, beziehung, status, stamm }
let vermoegenswerte = [];
let currentScenario = 'tod'; 

// ========== HELPER ==========
function formatCHF(value) {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value);
}

// ========== SZENARIO LOGIK ==========
function switchScenario(szenario) {
    currentScenario = szenario;
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

function forceNextStep() {
    document.getElementById('scheidung-info').classList.remove('active');
    unlockStep('vermoegen');
    document.getElementById('vermoegen').classList.add('active');
}

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

function toggleStammInput() {
    const val = beziehungSelect.value;
    const needsStamm = ['Enkel', 'Urenkel', 'NichteNeffe', 'Cousin'].includes(val);
    if (needsStamm) stammGroup.classList.remove('hidden');
    else stammGroup.classList.add('hidden');
}

function renderFamilienListe() {
    familienListe.innerHTML = '';
    if (familienMitglieder.length === 0) {
        familienListe.classList.add('empty-state');
        familienListe.innerHTML = '<span class="placeholder-text">Keine Personen</span>';
        completeFamilieBtn.disabled = true;
        return;
    }
    familienListe.classList.remove('empty-state');
    completeFamilieBtn.disabled = false;

    // UI Update für Vermögen Schritt
    const hasSpouse = familienMitglieder.some(p => p.beziehung === 'Ehepartner' && p.status === 'lebend');
    if(currentScenario === 'tod') updateAssetInputsVisibility(hasSpouse);

    familienMitglieder.forEach((person, index) => {
        const item = document.createElement('div');
        item.className = 'liste-item';
        
        // Status Icon
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

document.querySelector('#familie .add-button').addEventListener('click', () => {
    const name = nameInput.value.trim();
    const beziehung = beziehungSelect.value;
    const status = statusSelect.value;
    let stamm = stammInput.value.trim();

    if (!name || !beziehung) return alert("Bitte Name und Beziehung angeben");
    
    // Check Ehepartner
    if (beziehung === 'Ehepartner' && familienMitglieder.some(p => p.beziehung === 'Ehepartner')) {
        return alert("Es gibt nur einen Ehepartner.");
    }

    // Wenn "Kind", ist der Name selbst der Stamm für seine Kinder
    if (beziehung === 'Kind' || beziehung === 'Geschwister' || beziehung === 'Elternteil') {
        stamm = name; 
    } else {
        // Bei Enkel etc. muss Stamm angegeben sein
        if (!stammGroup.classList.contains('hidden') && !stamm) {
            return alert("Bitte geben Sie an, wer der Elternteil ist.");
        }
    }

    familienMitglieder.push({ name, beziehung, status, stamm });
    renderFamilienListe();
    
    nameInput.value = '';
    stammInput.value = '';
    beziehungSelect.value = '';
    statusSelect.value = 'lebend'; // Reset Status auf lebend
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
function removeAsset(i){ vermoegenswerte.splice(i,1); renderVermoegen(); }

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


// ========== SCHRITT 3: BERECHNUNG ==========
function calculateResult() {
    const container = document.getElementById('ergebnis-content');
    container.innerHTML = '';

    // Güterrecht
    let a_eigengut = 0, a_err = 0, b_eigengut = 0, b_err = 0;
    vermoegenswerte.forEach(v => {
        if (v.besitzer === 'A') v.typ === 'Eigengut' ? a_eigengut += v.wert : a_err += v.wert;
        else v.typ === 'Eigengut' ? b_eigengut += v.wert : b_err += v.wert;
    });
    const haelfteVorschlag = (a_err + b_err) / 2;

    if (currentScenario === 'scheidung') {
        container.innerHTML = `
            <div style="text-align:center;margin-bottom:20px;"><h3>Scheidungsergebnis</h3></div>
            <div class="split-view">
                <div class="result-card"><h4>Partner A</h4><p>Total: ${formatCHF(a_eigengut + haelfteVorschlag)}</p></div>
                <div class="result-card"><h4>Partner B</h4><p>Total: ${formatCHF(b_eigengut + haelfteVorschlag)}</p></div>
            </div>`;
        return;
    }

    // Todesfall
    // Nur LEBENDE Ehepartner zählen
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
            ${livingSpouse ? `<p>Vorabzug überlebender Partner: <b>${formatCHF(spouseGueterrecht)}</b></p>` : '<p>Kein lebender Ehepartner.</p>'}
            <div style="background:#eaf2f8; padding:10px; border-radius:5px; margin-top:10px;">
                <strong>Erbmasse: ${formatCHF(erbmasse)}</strong>
            </div>
        </div>
        <h3>2. Erbteilung</h3>`;

    let shares = [];

    // --- PARENTELEN LOGIK & EINTRITTSPRINZIP ---
    
    // Hilfsfunktion: Prüft, ob ein Elternteil (Stamm) noch lebt
    const isParentAlive = (stammName) => {
        // Suche eine Person mit diesem Namen, die KEIN Enkel ist (also Generation darüber) und lebt
        return familienMitglieder.some(p => p.name === stammName && p.status === 'lebend' && p.beziehung !== 'Enkel' && p.beziehung !== 'Urenkel');
    };

    // Verteil-Algorithmus pro Stamm
    const distributeByStamm = (heirs, totalAmount, noteSuffix) => {
        // Gruppiere Erben nach ihrem Stamm-Namen
        const groups = {};
        heirs.forEach(h => {
            // Wenn Stamm-Name nicht explizit gesetzt, ist es der eigene Name (bei Kind)
            const s = h.stamm || h.name; 
            if (!groups[s]) groups[s] = [];
            groups[s].push(h);
        });

        const stammNames = Object.keys(groups);
        // Wir zählen hier nur die "Hauptstämme" (Kinder des Erblassers), egal ob lebend oder tot
        // Aber Achtung: Ein Enkel darf nicht als eigener Hauptstamm zählen, wenn er zu einem Kind gehört
        // Lösung: Wir filtern Unique Stämme der 1. Ebene (Kinder)
        
        // Bessere Strategie:
        // Wir schauen uns die direkten Kinder an (egal ob tot oder lebend).
        // Jeder Kopf (Kind) bildet einen Teil.
        // Wenn Kind lebt -> kriegt Geld.
        // Wenn Kind tot -> Seine Kinder (Enkel) kriegen Geld.
        
        // Finde alle direkten Kinder (auch verstorbene, die in der Liste sind)
        const directChildren = familienMitglieder.filter(p => p.beziehung === 'Kind');
        
        // Falls keine Kinder in der Liste sind, aber Enkel da sind, müssen wir die Stämme aus den Enkeln raten
        let effectiveStems = [];
        if (directChildren.length > 0) {
            effectiveStems = directChildren.map(c => c.name);
        } else {
            // Nur Enkel da -> Stämme sind die 'stamm' Properties
            effectiveStems = [...new Set(heirs.map(h => h.stamm))];
        }

        const sharePerStem = totalAmount / effectiveStems.length;

        effectiveStems.forEach(stemName => {
            // Prüfe Status des Stammesoberhaupts (Kind)
            const rootPerson = directChildren.find(c => c.name === stemName);
            const isRootAlive = rootPerson && rootPerson.status === 'lebend';

            if (isRootAlive) {
                // Kind lebt -> Erbt alles
                shares.push({ name: rootPerson.name, wert: sharePerStem, note: "Kind (lebt)" });
                // Enkel dieses Kindes kriegen nichts (werden verdrängt)
                const descendants = heirs.filter(h => h.stamm === stemName && h !== rootPerson);
                descendants.forEach(d => shares.push({ name: d.name, wert: 0, note: "Verdrängt durch lebenden Elternteil" }));
            } else {
                // Kind tot (oder nicht erfasst) -> Enkel erben (Eintrittsprinzip)
                // Suche alle direkten Nachkommen dieses Stammes (Enkel)
                const descendants = heirs.filter(h => h.stamm === stemName && h.beziehung === 'Enkel' && h.status === 'lebend');
                
                if (descendants.length > 0) {
                    const sharePerDescendant = sharePerStem / descendants.length;
                    descendants.forEach(d => shares.push({ name: d.name, wert: sharePerDescendant, note: `Eintritt für ${stemName}` }));
                    if (rootPerson) shares.push({ name: rootPerson.name, wert: 0, note: "Verstorben" });
                } else {
                    // Niemand in diesem Stamm lebt mehr
                    if(rootPerson) shares.push({ name: rootPerson.name, wert: 0, note: "Verstorben (keine Nachkommen)" });
                    // Geld dieses Stammes müsste eigentlich an andere Stämme fallen (Akkreszenz)
                    // Vereinfachung für Schulprojekt: Wird als "nicht verteilt" angezeigt oder bleibt beim Staat
                }
            }
        });
    };

    // 1. Parentel (Kinder, Enkel...)
    const p1 = familienMitglieder.filter(p => ['Kind', 'Enkel', 'Urenkel'].includes(p.beziehung));
    // 2. Parentel
    const p2 = familienMitglieder.filter(p => ['Elternteil', 'Geschwister', 'NichteNeffe'].includes(p.beziehung));
    // 3. Parentel
    const p3 = familienMitglieder.filter(p => ['Grosseltern', 'OnkelTante', 'Cousin'].includes(p.beziehung));

    // Prüfen ob Parentel existiert (mindestens einer LEBT oder hat lebende Nachkommen)
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
        distributeByStamm(p1, partKids);
    } 
    else if (hasLivingP2) {
        let partSpouse = 0, partParents = erbmasse;
        if (livingSpouse) {
            partSpouse = erbmasse * 0.75;
            partParents = erbmasse * 0.25;
            shares.push({ name: livingSpouse.name, wert: partSpouse, note: "Ehepartner (3/4)" });
        }
        // Vereinfachte Verteilung 2. Parentel (Stammprinzip hier ähnlich, aber oft komplexer)
        // Wir nehmen an: Alle lebenden der 2. Parentel teilen sich den Rest
        const livingP2 = p2.filter(p => p.status === 'lebend');
        const share = partParents / livingP2.length;
        livingP2.forEach(p => shares.push({ name: p.name, wert: share, note: "2. Parentel" }));
    }
    else if (hasLivingP3) {
        if (livingSpouse) {
            shares.push({ name: livingSpouse.name, wert: erbmasse, note: "Alleinerbe (keine Eltern/Kinder)" });
        } else {
            const livingP3 = p3.filter(p => p.status === 'lebend');
            const share = erbmasse / livingP3.length;
            livingP3.forEach(p => shares.push({ name: p.name, wert: share, note: "3. Parentel" }));
        }
    }
    else {
        if (livingSpouse) shares.push({ name: livingSpouse.name, wert: erbmasse, note: "Alleinerbe" });
        else shares.push({ name: "Staat", wert: erbmasse, note: "Keine Erben" });
    }

    shares.forEach(s => {
        // Zeige nur Leute mit Wert > 0 oder explizite Hinweise
        if (s.wert > 0 || s.note.includes("Verdrängt") || s.note.includes("Verstorben")) {
             let color = s.wert > 0 ? '#27ae60' : '#95a5a6';
             html += `<div class="liste-item"><span><b>${s.name}</b> <small>(${s.note})</small></span><span style="color:${color};font-weight:bold;">${formatCHF(s.wert)}</span></div>`;
        }
    });

    container.innerHTML = html;
}