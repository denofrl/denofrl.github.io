# Trainingsplan

Schlichte, mobiloptimierte Trainings-Web-App (Kraft-, Calisthenics- und Lauftraining, Kalenderplanung, ICS-Export).
Statisches HTML/CSS/Vanilla-JS – kein Backend, keine Abhängigkeiten, kein Build.

Live: https://denofrl.github.io

## Funktionen
- **Heute:** Startseite mit der heutigen bzw. nächsten Einheit, „Training starten“ oder „Kurzversion“ (erste 3 Übungen, max. 2 Sätze), freies Training mit beliebigem Plan.
- **Trainingsmodus:** Eine Übung pro Bildschirm mit Illustration, Intensitätshinweis (Muskelversagen bzw. Technikgrenze), optionalem Eintragen von Gewicht/Wiederholungen bzw. Dauer/Distanz, Vorschlag der Werte vom letzten Mal, Pausentimer mit Vibration. Bildschirm bleibt an; ein laufendes Training übersteht Neuladen und Sperrbildschirm.
- **Pläne:** Vorlagen Oberkörper A/B, Unterkörper A/B, Ganzkörper Calisthenics sowie Lauf-Vorlagen (Grundlagenlauf, Intervall-Lauf/VO2max, Long Run). Eigene Pläne und Kategorien; Übungen hinzufügen, entfernen, austauschen, umsortieren.
- **Übungen:** 46 Übungen (nur Kurzhanteln bis 15 kg, Parallettes, Körpergewicht) mit Illustration, Anleitung, Muskelgruppen und Varianten. Suche und Filter. Eigene Übungen.
- **Kalender:** Gemeinsamer Wochenplan für Kraft, Calisthenics und Laufen mit zwei fortlaufenden Rotationen oder festen Plänen, 1–52 Wochen, Vorschau mit Einzelanpassung, ICS-Export mit ausführlicher Beschreibung, einer einmaligen Erinnerung (einstellbar) und Link zur App.
- **Fortschritt:** Wochen-Haken für geplante Einheiten; je Übung die letzten Einträge als Liste und darunter ein einfacher Verlaufs-Graph (höchstes Gewicht, beste Wiederholungen bzw. Sekunden, Dauer oder Distanz); letzte Einheiten mit Filter nach Plan; Hinweis auf die letzte Sicherung.
- **Kopfzeile:** Mond-/Sonnen-Symbol schaltet direkt zwischen hell und dunkel um; Zahnrad öffnet die Einstellungen.
- **Einstellungen:** Design (auch „Automatisch“), Satzpause, App installieren, Speicherdatei, eigene Kategorien, Zurücksetzen.
- **PWA:** Installierbar auf dem Startbildschirm, Vollbild, offline nutzbar (`manifest.webmanifest`, `sw.js`, `icons/`).

## Datenschutz und Sicherheit
- Die Website ist öffentlich, aber alle persönlichen Daten liegen ausschließlich im `localStorage` des jeweiligen Browsers. Es gibt keinen Server, kein Konto und keine Übertragung – niemand sonst kann die Daten sehen oder ändern, und das Repository wird nie verändert.
- Eine Content-Security-Policy erlaubt nur Skripte von der eigenen Seite und verbietet jede Netzwerkverbindung (`connect-src 'none'`).
- Hochgeladene Speicherdateien werden streng geprüft (max. 1 MB): Nur bekannte Felder mit gültigen Werten werden übernommen, Texte werden beim Anzeigen maskiert. Eingebaute Übungen und Standardvorlagen stehen im Code und können durch einen Upload nicht überschrieben werden.
- Der Service Worker speichert nur die App-Dateien für den Offline-Betrieb (Strategie „Netzwerk zuerst“, online immer die neueste Version), keine persönlichen Daten.
- Daten älterer Versionen werden automatisch übernommen; vorher wird eine Kopie (`trainingsplaner.v1.backup-v1`/`-v2`) im Browser abgelegt.

## Hinweise zur ICS-Datei
- Jeder Termin ist ein eigenes `VEVENT`. Zeiten werden pro Termin vom Browser in UTC umgerechnet – damit ist Sommer-/Winterzeit für jedes Datum korrekt, und Google, Apple und Outlook zeigen die Termine in der lokalen Zeit an.
- Die Umrechnung nutzt die Zeitzone des Geräts, auf dem exportiert wird (z. B. Europe/Berlin).
- Importierte Termine werden nicht synchronisiert. Ein erneuter Import kann Duplikate erzeugen – am besten in einen eigenen Kalender „Training“ importieren und diesen bei Änderungen leeren/neu anlegen.

## Lokal testen
Mit lokalem Server testen (nötig für Offline-Funktion/Installation; verhält sich wie GitHub Pages):

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
- `app.js` – Logik: Speicherung/Migration, Heute, Trainingsmodus, Pläne, Übungen, Terminplanung, Fortschritt, ICS- und JSON-Export
- `manifest.webmanifest`, `sw.js`, `icons/` – PWA (Installation, Offline-Betrieb)
