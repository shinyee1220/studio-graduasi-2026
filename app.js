import {windows} from './windows.js';
import {queue,flush} from './uploads.js';
const $=id=>document.getElementById(id),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{alpha:false}),video=$('feed');
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
let colour='biru',ori='potret',facing='user',stream=null,still=null,frame=null,raf=0,epoch=0,mode='home',timer=false,blob=null,fileName='',resultURL='',installEvent;
try{if(localStorage.getItem('warna')==='maroon')colour='maroon'}catch{}
const key=()=>colour+'-'+ori;
const say=s=>$('message').textContent=s;
function theme(){
 document.body.classList.toggle('maroon',colour==='maroon');
 document.querySelector('meta[name=theme-color]').content=colour==='biru'?'#122844':'#641f36';
 document.querySelectorAll('[data-col],[data-ori]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.col===colour||b.dataset.ori===ori)));
 $('heroFrame').src='assets/'+key()+'.png';document.querySelector('figure').classList.toggle('potret',ori==='potret');
}
$('colours').onclick=e=>{const b=e.target.closest('[data-col]');if(b){colour=b.dataset.col;try{localStorage.setItem('warna',colour)}catch{}theme()}};
$('formats').onclick=e=>{const b=e.target.closest('[data-ori]');if(b){ori=b.dataset.ori;theme()}};
theme();
function halt(){cancelAnimationFrame(raf);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;}
function source(){return still||(video.readyState>=2&&video.videoWidth?video:null);}
const tiny=document.createElement('canvas');tiny.width=32;tiny.height=32;const soft=tiny.getContext('2d');
function render(){
 if(mode!=='camera'||!frame)return;
 const [x,y,r,b]=windows[key()],w=r-x,h=b-y,s=source();
 ctx.fillStyle='#203347';ctx.fillRect(0,0,canvas.width,canvas.height);
 if(s){
  const iw=s.videoWidth||s.naturalWidth,ih=s.videoHeight||s.naturalHeight;
  const fit=Math.min(w/iw,h/ih),fill=Math.max(w/iw,h/ih),v=+$('zoom').value/100;
  const scale=v<=1?fit+(fill-fit)*v:fill*v;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.translate(x+w/2,y+h/2);
  if(!still&&facing==='user')ctx.scale(-1,1);
  if(v<1){
   const sw=w/fill,sh=h/fill;
   soft.drawImage(s,(iw-sw)/2,(ih-sh)/2,sw,sh,0,0,32,32);
   ctx.imageSmoothingQuality='high';ctx.drawImage(tiny,-w/2,-h/2,w,h);
  }
  ctx.drawImage(s,-iw*scale/2,-ih*scale/2,iw*scale,ih*scale);ctx.restore();
 }
 ctx.drawImage(frame,0,0);
 $('snap').disabled=!s||timer;
}
function loop(){render();if(mode==='camera')raf=requestAnimationFrame(loop);}
function lock(on){timer=on;for(const id of ['snap','flip','gallery','zoom'])$(id).disabled=on;}
async function camera(){
 const token=++epoch;halt();mode='camera';still=null;frame=null;lock(false);$('snap').disabled=true;
 $('home').hidden=true;$('studio').hidden=false;$('cameraControls').hidden=false;$('resultControls').hidden=true;
 canvas.hidden=false;$('resultPhoto').hidden=true;$('count').textContent='';$('heading').textContent='Kamera';$('selection').textContent=(colour==='biru'?'Biru':'Maroon')+' · '+(ori==='potret'?'Potret':'Landskap');
 $('zoom').value=100;say('Membuka kamera…');
 try{
  const f=new Image();f.src='assets/'+key()+'.png';await f.decode();if(token!==epoch)return;
  frame=f;canvas.width=f.naturalWidth;canvas.height=f.naturalHeight;loop();
  const incoming=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},aspectRatio:{ideal:4/3},width:{ideal:1600},height:{ideal:1200},resizeMode:{ideal:'none'}}});
  if(token!==epoch){incoming.getTracks().forEach(t=>t.stop());return}
  stream=incoming;video.srcObject=stream;await video.play();if(token===epoch)say('');
 }catch{if(token===epoch)say('Kamera belum tersedia. Benarkan kamera dalam pelayar atau pilih foto daripada Galeri.');}
}
$('start').onclick=$('again').onclick=camera;
$('flip').onclick=()=>{facing=facing==='user'?'environment':'user';camera()};
$('gallery').onclick=()=>$('picker').click();
$('picker').onchange=async e=>{
 const f=e.target.files[0];if(!f)return;e.target.value='';const token=epoch,url=URL.createObjectURL(f);
 try{const im=new Image();im.src=url;await im.decode();if(token!==epoch||mode!=='camera'||!frame)return;
 ++epoch;halt();still=im;$('zoom').value=100;say('Laraskan zum, kemudian tekan Ambil foto.');loop();}
 catch{say('Foto ini tidak dapat dibuka. Pilih gambar JPEG atau PNG.')}finally{URL.revokeObjectURL(url)}
};
$('back').onclick=()=>{++epoch;mode='home';halt();lock(false);$('studio').hidden=true;$('home').hidden=false;say('');};
function name(){
 const d=new Date(),p=(n,k=2)=>String(n).padStart(k,'0');
 return 'SJKCYM2026_'+colour+'_'+ori+'_'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'_'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+p(d.getMilliseconds(),3)+'.jpg';
}
$('snap').onclick=async()=>{
 if(timer||!source())return;const token=epoch;lock(true);
 for(let n=3;n>0;n--){$('count').textContent=n;await new Promise(r=>setTimeout(r,1000));if(token!==epoch)return}
 $('count').textContent='';render();cancelAnimationFrame(raf);
 const photo=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.94));
 if(token!==epoch)return;if(!photo){lock(false);say('Cuba ambil foto sekali lagi.');loop();return}
 blob=photo;fileName=name();mode='result';halt();lock(false);
 if(resultURL)URL.revokeObjectURL(resultURL);resultURL=URL.createObjectURL(photo);$('resultPhoto').src=resultURL;
 $('resultPhoto').hidden=false;canvas.hidden=true;$('stage').classList.remove('flash');void $('stage').offsetWidth;$('stage').classList.add('flash');
 $('cameraControls').hidden=true;$('resultControls').hidden=false;$('heading').textContent='Foto anda';
 $('save').textContent=ios?'Simpan ke Foto':'Muat Turun';$('shareTip').textContent=ios?'Dalam menu kongsi, pilih Simpan Imej.':'';say('');
 try{await queue(fileName,photo)}catch{say('Ruang simpanan peranti tidak tersedia. Simpan salinan foto sekarang.')}
};
$('save').onclick=async()=>{
 const file=new File([blob],fileName,{type:'image/jpeg'});
 if(ios){
  if(navigator.canShare?.({files:[file]})){
   try{await navigator.share({files:[file]});return}catch(e){if(e.name==='AbortError')return}
  }
  say('Tekan lama pada foto dan pilih Simpan ke Foto.');return;
 }
 const a=document.createElement('a');a.href=resultURL;a.download=fileName;a.click();
};
const installed=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
function installTip(s){$('installTip').hidden=false;$('installTip').textContent=s;}
if(!installed()){if(ios)installTip('iPhone: Dalam Safari, ketik Kongsi, kemudian Tambah ke Skrin Utama.');else $('install').hidden=false;}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;});
$('install').onclick=async()=>{if(installEvent){await installEvent.prompt();await installEvent.userChoice;installEvent=null}else installTip('Buka menu pelayar dan pilih Pasang aplikasi atau Tambah ke skrin utama.')};
window.addEventListener('appinstalled',()=>{$('install').hidden=true;$('installTip').hidden=true});
window.addEventListener('pagehide',()=>{if(mode==='camera')$('back').click();else halt()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{$('offline').textContent='Sedia di luar talian'}).catch(()=>{$('offline').textContent='Mod luar talian belum tersedia'});
flush();
