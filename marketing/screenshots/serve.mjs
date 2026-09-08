import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const captions = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'captions.json')));
const formats = { apple: [1242,2688], play: [1080,1920], tablet: [2064,2752], feature: [1024,500] };
const escape = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf','.json':'application/json'};
http.createServer(async (req,res)=>{
 const u = new URL(req.url,'http://localhost');
 if(u.pathname==='/export' && req.method==='POST') {
  let data=''; for await (const part of req) { data+=part; if(data.length>25000000){res.writeHead(413);res.end();return;} }
  const {lang,format,topic,png,metrics}=JSON.parse(data);
  if(!captions[lang]||!formats[format]||![0,1,2].includes(topic)||!png.startsWith('data:image/png;base64,')){res.writeHead(400);res.end();return;}
  const dir=path.join(import.meta.dirname,'exports',lang,format);fs.mkdirSync(dir,{recursive:true});
  const file=format==='feature'?'feature.png':`${String(topic+1).padStart(2,'0')}-${['overview','exchanges','statistics'][topic]}.png`;
  const bytes=Buffer.from(png.split(',')[1],'base64');const [ew,eh]=formats[format];
  if(bytes.readUInt32BE(16)!==ew||bytes.readUInt32BE(20)!==eh){res.writeHead(400);res.end('Wrong dimensions');return;}
  fs.writeFileSync(path.join(dir,file),bytes);fs.appendFileSync(path.join(import.meta.dirname,'render-log.jsonl'),JSON.stringify({lang,format,topic,file,bytes:bytes.length,metrics})+'\n');
  res.writeHead(200);res.end('Saved '+lang+'/'+format+'/'+file);return;
 }
 if(u.pathname==='/studio') {
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><html><head><title>AirCapital screenshot studio</title></head><body style="background:#10151f;color:#edf2fa;font:18px Arial;padding:30px"><h1>AirCapital screenshot studio</h1><button id="single">Export current sample</button> <button id="all">Export all 31 languages</button><button id="tablets">Export tablet images</button> <button id="tablet-sample">Export tablet sample</button><pre id="status">Ready</pre><iframe id="preview" style="width:800px;height:900px;border:0" title="Poster preview"></iframe><script>
const langs=${JSON.stringify(Object.keys(captions))};const queue=[];let completed=0;const status=document.getElementById('status'),frame=document.getElementById('preview');
function next(){if(!queue.length){status.textContent='Complete: '+completed+' files';return}const j=queue.shift();status.textContent='Rendering '+JSON.stringify(j)+' — '+completed+' saved';frame.src='/poster?'+new URLSearchParams({...j,auto:'1'});}
document.getElementById('single').onclick=()=>{completed=0;queue.push({lang:'en',format:'apple',topic:0});next()};
document.getElementById('tablets').onclick=()=>{completed=0;for(const lang of langs)for(const topic of [0,1,2])queue.push({lang,format:'tablet',topic});next()};
document.getElementById('tablet-sample').onclick=()=>{completed=0;queue.push({lang:'en',format:'tablet',topic:0});next()};
document.getElementById('all').onclick=()=>{completed=0;for(const lang of langs)for(const format of ['apple','play','tablet','feature'])for(const topic of (format==='feature'?[0]:[0,1,2]))queue.push({lang,format,topic});next()};
window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data.saved){completed++;next()}else if(e.data.error){status.textContent='ERROR '+e.data.error;queue.length=0}});
</script></body></html>`);return;
 }
 if(u.pathname==='/poster') {
  const lang = captions[u.searchParams.get('lang')] ? u.searchParams.get('lang') : 'en';
  const topic = Math.min(2, Math.max(0, Number(u.searchParams.get('topic')) || 0));
  const format = formats[u.searchParams.get('format')] ? u.searchParams.get('format') : 'apple';
  const [w,h] = formats[format], [a,b,sub] = captions[lang][topic];
  const tablet = format==='tablet', feature = format==='feature', scale=w/(feature?1024:tablet?1032:800), H=h/scale;
  const top = feature?72:tablet?60:54;
  const phoneTop = feature?48:tablet?470:format==='play'?440:495;
  const deviceH = feature?660:H-phoneTop-65;
  const sw = tablet?820:390, sh=tablet?1000:844;
  const dscale=(deviceH-24)/sh, dw=sw*dscale+24;
  const catalog = JSON.parse(fs.readFileSync(path.join(root,'src/i18n/catalogs',lang+'.json')));
  const demo = catalog.demoLabel || catalog.demo || 'Demo data';
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><html lang="${lang}" dir="${lang==='ar'?'rtl':'ltr'}"><head><meta charset="utf-8"><title>AirCapital · ${lang} · ${format} · ${topic+1}</title><style>
*{box-sizing:border-box}html,body{margin:0;width:${w}px;height:${h}px;overflow:clip;background:#050e19}body{font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}main{width:${w/scale}px;height:${H}px;transform:scale(${scale});transform-origin:top left;position:absolute;left:0;direction:ltr;color:#f6f8fc;overflow:clip;background:radial-gradient(ellipse at 50% 76%,#0c596266,transparent 53%),radial-gradient(ellipse at 90% 95%,#13577633,transparent 52%),#050e19}.halo{position:absolute;width:690px;height:980px;left:50%;top:45%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,#45d9c926,transparent 66%);filter:blur(32px)}.orbit{position:absolute;right:-140px;top:-230px;width:680px;height:620px;border:1px solid #364057;border-radius:50%;transform:rotate(27deg)}.orbit:after{content:'';width:15px;height:15px;border-radius:50%;background:#303c57;position:absolute;right:90px;bottom:48px}.orbit.two{top:auto;right:auto;left:-520px;bottom:-30px;width:800px;height:1100px;opacity:.45}.brand{position:absolute;top:${top}px;left:54px;display:flex;align-items:center;gap:18px;font-size:38px;font-weight:700;letter-spacing:-1px}.brand img{width:58px;height:58px;border-radius:14px}.copy{position:absolute;left:56px;right:${feature?'450px':'56px'};top:${feature?172:top+110}px;direction:${lang==='ar'?'rtl':'ltr'}}h1{margin:0;font-size:${feature?55:tablet?77:85}px;line-height:1.11;letter-spacing:${lang==='ar'?'0':'-3px'};font-weight:750}h1 span{display:block;white-space:nowrap}h1 span:last-child{color:#78ddc5}p{font-size:${feature?22:tablet?29:29}px;line-height:1.47;margin:27px 0 0;color:#aeb9c9;max-width:${feature?490:710}px}.device{position:absolute;top:${phoneTop}px;left:${feature?'704px':'50%'};transform:translateX(-50%);width:${dw}px;height:${deviceH}px;padding:11px;border-radius:${tablet?38:49}px;background:linear-gradient(130deg,#c5cbca 0%,#696d6d 4%,#141b22 9%,#525b61 50%,#949e9d 74%,#252c31 95%,#aaaead);box-shadow:0 2px 2px #b4bbbb,0 12px 18px #000b,0 0 0 2px #0d151b,inset 0 0 0 4px #1b2227}.screen{height:100%;width:100%;overflow:clip;border-radius:${tablet?28:38}px;background:#10151f;position:relative;box-shadow:0 0 0 3px #02050a}iframe{width:${sw}px;height:${sh}px;border:0;transform:scale(${dscale});transform-origin:top left;position:absolute;left:0;top:0;pointer-events:none}.demo{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:${tablet?21:20}px;color:#8195a9;direction:${lang==='ar'?'rtl':'ltr'};${feature?'display:none':''}}
</style></head><body><main><div class="halo"></div><div class="orbit"></div><div class="orbit two"></div><div class="brand"><img src="/icon.png" alt="">AirCapital</div><div class="copy"><h1><span>${escape(a)}</span><span>${escape(b)}</span></h1><p>${escape(sub)}</p></div><div class="device"><div class="screen"><iframe title="AirCapital demo" src="/?lang=${lang}&screen=${['overview','exchanges','statistics'][topic]}"></iframe></div></div><div class="demo">${escape(demo)}</div></main><script src="/renderer.js"></script><script>
document.fonts.ready.then(()=>{const h=document.querySelector('h1');let size=parseFloat(getComputedStyle(h).fontSize);while([...h.children].some(e=>e.scrollWidth>h.clientWidth)&&size>36){size-=1;h.style.fontSize=size+'px'}document.body.dataset.typographyReady='true'});
if(new URLSearchParams(location.search).has('auto')) (async()=>{try{
 const frame=document.querySelector('iframe');while(!frame.contentDocument?.querySelector('[role="button"]')||frame.contentDocument.body.textContent.includes('Loading'))await new Promise(r=>setTimeout(r,150));
 await frame.contentDocument.fonts.ready;await document.fonts.ready;await new Promise(r=>setTimeout(r,300));
 const fontFile=await fetch('/icon-font.ttf').then(r=>r.blob());const fontData=await new Promise(resolve=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.readAsDataURL(fontFile)});
 const fontEmbedCSS='@font-face{font-family:ionicons;src:url('+fontData+') format("truetype")}';
 const screen=await htmlToImage.toPng(frame.contentDocument.getElementById('root'),{width:${sw},height:${sh},canvasWidth:${sw*3},canvasHeight:${sh*3},pixelRatio:1,backgroundColor:'#10151f',fontEmbedCSS,filter:node=>!['NOSCRIPT','SCRIPT'].includes(node.tagName)});
 const img=new Image();img.src=screen;img.style.cssText=frame.style.cssText;img.style.cssText+='width:${sw}px;height:${sh}px;transform:scale(${dscale});transform-origin:top left;position:absolute;left:0;top:0';await img.decode();frame.replaceWith(img);
 const copy=document.querySelector('.copy');const device=document.querySelector('.device');let f=parseFloat(getComputedStyle(document.querySelector('h1')).fontSize);
 while(!${feature}&&copy.getBoundingClientRect().bottom+30>device.getBoundingClientRect().top&&f>36){f--;document.querySelector('h1').style.fontSize=f+'px';}
 const metrics={headingSize:f,copyBottom:copy.getBoundingClientRect().bottom,deviceTop:device.getBoundingClientRect().top,headingOverflow:[...document.querySelectorAll('h1 span')].some(e=>e.scrollWidth>e.clientWidth),screenText:frame.contentDocument?.body?.textContent?.slice(0,100)};
 const png=await htmlToImage.toPng(document.querySelector('main'),{width:${w/scale},height:${H},canvasWidth:${w},canvasHeight:${h},pixelRatio:1,backgroundColor:'#050e19',style:{transform:'none',position:'relative',left:'0',top:'0'}});
 const saved=await fetch('/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang:${JSON.stringify(lang)},format:${JSON.stringify(format)},topic:${topic},png,metrics})});if(!saved.ok)throw new Error(await saved.text());parent.postMessage({saved:true},location.origin);
}catch(e){parent.postMessage({error:String(e)},location.origin)}})();
</script></body></html>`);return;
 }
 let file;
 if(u.pathname==='/icon.png') file=path.join(root,'public/branding/icon-512.png');
 else if(u.pathname==='/icon-font.ttf') file=path.join(root,'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf');
 else if(u.pathname==='/renderer.js') file=path.join(root,'tmp/store-render-deps/node_modules/html-to-image/dist/html-to-image.js');
 else { const rel=u.pathname.replace(/^\/app\/?/,'');file=path.join(root,'tmp/store-capture/dist',rel||'index.html');if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'tmp/store-capture/dist/index.html'); }
 if(!file.startsWith(root)||!fs.existsSync(file)){res.writeHead(404);res.end();return}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
 if(path.extname(file)==='.html')res.end(fs.readFileSync(file,'utf8').replace('</head>','<style>*{scrollbar-width:none!important}*::-webkit-scrollbar{display:none!important}</style></head>'));
 else fs.createReadStream(file).pipe(res);
}).listen(8098,'127.0.0.1',()=>console.log('Capture preview: http://127.0.0.1:8098/poster'));
