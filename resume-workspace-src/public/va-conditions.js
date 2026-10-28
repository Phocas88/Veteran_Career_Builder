// Common-condition names follow the main VCP calculator. Explanations are
// informational labels, not diagnoses, automatic ratings or eligibility rules.
const base='https://www.ecfr.gov/current/title-38/chapter-I/part-4/subpart-B/section-';
const group=(id,label,section,evaluation,items)=>({id,label,evaluation,source:base+section,items:items.map(([name,description])=>({id:id+':'+name,name,description}))});
export const CONDITION_CATEGORIES=[
 group('musculoskeletal','Bones, joints & muscles','4.71a','VA considers the affected joint or spine, movement, painful use and functional limitations. Some nerve conditions use a separate neurological schedule.',[
  ['Lumbar Degenerative Disc Disease','Wear or damage to the discs in the lower back.'],
  ['Cervical Strain','An injury or strain involving the neck muscles and supporting tissues.'],
  ['Knee Instability (Lateral)','A knee that gives way or is unstable during movement.'],
  ['Knee Limitation of Flexion','Difficulty bending the knee through its normal range.'],
  ['Knee Limitation of Extension','Difficulty straightening the knee fully.'],
  ['Shoulder Impingement','Shoulder tissues become pinched during arm movement.'],
  ['Ankle Instability','An ankle that repeatedly gives way or feels unstable.'],
  ['Plantar Fasciitis','Irritation of the tissue along the sole of the foot, often affecting the heel.'],
  ['Flat Feet (Pes Planus)','A reduced or flattened arch of the foot.'],
  ['Hip Limitation of Motion','Restricted movement of the hip joint.'],
  ['Thoracolumbar Spine Strain','A strain involving the middle or lower back.'],
  ['Radiculopathy (Lower Extremity)','An irritated spinal nerve affecting a leg, sometimes causing pain, numbness or weakness.'],
  ['Radiculopathy (Upper Extremity)','An irritated spinal nerve affecting an arm, sometimes causing pain, numbness or weakness.'],
  ['Carpal Tunnel Syndrome','Compression of the median nerve at the wrist, affecting the hand or fingers.'],
  ['Gout','A form of inflammatory arthritis associated with urate crystals in joints.'],
  ['Rheumatoid Arthritis','An autoimmune condition that causes joint inflammation.'],
  ['Sciatica','Symptoms along the sciatic nerve, which travels from the lower back into the leg.'],
  ['Intervertebral Disc Syndrome (IVDS)','A spinal disc condition that may affect nearby nerves.'],
  ['Traumatic Arthritis','Arthritis that develops following an injury to a joint.'],
  ['Cold Injury Residuals (Frostbite)','Lasting effects of a cold injury, such as sensitivity, numbness or tissue changes.']
 ]),
 group('mental-health','Mental health & PTSD','4.130','For most mental health conditions, VA evaluates effects on work and social functioning. Eating disorders have a separate formula. Enter only separately awarded ratings from your letter.',[
  ['PTSD','Post-traumatic stress disorder can affect mood, sleep, concentration and responses to reminders of trauma.'],
  ['Major Depressive Disorder','A depressive illness that can affect mood, motivation and daily functioning.'],
  ['Generalized Anxiety Disorder','Persistent anxiety and worry that can interfere with everyday activities.'],
  ['Bipolar Disorder','A mood disorder involving episodes of depression and mania or hypomania.'],
  ['Panic Disorder','Recurring panic attacks and related worry or changes in behavior.'],
  ['Adjustment Disorder','Emotional or behavioral symptoms connected to an identifiable stressor.'],
  ['Somatic Symptom Disorder','Distressing physical symptoms accompanied by significant related thoughts, feelings or behaviors.'],
  ['Insomnia (Secondary to PTSD)','Ongoing sleep difficulty recorded in connection with PTSD. It may be included in an existing mental health award.'],
  ['Eating Disorder','An illness involving eating behavior, nutrition and related health effects.'],
  ['Obsessive-Compulsive Disorder','Recurring intrusive thoughts or repetitive behaviors that can interfere with daily life.']
 ]),
 group('neurological','Brain, nerves & headaches','4.124a','The evaluation depends on the condition, affected nerve, frequency of episodes and functional effects. TBI residuals can involve several areas of functioning.',[
  ['Migraine Headaches','A headache disorder that may involve disabling attacks and sensitivity to light or sound.'],
  ['Traumatic Brain Injury (TBI)','Residual effects of an injury to the brain, which may affect thinking, behavior or physical functioning.'],
  ['Peripheral Neuropathy (Lower)','Damage to peripheral nerves affecting a leg or foot.'],
  ['Peripheral Neuropathy (Upper)','Damage to peripheral nerves affecting an arm or hand.'],
  ['Epilepsy / Seizure Disorder','A condition involving recurring seizures.'],
  ['Trigeminal Neuralgia','A nerve disorder that causes episodes of facial pain.'],
  ["Parkinson's Disease",'A neurological condition that can affect movement and other body functions.'],
  ['Multiple Sclerosis','A condition affecting communication through the brain and spinal cord.'],
  ['Restless Leg Syndrome','An urge to move the legs, often with uncomfortable sensations during rest.'],
  ['Narcolepsy','A sleep disorder involving excessive daytime sleepiness and sometimes sudden loss of muscle control.']
 ]),
 group('respiratory','Breathing, nose & sleep','4.97','Depending on the diagnosis, VA considers breathing tests, treatment, episodes or other specific findings. A condition name alone does not establish its percentage.',[
  ['Asthma','A condition involving inflamed and narrowed airways.'],
  ['Chronic Obstructive Pulmonary Disease (COPD)','A lung disease that causes persistent airflow limitation.'],
  ['Sleep Apnea (Obstructive)','Repeated obstruction of breathing during sleep.'],
  ['Sinusitis (Chronic)','Recurring or persistent inflammation of the sinuses.'],
  ['Rhinitis (Allergic)','Inflammation of the lining of the nose associated with allergies.'],
  ['Pulmonary Fibrosis','Scarring of lung tissue that can affect breathing.'],
  ['Restrictive Lung Disease','A group of conditions that limit expansion of the lungs.'],
  ['Bronchiectasis','Permanent widening and damage of airways.'],
  ['Asbestosis','Lung scarring associated with asbestos exposure.'],
  ['Mesothelioma','A cancer of tissue lining organs, often the lining around the lungs.'],
  ['Constrictive Bronchiolitis','Scarring and narrowing of the small airways in the lungs.']
 ]),
 group('cardiovascular','Heart & blood vessels','4.104','VA uses the applicable heart or vascular criteria, such as testing, treatment, blood-pressure readings and functional effects.',[
  ['Hypertension','Persistently elevated blood pressure.'],
  ['Coronary Artery Disease','Reduced blood flow through the arteries supplying the heart.'],
  ['Atrial Fibrillation','An irregular heart rhythm originating in the upper chambers of the heart.'],
  ['Heart Valve Disease','A condition affecting one or more valves that regulate blood flow through the heart.'],
  ['Peripheral Artery Disease','Reduced arterial blood flow, commonly affecting the legs.'],
  ['Aortic Aneurysm','An abnormal enlargement of part of the aorta.'],
  ['Cardiomyopathy','Disease of the heart muscle.'],
  ['Congestive Heart Failure','A condition in which the heart cannot pump or fill effectively.'],
  ['Deep Vein Thrombosis','A blood clot in a deep vein, with possible lasting vascular effects.']
 ]),
 group('digestive','Digestive system','4.114','The rating schedule has separate criteria for individual digestive conditions. VA considers the documented symptoms, treatment and functional effects for the applicable code.',[
  ['GERD (Acid Reflux)','Stomach contents flow back into the esophagus.'],
  ['Irritable Bowel Syndrome (IBS)','A bowel disorder involving abdominal discomfort and changes in bowel habits.'],
  ['Hiatal Hernia','Part of the stomach extends through the diaphragm.'],
  ["Crohn's Disease",'An inflammatory bowel disease that can affect different parts of the digestive tract.'],
  ['Ulcerative Colitis','An inflammatory bowel disease affecting the colon and rectum.'],
  ['Diverticulitis','Inflammation of small pouches in the digestive tract.'],
  ['Hemorrhoids','Swollen blood vessels in or around the rectum and anus.'],
  ['Liver Disease / Hepatitis','Disease or inflammation affecting the liver.'],
  ['Gastroparesis','Delayed movement of food from the stomach.']
 ]),
 group('skin','Skin & scars','4.118','VA considers the specific skin diagnosis, affected area, treatment, or the pain, instability and other effects of scars.',[
  ['Eczema / Dermatitis','Inflammation of the skin that may cause itching, redness or irritation.'],
  ['Psoriasis','An inflammatory skin condition that can cause raised, scaly patches.'],
  ['Acne / Chloracne','Acne or an acne-like skin condition, with evaluation depending on the diagnosis and effects.'],
  ['Urticaria (Hives)','Recurring raised, itchy areas of skin.'],
  ['Scars (Painful or Unstable)','Scars that are painful or have recurring loss of skin covering.'],
  ['Skin Cancer (Melanoma)','A cancer involving pigment-producing skin cells.'],
  ['Burn Scars','Lasting scars following a burn injury.'],
  ['Hidradenitis Suppurativa','A chronic skin condition involving recurring inflamed lumps, often in skin folds.']
 ]),
 group('endocrine','Hormones & metabolism','4.119','The applicable criteria may consider treatment needs, episodes, complications and residual effects. Use the rating already assigned for each awarded condition.',[
  ['Diabetes Mellitus Type II','A metabolic condition affecting regulation of blood glucose.'],
  ['Hypothyroidism','Reduced production of thyroid hormones.'],
  ["Hyperthyroidism / Graves' Disease",'Excess thyroid activity, including the autoimmune condition Graves’ disease.'],
  ["Addison's Disease",'Reduced production of hormones by the adrenal glands.'],
  ["Cushing's Syndrome",'A condition associated with prolonged excessive cortisol exposure.'],
  ['Growth Hormone Deficiency','Insufficient production of growth hormone.']
 ]),
 group('genitourinary','Kidneys, bladder & reproductive health','4.115a','VA considers the relevant renal, urinary or other diagnostic criteria. Some conditions may involve special monthly compensation rather than a higher ordinary percentage.',[
  ['Erectile Dysfunction','Difficulty obtaining or maintaining an erection; an award may include SMC-K.'],
  ['Kidney Disease / Renal Insufficiency','Reduced kidney function.'],
  ['Kidney Stones (Recurrent)','Repeated formation of stones in the urinary tract.'],
  ['Urinary Incontinence','Loss of bladder control or urinary leakage.'],
  ['Prostate Cancer','Cancer of the prostate, including possible effects after treatment.'],
  ['Benign Prostatic Hyperplasia','Noncancerous enlargement of the prostate.'],
  ['Bladder Cancer','Cancer of the bladder, including possible effects after treatment.']
 ]),
 group('gynecological','Gynecological conditions','4.116','VA considers the diagnosis, treatment response and documented functional effects under the applicable gynecological criteria.',[
  ['Endometriosis','A condition involving tissue similar to the uterine lining outside the uterus.'],
  ['Uterine Fibroids','Noncancerous growths in the uterus.'],
  ['Polycystic Ovary Syndrome','A hormonal condition that may affect ovulation and other body functions.'],
  ['Chronic Pelvic Pain','Persistent pain in the pelvic area; the underlying diagnosis determines the applicable code.'],
  ['Ovarian Cysts','Fluid-filled sacs in or on an ovary.'],
  ['Menstrual Disorders','Disorders involving menstrual bleeding, timing or related symptoms.']
 ]),
 group('hematologic','Blood & lymphatic system','4.117','VA considers condition-specific findings, treatment, activity of the disease and lasting effects. A vascular condition may instead use the cardiovascular schedule.',[
  ['Anemia (Chronic)','A persistent reduction in the blood’s capacity to carry oxygen.'],
  ['Sickle Cell Disease','An inherited blood disorder affecting red blood cells.'],
  ['Leukemia','Cancer affecting blood-forming tissues.'],
  ['Lymphoma','Cancer involving the lymphatic system.'],
  ['Thrombocytopenia','A low blood platelet count.'],
  ['Deep Vein Thrombosis','A blood clot in a deep vein; lasting vascular effects use the applicable vascular criteria.']
 ]),
 group('infectious','Infectious diseases','4.88b','The criteria depend on the disease and may consider active infection, treatment and lasting residuals. Some residuals use other body-system schedules.',[
  ['HIV/AIDS','A condition involving human immunodeficiency virus and its effects on the immune system.'],
  ['Hepatitis B','A viral infection affecting the liver.'],
  ['Hepatitis C','A viral infection affecting the liver, including possible residual liver damage.'],
  ['Tuberculosis','A bacterial infection that often affects the lungs and can have lasting effects.'],
  ['Malaria (Residuals)','Lasting effects of a previous malaria infection.'],
  ['Lyme Disease','A tick-borne infection that may cause lasting effects in some cases.']
 ]),
 group('dental','Dental, jaw & mouth','4.150','Compensation and eligibility for VA dental treatment have different rules. Ordinary periodontal disease is generally not compensable as a disability. Copy an actual award from your decision letter.',[
  ['TMJ Disorder','A disorder involving the jaw joint or muscles used for chewing.'],
  ['Periodontal Disease','Disease affecting tissues that support the teeth; dental treatment eligibility differs from compensation.'],
  ['Loss of Teeth (Service-Connected)','Tooth loss recorded in a service-connected award; compensation depends on the specific cause and bone loss criteria.'],
  ['Oral Cancer','Cancer affecting tissues in the mouth.']
 ]),
 group('eye','Eyes & vision','4.79','VA considers applicable vision testing, visual fields, episodes or other criteria for the specific eye condition.',[
  ['Glaucoma','A group of eye diseases that can damage the optic nerve.'],
  ['Cataracts','Clouding of the lens of the eye.'],
  ['Macular Degeneration','A condition affecting the part of the retina responsible for central vision.'],
  ['Diabetic Retinopathy','Damage to retinal blood vessels associated with diabetes.'],
  ['Dry Eye Syndrome','A condition involving inadequate or unstable lubrication of the eyes.'],
  ['Keratoconus','A condition in which the cornea thins and changes shape.'],
  ['Visual Field Loss','Loss of part of the area visible while looking straight ahead.']
 ]),
 group('hearing','Ears, hearing & balance','4.87','Hearing loss uses standardized hearing tests under 38 CFR 4.85–4.86. Other ear conditions have their own criteria. Recurrent tinnitus has one maximum 10% rating, even if both ears are affected.',[
  ['Tinnitus','The perception of ringing or other sound without an external source. Recurrent tinnitus has a single maximum 10% rating.'],
  ['Bilateral Hearing Loss','Reduced hearing in both ears, evaluated using VA-required hearing tests.'],
  ["Meniere's Disease",'An inner-ear disorder involving vertigo and hearing-related symptoms.'],
  ['Otitis Media (Chronic)','Persistent or recurring middle-ear inflammation or infection.'],
  ['Acoustic Neuroma','A usually noncancerous growth involving a nerve connected with hearing and balance.'],
  ['Vestibular Disorder','A disorder of the balance system that may cause dizziness or unsteadiness.']
 ])
];
export const CONDITIONS=CONDITION_CATEGORIES.flatMap(category=>category.items.map(item=>({...item,categoryId:category.id,category:category.label,evaluation:category.evaluation,source:category.source})));
export function findConditions({category='',query=''}={}){
 const words=String(query).toLowerCase().trim().split(/\s+/).filter(Boolean);
 return CONDITIONS.filter(item=>(!category||item.categoryId===category)&&words.every(word=>(item.name+' '+item.description+' '+item.category).toLowerCase().includes(word)));
}
