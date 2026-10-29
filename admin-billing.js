(function(){
 'use strict';
 var records=[],nextCursor=null,loading=false,requestNumber=0;
 var current={active:true,trialing:true},attention={past_due:true,unpaid:true,incomplete:true,paused:true};
 var zeroDecimal=new Set('bif clp djf gnf jpy kmf krw mga pyg rwf vnd vuv xaf xof xpf'.split(' '));
 function money(amount,currency){
  if(!Number.isSafeInteger(amount))return 'See Stripe';
  currency=String(currency||'usd').toLowerCase();
  try{return new Intl.NumberFormat(undefined,{style:'currency',currency:currency.toUpperCase()}).format(amount/(zeroDecimal.has(currency)?1:100));}catch(e){return 'See Stripe';}
 }
 function table(list){
  var headings=['Email','Name','Status','Price','Started','Period ends','Manage'];
  return '<div class="subs-table-scroll" tabindex="0" aria-label="Subscription details; scroll horizontally for more columns"><table class="subs-table"><thead><tr>'+headings.map(function(title){return '<th scope="col">'+title+'</th>';}).join('')+'</tr></thead><tbody>'+list.map(function(item){
   var interval=item.interval?(' / '+(item.intervalCount>1?item.intervalCount+' ':'')+item.interval):'';
   var label=String(item.status||'unknown').replace(/_/g,' ')+(item.cancelAtPeriodEnd?' · ends this period':'');
   return '<tr><td>'+admEsc(item.email||'Not provided')+'</td><td>'+admEsc(item.name||'—')+'</td><td>'+admEsc(label)+'</td><td>'+admEsc(money(item.amount,item.currency)+interval)+'</td><td>'+admEsc(admDate(item.created))+'</td><td>'+admEsc(admDate(item.currentPeriodEnd))+'</td><td><a href="https://dashboard.stripe.com/subscriptions/'+encodeURIComponent(item.id)+'" target="_blank" rel="noopener noreferrer">Open in Stripe ↗</a></td></tr>';
  }).join('')+'</tbody></table></div>';
 }
 function message(error){
  if(error?.status===401)return 'Your sign-in expired. Sign in again using the button at the top, then retry.';
  if(error?.status===403)return 'This account does not have administrator access. Sign in with your admin account.';
  if(error?.message==='billing_not_configured')return 'Stripe reporting is not connected. You can still view billing in Stripe.';
  if(error?.message==='billing_timeout')return 'Stripe took too long to respond. Retry in a moment.';
  return 'Subscriber details could not be loaded. Retry, or open Stripe to check billing.';
 }
 function render(error){
  var root=document.getElementById('subs-root');if(!root)return;
  var active=records.filter(function(item){return current[item.status];}),due=records.filter(function(item){return attention[item.status];}),archived=records.filter(function(item){return !current[item.status]&&!attention[item.status];});
  admSetN('stat-sub-total',active.length);var sub=document.getElementById('stat-sub-sub');if(sub)sub.textContent=nextCursor?'active in loaded results':'active or trialing';
  var html='<div class="subs-actions"><button type="button" id="subs-refresh" class="tab">Refresh subscribers</button><a href="https://dashboard.stripe.com/subscriptions" target="_blank" rel="noopener noreferrer">Open Stripe dashboard ↗</a></div>';
  if(error)html+='<div class="subs-error" role="alert"><p>'+admEsc(message(error))+'</p><button type="button" id="subs-retry" class="tab">Retry</button></div>';
  if(records.length){
   html+='<p class="subs-summary" role="status">Showing '+records.length+' subscriptions'+(nextCursor?' · more available':'')+'.</p>';
   if(active.length)html+='<h3 class="subs-heading">Active &amp; trialing ('+active.length+')</h3>'+table(active);
   if(due.length)html+='<h3 class="subs-heading">Needs attention ('+due.length+')</h3>'+table(due);
   if(archived.length)html+='<details class="subs-archive"><summary>Past subscriptions ('+archived.length+')</summary>'+table(archived)+'</details>';
  }else if(!error)html+='<p class="subs-summary" role="status">No recurring subscriptions were found in the connected Stripe account.</p>';
  if(nextCursor)html+='<button type="button" id="subs-more" class="tab">Load more subscriptions</button>';
  root.innerHTML=html;
  root.querySelector('#subs-refresh').onclick=function(){loadSubscribers();};
  var more=root.querySelector('#subs-more');if(more)more.onclick=function(){loadSubscribers(true);};
  var retry=root.querySelector('#subs-retry');if(retry)retry.onclick=function(){loadSubscribers(records.length>0&&nextCursor!==null);};
 }
 async function loadSubscribers(more){
  if(loading)return;var root=document.getElementById('subs-root');if(!root)return;
  more=more===true;if(more&&!nextCursor)return;loading=true;var attempt=++requestNumber;
  if(!more)root.innerHTML='<p class="subs-summary" role="status">Loading subscribers…</p>';
  else{var button=root.querySelector('#subs-more');if(button){button.disabled=true;button.textContent='Loading more…';}}
  try{
   var data=await admFetch('/api/admin-subscribers'+(more?'?cursor='+encodeURIComponent(nextCursor):''));
   if(attempt!==requestNumber)return;
   if(!Array.isArray(data.subscribers))throw new Error('invalid_response');
   var combined=more?records.concat(data.subscribers):data.subscribers,seen=new Set();
   records=combined.filter(function(item){if(!/^sub_[A-Za-z0-9]+$/.test(item?.id)||seen.has(item.id))return false;seen.add(item.id);return true;});
   nextCursor=typeof data.nextCursor==='string'&&/^sub_[A-Za-z0-9]+$/.test(data.nextCursor)?data.nextCursor:null;render();
  }catch(error){if(attempt!==requestNumber)return;if(!more||error?.status===401||error?.status===403){records=[];nextCursor=null;}render(error);}
  finally{if(attempt===requestNumber)loading=false;}
 }
 function clear(){records=[];nextCursor=null;loading=false;requestNumber++;var root=document.getElementById('subs-root');if(root)root.innerHTML='';var count=document.getElementById('stat-sub-total');if(count)count.textContent='—';}
 window.loadSubscribers=loadSubscribers;window.clearSubscribers=clear;
})();
