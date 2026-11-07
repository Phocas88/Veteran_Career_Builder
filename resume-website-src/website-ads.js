import {CONSENT_KEY,readConsent} from './analytics-model.js?v=20261107-domain-reports';
import {setUsageAnalyticsConsent,usageAnalyticsAllowed} from './analytics.js?v=20261107-domain-reports';

export const PUBLISHER='ca-pub-4999040528510137';
export const ADS_CHOICE='veteran_resumes_advertising_choice_v1';
const signal=()=>navigator.globalPrivacyControl===true||navigator.doNotTrack==='1'||window.doNotTrack==='1';
let choice=null,started=false;
function remember(enabled){choice=enabled&&!signal();try{localStorage.setItem(ADS_CHOICE,JSON.stringify({version:1,enabled:choice,updatedAt:Date.now()}));}catch{}}
function loadAds(){
 // Only the public landing document can start advertising. Installed launches,
 // editor screens and checkout-return redirects never initialize this module.
 if(started||choice!==true||signal()||location.pathname!=='/'||location.search||!document.body.classList.contains('website'))return;
 started=true;window.adsbygoogle=window.adsbygoogle||[];
 window.adsbygoogle.requestNonPersonalizedAds=1;
 const script=document.createElement('script');script.id='website-adsense';script.async=true;script.crossOrigin='anonymous';script.referrerPolicy='no-referrer';
 script.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+PUBLISHER;
 // This publisher preference does not replace Google's certified consent
 // message. Configure Privacy & messaging for this site in the AdSense account.
 document.head.append(script);
}
function selectAds(enabled){
 const wasStarted=started;remember(enabled);
 if(!choice&&wasStarted){location.reload();return;}
 loadAds();
}
export function initWebsitePrivacy(){
 const analytics=document.getElementById('site-analytics-choice'),ads=document.getElementById('site-ads-choice'),save=document.getElementById('site-privacy-save'),dialog=document.getElementById('usage-analytics-notice');
 if(!analytics||!ads||!save||!dialog||!document.body.classList.contains('website'))return;
 try{choice=readConsent(localStorage.getItem(ADS_CHOICE));}catch{}
 const sync=()=>{analytics.checked=usageAnalyticsAllowed();ads.checked=choice===true&&!signal();analytics.disabled=signal();ads.disabled=signal();document.getElementById('site-privacy-signal').hidden=!signal();};
 save.addEventListener('click',()=>{const allowAnalytics=analytics.checked,allowAds=ads.checked;setUsageAnalyticsConsent(allowAnalytics&&!signal());selectAds(allowAds);});
 for(const button of dialog.querySelectorAll('[data-analytics-choice="deny"]'))button.addEventListener('click',()=>selectAds(false));
 dialog.addEventListener('cancel',()=>selectAds(false));
 document.getElementById('privacy-options').addEventListener('click',sync);
 window.addEventListener('storage',event=>{if(event.key===ADS_CHOICE){let next=null;try{next=readConsent(event.newValue);}catch{}choice=next;if(started&&(choice!==true||signal()))location.reload();else loadAds();sync();}if(event.key===CONSENT_KEY)sync();});
 sync();loadAds();
}
