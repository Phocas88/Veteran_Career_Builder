// Only re-encoded JPEG data is accepted. External URLs and SVG are excluded.
export function safeProfilePhoto(value){
 if(typeof value!=='string'||value.length>240000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value))return '';
 return value;
}
export function profilePhotoControl(value=''){
 const label=document.createElement('label');label.className='builder-field profile-photo-field';
 const caption=document.createElement('span');caption.textContent='Profile photo · optional';
 const stored=document.createElement('input');stored.type='hidden';stored.dataset.key='photo';stored.value=safeProfilePhoto(value);
 const preview=document.createElement('img');preview.alt='Your profile photo';preview.width=88;preview.height=88;
 const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png';file.setAttribute('aria-label','Upload profile photo');
 const hint=document.createElement('small');hint.textContent='JPG or PNG · up to 2 MB. Saved privately with your profile. You decide whether to show it on your digital CV. Never sent to AI.';
 const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent='Remove profile photo';
 const status=document.createElement('span');status.className='field-hint';status.setAttribute('role','status');let revision=0;
 function render(){preview.hidden=!stored.value;remove.hidden=!stored.value;if(stored.value)preview.src=stored.value;else preview.removeAttribute('src');}
 function changed(){stored.dispatchEvent(new Event('input',{bubbles:true}));render();}
 remove.onclick=event=>{event.preventDefault();revision++;stored.value='';status.textContent='Photo removed from this draft. Save profile to keep the change.';changed();};
 file.onchange=async()=>{const image=file.files?.[0],token=++revision;if(!image)return;
  try{if(!['image/jpeg','image/png'].includes(image.type)||image.size>2*1024*1024)throw new Error('Choose a JPG or PNG photo up to 2 MB.');
   const bitmap=await createImageBitmap(image);if(bitmap.width>12000||bitmap.height>12000){bitmap.close();throw new Error('Choose a smaller image.');}
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,320,320);const side=Math.min(bitmap.width,bitmap.height);context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,320,320);bitmap.close();
   if(token!==revision||!label.isConnected)return;stored.value=canvas.toDataURL('image/jpeg',.85);changed();status.textContent='Photo added to this draft. Save profile to keep it.';
  }catch(error){if(token===revision&&label.isConnected)status.textContent=error.message||'The photo could not be opened.';}finally{file.value='';}
 };
 label.append(caption,stored,preview,file,hint,remove,status);render();return label;
}
