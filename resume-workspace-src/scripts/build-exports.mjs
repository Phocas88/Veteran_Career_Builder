import { build } from 'esbuild';
import { mkdir, writeFile, cp, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const vendor = path.join(root, 'public/vendor');
await mkdir(vendor, { recursive: true });
const studioVfs={},studioFonts={};
for(const [family,pkg,prefix]of [['Lato','@fontsource/lato','lato'],['SourceSerif','@fontsource/source-serif-4','source-serif-4']]){
 const packageRoot=path.join(root,'node_modules',pkg);studioFonts[family]={};
 for(const [style,weight,variant]of [['normal',400,'normal'],['bold',700,'normal'],['italics',400,'italic'],['bolditalics',700,'italic']]){
  const source=path.join(packageRoot,'files',`${prefix}-latin-${weight}-${variant}.woff`),name=`${family}-${style}.woff`;
  const bytes=await readFile(source);studioVfs[name]=bytes.toString('base64');studioFonts[family][style]=name;await writeFile(path.join(vendor,name),bytes);
 }
 await cp(path.join(packageRoot,'LICENSE'),path.join(vendor,`${family}-FONT-LICENSE.txt`));
}
const entry=`import pdfMake from 'pdfmake/build/pdfmake.js';import fonts from 'pdfmake/build/vfs_fonts.js';pdfMake.addVirtualFileSystem({...fonts,...${JSON.stringify(studioVfs)}});pdfMake.addFonts(${JSON.stringify(studioFonts)});export{pdfMake};`;
await build({stdin:{contents:entry,resolveDir:root,sourcefile:'pdf-export-entry.js'},outfile:path.join(vendor,'pdf-export.mjs'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'eof'});
await build({ stdin: { contents: "export { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun, Footer, PageNumber } from 'docx';", resolveDir: root, sourcefile: 'word-export-entry.js' }, outfile: path.join(vendor, 'word-export.mjs'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true, legalComments: 'eof' });
const fonts = require('pdfmake/build/vfs_fonts.js');
for (const file of ['Roboto-Regular.ttf','Roboto-Medium.ttf','Roboto-Italic.ttf','Roboto-MediumItalic.ttf']) {
  if (!fonts[file]) throw new Error(`Missing preview font: ${file}`);
  await writeFile(path.join(vendor, file), Buffer.from(fonts[file], 'base64'));
}
for (const name of ['pdfmake', 'docx']) {
  const packageRoot = name === 'docx' ? path.resolve(path.dirname(require.resolve(name)), '..') : path.dirname(require.resolve(`${name}/package.json`));
  await cp(path.join(packageRoot, 'LICENSE'), path.join(vendor, `${name.toUpperCase()}-LICENSE.txt`));
}
console.log('Built self-hosted PDF and Word exporters and matching preview fonts.');
