import fs from 'node:fs';

const base = new URL('./', import.meta.url);
const read = (name) => JSON.parse(fs.readFileSync(new URL(name, base), 'utf8'));
const catalog = read('catalog.json');
const locales = read('apple-locales.json');
const instructions = read('testflight-2.4.7.json');

if (Object.keys(instructions).sort().join() !== Object.keys(locales).sort().join()) {
  throw new Error('TestFlight instructions must cover every supported Apple locale.');
}
for (const [language, copy] of Object.entries(catalog)) {
  const note = instructions[language];
  if (!copy.description || copy.description.length > 4000 || (note && note.length > 4000)) {
    throw new Error(`Invalid TestFlight copy: ${language}`);
  }
  const locale = locales[language]?.[0] ?? 'Not supported by App Store Connect; prepared for future use.';
  const text = `# AirCapital · TestFlight · ${language}\n\nLocale: ${locale}\n\n## Beta app description\n\n${copy.description}\n\n## Feedback email\n\ntimofii.shkabrov@gmail.com\n\n## Marketing URL\n\nhttps://aircapital.app\n\n## Privacy policy URL\n\nhttps://aircapital.app/privacy\n`;
  const build = note ? `\n## What to test — 2.4.7 (11)\n\n${note}\n` : '';
  fs.writeFileSync(new URL(`${language}/testflight.md`, base), text + build);
}
console.log(`Validated ${Object.keys(catalog).length} beta descriptions and ${Object.keys(instructions).length} build instructions.`);
