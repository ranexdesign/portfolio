'use strict';
/* SPOON food database: local-first search.
   Order of lookup: your own foods -> bundled generic foods -> foods you've fetched before (IndexedDB cache)
   -> optional downloaded packs -> Open Food Facts online (only as a background top-up).
   Item shape (per 100 g): {id,name,brand,code,k,p,c,f,sv:[{n,g}],src} */
const FoodDB=(()=>{
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9Ѐ-ӿ֐-ۿऀ-෿぀-ヿ一-鿿가-힯]+/g,' ').trim();
  /* ---- IndexedDB (falls back to memory if blocked) ---- */
  let dbp;const mem={kv:new Map(),cache:new Map()};
  const open=()=>dbp||(dbp=new Promise((ok,no)=>{try{const r=indexedDB.open('spoon-db',1);r.onupgradeneeded=()=>{r.result.createObjectStore('kv');r.result.createObjectStore('cache')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)}catch(e){no(e)}}));
  const idb=async(st,mode,fn)=>{try{const d=await open();return await new Promise((ok,no)=>{const t=d.transaction(st,mode),rq=fn(t.objectStore(st));t.oncomplete=()=>ok(rq&&rq.result);t.onerror=t.onabort=()=>no(t.error)})}catch(e){return undefined}};
  const kvGet=async k=>(await idb('kv','readonly',s=>s.get(k)))??mem.kv.get(k);
  const kvSet=async(k,v)=>{mem.kv.set(k,v);await idb('kv','readwrite',s=>s.put(v,k))};
  const kvDel=async k=>{mem.kv.delete(k);await idb('kv','readwrite',s=>s.delete(k))};

  /* ---- in-memory indexes ---- */
  const src={gen:[],mine:[],cache:[],pack:[]};            // arrays of {it,s}
  const byCode=new Map();                                  // code -> item (cache + packs + mine)
  const mk=(it)=>({it,s:' '+norm(it.name+' '+(it.brand||'')+' '+(it.al||''))+' '});
  const codeKey=c=>String(c).replace(/\D/g,'');
  const variants=c=>{c=codeKey(c);const v=[c];if(c.length===12)v.push('0'+c);if(c.length===13&&c[0]==='0')v.push(c.slice(1));return v};

  const load=async()=>{
    try{let r=await fetch('data/foods.json');if(!r.ok)r=await fetch('foods.json');const a=await r.json();src.gen=a.map((x,i)=>mk({...x,id:'g'+i,src:'gen'}))}catch(e){}
    const c=await idb('cache','readonly',s=>s.getAll());
    (c||[]).forEach(it=>addCache(it,false));
    const meta=await kvGet('packs')||{};
    for(const id of Object.keys(meta)){const rows=await kvGet('pack:'+id);if(rows)addPack(id,rows)}
  };
  const addCache=(it,persist=true)=>{
    if(!it.code||byCode.has(it.code)&&byCode.get(it.code).src==='mine')return;
    it={...it,src:'cache'};byCode.set(it.code,it);
    const i=src.cache.findIndex(x=>x.it.code===it.code);const e=mk(it);i<0?src.cache.push(e):src.cache[i]=e;
    if(persist){mem.cache.set(it.code,it);idb('cache','readwrite',s=>s.put(it,it.code))}
  };
  /* packs: rows [code,name,brand,k,p,c,f,servingG] */
  const packItem=r=>({id:'p'+r[0],code:r[0],name:r[1],brand:r[2]||'',k:r[3],p:r[4],c:r[5],f:r[6],sv:r[7]?[{n:'1 serving',g:r[7]}]:[],src:'pack'});
  const addPack=(id,rows)=>{src.pack=src.pack.filter(x=>x.pid!==id);const its=rows.map(r=>{const it=packItem(r);byCode.set(it.code,byCode.get(it.code)||it);return{...mk(it),pid:id}});src.pack.push(...its)};
  const setMine=list=>{src.mine=list.map(x=>mk({...x,src:'mine'}));list.forEach(x=>x.code&&byCode.set(codeKey(x.code),{...x,code:codeKey(x.code),src:'mine'}))};

  /* ---- search ---- */
  const W={mine:40,gen:25,cache:10,pack:0};
  function local(q,limit=30){
    const n=norm(q);if(!n)return[];const T=n.split(' '),out=[];
    for(const k of ['mine','gen','cache','pack'])for(const e of src[k]){
      let sc=0;
      for(const t of T){
        if(e.s.includes(' '+t+' '))sc+=12;else if(e.s.includes(' '+t))sc+=8;else if(t.length>=3&&e.s.includes(t))sc+=3;else{sc=-1;break}
      }
      if(sc<0)continue;
      if(e.s.startsWith(' '+n))sc+=20;
      sc+=W[k]-e.it.name.length*.15;
      out.push([sc,e.it])}
    out.sort((a,b)=>b[0]-a[0]);const seen=new Set(),r=[];
    for(const [,it] of out){const key=it.code||norm(it.name)+'|'+norm(it.brand);if(seen.has(key))continue;seen.add(key);r.push(it);if(r.length>=limit)break}
    return r}
  const localCode=c=>{for(const v of variants(c)){const it=byCode.get(v);if(it)return it}return null};

  /* ---- network: timeout + retry + abort ---- */
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  async function getJSON(url,{signal,timeout=7000,retries=2}={}){
    let last;
    for(let a=0;a<=retries;a++){
      if(signal?.aborted)throw new DOMException('aborted','AbortError');
      const ac=new AbortController(),t=setTimeout(()=>ac.abort(),timeout),onAbort=()=>ac.abort();
      signal?.addEventListener('abort',onAbort);
      try{
        const r=await fetch(url,{signal:ac.signal,headers:{accept:'application/json'}});
        if(r.status===404)return null;
        if(r.status===429||r.status>=500){last=new Error('HTTP '+r.status);}
        else if(!r.ok)throw Object.assign(new Error('HTTP '+r.status),{fatal:true});
        else return await r.json();
      }catch(e){if(signal?.aborted)throw new DOMException('aborted','AbortError');if(e.fatal)throw e;last=e}
      finally{clearTimeout(t);signal?.removeEventListener('abort',onAbort)}
      if(a<retries)await sleep(500*2**a+Math.random()*250);
    }
    throw last||new Error('network');
  }
  /* Open Food Facts product -> item. Accepts kcal or kJ. */
  function fromOFF(p){
    const n=p.nutriments||{};let k=n['energy-kcal_100g'];
    if(k==null&&n.energy_100g!=null)k=n.energy_100g/4.184;
    if(!p.product_name||k==null||isNaN(+k))return null;
    const sg=+p.serving_quantity||0;
    return{id:'o'+p.code,code:codeKey(p.code||''),name:String(p.product_name).trim(),brand:String(p.brands||'').split(',')[0].trim(),k:+k||0,p:+n.proteins_100g||0,c:+n.carbohydrates_100g||0,f:+n.fat_100g||0,sv:sg>0?[{n:'1 serving'+(p.serving_size?' ('+p.serving_size+')':''),g:sg}]:[],src:'cache'}}
  const FIELDS='code,product_name,brands,nutriments,serving_quantity,serving_size';
  async function online(q,signal){
    const j=await getJSON(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=24&fields=${FIELDS}`,{signal,retries:1});
    const hits=(j&&(j.hits||j.products))||[];
    const r=hits.map(fromOFF).filter(Boolean);r.forEach(it=>it.code&&addCache(it));return r}
  async function lookup(code,signal){
    const l=localCode(code);if(l)return l;
    for(const v of variants(code)){
      const j=await getJSON(`https://world.openfoodfacts.org/api/v2/product/${v}.json?fields=${FIELDS}`,{signal,retries:2});
      const it=j&&j.status!==0&&j.product?fromOFF({...j.product,code:j.product.code||v}):null;
      if(it){addCache(it);return it}
    }
    return null}

  /* ---- downloadable packs (built daily by tools/build-packs.mjs) ---- */
  async function manifest(){return getJSON('data/packs.json?'+Math.floor(Date.now()/36e5),{retries:1,timeout:5000})}
  async function installedPacks(){return await kvGet('packs')||{}}
  async function installPack(p,onProgress){
    const rows=await getJSON(`data/packs/${p.id}.json?v=${p.v}`,{timeout:60000,retries:2});
    if(!Array.isArray(rows))throw new Error('Bad pack');
    await kvSet('pack:'+p.id,rows);const m=await installedPacks();m[p.id]={v:p.v,n:rows.length,at:Date.now()};await kvSet('packs',m);
    addPack(p.id,rows);onProgress&&onProgress(rows.length);return rows.length}
  async function removePack(id){await kvDel('pack:'+id);const m=await installedPacks();delete m[id];await kvSet('packs',m);src.pack=src.pack.filter(x=>x.pid!==id)}
  async function refreshPacks(){ // daily auto-update of installed packs
    const m=await installedPacks(),ids=Object.keys(m);if(!ids.length)return 0;
    const mf=await manifest();let n=0;
    for(const p of (mf&&mf.packs)||[])if(m[p.id]&&m[p.id].v!==p.v){await installPack(p);n++}
    return n}
  const stats=()=>({generic:src.gen.length,mine:src.mine.length,cached:src.cache.length,packed:src.pack.length});
  return{norm,load,local,localCode,lookup,online,setMine,addCache,manifest,installedPacks,installPack,removePack,refreshPacks,stats,variants};
})();
