# Trainingsplan

Schlichte, mobiloptimierte Trainings-Web-App (Kraft-, Calisthenics- und Lauftraining, Kalenderplanung, ICS-Export).
Statisches HTML/CSS/Vanilla-JS – kein Backend, keine Abhängigkeiten, kein Build.

Live: https://denofrl.github.io

## Funktionen
- **Plan:** Vorlagen Oberkörper A/B, Unterkörper A/B, Ganzkörper Calisthenics sowie Lauf-Vorlagen (Grundlagenlauf, Intervall-Lauf/VO2max, Long Run). Eigene Pläne anlegen (mit Abbrechen), kopieren, umbenennen, einer Kategorie zuordnen und löschen; eigene Kategorien möglich. Übungen hinzufügen, entfernen, austauschen und umsortieren; Sätze, Wiederholungen bzw. Zeiten frei editierbar. Optionale Plandauer (z. B. Long Run 55 min).
- **Übungen:** 46 Übungen (nur Kurzhanteln bis 15 kg, Parallettes, Körpergewicht) mit eigener Illustration, Anleitung, Muskelgruppen sowie leichterer und schwererer Variante, inkl. Cardio (Lauftrainings, Burpees, Mountain Climbers, High Knees, Squat Jumps). Suche und Filter nach Muskelgruppe, Kategorie, Ausrüstung und Schwierigkeit. Eigene Übungen anlegen und bearbeiten.
- **Kalender:** Ein gemeinsamer Wochenplan für Kraft, Calisthenics und Laufen: beliebig viele Termine pro Woche (auch mehrere pro Tag), jeweils mit Tag, Uhrzeit, Dauer und Inhalt – *Rotation Kraft/Calisthenics*, *Rotation Laufen/Cardio* oder ein fester Plan. Beide Rotationen laufen fortlaufend weiter, sodass kein Plan wegfällt. Startdatum, 1–52 Wochen (Stepper), Vorschau mit Einzelanpassung und Überschneidungs-Hinweis, Export aller Termine als eine ICS-Datei mit ausführlicher Beschreibung aus dem aktuellen Plan.
- **Einstellungen:** Design (automatisch/hell/dunkel), Speicherdatei herunterladen/hochladen, eigene Kategorien verwalten, Zurücksetzen.

## Datenschutz und Sicherheit
- Die Website ist öffentlich, aber alle persönlichen Daten liegen ausschließlich im `localStorage` des jeweiligen Browsers. Es gibt keinen Server, kein Konto und keine Übertragung – niemand sonst kann die Daten sehen oder ändern, und das Repository wird nie verändert.
- Eine Content-Security-Policy erlaubt nur Skripte von der eigenen Seite und verbietet jede Netzwerkverbindung (`connect-src 'none'`).
- Hochgeladene Speicherdateien werden streng geprüft (max. 1 MB): Nur bekannte Felder mit gültigen Werten werden übernommen, Texte werden beim Anzeigen maskiert. Eingebaute Übungen und Standardvorlagen stehen im Code und können durch einen Upload nicht überschrieben werden.
- Daten älterer Versionen werden automatisch übernommen; vorher wird eine Kopie (`trainingsplaner.v1.backup-v1`/`-v2`) im Browser abgelegt.

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
- `style.css` – Layout (hell/dunkel, automatisch oder fest wählbar)
- `data.js` – Übungsbibliothek (Anleitung, Muskeln, Varianten), Standard-Vorlagen, Strichfiguren-Illustrationen
- `app.js` – Logik: Speicherung/Migration, Pläne, Übungsbibliothek, Terminplanung, ICS- und JSON-Export
