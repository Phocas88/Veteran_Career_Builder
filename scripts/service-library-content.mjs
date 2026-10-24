// Extract plain text from the company's generated MOS guide structure. Never
// embed guide HTML/scripts, salary figures or branch emblems in the workspace.
export function guideText(value=''){
 return value.replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):Number(v);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';})
  .replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[v]).replace(/\s+/g,' ').trim();
}
export function guideReference(html){
 const header=html.match(/<header[^>]*>([\s\S]*?)<\/header>/i)?.[1]||'';
 const intro=guideText(header.match(/<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/i)?.[1]);
 const [branch='',code='']=guideText(header.match(/<p class="eyebrow">([\s\S]*?)<\/p>/i)?.[1]).split('·').map(v=>v.trim());
 const paths=[];
 const paragraphs=(article,cls)=>guideText(article.match(new RegExp('<p class="'+cls+'">([\\s\\S]*?)<\\/p>','i'))?.[1]).replace(/^(?:Why it fits|What it takes|Typical entry):\s*/i,'');
 const block=html.match(/<div class="paths">([\s\S]*?)<\/section>/i)?.[1];
 for(const m of (block||'').matchAll(/<article>([\s\S]*?)<\/article>/gi)){
  const article=m[1];paths.push({name:guideText(article.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]),sector:guideText(article.match(/<small>([\s\S]*?)<\/small>/i)?.[1]),why:paragraphs(article,'why'),bridge:paragraphs(article,'bridge'),href:article.match(/<a href="([^"]+)">Explore this route/i)?.[1]||''});
 }
 if(!paths.length)for(const m of html.matchAll(/<article class="(?:closest|related)">([\s\S]*?)<\/article>/gi)){
  const article=m[1];paths.push({name:guideText(article.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1]),sector:'Civilian occupation',why:paragraphs(article,'why'),bridge:paragraphs(article,'prep'),href:article.match(/<a href="(\/[^"#]+\.html)"/i)?.[1]||''});
 }
 const source=html.match(/<section class="sources">([\s\S]*?)<\/section>/i)?.[1]||'';
 const citations=[...source.matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map(m=>({url:m[1],label:guideText(m[2])}));
 return {branch,code,intro,paths:paths.filter(p=>p.name),citations};
}
