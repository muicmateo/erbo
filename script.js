// Tracking des Fortschritts
let familienMitglieder = [];
let vermoegenswerte = [];
let teilungGewaehlt = false;

// Sektion Management
const sections = {
    familie: document.getElementById('familie'),
    vermoegen: document.getElementById('vermoegen'),
    berechnung: document.getElementById('berechnung'),
    ergebnis: document.getElementById('ergebnis')
};

const tabButtons = {
    familie: document.querySelector('a[href="#familie"]'),
    vermoegen: document.querySelector('a[href="#vermoegen"]'),
    berechnung: document.querySelector('a[href="#berechnung"]'),
    ergebnis: document.querySelector('a[href="#ergebnis"]')
};

// Sektion freischalten
function unlockSection(sectionName) {
    sections[sectionName].classList.remove('locked');
    sections[sectionName].classList.add('active');
    tabButtons[sectionName].classList.remove('disabled');
    
    // Smooth scroll zur nächsten Sektion
    sections[sectionName].scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========== FAMILIE SEKTION ==========
const nameInput = document.getElementById('name-input');
const beziehungInput = document.getElementById('beziehung-input');
const familienListe = document.getElementById('familien-liste');
const completeFamilie = document.getElementById('complete-familie');

document.querySelector('#familie .add-button').addEventListener('click', () => {
    const name = nameInput.value.trim();
    const beziehung = beziehungInput.value.trim();
    
    if (name && beziehung) {
        familienMitglieder.push({ name, beziehung });
        
        const item = document.createElement('div');
        item.className = 'liste-item';
        item.innerHTML = `<span><strong>${name}</strong> (${beziehung})</span>`;
        familienListe.appendChild(item);
        
        nameInput.value = '';
        beziehungInput.value = '';
        
        // Button aktivieren wenn mindestens 2 Personen
        if (familienMitglieder.length >= 2) {
            completeFamilie.disabled = false;
        }
    }
});

completeFamilie.addEventListener('click', () => {
    unlockSection('vermoegen');
    completeFamilie.disabled = true;
    completeFamilie.textContent = 'Abgeschlossen ✓';
});

// ========== VERMÖGEN SEKTION ==========
const vermoegenArt = document.getElementById('vermoegen-art');
const vermoegenWert = document.getElementById('vermoegen-wert');
const vermoegenListe = document.getElementById('vermoegen-liste');
const completeVermoegen = document.getElementById('complete-vermoegen');

document.querySelector('#vermoegen .add-button').addEventListener('click', () => {
    const art = vermoegenArt.value.trim();
    const wert = vermoegenWert.value.trim();
    
    if (art && wert) {
        vermoegenswerte.push({ art, wert });
        
        const item = document.createElement('div');
        item.className = 'liste-item';
        item.innerHTML = `<span><strong>${art}</strong></span><span>${parseInt(wert).toLocaleString('de-CH')} CHF</span>`;
        vermoegenListe.appendChild(item);
        
        vermoegenArt.value = '';
        vermoegenWert.value = '';
        
        // Button aktivieren wenn mindestens 1 Vermögenswert
        if (vermoegenswerte.length >= 1) {
            completeVermoegen.disabled = false;
        }
    }
});

completeVermoegen.addEventListener('click', () => {
    unlockSection('berechnung');
    completeVermoegen.disabled = true;
    completeVermoegen.textContent = 'Abgeschlossen ✓';
});

// ========== BERECHNUNG SEKTION ==========
const completeBerechnung = document.getElementById('complete-berechnung');

document.querySelector('#berechnung .add-button').addEventListener('click', () => {
    const selected = document.querySelector('input[name="teilung"]:checked');
    if (selected) {
        teilungGewaehlt = true;
        completeBerechnung.disabled = false;
    }
});

completeBerechnung.addEventListener('click', () => {
    unlockSection('ergebnis');
    completeBerechnung.disabled = true;
    completeBerechnung.textContent = 'Abgeschlossen ✓';
    
    // Ergebnis generieren
    generateErgebnis();
});

// ========== ERGEBNIS GENERIEREN ==========
function generateErgebnis() {
    const ergebnisContent = document.getElementById('ergebnis-content');
    const gesamtVermoegen = vermoegenswerte.reduce((sum, v) => sum + parseInt(v.wert), 0);
    const anteilProPerson = gesamtVermoegen / familienMitglieder.length;
    
    let html = '<div style="text-align: left;">';
    html += `<h3>Gesamtvermögen: ${gesamtVermoegen.toLocaleString('de-CH')} CHF</h3>`;
    html += `<h4>Aufteilung (${familienMitglieder.length} Personen):</h4>`;
    html += '<ul>';
    
    familienMitglieder.forEach(person => {
        html += `<li><strong>${person.name}</strong> (${person.beziehung}): ${Math.round(anteilProPerson).toLocaleString('de-CH')} CHF</li>`;
    });
    
    html += '</ul></div>';
    ergebnisContent.innerHTML = html;
}

// Tab Navigation
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        if (!button.classList.contains('disabled')) {
            e.preventDefault();
            const targetId = button.getAttribute('href').substring(1);
            sections[targetId].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});