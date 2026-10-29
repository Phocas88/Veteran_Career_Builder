export const PROTOCOL={
  "events": {
    "page_view": {},
    "vcp_resume_start": {
      "path": [
        "upload",
        "manual"
      ]
    },
    "vcp_resume_checkout_requested": {
      "service": [
        "resume",
        "template"
      ]
    },
    "vcp_resume_checkout_verified": {
      "service": [
        "resume",
        "template"
      ]
    },
    "vcp_resume_import_complete": {
      "file_type": [
        "pdf",
        "docx",
        "txt",
        "other"
      ]
    },
    "vcp_resume_import_failed": {},
    "vcp_resume_review_started": {
      "kind": [
        "new",
        "recovery"
      ]
    },
    "vcp_resume_review_complete": {
      "kind": [
        "new",
        "recovery"
      ]
    },
    "vcp_resume_review_failed": {
      "reason": [
        "timeout",
        "canceled",
        "provider",
        "connection",
        "other"
      ]
    },
    "vcp_resume_download": {
      "format": [
        "pdf",
        "docx",
        "txt"
      ],
      "document": [
        "resume"
      ]
    },
    "vcp_resume_active": {}
  },
  "screens": {
    "home": "Home",
    "resumes": "My resumes",
    "resume_start": "Choose how to start",
    "resume_payment": "Resume checkout",
    "resume_build": "Build a resume",
    "resume_edit": "Upload or edit a resume",
    "resume_job": "Job details",
    "resume_checkout": "Confirm resume review",
    "resume_review": "Resume review",
    "resume_download": "Download resume",
    "profile": "Career profile",
    "applications": "Job tracker",
    "library": "Service library",
    "letter": "Cover letters",
    "digital_cv": "Virtual CV",
    "careers": "Career ideas",
    "match": "Job match",
    "skills": "Skill translation",
    "settings": "Settings"
  },
  "sources": [
    "direct",
    "tiktok",
    "linkedin",
    "google",
    "bing",
    "other"
  ]
};

export const CONSENT_KEY='vcp_resume_analytics_choice_v1';
export const VISITOR_KEY='vcp_resume_analytics_visitor_v1';
export const SESSION_KEY='vcp_resume_analytics_session_v1';
export const ONCE_KEY='vcp_resume_analytics_once_v1';
export const BRIDGE_ORIGIN='https://vcp-proxy.vercel.app';
export const BRIDGE_URL=BRIDGE_ORIGIN+'/api/resume-analytics?v=20261029-resume-reports';
export const PROTOCOL_VERSION='vcp-resume-analytics-v1';
export function analyticsEvent(name,params={}){
 if(!Object.hasOwn(PROTOCOL.events,name)||!params||typeof params!=='object'||Array.isArray(params))return null;
 const clean={};for(const [key,allowed]of Object.entries(PROTOCOL.events[name]))if(allowed.includes(params[key]))clean[key]=params[key];
 return {name,params:clean};
}
export function allowedScreen(screen){return typeof screen==='string'&&Object.hasOwn(PROTOCOL.screens,screen)?screen:null;}
export function readConsent(value,now=Date.now()){
 try{const parsed=JSON.parse(value);return parsed?.version===1&&typeof parsed.enabled==='boolean'&&Number.isFinite(parsed.updatedAt)&&parsed.updatedAt<=now&&now-parsed.updatedAt<180*86400000?parsed.enabled:null;}catch{return null;}
}
export function trafficSource(url,referrer=''){
 try{const target=new URL(url),tag=(target.searchParams.get('utm_source')||'').toLowerCase();if(['tiktok','linkedin','google','bing'].includes(tag))return tag;
 const host=referrer?new URL(referrer).hostname.toLowerCase():'';if(!host||host==='veterancareerpath.com'||host.endsWith('.veterancareerpath.com')||host==='checkout.stripe.com'||host.endsWith('.firebaseapp.com'))return 'direct';
 for(const source of ['tiktok','linkedin','google','bing'])if(host===source+'.com'||host.endsWith('.'+source+'.com'))return source;return 'other';
 }catch{return 'direct';}
}
export function analyticsIdentity(storage,random,now=Date.now(),source='direct'){
 let visitor,session;try{visitor=JSON.parse(storage.getItem(VISITOR_KEY));session=JSON.parse(storage.getItem(SESSION_KEY));}catch{}
 if(!visitor||!/^\d{1,10}\.\d{10,13}$/.test(visitor.value)||!Number.isFinite(visitor.expires)||visitor.expires<=now||visitor.expires>now+91*86400000){visitor={value:String(random())+'.'+now,expires:now+90*86400000};try{storage.setItem(VISITOR_KEY,JSON.stringify(visitor));}catch{}}
 if(!session||!/^\d{9,13}$/.test(session.id)||!Number.isFinite(session.seen)||session.seen>now||now-session.seen>30*60000||!PROTOCOL.sources.includes(session.source))session={id:String(Math.floor(now/1000)),source:PROTOCOL.sources.includes(source)?source:'direct'};
 session.seen=now;try{storage.setItem(SESSION_KEY,JSON.stringify(session));}catch{}
 return {client_id:visitor.value,session_id:session.id,source:session.source};
}
export function forgetAnalytics(storage){for(const key of [VISITOR_KEY,SESSION_KEY,ONCE_KEY])try{storage.removeItem(key);}catch{}}
