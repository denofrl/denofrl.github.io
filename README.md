# Trainingsplan

Schlichte, mobiloptimierte Trainings-Web-App (Oberkörper/Unterkörper-Split, Kalenderplanung, ICS-Export).
Statisches HTML/CSS/Vanilla-JS – kein Backend, keine Abhängigkeiten, kein Build.

Live: https://denofrl.github.io

## Funktionen
- **Plan:** Vorlagen Oberkörper A/B, Unterkörper A/B, Ganzkörper Calisthenics und Lockerer Lauf. Eigene Pläne anlegen, kopieren, umbenennen, einer Kategorie zuordnen (Ganzkörper, Push, Pull, Beine, Core, Calisthenics, Cardio …) und löschen. Übungen hinzufügen, entfernen, austauschen und umsortieren; Sätze, Wiederholungen bzw. Haltezeiten frei editierbar.
- **Übungen:** Bibliothek mit 41 Übungen (nur Kurzhanteln bis 15 kg, Parallettes, Körpergewicht) mit eigener Illustration, Anleitung, Muskelgruppen sowie leichterer und schwererer Variante. Suche und Filter nach Muskelgruppe, Kategorie, Ausrüstung und Schwierigkeit. Eigene Übungen anlegen und bearbeiten.
- **Kalender:** 1–6 Trainingstage pro Woche. Pläne per **Rotation** (frei wählbare Reihenfolge, keine Einheit fällt weg) oder als **fester Plan je Wochentag** verteilen. Optional 1 Lauftag (Standardtext oder beliebiger Plan). Startdatum, 4/8/12 Wochen, Vorschau mit Einzelanpassung (Datum, Zeit, Dauer, Plan, auslassen) und Überschneidungs-Hinweis. Export aller Termine als eine ICS-Datei – jede Terminbeschreibung enthält Planname, Übungen in Reihenfolge, Sätze/Wiederholungen bzw. Haltezeiten und optional kurze Technikhinweise, erzeugt aus dem Plan zum Zeitpunkt des Exports.
- **Einstellungen:** JSON-Sicherung exportieren/importieren (auch ältere Sicherungen), Zurücksetzen.

## Datenmigration
Gespeicherte Daten der ersten Version werden beim Öffnen automatisch übernommen (Pläne, Kalendereinstellungen, Einzeländerungen, eigene Übungen). Zusätzlich wird einmalig eine Kopie der alten Daten unter `trainingsplaner.v1.backup-v1` im Browser abgelegt.

## Datenschutz
Alle Daten liegen ausschließlich im `localStorage` des Browsers. Es gibt keine externen Anfragen (keine CDNs, Fonts oder Tracker). Persönliche Daten gehören nicht ins Repository.

## Hinweise zur ICS-Datei
- Jeder Termin ist ein eigenes `VEVENT`. Zeiten werden pro Termin vom Browser in UTC umgerechnet – damit ist Sommer-/Winterzeit für jedes Datum korrekt, und Google, Apple und Outlook zeigen die Termine in der lokalen Zeit an.
- Die Umrechnung nutzt die Zeitzone des Geräts, auf dem exportiert wird (z. B. Europe/Berlin).
- Importierte Termine werden nicht synchronisiert. Ein erneuter Import kann Duplikate erzeugen – am besten in einen eigenen Kalender „Training“ importieren und diesen bei Änderungen leeren/neu anlegen.

## Lokal testen
Einfach `index.html` im Browser öffnen. Alternativ mit lokalem Server (empfohlen, verhält sich wie GitHub Pages):

```
python -m http.server 8000
```

Dann http://localhost:8000 öffnen. Für den Handy-Test im selben WLAN: `http://<IP-des-PCs>:8000`.

## Veröffentlichen (GitHub Pages)
```
git add .
git commit -m "Trainingsplan-App"
git push
```
Auf GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, Branch `main`, Ordner `/ (root)`. Bei einem Repository namens `denofrl.github.io` ist die Seite nach ca. 1 Minute unter https://denofrl.github.io erreichbar.

## Dateien
- `index.html` – Grundgerüst und Navigation
- `style.css` – Layout (hell/dunkel automatisch)
- `data.js` – Übungsbibliothek (Anleitung, Muskeln, Varianten), Standard-Vorlagen, Strichfiguren-Illustrationen
- `app.js` – Logik: Speicherung/Migration, Pläne, Übungsbibliothek, Terminplanung, ICS- und JSON-Export
