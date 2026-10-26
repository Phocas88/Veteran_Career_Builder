// 2026 tables reused from Veteran Career Path's VA calculator and checked against
// https://www.va.gov/disability/compensation-rates/veteran-rates/
// Effective 2025-12-01. Combined values follow VA's published whole-number table.
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
export function compensation(rating,{spouse=false,spouseAA=false,children=0,schoolChildren=0,parents=0}={}){
 if(!Number.isInteger(rating)||rating<0||rating>100||rating%10)throw new Error('Choose a valid combined rating.');
 if(!Number.isInteger(children)||children<0||children>20||!Number.isInteger(schoolChildren)||schoolChildren<0||schoolChildren>20||!Number.isInteger(parents)||parents<0||parents>2)throw new Error('Check dependent counts.');
 if(rating===0)return {monthly:0,annual:0,breakdown:[]};
 const row=RATES[rating],key=rating<30?'alone':children>0?(spouse?'spouse_child':'child'):(spouse?'spouse':'alone');
 const breakdown=[{label:'Basic monthly rate',amount:row[key]}];
 if(rating>=30){
  if(children>1)breakdown.push({label:'Additional children under 18',amount:(children-1)*CHILD_U18[rating]});
  if(schoolChildren)breakdown.push({label:'Children 18–23 in a qualifying school program',amount:schoolChildren*CHILD_SCH[rating]});
  if(parents)breakdown.push({label:'Dependent parents',amount:parents*PARENT_ADD[rating]});
  if(spouse&&spouseAA)breakdown.push({label:'Spouse Aid and Attendance',amount:Math.round((row.spouse_aa-row.spouse)*100)/100});
 }
 const monthly=breakdown.reduce((n,item)=>n+Math.round(item.amount*100),0)/100;return {monthly,annual:Math.round(monthly*1200)/100,breakdown};
}
