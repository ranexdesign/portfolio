'use strict';
/* SPOON – private calorie & training tracker. All data stays in this browser (localStorage). */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const K='fitlog-v1',R=x=>Math.round(+x||0);
const DEF=()=>({profile:null,diary:{},acts:{},lifts:{},water:{},weights:[],recent:[],cfg:{key:'',model:'claude-haiku-5-5'}});
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
const P={flame:'M12 2c.5 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2 1-3.5 2.5-4.5.2 1.8.9 2.8 2 3 0-4-.5-6 .5-9z',home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',chart:'M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z',dumb:'M2 9h2v6H2zM4 7h2v10H4zM18 7h2v10h-2zM20 9h2v6h-2zM6 11h12v2H6z',user:'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-8 9c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5z',plus:'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',drum:'M15.5 3a5.5 5.5 0 0 0-4.6 8.5L4 18.4 5.6 20l1.2-1.2 1.2 1.2 1.4-1.4-1.2-1.2 3.700-3.700A5.500 5.500 0 1 0 15.500 3z',leaf:'M5 19C5 10 10 5 19 5c0 9-5 14-14 14z',drop:'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',timer:'M9 2h6v2H9zm3 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm1 3v5h-2V9z'};
const ic=(n,s=20,c='currentColor')=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}"><path fill-rule="evenodd" d="${P[n]}"/></svg>`;
const ring=(pct,s,w,col,inner)=>{const r=(s-w)/2,C=2*Math.PI*r;return `<div class="rg" style="width:${s}px;height:${s}px"><svg width="${s}" height="${s}" style="transform:rotate(-90deg)"><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${w}"/><circle cx="${s/2}" cy="${s/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-Math.min(1,Math.max(0,pct||0)))}"/></svg><div class="in">${inner}</div></div>`};
const autoMeal=()=>{const h=new Date().getHours();return h<11?'Breakfast':h<16?'Lunch':h<20?'Dinner':'Snack'};

function render(){
  const nb=(k,i,l)=>`<button class="${tab===k?'on':''}" data-a="tab" data-v="${k}">${ic(i,24)}${l}</button>`;
  $('#nav').innerHTML=nb('today','home','Home')+nb('trends','chart','Progress')+`<button class="fab" data-a="fab" aria-label="Add food">${ic('plus',30)}</button>`+nb('train','dumb','Train')+nb('me','user','Profile');
  $('#app').innerHTML={today:vToday,trends:vTrends,train:vTrain,me:vMe}[tab]();
  $('#sheet').innerHTML=sheet?vSheet():'';
}
function weekDays(){const d=new Date(cur+'T00:00:00');d.setDate(d.getDate()-d.getDay());return [...Array(7)].map((_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x})}
function strip(){
  const d=new Date(cur+'T00:00:00'),td=TODAY();
  return `<div class="card wk"><div class="wkh"><b>${d.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b><span><button class="rb" data-a="week" data-v="-7">‹</button><button class="rb" data-a="week" data-v="7">›</button></span></div><div class="days">${weekDays().map(x=>{const k=dk(x),has=(S.diary[k]||[]).length>0;return `<button class="dy ${k===cur?'on':''}" data-a="setday" data-v="${k}" ${k>td?'disabled':''}><small>${x.toLocaleDateString(undefined,{weekday:'narrow'})}</small><b>${x.getDate()}</b>${has?'<i></i>':''}</button>`}).join('')}</div></div>`}

/* ---------- Today ---------- */
function vToday(){
  const c=calc(),L=S.diary[cur]||[],A=S.acts[cur]||[],t=sum(L),burn=A.reduce((a,x)=>a+x.kcal,0);
  const goal=c?c.goal+burn:0,left=goal-t.k,w=S.water[cur]||0,wg=S.profile?Math.round(S.profile.w*35/250)*250:2000;
  const logged=weekDays().filter(x=>(S.diary[dk(x)]||[]).length).length,hr=new Date().getHours();
  const nm=S.profile?.name||'';
  const mc=(n,x,tg,col,i)=>{const l=tg-x;return `<div class="card mc"><b>${tg?R(Math.abs(l)):R(x)}g</b><span class="mu">${n} ${tg?(l<0?'over':'left'):'eaten'}</span>${ring(tg?x/tg:0,84,9,col,ic(i,22,col))}</div>`};
  const rows=[...L.map((e,i)=>({e,i,f:1})),...A.map((e,i)=>({e,i,f:0}))].sort((a,b)=>(b.e.t||'').localeCompare(a.e.t||''));
  return `<div class="top"><img class="logo" src="logo.png" alt="SPOON"><div class="av">${esc((nm[0]||'S').toUpperCase())}</div></div><div class="gr"><span class="mu">${hr<12?'Good morning':hr<17?'Good afternoon':'Good evening'}</span><b>${esc(nm||'Welcome')}</b></div>${strip()}
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
  const m=sheet.mode;let b='';
  const tabs=[['search','Search'],['quick','Quick add'],['ai','AI']].map(([k,l])=>`<button class="${m===k?'on':''}" data-a="mode" data-v="${k}">${l}</button>`).join('');
  if(m==='search'){
    b=`<div class="row"><input data-k="q" data-enter="search" placeholder="Food name or barcode number" value="${v('q')}"><button data-a="search">Go</button></div>
    <p class="note">Packaged foods come from Open Food Facts. For home-cooked meals use Quick add or AI.</p>`;
    if(sheet.busy)b+='<p class="mu">Searching…</p>';
    if(sheet.err)b+=`<p class="err">${esc(sheet.err)}</p>`;
    if(pick){const p=pick;b+=`<div class="card"><b>${esc(p.name)}</b><div class="mu">Per 100 g: ${R(p.k)} kcal · P ${R(p.p)} · C ${R(p.c)} · F ${R(p.f)}</div><div class="row" style="margin-top:8px"><input data-k="g" type="number" inputmode="decimal" placeholder="Grams" value="${v('g',100)}"><button data-a="addpick">Add</button></div></div>`}
    else if(res.length)b+=res.map((p,i)=>`<div class="it" data-a="pick" data-v="${i}"><div>${esc(p.name)}<div class="mu">${R(p.k)} kcal / 100 g</div></div><span class="g">›</span></div>`).join('');
    else if(S.recent.length)b+=`<h2>Recent</h2>`+S.recent.map((e,i)=>`<div class="it"><div>${esc(e.name)}<div class="mu">${R(e.k)} kcal</div></div><button class="g" data-a="readd" data-v="${i}">＋</button></div>`).join('');
  }else if(m==='quick'){
    b=`<input data-k="qn" placeholder="What did you eat?" value="${v('qn')}"><div class="row"><input data-k="qk" type="number" inputmode="decimal" placeholder="kcal" value="${v('qk')}"><input data-k="qp" type="number" inputmode="decimal" placeholder="Protein g" value="${v('qp')}"></div><div class="row"><input data-k="qc" type="number" inputmode="decimal" placeholder="Carbs g" value="${v('qc')}"><input data-k="qf" type="number" inputmode="decimal" placeholder="Fat g" value="${v('qf')}"></div><button data-a="quick" style="width:100%">Add</button>`;
  }else{
    b=S.cfg.key?`<textarea data-k="t" rows="3" placeholder="e.g. 2 rotis, dal, a bowl of rice and a banana">${v('t')}</textarea><button data-a="ai" style="width:100%" ${sheet.busy?'disabled':''}>${sheet.busy?'Estimating…':'Estimate &amp; add'}</button><p class="note">AI estimates are approximate. Check and delete entries that look off.</p>${sheet.err?`<p class="err">${esc(sheet.err)}</p>`:''}`
      :`<p class="mu">Describe a meal in plain words and Claude estimates calories and macros. Add your own Anthropic API key in Profile → AI meal assistant to turn this on.</p>`;
  }
  return `<div class="sh"><div class="hd"><b>Add to ${sheet.meal}</b><button class="g" data-a="close">Close</button></div><div class="tabs">${tabs}</div>${b}</div>`;
}
const pushFood=(items)=>{const L=S.diary[cur]=S.diary[cur]||[];items.forEach(e=>{e.t=e.t||nowT();L.push(e);S.recent=[e,...S.recent.filter(r=>r.name!==e.name)].slice(0,15)});save();sheet=null;form={};render()};
async function search(){
  const q=(form.q||'').trim();if(!q)return;sheet.busy=true;sheet.err='';res=[];pick=null;render();
  try{
    const f='product_name,brands,nutriments,code';let ps;
    if(/^\d{8,14}$/.test(q)){const j=await(await fetch(`https://world.openfoodfacts.org/api/v2/product/${q}.json?fields=${f}`)).json();ps=j.product?[j.product]:[]}
    else{const j=await(await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${f}`)).json();ps=j.products||[]}
    res=ps.filter(p=>p.product_name&&p.nutriments&&p.nutriments['energy-kcal_100g']!=null).map(p=>({name:p.product_name+(p.brands?' · '+p.brands.split(',')[0]:''),k:+p.nutriments['energy-kcal_100g']||0,p:+p.nutriments.proteins_100g||0,c:+p.nutriments.carbohydrates_100g||0,f:+p.nutriments.fat_100g||0}));
    if(!res.length)sheet.err='No results. Try another word, Quick add, or AI.';
  }catch(e){sheet.err='Search failed. Check your connection.'}
  sheet.busy=false;render();
}
async function ai(){
  const t=(form.t||'').trim();if(!t)return;sheet.busy=true;sheet.err='';render();
  const P='You are a nutrition expert. Estimate calories and macros for each food in this meal using typical portions (assume common Indian home or restaurant portions when unclear). Reply with ONLY JSON, no other text: {"items":[{"name":string,"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}. Meal: ';
  try{
    const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':S.cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:S.cfg.model||'claude-haiku-5-5',max_tokens:800,messages:[{role:'user',content:P+t}]})});
    const j=await r.json();if(!r.ok)throw new Error(j.error?.message||r.status);
    const items=JSON.parse(j.content.map(x=>x.text||'').join('').replace(/```json|```/g,'').trim()).items;
    if(!items?.length)throw new Error('No foods found');
    pushFood(items.map(i=>({meal:sheet.meal,name:String(i.name||t),k:+i.kcal||0,p:+i.protein_g||0,c:+i.carbs_g||0,f:+i.fat_g||0})));
  }catch(e){sheet.busy=false;sheet.err='AI failed: '+e.message;render()}
}

/* ---------- Trends ---------- */
function vTrends(){
  const c=calc(),goal=c?c.goal:2000,days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return dk(d)});
  const D=days.map(d=>sum(S.diary[d]||[])),mx=Math.max(goal*1.15,...D.map(x=>x.k)),H=162,B=172;
  const bars=D.map((x,i)=>{const X=i*44+10,hg=goal/mx*H,hk=x.k/mx*H,isT=i===6,wd=new Date(days[i]+'T00:00:00').toLocaleDateString(undefined,{weekday:'short'});
    return `<rect x="${X}" y="${B-hg}" width="16" height="${hg}" rx="6" fill="url(#ht)"/><rect x="${X+10}" y="${B-hk}" width="16" height="${Math.max(hk,0)}" rx="6" fill="${isT?'var(--lime-d)':'var(--lime)'}" opacity="${x.k?1:0}"/>${x.k?`<text x="${X+18}" y="${B-Math.max(hk,hg)-6}" text-anchor="middle">${R(x.k/goal*100)}%</text>`:''}<text x="${X+18}" y="188" text-anchor="middle">${wd}</text>`}).join('');
  const W=S.weights,lw=W[W.length-1],pw=W[W.length-2],mins=days.map(d=>(S.acts[d]||[]).reduce((a,x)=>a+x.min,0)),tm=mins.reduce((a,x)=>a+x,0),mm=Math.max(...mins,1);
  const lg=D.filter(x=>x.k>0),avg=lg.length?R(lg.reduce((a,x)=>a+x.k,0)/lg.length):0,wt=S.water[TODAY()]||0,wg=S.profile?Math.round(S.profile.w*35/250)*250:2000;
  return `<h1 style="text-align:center;font-size:20px">Statistics</h1>
  <div class="card stat"><div class="mu">Calories today</div><span class="tg">Target: <b>${c?goal:'–'} kcal</b></span><div class="big">${R(D[6].k)} <small class="mu" style="font-size:20px;font-weight:500">kcal</small></div>
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
  return `<h1>Training</h1>${strip()}
  <div class="card"><h2>Cardio / activity</h2>
  <select data-k="an">${opts(ACT.map(a=>[a[0],a[0]]),form.an)}</select>
  <div class="row"><input data-k="am" type="number" inputmode="numeric" placeholder="Minutes" value="${v('am')}"><input data-k="ak" type="number" inputmode="numeric" placeholder="kcal (optional)" value="${v('ak')}"></div>
  <button data-a="addact" style="width:100%">Log activity</button><p class="note">Burn is estimated from MET values and your weight. Exercise calories are added to your day’s target.</p>
  ${A.map((a,i)=>`<div class="it"><div>${esc(a.name)}<div class="mu">${a.min} min</div></div><span class="k">−${R(a.kcal)}</span><button class="x" data-a="delact" data-v="${i}">✕</button></div>`).join('')}</div>
  <div class="card"><h2>Lifting log</h2>
  <input data-k="ln" placeholder="Exercise (e.g. Bench press)" value="${v('ln')}">
  <div class="row"><input data-k="ls" type="number" inputmode="numeric" placeholder="Sets" value="${v('ls')}"><input data-k="lr" type="number" inputmode="numeric" placeholder="Reps" value="${v('lr')}"><input data-k="lw" type="number" inputmode="decimal" placeholder="Kg" value="${v('lw')}"></div>
  <button data-a="addlift" style="width:100%">Add set</button>
  ${Lf.length?`<p class="mu" style="margin-top:10px">Total volume: <b>${R(vol)} kg</b></p>`:''}
  ${Lf.map((x,i)=>`<div class="it"><div>${esc(x.n)}<div class="mu">${x.s} × ${x.r} @ ${x.w} kg · best ${best(x.n)} kg</div></div><button class="x" data-a="dellift" data-v="${i}">✕</button></div>`).join('')}</div>`;
}

/* ---------- Profile ---------- */
function vMe(){
  const p=S.profile||{},c=calc();
  return `<h1>Profile</h1><div class="card">
  <input data-k="name" placeholder="Your name" value="${v('name',p.name)}"><div class="row"><input data-k="age" type="number" inputmode="numeric" placeholder="Age" value="${v('age',p.age)}"><select data-k="sex">${opts([['Male','m'],['Female','f']],form.sex??p.sex)}</select></div>
  <div class="row"><input data-k="w" type="number" inputmode="decimal" placeholder="Weight (kg)" value="${v('w',p.w)}"><input data-k="h" type="number" inputmode="decimal" placeholder="Height (cm)" value="${v('h',p.h)}"></div>
  <select data-k="act">${opts(ACTF.map(a=>[a[0],a[1]]),form.act??p.act??1.375)}</select>
  <select data-k="adj">${opts(GOALS,form.adj??p.adj??0)}</select>
  <button data-a="saveP" style="width:100%">Calculate &amp; save</button>${msg?`<p class="err">${esc(msg)}</p>`:''}</div>
  ${c?`<div class="card"><h2>Your numbers</h2><div class="mu">Maintenance calories</div><div class="big">${c.maint} <span class="mu">kcal/day</span></div>
  <p class="mu">Resting (BMR): ${c.bmr} kcal<br>Daily goal: <b style="color:var(--tx)">${c.goal} kcal</b><br>BMI: ${c.bmi.toFixed(1)} (${bmiCat(c.bmi)})</p>
  <p class="note">Mifflin–St Jeor equation × activity level. It’s an estimate: adjust after 2–3 weeks based on your weight trend. Not medical advice.</p></div>`:''}
  <div class="card"><h2>AI meal assistant (optional)</h2><p class="note">Paste your own Anthropic API key to describe meals in plain words. The key is stored only in this browser and sent only to api.anthropic.com. Anyone with access to your phone could read it, so use a key with a low spend limit.</p>
  <input data-k="key" type="password" placeholder="sk-ant-…" value="${v('key',S.cfg.key)}"><input data-k="model" placeholder="Model" value="${v('model',S.cfg.model)}"><button class="s" data-a="saveAI" style="width:100%">Save AI settings</button></div>
  <div class="card"><h2>Your data</h2><p class="note">Everything is stored locally on this device. Clearing Safari website data deletes it, so export a backup now and then.</p>
  <div class="row"><button class="s" data-a="export">Export JSON</button><button class="s" data-a="csv">Export CSV</button></div><div class="row" style="margin-top:8px"><button class="s" data-a="import">Import JSON</button><button class="s" style="color:var(--bad)" data-a="wipe">Delete all</button></div></div>
  <p class="note" style="text-align:center">Food data: Open Food Facts (ODbL). Inspired by OpenNutriTracker.</p>`;
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

/* ---------- Actions ---------- */
function dl(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove()}
function act(a,val){
  const L=S.diary[cur]=S.diary[cur]||[];
  switch(a){
    case'tab':tab=val;form={};msg='';break;
    case'day':{const d=new Date(cur+'T00:00:00');d.setDate(d.getDate()+ +val);cur=dk(d>new Date()?new Date():d);break}
    case'week':{const d=new Date(cur+'T00:00:00');d.setDate(d.getDate()+ +val);cur=dk(d>new Date()?new Date():d);break}
    case'setday':cur=val;break;
    case'fab':tab='today';sheet={meal:autoMeal(),mode:'search'};res=[];pick=null;form={};break;
    case'water':S.water[cur]=Math.max(0,(S.water[cur]||0)+ +val);save();break;
    case'add':sheet={meal:val,mode:'search'};res=[];pick=null;form={};break;
    case'close':sheet=null;form={};break;
    case'mode':sheet.mode=val;sheet.err='';break;
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
    case'saveAI':S.cfg={key:(form.key??S.cfg.key).trim(),model:(form.model||S.cfg.model||'claude-haiku-5-5').trim()};save();form={};msg='';break;
    case'export':dl('spoon-backup-'+TODAY()+'.json',JSON.stringify(S,null,1),'application/json');return;
    case'csv':{const rows=['date,meal,name,grams,kcal,protein,carbs,fat'];Object.entries(S.diary).sort().forEach(([d,l])=>l.forEach(e=>rows.push([d,e.meal,'"'+String(e.name).replace(/"/g,'""')+'"',R(e.g),R(e.k),R(e.p),R(e.c),R(e.f)].join(','))));dl('spoon-diary.csv',rows.join('\n'),'text/csv');return}
    case'import':$('#imp').click();return;
    case'wipe':if(confirm('Delete ALL data on this device? This cannot be undone.')){S=DEF();save();form={}}break;
  }
  render();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t)act(t.dataset.a,t.dataset.v)});
document.addEventListener('input',e=>{if(e.target.dataset.k)form[e.target.dataset.k]=e.target.value});
document.addEventListener('change',e=>{if(e.target.tagName==='SELECT'&&e.target.dataset.k)form[e.target.dataset.k]=e.target.value});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset.enter)act(e.target.dataset.enter)});
$('#imp').addEventListener('change',async e=>{try{S=Object.assign(DEF(),JSON.parse(await e.target.files[0].text()));save();render();alert('Imported.')}catch(x){alert('That file is not a valid SPOON backup.')}e.target.value=''});
render();
