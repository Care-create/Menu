const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { XMLParser } = require('fast-xml-parser');
const { Pool } = require('pg');

// Datenbankverbindung zum Hetzner-Server
const pool = new Pool({
  host: '167.233.111.32',
  port: 5432,
  database: 'menudb',
  user: 'menuuser',
  password: 'menu2026x',
});

const MENU_BASE_PATH = 'C:\\MenuKarten';

const SAISON_MAP = {
  12: 'Winter', 1: 'Winter', 2: 'Winter',
  3: 'Frühling', 4: 'Frühling', 5: 'Frühling',
  6: 'Sommer', 7: 'Sommer', 8: 'Sommer',
  9: 'Herbst', 10: 'Herbst', 11: 'Herbst',
};

function extractParagraphsFromDocx(filePath) {
  try {
    const zip = new AdmZip(filePath);
    const xmlContent = zip.readAsText('word/document.xml');
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xmlContent);

    const paragraphs = [];

    function getParagraphs(obj) {
      if (!obj || typeof obj !== 'object') return;
      if (obj['w:p']) {
        const ps = Array.isArray(obj['w:p']) ? obj['w:p'] : [obj['w:p']];
        for (const p of ps) {
          const texts = [];
          function getTexts(o) {
            if (!o || typeof o !== 'object') return;
            if (o['w:t']) {
              const t = o['w:t'];
              if (typeof t === 'string') texts.push(t);
              else if (typeof t === 'object' && t['#text']) texts.push(t['#text']);
            }
            for (const k of Object.keys(o)) getTexts(o[k]);
          }
          getTexts(p);
          const line = texts.join('').trim();
          if (line.length > 0) paragraphs.push(line);
        }
      }
      for (const key of Object.keys(obj)) {
        if (key !== 'w:p') getParagraphs(obj[key]);
      }
    }

    getParagraphs(parsed);
    return paragraphs;
  } catch (e) {
    return null;
  }
}

function parseDatumFromFilename(filename) {
  const match = filename.match(/(\d{2})\.(\d{2})\.(\d{2,4})/);
  if (!match) return null;
  const [, tag, monat, jahr] = match;
  const vollJahr = jahr.length === 2 ? `20${jahr}` : jahr;
  return {
    datum: `${vollJahr}-${monat}-${tag}`,
    monat: parseInt(monat),
    saison: SAISON_MAP[parseInt(monat)],
  };
}

function erkenneMenütyp(filename) {
  if (filename.includes('HP4')) return 'HP4';
  if (filename.includes('HP3')) return 'HP3';
  if (filename.includes('Kinder')) return 'Kinder';
  return 'Standard';
}

function extrahiereGerichte(paragraphs, datum, saison, menütyp) {
  const gerichte = [];

  // Menü-Abschnitt finden
  const menüStart = paragraphs.findIndex(p =>
    /(?:Unser\s+)?Abendmenü|MENÜ|Abend.{0,5}menü/i.test(p)
  );
  if (menüStart === -1) return gerichte;

  const tokens = paragraphs.slice(menüStart).filter(t => t.length > 2 && t.length < 120);

  const FORTSETZUNG = ['mit', 'und', 'von', 'auf', 'an', 'in', 'im', 'zum', 'zur', 'aus', 'oder', 'sowie', 'dazu', 'frische', 'frischer', 'buntes', 'buntem'];

  const kategorieMarker = {
    'Vorspeise': ['salat', 'carpaccio', 'terrine', 'tatar', 'bruschetta', 'feldsalat', 'vorspeise'],
    'Suppe': ['suppe', 'süppchen', 'consommé', 'cremesuppe'],
    'Hauptgang': ['filet', 'braten', 'schnitzel', 'steak', 'lachs', 'burger', 'truthahn', 'hähnchen', 'rücken', 'scholle', 'sellerie', 'hauptgang'],
    'Dessert': ['soufflé', 'mousse', 'torte', 'crème', 'parfait', 'souflee', 'dessert'],
  };

  let aktuelleKategorie = null;
  let aktuellGericht = [];

  const gerichtHinzufügen = () => {
    if (aktuellGericht.length > 0 && aktuelleKategorie) {
      const name = aktuellGericht.join(' ').trim();
      if (name.length > 5) {
        gerichte.push({ name, kategorie: aktuelleKategorie, saison, datum, menütyp });
      }
    }
    aktuellGericht = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const lower = token.toLowerCase();

    // Kategorie erkennen
    let neueKategorie = null;
    for (const [kat, keywords] of Object.entries(kategorieMarker)) {
      if (keywords.some(k => lower.includes(k))) {
        neueKategorie = kat;
        break;
      }
    }

    if (neueKategorie) {
      // Wenn gleiche Kategorie und aktuelles Gericht schon Inhalt hat → neues Gericht
      if (neueKategorie === aktuelleKategorie && aktuellGericht.length > 0) {
        gerichtHinzufügen();
      } else if (neueKategorie !== aktuelleKategorie) {
        gerichtHinzufügen();
        aktuelleKategorie = neueKategorie;
      }
      aktuellGericht.push(token);
    } else if (aktuelleKategorie) {
      const istFortsetzung = FORTSETZUNG.some(f => lower.startsWith(f + ' ') || lower === f);
      const beginntMitGross = /^[A-ZÄÖÜ]/.test(token);

      if (!istFortsetzung && beginntMitGross && aktuellGericht.length >= 2) {
        // Neues Gericht in gleicher Kategorie
        gerichtHinzufügen();
        aktuellGericht.push(token);
      } else {
        aktuellGericht.push(token);
      }
    }
  }
  gerichtHinzufügen();

  return gerichte;
}

async function importiereAlleKarten() {
  console.log('Verbinde mit Datenbank...');
  await pool.query('SELECT 1');
  console.log('Datenbankverbindung OK!');

  // Alte Daten löschen
  await pool.query('DELETE FROM gerichte');
  console.log('Alte Gerichte gelöscht.');

  let dateiCount = 0;
  let gerichtCount = 0;
  const fehler = [];

  async function scanOrdner(ordner) {
    const eintraege = fs.readdirSync(ordner, { withFileTypes: true });
    for (const eintrag of eintraege) {
      const vollPfad = path.join(ordner, eintrag.name);
      if (eintrag.isDirectory()) {
        await scanOrdner(vollPfad);
      } else if (eintrag.name.endsWith('.docx') && !eintrag.name.startsWith('~')) {
        const datumInfo = parseDatumFromFilename(eintrag.name);
        if (!datumInfo) continue;

        const paragraphs = extractParagraphsFromDocx(vollPfad);
        if (!paragraphs) continue;

        const menütyp = erkenneMenütyp(eintrag.name);
        const gerichte = extrahiereGerichte(paragraphs, datumInfo.datum, datumInfo.saison, menütyp);

        for (const g of gerichte) {
          try {
            await pool.query(
              'INSERT INTO gerichte (name, kategorie, saison, datum, menuetyp) VALUES ($1, $2, $3, $4, $5)',
              [g.name, g.kategorie, g.saison, g.datum, g.menütyp]
            );
            gerichtCount++;
          } catch (e) {
            fehler.push(`${eintrag.name}: ${e.message}`);
          }
        }

        dateiCount++;
        process.stdout.write(`\rVerarbeitet: ${dateiCount} Dateien | ${gerichtCount} Gerichte`);
      }
    }
  }

  console.log('\nStarte Import...');
  await scanOrdner(MENU_BASE_PATH);

  console.log(`\n\nImport abgeschlossen!`);
  console.log(`  Dateien verarbeitet: ${dateiCount}`);
  console.log(`  Gerichte importiert: ${gerichtCount}`);
  if (fehler.length > 0) console.log(`  Fehler: ${fehler.length}`);

  await pool.end();
}

importiereAlleKarten().catch(console.error);
