// One visible entry per purchased design. The purchase record remains available
// even when the optional account-library copy could not sync.
export function purchasedResumeItems(builds=[]){
 return builds.flatMap(build=>{
  if(!build||!['paid','complete','running'].includes(build.status))return [];
  const designs=Array.isArray(build.templates)?build.templates:[];
  if(designs.length)return designs.map(design=>({id:'finished-'+build.id+'-'+design,familyId:build.id,title:'My resume',createdAt:new Date(build.createdAt).toISOString(),finished:true,purchased:true,buildId:build.id,design,workspace:{buildId:build.id,design}}));
  return [{id:'purchase-'+build.id,familyId:build.id,title:'Resume build',createdAt:new Date(build.createdAt).toISOString(),purchased:true,buildId:build.id,stage:build.status==='complete'?'review':'draft',workspace:{buildId:build.id}}];
 });
}
export function mergeResumeItems(saved=[],purchased=[]){
 const items=new Map(saved.map(item=>[item.id,item]));
 for(const item of purchased){const local=items.get(item.id);items.set(item.id,local?{...item,...local,purchased:true,buildId:item.buildId,design:item.design,finished:item.finished}:item);}
 return [...items.values()].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
}
