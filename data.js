// Übungsbibliothek, Standard-Vorlagen und eigene Strichfiguren-Illustrationen (selbst erstellt, frei nutzbar).
'use strict';

const MUSCLES = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Unterarme', 'Quadrizeps', 'Beinbeuger', 'Po', 'Adduktoren', 'Waden', 'Core', 'Ausdauer'];
const EX_CATS = ['Oberkörper', 'Unterkörper', 'Core', 'Calisthenics', 'Cardio'];
const PLAN_CATS = ['Oberkörper', 'Unterkörper', 'Ganzkörper', 'Push', 'Pull', 'Beine', 'Core', 'Calisthenics', 'Cardio', 'Sonstiges'];
const THEMES = { auto: 'Automatisch (wie Gerät)', light: 'Hell', dark: 'Dunkel' };
const EQUIP = ['Kurzhanteln', 'Parallettes', 'Körpergewicht'];
const LEVELS = ['', 'Einsteiger', 'Mittel', 'Fortgeschritten'];

// Felder: name, cat (Kategorie), m (Muskelgruppen), eq (Ausrüstung), lv (1–3), cues (Anleitung), easy/hard (Varianten), pose.
// Pose-Format: h = Kopf, l = Linien (Polylinien "x,y x,y"), db/dbv = Kurzhanteln (waagerecht/senkrecht),
// pp = Parallettes (Griffmitte), x = Hilfslinien (SVG-Pfade, z. B. Wand), ar = Bewegungspfeile. Boden bei y = 73.
const EXERCISES = {
  /* ---------- Oberkörper (Kurzhanteln) ---------- */
  floor_press: {
    name: 'Kurzhantel Floor Press', cat: 'Oberkörper', m: ['Brust', 'Trizeps', 'Schultern'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Rückenlage am Boden, Knie gebeugt, Füße fest aufgestellt.', 'Oberarme ca. 45° vom Körper, Ellbogen kurz am Boden ablegen.', 'Hanteln kontrolliert über die Brust drücken, nicht ganz einrasten.', 'Schulterblätter leicht zusammen und nach unten ziehen.'],
    easy: 'Leichtere Hanteln, Pause unten am Boden.', hard: '3 s Absenkphase oder einarmig ausführen.',
    pose: { h: [20, 66], l: ['27,68 56,68', '56,68 70,54 80,72', '32,68 34,56 34,44'], db: [[34, 44]], ar: ['44,56 44,44', '41,47 44,44 47,47'] }
  },
  floor_fly: {
    name: 'Kurzhantel Floor Fly', cat: 'Oberkörper', m: ['Brust', 'Schultern'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Rückenlage, Hanteln über der Brust, Handflächen zueinander.', 'Ellbogen leicht gebeugt lassen.', 'Arme in einem Bogen seitlich senken, bis die Oberarme den Boden berühren.', 'Im gleichen Bogen wieder zusammenführen.'],
    easy: 'Leichtes Gewicht, stärker gebeugte Ellbogen.', hard: 'Langsamer Bogen, 1 s Pause oben mit Brustspannung.',
    pose: { h: [20, 66], l: ['27,68 56,68', '56,68 70,54 80,72', '32,68 28,58 36,47'], db: [[36, 47]], ar: ['46,62 50,53 47,45', '44,48 47,45 50,47'] }
  },
  row1: {
    name: 'Einarmiges Kurzhantelrudern', cat: 'Oberkörper', m: ['Rücken', 'Bizeps'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Schrittstellung, freie Hand stützt sich auf dem vorderen Knie ab.', 'Rücken gerade, Rumpf fest – nicht verdrehen.', 'Hantel Richtung Hüfte ziehen, Ellbogen nah am Körper.', 'Unten die Schulter kurz lang werden lassen, oben 1 s halten.'],
    easy: 'Leichteres Gewicht, Hand auf erhöhter Fläche abstützen.', hard: 'Langsame Absenkphase, oben 2 s halten.',
    pose: { h: [81, 27], l: ['50,42 66,54 70,72', '50,42 42,56 32,72', '50,42 74,30', '74,30 70,42 66,52', '72,31 60,30 62,44'], db: [[62, 44]], ar: ['54,52 54,40', '51,43 54,40 57,43'] }
  },
  row2: {
    name: 'Vorgebeugtes Rudern beidarmig', cat: 'Oberkörper', m: ['Rücken', 'Bizeps', 'Schultern'], eq: 'Kurzhanteln', lv: 2,
    cues: ['Hüftbreit stehen, Knie leicht gebeugt, Oberkörper ca. 45° nach vorn.', 'Rücken gerade, Blick zum Boden.', 'Beide Hanteln zum Bauchnabel ziehen, Schulterblätter zusammen.', 'Kontrolliert ablassen, Oberkörper bleibt ruhig.'],
    easy: 'Einarmiges Rudern mit Abstützung.', hard: 'Oben 2 s halten oder Oberkörper fast waagerecht.',
    pose: { h: [86, 32], l: ['79,37 55,44', '55,44 61,58 59,72', '77,38 69,44 72,52'], db: [[72, 52]], ar: ['88,54 88,44', '85,47 88,44 91,47'] }
  },
  rev_fly: {
    name: 'Reverse Flys', cat: 'Oberkörper', m: ['Schultern', 'Rücken'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Vorgebeugt stehen wie beim Rudern, Rücken gerade.', 'Leichte Hanteln, Ellbogen leicht gebeugt.', 'Arme seitlich nach außen heben, bis sie etwa waagerecht sind.', 'Langsam ablassen, nicht mit Schwung arbeiten.'],
    easy: 'Sehr leichtes Gewicht oder ohne Hanteln.', hard: 'Oben 2 s halten, langsame Absenkphase.',
    pose: { h: [86, 30], l: ['79,35 55,44', '55,44 61,58 59,72', '79,35 81,47 80,56'], db: [[80, 56]], ar: ['90,58 94,48 92,40', '89,42 92,40 95,42'] }
  },
  curl: {
    name: 'Bizeps Curls', cat: 'Oberkörper', m: ['Bizeps', 'Unterarme'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Aufrecht stehen, Ellbogen bleiben seitlich am Körper.', 'Handflächen zeigen nach vorn/oben.', 'Ohne Schwung hochbeugen, langsam ablassen.', 'Gewicht so wählen, dass der Oberkörper ruhig bleibt.'],
    easy: 'Abwechselnd statt beidseitig, leichteres Gewicht.', hard: '3 s Absenkphase oder Pause in der Mitte.',
    pose: { h: [60, 11], l: ['60,18 60,42', '60,42 58,57 57,72', '60,42 63,57 64,72', '60,20 57,33 56,44', '60,20 60,33 70,26'], db: [[70, 26], [56, 44]], ar: ['78,36 76,26', '73,28 76,26 79,29'] }
  },
  hammer: {
    name: 'Hammer Curls', cat: 'Oberkörper', m: ['Bizeps', 'Unterarme'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Neutraler Griff: Daumen zeigt nach oben.', 'Ellbogen fixiert am Körper lassen.', 'Kontrolliert beugen, unten Arme fast strecken.', 'Abwechselnd oder beidseitig möglich.'],
    easy: 'Abwechselnd, leichteres Gewicht.', hard: 'Langsame Absenkphase, oben 1 s halten.',
    pose: { h: [60, 11], l: ['60,18 60,42', '60,42 58,57 57,72', '60,42 63,57 64,72', '60,20 57,33 56,44', '60,20 61,33 69,25'], dbv: [[69, 25], [56, 44]] }
  },
  oh_tri: {
    name: 'Overhead Trizeps Extension', cat: 'Oberkörper', m: ['Trizeps'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Eine Hantel mit beiden Händen über dem Kopf halten.', 'Ellbogen zeigen nach vorn-oben und bleiben eng.', 'Hantel hinter den Kopf senken, dann strecken.', 'Rippen unten halten – kein Hohlkreuz. Gern im Kniestand.'],
    easy: 'Im Kniestand oder sitzend, leichteres Gewicht.', hard: 'Einarmig oder langsame Absenkphase.',
    pose: { h: [63, 11], l: ['60,18 60,42', '60,42 58,57 57,72', '60,42 63,57 64,72', '60,20 57,2 50,12'], db: [[50, 12]] }
  },
  lat_raise: {
    name: 'Seitheben', cat: 'Oberkörper', m: ['Schultern'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Leichtes Gewicht, Ellbogen minimal gebeugt.', 'Arme seitlich bis Schulterhöhe heben – nicht höher.', 'Schultern unten lassen, nicht mit den Nacken ziehen.', 'Langsam ablassen (2–3 s).'],
    easy: 'Sehr leichte Hanteln, Ellbogen stärker beugen.', hard: 'Oben 1–2 s halten oder einarmig mit Wandkontakt.',
    pose: { h: [60, 11], l: ['60,18 60,42', '53,20 67,20', '60,42 55,57 54,72', '60,42 65,57 66,72', '53,20 44,22 35,22', '67,20 76,22 85,22'], db: [[35, 22], [85, 22]], ar: ['28,34 30,26', '27,28 30,26 32,29'] }
  },
  ohp: {
    name: 'Kurzhantel Schulterdrücken', cat: 'Oberkörper', m: ['Schultern', 'Trizeps'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Stehend oder im Kniestand, Bauch und Po fest.', 'Hanteln auf Schulterhöhe, Unterarme senkrecht.', 'Nach oben drücken, bis die Arme fast gestreckt sind.', 'Nicht ins Hohlkreuz ausweichen.'],
    easy: 'Im Kniestand oder abwechselnd drücken.', hard: 'Einarmig stehend (mehr Rumpfarbeit) oder Arnold Press.',
    pose: { h: [60, 11], l: ['60,18 60,42', '52,20 68,20', '60,42 55,57 54,72', '60,42 65,57 66,72', '52,20 44,13 46,1', '68,20 76,13 74,1'], db: [[46, 1], [74, 1]], ar: ['90,14 90,2', '87,5 90,2 93,5'] }
  },
  farmer: {
    name: 'Farmer’s / Suitcase Walk', cat: 'Core', m: ['Unterarme', 'Core', 'Schultern'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Je eine schwere Hantel (oder nur eine = Suitcase) seitlich halten.', 'Aufrecht gehen, Schultern unten und hinten.', 'Kleine, ruhige Schritte, Rumpf fest.', 'Bei einer Hantel nicht zur Seite kippen.'],
    easy: 'Zwei Hanteln, kürzere Strecke.', hard: 'Nur eine Hantel (Suitcase) oder länger gehen.',
    pose: { h: [60, 11], l: ['60,18 60,42', '60,42 54,57 50,72', '60,42 66,57 70,72', '60,20 60,32 60,44'], db: [[60, 44]], ar: ['78,40 94,40', '90,37 94,40 90,43'] }
  },

  /* ---------- Calisthenics ---------- */
  knee_pushup: {
    name: 'Knie-Liegestütz', cat: 'Calisthenics', m: ['Brust', 'Trizeps', 'Schultern'], eq: 'Körpergewicht', lv: 1,
    cues: ['Knie am Boden, Hände etwas breiter als schulterbreit.', 'Von Knie bis Kopf eine gerade Linie.', 'Brust kontrolliert zum Boden senken.', 'Ellbogen ca. 45° vom Körper.'],
    easy: 'Hände erhöht abstützen (Wand, Tisch).', hard: 'Normale Liegestütz.',
    pose: { h: [92, 46], l: ['85,50 52,62', '52,62 42,72 24,72', '85,50 86,61 85,72'] }
  },
  pp_pushup: {
    name: 'Liegestütz an Parallettes', cat: 'Calisthenics', m: ['Brust', 'Trizeps', 'Schultern', 'Core'], eq: 'Parallettes', lv: 2,
    cues: ['Hände auf den Griffen unter den Schultern, Körper bildet eine Linie.', 'Po und Bauch anspannen, kein Hohlkreuz.', 'Brust kontrolliert zwischen die Griffe senken.', 'Durch die Griffe ist mehr Bewegungstiefe möglich als am Boden.'],
    easy: 'Knie aufsetzen.', hard: 'Langsame Absenkphase (3 s) oder Pause unten.',
    pose: { h: [94, 42], pp: [[86, 64]], l: ['86,47 54,57', '54,57 20,70', '86,47 88,56 86,64'] }
  },
  close_pushup: {
    name: 'Enge Liegestütz', cat: 'Calisthenics', m: ['Trizeps', 'Brust'], eq: 'Körpergewicht', lv: 2,
    cues: ['Hände etwa schulterbreit oder enger unter der Brust.', 'Ellbogen eng am Körper nach hinten führen.', 'Körper bleibt eine gerade Linie.', 'Nur so tief, wie die Ellbogen es angenehm erlauben.'],
    easy: 'Auf den Knien ausführen.', hard: 'Hände zu einer Raute (Diamond) zusammen.',
    pose: { h: [94, 44], l: ['86,49 54,59', '54,59 20,71', '86,49 84,61 86,72'] }
  },
  pike_pushup: {
    name: 'Pike Push-ups', cat: 'Calisthenics', m: ['Schultern', 'Trizeps'], eq: 'Körpergewicht', lv: 2,
    cues: ['Umgedrehtes V: Hüfte hoch, Hände und Füße am Boden.', 'Kopf zwischen den Händen Richtung Boden senken.', 'Ellbogen zeigen nach hinten, nicht seitlich.', 'Wieder hochdrücken, Hüfte bleibt oben.'],
    easy: 'Hüfte weniger hoch, kleinere Bewegung.', hard: 'Hände auf Parallettes für mehr Tiefe, Füße näher an die Hände.',
    pose: { h: [80, 56], l: ['74,50 56,30', '56,30 34,72', '74,50 78,61 80,72'], ar: ['92,50 92,60', '89,57 92,60 95,57'] }
  },
  scap_pushup: {
    name: 'Scapula Push-ups', cat: 'Calisthenics', m: ['Schultern', 'Rücken', 'Core'], eq: 'Körpergewicht', lv: 1,
    cues: ['Liegestützposition mit gestreckten Armen.', 'Arme bleiben gestreckt – nur die Schulterblätter bewegen.', 'Brust absinken lassen (Schulterblätter zusammen), dann Boden wegdrücken.', 'Langsam und bewusst ausführen.'],
    easy: 'Auf den Knien ausführen.', hard: 'Auf Parallettes oder mit 2 s Pause in jeder Position.',
    pose: { h: [94, 44], l: ['86,48 54,58', '54,58 20,71', '86,48 86,72'], ar: ['80,38 80,30', '77,33 80,30 83,33'] }
  },
  rev_dip: {
    name: 'Dips hinter dem Körper (Parallettes)', cat: 'Calisthenics', m: ['Trizeps', 'Schultern', 'Brust'], eq: 'Parallettes', lv: 1,
    cues: ['Hände hinter dem Körper auf die Parallettes, Finger nach vorn.', 'Ellbogen nach hinten beugen, Schultern weg von den Ohren.', 'Nur so tief, wie es in der Schulter angenehm bleibt.', 'Über die Hände hochdrücken.'],
    easy: 'Knie stark gebeugt, Füße nah am Körper.', hard: 'Beine gestreckt oder langsame Negativen (4 s).',
    pose: { h: [44, 32], pp: [[38, 62]], l: ['44,39 48,64', '48,64 68,54 76,72', '44,40 33,50 38,62'], ar: ['56,44 56,34', '53,37 56,34 59,37'] }
  },
  pp_support: {
    name: 'Parallettes-Stütz', cat: 'Calisthenics', m: ['Schultern', 'Trizeps', 'Core'], eq: 'Parallettes', lv: 1,
    cues: ['Hände auf den Griffen, Arme gestreckt.', 'Schultern aktiv nach unten drücken (lange Arme, langer Hals).', 'Anfangs Füße am Boden lassen und nur entlasten.', 'Ruhig atmen, Spannung halten.'],
    easy: 'Füße bleiben mit mehr Gewicht am Boden.', hard: 'Füße abheben → Tuck L-Sit.',
    pose: { h: [60, 25], pp: [[60, 60]], l: ['60,32 58,58', '58,58 76,56 82,72', '60,34 60,47 60,60'] }
  },
  tuck_lsit: {
    name: 'Tuck L-Sit', cat: 'Calisthenics', m: ['Core', 'Schultern', 'Trizeps'], eq: 'Parallettes', lv: 3,
    cues: ['Im Stütz auf den Parallettes die Schultern nach unten drücken.', 'Knie zur Brust ziehen und Füße vom Boden lösen.', 'Rücken leicht rund, Bauch fest.', 'Kurze Haltezeiten sauber halten statt lange wackeln.'],
    easy: 'Parallettes-Stütz, nur einen Fuß abheben.', hard: 'Ein Bein strecken (One-Leg L-Sit) oder längere Haltezeit.',
    pose: { h: [61, 21], pp: [[60, 58]], l: ['60,30 58,52', '58,52 72,46 74,58', '60,30 60,44 60,58'] }
  },
  pp_lean: {
    name: 'Planche Lean an Parallettes', cat: 'Calisthenics', m: ['Schultern', 'Brust', 'Core'], eq: 'Parallettes', lv: 3,
    cues: ['Liegestützposition auf den Parallettes, Arme gestreckt.', 'Körper langsam nach vorn schieben, Schultern vor die Hände.', 'Schulterblätter auseinander, Körper gerade.', 'Nur so weit, wie die Handgelenke es angenehm erlauben.'],
    easy: 'Nur leicht nach vorn lehnen oder auf den Knien.', hard: 'Weiter nach vorn lehnen, längere Haltezeit.',
    pose: { h: [96, 44], pp: [[82, 64]], l: ['90,48 56,58', '56,58 22,70', '90,48 86,56 82,64'], ar: ['70,40 82,40', '79,37 82,40 79,43'] }
  },

  /* ---------- Unterkörper ---------- */
  squat: {
    name: 'Goblet Squat', cat: 'Unterkörper', m: ['Quadrizeps', 'Po', 'Core'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Eine Hantel senkrecht vor der Brust halten.', 'Füße schulterbreit, Zehen leicht nach außen.', 'Hüfte nach hinten-unten, Knie folgen den Zehen.', 'Brust aufrecht, ganze Fußsohle bleibt am Boden.'],
    easy: 'Ohne Gewicht oder nur bis zu einer Sitzfläche.', hard: 'Pause unten (2 s) oder langsame Absenkphase.',
    pose: { h: [64, 24], l: ['60,31 50,53', '50,53 70,57 62,72', '60,32 64,44 68,36'], dbv: [[68, 36]], ar: ['84,40 84,52', '81,49 84,52 87,49'] }
  },
  sumo: {
    name: 'Sumo Squat', cat: 'Unterkörper', m: ['Adduktoren', 'Po', 'Quadrizeps'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Weiter Stand, Zehen deutlich nach außen.', 'Eine Hantel senkrecht zwischen den Beinen halten.', 'Knie nach außen in Richtung Zehen drücken.', 'Oberkörper aufrecht, gerade nach unten setzen.'],
    easy: 'Ohne Gewicht, geringere Tiefe.', hard: 'Pause unten oder 3 s Absenkphase.',
    pose: { h: [60, 24], l: ['60,31 60,50', '60,50 44,56 40,72', '60,50 76,56 80,72', '60,33 57,45 60,56', '60,33 63,45 60,56'], dbv: [[60, 58]] }
  },
  rdl: {
    name: 'Rumänisches Kreuzheben (RDL)', cat: 'Unterkörper', m: ['Beinbeuger', 'Po', 'Rücken'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Hanteln vor den Oberschenkeln, Knie leicht gebeugt.', 'Hüfte weit nach hinten schieben, Rücken bleibt gerade.', 'Hanteln nah an den Beinen bis ca. Schienbeinmitte.', 'Mit dem Po nach vorn aufrichten, Dehnung hinten spüren.'],
    easy: 'Leichteres Gewicht, geringere Tiefe.', hard: '3 s Absenkphase oder einbeinig (Single-Leg RDL).',
    pose: { h: [86, 30], l: ['79,35 55,44', '55,44 61,58 59,72', '79,35 79,48 79,58'], db: [[79, 58]], ar: ['44,40 48,48', '45,47 48,48 49,45'] }
  },
  lunge: {
    name: 'Ausfallschritte rückwärts', cat: 'Unterkörper', m: ['Quadrizeps', 'Po'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Aus dem Stand einen großen Schritt nach hinten.', 'Hinteres Knie Richtung Boden, vorderes über dem Fuß.', 'Oberkörper aufrecht, Gewicht auf dem vorderen Bein.', 'Über die vordere Ferse zurück in den Stand.'],
    easy: 'Ohne Gewicht, an der Wand festhalten.', hard: 'Mit Hanteln oder Pause unten.',
    pose: { h: [58, 15], l: ['58,22 58,46', '58,46 76,52 76,72', '58,46 50,66 34,71', '58,24 57,36 57,47'], db: [[57, 47]] }
  },
  side_lunge: {
    name: 'Seitliche Ausfallschritte', cat: 'Unterkörper', m: ['Adduktoren', 'Quadrizeps', 'Po'], eq: 'Körpergewicht', lv: 2,
    cues: ['Breiter Schritt zur Seite, Zehen zeigen nach vorn.', 'Hüfte nach hinten auf das gebeugte Bein setzen.', 'Das andere Bein bleibt gestreckt, Fuß am Boden.', 'Über die Ferse zurückdrücken, Seiten wechseln.'],
    easy: 'Kleinerer Schritt, weniger Tiefe.', hard: 'Hantel vor der Brust halten (Goblet).',
    pose: { h: [44, 16], l: ['46,23 50,46', '50,46 40,58 38,72', '50,46 74,60 88,72', '47,26 54,36 50,44'] }
  },
  split_squat: {
    name: 'Split Squats', cat: 'Unterkörper', m: ['Quadrizeps', 'Po'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Feste Schrittstellung, Füße hüftbreit versetzt.', 'Senkrecht nach unten und oben bewegen – Füße bleiben stehen.', 'Vorderes Knie zeigt in Richtung Zehen.', 'Erst ohne Gewicht, dann mit Hanteln an der Seite.'],
    easy: 'Ohne Gewicht, mit Wandkontakt.', hard: 'Hinterer Fuß erhöht (z. B. Stufe) – Bulgarian Split Squat.',
    pose: { h: [58, 11], l: ['58,18 58,42', '58,42 74,54 76,72', '58,42 50,60 36,71', '58,20 57,32 57,44'], db: [[57, 44]], ar: ['90,36 90,48', '87,45 90,48 93,45'] }
  },
  wall_sit: {
    name: 'Wall Sit', cat: 'Unterkörper', m: ['Quadrizeps', 'Po'], eq: 'Körpergewicht', lv: 1,
    cues: ['Rücken an die Wand, Füße ca. 50 cm vor der Wand.', 'Hinunterrutschen, bis Knie etwa 90° gebeugt sind.', 'Knie über den Fersen, Gewicht auf ganzer Fußsohle.', 'Ruhig weiteratmen und halten.'],
    easy: 'Weniger tief sitzen (Knie ca. 120°).', hard: 'Hantel auf die Oberschenkel legen oder länger halten.',
    pose: { h: [45, 20], x: ['M39 -4V73'], l: ['44,27 44,52', '44,52 66,52 66,72', '44,30 52,40 60,48'] }
  },
  glute_bridge: {
    name: 'Glute Bridge', cat: 'Unterkörper', m: ['Po', 'Beinbeuger', 'Core'], eq: 'Körpergewicht', lv: 1,
    cues: ['Rückenlage, Füße hüftbreit nah am Po aufgestellt.', 'Becken leicht einrollen, dann Po anheben.', 'Oben bilden Knie, Hüfte und Schultern eine Linie.', 'Oben 1–2 s halten.'],
    easy: 'Kleinere Bewegung, ohne Pause.', hard: 'Hantel auf die Hüfte oder einbeinig.',
    pose: { h: [18, 66], l: ['25,68 54,52', '54,52 72,48 78,72', '27,69 38,71 48,71'], ar: ['54,40 54,30', '51,33 54,30 57,33'] }
  },
  sl_bridge: {
    name: 'Einbeinige Glute Bridge', cat: 'Unterkörper', m: ['Po', 'Beinbeuger', 'Core'], eq: 'Körpergewicht', lv: 2,
    cues: ['Rückenlage, ein Fuß aufgestellt, das andere Bein gestreckt.', 'Über die Ferse den Po anheben.', 'Becken bleibt waagerecht – nicht zur Seite kippen.', 'Oben kurz halten, langsam ablassen.'],
    easy: 'Beidbeinige Glute Bridge.', hard: 'Hantel auf die Hüfte, oben 3 s halten.',
    pose: { h: [18, 66], l: ['25,68 54,52', '54,52 72,48 78,72', '54,52 78,44 98,38', '27,69 38,71 48,71'] }
  },
  calf: {
    name: 'Wadenheben', cat: 'Unterkörper', m: ['Waden'], eq: 'Kurzhanteln', lv: 1,
    cues: ['Aufrecht stehen, ggf. an einer Wand festhalten.', 'Auf die Fußballen hochdrücken, oben kurz halten.', 'Langsam absenken. Optional auf einer Stufe für mehr Bewegung.', 'Mit oder ohne Hanteln.'],
    easy: 'Ohne Gewicht, beidbeinig.', hard: 'Einbeinig oder mit Hanteln auf einer Stufe.',
    pose: { h: [60, 8], l: ['60,15 60,39', '60,39 60,54 60,67 67,72', '60,17 59,29 59,41'], db: [[59, 41]], ar: ['76,62 76,50', '73,53 76,50 79,53'] }
  },
  sl_rdl: {
    name: 'Einbeiniges Kreuzheben (Single-Leg RDL)', cat: 'Unterkörper', m: ['Beinbeuger', 'Po', 'Core'], eq: 'Kurzhanteln', lv: 2,
    cues: ['Auf einem Bein stehen, Knie leicht gebeugt.', 'Oberkörper nach vorn, freies Bein lang nach hinten.', 'Hüfte bleibt gerade (nicht aufdrehen).', 'Anfangs ohne Gewicht oder mit Wandkontakt üben.'],
    easy: 'Ohne Gewicht, Fingerspitzen an der Wand.', hard: 'Hantel in der Gegenhand, langsame Absenkphase.',
    pose: { h: [90, 36], l: ['83,40 57,44', '57,44 61,58 60,72', '57,44 40,42 24,40', '83,40 83,52 83,60'], db: [[83, 60]] }
  },

  /* ---------- Core / Stabilität ---------- */
  plank: {
    name: 'Plank (Unterarmstütz)', cat: 'Core', m: ['Core', 'Schultern'], eq: 'Körpergewicht', lv: 1,
    cues: ['Ellbogen unter den Schultern, Körper gerade Linie.', 'Po und Bauch anspannen, Becken leicht einrollen.', 'Ruhig weiteratmen.', 'Abbrechen, sobald der untere Rücken durchhängt.'],
    easy: 'Knie am Boden.', hard: 'Ein Bein anheben oder längere Haltezeit.',
    pose: { h: [93, 50], l: ['86,54 52,62', '52,62 20,71', '86,54 86,71 98,71'] }
  },
  side_plank: {
    name: 'Side Plank (Seitstütz)', cat: 'Core', m: ['Core', 'Schultern'], eq: 'Körpergewicht', lv: 1,
    cues: ['Seitlich auf den Unterarm stützen, Ellbogen unter der Schulter.', 'Hüfte hoch, Körper bildet eine Linie.', 'Kopf in Verlängerung der Wirbelsäule.', 'Beide Seiten gleich lang halten.'],
    easy: 'Unteres Knie abstellen.', hard: 'Oberes Bein anheben oder Hantel in der oberen Hand.',
    pose: { h: [90, 40], l: ['83,46 52,60', '52,60 18,71', '83,46 83,71 92,71', '83,46 72,50 60,58'] }
  },
  dead_bug: {
    name: 'Dead Bug', cat: 'Core', m: ['Core'], eq: 'Körpergewicht', lv: 1,
    cues: ['Rückenlage, Arme zur Decke, Beine im 90°-Winkel.', 'Unterer Rücken bleibt flach am Boden.', 'Gegengleich Arm und Bein langsam strecken, ausatmen.', 'Zurück zur Mitte, Seite wechseln.'],
    easy: 'Nur die Beine oder nur die Arme bewegen.', hard: 'Leichte Hantel in den Händen, langsamer.',
    pose: { h: [20, 64], l: ['27,66 56,66', '56,66 56,50 70,50', '56,66 80,62 98,64', '31,66 31,47', '30,66 12,54'] }
  },
  bird_dog: {
    name: 'Bird Dog', cat: 'Core', m: ['Core', 'Rücken', 'Po'], eq: 'Körpergewicht', lv: 1,
    cues: ['Vierfüßlerstand: Hände unter Schultern, Knie unter Hüfte.', 'Gegengleich Arm und Bein lang nach vorn/hinten strecken.', 'Becken bleibt waagerecht – nicht kippen.', 'Kurz halten, langsam zurück, Seite wechseln.'],
    easy: 'Nur das Bein oder nur den Arm strecken.', hard: '3 s halten, Ellbogen und Knie unter dem Bauch zusammenführen.',
    pose: { h: [94, 44], l: ['86,50 52,50', '86,50 86,72', '52,50 52,72 40,72', '52,50 34,48 18,47', '86,50 100,46 114,44'] }
  },
  hollow: {
    name: 'Hollow Body Hold', cat: 'Core', m: ['Core'], eq: 'Körpergewicht', lv: 2,
    cues: ['Rückenlage, unteren Rücken fest in den Boden drücken.', 'Schultern und Beine leicht anheben.', 'Arme nach hinten strecken – Körper wie eine flache Banane.', 'Sobald der Rücken abhebt: Position erleichtern.'],
    easy: 'Knie angewinkelt (Tuck Hollow), Arme neben dem Körper.', hard: 'Beine und Arme tiefer, längere Haltezeit.',
    pose: { h: [30, 58], l: ['36,62 58,68', '58,68 80,62 100,56', '36,62 22,54 10,50'] }
  },
  superman: {
    name: 'Superman', cat: 'Core', m: ['Rücken', 'Po', 'Schultern'], eq: 'Körpergewicht', lv: 1,
    cues: ['Bauchlage, Arme nach vorn gestreckt.', 'Arme, Brust und Beine leicht vom Boden abheben.', 'Blick zum Boden, Nacken lang.', 'Kurz halten, kontrolliert ablegen.'],
    easy: 'Nur Arme oder nur Beine anheben.', hard: 'Längere Haltezeit oder Arme in Y-/T-Position bewegen.',
    pose: { h: [88, 62], l: ['82,66 52,70', '52,70 34,66 18,62', '84,64 98,58 110,54'] }
  },
  bear: {
    name: 'Bear Plank (Bärenstand)', cat: 'Core', m: ['Core', 'Schultern', 'Quadrizeps'], eq: 'Körpergewicht', lv: 1,
    cues: ['Vierfüßlerstand, Zehen aufgestellt.', 'Knie wenige Zentimeter vom Boden abheben.', 'Rücken gerade, Bauch fest.', 'Ruhig weiteratmen und halten.'],
    easy: 'Kürzere Haltezeit, Knie nur kurz anheben.', hard: 'Abwechselnd eine Hand kurz abheben.',
    pose: { h: [94, 44], l: ['86,50 52,50', '86,50 86,72', '52,50 54,66 40,72'] }
  },

  /* ---------- Cardio ---------- */
  run_easy: {
    name: 'Grundlagenlauf (locker)', cat: 'Cardio', m: ['Ausdauer', 'Waden'], eq: 'Körpergewicht', lv: 1,
    cues: ['Tempo so, dass du dich noch unterhalten kannst.', 'Kleine, lockere Schritte, aufrechter Oberkörper.', 'Bei Bedarf Gehpausen einbauen (z. B. 3 min laufen / 1 min gehen).', 'Baut die Grundlagenausdauer auf – der wichtigste Laufbaustein.'],
    easy: 'Mehr Gehpausen (2 min laufen / 2 min gehen).', hard: 'Länger laufen (bis 45 min), Tempo bleibt locker.',
    pose: { h: [62, 11], l: ['60,18 56,42', '56,42 66,54 62,68', '56,42 48,56 36,58', '60,22 68,30 74,24', '60,22 52,30 46,36'] }
  },
  run_interval: {
    name: 'Intervall-Lauf (VO2max)', cat: 'Cardio', m: ['Ausdauer', 'Quadrizeps', 'Waden'], eq: 'Körpergewicht', lv: 2,
    cues: ['Intervalle zügig: ca. 8 von 10 Anstrengung, Tempo über alle Intervalle gleichmäßig halten.', 'Vorher 10 min locker einlaufen.', 'Pausen locker traben oder gehen, bis sich die Atmung beruhigt.', 'Danach 5–10 min auslaufen. Erst nach einigen Wochen lockerem Laufen einsetzen.'],
    easy: '4 × 2 min zügig, je 2 min gehen.', hard: '5–6 × 3–4 min zügig, je 2 min traben.',
    pose: { h: [66, 12], x: ['M18 28H32', 'M14 38H30', 'M20 48H32'], l: ['63,19 55,42', '55,42 68,52 64,68', '55,42 44,54 32,52', '62,23 72,30 78,22', '62,23 52,28 44,34'] }
  },
  run_long: {
    name: 'Long Run (langer, ruhiger Lauf)', cat: 'Cardio', m: ['Ausdauer', 'Waden'], eq: 'Körpergewicht', lv: 2,
    cues: ['Sehr ruhig und gleichmäßig – eher langsamer als beim normalen Lauf.', 'Etwa 10–20 min länger als dein üblicher Lauf.', 'Gehpausen und Trinken sind erlaubt.', 'Dauer von Woche zu Woche nur langsam steigern (max. ca. 10 %).'],
    easy: '40 min mit Gehpausen.', hard: '60–75 min am Stück.',
    pose: { h: [62, 11], x: ['M8 66H22', 'M30 66H44', 'M84 66H98', 'M106 66H116'], l: ['60,18 57,42', '57,42 64,55 61,70', '57,42 51,56 42,60', '60,22 66,32 72,28', '60,22 54,32 50,38'] }
  },
  run_strides: {
    name: 'Steigerungsläufe', cat: 'Cardio', m: ['Ausdauer', 'Waden', 'Beinbeuger'], eq: 'Körpergewicht', lv: 2,
    cues: ['Am Ende eines lockeren Laufs 4–6 × 80–100 m.', 'Locker beginnen und gleichmäßig bis ca. 90 % beschleunigen.', 'Die letzten Meter austrudeln lassen, zurückgehen.', 'Verbessert Technik und Schnelligkeit ohne große Ermüdung.'],
    easy: '3–4 Läufe, nur bis ca. 80 % beschleunigen.', hard: '6–8 Läufe.',
    pose: { h: [64, 12], l: ['62,19 56,42', '56,42 67,53 63,68', '56,42 45,55 33,54', '61,23 70,29 76,22', '61,23 52,29 45,35'], ar: ['82,40 100,40', '96,37 100,40 96,43'] }
  },
  burpees: {
    name: 'Burpees', cat: 'Cardio', m: ['Ausdauer', 'Brust', 'Quadrizeps', 'Core'], eq: 'Körpergewicht', lv: 2,
    cues: ['Aus dem Stand in die Hocke, Hände vor den Füßen auf den Boden.', 'Beine nach hinten in die Liegestützposition springen oder steigen.', 'Füße zurück zu den Händen, aufrichten und kurz hochspringen.', 'Gleichmäßiges Tempo, Rücken gerade, weich landen.'],
    easy: 'Ohne Sprung, Beine nacheinander zurücksetzen.', hard: 'Mit Liegestütz am Boden.',
    pose: { h: [60, 9], l: ['60,16 60,40', '60,40 58,55 58,68', '60,40 62,55 62,68', '60,18 54,6 52,-2', '60,18 66,6 68,-2'], ar: ['80,40 80,28', '77,31 80,28 83,31'] }
  },
  high_knees: {
    name: 'Kniehebelauf (High Knees)', cat: 'Cardio', m: ['Ausdauer', 'Core', 'Quadrizeps'], eq: 'Körpergewicht', lv: 1,
    cues: ['Auf der Stelle laufen, Knie bis etwa Hüfthöhe.', 'Auf den Fußballen bleiben, Arme schwingen mit.', 'Oberkörper aufrecht.', 'In Intervallen, z. B. 20–30 s.'],
    easy: 'Im Gehen mit hohen Knien.', hard: 'Schneller oder längere Intervalle.',
    pose: { h: [60, 11], l: ['60,18 60,42', '60,42 60,57 60,72', '60,42 74,42 72,56', '60,20 68,28 72,22', '60,20 54,30 50,36'] }
  },
  squat_jumps: {
    name: 'Hocksprünge (Squat Jumps)', cat: 'Cardio', m: ['Ausdauer', 'Quadrizeps', 'Po', 'Waden'], eq: 'Körpergewicht', lv: 2,
    cues: ['Hüftbreit stehen, in eine halbe Kniebeuge gehen.', 'Explosiv nach oben springen.', 'Weich landen, Knie zeigen Richtung Zehen.', 'Bei Knie- oder Sprunggelenksbeschwerden weglassen.'],
    easy: 'Kniebeuge mit Wadenheben statt Sprung.', hard: 'Tiefer starten, mehr Wiederholungen.',
    pose: { h: [64, 24], l: ['60,31 50,53', '50,53 70,57 62,72', '60,32 70,38 78,36'], ar: ['90,52 90,38', '87,41 90,38 93,41'] }
  },
  climbers: {
    name: 'Mountain Climbers', cat: 'Cardio', m: ['Ausdauer', 'Core', 'Schultern'], eq: 'Körpergewicht', lv: 2,
    cues: ['Liegestützposition, Hände unter den Schultern.', 'Abwechselnd die Knie zur Brust ziehen.', 'Hüfte bleibt tief, Rumpf fest.', 'Erst langsam, dann zügiger.'],
    easy: 'Langsam im Wechsel tippen, Hände erhöht.', hard: 'Schnelleres Tempo, längere Intervalle.',
    pose: { h: [94, 44], l: ['86,48 54,58', '54,58 20,71', '54,58 72,64 66,72', '86,48 86,72'] }
  }
};

// Standard-Vorlagen. Format: [Übung, Sätze, Wiederholungen/Zeit]
const DEFAULT_TEMPLATES = [
  { id: 'OA', name: 'Oberkörper A', cat: 'Oberkörper', items: [
    ['floor_press', 3, '8–12'], ['row1', 3, '10–12 je Seite'], ['pp_pushup', 2, '6–12'],
    ['lat_raise', 2, '12–15'], ['curl', 2, '10–12'], ['oh_tri', 2, '10–12'], ['plank', 2, '20–40 s']] },
  { id: 'UA', name: 'Unterkörper A', cat: 'Unterkörper', items: [
    ['squat', 3, '10–12'], ['rdl', 3, '10–12'], ['lunge', 2, '8–10 je Seite'],
    ['glute_bridge', 2, '12–15'], ['calf', 2, '12–20'], ['dead_bug', 2, '6–8 je Seite']] },
  { id: 'OB', name: 'Oberkörper B', cat: 'Oberkörper', items: [
    ['ohp', 3, '8–12'], ['row1', 3, '10–12 je Seite'], ['rev_dip', 2, '6–12'],
    ['pp_pushup', 2, '6–12'], ['hammer', 2, '10–12'], ['side_plank', 2, '15–30 s je Seite'], ['pp_support', 3, '10–20 s']] },
  { id: 'UB', name: 'Unterkörper B', cat: 'Unterkörper', items: [
    ['split_squat', 3, '8–10 je Seite'], ['sl_rdl', 3, '8–10 je Seite'], ['squat', 2, '12–15'],
    ['glute_bridge', 2, '12–15'], ['calf', 2, '15–20'], ['bird_dog', 2, '6–8 je Seite']] },
  { id: 'GK', name: 'Ganzkörper Calisthenics', cat: 'Calisthenics', items: [
    ['scap_pushup', 2, '8–10'], ['pp_pushup', 3, '6–12'], ['pike_pushup', 3, '5–8'], ['superman', 3, '8–10'],
    ['split_squat', 3, '8–10 je Seite'], ['hollow', 3, '15–30 s'], ['tuck_lsit', 3, '5–15 s']] },
  { id: 'RG', name: 'Grundlagenlauf', cat: 'Cardio', dur: 35, note: 'Locker laufen – Tempo so, dass du dich noch unterhalten kannst. Bei Bedarf Gehpausen einbauen.', items: [
    ['run_easy', 1, '25–35 min']] },
  { id: 'RV', name: 'Intervall-Lauf (VO2max)', cat: 'Cardio', dur: 40, note: 'Intensive Einheit: höchstens 1× pro Woche. Für den Einstieg die leichtere Variante (4 × 2 min) nutzen.', items: [
    ['run_easy', 1, '10 min einlaufen'], ['run_interval', 1, '4–5 × 3 min zügig, je 2 min traben'], ['run_easy', 1, '5–10 min auslaufen']] },
  { id: 'RL', name: 'Long Run', cat: 'Cardio', dur: 55, note: 'Langsam und gleichmäßig. Dauer nur schrittweise steigern.', items: [
    ['run_long', 1, '45–60 min'], ['run_strides', 1, 'optional 4 × 80 m am Ende']] }
];

const RUN_HINT = 'Locker laufen, 20–30 Minuten. Tempo so, dass du dich noch unterhalten kannst. Bei Bedarf Gehpausen einbauen (z. B. 3 min laufen / 1 min gehen).';
const TRAINING_HINT = 'Vor dem Training 5 min aufwärmen (Mobilisation, leichte Sätze). 60–90 s Pause zwischen den Sätzen. Gewicht so wählen, dass am Satzende noch 1–3 saubere Wiederholungen möglich wären.';

function figureSVG(p) {
  if (!p) return '';
  let s = '<svg viewBox="0 -6 120 82" aria-hidden="true"><line class="fl" x1="4" y1="73" x2="116" y2="73"/>';
  (p.x || []).forEach(d => { s += `<path class="eq" d="${d}"/>`; });
  (p.pp || []).forEach(([x, y]) => {
    s += `<path class="eq" d="M${x - 9} ${y}H${x + 9}M${x - 7} ${y}L${x - 9} 73M${x + 7} ${y}L${x + 9} 73"/>`;
  });
  (p.l || []).forEach(pts => { s += `<polyline class="bd" points="${pts}"/>`; });
  s += `<circle class="hd" cx="${p.h[0]}" cy="${p.h[1]}" r="5.5"/>`;
  (p.db || []).forEach(([x, y]) => { s += `<path class="db" d="M${x - 6} ${y}H${x + 6}M${x - 5} ${y - 3}V${y + 3}M${x + 5} ${y - 3}V${y + 3}"/>`; });
  (p.dbv || []).forEach(([x, y]) => { s += `<path class="db" d="M${x} ${y - 6}V${y + 6}M${x - 3} ${y - 5}H${x + 3}M${x - 3} ${y + 5}H${x + 3}"/>`; });
  (p.ar || []).forEach(pts => { s += `<polyline class="ar" points="${pts}"/>`; });
  return s + '</svg>';
}
// Platzhalter-Illustration für eigene Übungen ohne Pose
const CUSTOM_POSE = { h: [60, 11], l: ['60,18 60,42', '60,42 55,57 54,72', '60,42 65,57 66,72', '60,20 50,32 48,44', '60,20 70,32 72,44'] };
