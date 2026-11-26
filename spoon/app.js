'use strict';
/* SPOON – private calorie & training tracker. All data stays in this browser (localStorage). */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const K='fitlog-v1',R=x=>Math.round(+x||0);
/* haptics: Android uses vibrate(); iOS Safari 17.4+ taps via a hidden switch input */
const haptic=(()=>{let l;const mk=()=>{const i=document.createElement('input');i.type='checkbox';i.id='hapi';i.setAttribute('switch','');l=document.createElement('label');l.htmlFor='hapi';l.append(i);l.style.cssText='position:fixed;left:-99px;top:-99px;opacity:0;pointer-events:none';document.body.append(l)};
  const P={tick:8,success:[12,60,14],warn:[40]};
  return k=>{try{if(S.cfg.nohap)return;if(navigator.vibrate){navigator.vibrate(P[k]||8);return}if(!l)mk();l.click();if(k==='success')setTimeout(()=>l.click(),90)}catch(e){}}})();
let anim=true,wasOpen=false;
const DEF=()=>({profile:null,diary:{},acts:{},lifts:{},water:{},weights:[],recent:[],cfg:{key:'',model:'',provider:'gemini'}});
let S=DEF();try{Object.assign(S,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){alert('Could not save (storage full or blocked).')}};
const dk=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const TODAY=()=>dk(new Date());
let cur=TODAY(),tab='today',sheet=null,res=[],pick=null,form={},msg='';
const MEALS=['Breakfast','Lunch','Dinner','Snack'];
const ACT=[['Walking',3.5],['Running',9.8],['Cycling',7.5],['Weight training',5],['HIIT',8],['Swimming',6],['Yoga',2.5],['Sports (football etc.)',7]];
const ACTF=[['Sedentary (desk job, little exercise)',1.2],['Light (1–3 workouts/week)',1.375],['Moderate (3–5 workouts/week)',1.55],['Very active (6–7 workouts/week)',1.725]];
const GOALS=[['Lose 0.5 kg/week',-500],['Lose 0.25 kg/week',-250],['Maintain weight',0],['Gain 0.25 kg/week',250],['Gain 0.5 kg/week',500]];
const sum=L=>L.reduce((a,i)=>({k:a.k+i.k,p:a.p+i.p,c:a.c+i.c,f:a.f+i.f}),{k:0,p:0,c:0,f:0});
const v=(k,d)=>esc(form[k]??d??'');
const opts=(arr,sel)=>arr.map(([l,x])=>`<option value="${x}" ${String(x)===String(sel)?'selected':''}>${esc(l)}</option>`).join('');

function calc(){const p=S.profile;if(!p)return null;
  const bmr=10*p.w+6.25*p.h-5*p.age+(p.sex==='m'?5:-161),maint=bmr*p.act;
  return{bmr:R(bmr),maint:R(maint),goal:R(maint+p.adj),bmi:p.w/((p.h/100)**2)}}
const bmiCat=b=>b<18.5?'Underweight':b<25?'Normal':b<30?'Overweight':'Obese';

const nowT=()=>new Date().toTimeString().slice(0,5);
const P={flame:['M220-400q0 63 28.5 118.5T328-189q-4-12-6-24.5t-2-24.5q0-32 12-60t35-51l113-111 113 111q23 23 35 51t12 60q0 12-2 24.5t-6 24.5q51-37 79.5-92.5T740-400q0-54-23-105.5T651-600q-21 15-44 23.5t-46 8.5q-61 0-101-41.5T420-714v-20q-46 33-83 73t-63 83.5q-26 43.5-40 89T220-400Zm260 24-71 70q-14 14-21.5 31t-7.5 37q0 41 29 69.5t71 28.5q42 0 71-28.5t29-69.5q0-20-7.5-37T551-306l-71-70Zm0-464v132q0 34 23.5 57t57.5 23q18 0 33.5-7.5T622-658l18-22q74 42 117 117t43 163q0 134-93 227T480-80q-134 0-227-93t-93-227q0-128 86-246.5T480-840Z','M160-400q0-105 50-187t110-138q60-56 110-85.5l50-29.5v132q0 37 25 58.5t56 21.5q17 0 32.5-7t28.5-23l18-22q72 42 116 116.5T800-400q0 95-49 171.5T622-113q23-26 35.5-58t12.5-67q0-38-14-71.5T615-370L480-502 346-370q-28 27-42 60.5T290-238q0 35 12.5 67t35.5 58q-80-39-129-115.5T160-400Zm320-18 92 90q18 18 28 41t10 49q0 53-38 90.5T480-110q-54 0-92-37.5T350-238q0-26 9.5-49t28.5-41l92-90Z'],home:['M220-180h150v-250h220v250h150v-390L480-765 220-570v390Zm-60 60v-480l320-240 320 240v480H530v-250H430v250H160Zm320-353Z','M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z'],chart:['M660-160v-280h140v280H660Zm-250 0v-640h140v640H410Zm-250 0v-440h140v440H160Z','M660-160v-280h140v280H660Zm-250 0v-640h140v640H410Zm-250 0v-440h140v440H160Z'],dumb:['m550-84-42-42 142-142-382-382-142 142-42-42 56-58-56-56 85-85-42-42 42-42 43 41 84-84 56 56 58-56 42 42-142 142 382 382 142-142 42 42-56 58 56 56-86 86 42 42-42 42-42-42-84 84-56-56-58 56Z','m550-84-42-42 142-142-382-382-142 142-42-42 56-58-56-56 85-85-42-42 42-42 43 41 84-84 56 56 58-56 42 42-142 142 382 382 142-142 42 42-56 58 56 56-86 86 42 42-42 42-42-42-84 84-56-56-58 56Z'],user:['M372-523q-42-42-42-108t42-108q42-42 108-42t108 42q42 42 42 108t-42 108q-42 42-108 42t-108-42ZM160-160v-94q0-38 19-65t49-41q67-30 128.5-45T480-420q62 0 123 15.5T731-360q31 14 50 41t19 65v94H160Zm60-60h520v-34q0-16-9.5-30.5T707-306q-64-31-117-42.5T480-360q-57 0-111 11.5T252-306q-14 7-23 21.5t-9 30.5v34Zm324.5-346.5Q570-592 570-631t-25.5-64.5Q519-721 480-721t-64.5 25.5Q390-670 390-631t25.5 64.5Q441-541 480-541t64.5-25.5ZM480-631Zm0 411Z','M372-523q-42-42-42-108t42-108q42-42 108-42t108 42q42 42 42 108t-42 108q-42 42-108 42t-108-42ZM160-160v-94q0-38 19-65t49-41q67-30 128.5-45T480-420q62 0 123 15.5T731-360q31 14 50 41t19 65v94H160Z'],plus:['M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z','M450-450H200v-60h250v-250h60v250h250v60H510v250h-60v-250Z'],drum:['M640-80q-67 0-101.5-22.5T480-150q-19-20-36.5-35T399-200q-45 0-100-15.5t-103.5-51Q147-302 114-359T80-499q-2-167 82.5-274T399-880q71 0 120 20.5t84.5 51.5q35.5 31 60 68.5T710-667q12 20 24 36.5t26 30.5q60 60 90 105t30 136q0 120-74.5 199.5T640-80Zm-.37-60q65.37 0 122.87-62.5T820-358.92q0-72.08-20.5-105.58T718-558q-20-20-36-43t-32-49q-43-69-92.58-119.5Q507.85-820 399-820q-136 0-197.5 96T140-505q0 73 30.5 120.5t72 75.5q41.5 28 85.31 38.5T399-260q45.25 0 72.75 22.4Q499.26-215.2 517-196q24 26 47.51 41 23.51 15 75.12 15ZM480.2-360q49.8 0 84.8-35.2t35-85q0-49.8-35.2-84.8t-85-35q-49.8 0-84.8 35.2t-35 85q0 49.8 35.2 84.8t85 35Zm-.2-120Z','M640-80q-67 0-101.5-22.5T480-150q-19-20-36.5-35T399-200q-45 0-100-15.5t-103.5-51Q147-302 114-359T80-499q-2-167 82.5-274T399-880q71 0 120 20.5t84.5 51.5q35.5 31 60 68.5T710-667q12 20 24 36.5t26 30.5q60 60 90 105t30 136q0 120-74.5 199.5T640-80ZM480.2-360q49.8 0 84.8-35.2t35-85q0-49.8-35.2-84.8t-85-35q-49.8 0-84.8 35.2t-35 85q0 49.8 35.2 84.8t85 35Z'],leaf:['M229.91-160q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm-170-165q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm-500-170q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm-170-165q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Z','M229.91-160q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm-170-165q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm-500-170q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm-170-165q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Zm335 0q-28.91 0-49.41-20.59-20.5-20.59-20.5-49.5t20.59-49.41q20.59-20.5 49.5-20.5t49.41 20.59q20.5 20.59 20.5 49.5t-20.59 49.41q-20.59 20.5-49.5 20.5Z'],drop:['M479-208q16 0 24.5-5.5T512-230q0-11-8.5-17t-25.5-6q-42 0-85.5-26.5T337-373q-2-9-9-14.5t-15-5.5q-11 0-17 8.5t-4 17.5q15 84 71 121.5T479-208Zm-227.5 34Q160-268 160-408q0-100 79.5-217.5T480-880q161 137 240.5 254.5T800-408q0 140-91.5 234T480-80q-137 0-228.5-94ZM666-216.5Q740-293 740-408q0-79-66.5-179.5T480-800Q353-688 286.5-587.5T220-408q0 115 74 191.5T480-140q112 0 186-76.5ZM480-480Z','M479-208q16 0 24.5-5.5T512-230q0-11-8.5-17t-25.5-6q-42 0-85.5-26.5T337-373q-2-9-9-14.5t-15-5.5q-11 0-17 8.5t-4 17.5q15 84 71 121.5T479-208Zm-227.5 34Q160-268 160-408q0-100 79.5-217.5T480-880q161 137 240.5 254.5T800-408q0 140-91.5 234T480-80q-137 0-228.5-94Z'],timer:['M360-860v-60h240v60H360Zm90 447h60v-230h-60v230ZM340.5-109.5Q275-138 226-187t-77.5-114.5Q120-367 120-441t28.5-139.5Q177-646 226-695t114.5-77.5Q406-801 480-801q67 0 126 22.5T711-716l51-51 42 42-51 51q36 40 61.5 97T840-441q0 74-28.5 139.5T734-187q-49 49-114.5 77.5T480-81q-74 0-139.5-28.5Zm352-119Q780-316 780-441t-87.5-212.5Q605-741 480-741t-212.5 87.5Q180-566 180-441t87.5 212.5Q355-141 480-141t212.5-87.5ZM480-440Z','M360-860v-60h240v60H360Zm90 447h60v-230h-60v230ZM340.5-109.5Q275-138 226-187t-77.5-114.5Q120-367 120-441t28.5-139.5Q177-646 226-695t114.5-77.5Q406-801 480-801q67 0 125.5 22T710-717l51-51 43 43-51 51q36 40 61.5 97T840-441q0 74-28.5 139.5T734-187q-49 49-114.5 77.5T480-81q-74 0-139.5-28.5Z'],cam:['M479.5-267q72.5 0 121.5-49t49-121.5q0-72.5-49-121T479.5-607q-72.5 0-121 48.5t-48.5 121q0 72.5 48.5 121.5t121 49Zm0-60q-47.5 0-78.5-31.5t-31-79q0-47.5 31-78.5t78.5-31q47.5 0 79 31t31.5 78.5q0 47.5-31.5 79t-79 31.5ZM140-120q-24 0-42-18t-18-42v-513q0-23 18-41.5t42-18.5h147l73-87h240l73 87h147q23 0 41.5 18.5T880-693v513q0 24-18.5 42T820-120H140Zm0-60h680v-513H645l-73-87H388l-73 87H140v513Zm340-257Z','M480-267q72 0 121-49t49-121q0-73-49-121.5T480-607q-73 0-121.5 48.5T310-437q0 72 48.5 121T480-267Zm0-60q-48 0-79-31.5T370-437q0-48 31-79t79-31q47 0 78.5 31t31.5 79q0 47-31.5 78.5T480-327ZM140-120q-24 0-42-18t-18-42v-513q0-23 18-41.5t42-18.5h147l73-87h240l73 87h147q23 0 41.5 18.5T880-693v513q0 24-18.5 42T820-120H140Z'],scan:['M40-120v-182h60v122h122v60H40Zm697 0v-60h122v-122h60v182H737ZM153-231v-499h80v499h-80Zm121 0v-499h42v499h-42Zm122 0v-499h83v499h-83Zm125 0v-499h121v499H521Zm163 0v-499h42v499h-42Zm83 0v-499h38v499h-38ZM40-658v-182h182v60H100v122H40Zm819 0v-122H737v-60h182v182h-60Z','M40-120v-182h60v122h122v60H40Zm697 0v-60h122v-122h60v182H737ZM153-231v-499h80v499h-80Zm121 0v-499h42v499h-42Zm122 0v-499h83v499h-83Zm125 0v-499h121v499H521Zm163 0v-499h42v499h-42Zm83 0v-499h38v499h-38ZM40-658v-182h182v60H100v122H40Zm819 0v-122H737v-60h182v182h-60Z'],prev:['M561-240 320-481l241-241 43 43-198 198 198 198-43 43Z','M561-240 320-481l241-241 43 43-198 198 198 198-43 43Z'],next:['M530-481 332-679l43-43 241 241-241 241-43-43 198-198Z','M530-481 332-679l43-43 241 241-241 241-43-43 198-198Z'],sheet:['M780-121H180q-24 0-42-18t-18-42v-599q0-24 18-42t42-18h600q24 0 42 18t18 42v599q0 24-18 42t-42 18ZM180-639h600v-141H180v141Zm130 60H180v398h130v-398Zm340 0v398h130v-398H650Zm-60 0H370v398h220v-398Z','M120-639v-141q0-24.75 17.63-42.38Q155.25-840 180-840h600q24.75 0 42.38 17.62Q840-804.75 840-780v141H120Zm60 518q-24.75 0-42.37-17.63Q120-156.25 120-181v-398h190v458H180Zm470 0v-458h190v398q0 24.75-17.62 42.37Q804.75-121 780-121H650Zm-280 0v-458h220v458H370Z'],pdf:['M331-431h37v-83h48q15.73 0 26.36-10.64Q453-535.28 453-551v-48q0-15.72-10.64-26.36Q431.73-636 416-636h-85v205Zm37-120v-48h48v48h-48Zm129 120h84q15 0 26-10.64 11-10.63 11-26.36v-131q0-15.72-11-26.36Q596-636 581-636h-84v205Zm37-37v-131h47v131h-47Zm133 37h37v-83h50v-37h-50v-48h50v-37h-87v205ZM260-200q-24 0-42-18t-18-42v-560q0-24 18-42t42-18h560q24 0 42 18t18 42v560q0 24-18 42t-42 18H260Zm0-60h560v-560H260v560ZM140-80q-24 0-42-18t-18-42v-620h60v620h620v60H140Zm120-740v560-560Z','M331-431h37v-83h48q15.73 0 26.36-10.64Q453-535.28 453-551v-48q0-15.72-10.64-26.36Q431.73-636 416-636h-85v205Zm37-120v-48h48v48h-48Zm129 120h84q15 0 26-10.64 11-10.63 11-26.36v-131q0-15.72-11-26.36Q596-636 581-636h-84v205Zm37-37v-131h47v131h-47Zm133 37h37v-83h50v-37h-50v-48h50v-37h-87v205ZM260-200q-24 0-42-18t-18-42v-560q0-24 18-42t42-18h560q24 0 42 18t18 42v560q0 24-18 42t-42 18H260ZM140-80q-24 0-42-18t-18-42v-620h60v620h620v60H140Z'],download:['M480-313 287-506l43-43 120 120v-371h60v371l120-120 43 43-193 193ZM220-160q-24 0-42-18t-18-42v-143h60v143h520v-143h60v143q0 24-18 42t-42 18H220Z','M480-313 287-506l43-43 120 120v-371h60v371l120-120 43 43-193 193ZM220-160q-24 0-42-18t-18-42v-143h60v143h520v-143h60v143q0 24-18 42t-42 18H220Z'],close:['m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z','m249-207-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z']};
/* Material Symbols (Outlined, 400) – [outline, filled] */
const FILLED=new Set(['flame','drum','leaf','drop']);
const ic=(n,s=20,c='currentColor',f)=>`<svg width="${s}" height="${s}" viewBox="0 -960 960 960" fill="${c}" aria-hidden="true"><path d="${P[n][(f??FILLED.has(n))?1:0]}"/></svg>`;
const ring=(pct,s,w,col,inner)=>{const r=(s-w)/2,C=2*Math.PI*r;return `<div class="rg" style="width:${s}px;height:${s}px"><svg width="${s}" height="${s}" style="transform:rotate(-90deg)"><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${w}"/><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" class="rp" style="--c:${C}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-Math.min(1,Math.max(0,pct||0)))}"/></svg><div class="in">${inner}</div></div>`};
const autoMeal=()=>{const h=new Date().getHours();return h<11?'Breakfast':h<16?'Lunch':h<20?'Dinner':'Snack'};

function render(){
  const nb=(k,i,l)=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}" aria-label="${l}"${tab===k?' aria-current="page"':''}>${ic(i,24)}${l}</button>`;
  $('#nav').innerHTML=nb('today','home','Home')+nb('trends','chart','Progress')+`<button class="fab" data-a="fab" aria-label="Add food">${ic('plus',30)}</button>`+nb('train','dumb','Train')+nb('me','user','Profile');
  const T={trends:'Statistics',train:'Training',me:'Profile'},nm=S.profile?.name||'';
  $('#bar').innerHTML=`<div class="bi">${tab==='today'?`<img class="logo" src="logo.png" alt="SPOON"><div class="av">${esc((nm[0]||'S').toUpperCase())}</div>`:`<h1 class="bt">${T[tab]}</h1>`}</div>`;
  $('#app').innerHTML={today:vToday,trends:vTrends,train:vTrain,me:vMe}[tab]();
  $('#app').classList.toggle('enter',anim);anim=false;
  const sh=$('#sheet');sh.classList.remove('out');sh.innerHTML=sheet?vSheet():'';sh.classList.toggle('in',!!sheet&&!wasOpen);wasOpen=!!sheet;
}
function weekDays(){const d=new Date(cur+'T00:00:00');d.setDate(d.getDate()-d.getDay());return [...Array(7)].map((_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x})}
function strip(){
  const d=new Date(cur+'T00:00:00'),td=TODAY();
  return `<div class="card wk"><div class="wkh"><b>${d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b><span><button class="rb" data-a="week" data-v="-7" aria-label="Previous week">${ic('prev',20)}</button><button class="rb" data-a="week" data-v="7" aria-label="Next week">${ic('next',20)}</button></span></div><div class="days">${weekDays().map(x=>{const k=dk(x),has=(S.diary[k]||[]).length>0;return `<button class="dy ${k===cur?'on':''}" data-a="setday" data-v="${k}" ${k>td?'disabled':''}><small>${x.toLocaleDateString(undefined,{weekday:'narrow'})}</small><b>${x.getDate()}</b>${has?'<i></i>':''}</button>`}).join('')}</div></div>`}

/* ---------- Today ---------- */
function vToday(){
  const c=calc(),L=S.diary[cur]||[],A=S.acts[cur]||[],t=sum(L),burn=A.reduce((a,x)=>a+x.kcal,0);
  const goal=c?c.goal+burn:0,left=goal-t.k,w=S.water[cur]||0,wg=S.profile?Math.round(S.profile.w*35/250)*250:2000;
  const logged=weekDays().filter(x=>(S.diary[dk(x)]||[]).length).length,hr=new Date().getHours();
  const nm=S.profile?.name||'';
  const mc=(n,x,tg,col,i)=>{const l=tg-x;return `<div class="card mc"><b>${tg?R(Math.abs(l)):R(x)}g</b><span class="mu">${n} ${tg?(l<0?'over':'left'):'eaten'}</span>${ring(tg?x/tg:0,68,8,col,ic(i,20,col))}</div>`};
  const rows=[...L.map((e,i)=>({e,i,f:1})),...A.map((e,i)=>({e,i,f:0}))].sort((a,b)=>(b.e.t||'').localeCompare(a.e.t||''));
  return `<div class="gr"><span class="mu">${hr<12?'Good morning':hr<17?'Good afternoon':'Good evening'}</span><b>${esc(nm||'Welcome')}</b></div>${strip()}
  ${c?'':`<div class="card"><h2>Set up your daily target</h2><p class="mu" style="margin-top:0">Add your age, height and weight to see how many calories you need.</p><button data-a="tab" data-v="me">Open profile</button></div>`}
  <div class="card hero"><div><div class="num">${goal?R(Math.abs(left)):R(t.k)}</div><div class="mu" style="margin-top:8px;font-size:15px">${goal?(left<0?'Calories over':'Calories left'):'Calories eaten'}</div></div>${ring(goal?t.k/goal:0,128,12,left<0?'var(--bad)':'var(--ink)',`<span class="fl">${ic('flame',24)}</span>`)}</div>
  <div class="macros">${mc('Protein',t.p,goal*.2/4,'var(--pr)','drum')}${mc('Carbs',t.c,goal*.5/4,'var(--cb)','leaf')}${mc('Fat',t.f,goal*.3/9,'var(--ft)','drop')}</div>
  <div class="card lime"><div><span class="mu" style="color:inherit;opacity:.7">This week</span><b>${logged} of 7 days logged</b></div>${ring(logged/7,76,9,'var(--lime-d)',`<b style="font-size:22px">${logged}</b>`).replace('var(--track)','rgba(255,255,255,.55)')}</div>
  <div class="two"><div class="card q"><div class="t"><span class="mu">Water</span><button class="plus ib" data-a="water" data-v="250" style="width:38px;height:38px">${ic('plus',18)}</button></div><b>${(w/1000).toFixed(2).replace(/\.?0+$/,'')||0} <small>/ ${wg/1000} L</small></b></div>
  <div class="card q" data-a="tab" data-v="train"><div class="t"><span class="mu">Burned</span><span class="ib">${ic('flame',18,'#e8a317')}</span></div><b>${R(burn)} <small>kcal</small></b></div></div>
  ${MEALS.map(m=>`<div class="card meal"><div><b>${m}</b><div><span class="kb">${ic('flame',14,'#e8a317')}${R(sum(L.filter(e=>e.meal===m)).k)} kcal</span></div></div><button class="plus" data-a="add" data-v="${m}" aria-label="Add to ${m}">${ic('plus',22)}</button></div>`).join('')}
  <div class="sec">Recently logged</div>
  ${rows.length?rows.map(({e,i,f})=>f?`<div class="log"><div class="tile">${esc((e.name[0]||'•').toUpperCase())}</div><div class="lb"><div class="ln"><span>${esc(e.name)}</span>${e.t?`<em>${e.t}</em>`:''}</div><div class="lk">${ic('flame',20)}<b>${R(e.k)} calories</b></div><div class="lm"><span>${ic('drum',14,'var(--pr)')}${R(e.p)}g</span><span>${ic('leaf',14,'var(--cb)')}${R(e.c)}g</span><span>${ic('drop',14,'var(--ft)')}${R(e.f)}g</span></div></div><button class="x" data-a="delf" data-v="${i}">Remove</button></div>`
    :`<div class="log"><div class="tile a">${ic('dumb',30,'#fff')}</div><div class="lb"><div class="ln"><span>${esc(e.name)}</span>${e.t?`<em>${e.t}</em>`:''}</div><div class="lk">${ic('flame',20)}<b>${R(e.kcal)} calories</b></div><div class="lm"><span>${ic('timer',14)}${e.min} mins</span></div></div><button class="x" data-a="delact" data-v="${i}">Remove</button></div>`).join(''):'<div class="card empty">Nothing logged yet. Tap + to add your first meal.</div>'}`;
}

/* ---------- Add-food sheet ---------- */
function vSheet(){
  if(sheet.scan)return `<div class="sh"><div class="hd"><b>Scan barcode</b><button class="g" data-a="stopscan">Cancel</button></div><div class="cam"><video id="cam" playsinline muted></video><div class="frame"></div></div><p class="note">${esc(sheet.scanMsg||'Point the camera at the barcode on the pack.')}</p></div>`;
  const m=sheet.mode;let b='';
  const tabs=[['search','Search'],['quick','Quick add'],['ai','AI']].map(([k,l])=>`<button class="${m===k?'on':''}" data-a="mode" data-v="${k}">${l}</button>`).join('');
  if(m==='search'){
    b=`<div class="row"><input data-k="q" data-enter="search" placeholder="Food name or barcode number" value="${v('q')}"><button class="s" data-a="scan" aria-label="Scan barcode">${ic('scan',22)}</button><button data-a="search">Go</button></div>
    <div class="pair"><button class="s" data-a="askai">${ic('flame',20)}AI search</button><button class="s" data-a="photo">${ic('cam',20)}Camera</button></div><p class="note">Search packaged foods by name or barcode. For home-cooked meals, type what you ate and tap AI search, or take a photo.</p>`;
    if(sheet.busy)b+='<p class="mu">Searching…</p>';
    if(sheet.err)b+=`<p class="err">${esc(sheet.err)}</p>`;
    if(pick){const p=pick;b+=`<div class="card"><b>${esc(p.name)}</b><div class="mu">Per 100 g: ${R(p.k)} kcal · P ${R(p.p)} · C ${R(p.c)} · F ${R(p.f)}</div><div class="row" style="margin-top:8px"><input data-k="g" type="number" inputmode="decimal" placeholder="Grams" value="${v('g',100)}"><button data-a="addpick">Add</button></div></div>`}
    else if(res.length)b+=res.map((p,i)=>`<div class="it" data-a="pick" data-v="${i}"><div>${esc(p.name)}<div class="mu">${R(p.k)} kcal / 100 g</div></div><span class="g">${ic('next',22)}</span></div>`).join('');
    else if(S.recent.length)b+=`<h2>Recent</h2>`+S.recent.map((e,i)=>`<div class="it"><div>${esc(e.name)}<div class="mu">${R(e.k)} kcal</div></div><button class="g" data-a="readd" data-v="${i}" aria-label="Add again">${ic('plus',22)}</button></div>`).join('');
  }else if(m==='quick'){
    b=`<input data-k="qn" placeholder="What did you eat?" value="${v('qn')}"><div class="row"><input data-k="qk" type="number" inputmode="decimal" placeholder="kcal" value="${v('qk')}"><input data-k="qp" type="number" inputmode="decimal" placeholder="Protein g" value="${v('qp')}"></div><div class="row"><input data-k="qc" type="number" inputmode="decimal" placeholder="Carbs g" value="${v('qc')}"><input data-k="qf" type="number" inputmode="decimal" placeholder="Fat g" value="${v('qf')}"></div><button data-a="quick" style="width:100%">Add</button>`;
  }else{
    const pair=(p)=>`<div class="pair">${p?`<button class="s" data-a="photo">${ic('cam',20)}Photo</button>`:''}<button class="s" data-a="scan">${ic('scan',20)}Scan barcode</button></div>`;
    const k=!!S.cfg.key;
    b=`${pair(k)}${sheet.img?`<div class="ph"><img src="${sheet.img}" alt="Meal photo"><button class="x" data-a="rmphoto">Remove</button></div>`:''}<textarea data-k="t" rows="3" placeholder="${sheet.img?'Optional note, e.g. 2 rotis, less oil':'Describe your meal, e.g. 2 rotis, dal, a bowl of rice and a banana'}">${v('t')}</textarea>
      <button data-a="ai" class="wide" ${sheet.busy||!k?'disabled':''}>${sheet.busy?'Estimating…':'Estimate &amp; add'}</button>
      ${k?`<p class="note">AI estimates are approximate. Check and delete entries that look off.${sheet.img?' The photo is sent to your AI provider only for this estimate and is not saved in SPOON.':''}</p>`:`<p class="note">Add a free API key (Google Gemini or Groq, no card needed) in Profile → AI meal assistant to turn on AI estimates and photos. Barcode scanning works without a key.</p>`}${sheet.err?`<p class="err">${esc(sheet.err)}</p>`:''}`;
  }
  return `<div class="sh"><div class="hd"><b>Add to ${sheet.meal}</b><button class="g" data-a="close">Close</button></div><div class="tabs">${tabs}</div>${b}</div>`;
}
const pushFood=(items)=>{const L=S.diary[cur]=S.diary[cur]||[];items.forEach(e=>{e.t=e.t||nowT();L.push(e);S.recent=[e,...S.recent.filter(r=>r.name!==e.name)].slice(0,15)});save();sheet=null;form={};anim=true;haptic('success');render()};
async function search(){
  const q=(form.q||'').trim();if(!q)return;sheet.busy=true;sheet.err='';res=[];pick=null;render();
  try{
    const f='product_name,brands,nutriments,code';let ps;
    if(/^\d{8,14}$/.test(q)){const j=await(await fetch(`https://world.openfoodfacts.org/api/v2/product/${q}.json?fields=${f}`)).json();ps=j.product?[j.product]:[]}
    else{const j=await(await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${f}`)).json();ps=j.products||[]}
    res=ps.filter(p=>p.product_name&&p.nutriments&&p.nutriments['energy-kcal_100g']!=null).map(p=>({name:p.product_name+(p.brands?' · '+p.brands.split(',')[0]:''),k:+p.nutriments['energy-kcal_100g']||0,p:+p.nutriments.proteins_100g||0,c:+p.nutriments.carbohydrates_100g||0,f:+p.nutriments.fat_100g||0}));
    if(!res.length)sheet.err=/^\d{8,14}$/.test(q)?'Barcode not found in the food database. Try Photo with AI, or Quick add.':'No results. Try another word, Quick add, or AI.';
    else if(sheet.fromScan&&res.length===1){pick=res[0];form.g=100}
  }catch(e){sheet.err='Search failed. Check your connection.';haptic('warn')}
  sheet.busy=false;sheet.fromScan=false;render();
}
const PROV={
  gemini:{name:'Google Gemini (free)',model:'gemini-flash-lite-latest'},
  groq:{name:'Groq (free)',model:'qwen/qwen3.6-27b'},
  anthropic:{name:'Anthropic Claude (paid)',model:'claude-haiku-5-5'}
};
const provOf=()=>S.cfg.provider||(String(S.cfg.key).startsWith('sk-ant')?'anthropic':'gemini');
const modelOf=p=>{const m=(S.cfg.model||'').trim();return m&&(p==='anthropic'||!/^claude/i.test(m))?m:PROV[p].model};
async function callAI(prompt,img){
  const p=provOf(),m=modelOf(p),k=S.cfg.key,b64=img?img.split(',')[1]:'';let r,j;
  if(p==='gemini'){
    r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':k},body:JSON.stringify({contents:[{parts:[{text:prompt},...(b64?[{inlineData:{mimeType:'image/jpeg',data:b64}}]:[])]}],generationConfig:{responseMimeType:'application/json',temperature:.2,maxOutputTokens:2048}})});
    j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);
    return(j.candidates?.[0]?.content?.parts||[]).map(x=>x.text||'').join('');
  }
  if(p==='groq'){
    r=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+k},body:JSON.stringify({model:m,temperature:.2,max_tokens:2000,response_format:{type:'json_object'},messages:[{role:'user',content:b64?[{type:'text',text:prompt},{type:'image_url',image_url:{url:img}}]:prompt}]})});
    j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);
    return j.choices?.[0]?.message?.content||'';
  }
  r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:m,max_tokens:1000,messages:[{role:'user',content:b64?[{type:'image',source:{type:'base64',media_type:'image/jpeg',data:b64}},{type:'text',text:prompt}]:prompt}]})});
  j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);
  return j.content.map(x=>x.text||'').join('');
}
async function ai(){
  const t=(form.t||'').trim(),img=sheet.img||'';if(!t&&!img)return;sheet.busy=true;sheet.err='';render();
  const P='You are a nutrition expert. Estimate calories and macros for each food in this meal using typical portions (assume common Indian home or restaurant portions when unclear). '+(img?'The meal is shown in the attached photo: identify each food and judge the portion size from the photo. ':'')+'Reply with ONLY JSON, no other text: {"items":[{"name":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}. '+(t?'Meal description: '+t:'');
  try{
    const txt=await callAI(P,img);
    const items=JSON.parse(txt.replace(/<think>[\s\S]*?<\/think>/g,'').replace(/```json|```/g,'').trim()).items;
    if(!items?.length)throw new Error('No foods found');
    pushFood(items.map(i=>({meal:sheet.meal,name:String(i.name||t||'Meal'),k:+i.kcal||0,p:+i.protein_g||0,c:+i.carbs_g||0,f:+i.fat_g||0})));
  }catch(e){sheet.busy=false;sheet.err='AI failed: '+e.message;haptic('warn');render()}
}

/* ---------- Camera: meal photo + barcode scan ---------- */
function shrink(file,max=1024){return new Promise((ok,no)=>{const u=URL.createObjectURL(file),im=new Image();
  im.onload=()=>{const k=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);URL.revokeObjectURL(u);ok(cv.toDataURL('image/jpeg',.82))};
  im.onerror=()=>{URL.revokeObjectURL(u);no(new Error('bad image'))};im.src=u})}
$('#pic').addEventListener('change',async e=>{const f=e.target.files[0];e.target.value='';if(!f||!sheet)return;
  try{sheet.img=await shrink(f);sheet.err='';sheet.mode='ai'}catch(x){sheet.err='Could not read that photo.'}render()});

let stream=null,scanTimer=0;
function stopScan(){clearTimeout(scanTimer);scanTimer=0;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}}
const loadZX=()=>window.ZXing?Promise.resolve():new Promise((ok,no)=>{const x=document.createElement('script');x.src='zxing.min.js';x.onload=ok;x.onerror=()=>no(new Error('scanner'));document.head.appendChild(x)});
function scanFail(m){stopScan();if(!sheet)return;sheet.scan=false;sheet.mode='search';sheet.err=m;render()}
function found(code){stopScan();haptic('success');sheet.scan=false;sheet.mode='search';form.q=code;sheet.fromScan=true;render();search()}
async function startScan(){
  const vd=$('#cam');if(!vd)return;
  if(!navigator.mediaDevices?.getUserMedia)return scanFail('Camera is not available here. Type the barcode number instead.');
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false})}
  catch(e){return scanFail('Camera permission was denied. Allow camera access, or type the barcode number.')}
  if(!sheet||!sheet.scan||!$('#cam')){stopScan();return}
  vd.srcObject=stream;try{await vd.play()}catch(e){}
  let det=null,mfr=null;
  try{if('BarcodeDetector' in window)det=new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e']})}catch(e){det=null}
  if(!det){
    try{await loadZX();const h=new Map();h.set(ZXing.DecodeHintType.POSSIBLE_FORMATS,[ZXing.BarcodeFormat.EAN_13,ZXing.BarcodeFormat.EAN_8,ZXing.BarcodeFormat.UPC_A,ZXing.BarcodeFormat.UPC_E]);h.set(ZXing.DecodeHintType.TRY_HARDER,true);mfr=new ZXing.MultiFormatReader();mfr.setHints(h)}
    catch(e){return scanFail('Could not load the barcode scanner. Type the barcode number instead.')}
  }
  const cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
  const tick=async()=>{
    if(!stream)return;let code='';
    try{
      if(vd.videoWidth){
        if(det){const r=await det.detect(vd);code=(r[0]&&r[0].rawValue)||''}
        else{cv.width=vd.videoWidth;cv.height=vd.videoHeight;cx.drawImage(vd,0,0);
          try{code=mfr.decode(new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(new ZXing.HTMLCanvasElementLuminanceSource(cv)))).getText()}catch(e){}}
      }
    }catch(e){}
    if(/^\d{8,14}$/.test(code))return found(code);
    scanTimer=setTimeout(tick,det?150:250);
  };
  tick();
}

/* ---------- Trends ---------- */
function vTrends(){
  const c=calc(),goal=c?c.goal:2000,days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return dk(d)});
  const D=days.map(d=>sum(S.diary[d]||[])),mx=Math.max(goal*1.15,...D.map(x=>x.k)),H=162,B=172;
  const bars=D.map((x,i)=>{const X=i*44+10,hg=goal/mx*H,hk=x.k/mx*H,isT=i===6,wd=new Date(days[i]+'T00:00:00').toLocaleDateString(undefined,{weekday:'short'});
    return `<rect x="${X}" y="${B-hg}" width="16" height="${hg}" rx="6" fill="url(#ht)"/><rect x="${X+10}" y="${B-hk}" width="16" height="${Math.max(hk,0)}" rx="6" fill="${isT?'var(--lime-d)':'var(--lime)'}" opacity="${x.k?1:0}"/>${x.k?`<text x="${X+18}" y="${B-Math.max(hk,hg)-6}" text-anchor="middle">${R(x.k/goal*100)}%</text>`:''}<text x="${X+18}" y="188" text-anchor="middle">${wd}</text>`}).join('');
  const W=S.weights,lw=W[W.length-1],pw=W[W.length-2],mins=days.map(d=>(S.acts[d]||[]).reduce((a,x)=>a+x.min,0)),tm=mins.reduce((a,x)=>a+x,0),mm=Math.max(...mins,1);
  const lg=D.filter(x=>x.k>0),avg=lg.length?R(lg.reduce((a,x)=>a+x.k,0)/lg.length):0,wt=S.water[TODAY()]||0,wg=S.profile?Math.round(S.profile.w*35/250)*250:2000;
  return `<div class="card stat"><div class="mu">Calories today</div><span class="tg">Target: <b>${c?goal:'–'} kcal</b></span><div class="big">${R(D[6].k)} <small class="mu" style="font-size:20px;font-weight:500">kcal</small></div>
  <svg viewBox="0 0 320 196" width="100%" style="margin-top:14px"><defs><pattern id="ht" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="var(--hatch)"/></pattern></defs>${bars}</svg>
  <p class="mu" style="margin:6px 0 0">Daily average ${avg} kcal over ${lg.length} logged day${lg.length===1?'':'s'}</p></div>
  <div class="two"><div class="card q"><span class="mu">Exercise</span><div class="mini">${mins.map(m=>`<i style="height:${m/mm*100}%;opacity:${m?1:.25}"></i>`).join('')}</div><b>${(tm/60).toFixed(1)} <small>hours</small></b></div>
  <div class="card q"><span class="mu">Weight</span><div class="mini" style="align-items:center"><span class="ib" style="background:var(--lime-l)">${ic('user',20)}</span></div><b>${lw?lw.w:'–'} <small>kg</small></b>${lw&&pw?`<small>${lw.w-pw.w>0?'+':''}${(lw.w-pw.w).toFixed(1)} kg since ${pw.d.slice(5)}</small>`:''}</div></div>
  <div class="two"><div class="card q"><span class="mu">Water</span><div class="mini drops" style="align-items:center">${[...Array(5)].map((_,i)=>`<span style="opacity:${wt/wg>(i)/5?1:.2}">${ic('drop',22)}</span>`).join('')}</div><b>${(wt/1000).toFixed(2).replace(/\.?0+$/,'')||0} <small>/ ${wg/1000} L</small></b></div>
  <div class="card q"><span class="mu">Daily average</span><div class="mini" style="align-items:center"><span class="ib" style="background:#fdf0cf">${ic('flame',20,'#e8a317')}</span></div><b>${avg} <small>kcal</small></b></div></div>`;
}

/* ---------- Train ---------- */
function vTrain(){
  const A=S.acts[cur]||[],Lf=S.lifts[cur]||[],all=Object.values(S.lifts).flat();
  const best=n=>Math.max(0,...all.filter(x=>x.n.toLowerCase()===n.toLowerCase()).map(x=>x.w));
  const vol=Lf.reduce((a,x)=>a+x.s*x.r*x.w,0);
  return `${strip()}
  <div class="card"><h2>Cardio / activity</h2>
  <select data-k="an">${opts(ACT.map(a=>[a[0],a[0]]),form.an)}</select>
  <div class="row"><input data-k="am" type="number" inputmode="numeric" placeholder="Minutes" value="${v('am')}"><input data-k="ak" type="number" inputmode="numeric" placeholder="kcal (optional)" value="${v('ak')}"></div>
  <button data-a="addact" style="width:100%">Log activity</button><p class="note">Burn is estimated from MET values and your weight. Exercise calories are added to your day’s target.</p>
  ${A.map((a,i)=>`<div class="it"><div>${esc(a.name)}<div class="mu">${a.min} min</div></div><span class="k">−${R(a.kcal)}</span><button class="x" data-a="delact" data-v="${i}" aria-label="Remove">${ic('close',18)}</button></div>`).join('')}</div>
  <div class="card"><h2>Lifting log</h2>
  <input data-k="ln" placeholder="Exercise (e.g. Bench press)" value="${v('ln')}">
  <div class="row"><input data-k="ls" type="number" inputmode="numeric" placeholder="Sets" value="${v('ls')}"><input data-k="lr" type="number" inputmode="numeric" placeholder="Reps" value="${v('lr')}"><input data-k="lw" type="number" inputmode="decimal" placeholder="Kg" value="${v('lw')}"></div>
  <button data-a="addlift" style="width:100%">Add set</button>
  ${Lf.length?`<p class="mu" style="margin-top:10px">Total volume: <b>${R(vol)} kg</b></p>`:''}
  ${Lf.map((x,i)=>`<div class="it"><div>${esc(x.n)}<div class="mu">${x.s} × ${x.r} @ ${x.w} kg · best ${best(x.n)} kg</div></div><button class="x" data-a="dellift" data-v="${i}" aria-label="Remove">${ic('close',18)}</button></div>`).join('')}</div>`;
}

/* ---------- Profile ---------- */
function vMe(){
  const p=S.profile||{},c=calc();
  return `<div class="card">
  <input data-k="name" placeholder="Your name" value="${v('name',p.name)}"><div class="row"><input data-k="age" type="number" inputmode="numeric" placeholder="Age" value="${v('age',p.age)}"><select data-k="sex">${opts([['Male','m'],['Female','f']],form.sex??p.sex)}</select></div>
  <div class="row"><input data-k="w" type="number" inputmode="decimal" placeholder="Weight (kg)" value="${v('w',p.w)}"><input data-k="h" type="number" inputmode="decimal" placeholder="Height (cm)" value="${v('h',p.h)}"></div>
  <select data-k="act">${opts(ACTF.map(a=>[a[0],a[1]]),form.act??p.act??1.375)}</select>
  <select data-k="adj">${opts(GOALS,form.adj??p.adj??0)}</select>
  <button data-a="saveP" style="width:100%">Calculate &amp; save</button>${msg?`<p class="err">${esc(msg)}</p>`:''}</div>
  ${c?`<div class="card"><h2>Your numbers</h2><div class="mu">Maintenance calories</div><div class="big">${c.maint} <span class="mu">kcal/day</span></div>
  <p class="mu">Resting (BMR): ${c.bmr} kcal<br>Daily goal: <b style="color:var(--tx)">${c.goal} kcal</b><br>BMI: ${c.bmi.toFixed(1)} (${bmiCat(c.bmi)})</p>
  <p class="note">Mifflin–St Jeor equation × activity level. It’s an estimate: adjust after 2–3 weeks based on your weight trend. Not medical advice.</p></div>`:''}
  <div class="card"><h2>AI meal assistant (optional)</h2><p class="note">Pick a provider and paste its API key. Free keys, no card needed: <b>Gemini</b> at aistudio.google.com/apikey or <b>Groq</b> at console.groq.com/keys. The key is stored only in this browser and sent only to the provider you pick. Free tiers have daily limits and may use your prompts to improve their products, so only type meals.</p>
  <select data-k="provider">${opts(Object.entries(PROV).map(([k,x])=>[x.name,k]),form.provider??provOf())}</select>
  <input data-k="key" type="password" placeholder="API key" value="${v('key',S.cfg.key)}"><input data-k="model" placeholder="Model (leave empty for default)" value="${v('model',S.cfg.model)}"><button class="s" data-a="saveAI" style="width:100%">Save AI settings</button></div>
${'vibrate' in navigator?'':`<div class="card"><h2>Feel</h2><p class="note" style="margin-top:0">Light vibration on taps and saves (iPhone, iOS 17.4 or newer).</p><button class="s" data-a="hap" style="width:100%">Haptic feedback: ${S.cfg.nohap?'Off':'On'}</button></div>`}
  <div class="card"><h2>Your data</h2><p class="note" style="margin-top:0">Everything is stored only on this device. Clearing Safari website data deletes it, so save a copy now and then.</p>
  <div class="pair"><button class="s" data-a="sheets">${ic('sheet',20)}Google Sheets</button><button class="s" data-a="pdf">${ic('pdf',20)}PDF</button></div>
  <div class="pair"><button class="s" data-a="csv">${ic('download',20)}CSV</button><button class="s" style="color:var(--bad)" data-a="wipe">Delete all</button></div>
  <p class="note">Google Sheets copies your diary, then opens a new sheet: tap cell A1 and paste.</p></div>`;
}
function saveP(){
  const w=+(form.w??S.profile?.w),h=+(form.h??S.profile?.h),a=+(form.age??S.profile?.age);
  const sex=form.sex??S.profile?.sex??'m',act=+(form.act??S.profile?.act??1.375),adj=+(form.adj??S.profile?.adj??0);
  if(!(a>0&&w>0&&h>0)){msg='Please fill in age, weight and height.';return render()}
  S.profile={name:(form.name??S.profile?.name??'').trim(),age:a,sex,w,h,act,adj};msg='';
  const last=S.weights[S.weights.length-1];
  if(!last||last.w!==w){S.weights=S.weights.filter(x=>x.d!==TODAY());S.weights.push({d:TODAY(),w})}
  save();form={};render();
}

/* ---------- Export: rows, toast, PDF ---------- */
function exportRows(){
  const r=[['Date','Type','Meal','Item','Amount','kcal (activity = burned, negative)','Protein g','Carbs g','Fat g']];
  [...new Set([...Object.keys(S.diary),...Object.keys(S.acts),...Object.keys(S.water)])].sort().forEach(d=>{
    (S.diary[d]||[]).forEach(e=>r.push([d,'Food',e.meal,e.name,e.g?R(e.g)+' g':'',R(e.k),R(e.p),R(e.c),R(e.f)]));
    (S.acts[d]||[]).forEach(a=>r.push([d,'Activity','',a.name,a.min+' min',-R(a.kcal),'','','']));
    if(S.water[d])r.push([d,'Water','','Water',S.water[d]+' ml','','','','']);
  });
  return r}
let toastT;function toast(t){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';document.body.append(e)}e.textContent=t;e.className='on';clearTimeout(toastT);toastT=setTimeout(()=>e.className='',4200)}
function makePDF(){
  const W=595,H=842,M=40,LH=14,pages=[[]],ink='0.07 0.07 0.07 rg';let y=H-M-4;
  const esc2=t=>String(t).replace(/[^\x20-\x7E\xA0-\xFF]/g,'?').replace(/[\\()]/g,'\\$&');
  const line=(cells,bold,gap)=>{if(y<M+LH+(gap||0)){pages.push([]);y=H-M-4}y-=LH+(gap||0);const p=pages[pages.length-1];
    cells.forEach(([x,t])=>p.push(`BT /${bold?'F2':'F1'} ${bold?10.5:9.5} Tf ${ink} ${x} ${y} Td (${esc2(t)}) Tj ET`));return p};
  const rule=()=>pages[pages.length-1].push(`0.85 0.85 0.87 RG 0.6 w ${M} ${y-4} m ${W-M} ${y-4} l S`);
  const c=calc(),fmt=d=>new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
  line([[M,'SPOON diary']],true);pages[0].push(`BT /F2 20 Tf ${ink} ${M} ${H-M-8} Td (SPOON diary) Tj ET`);pages[0].shift();y-=10;
  line([[M,'Saved '+new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})+(c?'   |   Daily goal '+c.goal+' kcal':'')]]);
  const days=[...new Set([...Object.keys(S.diary),...Object.keys(S.acts),...Object.keys(S.water)])].sort().reverse();
  if(!days.length)line([[M,'Nothing logged yet.']],false,10);
  days.forEach(d=>{const L=S.diary[d]||[],A=S.acts[d]||[],t=sum(L);
    line([[M,fmt(d)],[270,R(t.k)+' kcal'],[350,'P '+R(t.p)+'  C '+R(t.c)+'  F '+R(t.f)]],true,12);rule();
    L.forEach(e=>line([[M+6,e.meal],[M+70,String(e.name).slice(0,40)],[360,e.g?R(e.g)+' g':''],[405,R(e.k)+' kcal'],[465,'P '+R(e.p)],[500,'C '+R(e.c)],[532,'F '+R(e.f)]]));
    A.forEach(a=>line([[M+6,'Activity'],[M+70,a.name+', '+a.min+' min'],[405,'-'+R(a.kcal)+' kcal']]));
    if(S.water[d])line([[M+6,'Water'],[M+70,S.water[d]+' ml']]);
  });
  const o=['','','<</Type/Font/Subtype/Type1/BaseFont/Helvetica/Encoding/WinAnsiEncoding>>','<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold/Encoding/WinAnsiEncoding>>'],kids=[];
  pages.forEach(ops=>{const st=ops.join('\n'),ci=o.push(`<</Length ${st.length}>>\nstream\n${st}\nendstream`),pi=o.push(`<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</Font<</F1 3 0 R/F2 4 0 R>>>>/Contents ${ci} 0 R>>`);kids.push(pi+' 0 R')});
  o[0]='<</Type/Catalog/Pages 2 0 R>>';o[1]=`<</Type/Pages/Kids[${kids.join(' ')}]/Count ${kids.length}>>`;
  let out='%PDF-1.4\n';const off=[];o.forEach((b,i)=>{off.push(out.length);out+=`${i+1} 0 obj\n${b}\nendobj\n`});
  const x=out.length;out+=`xref\n0 ${o.length+1}\n0000000000 65535 f \n`+off.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<</Size ${o.length+1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF`;
  return new Blob([Uint8Array.from(out,ch=>ch.charCodeAt(0)&255)],{type:'application/pdf'});
}

/* ---------- Actions ---------- */
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()}
function act(a,val){
  const L=S.diary[cur]=S.diary[cur]||[];
  switch(a){
    case'tab':if(tab!==val)anim=true;tab=val;form={};msg='';break;
    case'day':{const d=new Date(cur+'T00:00:00');d.setDate(d.getDate()+ +val);cur=dk(d>new Date()?new Date():d);break}
    case'week':{anim=true;const d=new Date(cur+'T00:00:00');d.setDate(d.getDate()+ +val);cur=dk(d>new Date()?new Date():d);break}
    case'setday':if(cur!==val)anim=true;cur=val;break;
    case'fab':tab='today';sheet={meal:autoMeal(),mode:'search'};res=[];pick=null;form={};break;
    case'water':S.water[cur]=Math.max(0,(S.water[cur]||0)+ +val);save();break;
    case'add':sheet={meal:val,mode:'search'};res=[];pick=null;form={};break;
    case'close':stopScan();if(sheet&&$('#sheet .sh')){$('#sheet').classList.add('out');setTimeout(()=>{sheet=null;form={};render()},200);return}sheet=null;form={};break;
    case'mode':stopScan();sheet.scan=false;sheet.mode=val;sheet.err='';break;
    case'scan':sheet.scan=true;sheet.err='';render();startScan();return;
    case'stopscan':stopScan();sheet.scan=false;break;
    case'photo':$('#pic').click();return;
    case'askai':{const q=(form.q||'').trim();if(q)form.t=q;sheet.mode='ai';sheet.err='';if(q&&S.cfg.key)return ai();break}
    case'rmphoto':sheet.img='';break;
    case'search':return search();
    case'pick':pick=res[+val];form.g=100;break;
    case'addpick':{const g=+form.g||100,p=pick;return pushFood([{meal:sheet.meal,name:p.name,g,k:p.k*g/100,p:p.p*g/100,c:p.c*g/100,f:p.f*g/100}])}
    case'readd':return pushFood([{...S.recent[+val],meal:sheet.meal,t:''}]);
    case'quick':if(!form.qn||!(+form.qk>=0)||form.qk==='')return;return pushFood([{meal:sheet.meal,name:form.qn,k:+form.qk,p:+form.qp||0,c:+form.qc||0,f:+form.qf||0}]);
    case'ai':return ai();
    case'delf':L.splice(+val,1);save();break;
    case'addact':{const m=+form.am;if(!(m>0))return;const e=ACT.find(x=>x[0]===(form.an||ACT[0][0]));
      const k=+form.ak||e[1]*(S.profile?.w||70)*m/60;(S.acts[cur]=S.acts[cur]||[]).push({name:e[0],min:m,kcal:k,t:nowT()});form={};save();break}
    case'delact':S.acts[cur].splice(+val,1);save();break;
    case'addlift':{const s=+form.ls,r=+form.lr,w=+form.lw||0;if(!form.ln||!(s>0&&r>0))return;(S.lifts[cur]=S.lifts[cur]||[]).push({n:form.ln.trim(),s,r,w});form={};save();break}
    case'dellift':S.lifts[cur].splice(+val,1);save();break;
    case'saveP':return saveP();
    case'saveAI':S.cfg={...S.cfg,key:(form.key??S.cfg.key).trim(),provider:form.provider||provOf(),model:(form.model??S.cfg.model??'').trim()};save();form={};msg='';break;
    case'csv':dl('spoon-diary.csv',exportRows().map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');return;
    case'sheets':{const tsv=exportRows().map(r=>r.map(c=>String(c).replace(/[\t\r\n]+/g,' ')).join('\t')).join('\n');
      const fb=()=>{dl('spoon-diary.csv',exportRows().map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'),'text/csv');toast('Copy not allowed here. Saved a CSV: in Google Sheets use File → Import.')};
      try{navigator.clipboard.writeText(tsv).then(()=>toast('Copied. Tap cell A1 in the new sheet and paste.'),fb)}catch(e){fb();return}
      window.open('https://sheets.new','_blank','noopener');return}
    case'pdf':dl('spoon-diary.pdf',makePDF(),'application/pdf');return;
    case'wipe':if(confirm('Delete ALL data on this device? This cannot be undone.')){S=DEF();save();form={}}break;
  }
  render();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;const a=t.dataset.a;haptic(['delf','delact','dellift','wipe'].includes(a)?'warn':'tick');act(a,t.dataset.v)});
document.addEventListener('input',e=>{if(e.target.dataset.k)form[e.target.dataset.k]=e.target.value});
document.addEventListener('change',e=>{if(e.target.tagName==='SELECT'&&e.target.dataset.k)form[e.target.dataset.k]=e.target.value});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.enter)act(e.target.dataset.enter)});
render();
addEventListener('scroll',()=>$('#bar').classList.toggle('sc',scrollY>4),{passive:true});
