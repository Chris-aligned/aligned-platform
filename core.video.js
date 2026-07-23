/* Aligned app module: core.video.js (split from live; load order matters) */
function libGrid(filter){
  let v=DB.videos.slice().sort((a,b)=>b.created-a.created);
  if(filter!=='all') v=v.filter(x=>x.status===filter);
  if(!v.length) return emptyState('Nothing here yet','No videos with this status.');
  return `<div class="vgrid">`+v.map(x=>`
    <div class="vcard">
      <div class="vthumb" ${(function(){var p=posterFor(x);var bg=p?`background-image:url('${p}');background-size:cover;background-position:center`:'';return (x.status==='review'||x.status==='posted'||x.status==='ready')?`style="cursor:pointer;${bg}" onclick="openVideo('${x.id}')"`:(bg?`style="${bg}"`:'');})()}><div class="ov">${statusBadge(x.status, x)}</div><div class="play"><svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg></div></div>
      <div class="vbody">
        <div class="t">${x.title}</div>
        ${x.captionText?`<div class="src" style="color:#c9d2e6;white-space:normal;line-height:1.45;max-height:3.6em;overflow:hidden">${cwEsc(cleanCaption(x.captionText))}</div>`:`<div class="src">${x.src}</div>`}
        <div class="vactions">
          ${x.status==='review'?`<button class="btn green small" onclick="openVideo('${x.id}')">Review</button><button class="btn ghost small" onclick="deleteVideo('${x.id}')">Delete</button>`:''}
          ${x.status==='posted'?`<button class="btn ghost small" onclick="openVideo('${x.id}')">View</button><button class="btn ghost small" onclick="deleteVideo('${x.id}')">Delete</button>`:''}
          ${x.status==='processing'?`${isStale(x)?`<button class="btn ghost small" disabled style="opacity:.6">Taking longer than usual</button>`:`<button class="btn ghost small" disabled style="opacity:.6">Rendering - we'll text you when it's ready</button>`}<button class="btn ghost small" onclick="retryVideo('${x.id}')">Retry</button><button class="btn ghost small" onclick="deleteVideo('${x.id}')">Delete</button>`:''}
          ${x.status==='rejected'?`<button class="btn ghost small" onclick="redo('${x.id}')">Try again</button><button class="btn ghost small" onclick="deleteVideo('${x.id}')">Delete</button>`:''}
        </div>
      </div>
    </div>`).join('')+`</div>`;
}
function filterLib(f,el){ document.querySelectorAll('#libFilters .chip').forEach(c=>c.classList.remove('active')); el.classList.add('active'); document.getElementById('libGrid').innerHTML=libGrid(f); }
function goLib(filter){ window.__libFilter=(filter||'all'); go('library'); }
function emptyState(big,sub){ return `<div class="empty"><div class="big">${big}</div>${sub}</div>`; }
function timeAgo(t){ const s=(Date.now()-t)/1000; if(s<3600)return Math.max(1,Math.floor(s/60))+'m ago'; if(s<86400)return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago'; }

function refreshApvBadge(){
  const n=DB.videos.filter(v=>v.status==='review').length;
  const b=document.getElementById('apvBadge');
  if(b){ b.textContent=n; b.classList.toggle('hidden', n===0); }
}

// Accumulating B-roll picker for the production station: add clips across multiple selections, list + remove them.
var RK_BROLL=[];
function addRkBroll(input){
  var files=Array.prototype.slice.call(input.files||[]); if(!files.length) return;
  files.forEach(function(f){ if(!RK_BROLL.some(function(x){return x.name===f.name && x.size===f.size;})) RK_BROLL.push(f); });
  input.value=''; // let the same file be re-pickable and keep selection accumulating
  renderRkBroll();
  var brEl=document.getElementById('rkBroll'); var brReq=document.getElementById('brollReq');
  if(brReq && brReq.style.display==='block' && RK_BROLL.length){ /* requirement now met visually */ }
}
function removeRkBroll(i){ RK_BROLL.splice(i,1); renderRkBroll(); }
function clearRkBroll(){ RK_BROLL=[]; renderRkBroll(); }
function renderRkBroll(){
  var box=document.getElementById('rkBrollList'); if(!box) return;
  box.innerHTML=RK_BROLL.map(function(f,i){
    var img=/^image\//.test(f.type);
    var txt=f._txt||''; var pos=f._pos||'bottom';
    function opt(v,l){ return '<option value="'+v+'"'+(pos===v?' selected':'')+'>'+l+'</option>'; }
    return '<div style="background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;width:230px">'+
      '<div style="display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--muted)"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(img?'🖼️':'🎬')+' '+cwEsc(f.name)+'</span><span style="cursor:pointer;color:#e06a6a;font-weight:700" onclick="removeRkBroll('+i+')">×</span></div>'+
      '<input type="text" value="'+cwEsc(txt)+'" oninput="rkSetText(this,'+i+')" placeholder="On-screen text (optional)" style="width:100%;margin-top:7px;font-size:12px;padding:6px 8px"/>'+
      '<div style="display:flex;align-items:center;gap:6px;margin-top:6px"><span style="font-size:10.5px;color:var(--muted2)">Position</span>'+
        '<select onchange="rkSetPos(this,'+i+')" style="flex:1;font-size:11.5px;padding:4px 6px">'+opt('top','Top')+opt('mid','Middle')+opt('bottom','Bottom')+'</select></div>'+
    '</div>';
  }).join('');
}
function rkSetText(el,i){ if(RK_BROLL[i]) RK_BROLL[i]._txt=el.value; }
function rkSetPos(el,i){ if(RK_BROLL[i]) RK_BROLL[i]._pos=el.value; }
// Burn an optional on-screen text layer onto a Cloudinary image/video delivery URL (legible white text on a dark strip).
function cloudinaryTextUrl(url,text,pos){
  text=(text||'').trim(); if(!text) return url;
  var i=url.indexOf('/upload/'); if(i<0) return url;
  var enc=encodeURIComponent(text).replace(/%2C/g,'%252C').replace(/%2F/g,'%252F').replace(/%3F/g,'%253F').replace(/%23/g,'%2523').replace(/%26/g,'%2526');
  var g='g_south,y_180'; if(pos==='top') g='g_north,y_180'; else if(pos==='mid') g='g_center,y_0';
  var layer='l_text:Arial_72_bold:'+enc+',co_white,b_rgb:000000B3,w_880,c_fit/fl_layer_apply,'+g;
  return url.slice(0,i+8)+layer+'/'+url.slice(i+8);
}
// Carousel = branded text slides. Sends the topic (+ optional logo) to the carousel engine, which writes + brands the slides and emails them to review/post.
// ---------- Brand kit (logo + colors, used across carousels, reels, branded content) ----------
function brandKitGet(){
  var u=DB.user||{}; var bk=u.brandKit||{};
  return {
    brandName: bk.brandName||'',
    logoUrl: bk.logoUrl||u.carouselLogoUrl||'',
    logoPid: bk.logoPid||u.carouselLogoPid||'',
    accentFrom: bk.accentFrom||'#7c5cff',
    accentTo: bk.accentTo||'#39d98a',
    bg: bk.bg||'#0A0E17',
    text: bk.text||'#EEF2FB',
    muted: bk.muted||'#8A96B0'
  };
}
function bkPickColor(id){ var el=document.getElementById(id), h=document.getElementById(id+'_h'); if(el&&h){ h.value=el.value; h.style.borderColor='var(--line)'; } bkPreviewUpdate(); }
function bkTypeHex(id){
  var h=document.getElementById(id+'_h'), el=document.getElementById(id); if(!h||!el) return;
  var v=(h.value||'').trim(); if(v && v.charAt(0)!=='#') v='#'+v;
  if(/^#[0-9a-fA-F]{6}$/.test(v)){ el.value=v; h.style.borderColor='var(--line)'; bkPreviewUpdate(); }
  else { h.style.borderColor='#e06a6a'; }
}
function bkSavePreviewText(){ var u=DB.user||{}; u.brandKit=u.brandKit||{}; var g=function(id){ var e=document.getElementById(id); return e?(e.textContent||'').trim():''; }; var b=g('bkpBrand'); if(b) u.brandKit.previewBrand=b; u.brandKit.ctaText=g('bkpCta'); u.brandKit.headline=g('bkpHead'); DB.user=u; }
function bkPreviewUpdate(){
  var g=function(id,d){ var el=document.getElementById(id); return el?el.value:d; };
  var from=g('bkFrom','#7c5cff'), to=g('bkTo','#39d98a'), bg=g('bkBg','#0A0E17'), text=g('bkText','#EEF2FB');
  var p=document.getElementById('bkPreview'); if(!p) return;
  var bk=brandKitGet();
  var pbrand=bk.previewBrand||bk.brandName||'Your brand', pcta=bk.ctaText||'Call to action', phead=bk.headline||'Sample headline text';
  p.style.background=bg;
  p.innerHTML='<div style="font-size:10.5px;color:'+text+';opacity:.5">✎ tap any line to edit it</div>'+
    '<div contenteditable="true" id="bkpBrand" oninput="bkSavePreviewText()" spellcheck="false" style="font-weight:900;font-size:22px;background:linear-gradient(160deg,'+from+','+to+');-webkit-background-clip:text;background-clip:text;color:transparent;caret-color:'+from+';outline:none;min-width:40px">'+cwEsc(pbrand)+'</div>'+
    '<div contenteditable="true" id="bkpCta" oninput="bkSavePreviewText()" spellcheck="false" style="font-weight:800;font-size:13px;color:#fff;padding:7px 16px;border-radius:999px;background:linear-gradient(160deg,'+from+','+to+');outline:none;min-width:40px">'+cwEsc(pcta)+'</div>'+
    '<div contenteditable="true" id="bkpHead" oninput="bkSavePreviewText()" spellcheck="false" style="font-size:12px;color:'+text+';outline:none;min-width:40px">'+cwEsc(phead)+'</div>';
}
function uploadBrandLogo(input){
  var f=(input.files||[])[0]; if(!f) return;
  var u=DB.user||{}; var st=document.getElementById('bkLogoStatus'); if(st) st.textContent='Uploading your logo…';
  var pid='blogo_'+String(u.email||('u'+Date.now())).replace(/[^a-z0-9]/gi,'');
  var fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET); fd.append('public_id',pid);
  fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/image/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(x){
    u.brandKit=u.brandKit||{}; u.brandKit.logoPid=(x.public_id||pid); u.brandKit.logoUrl=(x.secure_url||x.url||'');
    u.carouselLogoPid=u.brandKit.logoPid; u.carouselLogoUrl=u.brandKit.logoUrl;
    DB.user=u; if(st) st.textContent='✓ Logo saved'; renderBkLogo();
  }).catch(function(){ if(st) st.textContent='Could not upload that image - try a PNG or JPG'; });
}
function renderBkLogo(){
  var box=document.getElementById('bkLogoPrev'); if(!box) return; var bk=brandKitGet();
  box.innerHTML=bk.logoUrl?('<span style="display:inline-flex;align-items:center;gap:10px;background:#0A0E17;border:1px solid var(--line);border-radius:8px;padding:10px 14px"><img src="'+bk.logoUrl+'" style="height:34px;max-width:170px;object-fit:contain"/><span style="cursor:pointer;color:#e06a6a;font-weight:700;font-size:12px" onclick="removeBrandLogo()">remove</span></span>'):'';
}
function removeBrandLogo(){ var u=DB.user||{}; u.brandKit=u.brandKit||{}; u.brandKit.logoPid=''; u.brandKit.logoUrl=''; u.carouselLogoPid=''; u.carouselLogoUrl=''; DB.user=u; var st=document.getElementById('bkLogoStatus'); if(st) st.textContent=''; renderBkLogo(); }
function saveBrandKit(btn){
  try{ bkSavePreviewText(); }catch(e){}
  var u=DB.user||{}; u.brandKit=u.brandKit||{};
  var g=function(id){ var el=document.getElementById(id); return el?el.value:''; };
  u.brandKit.brandName=(g('bkName')||'').trim(); u.brandKit.accentFrom=g('bkFrom')||'#7c5cff'; u.brandKit.accentTo=g('bkTo')||'#39d98a'; u.brandKit.bg=g('bkBg')||'#0A0E17'; u.brandKit.text=g('bkText')||'#EEF2FB';
  DB.user=u;
  if(btn){ var o=btn.textContent; btn.textContent='Saved ✓'; btn.style.color='#39d98a'; setTimeout(function(){ btn.textContent=o||'Save brand kit'; btn.style.color=''; },1600); } else { toast('<span class="ok">✓</span> Brand kit saved'); }
}
function uploadCarouselLogo(input){
  var f=(input.files||[])[0]; if(!f) return;
  var u=DB.user||{}; var st=document.getElementById('carouselLogoStatus'); if(st) st.textContent='Uploading your logo…';
  var pid='clogo_'+String(u.email||('u'+Date.now())).replace(/[^a-z0-9]/gi,'');
  var fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET); fd.append('public_id',pid);
  fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/image/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(x){
    u.carouselLogoPid=(x.public_id||pid); u.carouselLogoUrl=(x.secure_url||x.url||''); DB.user=u;
    if(st) st.textContent='✓ Logo saved - it will appear on your carousels';
    renderCarouselLogo();
  }).catch(function(){ if(st) st.textContent='Could not upload that image - try a PNG or JPG'; });
}
function renderCarouselLogo(){
  var box=document.getElementById('carouselLogoPrev'); if(!box) return;
  var u=DB.user||{};
  box.innerHTML=u.carouselLogoUrl?('<span style="display:inline-flex;align-items:center;gap:10px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:6px 10px"><img src="'+u.carouselLogoUrl+'" style="height:30px;max-width:130px;object-fit:contain"/><span style="cursor:pointer;color:#e06a6a;font-weight:700;font-size:12px" onclick="removeCarouselLogo()">remove</span></span>'):'';
}
function removeCarouselLogo(){ var u=DB.user||{}; u.carouselLogoPid=''; u.carouselLogoUrl=''; DB.user=u; var st=document.getElementById('carouselLogoStatus'); if(st) st.textContent=''; renderCarouselLogo(); }
function submitCarousel(){
  var u=DB.user||{};
  var ta=document.getElementById('rkCarouselTopic');
  var topic=(ta&&ta.value||'').trim();
  if(!topic){ toast('Tell us what the carousel is about'); return; }
  var vid='carousel-'+Date.now();
  if(CONFIG.CAROUSEL){ fetch(CONFIG.CAROUSEL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:topic, email:u.email, phone:u.phone, name:u.name, videoId:vid, logo:(brandKitGet().logoPid||'')})}).catch(function(){}); }
  if(ta) ta.value='';
  toast('<span class="ok">✓</span> Carousel is being created - we\'ll email you the slides + caption to review');
  go('library');
}
// Animated reel = brand-kit motion-graphic video. Sends the topic + the customer's brand kit (logo URL + colours) to the HyperFrames engine,
// which writes the script, renders the branded template at HeyGen, and delivers the finished MP4 to Approvals (like any other video).
function submitReel(){
  var u=DB.user||{};
  var ta=document.getElementById('rkReelTopic');
  var topic=(ta&&ta.value||'').trim();
  if(!topic){ toast('Tell us what the reel is about'); return; }
  var bk=brandKitGet();
  var vid='reel-'+Date.now();
  // Queue a cinematic reel (Higgsfield pipeline). The scheduled generator crafts the clip + narration and delivers it to Approvals.
  if(CONFIG.REEL_REQUEST){ fetch(CONFIG.REEL_REQUEST,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    key:'aws_reel_queue_2026', email:u.email, name:u.name, phone:u.phone, videoId:vid,
    hook:topic, script:'', shotList:'', caption:'',
    brand:(bk.brandName||u.name||''), logo:(bk.logoUrl||''),
    bg:bk.bg, accentFrom:bk.accentFrom, accentTo:bk.accentTo, text:bk.text, muted:bk.muted
  })}).catch(function(){}); }
  if(ta) ta.value='';
  toast('<span class="ok">✓</span> Your cinematic reel is queued - we\'ll craft it and drop it in Approvals to review and post');
  go('library');
}
// Cinematic clip = AI cinematic scene. Sends the scene prompt + your line + the selected look
// to the cinematic-scene engine, which renders a short (~8s) clip, deducts 150 credits on success, and delivers to Approvals.
function submitShots(){
  var u=DB.user||{};
  var ta=document.getElementById('rkShotPrompt');
  var prompt=(ta&&ta.value||'').trim();
  if(!prompt){ toast('Describe the cinematic scene you want'); return; }
  var si=document.getElementById('rkShotScript');
  var script=(si&&si.value||'').trim().slice(0,2000);
  if(!script){ toast('Add a line or two of what you say in the scene'); return; }
  var sel=document.querySelector('#avaPick .ava.sel');
  var lookId=(sel&&sel.dataset.id)||'twin';
  if(!lookId || lookId==='none' || lookId==='upload'){ lookId='twin'; }
  if(lookId==='twin' && !(u.twinReady && u.twinAvatarId)){ toast('Your AI twin isn\'t ready yet. Pick a stock presenter, or finish setting up your twin first.'); try{ var _ap=document.getElementById('avaPick'); if(_ap && _ap.scrollIntoView) _ap.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} return; }
  if(creditBal() < TOKEN_SCENE){ openCreditTopUp(TOKEN_SCENE); return; }
  var vid='scene-'+Date.now();
  if(CONFIG.CINEMATIC_SCENE){ fetch(CONFIG.CINEMATIC_SCENE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ email:u.email, prompt:prompt, script:script, avatar_ids:[lookId], videoId:vid, name:u.name||'', phone:u.phone||'', caption:'', duration:8 })}).catch(function(){}); }
  if(ta) ta.value='';
  if(si) si.value='';
  toast('<span class="ok">✓</span> Your cinematic scene is rendering - we\'ll drop it in Approvals to review and post. (150 credits on delivery.)');
  go('library');
}
function submitRemake(){
  if(!canProduce()) return;   // trial / monthly-limit gate
  const modeEl=document.querySelector('#modePick .chip.active');
  const mode=modeEl?modeEl.dataset.mode:'link';
  if(mode==='carousel'){ return submitCarousel(); }
  if(mode==='reel'){ return submitReel(); }
  if(mode==='shots'){ return submitShots(); }
  const sel=document.querySelector('#avaPick .ava.sel');
  const avatar=sel?sel.dataset.id:'twin';
  const isTwinLook=!!(sel && sel.dataset.twinlook==='1');
  const u0=DB.user||{};
  const avObj=LOOK_BY_ID[avatar]||allAvatars().find(a=>a.id===avatar);
  const voice= isTwinLook ? (u0.twinVoiceId||'twin') : ((avObj&&avObj.voice)?avObj.voice:'twin');
  const platforms=[...document.querySelectorAll('#platPick .chip.active')].map(c=>c.textContent);
  const capSel=document.querySelector('#capPick .cap.sel');
  const caption=capSel?capSel.dataset.id:'bold';
  const captionsOn=(function(){var e=document.getElementById('rkCaptions');return e?!!e.checked:true;})();
  const emojisOn=(function(){var e=document.getElementById('rkEmojis');return (e&&captionsOn)?!!e.checked:false;})();
  const position=getPos();
  const thumbEl=document.getElementById('thumbOpt');
  const wantThumb = !!(thumbEl && thumbEl.dataset.on==='1'); // optional, credit-based for everyone
  const thumbnail = wantThumb;
  const tColor = thumbColor();
  const musicEl=document.getElementById('rkMusic');
  const music = musicEl ? !!musicEl.checked : true;
  const styleEl=document.getElementById('rkMusicStyle');
  const musicStyle = styleEl ? styleEl.value : 'surprise';
  const premiumThumb = wantThumb; // ticking the optional thumbnail renders the cinematic cover (TOKEN_THUMB credits)
  const vids=DB.videos;
  const brollFiles=(RK_BROLL&&RK_BROLL.length)?RK_BROLL.slice():[...(document.getElementById('rkBroll').files||[])];
  const brollNames=brollFiles.map(f=>f.name);
  const faceless = (avatar==='none');
  if(mode==='upload'){
    const vf=(document.getElementById('rkVideo')||{}).files; const file=vf&&vf[0];
    if(!file){ toast('Choose a video to upload'); return; }
    const v={id:id(),title:'Uploaded video',src:file.name,mode:'upload',avatar:'upload',voice:'',caption,captions:captionsOn,emojis:emojisOn,music,thumbnail,thumbColor:tColor,status:'processing',created:Date.now(),platforms};
    vids.unshift(v);
    if(CONFIG.UPLOAD_WEBHOOK) sendUpload(v,file);   // caption (Submagic) + deliver; backend wired separately
    DB.videos=vids;
    toast('<span class="ok">✓</span> Video uploaded - we\'ll add your captions and get it ready for approval');
    go('library'); return;
  }
  // Guard: don't submit a talking-avatar render against an AI twin that isn't trained yet -
  // there'd be no avatar to render, so it would silently fail. Nudge to a stock presenter instead.
  if((avatar==='twin' || isTwinLook) && !(u0.twinReady && u0.twinAvatarId)){
    toast('Your AI twin isn\'t ready yet. Pick a stock presenter below for now, or finish setting up your twin first.');
    try{ var _ap=document.getElementById('avaPick'); if(_ap && _ap.scrollIntoView) _ap.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){}
    return;
  }
  if(faceless && !brollFiles.length){ toast('Add at least one B-roll clip - it\'s required for no-avatar videos'); return; }
  if(mode==='script'){
    const full=(document.getElementById('rkScriptFull').value||'').trim();
    if(!full){ toast('Write your script first'); return; }
    const v={id:id(),title:faceless?'No-avatar video':'Your script',src:'',mode:'script',full_script:full,avatar,voice,caption,captions:captionsOn,emojis:emojisOn,avatar_position:position,thumbnail,thumbColor:tColor,music,musicStyle,makeUltra:false,premiumThumb:(premiumThumb&&!faceless),status:'processing',created:Date.now(),platforms,broll:brollNames};
    vids.unshift(v);
    if(faceless || CONFIG.SCRIPT_WEBHOOK) sendToEngine(v,brollFiles);
    DB.videos=vids;
    toast(faceless?'<span class="ok">✓</span> No-avatar video queued - we\'ll text you when it\'s ready':'<span class="ok">✓</span> Script sent - rendering now, we\'ll text you when it\'s ready');
    clearRkBroll(); go('library'); return;
  }
  const urls=document.getElementById('rkUrls').value.split('\n').map(s=>s.trim()).filter(Boolean);
  if(!urls.length){ toast('Paste at least one link'); return; }
  const script=(document.getElementById('rkScript').value||'').trim();
  urls.forEach(u=>{
    const v={id:id(),title:guessTitle(u),src:u.replace(/^https?:\/\//,''),mode:'link',avatar,voice,caption,captions:captionsOn,emojis:emojisOn,avatar_position:position,thumbnail,thumbColor:tColor,music,musicStyle,makeUltra:false,premiumThumb:(premiumThumb&&!faceless),status:'processing',created:Date.now(),platforms,script,broll:brollNames};
    vids.unshift(v);
    if(faceless || CONFIG.N8N_WEBHOOK) sendToEngine(v,brollFiles);
    simulate(v.id);
  });
  DB.videos=vids;
  const extra = (script||brollNames.length) ? ' with your script/B-roll' : '';
  toast('<span class="ok">✓</span> '+urls.length+' reel'+(urls.length>1?'s':'')+' sent'+extra+' - rendering now, we\'ll text you when it\'s ready');
  clearRkBroll(); go('library');
}
function pickPos(el){ document.querySelectorAll('#posPick .chip').forEach(x=>x.classList.remove('active')); el.classList.add('active'); }
function getPos(){ const el=document.querySelector('#posPick .chip.active'); return el?el.dataset.pos:'center'; }
function pickMode(el){
  document.querySelectorAll('#modePick .chip').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  const m=el.dataset.mode;
  document.getElementById('linkMode').style.display = m==='link'?'block':'none';
  document.getElementById('scriptMode').style.display = m==='script'?'block':'none';
  var um=document.getElementById('uploadMode'); if(um) um.style.display = m==='upload'?'block':'none';
  var cm=document.getElementById('carouselMode'); if(cm) cm.style.display = m==='carousel'?'block':'none';
  var rm=document.getElementById('reelMode'); if(rm) rm.style.display = m==='reel'?'block':'none';
  var sm=document.getElementById('shotsMode'); if(sm) sm.style.display = m==='shots'?'block':'none';
  if(m==='shots'){ var sn=document.getElementById('shotsCreditNote'); var setSn=function(){ var nn=creditBal(); if(sn) sn.innerHTML = (nn>=TOKEN_SCENE) ? ('✓ You have <b>'+nn.toLocaleString()+'</b> credits - enough for a cinematic clip ('+TOKEN_SCENE+').') : ('You have <b>'+nn.toLocaleString()+'</b> credits - a cinematic clip needs '+TOKEN_SCENE+'. <span onclick="go(\'account\')" style="color:var(--purple);cursor:pointer;font-weight:600">Add credits</span>'); }; setSn(); creditRefresh().then(setSn); }
  if(m==='carousel' && typeof renderCarouselLogo==='function') renderCarouselLogo();
  if(m==='reel'){ var bk=brandKitGet(); var rn=document.getElementById('reelBrandNote'); if(rn) rn.innerHTML = bk.logoUrl ? ('✓ Using your Brand kit - <b>'+(cwEsc(bk.brandName||'your brand'))+'</b> logo + colours.') : 'Tip: set up your <b>Brand kit</b> first so your logo and colours appear on the reel.'; reelThumbStatus(); }
  // Carousels are image slides (no avatar/voice); uploads + reels are full videos with no avatar. Hide avatar + position for all three.
  var noAvatar=(m==='upload'||m==='carousel'||m==='reel');
  var aw=document.getElementById('avaWrap'); if(aw) aw.style.display = noAvatar?'none':'';
  var pw=document.getElementById('posWrap'); if(pw) pw.style.display = noAvatar?'none':'';
  var prem=document.getElementById('premiumWrap'); if(prem){ var showPrem=(m==='link'||m==='script'); prem.style.display = showPrem?'':'none'; if(showPrem) creditRefresh(); }
  // Carousel + reel don't use the video extras (B-roll, script notes) - hide them for a clean form.
  var ex=document.querySelector('.extras'); if(ex) ex.style.display = (m==='carousel'||m==='reel'||m==='shots')?'none':'';
  var btn=document.querySelector('button.btn[onclick="submitRemake()"]'); if(btn) btn.textContent=(m==='carousel')?'Create carousel →':(m==='reel'?'Create reel →':(m==='shots'?'Create cinematic clip →':'Render the video →'));
}
function reelThumbBtns(){
  return '<div style="margin-top:9px;display:flex;gap:8px;flex-wrap:wrap">'
    + '<button type="button" onclick="go(\'account\')" style="padding:8px 14px;font-size:12.5px;font-weight:700;border:none;border-radius:9px;color:#fff;background:linear-gradient(135deg,#9B6BE0,#16A34A);cursor:pointer">Add credits</button>'
    + '</div>';
}
function reelThumbStatus(){
  var box=document.getElementById('reelThumbBox'); if(!box) return;
  var u=DB.user||{}; var email=u.email||'';
  if(!email || !CONFIG.CREDIT_BALANCE){ box.innerHTML='✨ <b>Premium thumbnails</b> - a cinematic Higgsfield cover ('+TOKEN_THUMB+' credits each), applied automatically when you have credits.'+reelThumbBtns(); return; }
  box.innerHTML='✨ Premium thumbnails - checking your credits…';
  fetch(CONFIG.CREDIT_BALANCE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
    .then(function(r){return r.json();}).then(function(d){
      var n=(d&&typeof d.available==='number')?d.available:0; creditSetBal(n);
      var head = n>=TOKEN_THUMB ? ('✨ <b>'+n.toLocaleString()+' credits</b> - your reels get a cinematic Higgsfield cover automatically ('+TOKEN_THUMB+' credits each).')
                     : ('✨ <b>'+n.toLocaleString()+' credits</b> - not quite enough for a premium cover ('+TOKEN_THUMB+' each), so reels use the free branded cover. Top up below.');
      box.innerHTML=head+reelThumbBtns();
    })
    .catch(function(){ box.innerHTML='✨ <b>Premium thumbnails</b> - cinematic Higgsfield covers ('+TOKEN_THUMB+' credits each).'+reelThumbBtns(); });
}
function sendUpload(v,file){
  const u=DB.user||{};
  try{ bumpStreak(); }catch(e){}
  // Upload the customer's own video to Cloudinary in CHUNKS - a single request fails on large 4K phone clips (which left uploads stuck "still working") - then hand the URL to the captioning pipeline (Submagic + deliver).
  cloudinaryUpload(file).then(function(res){
    var url=res&&(res.secure_url||res.url);
    if(!url){
      var em=(res&&res.error&&res.error.message)?res.error.message:'the upload didn’t complete';
      toast('Couldn’t upload “'+(v.src||'that clip')+'” - '+em+'. Tap Delete on it and try again (record at 720p if the file is very large).');
      return;
    }
    if(!CONFIG.UPLOAD_WEBHOOK) return;
    fetch(CONFIG.UPLOAD_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'upload',videoUrl:url,caption_style:v.caption||'bold',captions:(v.captions!==false),emojis:!!v.emojis,music:!!v.music,email:u.email,phone:u.phone,videoId:v.id,platforms:v.platforms})}).catch(function(){});
  }).catch(function(e){ toast('Couldn’t upload “'+(v.src||'that clip')+'”. Tap Delete and try again.'); });
}
function guessTitle(u){ const w=['Hook','Tip','Story','Lesson','Insight']; return 'New remake · '+w[Math.floor(Math.random()*w.length)]; }
function simulate(vid){ /* real status now comes from the engine via SMS; video stays in rendering until then */ }
var PLAN_LIMITS={creator:15};
function planLimit(){ var u=DB.user||{}; return PLAN_LIMITS[u.plan]||15; }
function monthCount(){ var vids=DB.videos||[]; var now=new Date(),m=now.getMonth(),y=now.getFullYear();
  return vids.filter(function(v){ var d=new Date(v.created||0); return d.getMonth()===m && d.getFullYear()===y; }).length; }
// Gate new video production: paused once the free trial ends (until they pick a plan) or the monthly plan allowance is used up. Comped accounts are never gated.
function canProduce(){
  var u=DB.user||{};
  if(u.comped) return true;
  if(u.status!=='active' && daysLeft()<=0){ toast('Your free trial has ended - pick a plan to keep creating videos.'); go('account'); return false; }
  if(monthCount() >= planLimit()){ toast('You’ve used all '+planLimit()+' videos in your plan this month - upgrade or add a video pack to make more.'); go('account'); return false; }
  return true;
}
function pingCredit(){ if(!CONFIG.CREDIT_WEBHOOK) return; var u=DB.user||{}; if(!u.email) return; var limit=PLAN_LIMITS[u.plan]||30; fetch(CONFIG.CREDIT_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,phone:u.phone,name:u.name,limit:limit})}).catch(function(){}); }
function sendToEngine(v,brollFiles){
  const u=DB.user;
  try{ bumpStreak(); }catch(e){}
  if(v.avatar==='none'){
    // No-avatar / faceless: voiceover (cloned voice) + captions over the customer's own B-roll.
    // Routed to the faceless pipeline (built separately); never hits the talking-head HeyGen engine.
    if(CONFIG.FACELESS_WEBHOOK){
      pingCredit();
      // upload the actual B-roll clips to storage first, then hand the URLs to the faceless engine
      const files=brollFiles||[];
      const ups=files.map(function(f){ const fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET);
        return fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/auto/upload',{method:'POST',body:fd}).then(r=>r.json()).then(function(x){ var url=x.secure_url||x.url||''; return url?cloudinaryTextUrl(url,f._txt,f._pos):''; }).catch(function(){return '';}); });
      Promise.all(ups).then(function(urls){
        const broll=urls.filter(Boolean);
        fetch(CONFIG.FACELESS_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'faceless',full_script:v.full_script||'',script:v.script||'',source:v.src||'',email:u.email,phone:u.phone,voice_id:(u&&u.elevenVoiceId)||'',caption_style:v.caption||'bold',captions:(v.captions!==false),emojis:!!v.emojis,thumbnail:!!v.thumbnail,thumbColor:v.thumbColor||'ffde00',music:!!v.music,music_style:v.musicStyle||'surprise',videoId:v.id,platforms:v.platforms,broll:broll})}).catch(()=>{});
      });
    }
    return;
  }
  pingCredit();   // count this render toward the monthly limit (low-credit alerts)
  // "twin" is a placeholder - resolve to this client's real HeyGen twin avatar + cloned voice
  let avatar_id=v.avatar, voice_id=v.voice||'twin';
  if(v.avatar==='twin'){ avatar_id=(u&&u.twinAvatarId)||'twin'; voice_id=(u&&u.twinVoiceId)||v.voice||''; }
  // Stock presenters are now real HeyGen look ids, so avatar_id alone is enough for any HeyGen engine.
  // The Script Engine, however, still runs on Higgsfield and animates a PHOTO rather than an avatar id -
  // it ignores avatar_id and falls back to the customer's own twin photo. So we also send the presenter's
  // permanent Cloudinary preview as image_url, which makes the chosen presenter render correctly there too.
  // (Once the Script Engine is repointed at HeyGen this line becomes harmless and can be dropped.)
  let presenter_image='';
  try{
    if(avatar_id && avatar_id!=='twin' && avatar_id!=='none'){
      var _p=(typeof STOCK_AVATARS!=='undefined'?STOCK_AVATARS:[]).find(function(a){return a && a.id===avatar_id;});
      if(_p && _p.preview) presenter_image=_p.preview;
    }
  }catch(_){}
  if(v.mode==='script'){
    fetch(CONFIG.SCRIPT_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_script:v.full_script,phone:u.phone,avatar_id:avatar_id,image_url:presenter_image,voice_id:voice_id||'',caption_style:v.caption||'bold',captions:(v.captions!==false),emojis:!!v.emojis,avatar_position:v.avatar_position||'center',thumbnail:!!v.thumbnail,premiumThumb:!!v.premiumThumb,thumbColor:v.thumbColor||'ffde00',music:!!v.music,email:u.email,videoId:v.id,platforms:v.platforms,rerender:!!v.rerender,rejectReasons:v.rejectReasons||[],rejectNote:v.rejectNote||''})}).catch(()=>{});
    return;
  }
  fetch(CONFIG.N8N_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:'https://'+v.src,phone:u.phone,avatar_id:avatar_id,image_url:presenter_image,voice_id:voice_id,caption_style:v.caption||'bold',captions:(v.captions!==false),emojis:!!v.emojis,avatar_position:v.avatar_position||'center',thumbnail:!!v.thumbnail,premiumThumb:!!v.premiumThumb,thumbColor:v.thumbColor||'ffde00',music:!!v.music,email:u.email,videoId:v.id,platforms:v.platforms,script:v.script||'',broll:v.broll||[],rerender:!!v.rerender,rejectReasons:v.rejectReasons||[],rejectNote:v.rejectNote||''})}).catch(()=>{});
}
function decide(vid,outcome){
  const v=DB.videos; const x=v.find(a=>a.id===vid); if(!x)return;
  x.status=outcome; DB.videos=v;
  // On approve, actually trigger the auto-post (same endpoint the SMS approval link hits) so it really posts.
  if(outcome==='posted' && CONFIG.DECISION){
    const u=DB.user||{};
    const url=x.outUrl||x.videoUrl||(x.src?('https://'+x.src):'');
    fetch(CONFIG.DECISION,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'decision',decision:'approve',videoId:x.id,email:u.email,videoUrl:url,caption:cleanCaption(x.captionText||'')})}).catch(function(){});
  }
  if(outcome==='posted'){ toast('<span class="ok">✓</span> Approved - posting now'); try{ celebrate(); }catch(e){} try{ bumpStreak(); }catch(e){} }
  else { toast('Rejected and discarded'); }
  go('approvals'); refreshApvBadge();
}
// ===== One-tap video player (plays inline + shows caption + approve/reject right here) =====
function videoUrlOf(x){ return (x&&(x.outUrl||x.videoUrl||(x.src?('https://'+x.src):'')))||''; }
// Strip engine markers from a caption so only the real post copy remains (no ===CAPTION===/===THUMB=== / thumbnail text).
function cleanCaption(s){ if(!s) return ''; s=String(s);
  s=s.replace(/[=*\-]{2,}\s*THUMB[A-Z]*\s*[=*\-]{0,}[\s\S]*$/i,'');   // drop the ===THUMB=== section and everything after
  s=s.replace(/^[\s\S]*?[=*\-]{2,}\s*CAPTION\s*[=*\-]{2,}\s*/i,'');   // drop a leading ===CAPTION=== header if present
  s=s.replace(/[=]{3,}/g,'');                                          // any stray === markers
  return s.trim();
}
// A poster image for a video: the real thumbnail if we have one, otherwise fall back to the
// presenter's image (twin or chosen avatar) so the player/library never shows a black box.
function posterFor(x){
  if(x&&x.thumbUrl) return x.thumbUrl;
  var u=DB.user||{};
  if((!x||!x.avatar||x.avatar==='twin') && u.twinPreview) return u.twinPreview;
  try{ if(typeof allAvatars==='function'){ var a=allAvatars().find(function(p){return p&&p.id===(x&&x.avatar);}); if(a&&(a.preview||a.img||a.face)) return a.preview||a.img||a.face; } }catch(e){}
  return u.twinPreview||'';
}
function openVideo(vid){
  var x=(DB.videos||[]).find(function(a){return a.id===vid;}); if(!x){ return; }
  var url=videoUrlOf(x);
  if(!url){ toast(x.status==='processing'?'Still rendering - we\'ll text you when it\'s ready':'No video to play yet'); return; }
  var pl=document.getElementById('vmPlayer'); pl.src=url; var _ps=posterFor(x); if(_ps){ pl.poster=_ps; } else { pl.removeAttribute('poster'); }
  document.getElementById('vmTitle').textContent=x.title||'Your video';
  var cap=cleanCaption(x.captionText); if(cap.length<3) cap='';
  var cEl=document.getElementById('vmCaption');
  var editable=(x.status==='review');
  cEl.value=cap; cEl.placeholder='(caption will appear here once it\'s generated)';
  cEl.readOnly=!editable;
  document.getElementById('vmCapLabel').style.display=editable?'block':'none';
  var sv=document.getElementById('vmCapSaved'); if(sv) sv.style.opacity='0';
  cEl.oninput=editable?function(){ var vv=DB.videos; var xx=vv.find(function(a){return a.id===vid;}); if(xx){ xx.captionText=cEl.value; DB.videos=vv; } if(sv){ sv.style.opacity='1'; clearTimeout(sv._t); sv._t=setTimeout(function(){sv.style.opacity='0';},1200);} }:null;
  var acts=document.getElementById('vmActs');
  if(x.status==='review'){
    acts.innerHTML='<button class="btn ghost" onclick="closeVideo()">Close</button>'
      +'<button class="btn ghost" style="border-color:#5a2f37;color:#e9a0a8" onclick="vmDelete(\''+x.id+'\')">Delete</button>'
      +'<button class="btn danger" style="border-color:#5a2f37" onclick="vmReject(\''+x.id+'\')">Request a change</button>'
      +'<button class="btn green" onclick="vmApprove(\''+x.id+'\')">Approve &amp; post</button>';
  } else {
    acts.innerHTML='<button class="btn ghost" onclick="closeVideo()">Close</button>'
      +'<a class="btn ghost" href="'+url+'" target="_blank" rel="noopener" download>Download</a>'
      +(cap?'<button class="btn" onclick="vmCopyCap(this,\''+x.id+'\')">Copy caption</button>':'');
  }
  document.getElementById('videoModal').classList.add('show');
  document.body.style.overflow='hidden';
  try{ pl.play(); }catch(e){}
}
function closeVideo(){ var pl=document.getElementById('vmPlayer'); if(pl){ try{pl.pause();}catch(e){} pl.removeAttribute('src'); try{pl.load();}catch(e){} } var m=document.getElementById('videoModal'); if(m)m.classList.remove('show'); document.body.style.overflow=''; }
function vmApprove(vid){ closeVideo(); decide(vid,'posted'); }
function vmReject(vid){ closeVideo(); openReject(vid); }
function vmDelete(vid){ closeVideo(); deleteVideo(vid); }
function vmCopyCap(btn,vid){ var x=(DB.videos||[]).find(function(a){return a.id===vid;}); if(!x)return; try{ navigator.clipboard.writeText(x.captionText||''); var o=btn.textContent; btn.textContent='Copied ✓'; setTimeout(function(){btn.textContent=o;},1400); }catch(e){ toast('Caption copied'); } }

let rejectingId=null;
const REJECT_REASONS=['Voice didn\'t match','Tone was off','Pacing / timing','Visuals / B-roll','Script wording','Caption style','Other'];
function openReject(vid){
  rejectingId=vid;
  document.getElementById('reasonGrid').innerHTML=REJECT_REASONS.map(r=>`<span class="reason" onclick="this.classList.toggle('sel')">${r}</span>`).join('');
  document.getElementById('rejectNote').value='';
  document.getElementById('rejectModal').classList.add('show');
}
function closeReject(){ document.getElementById('rejectModal').classList.remove('show'); rejectingId=null; }
function confirmReject(){
  const reasons=[...document.querySelectorAll('#reasonGrid .reason.sel')].map(r=>r.textContent);
  if(!reasons.length){ toast('Pick at least one reason so we can improve'); return; }
  const note=document.getElementById('rejectNote').value.trim();
  const v=DB.videos; const x=v.find(a=>a.id===rejectingId);
  if(x){
    x.rejectReasons=reasons; x.rejectNote=note;
    x.rerender=true; x.status='processing'; x.rerenderAt=Date.now();
    DB.videos=v;
    if(x.daily && CONFIG.DECISION){
      // daily-plan renders re-render through the plan's stored recipe (decision webhook), not the local engine
      const u=DB.user||{};
      fetch(CONFIG.DECISION,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'decision',decision:'reject',videoId:x.id,email:u.email,reasons:reasons,note:note})}).catch(function(){});
    } else {
      sendToEngine(x,[]);   // re-trigger the engine with the feedback applied
      simulate(x.id);       // local UI progression, mirrors a fresh generation
    }
  }
  closeReject();
  toast('<span class="ok">✓</span> Thanks - building you a new version with your changes. We\'ll text you when it\'s ready.');
  go('library'); refreshApvBadge();
}
function redo(vid){ const v=DB.videos; const x=v.find(a=>a.id===vid); if(x){x.status='processing';DB.videos=v;simulate(vid);go('library');toast('Re-running that one');} }
function retryVideo(vid){ const v=DB.videos; const x=v.find(a=>a.id===vid); if(!x)return; if(x.mode==='upload'){ go('remake'); toast('To retry an uploaded clip, re-select the file under Start content production → Upload a video.'); return; } x.status='processing'; x.created=Date.now(); x.rerender=false; x.rejectReasons=[]; x.rejectNote=''; DB.videos=v; try{ sendToEngine(x,[]); }catch(e){} startReadyPolling(); go('library'); toast('<span class="ok">✓</span> Re-rendering that one - we\'ll text you when it\'s ready'); }
function deleteVideo(vid){ const x=DB.videos.find(a=>a.id===vid); if(!x)return; if(!confirm('Delete this video? It will be removed from your library. This can\'t be undone.'))return; var u=DB.user||{}; u.deletedVideos=(u.deletedVideos||[]).concat([vid]).filter(function(z,i,a){return a.indexOf(z)===i;}); if(u.deletedVideos.length>500) u.deletedVideos=u.deletedVideos.slice(-500); u.readySeen=(u.readySeen||[]).concat([vid]).filter(function(z,i,a){return a.indexOf(z)===i;}); DB.user=u; DB.videos=DB.videos.filter(a=>a.id!==vid); try{ if(typeof syncPush==='function') syncPush(); }catch(e){} go('library'); refreshApvBadge(); toast('Video deleted'); }
function preview(vid){ openVideo(vid); }

/* ---------- social connect ---------- */
