# 🏛️ ERBO - Rechner für Güterstand & Erbe

<div align="center">

![Language:  JavaScript](https://img.shields.io/badge/JavaScript-64.3%25-yellow)
![Language: HTML](https://img.shields.io/badge/HTML-20.3%25-orange)
![Language: CSS](https://img.shields.io/badge/CSS-15.4%25-blue)
![Testing: Jest](https://img.shields.io/badge/Testing-Jest-red)

**Ein interaktiver Webrechner für Schweizer Erbrecht und Güterstandsberechnungen**

[Demo starten](#-installation) • [Features](#-features) • [Verwendung](#-verwendung) • [Tests](#-tests)

</div>

---

## 📋 Überblick

ERBO ist eine benutzerfreundliche Webanwendung zur Berechnung von Erbteilen und Güterstandsaufteilungen nach Schweizer Recht. Die App unterstützt zwei Hauptszenarien:

- **✝️ Todesfall (Erbe)**: Berechnung der Erbteile nach ZGB
- **💔 Scheidung**: Berechnung der güterrechtlichen Auseinandersetzung

## ✨ Features

### 🎯 Kernfunktionen
- **Interaktive Familienverwaltung**:  Erfassung aller relevanten Familienmitglieder mit Beziehungen
- **Vermögensverwaltung**: Detaillierte Erfassung von Vermögenswerten
- **Automatische Berechnungen**: Präzise Berechnung nach Schweizer Erbrecht
- **Szenariowechsel**: Nahtloser Wechsel zwischen Todesfall und Scheidung
- **Responsive Design**: Optimiert für Desktop und Mobile

### 🎨 User Experience
- Modernes, sauberes Interface mit Inter-Schriftart
- Schrittweise geführter Prozess (Familie → Vermögen → Ergebnis)
- Visuelle Status-Indikatoren
- Automatisches Scrolling zu relevanten Bereichen
- Persistente Daten via localStorage

### 👨‍👩‍👧‍👦 Unterstützte Beziehungen
- Ehepartner
- Kinder (Söhne/Töchter)
- Enkel & Urenkel
- Elternteile
- Geschwister
- Nichten & Neffen
- Großeltern
- Onkel & Tanten

## 🚀 Installation

### Voraussetzungen
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- Optional: Node.js & npm für Tests

### Setup

```bash
# Repository klonen
git clone https://github.com/muicmateo/erbo.git

# In Verzeichnis wechseln
cd erbo

# Optional: Dependencies für Tests installieren
npm install
```

## 💻 Verwendung

### Als Webanwendung
Öffne einfach die `index.html` Datei in deinem Browser: 

```bash
open index.html
```

### Workflow

1. **Szenario wählen**: Todesfall oder Scheidung
2. **Familie erfassen**: 
   - Namen und Beziehungen der Beteiligten eingeben
   - Familienstammbaum wird automatisch visualisiert
3. **Vermögen erfassen**:  
   - Vermögenswerte mit Namen und Werten hinzufügen
   - Gesamtvermögen wird berechnet
4. **Ergebnis prüfen**: 
   - Automatische Berechnung der Anteile
   - Detaillierte Aufschlüsselung pro Person

## 🧪 Tests

Das Projekt verwendet Jest für Unit-Tests:

```bash
# Tests ausführen
npm test
```

Test-Dateien befinden sich im `/Test` Verzeichnis. 

## 📁 Projektstruktur

```
erbo/
├── index.html          # Haupt-HTML-Datei
├── script.js           # Kernlogik und Berechnungen
├─�� styles.css          # Styling und Layout
├── package.json        # NPM-Konfiguration
├── Test/              # Test-Dateien
│   └── *.js           # Jest-Tests
└── README.md          # Dokumentation
```

## 🛠️ Technologie-Stack

- **Frontend**:  Vanilla JavaScript (ES6+)
- **Styling**: Pure CSS mit CSS Grid & Flexbox
- **Schriftart**: [Inter](https://fonts.google.com/specimen/Inter) von Google Fonts
- **Testing**: Jest mit jsdom
- **Versionskontrolle**: Git

## 📚 Rechtliche Grundlagen

Die Berechnungen basieren auf: 
- Schweizerisches Zivilgesetzbuch (ZGB)
- Erbrecht (Art. 457 ff. ZGB)
- Güterrecht (Art. 181 ff. ZGB)

> ⚠️ **Hinweis**: Diese Anwendung dient nur zu Informationszwecken.  Für verbindliche Rechtsberatung konsultieren Sie bitte einen Fachanwalt oder Notar.

## 🤝 Beitragen

Beiträge sind willkommen!  Wenn du Verbesserungen vorschlagen möchtest: 

1. Fork das Projekt
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist Open Source und frei verfügbar. 

## 👤 Autor

**muicmateo**

- GitHub: [@muicmateo](https://github.com/muicmateo)

## 🙏 Danksagungen

- Schweizer Zivilgesetzbuch für die rechtlichen Grundlagen
- Google Fonts für die Inter-Schriftart
- Jest-Community für das Testing-Framework

---

<div align="center">

**Mit ❤️ entwickelt für präzise Erb- und Güterstandsberechnungen**

[⬆ Nach oben](#️-erbo---rechner-für-güterstand--erbe)

</div>