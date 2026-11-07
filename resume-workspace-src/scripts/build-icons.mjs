// Package the existing VCP artwork for browsers and device launchers.
import {readFile,writeFile} from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const root=new URL('../public/',import.meta.url),brand=await readFile(new URL('brand.svg',root),'utf8');
let original;
try{original=await readFile(new URL('../../img/optimized/logo-512.png',import.meta.url));}
catch(error){if(error.code!=='ENOENT')throw error;const embedded=brand.match(/data:image\/webp;base64,([^\"]+)/);if(!embedded)throw new Error('Missing VCP logo artwork');original=Buffer.from(embedded[1],'base64');}
const logo=await loadImage(original);
function png(size,{background=false,maskable=false}={}){
 const canvas=createCanvas(size,size),ctx=canvas.getContext('2d');
 if(background){ctx.fillStyle='#f7f3e9';ctx.fillRect(0,0,size,size);}
 let scale=Math.min(size/logo.width,size/logo.height);
 if(maskable){
  // All visible artwork must fit within Android's central safe circle.
  const source=createCanvas(logo.width,logo.height),sourceCtx=source.getContext('2d');sourceCtx.drawImage(logo,0,0);
  const pixels=sourceCtx.getImageData(0,0,logo.width,logo.height).data;let radius=1;
  for(let y=0;y<logo.height;y++)for(let x=0;x<logo.width;x++)if(pixels[(y*logo.width+x)*4+3]>0)radius=Math.max(radius,Math.hypot(x-logo.width/2,y-logo.height/2));
  scale=Math.min(scale,size*.38/radius);
 }
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const width=logo.width*scale,height=logo.height*scale;ctx.drawImage(logo,(size-width)/2,(size-height)/2,width,height);
 return canvas.toBuffer('image/png');
}
for(const size of [192,512])await writeFile(new URL('app-icon-'+size+'.png',root),png(size));
await writeFile(new URL('apple-touch-icon.png',root),png(180,{background:true}));
await writeFile(new URL('app-icon-maskable-512.png',root),png(512,{background:true,maskable:true}));
await writeFile(new URL('favicon-32.png',root),png(32));
// PNG-backed ICO entries are supported by current browsers and Windows.
const sizes=[16,32,48],images=sizes.map(size=>png(size)),header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
for(let i=0;i<sizes.length;i++){const at=6+i*16;header[at]=sizes[i];header[at+1]=sizes[i];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(images[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=images[i].length;}
await writeFile(new URL('favicon.ico',root),Buffer.concat([header,...images]));
await writeFile(new URL('icon.svg',root),brand);
console.log('Prepared VCP favicons and installation icons from the existing logo.');
