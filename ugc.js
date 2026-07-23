/* Aligned app module: ugc.js (split from live) */

function ugcEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
TITLES.ugc='UGC Ads';
RENDER.ugc=function(){
  var u=DB.user||{};
  var brand=u.company||u.businessName||u.name||'';
  var twinOk=!!(u.twinReady && u.twinVoiceId);
  return '<div class="card" style="max-width:720px">'
   +'<h3 style="margin:0 0 4px">🎬 Make a UGC ad</h3>'
   +'<p style="color:var(--muted);font-size:13.5px;margin:0 0 16px">Tell us about your product and we\'ll write three scroll-stopping ad scripts. Pick your favourite and we turn it into a finished vertical video - your presenter, your product on screen, captions and a call to action - delivered to your Approvals.</p>'
   +'<div class="field"><label>Who presents the ad?</label>'
   +'<div id="ugcPresGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:6px">'
     +(twinOk?'<div class="ugcp" data-pres="twin" onclick="ugcPickTile(this)" style="cursor:pointer;text-align:center"><div class="ugcpf" style="width:100%;aspect-ratio:1;border-radius:12px;border:2px solid #7c5cff;'+(u.twinPreview?"background-image:url('"+u.twinPreview+"');background-size:cover;background-position:center":"background:var(--grad)")+'"></div><div style="font-size:11px;margin-top:3px">My twin</div></div>':'')
     +(STOCK_AVATARS||[]).map(function(a,idx){ var sel=(idx===0 && !twinOk); var bg=a.preview?("background-image:url('"+a.preview+"');background-size:cover;background-position:center"):'background:#1a2236'; return '<div class="ugcp" data-pres="stock:'+ugcEsc(a.name)+'" onclick="ugcPickTile(this)" style="cursor:pointer;text-align:center"><div class="ugcpf" style="width:100%;aspect-ratio:1;border-radius:12px;border:2px solid '+(sel?'#7c5cff':'transparent')+';'+bg+'"></div><div style="font-size:11px;margin-top:3px">'+ugcEsc(a.name)+'</div></div>'; }).join('')
     +'<div class="ugcp" onclick="ugcToggleGen()" style="cursor:pointer;text-align:center"><div style="width:100%;aspect-ratio:1;border-radius:12px;border:2px dashed #7c5cff;display:flex;align-items:center;justify-content:center;background:rgba(124,92,255,.08);color:#a98bff;font-size:22px">＋</div><div style="font-size:11px;margin-top:3px;color:#a98bff">New</div></div>'
   +'</div>'
   +(!twinOk?'<div style="font-size:11.5px;color:var(--muted2);margin-top:2px">Tap a presenter, tap New to generate one, or <span onclick="openTwinCreate()" style="color:var(--purple);cursor:pointer">create your twin</span>.</div>':'')
   +'<div id="ugcGenBox" style="display:none;margin-top:10px;border:1px solid var(--line);border-radius:10px;padding:12px"><input id="ugcGenDesc" placeholder="Describe the presenter, or leave blank to let AI design one" style="width:100%;margin-bottom:8px"><div id="ugcGenStatus" style="font-size:12px;color:var(--muted2);min-height:16px;margin-bottom:8px"></div><button class="btn" onclick="ugcGenPresenter(false)" style="width:auto;padding:8px 16px">Generate from description →</button> <button class="btn ghost" onclick="ugcGenPresenter(true)" style="width:auto;padding:8px 16px">Let AI design one</button></div>'
   +'</div>'
   +'<div class="field"><label>Product or service</label><input id="ugcProduct" placeholder="e.g. Valley Greens superfood powder"></div>'
   +'<div class="field"><label>What does it do? Main benefit</label><textarea id="ugcDesc" placeholder="e.g. one scoop replaces a cabinet of supplements, tastes like green apple, no bloating"></textarea></div>'
   +'<div class="field"><label>Who is it for? <span style="color:var(--muted2);font-weight:500">(optional)</span></label><input id="ugcAud" placeholder="e.g. busy people who feel tired and want to eat healthier"></div>'
   +'<div class="field"><label>Your offer / call to action</label><input id="ugcOffer" placeholder="e.g. 30% off your first order this week"></div>'
   +'<div class="field"><label>Product photo <span style="color:var(--muted2);font-weight:500">(optional, but makes a better ad)</span></label><div style="display:flex;align-items:center;gap:10px"><input type="file" accept="image/*" onchange="ugcPhotoUpload(this)" style="font-size:12px;max-width:200px"><span id="ugcPhotoStatus" style="font-size:12px;color:var(--purple)"></span></div><input type="hidden" id="ugcProductImg"></div>'
   +'<input type="hidden" id="ugcBrand" value="'+ugcEsc(brand)+'">'
   +'<button class="btn" id="ugcGenBtn" onclick="ugcGenerate()" style="margin-top:6px">✨ Generate ad scripts</button>'
   +'</div>'
   +'<div id="ugcResults" style="max-width:720px;margin-top:18px"></div>';
};
function ugcPhotoUpload(input){
  var f=(input.files||[])[0]; if(!f) return; var st=document.getElementById('ugcPhotoStatus'); if(st)st.textContent='Uploading…';
  var fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET);
  fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/image/upload',{method:'POST',body:fd})
    .then(function(r){return r.json();}).then(function(x){ var url=x&&(x.secure_url||x.url); var h=document.getElementById('ugcProductImg'); if(h&&url)h.value=url; if(st)st.textContent=url?'✓ photo added':'could not upload that image'; })
    .catch(function(){ if(st)st.textContent='could not upload that image'; });
}
function ugcGenerate(){
  var pEl=document.getElementById('ugcProduct'); var product=(pEl&&pEl.value||'').trim();
  if(!product){ toast('Add your product or service first'); return; }
  var payload={ product:product, description:(document.getElementById('ugcDesc').value||'').trim(), audience:(document.getElementById('ugcAud').value||'').trim(), offer:(document.getElementById('ugcOffer').value||'').trim(), brand:(document.getElementById('ugcBrand').value||'').trim() };
  var btn=document.getElementById('ugcGenBtn'); btn.disabled=true; var lbl=btn.textContent; btn.textContent='Writing your ads…';
  var res=document.getElementById('ugcResults'); res.innerHTML='<div style="color:var(--muted);font-size:13.5px;padding:8px">Writing three ad options… this takes about 20 seconds.</div>';
  fetch(CONFIG.UGC_SCRIPT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){return r.json();}).then(function(d){
      btn.disabled=false; btn.textContent=lbl;
      if(!d||!d.ok||!Array.isArray(d.variations)){ res.innerHTML='<div style="color:#f0a0a0;font-size:13.5px;padding:8px">Couldn\'t generate ads just now - please try again.</div>'; return; }
      window.__ugcAd={ variations:d.variations, caption:d.caption||'', cta:d.cta||'', product:product, brand:payload.brand };
      res.innerHTML='<div class="sect-title" style="margin-bottom:10px">Pick an ad to make</div>'+d.variations.map(function(v,i){
        return '<div class="card" style="margin-bottom:12px">'
          +'<div style="font-size:12px;color:var(--purple);font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">'+ugcEsc(v.hookAngle||('Option '+(i+1)))+'</div>'
          +'<div style="font-weight:700;font-size:15px;margin-bottom:6px">"'+ugcEsc(v.hook||'')+'"</div>'
          +'<div style="color:var(--muted);font-size:13px;line-height:1.55;margin-bottom:12px">'+ugcEsc(v.script||'')+'</div>'
          +'<button class="btn" onclick="ugcMakeAd('+i+')">🎬 Make this ad</button>'
          +'</div>';
      }).join('')+(d.caption?('<div class="card" style="font-size:12.5px;color:var(--muted)"><b style="color:#eef2fb">Suggested caption</b><br>'+ugcEsc(d.caption)+'</div>'):'');
    })
    .catch(function(){ btn.disabled=false; btn.textContent=lbl; res.innerHTML='<div style="color:#f0a0a0;font-size:13.5px;padding:8px">Something went wrong - please try again.</div>'; });
}
function ugcPickPresenter(){
  var sel=document.getElementById('ugcPresenter'); if(!sel) return; var val=sel.value||''; var u=DB.user||{};
  if(val==='twin'){ window.__ugcPresenter={photo:(typeof av4SourceImage==='function'?av4SourceImage(u):(u.twinPreview||'')), voice:u.twinVoiceId||''}; return; }
  if(val.indexOf('stock:')===0){ var nm=val.slice(6); var a=(STOCK_AVATARS||[]).find(function(x){return (x.name||'')===nm;}); if(a) window.__ugcPresenter={photo:a.preview||'', voice:''}; } // voice blanked: a.voice is a HeyGen id, the UGC render path uses ElevenLabs
}
function ugcToggleGen(){ var b=document.getElementById('ugcGenBox'); if(b) b.style.display=(b.style.display==='none'?'block':'none'); }
function ugcPickTile(el){
  var u=DB.user||{};
  document.querySelectorAll('#ugcPresGrid .ugcpf').forEach(function(f){ f.style.borderColor='transparent'; });
  var f=el.querySelector('.ugcpf'); if(f) f.style.borderColor='#7c5cff';
  var val=el.getAttribute('data-pres')||'';
  if(val==='twin'){ window.__ugcPresenter={photo:(typeof av4SourceImage==='function'?av4SourceImage(u):(u.twinPreview||'')), voice:u.twinVoiceId||''}; return; }
  if(val.indexOf('stock:')===0){ var nm=val.slice(6); var a=(STOCK_AVATARS||[]).find(function(x){return (x.name||'')===nm;}); if(a) window.__ugcPresenter={photo:a.preview||'', voice:''}; } // voice blanked: a.voice is a HeyGen id, the UGC render path uses ElevenLabs
}
function ugcGenPresenter(auto){
  var desc=auto?'':(((document.getElementById('ugcGenDesc')||{}).value||'').trim());
  var st=document.getElementById('ugcGenStatus');
  if(!auto && desc.length<4){ if(st){ st.style.color='#e0674f'; st.textContent='Add a short description, or tap "Let AI design one".'; } return; }
  if(st){ st.style.color='var(--muted2)'; st.innerHTML='🎨 Designing your presenter… about a minute.'; }
  var u=DB.user||{};
  fetch(CONFIG.GENPRESENTER,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:desc, email:(u.email||'')})})
    .then(function(r){return r.json();}).then(function(x){
      var url=x&&x.url; var s2=document.getElementById('ugcGenStatus');
      if(!url){ if(s2){ s2.style.color='#e0674f'; s2.textContent='Could not generate a presenter. Please try again.'; } return; }
      window.__ugcPresenter={photo:url, voice:''};
      var grid=document.getElementById('ugcPresGrid');
      if(grid){ document.querySelectorAll('#ugcPresGrid .ugcpf').forEach(function(f){ f.style.borderColor='transparent'; });
        var tile=document.createElement('div'); tile.className='ugcp'; tile.style.cssText='cursor:pointer;text-align:center';
        tile.innerHTML='<div class="ugcpf" style="width:100%;aspect-ratio:1;border-radius:12px;border:2px solid #7c5cff;background-image:url(\''+url+'\');background-size:cover;background-position:center"></div><div style="font-size:11px;margin-top:3px">New</div>';
        tile.onclick=function(){ window.__ugcPresenter={photo:url,voice:''}; document.querySelectorAll('#ugcPresGrid .ugcpf').forEach(function(f){f.style.borderColor='transparent';}); var ff=tile.querySelector('.ugcpf'); if(ff) ff.style.borderColor='#7c5cff'; };
        grid.insertBefore(tile, grid.firstChild);
      }
      if(s2){ s2.style.color='#16a34a'; s2.textContent='✓ New presenter ready and selected (top left).'; }
    }).catch(function(){ var s3=document.getElementById('ugcGenStatus'); if(s3){ s3.style.color='#e0674f'; s3.textContent='Something went wrong. Please try again.'; } });
}
function ugcMakeAd(i){
  var u=DB.user||{}; var ad=window.__ugcAd; if(!ad||!ad.variations||!ad.variations[i]) return;
  var pres=window.__ugcPresenter;
  if(!pres){ if(u.twinReady && u.twinVoiceId){ pres={photo:av4SourceImage(u), voice:u.twinVoiceId}; } else { var a0=(STOCK_AVATARS||[])[0]; pres=a0?{photo:a0.preview||'', voice:a0.voice||''}:null; } }
  if(!pres || !pres.photo){ toast('Pick a presenter for your ad first.'); return; }
  var v=ad.variations[i];
  var pi=document.getElementById('ugcProductImg'); var prod=(pi&&pi.value)||'';
  var payload={
    script:v.script, onScreen:JSON.stringify(v.onScreen||[]), cta:(v.cta||ad.cta||'Learn more'),
    image_url:pres.photo, voice_id:pres.voice||'',
    productImages:prod?JSON.stringify([prod]):'[]',
    brand:ad.brand||'', brandColor:(u.brandKit&&u.brandKit.color)||'',
    email:u.email, phone:u.phone||'', videoId:'ugc-'+Date.now(), caption:ad.caption||''
  };
  if(CONFIG.UGC_RENDER){ fetch(CONFIG.UGC_RENDER,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){}); }
  try{ notifyChris('ugc_ad',{detail:'UGC ad requested for: '+(ad.product||'')}); }catch(e){}
  try{ startReadyPolling(); }catch(e){}
  toast('<span class="ok">✓</span> Making your UGC ad - we\'ll deliver it to your Approvals in a few minutes.');
}
