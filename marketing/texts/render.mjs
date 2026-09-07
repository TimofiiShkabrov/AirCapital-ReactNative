import fs from 'node:fs';
const base = new URL('./', import.meta.url);
const catalog = JSON.parse(fs.readFileSync(new URL('catalog.json', base)));
const playLocales = JSON.parse(fs.readFileSync(new URL('google-play-locales.json',base))); 
export const appleLocales = {en:['en-US','английский (США)'],es:['es-ES','испанский (Испания)'],de:['de-DE','немецкий'],nb:['no','норвежский'],ru:['ru','русский'],uk:['uk','украинский'],fr:['fr-FR','французский'],pl:['pl','польский'],cs:['cs','чешский'],da:['da','датский'],el:['el','греческий'],fi:['fi','финский'],hr:['hr','хорватский'],hu:['hu','венгерский'],it:['it','итальянский'],nl:['nl-NL','нидерландский'],pt:['pt-PT','португальский (Португалия)'],ro:['ro','румынский'],sk:['sk','словацкий'],sl:['sl','словенский'],sv:['sv','шведский'],ar:['ar-SA','арабский']};
for (const [language, copy] of Object.entries(catalog)) {
  for (const [key, max] of Object.entries({subtitle:30,short:80,promo:170,keywords:100,description:4000})) {
    if (!copy[key] || copy[key].length>max) throw new Error(`${language}.${key}: ${copy[key]?.length}/${max}`);
  }
  const folder = new URL(`${language}/`, base); fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(new URL('app-store.md',folder), `# AirCapital · App Store · ${language}\n\nLocale: ${appleLocales[language]?.[0]??'Not supported by App Store Connect; copy prepared for future use.'}\n\n## Name\n\nAirCapital\n\n## Subtitle\n\n${copy.subtitle}\n\n## Promotional text\n\n${copy.promo}\n\n## Description\n\n${copy.description}\n\n## Keywords\n\n${copy.keywords}\n\n## Support URL\n\nhttps://aircapital.app/contact\n\n## Marketing URL\n\nhttps://aircapital.app\n\n## Privacy policy URL (publish and verify before registering)\n\nhttps://aircapital.app/privacy\n\n## Privacy choices URL (publish and verify before registering)\n\nhttps://aircapital.app/data-deletion\n\n## Copyright\n\n2026 Timofii Shkabrov\n`);
  fs.writeFileSync(new URL('google-play.md',folder), `# AirCapital · Google Play · ${language}\n\nLocale: ${playLocales[language]?.split(" – ").at(-1)??"Not supported by Google Play Console; copy prepared for future use."}\n\n## App name\n\nAirCapital\n\n## Short description\n\n${copy.short}\n\n## Full description\n\n${copy.description}\n\n## Website\n\nhttps://aircapital.app\n\n## Support email\n\ntimofii.shkabrov@gmail.com\n\n## Privacy policy URL (publish and verify before registering)\n\nhttps://aircapital.app/privacy\n\n## Data deletion URL (no AirCapital account; publish and verify first)\n\nhttps://aircapital.app/data-deletion\n`);
}
fs.writeFileSync(new URL('apple-locales.json',base),JSON.stringify(appleLocales,null,2)+'\n');
console.log(`Validated ${Object.keys(catalog).length} languages; generated 62 Markdown files.`);
