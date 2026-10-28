// Published 2026 VA tables, effective 2025-12-01, checked 2026-10-28.
// https://www.va.gov/disability/compensation-rates/veteran-rates/
// https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/
// SSA has announced 3.6% for 2027; VA still publishes 2026 dollar tables.
// The 2027 option is a projection, NEVER an official VA payment table.
export const RATE_YEARS=Object.freeze({
 2026:Object.freeze({year:2026,label:'2026 published VA rates',projected:false,cola:0,effective:'2025-12-01',checked:'2026-10-28'}),
 2027:Object.freeze({year:2027,label:'2027 COLA estimate',projected:true,cola:3.6,effective:null,checked:'2026-10-28'})
});
export const RATE_SOURCES=Object.freeze({va:'https://www.va.gov/disability/compensation-rates/veteran-rates/',smc:'https://www.va.gov/disability/compensation-rates/special-monthly-compensation-rates/',cola:'https://www.ssa.gov/cola/factsheets/2027.html'});
const cents=value=>Math.round((value+Number.EPSILON)*100);
// Project each published table component once, then sum integer cents.
const rateCents=(amount,year)=>Math.round(cents(amount)*(year===2027?1036:1000)/1000);
export function rateYear(year){const meta=Number.isInteger(year)&&Object.hasOwn(RATE_YEARS,year)?RATE_YEARS[year]:null;if(!meta)throw new Error('Choose 2026 published rates or the 2027 COLA estimate.');return meta;}
export const SMC_K=139.87;
export const SMC_S=Object.freeze({alone:4408.53,spouse:4628.12,child:4555.38,spouse_child:4788.94});
export const RATES={"10": {"alone": 180.42, "spouse": 180.42, "child": 180.42, "spouse_child": 180.42, "spouse_aa": 180.42, "spouse_aa_child": 180.42}, "20": {"alone": 356.66, "spouse": 356.66, "child": 356.66, "spouse_child": 356.66, "spouse_aa": 356.66, "spouse_aa_child": 356.66}, "30": {"alone": 552.47, "spouse": 617.47, "child": 596.47, "spouse_child": 666.47, "spouse_aa": 678.47, "spouse_aa_child": 727.47}, "40": {"alone": 795.84, "spouse": 882.84, "child": 853.84, "spouse_child": 947.84, "spouse_aa": 963.84, "spouse_aa_child": 1028.84}, "50": {"alone": 1132.9, "spouse": 1241.9, "child": 1205.9, "spouse_child": 1322.9, "spouse_aa": 1342.9, "spouse_aa_child": 1423.9}, "60": {"alone": 1435.02, "spouse": 1566.02, "child": 1523.02, "spouse_child": 1663.02, "spouse_aa": 1687.02, "spouse_aa_child": 1784.02}, "70": {"alone": 1808.45, "spouse": 1961.45, "child": 1910.45, "spouse_child": 2074.45, "spouse_aa": 2102.45, "spouse_aa_child": 2215.45}, "80": {"alone": 2102.15, "spouse": 2277.15, "child": 2219.15, "spouse_child": 2406.15, "spouse_aa": 2438.15, "spouse_aa_child": 2567.15}, "90": {"alone": 2362.3, "spouse": 2559.3, "child": 2494.3, "spouse_child": 2704.3, "spouse_aa": 2740.3, "spouse_aa_child": 2885.3}, "100": {"alone": 3938.58, "spouse": 4158.17, "child": 4085.43, "spouse_child": 4318.99, "spouse_aa": 4359.58, "spouse_aa_child": 4520.4}};
export const CHILD_U18={"30": 32.0, "40": 43.0, "50": 54.0, "60": 65.0, "70": 76.0, "80": 87.0, "90": 98.0, "100": 109.11};
export const CHILD_SCH={"30": 105.0, "40": 140.0, "50": 176.0, "60": 211.0, "70": 246.0, "80": 281.0, "90": 317.0, "100": 352.45};
export const PARENT_ADD={"10": 0.0, "20": 0.0, "30": 52.0, "40": 70.0, "50": 88.0, "60": 105.0, "70": 123.0, "80": 140.0, "90": 158.0, "100": 176.24};

export function combinedRating(values){
 if(!Array.isArray(values)||!values.length||values.length>30||values.some(v=>!Number.isInteger(v)||v<0||v>100||v%10))throw new Error('Add ratings from 0% to 100% in 10-point steps.');
 const ratings=[...values].sort((a,b)=>b-a),steps=[];let combined=0;
 for(const rating of ratings){const prior=combined;combined=Math.round(combined+(100-combined)*rating/100);steps.push({prior,rating,combined});}
 return {combined,rating:Math.min(100,Math.round(combined/10)*10),steps};
}
export function compensation(rating,{spouse=false,spouseAA=false,children=0,schoolChildren=0,parents=0,year=2026,smcK=0,smcS=false,tdiu=false}={}){
 if(!Number.isInteger(rating)||rating<0||rating>100||rating%10)throw new Error('Choose a valid combined rating.');
 if(!Number.isInteger(children)||children<0||children>20||!Number.isInteger(schoolChildren)||schoolChildren<0||schoolChildren>20||!Number.isInteger(parents)||parents<0||parents>2)throw new Error('Check dependent counts. Use whole numbers, up to 20 children in each group and up to 2 parents.');
 if(!Number.isInteger(smcK)||smcK<0||smcK>3)throw new Error('SMC-K must be 0, 1, 2 or 3 awards.');
 const meta=rateYear(year),payRating=tdiu||smcS?100:rating,breakdown=[];
 const add=(label,amount,count=1)=>breakdown.push({label,amount:rateCents(amount,year)*count/100});
 if(payRating>0){
  const row=smcS?SMC_S:RATES[payRating],key=payRating<30?'alone':children>0?(spouse?'spouse_child':'child'):(spouse?'spouse':'alone');
  let label=smcS?'SMC-S basic monthly rate':tdiu?'TDIU basic rate (paid at 100%)':'Basic monthly rate';
  const included=[];if(payRating>=30&&spouse)included.push('spouse');if(payRating>=30&&children>0)included.push('1 child under 18');
  if(included.length)label+=' · includes '+included.join(' and ');else label+=' · veteran alone';
  add(label,row[key]);
  if(payRating>=30){
   if(children>1)add('Additional children under 18 ('+(children-1)+')',CHILD_U18[payRating],children-1);
   if(schoolChildren)add('Children 18–23 in a qualifying school program ('+schoolChildren+')',CHILD_SCH[payRating],schoolChildren);
   if(parents)add('Dependent parents ('+parents+')',PARENT_ADD[payRating],parents);
   if(spouse&&spouseAA)add('Spouse Aid and Attendance',Math.round((RATES[payRating].spouse_aa-RATES[payRating].spouse)*100)/100);
  }
 }
 // SMC-K may be payable even with a 0% combined rating. SMC-S replaces the
 // ordinary basic rate; it is not a fixed add-on to a lower rating.
 if(smcK)add('SMC-K ('+smcK+' '+(smcK===1?'award':'awards')+')',SMC_K,smcK);
 const monthlyCents=breakdown.reduce((n,item)=>n+cents(item.amount),0);
 return {monthly:monthlyCents/100,annual:monthlyCents*12/100,breakdown,year:meta.year,projected:meta.projected,cola:meta.cola,payRating};
}
