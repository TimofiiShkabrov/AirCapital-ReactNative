import fs from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
const root = new URL('../../', import.meta.url);
const operator = JSON.parse(fs.readFileSync(new URL('src/web/legal/operator.json',root)));
const code = ts.transpileModule(fs.readFileSync(new URL('src/web/legal/documents.ts',root),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
const exports = {};
vm.runInNewContext(code, {exports,require:()=>operator});
for (const [slug, doc] of Object.entries(exports.legalDocuments)) {
  const content = `# ${doc.title}\n\n${exports.legalReady?'':'DRAFT — operator details awaiting confirmation. Do not register this draft in stores.\n\n'}Updated: ${exports.legalDate}\n\n${doc.summary}\n\n${doc.sections.map(s=>`## ${s.title}\n\n${s.paragraphs.join('\n\n')}${s.links?'\n\n'+s.links.map(l=>`- [${l.label}](${l.href.startsWith('/')?'https://aircapital.app'+l.href:l.href})`).join('\n'):''}`).join('\n\n')}\n`;
  fs.writeFileSync(new URL(`${slug}.md`,import.meta.url),content);
}
console.log(`Generated 5 legal documents. Publication ready: ${!!exports.legalReady}`);
if(process.argv.includes('--check-ready')&&!exports.legalReady)process.exitCode=1;
