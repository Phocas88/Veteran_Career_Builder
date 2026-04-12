/* ═══════════════════════════════════════════════════════════════
   VCP Military Reference Data  -  vcp-military-data.js
   Shared data for Scout Resume Builder and other VCP tools
   ═══════════════════════════════════════════════════════════════ */

window.VCP_MIL = {};

/* ── RANKS BY BRANCH ── */
window.VCP_MIL.RANKS = {
  "Army": {
    enlisted: [
      {grade:"E-1",title:"Private",abbr:"PVT"},
      {grade:"E-2",title:"Private",abbr:"PV2"},
      {grade:"E-3",title:"Private First Class",abbr:"PFC"},
      {grade:"E-4",title:"Specialist",abbr:"SPC"},
      {grade:"E-4",title:"Corporal",abbr:"CPL"},
      {grade:"E-5",title:"Sergeant",abbr:"SGT"},
      {grade:"E-6",title:"Staff Sergeant",abbr:"SSG"},
      {grade:"E-7",title:"Sergeant First Class",abbr:"SFC"},
      {grade:"E-8",title:"Master Sergeant",abbr:"MSG"},
      {grade:"E-8",title:"First Sergeant",abbr:"1SG"},
      {grade:"E-9",title:"Sergeant Major",abbr:"SGM"},
      {grade:"E-9",title:"Command Sergeant Major",abbr:"CSM"}
    ],
    warrant: [
      {grade:"W-1",title:"Warrant Officer 1",abbr:"WO1"},
      {grade:"W-2",title:"Chief Warrant Officer 2",abbr:"CW2"},
      {grade:"W-3",title:"Chief Warrant Officer 3",abbr:"CW3"},
      {grade:"W-4",title:"Chief Warrant Officer 4",abbr:"CW4"},
      {grade:"W-5",title:"Chief Warrant Officer 5",abbr:"CW5"}
    ],
    officer: [
      {grade:"O-1",title:"Second Lieutenant",abbr:"2LT"},
      {grade:"O-2",title:"First Lieutenant",abbr:"1LT"},
      {grade:"O-3",title:"Captain",abbr:"CPT"},
      {grade:"O-4",title:"Major",abbr:"MAJ"},
      {grade:"O-5",title:"Lieutenant Colonel",abbr:"LTC"},
      {grade:"O-6",title:"Colonel",abbr:"COL"},
      {grade:"O-7",title:"Brigadier General",abbr:"BG"},
      {grade:"O-8",title:"Major General",abbr:"MG"},
      {grade:"O-9",title:"Lieutenant General",abbr:"LTG"},
      {grade:"O-10",title:"General",abbr:"GEN"}
    ]
  },
  "Navy": {
    enlisted: [
      {grade:"E-1",title:"Seaman Recruit",abbr:"SR"},
      {grade:"E-2",title:"Seaman Apprentice",abbr:"SA"},
      {grade:"E-3",title:"Seaman",abbr:"SN"},
      {grade:"E-4",title:"Petty Officer Third Class",abbr:"PO3"},
      {grade:"E-5",title:"Petty Officer Second Class",abbr:"PO2"},
      {grade:"E-6",title:"Petty Officer First Class",abbr:"PO1"},
      {grade:"E-7",title:"Chief Petty Officer",abbr:"CPO"},
      {grade:"E-8",title:"Senior Chief Petty Officer",abbr:"SCPO"},
      {grade:"E-9",title:"Master Chief Petty Officer",abbr:"MCPO"}
    ],
    warrant: [
      {grade:"W-2",title:"Chief Warrant Officer 2",abbr:"CWO2"},
      {grade:"W-3",title:"Chief Warrant Officer 3",abbr:"CWO3"},
      {grade:"W-4",title:"Chief Warrant Officer 4",abbr:"CWO4"},
      {grade:"W-5",title:"Chief Warrant Officer 5",abbr:"CWO5"}
    ],
    officer: [
      {grade:"O-1",title:"Ensign",abbr:"ENS"},
      {grade:"O-2",title:"Lieutenant Junior Grade",abbr:"LTJG"},
      {grade:"O-3",title:"Lieutenant",abbr:"LT"},
      {grade:"O-4",title:"Lieutenant Commander",abbr:"LCDR"},
      {grade:"O-5",title:"Commander",abbr:"CDR"},
      {grade:"O-6",title:"Captain",abbr:"CAPT"},
      {grade:"O-7",title:"Rear Admiral (Lower Half)",abbr:"RDML"},
      {grade:"O-8",title:"Rear Admiral (Upper Half)",abbr:"RADM"},
      {grade:"O-9",title:"Vice Admiral",abbr:"VADM"},
      {grade:"O-10",title:"Admiral",abbr:"ADM"}
    ]
  },
  "Marines": {
    enlisted: [
      {grade:"E-1",title:"Private",abbr:"Pvt"},
      {grade:"E-2",title:"Private First Class",abbr:"PFC"},
      {grade:"E-3",title:"Lance Corporal",abbr:"LCpl"},
      {grade:"E-4",title:"Corporal",abbr:"Cpl"},
      {grade:"E-5",title:"Sergeant",abbr:"Sgt"},
      {grade:"E-6",title:"Staff Sergeant",abbr:"SSgt"},
      {grade:"E-7",title:"Gunnery Sergeant",abbr:"GySgt"},
      {grade:"E-8",title:"Master Sergeant",abbr:"MSgt"},
      {grade:"E-8",title:"First Sergeant",abbr:"1stSgt"},
      {grade:"E-9",title:"Master Gunnery Sergeant",abbr:"MGySgt"},
      {grade:"E-9",title:"Sergeant Major",abbr:"SgtMaj"}
    ],
    warrant: [
      {grade:"W-1",title:"Warrant Officer 1",abbr:"WO"},
      {grade:"W-2",title:"Chief Warrant Officer 2",abbr:"CWO2"},
      {grade:"W-3",title:"Chief Warrant Officer 3",abbr:"CWO3"},
      {grade:"W-4",title:"Chief Warrant Officer 4",abbr:"CWO4"},
      {grade:"W-5",title:"Chief Warrant Officer 5",abbr:"CWO5"}
    ],
    officer: [
      {grade:"O-1",title:"Second Lieutenant",abbr:"2ndLt"},
      {grade:"O-2",title:"First Lieutenant",abbr:"1stLt"},
      {grade:"O-3",title:"Captain",abbr:"Capt"},
      {grade:"O-4",title:"Major",abbr:"Maj"},
      {grade:"O-5",title:"Lieutenant Colonel",abbr:"LtCol"},
      {grade:"O-6",title:"Colonel",abbr:"Col"},
      {grade:"O-7",title:"Brigadier General",abbr:"BGen"},
      {grade:"O-8",title:"Major General",abbr:"MajGen"},
      {grade:"O-9",title:"Lieutenant General",abbr:"LtGen"},
      {grade:"O-10",title:"General",abbr:"Gen"}
    ]
  },
  "Air Force": {
    enlisted: [
      {grade:"E-1",title:"Airman Basic",abbr:"AB"},
      {grade:"E-2",title:"Airman",abbr:"Amn"},
      {grade:"E-3",title:"Airman First Class",abbr:"A1C"},
      {grade:"E-4",title:"Senior Airman",abbr:"SrA"},
      {grade:"E-5",title:"Staff Sergeant",abbr:"SSgt"},
      {grade:"E-6",title:"Technical Sergeant",abbr:"TSgt"},
      {grade:"E-7",title:"Master Sergeant",abbr:"MSgt"},
      {grade:"E-8",title:"Senior Master Sergeant",abbr:"SMSgt"},
      {grade:"E-9",title:"Chief Master Sergeant",abbr:"CMSgt"}
    ],
    warrant: [],
    officer: [
      {grade:"O-1",title:"Second Lieutenant",abbr:"2d Lt"},
      {grade:"O-2",title:"First Lieutenant",abbr:"1st Lt"},
      {grade:"O-3",title:"Captain",abbr:"Capt"},
      {grade:"O-4",title:"Major",abbr:"Maj"},
      {grade:"O-5",title:"Lieutenant Colonel",abbr:"Lt Col"},
      {grade:"O-6",title:"Colonel",abbr:"Col"},
      {grade:"O-7",title:"Brigadier General",abbr:"Brig Gen"},
      {grade:"O-8",title:"Major General",abbr:"Maj Gen"},
      {grade:"O-9",title:"Lieutenant General",abbr:"Lt Gen"},
      {grade:"O-10",title:"General",abbr:"Gen"}
    ]
  },
  "Coast Guard": {
    enlisted: [
      {grade:"E-1",title:"Seaman Recruit",abbr:"SR"},
      {grade:"E-2",title:"Seaman Apprentice",abbr:"SA"},
      {grade:"E-3",title:"Seaman",abbr:"SN"},
      {grade:"E-4",title:"Petty Officer Third Class",abbr:"PO3"},
      {grade:"E-5",title:"Petty Officer Second Class",abbr:"PO2"},
      {grade:"E-6",title:"Petty Officer First Class",abbr:"PO1"},
      {grade:"E-7",title:"Chief Petty Officer",abbr:"CPO"},
      {grade:"E-8",title:"Senior Chief Petty Officer",abbr:"SCPO"},
      {grade:"E-9",title:"Master Chief Petty Officer",abbr:"MCPO"}
    ],
    warrant: [
      {grade:"W-2",title:"Chief Warrant Officer 2",abbr:"CWO2"},
      {grade:"W-3",title:"Chief Warrant Officer 3",abbr:"CWO3"},
      {grade:"W-4",title:"Chief Warrant Officer 4",abbr:"CWO4"}
    ],
    officer: [
      {grade:"O-1",title:"Ensign",abbr:"ENS"},
      {grade:"O-2",title:"Lieutenant Junior Grade",abbr:"LTJG"},
      {grade:"O-3",title:"Lieutenant",abbr:"LT"},
      {grade:"O-4",title:"Lieutenant Commander",abbr:"LCDR"},
      {grade:"O-5",title:"Commander",abbr:"CDR"},
      {grade:"O-6",title:"Captain",abbr:"CAPT"},
      {grade:"O-7",title:"Rear Admiral (Lower Half)",abbr:"RDML"},
      {grade:"O-8",title:"Rear Admiral (Upper Half)",abbr:"RADM"},
      {grade:"O-9",title:"Vice Admiral",abbr:"VADM"},
      {grade:"O-10",title:"Admiral",abbr:"ADM"}
    ]
  },
  "Space Force": {
    enlisted: [
      {grade:"E-1",title:"Specialist 1",abbr:"Spc1"},
      {grade:"E-2",title:"Specialist 2",abbr:"Spc2"},
      {grade:"E-3",title:"Specialist 3",abbr:"Spc3"},
      {grade:"E-4",title:"Specialist 4",abbr:"Spc4"},
      {grade:"E-5",title:"Sergeant",abbr:"Sgt"},
      {grade:"E-6",title:"Technical Sergeant",abbr:"TSgt"},
      {grade:"E-7",title:"Master Sergeant",abbr:"MSgt"},
      {grade:"E-8",title:"Senior Master Sergeant",abbr:"SMSgt"},
      {grade:"E-9",title:"Chief Master Sergeant",abbr:"CMSgt"}
    ],
    warrant: [],
    officer: [
      {grade:"O-1",title:"Second Lieutenant",abbr:"2d Lt"},
      {grade:"O-2",title:"First Lieutenant",abbr:"1st Lt"},
      {grade:"O-3",title:"Captain",abbr:"Capt"},
      {grade:"O-4",title:"Major",abbr:"Maj"},
      {grade:"O-5",title:"Lieutenant Colonel",abbr:"Lt Col"},
      {grade:"O-6",title:"Colonel",abbr:"Col"},
      {grade:"O-7",title:"Brigadier General",abbr:"Brig Gen"},
      {grade:"O-8",title:"Major General",abbr:"Maj Gen"},
      {grade:"O-9",title:"Lieutenant General",abbr:"Lt Gen"},
      {grade:"O-10",title:"General",abbr:"Gen"}
    ]
  }
};

/* ── AWARDS BY BRANCH ── */
window.VCP_MIL.AWARDS = {
  "Joint": [
    "Defense Distinguished Service Medal",
    "Defense Superior Service Medal",
    "Defense Meritorious Service Medal",
    "Joint Service Commendation Medal",
    "Joint Service Achievement Medal",
    "Joint Meritorious Unit Award"
  ],
  "Army": [
    "Medal of Honor",
    "Distinguished Service Cross",
    "Silver Star",
    "Legion of Merit",
    "Distinguished Flying Cross",
    "Soldier's Medal",
    "Bronze Star Medal",
    "Purple Heart",
    "Meritorious Service Medal",
    "Army Commendation Medal (ARCOM)",
    "Army Achievement Medal (AAM)",
    "Combat Infantryman Badge (CIB)",
    "Combat Action Badge (CAB)",
    "Combat Medical Badge (CMB)",
    "Expert Infantryman Badge (EIB)",
    "Expert Field Medical Badge (EFMB)",
    "Ranger Tab",
    "Airborne Badge",
    "Air Assault Badge",
    "Pathfinder Badge",
    "Army Good Conduct Medal",
    "National Defense Service Medal",
    "Global War on Terrorism Service Medal",
    "Iraq Campaign Medal",
    "Afghanistan Campaign Medal",
    "Overseas Service Ribbon",
    "Army Service Ribbon",
    "NCO Professional Development Ribbon"
  ],
  "Navy": [
    "Medal of Honor",
    "Navy Cross",
    "Silver Star",
    "Legion of Merit",
    "Distinguished Flying Cross",
    "Navy and Marine Corps Medal",
    "Bronze Star Medal",
    "Purple Heart",
    "Meritorious Service Medal",
    "Navy and Marine Corps Commendation Medal",
    "Navy and Marine Corps Achievement Medal",
    "Combat Action Ribbon",
    "Navy Good Conduct Medal",
    "Fleet Marine Force Ribbon",
    "Navy Expeditionary Medal",
    "National Defense Service Medal",
    "Global War on Terrorism Service Medal",
    "Iraq Campaign Medal",
    "Afghanistan Campaign Medal",
    "Sea Service Deployment Ribbon",
    "Navy Expert Rifleman Medal",
    "Navy Expert Pistol Shot Medal",
    "Surface Warfare Officer Insignia",
    "Submarine Warfare Insignia",
    "Naval Aviator Wings",
    "Enlisted Aviation Warfare Specialist",
    "Enlisted Surface Warfare Specialist"
  ],
  "Marines": [
    "Medal of Honor",
    "Navy Cross",
    "Silver Star",
    "Legion of Merit",
    "Distinguished Flying Cross",
    "Navy and Marine Corps Medal",
    "Bronze Star Medal",
    "Purple Heart",
    "Meritorious Service Medal",
    "Navy and Marine Corps Commendation Medal",
    "Navy and Marine Corps Achievement Medal",
    "Combat Action Ribbon",
    "Marine Corps Good Conduct Medal",
    "Marine Corps Expeditionary Medal",
    "National Defense Service Medal",
    "Global War on Terrorism Service Medal",
    "Iraq Campaign Medal",
    "Afghanistan Campaign Medal",
    "Sea Service Deployment Ribbon",
    "Marine Corps Rifle Expert Badge",
    "Marine Corps Pistol Expert Badge",
    "Drill Instructor Ribbon",
    "Marine Corps Recruiter Ribbon"
  ],
  "Air Force": [
    "Medal of Honor",
    "Air Force Cross",
    "Silver Star",
    "Legion of Merit",
    "Distinguished Flying Cross",
    "Airman's Medal",
    "Bronze Star Medal",
    "Purple Heart",
    "Meritorious Service Medal",
    "Air Force Commendation Medal",
    "Air Force Achievement Medal",
    "Combat Action Medal",
    "Air Force Good Conduct Medal",
    "Air Force Expeditionary Service Ribbon",
    "National Defense Service Medal",
    "Global War on Terrorism Service Medal",
    "Iraq Campaign Medal",
    "Afghanistan Campaign Medal",
    "Air Force Overseas Ribbon (Short Tour)",
    "Air Force Overseas Ribbon (Long Tour)",
    "Air Force Longevity Service Award",
    "Air Force Training Ribbon",
    "Air Force Small Arms Expert Marksmanship Ribbon",
    "Space Operations Badge",
    "Cyber Operations Badge",
    "Command Pilot Wings",
    "Senior Pilot Wings"
  ],
  "Coast Guard": [
    "Medal of Honor",
    "Coast Guard Cross",
    "Silver Star",
    "Legion of Merit",
    "Distinguished Flying Cross",
    "Coast Guard Medal",
    "Bronze Star Medal",
    "Purple Heart",
    "Meritorious Service Medal",
    "Coast Guard Commendation Medal",
    "Coast Guard Achievement Medal",
    "Commandant's Letter of Commendation",
    "Coast Guard Good Conduct Medal",
    "Coast Guard Special Operations Service Ribbon",
    "National Defense Service Medal",
    "Global War on Terrorism Service Medal",
    "Coast Guard Sea Service Ribbon",
    "Coast Guard Restricted Duty Ribbon",
    "Coast Guard Cutterman Insignia",
    "Surfman Badge",
    "Aviation Wings"
  ],
  "Space Force": [
    "Medal of Honor",
    "Space Force Cross",
    "Silver Star",
    "Legion of Merit",
    "Distinguished Flying Cross",
    "Guardian Medal",
    "Bronze Star Medal",
    "Purple Heart",
    "Meritorious Service Medal",
    "Space Force Commendation Medal",
    "Space Force Achievement Medal",
    "Combat Action Medal",
    "National Defense Service Medal",
    "Global War on Terrorism Service Medal",
    "Space Force Good Conduct Medal",
    "Space Operations Badge"
  ]
};

/* ── ADDITIONAL SKILL IDENTIFIERS ── */
window.VCP_MIL.ASI = {
  "Army": [
    {code:"2A",title:"Non-Lethal Weapons"},
    {code:"2S",title:"Battle Staff"},
    {code:"3Y",title:"Airborne Ranger"},
    {code:"4A",title:"ASI for Recruiting"},
    {code:"4Y",title:"Dual-Status Technician"},
    {code:"5K",title:"Master Instructor"},
    {code:"5P",title:"Master Fitness Trainer"},
    {code:"5W",title:"Pathfinder"},
    {code:"6B",title:"Army Space Operations Officer"},
    {code:"7W",title:"Explosive Ordnance Disposal (EOD)"},
    {code:"8P",title:"Jumpmaster"},
    {code:"8R",title:"Master Parachutist"},
    {code:"A6",title:"Foreign Area Officer"},
    {code:"B4",title:"Sniper"},
    {code:"C5",title:"Commander, Brigade/Group Combat Team"},
    {code:"D7",title:"Joint Firepower Observer"},
    {code:"F5",title:"Reclassified Warrant Officer"},
    {code:"G3",title:"CBRN Operations"},
    {code:"H8",title:"Instructor Pilot"},
    {code:"K4",title:"Instructor"},
    {code:"K8",title:"Airborne Instructor"},
    {code:"N4",title:"Network Operations"},
    {code:"P5",title:"Master Gunner"},
    {code:"R7",title:"Recruiter (Senior)"},
    {code:"S7",title:"Master Recruiter"},
    {code:"T3",title:"Drill Sergeant"},
    {code:"V5",title:"Rappel Master"},
    {code:"W1",title:"RANGER Qualified"},
    {code:"Y6",title:"Special Forces"},
    {code:"Z5",title:"Sapper"}
  ]
};

/* ── LANGUAGES ── */
window.VCP_MIL.LANGUAGES = [
  "Arabic","Chinese (Mandarin)","Chinese (Cantonese)","Dari","Farsi/Persian",
  "French","German","Hebrew","Hindi","Indonesian","Italian","Japanese",
  "Korean","Kurdish","Pashto","Polish","Portuguese","Russian","Somali",
  "Spanish","Swahili","Tagalog","Thai","Turkish","Ukrainian","Urdu","Vietnamese"
];

/* ── GUIDED DUTY PROMPTS ── */
window.VCP_MIL.DUTY_PROMPTS = [
  {key:"supervised",q:"How many people did you directly lead or supervise?",ph:"e.g. 13 soldiers",icon:"team"},
  {key:"unitSize",q:"What was the total size of your unit or section?",ph:"e.g. 120-person company",icon:"org"},
  {key:"equipValue",q:"What was the total value of equipment/assets you managed?",ph:"e.g. $4.2 million",icon:"money"},
  {key:"trained",q:"How many people did you train, mentor, or develop?",ph:"e.g. 25 service members",icon:"train"},
  {key:"operations",q:"Describe a key mission, project, or operation you led or contributed to.",ph:"e.g. Led convoy security for 200+ supply runs across northern Iraq",icon:"mission"},
  {key:"improvement",q:"Did you improve any process, save money, or increase efficiency? How?",ph:"e.g. Redesigned maintenance schedule, reducing vehicle downtime by 30%",icon:"improve"},
  {key:"compliance",q:"What regulations, standards, or inspections were you responsible for?",ph:"e.g. Maintained 100% compliance with OSHA and Army safety regulations",icon:"compliance"},
  {key:"technology",q:"What systems, software, or technical tools did you use?",ph:"e.g. GCSS-Army, DPAS, JBoss, SIPR/NIPR networks",icon:"tech"},
  {key:"communication",q:"How did you communicate results up or down the chain?",ph:"e.g. Briefed battalion commander weekly on maintenance readiness",icon:"comm"}
];

/* ── SOFT SKILLS / LEADERSHIP COMPETENCIES ── */
window.VCP_MIL.SOFT_SKILLS = [
  "Leadership","Team Building","Project Management","Strategic Planning",
  "Crisis Management","Decision Making Under Pressure","Cross-Functional Collaboration",
  "Training & Development","Mentoring","Conflict Resolution","Time Management",
  "Adaptability","Problem Solving","Risk Assessment","Communication",
  "Public Speaking","Negotiation","Logistics Coordination","Budget Management",
  "Quality Assurance","Process Improvement","Safety Management","Compliance",
  "Multicultural Communication","Stakeholder Management"
];

/* ── COMMON CERTIFICATIONS BY FIELD ── */
window.VCP_MIL.CERTIFICATIONS = {
  "IT/Cyber": ["CompTIA Security+","CompTIA Network+","CompTIA A+","CISSP","CEH","AWS Cloud Practitioner","AWS Solutions Architect","CCNA","CCNP","Azure Fundamentals"],
  "Project Management": ["PMP","CAPM","Lean Six Sigma Green Belt","Lean Six Sigma Black Belt","Agile/Scrum Master","PRINCE2"],
  "Healthcare": ["EMT-B","EMT-P/Paramedic","CNA","NREMT","BLS/ACLS","TCCC","Nursing License (RN/LPN)"],
  "Trades": ["OSHA 10","OSHA 30","EPA 608","ASE","CDL Class A","CDL Class B","Journeyman License","Master Electrician"],
  "Law Enforcement": ["POST Certification","FLETC Graduate","Armed Guard License","CPR/First Aid","Polygraph Examiner"],
  "General": ["First Aid/CPR","Forklift Operator","HAZMAT","Secret Clearance","Top Secret/SCI","NACI/Public Trust"]
};

/* ── HELPER: Get ranks as flat array for a branch ── */
window.VCP_MIL.getRanksFlat = function(branch) {
  var data = window.VCP_MIL.RANKS[branch];
  if (!data) return [];
  var result = [];
  if (data.enlisted) result = result.concat(data.enlisted);
  if (data.warrant) result = result.concat(data.warrant);
  if (data.officer) result = result.concat(data.officer);
  return result;
};

/* ── HELPER: Get awards for a branch (includes Joint) ── */
window.VCP_MIL.getAwardsForBranch = function(branch) {
  var joint = window.VCP_MIL.AWARDS["Joint"] || [];
  var branchAwards = window.VCP_MIL.AWARDS[branch] || [];
  return branchAwards.concat(joint);
};

/* ── HELPER: Build rank <select> options grouped by category ── */
window.VCP_MIL.buildRankOptions = function(branch) {
  var data = window.VCP_MIL.RANKS[branch];
  if (!data) return '<option value="">Select rank...</option>';
  var html = '<option value="">Select rank...</option>';
  var groups = [
    {label:"Enlisted",arr:data.enlisted},
    {label:"Warrant Officer",arr:data.warrant},
    {label:"Officer",arr:data.officer}
  ];
  groups.forEach(function(g) {
    if (g.arr && g.arr.length) {
      html += '<optgroup label="'+g.label+'">';
      g.arr.forEach(function(r) {
        html += '<option value="'+r.grade+' - '+r.abbr+' - '+r.title+'">'+r.grade+' - '+r.abbr+' ('+r.title+')</option>';
      });
      html += '</optgroup>';
    }
  });
  return html;
};
