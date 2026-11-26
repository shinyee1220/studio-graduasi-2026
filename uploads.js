const opened = new Promise((resolve,reject)=>{
  const r=indexedDB.open('yue-min-graduasi-2026',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});
  r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
});
opened.catch(()=>{});
async function use(mode,fn){
  const db=await opened;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('photos',mode),r=fn(tx.objectStore('photos'));
    tx.oncomplete=()=>resolve(r.result);
    tx.onabort=tx.onerror=()=>reject(tx.error);
  });
}
const status=document.querySelector('#queueStatus');
let working=false,version=0;
export async function queue(name,blob){
  await use('readwrite',s=>s.add({id:crypto.randomUUID(),name,blob}));
  version++; flush();
}
function base64(blob){return new Promise((resolve,reject)=>{
  const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);
  reader.onerror=reject;reader.readAsDataURL(blob);
});}
export async function flush(){
  if(working)return;
  working=true;const initial=version;
  try{
    let sent=false;
    for(;;){
      const cur=await use('readonly',s=>s.openCursor());
      if(!cur){if(sent)status.textContent='Foto disimpan dalam album sekolah.';break;}
      const photo=cur.value;
      if(!window.DRIVE_URL || !navigator.onLine){
        status.textContent=window.DRIVE_URL?'Menunggu internet. Foto disimpan pada peranti ini.':'Menunggu sambungan album sekolah. Foto disimpan pada peranti ini.';break;
      }
      status.textContent='Sedang menyimpan foto ke album sekolah…';
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
      try{
        const res=await fetch(window.DRIVE_URL,{method:'POST',credentials:'omit',signal:controller.signal,
          headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify({id:photo.id,name:photo.name,type:'image/jpeg',data:await base64(photo.blob)})});
        const ack=await res.json();
        if(!res.ok||!ack.ok||ack.id!==photo.id)throw Error();
        await use('readwrite',s=>s.delete(photo.id));sent=true;
      }finally{clearTimeout(timer);}
    }
  }catch{status.textContent='Menunggu untuk mencuba lagi. Buka semula aplikasi apabila ada internet.';}
  finally{working=false;if(initial!==version)flush();}
}
addEventListener('online',flush);addEventListener('pageshow',flush);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush()});
setInterval(flush,30000);
