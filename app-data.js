var MIL_JARGON = {
  "NCOIC":"Team Supervisor / Operations Lead",
  "OIC":"Department Manager / Program Lead",
  "CDR":"Commander / Director",
  "XO":"Deputy Director / Operations Manager",
  "1SG":"Senior Operations Supervisor",
  "CSM":"Senior Advisor / Chief of Staff",
  "NCO":"Team Leader / Supervisor",
  "SNCO":"Senior Team Leader",
  "AO":"Area of Operations",
  "AOR":"Area of Responsibility",
  "OPORD":"Operations Plan",
  "SITREP":"Status Report",
  "AAR":"Post-Project Review / Lessons Learned",
  "SOP":"Standard Operating Procedure",
  "PMCS":"Preventive Maintenance Program",
  "TOC":"Operations Center",
  "COP":"Operations Dashboard / Common Picture",
  "OPTEMPO":"Operational Tempo / Workload Intensity",
  "TDY":"Temporary Business Travel",
  "TAD":"Temporary Duty Assignment",
  "PME":"Professional Development / Leadership Training",
  "PCS":"Relocation",
  "MOB":"Deployment / Mobilization",
  "MOS":"Career Specialty",
  "AFSC":"Career Specialty Code",
  "NEC":"Navy Job Classification",
  "PBO":"Asset / Property Manager",
  "SSA":"Supply Chain / Distribution Center",
  "MHE":"Material Handling Equipment / Forklifts",
  "Chain of Command":"Reporting Structure",
  "Unit Cohesion":"Team Unity",
  "Battle Rhythm":"Recurring Operating Cadence",
  "Tasker":"Action Item / Work Order",
  "Deadlined":"Equipment Out of Service",
  "Force Multiplier":"Efficiency / Capability Enhancement",
  "Hooah":"(omit - military slang)",
  "Oorah":"(omit - military slang)",
  "Hard Charger":"High Performer / Self-Starter",
};

var BRANCHES = ["Army","Navy","Marine Corps","Air Force","Space Force","Coast Guard"];

var RANKS = {
  "Army": {
    enlisted: [
      { grade:"E-1", title:"Private", abbr:"PVT", insignia:"⬜" },
      { grade:"E-2", title:"Private Second Class", abbr:"PV2", insignia:"▲" },
      { grade:"E-3", title:"Private First Class", abbr:"PFC", insignia:"▲▲" },
      { grade:"E-4", title:"Specialist", abbr:"SPC", insignia:"◆" },
      { grade:"E-4", title:"Corporal", abbr:"CPL", insignia:"◆◆" },
      { grade:"E-5", title:"Sergeant", abbr:"SGT", insignia:"⬡⬡⬡" },
      { grade:"E-6", title:"Staff Sergeant", abbr:"SSG", insignia:"⬡⬡⬡" },
      { grade:"E-7", title:"Sergeant First Class", abbr:"SFC", insignia:"⬡⬡⬡" },
      { grade:"E-8", title:"Master Sergeant", abbr:"MSG", insignia:"⬡⬡⬡" },
      { grade:"E-8", title:"First Sergeant", abbr:"1SG", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Sergeant Major", abbr:"SGM", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Command Sergeant Major", abbr:"CSM", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Sergeant Major of the Army", abbr:"SMA", insignia:"★" },
    ],
    warrant: [
      { grade:"W-1", title:"Warrant Officer 1", abbr:"WO1", insignia:"▬" },
      { grade:"W-2", title:"Chief Warrant Officer 2", abbr:"CW2", insignia:"▬▬" },
      { grade:"W-3", title:"Chief Warrant Officer 3", abbr:"CW3", insignia:"▬▬▬" },
      { grade:"W-4", title:"Chief Warrant Officer 4", abbr:"CW4", insignia:"▬▬▬▬" },
      { grade:"W-5", title:"Chief Warrant Officer 5", abbr:"CW5", insignia:"▬▬▬▬▬" },
    ],
    officer: [
      { grade:"O-1", title:"Second Lieutenant", abbr:"2LT", insignia:"▧" },
      { grade:"O-2", title:"First Lieutenant", abbr:"1LT", insignia:"▧▧" },
      { grade:"O-3", title:"Captain", abbr:"CPT", insignia:"✦" },
      { grade:"O-4", title:"Major", abbr:"MAJ", insignia:"🔶" },
      { grade:"O-5", title:"Lieutenant Colonel", abbr:"LTC", insignia:"⬟" },
      { grade:"O-6", title:"Colonel", abbr:"COL", insignia:"🦅" },
      { grade:"O-7", title:"Brigadier General", abbr:"BG", insignia:"★" },
      { grade:"O-8", title:"Major General", abbr:"MG", insignia:"★★" },
      { grade:"O-9", title:"Lieutenant General", abbr:"LTG", insignia:"★★★" },
      { grade:"O-10", title:"General", abbr:"GEN", insignia:"★★★★" },
    ]
  },
  "Marine Corps": {
    enlisted: [
      { grade:"E-1", title:"Private", abbr:"Pvt", insignia:"⬜" },
      { grade:"E-2", title:"Private First Class", abbr:"PFC", insignia:"▲" },
      { grade:"E-3", title:"Lance Corporal", abbr:"LCpl", insignia:"⬡" },
      { grade:"E-4", title:"Corporal", abbr:"Cpl", insignia:"⬡⬡" },
      { grade:"E-5", title:"Sergeant", abbr:"Sgt", insignia:"⬡⬡⬡" },
      { grade:"E-6", title:"Staff Sergeant", abbr:"SSgt", insignia:"⬡⬡⬡" },
      { grade:"E-7", title:"Gunnery Sergeant", abbr:"GySgt", insignia:"⬡⬡⬡" },
      { grade:"E-8", title:"Master Sergeant", abbr:"MSgt", insignia:"⬡⬡⬡" },
      { grade:"E-8", title:"First Sergeant", abbr:"1stSgt", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Master Gunnery Sergeant", abbr:"MGySgt", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Sergeant Major", abbr:"SgtMaj", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Sergeant Major of the Marine Corps", abbr:"SgtMajMC", insignia:"★" },
    ],
    warrant: [
      { grade:"W-1", title:"Warrant Officer 1", abbr:"WO1", insignia:"▬" },
      { grade:"W-2", title:"Chief Warrant Officer 2", abbr:"CWO2", insignia:"▬▬" },
      { grade:"W-3", title:"Chief Warrant Officer 3", abbr:"CWO3", insignia:"▬▬▬" },
      { grade:"W-4", title:"Chief Warrant Officer 4", abbr:"CWO4", insignia:"▬▬▬▬" },
      { grade:"W-5", title:"Chief Warrant Officer 5", abbr:"CWO5", insignia:"▬▬▬▬▬" },
    ],
    officer: [
      { grade:"O-1", title:"Second Lieutenant", abbr:"2ndLt", insignia:"▧" },
      { grade:"O-2", title:"First Lieutenant", abbr:"1stLt", insignia:"▧▧" },
      { grade:"O-3", title:"Captain", abbr:"Capt", insignia:"✦" },
      { grade:"O-4", title:"Major", abbr:"Maj", insignia:"🔶" },
      { grade:"O-5", title:"Lieutenant Colonel", abbr:"LtCol", insignia:"⬟" },
      { grade:"O-6", title:"Colonel", abbr:"Col", insignia:"🦅" },
      { grade:"O-7", title:"Brigadier General", abbr:"BGen", insignia:"★" },
      { grade:"O-8", title:"Major General", abbr:"MajGen", insignia:"★★" },
      { grade:"O-9", title:"Lieutenant General", abbr:"LtGen", insignia:"★★★" },
      { grade:"O-10", title:"General", abbr:"Gen", insignia:"★★★★" },
    ]
  },
  "Navy": {
    enlisted: [
      { grade:"E-1", title:"Seaman Recruit", abbr:"SR", insignia:"⬜" },
      { grade:"E-2", title:"Seaman Apprentice", abbr:"SA", insignia:"▲▲" },
      { grade:"E-3", title:"Seaman", abbr:"SN", insignia:"▲▲▲" },
      { grade:"E-4", title:"Petty Officer Third Class", abbr:"PO3", insignia:"⬡" },
      { grade:"E-5", title:"Petty Officer Second Class", abbr:"PO2", insignia:"⬡⬡" },
      { grade:"E-6", title:"Petty Officer First Class", abbr:"PO1", insignia:"⬡⬡⬡" },
      { grade:"E-7", title:"Chief Petty Officer", abbr:"CPO", insignia:"⚓" },
      { grade:"E-8", title:"Senior Chief Petty Officer", abbr:"SCPO", insignia:"⚓⚓" },
      { grade:"E-9", title:"Master Chief Petty Officer", abbr:"MCPO", insignia:"⚓⚓⚓" },
      { grade:"E-9", title:"Fleet Master Chief", abbr:"FLTCM", insignia:"★" },
      { grade:"E-9", title:"Master Chief Petty Officer of the Navy", abbr:"MCPON", insignia:"★" },
    ],
    warrant: [
      { grade:"W-2", title:"Chief Warrant Officer 2", abbr:"CWO2", insignia:"▬▬" },
      { grade:"W-3", title:"Chief Warrant Officer 3", abbr:"CWO3", insignia:"▬▬▬" },
      { grade:"W-4", title:"Chief Warrant Officer 4", abbr:"CWO4", insignia:"▬▬▬▬" },
      { grade:"W-5", title:"Chief Warrant Officer 5", abbr:"CWO5", insignia:"▬▬▬▬▬" },
    ],
    officer: [
      { grade:"O-1", title:"Ensign", abbr:"ENS", insignia:"▧" },
      { grade:"O-2", title:"Lieutenant Junior Grade", abbr:"LTJG", insignia:"▧▧" },
      { grade:"O-3", title:"Lieutenant", abbr:"LT", insignia:"✦" },
      { grade:"O-4", title:"Lieutenant Commander", abbr:"LCDR", insignia:"🔶" },
      { grade:"O-5", title:"Commander", abbr:"CDR", insignia:"⬟" },
      { grade:"O-6", title:"Captain", abbr:"CAPT", insignia:"🦅" },
      { grade:"O-7", title:"Rear Admiral Lower Half", abbr:"RDML", insignia:"★" },
      { grade:"O-8", title:"Rear Admiral Upper Half", abbr:"RADM", insignia:"★★" },
      { grade:"O-9", title:"Vice Admiral", abbr:"VADM", insignia:"★★★" },
      { grade:"O-10", title:"Admiral", abbr:"ADM", insignia:"★★★★" },
    ]
  },
  "Air Force": {
    enlisted: [
      { grade:"E-1", title:"Airman Basic", abbr:"AB", insignia:"⬜" },
      { grade:"E-2", title:"Airman", abbr:"Amn", insignia:"▲" },
      { grade:"E-3", title:"Airman First Class", abbr:"A1C", insignia:"▲▲▲" },
      { grade:"E-4", title:"Senior Airman", abbr:"SrA", insignia:"⬡" },
      { grade:"E-5", title:"Staff Sergeant", abbr:"SSgt", insignia:"⬡⬡⬡" },
      { grade:"E-6", title:"Technical Sergeant", abbr:"TSgt", insignia:"⬡⬡⬡" },
      { grade:"E-7", title:"Master Sergeant", abbr:"MSgt", insignia:"⬡⬡⬡" },
      { grade:"E-7", title:"First Sergeant", abbr:"1Sgt", insignia:"⬡⬡⬡" },
      { grade:"E-8", title:"Senior Master Sergeant", abbr:"SMSgt", insignia:"⬡⬡⬡" },
      { grade:"E-8", title:"First Sergeant", abbr:"1Sgt", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Chief Master Sergeant", abbr:"CMSgt", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Command Chief Master Sergeant", abbr:"CCM", insignia:"★" },
      { grade:"E-9", title:"Chief Master Sergeant of the Air Force", abbr:"CMSAF", insignia:"★" },
    ],
    warrant: [],
    officer: [
      { grade:"O-1", title:"Second Lieutenant", abbr:"2d Lt", insignia:"▧" },
      { grade:"O-2", title:"First Lieutenant", abbr:"1st Lt", insignia:"▧▧" },
      { grade:"O-3", title:"Captain", abbr:"Capt", insignia:"✦" },
      { grade:"O-4", title:"Major", abbr:"Maj", insignia:"🔶" },
      { grade:"O-5", title:"Lieutenant Colonel", abbr:"Lt Col", insignia:"⬟" },
      { grade:"O-6", title:"Colonel", abbr:"Col", insignia:"🦅" },
      { grade:"O-7", title:"Brigadier General", abbr:"Brig Gen", insignia:"★" },
      { grade:"O-8", title:"Major General", abbr:"Maj Gen", insignia:"★★" },
      { grade:"O-9", title:"Lieutenant General", abbr:"Lt Gen", insignia:"★★★" },
      { grade:"O-10", title:"General", abbr:"Gen", insignia:"★★★★" },
    ]
  },
  "Space Force": {
    enlisted: [
      { grade:"E-1", title:"Specialist 1", abbr:"Spc1", insignia:"⬜" },
      { grade:"E-2", title:"Specialist 2", abbr:"Spc2", insignia:"▲" },
      { grade:"E-3", title:"Specialist 3", abbr:"Spc3", insignia:"▲▲▲" },
      { grade:"E-4", title:"Specialist 4", abbr:"Spc4", insignia:"⬡" },
      { grade:"E-5", title:"Sergeant", abbr:"Sgt", insignia:"⬡⬡⬡" },
      { grade:"E-6", title:"Technical Sergeant", abbr:"TSgt", insignia:"⬡⬡⬡" },
      { grade:"E-7", title:"Master Sergeant", abbr:"MSgt", insignia:"⬡⬡⬡" },
      { grade:"E-8", title:"Senior Master Sergeant", abbr:"SMSgt", insignia:"⬡⬡⬡" },
      { grade:"E-9", title:"Chief Master Sergeant", abbr:"CMSgt", insignia:"★" },
    ],
    warrant: [],
    officer: [
      { grade:"O-1", title:"Second Lieutenant", abbr:"2d Lt", insignia:"▧" },
      { grade:"O-2", title:"First Lieutenant", abbr:"1st Lt", insignia:"▧▧" },
      { grade:"O-3", title:"Captain", abbr:"Capt", insignia:"✦" },
      { grade:"O-4", title:"Major", abbr:"Maj", insignia:"🔶" },
      { grade:"O-5", title:"Lieutenant Colonel", abbr:"Lt Col", insignia:"⬟" },
      { grade:"O-6", title:"Colonel", abbr:"Col", insignia:"🦅" },
      { grade:"O-7", title:"Brigadier General", abbr:"Brig Gen", insignia:"★" },
      { grade:"O-8", title:"Major General", abbr:"Maj Gen", insignia:"★★" },
      { grade:"O-9", title:"Lieutenant General", abbr:"Lt Gen", insignia:"★★★" },
      { grade:"O-10", title:"General", abbr:"Gen", insignia:"★★★★" },
    ]
  },
  "Coast Guard": {
    enlisted: [
      { grade:"E-1", title:"Seaman Recruit", abbr:"SR", insignia:"⬜" },
      { grade:"E-2", title:"Seaman Apprentice", abbr:"SA", insignia:"▲▲" },
      { grade:"E-3", title:"Seaman", abbr:"SN", insignia:"▲▲▲" },
      { grade:"E-4", title:"Petty Officer Third Class", abbr:"PO3", insignia:"⬡" },
      { grade:"E-5", title:"Petty Officer Second Class", abbr:"PO2", insignia:"⬡⬡" },
      { grade:"E-6", title:"Petty Officer First Class", abbr:"PO1", insignia:"⬡⬡⬡" },
      { grade:"E-7", title:"Chief Petty Officer", abbr:"CPO", insignia:"⚓" },
      { grade:"E-8", title:"Senior Chief Petty Officer", abbr:"SCPO", insignia:"⚓⚓" },
      { grade:"E-9", title:"Master Chief Petty Officer", abbr:"MCPO", insignia:"⚓⚓⚓" },
      { grade:"E-9", title:"Master Chief Petty Officer of the Coast Guard", abbr:"MCPOCG", insignia:"★" },
    ],
    warrant: [
      { grade:"W-2", title:"Chief Warrant Officer 2", abbr:"CWO2", insignia:"▬▬" },
      { grade:"W-3", title:"Chief Warrant Officer 3", abbr:"CWO3", insignia:"▬▬▬" },
      { grade:"W-4", title:"Chief Warrant Officer 4", abbr:"CWO4", insignia:"▬▬▬▬" },
    ],
    officer: [
      { grade:"O-1", title:"Ensign", abbr:"ENS", insignia:"▧" },
      { grade:"O-2", title:"Lieutenant Junior Grade", abbr:"LTJG", insignia:"▧▧" },
      { grade:"O-3", title:"Lieutenant", abbr:"LT", insignia:"✦" },
      { grade:"O-4", title:"Lieutenant Commander", abbr:"LCDR", insignia:"🔶" },
      { grade:"O-5", title:"Commander", abbr:"CDR", insignia:"⬟" },
      { grade:"O-6", title:"Captain", abbr:"CAPT", insignia:"🦅" },
      { grade:"O-7", title:"Rear Admiral", abbr:"RDML", insignia:"★" },
      { grade:"O-8", title:"Vice Admiral", abbr:"VADM", insignia:"★★" },
      { grade:"O-9", title:"Admiral", abbr:"ADM", insignia:"★★★" },
    ]
  }
};

var BRANCH_QUALS = {
  "Army": {
    label: "Additional Skill Identifiers (ASI)",
    items: [
      // Airborne & Special Operations
      { code:"2S", desc:"Ranger Qualified" },
      { code:"5Q", desc:"Master Gunner" },
      { code:"8A", desc:"Airborne" },
      { code:"P1", desc:"Master Parachutist" },
      { code:"W1", desc:"SERE Trained" },
      { code:"X3", desc:"Military Instructor" },
      { code:"V5", desc:"Battle Staff Operations" },
      { code:"2T", desc:"Jumpmaster" },
      { code:"4T", desc:"Military Freefall Parachutist" },
      { code:"5V", desc:"Special Forces Weapons Sergeant" },
      { code:"Y9", desc:"Nuclear Weapons Technical" },
      // Combat Arms
      { code:"B3", desc:"Linguist" },
      { code:"G2", desc:"Combatives Level II" },
      { code:"G3", desc:"Combatives Level III" },
      { code:"G4", desc:"Combatives Level IV (Instructor)" },
      { code:"1M", desc:"Unmanned Aircraft Systems Operator" },
      { code:"5C", desc:"Command and Control Systems Operator" },
      { code:"P3", desc:"Rigger" },
      { code:"V3", desc:"Observer Controller/Trainer" },
      // Intelligence & Cyber
      { code:"1N", desc:"Imagery Analyst" },
      { code:"2A", desc:"Computer/Network Defender" },
      { code:"3I", desc:"Inspector General" },
      { code:"3L", desc:"Legal Specialist" },
      { code:"1U", desc:"Unmanned Aircraft Systems Repairer" },
      { code:"9S", desc:"Technical Engineering" },
      // Medical
      { code:"1A", desc:"Flight Operations Coordinator" },
      { code:"4H", desc:"Hyperbaric Chamber Specialist" },
      { code:"M6", desc:"Healthcare NCO" },
      // Logistics & Transportation
      { code:"2W", desc:"Ammunition Stock Control" },
      { code:"3A", desc:"Clinical Laboratory" },
      { code:"4B", desc:"Unit Safety Officer/NCO" },
      { code:"4R", desc:"Chemical Officer/Specialist" },
      { code:"5M", desc:"Mortuary Affairs Specialist" },
      { code:"7F", desc:"Fleet Management" },
      // Leadership & Admin
      { code:"1Z", desc:"Senior Instructor/Writer" },
      { code:"2I", desc:"Nuclear Research and Operations" },
      { code:"2L", desc:"Polygraph Examiner" },
      { code:"3R", desc:"Recruiter" },
      { code:"4A", desc:"Parachute Rigger" },
      { code:"5K", desc:"Master Fitness Trainer" },
      { code:"6H", desc:"Retention NCO" },
      { code:"7P", desc:"Physical Security" },
      { code:"8L", desc:"Interagency Support" },
      { code:"9R", desc:"Drill Sergeant" },
    ],
    sqiLabel: "Skill Qualification Identifiers (SQI)",
    sqi: [
      { code:"F", desc:"Special Forces" },
      { code:"P", desc:"Parachutist (Basic)" },
      { code:"Q", desc:"Special Forces Enlisted" },
      { code:"R", desc:"Ranger" },
      { code:"S", desc:"Special Operations Support" },
      { code:"V", desc:"Aviation" },
      { code:"X", desc:"Instructor / Faculty" },
      { code:"Y", desc:"Transition NCO" },
      { code:"Z", desc:"Senior Sergeant / Leadership" },
      { code:"M", desc:"Maneuver Senior Advisor" },
    ]
  },
  "Marine Corps": {
    label: "MOS Additional Qualifications (MOS-AQs) & PMOS",
    items: [
      // Infantry & Recon
      { code:"0321", desc:"Reconnaissance Man" },
      { code:"0322", desc:"Reconnaissance Man (Parachute/Combatant Dive Qualified)" },
      { code:"0323", desc:"Reconnaissance Man (Parachute Qualified)" },
      { code:"0324", desc:"Reconnaissance Man (Combatant Dive Qualified)" },
      { code:"0370", desc:"Special Operations Officer" },
      { code:"0372", desc:"Critical Skills Operator" },
      { code:"0321M", desc:"Marine Raider" },
      // Aviation Ground Support
      { code:"7011", desc:"Expeditionary Airfield Systems Technician" },
      { code:"7212", desc:"Low Altitude Air Defense (LAAD) Gunner" },
      { code:"7242", desc:"Air Traffic Controller" },
      // Weapons & Marksmanship
      { code:"8531", desc:"Marksmanship Coach" },
      { code:"8532", desc:"Primary Marksmanship Instructor" },
      { code:"8541", desc:"Scout Sniper" },
      { code:"8542", desc:"Scout Sniper Team Leader" },
      // Special Skills
      { code:"8014", desc:"Combatant Diver" },
      { code:"8023", desc:"Jump-Qualified" },
      { code:"8026", desc:"Military Freefall Parachutist" },
      { code:"8621", desc:"SERE Instructor" },
      { code:"8999", desc:"Marine Corps Martial Arts Instructor" },
      { code:"0911", desc:"Drill Instructor" },
      { code:"0913", desc:"Senior Drill Instructor" },
      { code:"0931", desc:"Marine Combat Instructor of Water Survival" },
      // Intelligence
      { code:"0231", desc:"Intelligence Specialist" },
      { code:"0241", desc:"Imagery Analysis Specialist" },
      { code:"0261", desc:"Geographic Intelligence Specialist" },
      // Communications & Cyber
      { code:"0689", desc:"Cyber Network Operator" },
      { code:"0699", desc:"Cyber Officer" },
      // Logistics
      { code:"3043", desc:"Supply Administration and Operations" },
      { code:"3044", desc:"Advanced Supply Marine" },
    ],
    sqiLabel: "Billet & Functional Qualifications",
    sqi: [
      { code:"DI", desc:"Drill Instructor Qualified" },
      { code:"SDI", desc:"Senior Drill Instructor" },
      { code:"RSO", desc:"Range Safety Officer" },
      { code:"PMI", desc:"Primary Marksmanship Instructor" },
      { code:"CFI", desc:"Combat Fitness Instructor" },
      { code:"MCIWS", desc:"Marine Combat Instructor of Water Survival" },
      { code:"MCMAP-BI", desc:"Martial Arts Instructor (Black Belt)" },
      { code:"CBRN", desc:"CBRN Defense Specialist" },
      { code:"JTAC", desc:"Joint Terminal Attack Controller" },
      { code:"JTAC-IP", desc:"JTAC Instructor / Evaluator" },
      { code:"FACIP", desc:"Forward Air Controller (Airborne) IP" },
    ]
  },
  "Navy": {
    label: "Navy Enlisted Classifications (NEC)",
    items: [
      // Special Warfare
      { code:"5326", desc:"Master-at-Arms (K9)" },
      { code:"5342", desc:"SEAL (Combatant Swimmer)" },
      { code:"5343", desc:"SEAL Delivery Vehicle Team" },
      { code:"5348", desc:"Special Warfare Boat Operator" },
      { code:"5350", desc:"Special Warfare Combatant Craft Crewman (SWCC)" },
      { code:"5355", desc:"SEAL Support" },
      // Diving & Underwater
      { code:"8425", desc:"Navy Diver (Second Class)" },
      { code:"8434", desc:"Navy Diver (First Class)" },
      { code:"8491", desc:"Diver (Saturation / Deep Sea)" },
      { code:"8493", desc:"Rescue Swimmer" },
      { code:"8494", desc:"Search and Rescue Swimmer" },
      { code:"5342", desc:"Combatant Swimmer (SEAL)" },
      // Aviation
      { code:"8201", desc:"Naval Flight Officer" },
      { code:"8206", desc:"Naval Aviator" },
      { code:"8301", desc:"Aviation Maintenance Administration" },
      { code:"8302", desc:"Naval Aviation Maintenance Technician" },
      // Intelligence & Crypto
      { code:"7802", desc:"Cryptologic Technician (Collection)" },
      { code:"7814", desc:"Cryptologic Technician (Maintenance)" },
      { code:"7818", desc:"Cryptologic Technician (Networks)" },
      { code:"7821", desc:"Cryptologic Technician (Technical)" },
      { code:"7830", desc:"Cryptologic Technician (Interpretive)" },
      { code:"9502", desc:"Master Training Specialist (MTS)" },
      // Medical
      { code:"8402", desc:"Independent Duty Corpsman (IDC)" },
      { code:"8403", desc:"Special Operations Corpsman (SOCM)" },
      { code:"8404", desc:"Field Medical Service Technician" },
      { code:"8427", desc:"Aerospace Medical Technician" },
      // Electronics & IT
      { code:"2791", desc:"Electronics Warfare Technician" },
      { code:"1130", desc:"Electronics Technician" },
      { code:"1146", desc:"Data Systems Technician" },
      { code:"0000", desc:"EOD Technician" },
      { code:"2302", desc:"Machinist's Mate (Nuclear)" },
      { code:"2514", desc:"Gunner's Mate (Missiles)" },
      { code:"1550", desc:"Information Systems Technician" },
      { code:"2514W", desc:"Gunner's Mate (Weapons)" },
      // Security & Law Enforcement
      { code:"9578", desc:"Navy Corrections Specialist" },
      { code:"2005", desc:"Explosive Ordnance Disposal (EOD)" },
      // Logistics & Supply
      { code:"2512", desc:"Aviation Storekeeper" },
      { code:"3501", desc:"Logistics Specialist" },
      { code:"2721", desc:"Equipment Operator" },
    ],
    sqiLabel: "Warfare Designators",
    sqi: [
      { code:"EAWS", desc:"Enlisted Aviation Warfare Specialist" },
      { code:"ESWS", desc:"Enlisted Surface Warfare Specialist" },
      { code:"SSWS", desc:"Submarine Warfare Specialist" },
      { code:"EXW", desc:"Expeditionary Warfare Specialist" },
      { code:"ESCS", desc:"Enlisted Sailor Costal Riverine" },
      { code:"ESSS", desc:"Enlisted Special Warfare/Special Operations Support" },
      { code:"EMS", desc:"Enlisted Mine Warfare Specialist" },
      { code:"ENWS", desc:"Enlisted Nuclear Warfare Specialist" },
      { code:"EDWS", desc:"Enlisted Diving Warfare Specialist" },
      { code:"MTS", desc:"Master Training Specialist" },
      { code:"BUDS", desc:"Basic Underwater Demolition/SEAL Graduate" },
      { code:"SWO", desc:"Surface Warfare Officer" },
      { code:"CWO", desc:"Coastal Warfare Officer" },
    ]
  },
  "Air Force": {
    label: "Special Experience Identifiers (SEI) & Additional Qualifications",
    items: [
      // Special Operations
      { code:"215", desc:"Combat Controller (CCT)" },
      { code:"216", desc:"Pararescue (PJ)" },
      { code:"217", desc:"Special Tactics Officer" },
      { code:"218", desc:"SERE Specialist" },
      { code:"219", desc:"Combat Weather Technician" },
      { code:"220", desc:"Special Operations Intelligence" },
      { code:"221", desc:"Tactical Air Control Party (TACP)" },
      { code:"222", desc:"Psychological Operations" },
      { code:"253", desc:"Special Reconnaissance" },
      { code:"254", desc:"Air Force Office of Special Investigations (AFOSI)" },
      // Cyber & Intelligence
      { code:"378", desc:"Cyber Operations Specialist" },
      { code:"379", desc:"Information Operations" },
      { code:"381", desc:"Signals Intelligence" },
      { code:"382", desc:"Geospatial Intelligence" },
      { code:"383", desc:"Targeting" },
      { code:"384", desc:"All-Source Intelligence" },
      { code:"385", desc:"Human Intelligence (HUMINT)" },
      { code:"386", desc:"Counterintelligence" },
      // Aviation
      { code:"301", desc:"Instructor Pilot" },
      { code:"302", desc:"Instrument Flight Examiner" },
      { code:"303", desc:"Wing Standardization/Evaluation" },
      { code:"304", desc:"Formation Lead Qualified" },
      { code:"305", desc:"Aircraft Commander" },
      { code:"312", desc:"Remotely Piloted Aircraft (RPA) Instructor" },
      { code:"313", desc:"Bomber Crew Member" },
      // Nuclear
      { code:"4BX", desc:"Nuclear Weapons" },
      { code:"2W0", desc:"Munitions Systems" },
      { code:"2W1", desc:"Nuclear Weapons" },
      // Medical & Support
      { code:"4H", desc:"Independent Duty Medical Technician (IDMT)" },
      { code:"4N", desc:"Aerospace Medical Service" },
      // Leadership & Admin  
      { code:"UD", desc:"Unit Deployment Manager" },
      { code:"FO", desc:"Flight Operations" },
      { code:"IO", desc:"Inspector General" },
      { code:"WM", desc:"Weapons Manager" },
      { code:"SE", desc:"Flight Safety Officer" },
      { code:"ES", desc:"Emergency Management" },
      // Training
      { code:"EX", desc:"Formal Training Unit (FTU) Instructor" },
      { code:"XO", desc:"Operations Officer / Exec" },
    ],
    sqiLabel: "Prefixes & Additional Duty Identifiers",
    sqi: [
      { code:"C", desc:"Commander" },
      { code:"G", desc:"Ground Training Flight Commander" },
      { code:"J", desc:"Joint Duty Assignment" },
      { code:"M", desc:"Mobility" },
      { code:"N", desc:"Nuclear Certified" },
      { code:"O", desc:"Inspector" },
      { code:"S", desc:"Safety" },
      { code:"U", desc:"Unit Deployment Manager" },
      { code:"W", desc:"Weapons Officer" },
      { code:"X", desc:"Executive Officer" },
      { code:"65D", desc:"Developmental Engineer" },
      { code:"13S", desc:"Space Operations Officer" },
    ]
  },
  "Space Force": {
    label: "Space Force Specialty Codes (SFSC)",
    items: [
      // Space Operations
      { code:"1C6X1", desc:"Space Systems Operations — Missile Warning" },
      { code:"1C6X2", desc:"Space Systems Operations — Space Control" },
      { code:"1C6X3", desc:"Space Systems Operations — Satellite" },
      { code:"1C6X4", desc:"Space Systems Operations — Space Electronic Warfare" },
      { code:"13SXA", desc:"Space Operations Officer — Orbital Warfare" },
      { code:"13SXB", desc:"Space Operations Officer — Space Domain Awareness" },
      { code:"13SXC", desc:"Space Operations Officer — Missile Warning" },
      { code:"13SXD", desc:"Space Operations Officer — Command & Control" },
      // Cyber & Intelligence
      { code:"17SX", desc:"Cyberspace Officer" },
      { code:"14NX", desc:"Intelligence Officer" },
      { code:"1N0XX", desc:"Operations Intelligence Analyst" },
      { code:"1N4XX", desc:"Fusion Analyst" },
      // Engineering & Systems
      { code:"61AX", desc:"Science and Engineering — Research Scientist" },
      { code:"62EX", desc:"Developmental Engineer" },
      { code:"63AX", desc:"Acquisition Manager" },
      { code:"21AX", desc:"Test and Evaluation" },
      // Maintenance & Support
      { code:"2M0X1", desc:"Missile and Space Systems Electronic Maintenance" },
      { code:"2M0X2", desc:"Missile and Space Systems Maintenance" },
      { code:"2M0X3", desc:"Missile and Space Facilities" },
    ],
    sqiLabel: "Space Force Additional Qualifications",
    sqi: [
      { code:"CC", desc:"Command Qualified" },
      { code:"MC", desc:"Mission Commander" },
      { code:"OC", desc:"Orbital Analyst Certified" },
      { code:"IC", desc:"Intelligence Certified" },
      { code:"CY", desc:"Cyber Operator Certified" },
      { code:"WT", desc:"Weapons & Tactics" },
    ]
  },
  "Coast Guard": {
    label: "Coast Guard Ratings & Specialty Qualifications",
    items: [
      // Law Enforcement & Security
      { code:"ME", desc:"Maritime Enforcement Specialist" },
      { code:"MEI", desc:"Maritime Enforcement Specialist — Investigator" },
      { code:"PS", desc:"Port Security Specialist" },
      { code:"BT-M", desc:"Boarding Team Member" },
      { code:"BTO", desc:"Boarding Team Officer" },
      { code:"BTL", desc:"Boarding Team Leader" },
      { code:"MIO", desc:"Maritime Intelligence Operations" },
      // Aviation
      { code:"AET", desc:"Aviation Electrical Technician" },
      { code:"AMT", desc:"Aviation Maintenance Technician" },
      { code:"AST", desc:"Aviation Survival Technician" },
      { code:"AVI", desc:"Avionics" },
      { code:"RS", desc:"Rescue Swimmer (Aircrewman)" },
      { code:"FCA", desc:"Flight Clearance Authority" },
      // Maritime Operations
      { code:"CX", desc:"Coxswain Qualified" },
      { code:"HMCX", desc:"Heavy/Medium Coxswain" },
      { code:"OOW", desc:"Officer of the Watch" },
      { code:"OOD", desc:"Officer of the Deck" },
      { code:"SAR", desc:"Search and Rescue Coordinator (SMC)" },
      { code:"OSC", desc:"On-Scene Commander" },
      // Engineering & Deck
      { code:"ENG", desc:"Marine Engineering Watch Officer" },
      { code:"DBO", desc:"Deck Boat Operator" },
      { code:"MK", desc:"Machinery Technician" },
      { code:"ET", desc:"Electronics Technician" },
      { code:"DC", desc:"Damage Controlman" },
      // Intelligence & Comms
      { code:"IS", desc:"Intelligence Specialist" },
      { code:"IT", desc:"Information Systems Technician" },
      { code:"TC", desc:"Telecommunications Specialist" },
      // Aids to Navigation & Environment
      { code:"ATON", desc:"Aids to Navigation Specialist" },
      { code:"MSO", desc:"Marine Safety Officer" },
      { code:"MERPOL", desc:"Marine Environmental Protection" },
      { code:"ANT", desc:"Aids to Navigation Team (Inshore)" },
      { code:"DP", desc:"Dive Qualified" },
    ],
    sqiLabel: "Warfare & Specialty Qualifications",
    sqi: [
      { code:"EXW", desc:"Expeditionary Warfare Specialist" },
      { code:"MSRT", desc:"Maritime Security Response Team" },
      { code:"MSST", desc:"Maritime Safety and Security Team" },
      { code:"PSU", desc:"Port Security Unit Qualified" },
      { code:"TACLET", desc:"Tactical Law Enforcement Team" },
      { code:"MSLO", desc:"Marine Safety and Law Enforcement Officer" },
      { code:"SMCR", desc:"SAR Mission Coordinator Refresher" },
      { code:"AWO", desc:"Anti-Terrorism Watch Officer" },
      { code:"RSO", desc:"Range Safety Officer" },
    ]
  },
};
// Fallback for unknown branches

var COMMON_ADDL_DUTIES = [
  "Unit Armorer","NBC/CBRN Officer","Equal Opportunity Leader","Safety Officer/NCO","Master Driver","Unit Prevention Leader (UPL/Drug Testing)","Retention NCO","Casualty Notification Officer","Family Readiness Officer/NCO","Sexual Harassment/Assault Response (SHARP) Coordinator","Records Management","Information Security Officer","Operations Security (OPSEC) Coordinator","Physical Security Officer","Inspector General Representative","Unit Fund Custodian","Training Room NCO","Supply Sergeant (additional duty)","Contracting Officer Representative (COR)","Property Book Officer","Master Gunner","Battle Staff NCO","Recruiter/Career Counselor","Casualty Liaison Officer",
];

var UNIVERSITIES = [
  "American Military University","American Public University","Arizona State University",
  "Auburn University","Boston University","Brigham Young University",
  "Carnegie Mellon University","City University of New York","Clemson University",
  "Colorado State University","Columbia University","Cornell University",
  "Duke University","Embry-Riddle Aeronautical University",
  "Florida International University","Florida State University",
  "George Mason University","George Washington University","Georgetown University",
  "Georgia Institute of Technology","Harvard University","Indiana University",
  "Iowa State University","Johns Hopkins University","Kansas State University",
  "Liberty University","Louisiana State University","MIT",
  "Michigan State University","Mississippi State University",
  "Naval Postgraduate School","New York University","Northeastern University",
  "Northwestern University","Ohio State University","Old Dominion University",
  "Penn State University","Purdue University","Regent University",
  "Rice University","Rutgers University","San Diego State University",
  "Southern New Hampshire University","Stanford University","Syracuse University",
  "Temple University","Texas A&M University","Texas Tech University",
  "Trident University","Troy University","Tulane University",
  "UCLA","UNC Chapel Hill","University of Alabama","University of Arizona",
  "University of Central Florida","University of Cincinnati","University of Colorado",
  "University of Connecticut","University of Florida","University of Georgia",
  "University of Houston","University of Illinois","University of Maryland",
  "University of Michigan","University of Minnesota","University of Missouri",
  "University of Nebraska","University of New Mexico","University of Oklahoma",
  "University of Oregon","University of Pennsylvania","University of Phoenix",
  "University of Pittsburgh","University of South Carolina","University of Southern California",
  "University of Tennessee","University of Texas","University of Utah",
  "University of Virginia","University of Washington","University of Wisconsin",
  "Vanderbilt University","Virginia Tech","Wake Forest University",
  "Western Governors University","Yale University",
  "Air War College","Army War College","Naval War College",
  "Command and General Staff College","Marine Corps University",
  "National Defense University","Defense Acquisition University",
  "Community College of the Air Force",
];

var RESUME_FORMATS = [
  {id:"ats_chrono",label:"ATS Chronological",badge:"Most Common",desc:"Reverse-order work history, keyword-optimized for applicant tracking systems. Best for most online applications. Recommended for 90% of veteran transitions."},
  {id:"ats_combo",label:"ATS Combination",badge:"Veterans Recommended",desc:"Opens with a skills summary block, then reverse-chronological experience. Ideal for veterans with diverse roles or pivoting careers — shows what you can do before where you did it."},
  {id:"functional",label:"Functional (Skills-First)",badge:"Career Changers",desc:"Groups experience by skill category rather than timeline. Best if you have an employment gap, significant career pivot (e.g. infantry → healthcare), or want to downplay time between jobs."},
  {id:"federal",label:"Federal / USAJobs",badge:"Gov Jobs",desc:"Detailed OPM-compliant format required for federal government jobs on USAJOBS. Much longer than a standard resume — includes hours/week, supervisor info, and detailed KSAs. Required for GS positions."},
  {id:"executive",label:"Executive",badge:"O-5+ & Senior NCOs",desc:"Leadership-focused. Opens with an executive summary, core competencies grid, and career highlights. Best for O-5+ and senior NCOs targeting management and director-level civilian roles."},
  {id:"traditional",label:"Traditional",badge:"Conservative Industries",desc:"Clean, conservative single-column. Best for law enforcement, government, legal, finance, and formal industries where simple clarity signals professionalism."},
  {id:"modern",label:"Modern Professional",badge:"Corporate & Tech",desc:"Clean contemporary layout with subtle visual hierarchy. Great for corporate, tech, and private-sector roles where first impressions matter."},
  {id:"harvard",label:"Harvard Style",badge:"Academic & Professional",desc:"Single-column, clean, highly credible. Conservative and polished — the same format used by Harvard MBA graduates. Strong for consulting, law, policy, and professional roles."},
  {id:"wharton",label:"Wharton / MBA Style",badge:"Business Leadership",desc:"Achievement-heavy, results-driven with sharp formatting. Education listed first. Ideal for MBA programs, business leadership, and corporate strategy roles."},
  {id:"minimalist",label:"Minimalist",badge:"Standout Clarity",desc:"Maximum white space, simple typography. Easy to scan in under 10 seconds. Great when you want your content to speak without competition from formatting."},
  {id:"creative",label:"Creative",badge:"Design & Media",desc:"Visual layout for design, media, branding, and creative industries. Not recommended for most veteran-to-civilian transitions — choose ATS formats for most corporate roles."},
];

var MOS_DATA = {
  // ── ARMY ──────────────────────────────────────────────────────────────────
  "11A":{ title:"Infantry Officer", branch:"Army" },
  "11B":{ title:"Infantryman", branch:"Army" },
  "11C":{ title:"Indirect Fire Infantryman", branch:"Army" },
  "11Z":{ title:"Infantry Senior Sergeant", branch:"Army" },
  "12A":{ title:"Engineer Officer", branch:"Army" },
  "12B":{ title:"Combat Engineer", branch:"Army" },
  "12C":{ title:"Bridge Crewmember", branch:"Army" },
  "12D":{ title:"Diver", branch:"Army" },
  "12N":{ title:"Horizontal Construction Engineer", branch:"Army" },
  "12P":{ title:"Prime Power Production Specialist", branch:"Army" },
  "12R":{ title:"Interior Electrician", branch:"Army" },
  "12T":{ title:"Technical Engineer", branch:"Army" },
  "12W":{ title:"Carpentry and Masonry Specialist", branch:"Army" },
  "12Y":{ title:"Geospatial Engineer", branch:"Army" },
  "12Z":{ title:"Combat Engineering Senior Sergeant", branch:"Army" },
  "13A":{ title:"Field Artillery Officer", branch:"Army" },
  "13B":{ title:"Cannon Crewmember", branch:"Army" },
  "13D":{ title:"Field Artillery Automated Tactical Data Systems Specialist", branch:"Army" },
  "13F":{ title:"Fire Support Specialist", branch:"Army" },
  "13J":{ title:"Fire Control Specialist", branch:"Army" },
  "13M":{ title:"Multiple Launch Rocket System Crew Member", branch:"Army" },
  "13P":{ title:"MLRS Operations Fire Direction Specialist", branch:"Army" },
  "13R":{ title:"Field Artillery Firefinder Radar Operator", branch:"Army" },
  "13Z":{ title:"Field Artillery Senior Sergeant", branch:"Army" },
  "14A":{ title:"Air Defense Artillery Officer", branch:"Army" },
  "14G":{ title:"Air Defense Battle Management System Operator", branch:"Army" },
  "14H":{ title:"Air Defense Enhanced Early Warning System Operator", branch:"Army" },
  "14P":{ title:"Air and Missile Defense Crew Member", branch:"Army" },
  "14S":{ title:"Avenger Crewmember", branch:"Army" },
  "14T":{ title:"Patriot MIM-104 Operator/Maintainer", branch:"Army" },
  "14Z":{ title:"Air Defense Artillery Senior Sergeant", branch:"Army" },
  "15A":{ title:"Aviation Officer", branch:"Army" },
  "15B":{ title:"Aircraft Powerplant Repairer", branch:"Army" },
  "15D":{ title:"Aircraft Powertrain Repairer", branch:"Army" },
  "15E":{ title:"Unmanned Aircraft Systems Repairer", branch:"Army" },
  "15F":{ title:"Aircraft Electrician", branch:"Army" },
  "15G":{ title:"Aircraft Structural Repairer", branch:"Army" },
  "15H":{ title:"Aircraft Pneudraulics Repairer", branch:"Army" },
  "15N":{ title:"Avionic Mechanic", branch:"Army" },
  "15P":{ title:"Aviation Operations Specialist", branch:"Army" },
  "15Q":{ title:"Air Traffic Control Operator", branch:"Army" },
  "15R":{ title:"AH-64 Attack Helicopter Repairer", branch:"Army" },
  "15S":{ title:"OH-58D Helicopter Repairer", branch:"Army" },
  "15T":{ title:"UH-60 Helicopter Repairer", branch:"Army" },
  "15U":{ title:"CH-47 Helicopter Repairer", branch:"Army" },
  "15W":{ title:"UAS Operator", branch:"Army" },
  "15Y":{ title:"AH-64D Armament/Electrical/Avionic Systems Repairer", branch:"Army" },
  "18A":{ title:"Special Forces Officer", branch:"Army" },
  "18B":{ title:"Special Forces Weapons Sergeant", branch:"Army" },
  "18C":{ title:"Special Forces Engineer Sergeant", branch:"Army" },
  "18D":{ title:"Special Forces Medical Sergeant", branch:"Army" },
  "18E":{ title:"Special Forces Communications Sergeant", branch:"Army" },
  "18F":{ title:"Special Forces Intel Sergeant", branch:"Army" },
  "18Z":{ title:"Special Forces Senior Sergeant", branch:"Army" },
  "19D":{ title:"Cavalry Scout", branch:"Army" },
  "19K":{ title:"M1 Armor Crewman", branch:"Army" },
  "19Z":{ title:"Armor Senior Sergeant", branch:"Army" },
  "25A":{ title:"Signal Officer", branch:"Army" },
  "25B":{ title:"IT Specialist", branch:"Army" },
  "25C":{ title:"Radio Operator-Maintainer", branch:"Army" },
  "25D":{ title:"Cyber Network Defender", branch:"Army" },
  "25E":{ title:"Electromagnetic Spectrum Manager", branch:"Army" },
  "25L":{ title:"Cable Systems Installer-Maintainer", branch:"Army" },
  "25M":{ title:"Multimedia Illustrator", branch:"Army" },
  "25N":{ title:"Nodal Network Systems Operator-Maintainer", branch:"Army" },
  "25P":{ title:"Microwave Systems Operator-Maintainer", branch:"Army" },
  "25Q":{ title:"Multichannel Transmission Systems Operator-Maintainer", branch:"Army" },
  "25R":{ title:"Visual Information Equipment Operator-Maintainer", branch:"Army" },
  "25S":{ title:"Satellite Communication Systems Operator", branch:"Army" },
  "25U":{ title:"Signal Support Systems Specialist", branch:"Army" },
  "25V":{ title:"Combat Documentation/Production Specialist", branch:"Army" },
  "25W":{ title:"Telecommunications Operations Chief", branch:"Army" },
  "25X":{ title:"Chief Signal Officer", branch:"Army" },
  "25Z":{ title:"Visual Information Operations Chief", branch:"Army" },
  "27A":{ title:"Judge Advocate (JAG Officer)", branch:"Army" },
  "27D":{ title:"Paralegal Specialist", branch:"Army" },
  "29E":{ title:"Electronic Warfare Specialist", branch:"Army" },
  "31A":{ title:"Military Police Officer", branch:"Army" },
  "31B":{ title:"Military Police", branch:"Army" },
  "31D":{ title:"Criminal Investigation Agent", branch:"Army" },
  "31E":{ title:"Internment/Resettlement Specialist", branch:"Army" },
  "31K":{ title:"Military Working Dog Handler", branch:"Army" },
  "35A":{ title:"Military Intelligence Officer", branch:"Army" },
  "35F":{ title:"Intelligence Analyst", branch:"Army" },
  "35G":{ title:"Geospatial Intelligence Imagery Analyst", branch:"Army" },
  "35H":{ title:"Collection Manager", branch:"Army" },
  "35L":{ title:"Counterintelligence Agent", branch:"Army" },
  "35M":{ title:"Human Intelligence Collector", branch:"Army" },
  "35N":{ title:"SIGINT Analyst", branch:"Army" },
  "35P":{ title:"Cryptologic Linguist", branch:"Army" },
  "35Q":{ title:"Cryptologic Network Warfare Specialist", branch:"Army" },
  "35S":{ title:"Signals Collector/Analyst", branch:"Army" },
  "35T":{ title:"Military Intelligence Systems Maintainer/Integrator", branch:"Army" },
  "36A":{ title:"Financial Management Officer", branch:"Army" },
  "36B":{ title:"Financial Management Technician", branch:"Army" },
  "37F":{ title:"Psychological Operations Specialist", branch:"Army" },
  "38A":{ title:"Civil Affairs Officer", branch:"Army" },
  "38B":{ title:"Civil Affairs Specialist", branch:"Army" },
  "42A":{ title:"Human Resources Specialist", branch:"Army" },
  "42B":{ title:"Human Resources Officer", branch:"Army" },
  "46A":{ title:"Public Affairs Officer", branch:"Army" },
  "46Q":{ title:"Public Affairs Specialist", branch:"Army" },
  "46R":{ title:"Public Affairs Broadcast Specialist", branch:"Army" },
  "51A":{ title:"Acquisition Manager", branch:"Army" },
  "51C":{ title:"Acquisition, Logistics and Technology Contracting", branch:"Army" },
  "56A":{ title:"Chaplain", branch:"Army" },
  "56M":{ title:"Religious Affairs Specialist", branch:"Army" },
  "60A":{ title:"Operational Medicine Officer", branch:"Army" },
  "61A":{ title:"Internist", branch:"Army" },
  "65D":{ title:"Physician Assistant", branch:"Army" },
  "66B":{ title:"Women's Health Nurse Practitioner", branch:"Army" },
  "68A":{ title:"Biomedical Equipment Specialist", branch:"Army" },
  "68B":{ title:"Orthopedic Specialist", branch:"Army" },
  "68C":{ title:"Practical Nursing Specialist", branch:"Army" },
  "68D":{ title:"Operating Room Specialist", branch:"Army" },
  "68E":{ title:"Dental Specialist", branch:"Army" },
  "68F":{ title:"Physical Therapy Specialist", branch:"Army" },
  "68G":{ title:"Patient Administration Specialist", branch:"Army" },
  "68H":{ title:"Optical Laboratory Specialist", branch:"Army" },
  "68J":{ title:"Medical Logistics Specialist", branch:"Army" },
  "68K":{ title:"Medical Laboratory Specialist", branch:"Army" },
  "68M":{ title:"Nutrition Care Specialist", branch:"Army" },
  "68P":{ title:"Radiology Specialist", branch:"Army" },
  "68Q":{ title:"Pharmacy Specialist", branch:"Army" },
  "68R":{ title:"Veterinary Food Inspection Specialist", branch:"Army" },
  "68S":{ title:"Preventive Medicine Specialist", branch:"Army" },
  "68T":{ title:"Animal Care Specialist", branch:"Army" },
  "68V":{ title:"Respiratory Specialist", branch:"Army" },
  "68W":{ title:"Combat Medic Specialist", branch:"Army" },
  "68X":{ title:"Behavioral Health Specialist", branch:"Army" },
  "68Z":{ title:"Chief Medical NCO", branch:"Army" },
  "74D":{ title:"CBRN Specialist", branch:"Army" },
  "79R":{ title:"Recruiter", branch:"Army" },
  "79S":{ title:"Career Counselor", branch:"Army" },
  "79T":{ title:"Recruiting and Retention NCO", branch:"Army" },
  "88A":{ title:"Transportation Officer", branch:"Army" },
  "88H":{ title:"Cargo Specialist", branch:"Army" },
  "88K":{ title:"Watercraft Operator", branch:"Army" },
  "88L":{ title:"Watercraft Engineer", branch:"Army" },
  "88M":{ title:"Motor Transport Operator", branch:"Army" },
  "88N":{ title:"Transportation Management Coordinator", branch:"Army" },
  "88Z":{ title:"Transportation Senior Sergeant", branch:"Army" },
  "89A":{ title:"Ammunition Stock Control and Accounting Specialist", branch:"Army" },
  "89B":{ title:"Ammunition Specialist", branch:"Army" },
  "89D":{ title:"Explosive Ordnance Disposal Specialist", branch:"Army" },
  "91A":{ title:"Ordnance Officer", branch:"Army" },
  "91B":{ title:"Wheeled Vehicle Mechanic", branch:"Army" },
  "91C":{ title:"Utilities Equipment Repairer", branch:"Army" },
  "91D":{ title:"Power Generation Equipment Repairer", branch:"Army" },
  "91E":{ title:"Allied Trade Specialist", branch:"Army" },
  "91F":{ title:"Small Arms/Artillery Repairer", branch:"Army" },
  "91H":{ title:"Track Vehicle Repairer", branch:"Army" },
  "91J":{ title:"Quartermaster and Chemical Equipment Repairer", branch:"Army" },
  "91L":{ title:"Construction Equipment Repairer", branch:"Army" },
  "91M":{ title:"Bradley Fighting Vehicle Systems Maintainer", branch:"Army" },
  "91P":{ title:"Artillery Mechanic", branch:"Army" },
  "91S":{ title:"Stryker Systems Maintainer", branch:"Army" },
  "91X":{ title:"Maintenance Senior Sergeant", branch:"Army" },
  "91Z":{ title:"Mechanical Maintenance Supervisor", branch:"Army" },
  "92A":{ title:"Automated Logistical Specialist", branch:"Army" },
  "92F":{ title:"Petroleum Supply Specialist", branch:"Army" },
  "92G":{ title:"Culinary Specialist", branch:"Army" },
  "92L":{ title:"Petroleum Laboratory Specialist", branch:"Army" },
  "92M":{ title:"Mortuary Affairs Specialist", branch:"Army" },
  "92R":{ title:"Parachute Rigger", branch:"Army" },
  "92S":{ title:"Shower/Laundry and Clothing Repair Specialist", branch:"Army" },
  "92W":{ title:"Water Treatment Specialist", branch:"Army" },
  "92Y":{ title:"Unit Supply Specialist", branch:"Army" },
  "92Z":{ title:"Senior Logistician", branch:"Army" },
  "94A":{ title:"Land Combat Electronic Missile System Repairer", branch:"Army" },
  "94D":{ title:"Air Traffic Control Equipment Repairer", branch:"Army" },
  "94E":{ title:"Radio and Communications Security Repairer", branch:"Army" },
  "94F":{ title:"Computer Detection Systems Repairer", branch:"Army" },
  "94H":{ title:"Test Measurement and Diagnostic Equipment Maintenance", branch:"Army" },
  "94M":{ title:"Radar Repairer", branch:"Army" },
  "94R":{ title:"Avionic and Survivability Equipment Repairer", branch:"Army" },
  "94S":{ title:"PATRIOT System Repairer", branch:"Army" },
  "94T":{ title:"AVENGER System Repairer", branch:"Army" },
  "94W":{ title:"Electronic Maintenance Chief", branch:"Army" },
  "94X":{ title:"Senior Electronic Maintenance Chief", branch:"Army" },
  "94Z":{ title:"Senior Electronic Maintenance Chief WO", branch:"Army" },
  // ── MARINE CORPS ──────────────────────────────────────────────────────────
  "0111":{ title:"Administrative Specialist", branch:"Marine Corps" },
  "0161":{ title:"Postal Clerk", branch:"Marine Corps" },
  "0211":{ title:"Counterintelligence/HUMINT Specialist", branch:"Marine Corps" },
  "0231":{ title:"Intelligence Specialist", branch:"Marine Corps" },
  "0261":{ title:"Geographic Intelligence Specialist", branch:"Marine Corps" },
  "0311":{ title:"Rifleman", branch:"Marine Corps" },
  "0321":{ title:"Reconnaissance Marine", branch:"Marine Corps" },
  "0331":{ title:"Machine Gunner", branch:"Marine Corps" },
  "0341":{ title:"Mortarman", branch:"Marine Corps" },
  "0351":{ title:"Infantry Assaultman", branch:"Marine Corps" },
  "0352":{ title:"Antitank Missileman", branch:"Marine Corps" },
  "0411":{ title:"Maintenance Management Specialist", branch:"Marine Corps" },
  "0431":{ title:"Logistics/Embarkation Specialist", branch:"Marine Corps" },
  "0451":{ title:"Airborne and Air Delivery Specialist", branch:"Marine Corps" },
  "0481":{ title:"Landing Support Specialist", branch:"Marine Corps" },
  "0511":{ title:"MAGTF Planning Specialist", branch:"Marine Corps" },
  "0612":{ title:"Field Wireman", branch:"Marine Corps" },
  "0621":{ title:"Field Radio Operator", branch:"Marine Corps" },
  "0629":{ title:"Radio Chief", branch:"Marine Corps" },
  "0631":{ title:"Network Administrator", branch:"Marine Corps" },
  "0651":{ title:"Cyber Network Operator", branch:"Marine Corps" },
  "0689":{ title:"Cyber Warfare Chief", branch:"Marine Corps" },
  "1141":{ title:"Electrician", branch:"Marine Corps" },
  "1142":{ title:"Electrical Equipment Repair Specialist", branch:"Marine Corps" },
  "1161":{ title:"Refrigeration and Air Conditioning Mechanic", branch:"Marine Corps" },
  "1371":{ title:"Combat Engineer", branch:"Marine Corps" },
  "1391":{ title:"Bulk Fuel Specialist", branch:"Marine Corps" },
  "2111":{ title:"Small Arms Repairer/Technician", branch:"Marine Corps" },
  "2131":{ title:"Towed Artillery Systems Technician", branch:"Marine Corps" },
  "2146":{ title:"Main Battle Tank Repairer/Technician", branch:"Marine Corps" },
  "2147":{ title:"Light Armored Vehicle Repairer/Technician", branch:"Marine Corps" },
  "2161":{ title:"Machinist", branch:"Marine Corps" },
  "2171":{ title:"Electro-optical Ordnance Repairer", branch:"Marine Corps" },
  "2311":{ title:"Ammunition Technician", branch:"Marine Corps" },
  "2336":{ title:"EOD Technician", branch:"Marine Corps" },
  "2621":{ title:"Signals Intelligence Analyst", branch:"Marine Corps" },
  "2631":{ title:"Electronic Intelligence (ELINT) Analyst", branch:"Marine Corps" },
  "2651":{ title:"Special Communications Signals Collection Analyst", branch:"Marine Corps" },
  "2671":{ title:"Arabic Linguist", branch:"Marine Corps" },
  "2676":{ title:"Pashto Linguist", branch:"Marine Corps" },
  "3043":{ title:"Supply Administration and Operations", branch:"Marine Corps" },
  "3051":{ title:"Warehouse Clerk", branch:"Marine Corps" },
  "3052":{ title:"Packaging Specialist", branch:"Marine Corps" },
  "3112":{ title:"Traffic Management Specialist", branch:"Marine Corps" },
  "3212":{ title:"Water Support Technician", branch:"Marine Corps" },
  "3381":{ title:"Food Service Specialist", branch:"Marine Corps" },
  "4341":{ title:"Combat Correspondent", branch:"Marine Corps" },
  "4421":{ title:"Legal Services Specialist", branch:"Marine Corps" },
  "4612":{ title:"Combat Camera", branch:"Marine Corps" },
  "5512":{ title:"Explosive Ordnance Disposal", branch:"Marine Corps" },
  "5521":{ title:"Criminal Investigator", branch:"Marine Corps" },
  "5811":{ title:"Military Police", branch:"Marine Corps" },
  "5821":{ title:"Criminal Investigator", branch:"Marine Corps" },
  "6042":{ title:"Aircraft Maintenance Administration Specialist", branch:"Marine Corps" },
  "6046":{ title:"Aircraft Maintenance Chief", branch:"Marine Corps" },
  "6072":{ title:"Aircraft Intermediate Maintenance", branch:"Marine Corps" },
  "6113":{ title:"Fixed-Wing Aircraft Mechanic", branch:"Marine Corps" },
  "6122":{ title:"Helicopter Power Plants Mechanic", branch:"Marine Corps" },
  "6131":{ title:"Helicopter Dynamic Components Mechanic", branch:"Marine Corps" },
  "6153":{ title:"Tiltrotor Mechanic", branch:"Marine Corps" },
  "6173":{ title:"Helicopter Crew Chief", branch:"Marine Corps" },
  "6218":{ title:"Fixed-Wing Avionics Technician", branch:"Marine Corps" },
  "6312":{ title:"Fixed-Wing Aircraft Ordnance Systems Technician", branch:"Marine Corps" },
  "7011":{ title:"Expeditionary Airfield Systems Technician", branch:"Marine Corps" },
  "7041":{ title:"Aviation Operations Specialist", branch:"Marine Corps" },
  "7212":{ title:"LAAD Gunner", branch:"Marine Corps" },
  "7242":{ title:"Air Traffic Controller", branch:"Marine Corps" },
  "7251":{ title:"Air Traffic Controller", branch:"Marine Corps" },
  "8011":{ title:"Recruiting Officer", branch:"Marine Corps" },
  "8821":{ title:"Recruiter", branch:"Marine Corps" },
  // ── NAVY ──────────────────────────────────────────────────────────────────
  "AB":{ title:"Aviation Boatswain's Mate", branch:"Navy" },
  "AC":{ title:"Air Traffic Controller", branch:"Navy" },
  "AD":{ title:"Aviation Machinist's Mate", branch:"Navy" },
  "AE":{ title:"Aviation Electrician's Mate", branch:"Navy" },
  "AG":{ title:"Aerographer's Mate", branch:"Navy" },
  "AM":{ title:"Aviation Structural Mechanic", branch:"Navy" },
  "AME":{ title:"Aviation Structural Mechanic (Safety Equipment)", branch:"Navy" },
  "AO":{ title:"Aviation Ordnanceman", branch:"Navy" },
  "AS":{ title:"Aviation Support Equipment Technician", branch:"Navy" },
  "AT":{ title:"Aviation Electronics Technician", branch:"Navy" },
  "AW":{ title:"Naval Aircrewman", branch:"Navy" },
  "AZ":{ title:"Aviation Maintenance Administrationman", branch:"Navy" },
  "BM":{ title:"Boatswain's Mate", branch:"Navy" },
  "BU":{ title:"Builder (Seabee)", branch:"Navy" },
  "CE":{ title:"Construction Electrician (Seabee)", branch:"Navy" },
  "CM":{ title:"Construction Mechanic (Seabee)", branch:"Navy" },
  "CS":{ title:"Culinary Specialist", branch:"Navy" },
  "CSS":{ title:"Culinary Specialist (Submarine)", branch:"Navy" },
  "CTI":{ title:"Cryptologic Technician (Interpretive)", branch:"Navy" },
  "CTM":{ title:"Cryptologic Technician (Maintenance)", branch:"Navy" },
  "CTN":{ title:"Cryptologic Technician (Networks)", branch:"Navy" },
  "CTR":{ title:"Cryptologic Technician (Collection)", branch:"Navy" },
  "CTT":{ title:"Cryptologic Technician (Technical)", branch:"Navy" },
  "DC":{ title:"Damage Controlman", branch:"Navy" },
  "DK":{ title:"Disbursing Clerk", branch:"Navy" },
  "DT":{ title:"Dental Technician", branch:"Navy" },
  "EA":{ title:"Engineering Aide", branch:"Navy" },
  "EM":{ title:"Electrician's Mate", branch:"Navy" },
  "EMN":{ title:"Electrician's Mate (Nuclear)", branch:"Navy" },
  "EN":{ title:"Engineman", branch:"Navy" },
  "EO":{ title:"Equipment Operator (Seabee)", branch:"Navy" },
  "EOD":{ title:"Explosive Ordnance Disposal Technician", branch:"Navy" },
  "ET":{ title:"Electronics Technician", branch:"Navy" },
  "ETN":{ title:"Electronics Technician (Nuclear)", branch:"Navy" },
  "EW":{ title:"Electronic Warfare Technician", branch:"Navy" },
  "FC":{ title:"Fire Controlman", branch:"Navy" },
  "FT":{ title:"Fire Control Technician (Submarine)", branch:"Navy" },
  "GM":{ title:"Gunner's Mate", branch:"Navy" },
  "GS":{ title:"Gas Turbine Systems Technician", branch:"Navy" },
  "HM":{ title:"Hospital Corpsman", branch:"Navy" },
  "HT":{ title:"Hull Maintenance Technician", branch:"Navy" },
  "IC":{ title:"Interior Communications Electrician", branch:"Navy" },
  "IS":{ title:"Intelligence Specialist", branch:"Navy" },
  "IT":{ title:"Information Systems Technician", branch:"Navy" },
  "LN":{ title:"Legalman", branch:"Navy" },
  "LS":{ title:"Logistics Specialist", branch:"Navy" },
  "LSS":{ title:"Logistics Specialist (Submarine)", branch:"Navy" },
  "MA":{ title:"Master-at-Arms", branch:"Navy" },
  "MC":{ title:"Mass Communication Specialist", branch:"Navy" },
  "MM":{ title:"Machinist's Mate", branch:"Navy" },
  "MMN":{ title:"Machinist's Mate (Nuclear)", branch:"Navy" },
  "MN":{ title:"Mineman", branch:"Navy" },
  "MR":{ title:"Machinery Repairman", branch:"Navy" },
  "MT":{ title:"Missile Technician", branch:"Navy" },
  "MU":{ title:"Musician", branch:"Navy" },
  "ND":{ title:"Navy Diver", branch:"Navy" },
  "OS":{ title:"Operations Specialist", branch:"Navy" },
  "PR":{ title:"Aircrew Survival Equipmentman", branch:"Navy" },
  "PS":{ title:"Personnel Specialist", branch:"Navy" },
  "QM":{ title:"Quartermaster", branch:"Navy" },
  "RP":{ title:"Religious Program Specialist", branch:"Navy" },
  "SB":{ title:"Special Warfare Boat Operator", branch:"Navy" },
  "SH":{ title:"Ship's Serviceman", branch:"Navy" },
  "SO":{ title:"Special Warfare Operator (SEAL)", branch:"Navy" },
  "STG":{ title:"Sonar Technician (Surface)", branch:"Navy" },
  "STS":{ title:"Sonar Technician (Submarine)", branch:"Navy" },
  "SW":{ title:"Steelworker (Seabee)", branch:"Navy" },
  "TM":{ title:"Torpedoman's Mate", branch:"Navy" },
  "UT":{ title:"Utilitiesman (Seabee)", branch:"Navy" },
  "YN":{ title:"Yeoman", branch:"Navy" },
  "YNS":{ title:"Yeoman (Submarine)", branch:"Navy" },
  // ── AIR FORCE ─────────────────────────────────────────────────────────────
  "1A0":{ title:"In-Flight Refueling", branch:"Air Force" },
  "1A1":{ title:"Flight Engineer", branch:"Air Force" },
  "1A2":{ title:"Aircraft Loadmaster", branch:"Air Force" },
  "1A3":{ title:"Airborne Mission Systems Operator", branch:"Air Force" },
  "1A6":{ title:"Flight Attendant", branch:"Air Force" },
  "1A7":{ title:"Aerial Gunner", branch:"Air Force" },
  "1A8":{ title:"Airborne Cryptologic Language Analyst", branch:"Air Force" },
  "1B4":{ title:"Cyberspace Defense Operations", branch:"Air Force" },
  "1C0":{ title:"Aviation Resource Management", branch:"Air Force" },
  "1C1":{ title:"Air Traffic Control", branch:"Air Force" },
  "1C2":{ title:"Combat Control", branch:"Air Force" },
  "1C3":{ title:"Command Post", branch:"Air Force" },
  "1C4":{ title:"Tactical Air Control Party", branch:"Air Force" },
  "1C5":{ title:"Command and Control Battle Management", branch:"Air Force" },
  "1C6":{ title:"Space Systems Operations", branch:"Air Force" },
  "1C7":{ title:"Airfield Management", branch:"Air Force" },
  "1C8":{ title:"Radar, Airfield and Weather Systems", branch:"Air Force" },
  "1D7":{ title:"Cyberspace Systems Operations", branch:"Air Force" },
  "1G0":{ title:"Intelligence", branch:"Air Force" },
  "1N0":{ title:"Intelligence Analyst (Operations)", branch:"Air Force" },
  "1N1":{ title:"Geospatial Intelligence", branch:"Air Force" },
  "1N2":{ title:"Signals Intelligence Analysis", branch:"Air Force" },
  "1N3":{ title:"Cryptologic Language Analyst", branch:"Air Force" },
  "1N4":{ title:"Fusion Analyst", branch:"Air Force" },
  "1P0":{ title:"Aircrew Flight Equipment", branch:"Air Force" },
  "1S0":{ title:"Safety", branch:"Air Force" },
  "1T0":{ title:"Survival, Evasion, Resistance, and Escape (SERE)", branch:"Air Force" },
  "1T2":{ title:"Pararescue", branch:"Air Force" },
  "1U0":{ title:"Remotely Piloted Aircraft Sensor Operator", branch:"Air Force" },
  "1W0":{ title:"Weather", branch:"Air Force" },
  "2A2":{ title:"Integrated Avionics", branch:"Air Force" },
  "2A3":{ title:"A-10/F-15 Avionics Systems", branch:"Air Force" },
  "2A5":{ title:"Aerospace Maintenance", branch:"Air Force" },
  "2A6":{ title:"Aerospace Propulsion", branch:"Air Force" },
  "2A7":{ title:"Aircraft Fuel Systems", branch:"Air Force" },
  "2A8":{ title:"Mobility Air Forces Aircraft Maintenance", branch:"Air Force" },
  "2A9":{ title:"Bomber/Special Integrated Communication/Navigation Systems", branch:"Air Force" },
  "2F0":{ title:"Fuels", branch:"Air Force" },
  "2G0":{ title:"Logistics Plans", branch:"Air Force" },
  "2M0":{ title:"Missile and Space Systems Electronic Maintenance", branch:"Air Force" },
  "2P0":{ title:"Precision Measurement Equipment Laboratory", branch:"Air Force" },
  "2R0":{ title:"Maintenance Management Analysis", branch:"Air Force" },
  "2S0":{ title:"Material Management", branch:"Air Force" },
  "2T0":{ title:"Traffic Management", branch:"Air Force" },
  "2T1":{ title:"Vehicle Operations", branch:"Air Force" },
  "2T2":{ title:"Air Transportation", branch:"Air Force" },
  "2T3":{ title:"Vehicle and Vehicular Equipment Maintenance", branch:"Air Force" },
  "2W0":{ title:"Munitions Systems", branch:"Air Force" },
  "2W1":{ title:"Nuclear Weapons", branch:"Air Force" },
  "3D0":{ title:"Cyberspace Operations", branch:"Air Force" },
  "3D1":{ title:"Client Systems", branch:"Air Force" },
  "3E0":{ title:"Electrical Systems", branch:"Air Force" },
  "3E1":{ title:"Heating, Ventilation, Air Conditioning (HVAC)", branch:"Air Force" },
  "3E2":{ title:"Pavements and Construction Equipment", branch:"Air Force" },
  "3E3":{ title:"Structural", branch:"Air Force" },
  "3E4":{ title:"Utilities Systems", branch:"Air Force" },
  "3E5":{ title:"Engineering", branch:"Air Force" },
  "3E6":{ title:"Operations Management", branch:"Air Force" },
  "3E7":{ title:"Fire Protection", branch:"Air Force" },
  "3E8":{ title:"Explosive Ordnance Disposal", branch:"Air Force" },
  "3E9":{ title:"Emergency Management", branch:"Air Force" },
  "3N0":{ title:"Public Affairs", branch:"Air Force" },
  "3P0":{ title:"Security Forces", branch:"Air Force" },
  "3S0":{ title:"Personnel", branch:"Air Force" },
  "3S2":{ title:"Education and Training", branch:"Air Force" },
  "3S3":{ title:"Manpower", branch:"Air Force" },
  "4A0":{ title:"Health Services Management", branch:"Air Force" },
  "4B0":{ title:"Bioenvironmental Engineering", branch:"Air Force" },
  "4C0":{ title:"Mental Health", branch:"Air Force" },
  "4D0":{ title:"Diet Therapy", branch:"Air Force" },
  "4E0":{ title:"Public Health", branch:"Air Force" },
  "4H0":{ title:"Cardiopulmonary Laboratory", branch:"Air Force" },
  "4J0":{ title:"Physical Medicine", branch:"Air Force" },
  "4M0":{ title:"Aerospace and Operational Physiology", branch:"Air Force" },
  "4N0":{ title:"Aerospace Medical Service", branch:"Air Force" },
  "4P0":{ title:"Pharmacy", branch:"Air Force" },
  "4R0":{ title:"Diagnostic Imaging", branch:"Air Force" },
  "4T0":{ title:"Medical Laboratory", branch:"Air Force" },
  "4V0":{ title:"Optometry", branch:"Air Force" },
  "4Y0":{ title:"Dental Assistant", branch:"Air Force" },
  "5J0":{ title:"Paralegal", branch:"Air Force" },
  "5R0":{ title:"Chaplain Assistant", branch:"Air Force" },
  "6C0":{ title:"Contracting", branch:"Air Force" },
  "6F0":{ title:"Financial Management and Comptroller", branch:"Air Force" },
  "6S0":{ title:"Special Duty Assignment Pay", branch:"Air Force" },
  "7S0":{ title:"Special Investigations", branch:"Air Force" },
  "8A100":{ title:"Developmental Education", branch:"Air Force" },
  "8B000":{ title:"Military Training Instructor", branch:"Air Force" },
  "8G000":{ title:"Honor Guard", branch:"Air Force" },
  "8R000":{ title:"Recruiter", branch:"Air Force" },
  // ── COAST GUARD ──────────────────────────────────────────────────────────
  "AET":{ title:"Aviation Electrical Technician", branch:"Coast Guard" },
  "AMT":{ title:"Aviation Maintenance Technician", branch:"Coast Guard" },
  "AST":{ title:"Aviation Survival Technician (Rescue Swimmer)", branch:"Coast Guard" },
  "BM":{ title:"Boatswain's Mate", branch:"Coast Guard" },
  "CS":{ title:"Culinary Specialist", branch:"Coast Guard" },
  "DC":{ title:"Damage Controlman", branch:"Coast Guard" },
  "ELC":{ title:"Electrician's Mate", branch:"Coast Guard" },
  "EM":{ title:"Electrician's Mate", branch:"Coast Guard" },
  "ET":{ title:"Electronics Technician", branch:"Coast Guard" },
  "GM":{ title:"Gunner's Mate", branch:"Coast Guard" },
  "HS":{ title:"Health Services Technician", branch:"Coast Guard" },
  "IS":{ title:"Intelligence Specialist", branch:"Coast Guard" },
  "IT":{ title:"Information Systems Technician", branch:"Coast Guard" },
  "IV":{ title:"Marine Science Technician", branch:"Coast Guard" },
  "MA":{ title:"Maritime Enforcement Specialist", branch:"Coast Guard" },
  "ME":{ title:"Maritime Enforcement Specialist", branch:"Coast Guard" },
  "MK":{ title:"Machinery Technician", branch:"Coast Guard" },
  "MST":{ title:"Marine Science Technician", branch:"Coast Guard" },
  "MSD":{ title:"Musician", branch:"Coast Guard" },
  "OS":{ title:"Operations Specialist", branch:"Coast Guard" },
  "PA":{ title:"Public Affairs Specialist", branch:"Coast Guard" },
  "PS":{ title:"Personnel Specialist", branch:"Coast Guard" },
  "SK":{ title:"Storekeeper", branch:"Coast Guard" },
  "YN":{ title:"Yeoman", branch:"Coast Guard" },
  // ── SPACE FORCE ───────────────────────────────────────────────────────────
  "1C6X1":{ title:"Space Systems Operations (Missile Warning)", branch:"Space Force" },
  "1C6X2":{ title:"Space Systems Operations (Space Control)", branch:"Space Force" },
  "1C6X3":{ title:"Space Systems Operations (Satellite)", branch:"Space Force" },
  "1C6X4":{ title:"Space Systems Operations (Electronic Warfare)", branch:"Space Force" },
  "1N0X1":{ title:"Operations Intelligence", branch:"Space Force" },
  "1N4X1":{ title:"Fusion Analyst", branch:"Space Force" },
  "2M0X1":{ title:"Missile and Space Systems Electronic Maintenance", branch:"Space Force" },
  "2M0X2":{ title:"Missile and Space Systems Maintenance", branch:"Space Force" },
  "3D0X1":{ title:"Cyberspace Operations", branch:"Space Force" },
  "3D1X1":{ title:"Client Systems", branch:"Space Force" },
  "6C0X1":{ title:"Contracting", branch:"Space Force" },
  "6F0X1":{ title:"Financial Management", branch:"Space Force" },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

:root {
  --gold:#c8960a; --gold-light:#e8aa10; --gold-dim:rgba(200,150,10,0.15);
  --navy:#1a3a6b; --navy2:#1e4a8a; --navy3:#2456a0;
  --slate:#4a6080; --text:#1a2a3a; --dim:#6a8090;
  --green:#1a7a40; --red:#c0392b; --blue:#1a5c9a;
  --bg:#f0f2f5; --card:#ffffff; --border:#dde3ec;
  --shadow:0 2px 12px rgba(26,58,107,.08);
  --shadow-hover:0 8px 24px rgba(26,58,107,.14);
  --radius:12px; --radius-sm:8px;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);font-family:'Inter',sans-serif;color:var(--text);font-size:15px;}
.app{min-height:100vh;background:var(--bg);}
.hdr{text-align:center;padding:2rem 1rem 1.75rem;background:linear-gradient(160deg,#0a1628 0%,#1a3a6b 50%,#1e4a8a 100%);position:relative;overflow:hidden;}
.hdr::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width=%2760%27 height=%2760%27 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%270.02%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");pointer-events:none;}
.hdr h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,4.5vw,3.2rem);letter-spacing:.14em;color:#f5d060;text-shadow:0 2px 16px rgba(0,0,0,.3);position:relative;}
.hdr p{font-size:.9rem;color:#c0d8f0;letter-spacing:.05em;font-weight:500;position:relative;}
.tagline{font-size:.78rem;color:#80a8d0;margin-top:.15rem;font-style:italic;position:relative;}
.user-bar{background:rgba(10,22,40,.95);backdrop-filter:blur(8px);border-bottom:1px solid rgba(255,255,255,.08);padding:.5rem 1.4rem;display:flex;align-items:center;justify-content:space-between;font-size:.78rem;color:#b0cce8;}
.user-bar button{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:#d0e8f8;border-radius:6px;padding:.25rem .7rem;cursor:pointer;font-size:.72rem;transition:all .2s;}
.user-bar button:hover{background:rgba(255,255,255,.18);}
.tabs{display:flex;background:#ffffff;border-bottom:2px solid var(--border);padding:0 .5rem;position:sticky;top:0;z-index:100;box-shadow:0 2px 8px rgba(26,58,107,.06);}
.tab{flex:1;padding:.75rem .5rem .65rem;background:transparent;border:none;border-bottom:3px solid transparent;margin-bottom:-2px;cursor:pointer;font-family:'Bebas Neue',sans-serif;font-size:.82rem;color:#7a90a8;letter-spacing:.1em;transition:all .2s;}
.tab.ai-tab{background:rgba(200,150,10,.05);border-bottom-color:rgba(200,150,10,.15);}
.tab.ai-tab:hover{background:rgba(200,150,10,.1);color:#c8960a;}
.tab.ai-tab.active{color:#c8960a!important;border-bottom-color:#c8960a!important;background:rgba(200,150,10,.08)!important;}
.tabs-separator{display:flex;align-items:center;color:#dde3ec;font-size:.6rem;letter-spacing:.08em;flex-shrink:0;padding:0 .25rem;user-select:none;font-weight:700;}
/* ── AI TOOLS QUICK NAV ─────────────────────────────────────────────────── */
.tools-fab{position:fixed;right:1rem;bottom:5.5rem;z-index:900;background:linear-gradient(135deg,#c8960a,#e8aa10);border:none;border-radius:50%;width:52px;height:52px;cursor:pointer;box-shadow:0 4px 18px rgba(200,150,10,.5);display:flex;align-items:center;justify-content:center;font-size:1.25rem;transition:transform .18s;}
.tools-fab:hover{transform:scale(1.08);}
.tools-drawer{position:fixed;right:0;top:0;bottom:0;width:280px;background:#0a1628;border-left:1.5px solid rgba(240,192,64,.2);z-index:950;transform:translateX(100%);transition:transform .25s ease;box-shadow:-6px 0 32px rgba(0,0,0,.5);display:flex;flex-direction:column;}
.tools-drawer.open{transform:translateX(0);}
.tools-drawer-header{background:linear-gradient(135deg,#0d1f3c,#1a3a6b);padding:1rem 1.1rem;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
.tools-drawer-title{font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:.1em;color:#f0c040;}
.tools-drawer-close{background:none;border:none;color:rgba(192,216,240,.5);font-size:1.1rem;cursor:pointer;padding:.25rem;}
.tools-drawer-close:hover{color:#fff;}
.tools-drawer-body{overflow-y:auto;flex:1;padding:.65rem .75rem;}
.tools-drawer-section{font-size:.62rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(240,192,64,.45);padding:.65rem .25rem .25rem;margin-top:.25rem;}
.tools-drawer-link{display:flex;align-items:center;gap:.65rem;padding:.6rem .65rem;border-radius:8px;text-decoration:none;transition:background .12s;margin-bottom:.2rem;}
.tools-drawer-link:hover{background:rgba(255,255,255,.06);}
.tools-drawer-link.active-tool{background:rgba(240,192,64,.08);border:1px solid rgba(240,192,64,.15);}
.tdl-icon{font-size:1.1rem;flex-shrink:0;width:28px;text-align:center;}
.tdl-text{flex:1;}
.tdl-name{font-size:.82rem;font-weight:700;color:#fff;line-height:1.2;}
.tdl-sub{font-size:.68rem;color:rgba(192,216,240,.4);margin-top:.08rem;}
.tdl-badge{font-size:.6rem;font-weight:700;background:rgba(240,192,64,.12);border:1px solid rgba(240,192,64,.2);color:#f0c040;border-radius:20px;padding:.08rem .4rem;white-space:nowrap;}
.tdl-badge.free{background:rgba(26,122,64,.12);border-color:rgba(26,122,64,.2);color:#4ade80;}
.tools-drawer-footer{padding:.75rem;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;}
.tools-drawer-footer a{display:block;text-align:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:8px;color:rgba(192,216,240,.5);font-size:.75rem;padding:.45rem;text-decoration:none;transition:all .15s;}
.tools-drawer-footer a:hover{border-color:rgba(240,192,64,.2);color:#f0c040;}
.tools-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:940;}
.tools-overlay.open{display:block;}
@media(max-width:480px){.tools-drawer{width:260px;}}

.tab.on,.tab.active{color:var(--navy);border-bottom-color:var(--gold);background:linear-gradient(180deg,transparent,rgba(200,150,10,.04));}
.tab:hover:not(.on):not(.active){color:var(--navy);background:rgba(26,58,107,.03);}
.tab-n{font-size:.55rem;display:block;opacity:.6;margin-top:.1rem;font-family:'Inter',sans-serif;font-weight:500;}
.panel{display:none;animation:fadeIn .2s;}
.panel.on{display:block;}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.wrap{max-width:980px;margin:0 auto;padding:1.5rem 1.2rem 5rem;}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);margin-bottom:1.25rem;overflow:hidden;box-shadow:var(--shadow);transition:box-shadow .2s;}
.card:hover{box-shadow:var(--shadow-hover);}
.ch{background:linear-gradient(135deg,#f8fafd,#f0f4fa);border-bottom:1px solid var(--border);padding:.85rem 1.25rem;display:flex;align-items:center;justify-content:space-between;cursor:pointer;user-select:none;}
.ch h3{font-family:'Bebas Neue',sans-serif;letter-spacing:.1em;font-size:1rem;color:var(--navy);}
.cb{padding:1.25rem;}
.collapsed .cb{display:none;}
.chevron{font-size:.7rem;color:var(--slate);transition:transform .25s;}
.collapsed .chevron{transform:rotate(-90deg);}
.entry{border:1px solid var(--border);border-radius:var(--radius-sm);padding:1.1rem;margin-bottom:1rem;background:linear-gradient(135deg,#fafbfd,#f5f8fc);transition:box-shadow .2s;}
.entry:hover{box-shadow:var(--shadow);}
.entry-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:.85rem;flex-wrap:wrap;gap:.4rem;}
.entry-badge{background:var(--navy);color:#fff;border:none;border-radius:20px;padding:.25rem .85rem;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;font-weight:600;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;}
@media(max-width:640px){
  .g2,.g3{grid-template-columns:1fr;}
  .wrap{padding:.85rem .75rem 5rem;}
  .tabs{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
  .tabs::-webkit-scrollbar{display:none;}
  .tab{flex:0 0 auto;min-width:72px;padding:.6rem .6rem .5rem;font-size:.66rem;}
}
.field{margin-bottom:.75rem;}
.field label{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--navy);font-weight:700;display:block;margin-bottom:.35rem;}
.field input,.field select,.field textarea{background:#fff;border:1.5px solid #c8d4e4;border-radius:var(--radius-sm);color:var(--text);padding:.6rem .9rem;width:100%;font-family:'Inter',sans-serif;font-size:.9rem;transition:border-color .2s,box-shadow .2s;}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--navy);box-shadow:0 0 0 3px rgba(26,58,107,.1);}
.field input::placeholder,.field textarea::placeholder{color:#a0b0c4;}
.hint{font-size:.74rem;color:var(--slate);margin-top:.25rem;font-style:italic;line-height:1.5;}
.date-picker{position:relative;}
.date-display{background:#fff;border:1.5px solid #c8d4e4;border-radius:var(--radius-sm);color:var(--text);padding:.6rem .9rem;font-family:'Inter',sans-serif;font-size:.9rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;user-select:none;transition:border-color .2s,box-shadow .2s;}
.date-display:hover{border-color:var(--navy);}
.date-display.placeholder{color:#a0b0c4;}
.date-dropdown{position:absolute;top:calc(100% + 4px);left:0;background:#fff;border:1.5px solid #c8d4e4;border-radius:var(--radius-sm);z-index:200;width:280px;overflow:hidden;box-shadow:0 8px 24px rgba(26,58,107,.12);}
.month-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;padding:8px;}
.month-grid button{background:transparent;border:1px solid transparent;border-radius:6px;padding:6px 2px;font-size:.75rem;cursor:pointer;color:var(--text);transition:all .15s;}
.month-grid button:hover{background:#f0f4fa;border-color:#c8d4e4;}
.month-grid button.sel{background:var(--navy);color:#fff;border-color:var(--navy);}
.year-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid #e8eef6;background:#f8fafd;}
.year-row button{background:transparent;border:none;color:var(--navy);font-size:1.1rem;cursor:pointer;padding:0 6px;font-weight:700;}
.year-row span{font-size:.85rem;font-weight:700;color:var(--text);}
.btn-primary{display:block;width:100%;padding:.85rem;background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border:none;border-radius:var(--radius-sm);font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:.12em;cursor:pointer;margin:.85rem 0;transition:transform .15s,box-shadow .15s;box-shadow:0 4px 16px rgba(26,58,107,.25);}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(26,58,107,.3);}
.btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none;}
.btn-sec{background:#fff;border:1.5px solid var(--navy);color:var(--navy);border-radius:var(--radius-sm);padding:.4rem .95rem;font-family:'Inter',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-sec:hover{background:var(--navy);color:#fff;}
.btn-add{display:block;width:100%;padding:.65rem 1rem;background:linear-gradient(135deg,#f0f4fa,#e8eef8);border:1.5px dashed #b0c4da;border-radius:var(--radius-sm);color:var(--navy);font-family:'Inter',sans-serif;font-size:.88rem;font-weight:600;cursor:pointer;text-align:center;transition:all .2s;margin-top:.5rem;}
.btn-add:hover{background:linear-gradient(135deg,#e8eef8,#dce8f8);border-color:var(--navy);}
.btn-rm{background:#fff0f0;border:1px solid #f0c0c0;color:#c0392b;border-radius:6px;padding:.2rem .55rem;font-size:.75rem;cursor:pointer;transition:all .2s;}
.btn-rm:hover{background:#c0392b;color:#fff;border-color:#c0392b;}
.btn-danger{background:#fff0f0;border:1px solid #f0c0c0;color:#c0392b;border-radius:6px;padding:.25rem .6rem;font-size:.75rem;cursor:pointer;transition:all .2s;}
.btn-danger:hover{background:#c0392b;color:#fff;}
.btn-chip{display:inline-flex;align-items:center;gap:.3rem;background:#f0f4fa;border:1.5px solid #b0c8e4;color:var(--navy);border-radius:20px;padding:.28rem .75rem;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .2s;}
.btn-chip:hover{background:var(--navy);color:#fff;border-color:var(--navy);}
.intro{background:linear-gradient(135deg,#fffbeb,#fdf6d8);border:1px solid rgba(200,150,10,.3);border-left:4px solid var(--gold);border-radius:var(--radius-sm);padding:.9rem 1.1rem;margin-bottom:1rem;font-size:.88rem;color:#3a3000;line-height:1.7;}
.nav-row{display:flex;justify-content:space-between;margin-top:1.25rem;padding-top:.9rem;border-top:1px solid var(--border);}
.career-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;}
.career-card{background:#fff;border:1.5px solid var(--border);border-radius:var(--radius);padding:1.1rem;cursor:pointer;transition:all .2s;box-shadow:var(--shadow);}
.career-card:hover{border-color:var(--gold);box-shadow:var(--shadow-hover);transform:translateY(-3px);}
.career-card h4{font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:.08em;color:var(--navy);margin-bottom:.35rem;}
.badge{display:inline-block;border-radius:20px;padding:.18rem .6rem;font-size:.68rem;font-weight:700;letter-spacing:.06em;}
.badge.bm{background:rgba(26,58,107,.1);color:var(--navy);border:1px solid rgba(26,58,107,.2);}
.badge.br{background:rgba(26,122,64,.1);color:var(--green);border:1px solid rgba(26,122,64,.2);}
.badge.bd{background:rgba(26,92,154,.1);color:var(--blue);border:1px solid rgba(26,92,154,.2);}
.badge.bc{background:#f0f4fa;color:var(--slate);border:1px solid var(--border);}
.tos-badge{display:inline-flex;align-items:center;gap:.3rem;background:#f0f4fa;border:1px solid var(--border);border-radius:20px;padding:.18rem .6rem;font-size:.72rem;color:var(--slate);}
.sdiv{border:none;border-top:1px solid var(--border);margin:1rem 0;}
.loading{text-align:center;padding:2.5rem;color:var(--slate);}
.spin{width:36px;height:36px;border:3px solid #dde3ec;border-top-color:var(--navy);border-radius:50%;animation:sp .7s linear infinite;margin:.75rem auto;}
@keyframes sp{to{transform:rotate(360deg)}}
.save-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;padding:.65rem 1.5rem;border-radius:24px;font-size:.85rem;z-index:9999;box-shadow:0 4px 20px rgba(26,58,107,.3);}
.api-err{background:#fff5f5;border:1px solid #fcd0d0;border-left:4px solid var(--red);color:#900;border-radius:var(--radius-sm);padding:.65rem 1rem;font-size:.83rem;margin:.5rem 0;}
.format-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:.55rem;margin-bottom:.85rem;}
.format-card{border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:.75rem .9rem;cursor:pointer;transition:all .2s;background:#fff;}
.format-card:hover{border-color:var(--navy);box-shadow:var(--shadow);}
.format-card.selected{border-color:var(--gold);background:linear-gradient(135deg,#fffbeb,#fff8d8);box-shadow:0 0 0 3px rgba(200,150,10,.15);}
.format-card h4{font-size:.82rem;font-weight:700;color:var(--navy);margin-bottom:.2rem;margin-top:.15rem;}
.format-card p{font-size:.72rem;color:var(--slate);line-height:1.4;}
.format-card.selected .format-card-badge{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.3);color:#fff;}
.prof-hero{background:linear-gradient(135deg,#0a1628,#1a3a6b);color:#fff;border-radius:var(--radius);padding:1.4rem 1.6rem;margin-bottom:1.1rem;box-shadow:0 4px 20px rgba(26,58,107,.2);}
.qual-chip{display:inline-flex;align-items:center;gap:.3rem;background:linear-gradient(135deg,#eef3fa,#e8eef8);border:1px solid #b0c4da;border-radius:20px;padding:.25rem .6rem;font-size:.75rem;color:var(--navy);}
.qual-chip button{background:transparent;border:none;color:var(--red);cursor:pointer;font-size:.85rem;padding:0 .1rem;}
.sdot{width:7px;height:7px;border-radius:50%;background:#c8d4e4;display:inline-block;margin:0 3px;transition:all .3s;}
.sdot.on{background:var(--gold);transform:scale(1.3);}
.pw-overlay{position:fixed;inset:0;background:rgba(8,16,32,.88);backdrop-filter:blur(8px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:1rem;}
.pw-box{background:#fff;border-radius:16px;width:100%;max-width:490px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.4);}
.pw-head{background:linear-gradient(160deg,#0a1628,#1a3a6b);padding:2rem 1.8rem 1.5rem;text-align:center;}
.pw-head h2{font-family:'Bebas Neue',sans-serif;font-size:1.7rem;letter-spacing:.12em;color:#f5d060;margin:0 0 .35rem;}
.pw-head p{color:#a0c0e0;font-size:.85rem;margin:0;}
.pw-plans{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;padding:1.25rem 1.5rem;}
.pw-plan{border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:1rem;cursor:pointer;transition:all .2s;text-align:center;}
.pw-plan:hover,.pw-plan.selected{border-color:var(--navy);background:#f0f4ff;}
.pw-plan .price{font-size:1.7rem;font-weight:800;color:var(--navy);line-height:1;}
.pw-plan .price span{font-size:.8rem;font-weight:400;color:var(--slate);}
.pw-plan .plan-name{font-weight:700;font-size:.85rem;color:var(--navy);margin-bottom:.25rem;}
.pw-divider{display:flex;align-items:center;gap:.65rem;padding:0 1.5rem;margin-bottom:.75rem;}
.pw-divider div{flex:1;height:1px;background:var(--border);}
.pw-divider span{font-size:.72rem;color:#a0b4c8;letter-spacing:.06em;}
.pw-code-row{padding:0 1.5rem .75rem;display:flex;gap:.5rem;}
.pw-code-row input{flex:1;padding:.58rem .9rem;border:1.5px solid var(--border);border-radius:var(--radius-sm);font-size:.88rem;}
.pw-code-row input.valid{border-color:var(--green);background:#f0fff4;}
.pw-code-row input.invalid{border-color:var(--red);background:#fff5f5;}
.pw-code-btn{padding:.58rem 1.1rem;background:var(--navy);color:#fff;border:none;border-radius:var(--radius-sm);font-weight:700;cursor:pointer;font-size:.85rem;}
.pw-footer{padding:.75rem 1.5rem 1.5rem;display:flex;flex-direction:column;gap:.5rem;}
.pw-cta{width:100%;padding:.85rem;background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;border:none;border-radius:var(--radius-sm);font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:.1em;cursor:pointer;box-shadow:0 4px 16px rgba(26,58,107,.25);transition:transform .15s,box-shadow .15s;}
.pw-cta:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(26,58,107,.3);}
.pw-skip{background:transparent;border:none;color:#a0b4c8;font-size:.78rem;cursor:pointer;padding:.3rem;}
.btn-upgrade{width:100%;padding:.78rem;background:linear-gradient(135deg,#e8aa10,#c89008);border:none;border-radius:var(--radius-sm);color:#0a1628;font-weight:700;font-size:.95rem;cursor:pointer;letter-spacing:.03em;box-shadow:0 4px 16px rgba(200,150,10,.25);}
.score-ring{display:flex;align-items:center;justify-content:center;flex-direction:column;width:110px;height:110px;border-radius:50%;border:6px solid var(--navy);background:linear-gradient(135deg,#f0f4ff,#e8eef8);margin:0 auto 1rem;box-shadow:0 4px 16px rgba(26,58,107,.15);}
.score-num{font-size:2rem;font-weight:800;color:var(--navy);line-height:1;}
.score-lbl{font-size:.65rem;color:var(--slate);letter-spacing:.06em;text-transform:uppercase;}
.grade-bar{height:7px;border-radius:4px;background:#e8eef6;margin-top:.35rem;}
.grade-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--navy),var(--navy2));transition:width .6s;}
.review-item{padding:.75rem 1rem;border-radius:var(--radius-sm);margin-bottom:.5rem;border-left:4px solid;}
.review-high{background:#fff5f5;border-color:var(--red);}
.review-med{background:#fffbf0;border-color:#e67e22;}
.review-low{background:#f0fff5;border-color:var(--green);}
.cl-output{background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:1.25rem 1.5rem;font-size:.9rem;line-height:1.85;color:var(--text);white-space:pre-wrap;min-height:200px;box-shadow:inset 0 2px 8px rgba(26,58,107,.04);}
.tracker-table{width:100%;border-collapse:collapse;font-size:.83rem;}
.tracker-table th{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;padding:.6rem .85rem;text-align:left;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;font-weight:600;}
.tracker-table td{padding:.6rem .85rem;border-bottom:1px solid #f0f4fa;vertical-align:middle;}
.tracker-table tr:hover td{background:#f8fafd;}
.status-pill{display:inline-block;padding:.18rem .65rem;border-radius:20px;font-size:.72rem;font-weight:700;}
.sp-applied{background:#e8f0fe;color:var(--navy);}
.sp-interview{background:#fff8e0;color:#8a6000;}
.sp-offer{background:#e8f8ee;color:var(--green);}
.sp-rejected{background:#fff0f0;color:var(--red);}
.sp-withdrawn{background:#f0f4f8;color:#666;}
.prep-card{background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:1rem 1.1rem;margin-bottom:.65rem;border-left:4px solid var(--gold);box-shadow:var(--shadow);}
.prep-q{font-weight:700;font-size:.9rem;color:var(--navy);margin-bottom:.4rem;}
.prep-a{font-size:.84rem;color:var(--slate);line-height:1.7;}
.prep-tip{font-size:.76rem;color:var(--green);margin-top:.4rem;font-style:italic;}
.tl-item{display:flex;gap:.85rem;margin-bottom:.9rem;align-items:flex-start;}
.tl-dot{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0;margin-top:.1rem;}
.tl-done{background:var(--green);color:#fff;box-shadow:0 2px 8px rgba(26,122,64,.3);}
.tl-active{background:var(--navy);color:#fff;box-shadow:0 0 0 4px rgba(26,58,107,.15);}
.tl-pending{background:#e8eef6;color:var(--slate);}
.tl-content h4{font-size:.89rem;font-weight:700;color:var(--navy);margin:0 0 .15rem;}
.tl-content p{font-size:.79rem;color:var(--slate);margin:0;line-height:1.55;}
.stat-card{background:#fff;border:1.5px solid var(--border);border-radius:var(--radius);padding:1.1rem;text-align:center;box-shadow:var(--shadow);transition:all .2s;}
.stat-card:hover{box-shadow:var(--shadow-hover);transform:translateY(-2px);}
.stat-num{font-size:2.1rem;font-weight:800;color:var(--navy);line-height:1;}
.stat-lbl{font-size:.72rem;color:var(--slate);letter-spacing:.06em;text-transform:uppercase;margin-top:.25rem;}
.res-section{margin-bottom:2rem;}
.res-section-title{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:.1em;color:var(--navy);border-bottom:2px solid var(--gold);padding-bottom:.4rem;margin-bottom:.9rem;}
.res-card{display:flex;align-items:flex-start;gap:1rem;padding:.9rem 1.1rem;background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-sm);margin-bottom:.6rem;transition:all .2s;box-shadow:var(--shadow);}
.res-card:hover{box-shadow:var(--shadow-hover);border-color:#c0d0e8;transform:translateY(-1px);}
.res-icon{font-size:1.6rem;flex-shrink:0;margin-top:.1rem;}
.res-body{flex:1;}
.res-name{font-weight:700;font-size:.9rem;color:var(--navy);margin-bottom:.18rem;}
.res-desc{font-size:.81rem;color:var(--slate);line-height:1.6;margin-bottom:.4rem;}
.res-contact{display:inline-flex;align-items:center;gap:.35rem;background:var(--navy);color:#fff;padding:.3rem .8rem;border-radius:20px;font-size:.75rem;font-weight:700;text-decoration:none;cursor:pointer;border:none;transition:all .2s;}
.res-contact:hover{background:var(--navy2);}
.res-contact.green{background:var(--green);}
.res-contact.red{background:var(--red);}
.res-contact.gold{background:#8a6800;color:#fff;}
.res-tag{display:inline-block;background:#f0f4fa;color:var(--navy);font-size:.65rem;font-weight:700;padding:.12rem .45rem;border-radius:20px;margin-right:.3rem;letter-spacing:.04em;border:1px solid var(--border);}
.res-filter-bar{display:flex;gap:.45rem;flex-wrap:wrap;margin-bottom:1.25rem;}
.res-filter-btn{padding:.38rem .9rem;border-radius:20px;border:1.5px solid var(--border);background:#fff;color:var(--slate);font-size:.8rem;cursor:pointer;transition:all .2s;font-weight:500;}
.res-filter-btn.active{background:var(--navy);color:#fff;border-color:var(--navy);font-weight:700;}
.res-filter-btn:hover:not(.active){border-color:var(--navy);color:var(--navy);}
.crisis-banner{background:linear-gradient(135deg,#8b0000,#c0392b);color:#fff;border-radius:var(--radius);padding:1.25rem 1.5rem;margin-bottom:1.5rem;display:flex;gap:1rem;align-items:flex-start;box-shadow:0 4px 20px rgba(192,57,43,.3);}
.crisis-banner h3{margin:0 0 .3rem;font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:.08em;}
.crisis-banner p{margin:0 0 .75rem;font-size:.85rem;opacity:.92;line-height:1.6;}
.outlook-high{color:var(--green);font-weight:600;}
.outlook-med{color:#e67e22;font-weight:600;}
.outlook-low{color:var(--slate);font-weight:600;}
.trans-section{background:#fff;border:1.5px solid var(--border);border-radius:var(--radius);margin-bottom:1rem;overflow:hidden;box-shadow:var(--shadow);}
.trans-section-head{background:linear-gradient(135deg,#f8fafd,#f0f4fa);border-bottom:1px solid var(--border);padding:.85rem 1.25rem;}
.trans-section-head h4{font-family:'Bebas Neue',sans-serif;letter-spacing:.1em;font-size:1rem;color:var(--navy);}
.trans-section-body{padding:1rem 1.25rem;}
.trans-block{background:linear-gradient(135deg,#fafbfd,#f5f8fc);border:1px solid var(--border);border-radius:var(--radius-sm);padding:.8rem 1rem;margin-bottom:.65rem;}
.trans-block-label{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:.35rem;}
.trans-block-text{font-size:.88rem;color:var(--text);line-height:1.7;}
.trans-bullet{display:flex;gap:.6rem;align-items:flex-start;margin-bottom:.45rem;}
.trans-bullet-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:.45rem;}
.trans-bullet-text{font-size:.87rem;color:var(--text);line-height:1.6;}
.resume-out{border:1.5px solid var(--border);border-radius:var(--radius);background:#f8fafd;overflow:hidden;}
.cl-badge{display:inline-block;border-radius:20px;padding:.18rem .6rem;font-size:.7rem;font-weight:700;}
.cl-none{background:#f0f4f8;color:var(--slate);border:1px solid var(--border);}
.cl-c{background:#e8f0fe;color:var(--navy);border:1px solid rgba(26,58,107,.2);}
.cl-s{background:#fff8e0;color:#8a6000;border:1px solid rgba(200,150,10,.3);}
.cl-ts{background:#fff0e0;color:#8a4000;border:1px solid rgba(200,100,10,.3);}
.cl-ts-sci{background:#fef0f8;color:#8a0060;border:1px solid rgba(200,0,100,.3);}
.ch-sub{font-size:.75rem;color:var(--slate);font-weight:400;}
.mos-pill{display:inline-block;background:rgba(200,150,10,.12);border:1px solid rgba(200,150,10,.35);border-radius:4px;padding:.12rem .5rem;font-size:.72rem;color:#8a6000;margin:.1rem;}
.duty-chip{display:inline-flex;align-items:center;gap:.3rem;background:#f0f4fa;border:1px solid var(--border);border-radius:20px;padding:.22rem .6rem;font-size:.76rem;color:var(--navy);}
.duty-chip .dx{cursor:pointer;color:var(--red);font-weight:700;margin-left:.1rem;}
.duty-grid{display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.5rem;}
.qual-section{margin-bottom:1rem;}
.qual-label{font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--navy);display:block;margin-bottom:.4rem;}
.qual-add-row{display:flex;gap:.5rem;align-items:flex-end;margin-top:.4rem;}
.clearance-block{background:linear-gradient(135deg,#f8f0ff,#f0e8ff);border:1px solid rgba(106,61,154,.2);border-radius:var(--radius-sm);padding:1rem;margin-bottom:.75rem;}
.clearance-block h4{font-size:.78rem;font-weight:700;letter-spacing:.06em;color:#6a3d9a;margin-bottom:.65rem;}
.etop{display:flex;justify-content:space-between;align-items:center;margin-bottom:.85rem;flex-wrap:wrap;gap:.4rem;}
.autocomplete-list{position:absolute;top:100%;left:0;right:0;background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-sm);z-index:200;box-shadow:0 8px 24px rgba(26,58,107,.12);max-height:200px;overflow-y:auto;}
.autocomplete-item{padding:.6rem .9rem;cursor:pointer;font-size:.88rem;border-bottom:1px solid #f0f4fa;transition:background .15s;}
.autocomplete-item:hover{background:#f0f4fa;}
.skills-lib button{background:#f0f4fa;border:1px solid #b0c8e4;color:var(--navy);border-radius:20px;padding:.22rem .6rem;font-size:.72rem;cursor:pointer;margin:.15rem;transition:all .2s;}
.skills-lib button:hover{background:var(--navy);color:#fff;}
.grade-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;}
.pw-badge{display:inline-block;background:#f5d060;color:#0a1628;font-size:.65rem;font-weight:800;padding:.1rem .4rem;border-radius:3px;margin-left:.4rem;vertical-align:middle;}
::-webkit-scrollbar{width:6px;height:6px;}
::-webkit-scrollbar-track{background:#f0f4f8;}
::-webkit-scrollbar-thumb{background:#b0c4da;border-radius:3px;}
::-webkit-scrollbar-thumb:hover{background:#8aa0be;}
`;

var AWARDS_LIBRARY = {
  "Army": [
    "Medal of Honor","Distinguished Service Cross","Silver Star","Defense Superior Service Medal",
    "Legion of Merit","Soldier's Medal","Bronze Star Medal","Bronze Star Medal with Valor",
    "Purple Heart","Meritorious Service Medal","Army Commendation Medal",
    "Army Commendation Medal with Valor","Army Achievement Medal",
    "Army Good Conduct Medal","National Defense Service Medal",
    "Global War on Terrorism Expeditionary Medal","Global War on Terrorism Service Medal",
    "Afghanistan Campaign Medal","Iraq Campaign Medal","Korean Defense Service Medal",
    "Armed Forces Expeditionary Medal","Humanitarian Service Medal",
    "Army Service Ribbon","Overseas Service Ribbon","Army Reserve Components Achievement Medal",
    "Combat Infantryman Badge","Combat Action Badge","Combat Medical Badge",
    "Expert Infantryman Badge","Expert Field Medical Badge","Air Assault Badge",
    "Airborne Badge","Master Parachutist Badge","Ranger Tab","Special Forces Tab",
    "Sapper Tab","Presidential Unit Citation","Valorous Unit Award",
    "Army Superior Unit Award","Meritorious Unit Commendation",
  ],
  "Navy": [
    "Medal of Honor","Navy Cross","Defense Superior Service Medal","Legion of Merit",
    "Navy and Marine Corps Medal","Bronze Star Medal","Bronze Star Medal with Valor",
    "Purple Heart","Meritorious Service Medal","Navy and Marine Corps Commendation Medal",
    "Navy and Marine Corps Achievement Medal","Navy Good Conduct Medal",
    "National Defense Service Medal","Global War on Terrorism Expeditionary Medal",
    "Global War on Terrorism Service Medal","Afghanistan Campaign Medal","Iraq Campaign Medal",
    "Armed Forces Expeditionary Medal","Navy Expeditionary Medal","Sea Service Deployment Ribbon",
    "Navy and Marine Corps Overseas Service Ribbon","Naval Reserve Meritorious Service Medal",
    "Combat Action Ribbon","Presidential Unit Citation","Navy Unit Commendation",
    "Meritorious Unit Commendation","Navy E Ribbon","Enlisted Surface Warfare Specialist",
    "Enlisted Aviation Warfare Specialist","Special Warfare Insignia (SEAL Trident)",
    "Explosive Ordnance Disposal Badge","Diving Officer Insignia",
  ],
  "Marine Corps": [
    "Medal of Honor","Navy Cross","Defense Superior Service Medal","Legion of Merit",
    "Navy and Marine Corps Medal","Bronze Star Medal","Bronze Star Medal with Valor",
    "Purple Heart","Meritorious Service Medal","Navy and Marine Corps Commendation Medal",
    "Navy and Marine Corps Achievement Medal","Marine Corps Good Conduct Medal",
    "National Defense Service Medal","Global War on Terrorism Expeditionary Medal",
    "Afghanistan Campaign Medal","Iraq Campaign Medal","Combat Action Ribbon",
    "Sea Service Deployment Ribbon","Marine Corps Overseas Service Ribbon",
    "Presidential Unit Citation","Navy Unit Commendation","Meritorious Unit Commendation",
    "Combat Infantryman Badge equivalent","Parachutist Badge","Combatant Diver Badge",
    "Reconnaissance Diver Badge","Force Reconnaissance Badge",
  ],
  "Air Force": [
    "Medal of Honor","Air Force Cross","Defense Superior Service Medal","Legion of Merit",
    "Airman's Medal","Bronze Star Medal","Bronze Star Medal with Valor","Purple Heart",
    "Meritorious Service Medal","Air Force Commendation Medal","Air Force Achievement Medal",
    "Air Force Good Conduct Medal","National Defense Service Medal",
    "Global War on Terrorism Expeditionary Medal","Global War on Terrorism Service Medal",
    "Afghanistan Campaign Medal","Iraq Campaign Medal","Armed Forces Expeditionary Medal",
    "Air Force Expeditionary Service Ribbon","Air Force Overseas Ribbon",
    "Air Force Longevity Service Award","Air Force Training Ribbon",
    "Combat Readiness Medal","Air and Space Campaign Medal",
    "Presidential Unit Citation","Air Force Outstanding Unit Award",
    "Air Force Organizational Excellence Award","Air Force Recognition Ribbon",
    "Aerial Achievement Medal","Air Medal","Distinguished Flying Cross",
  ],
  "Space Force": [
    "Medal of Honor","Legion of Merit","Bronze Star Medal","Purple Heart",
    "Meritorious Service Medal","Space Force Commendation Medal","Space Force Achievement Medal",
    "Space Force Good Conduct Medal","National Defense Service Medal",
    "Global War on Terrorism Service Medal","Space Force Training Ribbon",
    "Presidential Unit Citation","Space Force Unit Citation",
  ],
  "Coast Guard": [
    "Medal of Honor","Coast Guard Cross","Defense Superior Service Medal","Legion of Merit",
    "Coast Guard Medal","Bronze Star Medal","Purple Heart","Meritorious Service Medal",
    "Coast Guard Commendation Medal","Coast Guard Achievement Medal",
    "Coast Guard Good Conduct Medal","National Defense Service Medal",
    "Global War on Terrorism Expeditionary Medal","Global War on Terrorism Service Medal",
    "Afghanistan Campaign Medal","Iraq Campaign Medal","Armed Forces Expeditionary Medal",
    "Coast Guard Expeditionary Medal","Coast Guard Sea Service Ribbon",
    "Coast Guard Overseas Service Ribbon","Presidential Unit Citation",
    "Coast Guard Unit Commendation","Coast Guard Meritorious Unit Commendation",
    "Coast Guard Award","Rescue and Survival Swimmer Badge",
  ],
  "All Branches": [
    "Defense Meritorious Service Medal","Joint Service Commendation Medal",
    "Joint Service Achievement Medal","Joint Meritorious Unit Award",
    "Prisoner of War Medal","Armed Forces Service Medal","Military Outstanding Volunteer Service Medal",
    "NATO Medal","United Nations Medal","Multinational Force and Observers Medal",
    "Inter-American Defense Board Medal",
  ],
};

var SKILLS_LIBRARY = {
  technical: [
    "Weapons Qualification (Rifle/Pistol)","Vehicle Operation (wheeled)","Vehicle Operation (tracked)",
    "Radio/Communications Systems","SINCGARS Radio","Satellite Communications",
    "Night Vision Devices (NVDs)","Land Navigation","GPS/Digital Navigation",
    "IED Detection/Counter-IED","Explosives Handling","Demolitions",
    "Medical Triage/Combat First Aid","TCCC (Tactical Combat Casualty Care)",
    "HAZMAT Handling","CBRN/NBC Detection","Forklift Operation","Crane Operation",
    "Aircraft Ground Support","UAS/Drone Operation","Cybersecurity","Network Administration",
    "IT Systems Administration","Programming/Software Development","Signal Intelligence (SIGINT)",
    "Human Intelligence (HUMINT)","All-Source Intelligence Analysis","Geospatial Analysis",
    "OSINT (Open Source Intelligence)","Imagery Analysis","Electronic Warfare",
    "Fire Support/Artillery","Mortar Systems","Sniper/Long Range Marksmanship",
    "Close Air Support (CAS)","Medevac/CASEVAC Procedures","Petroleum Operations",
    "Supply Chain Management","Inventory Management Systems","Microsoft Office Suite",
    "SharePoint","Geographic Information Systems (GIS)","AutoCAD","Adobe Suite",
  ],
  leadership: [
    "Team Leadership (squad/team level)","Platoon Leadership","Company Leadership",
    "Staff Officer Experience","Mission Planning","Operations Planning (OPORD)",
    "Training Development and Delivery","Performance Counseling","Mentoring",
    "Conflict Resolution","Cross-Cultural Communication","Negotiation",
    "Budget Management","Resource Allocation","Risk Management","Crisis Management",
    "Decision Making Under Pressure","Public Speaking/Briefing","Technical Writing",
    "Project Management","Personnel Management","Scheduling and Coordination",
    "Physical Fitness Training Leadership","Safety Management","Quality Control",
    "Logistics Coordination","Emergency Management","Disaster Response",
  ],
};

var CERTS_LIBRARY = [
  "EMT-Basic (NREMT-B)","EMT-Intermediate","Paramedic (NREMT-P)",
  "CompTIA Security+","CompTIA A+","CompTIA Network+","CompTIA CySA+",
  "Certified Information Systems Security Professional (CISSP)",
  "Certified Ethical Hacker (CEH)","AWS Certified Cloud Practitioner",
  "Project Management Professional (PMP)","CAPM (Certified Associate PM)",
  "Lean Six Sigma Green Belt","Lean Six Sigma Black Belt",
  "CDL Class A (Commercial Driver's License)","CDL Class B",
  "FAA Part 107 (UAS/Drone Pilot)","Private Pilot License","HAZMAT Endorsement",
  "OSHA 10-Hour","OSHA 30-Hour","Certified Safety Professional (CSP)",
  "Certified Protection Professional (CPP)","Physical Security Professional (PSP)",
  "Certified Information Privacy Professional (CIPP)",
  "Certified Fraud Examiner (CFE)","Certified Public Accountant (CPA)",
  "Certified Financial Planner (CFP)","Real Estate License",
  "Certified Government Financial Manager (CGFM)",
  "Defense Acquisition Workforce Improvement Act (DAWIA) Level I/II/III",
  "Contracting Officer Representative (COR) Certification",
  "Secret Clearance","Top Secret Clearance","TS/SCI Clearance",
  "DoD 8570 IAT Level I/II/III","DoD 8570 IAM Level I/II/III",
  "Forklift Operator Certification","Crane Operator Certification",
  "Welding Certification (AWS)","Electrician License",
  "HVAC Certification","Plumbing License",
  "Certified Nursing Assistant (CNA)","Licensed Practical Nurse (LPN)",
  "Registered Nurse (RN)","Combat Medic Certification (68W)",
];
