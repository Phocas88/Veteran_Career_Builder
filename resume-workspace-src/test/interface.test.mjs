import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
test('static interface controls exist once, so a removed control cannot stop the app starting',async()=>{
 const root=new URL('../public/',import.meta.url),html=await readFile(new URL('index.html',root),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate interface ID');
 const generated=new Set(['builder-name','builder-personal']);
 for(const file of await readdir(root))if(file.endsWith('.js')){
  const source=await readFile(new URL(file,root),'utf8');for(const m of source.matchAll(/\$\(['"]([^'"]+)['"]\)/g))assert.ok(ids.includes(m[1])||generated.has(m[1]),`${file} references missing #${m[1]}`);
 }
});
