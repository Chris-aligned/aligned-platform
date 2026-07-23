/* Aligned app module: core.twin.studio.js (split from live core.twin.js) */
function twinModal(html){
  let m=document.getElementById('twinModal');
  if(!m){ m=document.createElement('div'); m.id='twinModal';
    m.style.cssText='position:fixed;inset:0;background:rgba(5,8,14,.72);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
    m.addEventListener('click',function(e){ if(e.target===m) closeTwin(); });
    document.body.appendChild(m); }
  m.innerHTML='<div style="position:relative;width:100%;max-width:460px;max-height:88vh;overflow:auto;background:var(--card,#0e1320);border:1px solid var(--line,#1d2740);border-radius:18px;padding:24px;color:#eef2fb"><button onclick="closeTwin()" aria-label="Close" style="position:absolute;top:8px;right:12px;background:none;border:none;color:#8a96b0;font-size:24px;line-height:1;cursor:pointer;z-index:5">×</button>'+html+'</div>';
}
function closeTwin(){ try{ twinStopHandoffPoll(); }catch(e){} const m=document.getElementById('twinModal'); if(m) m.remove(); }
function openTwinCreate(addLook){
  window.__twinAddLook = !!addLook;
  if(addLook){
    twinModal(
      '<h3 style="margin:0 0 6px">Add a new look to your twin</h3>'+
      '<p style="color:var(--muted,#8a96b0);font-size:13.5px;margin:0 0 16px;line-height:1.5">Record yourself in a <b>different outfit or setting</b> - this becomes a new <b>look</b> for your existing twin (same face &amp; voice, fresh wardrobe/background). Great for pattern-interrupt across your content.</p>'+
      '<div style="background:#15102a;border:1px solid #3a2a6e;border-radius:12px;padding:13px;font-size:13px;color:#dcd5f4;margin-bottom:12px;line-height:1.5"><span style="font-size:17px">📱</span> <b>Hold your phone upright</b> and film <b>vertically</b> (9:16 - tall, like a TikTok or Reel).</div>'+
      '<div style="background:#0a0f1a;border:1px solid var(--line,#1d2740);border-radius:12px;padding:13px;font-size:12.5px;color:var(--muted,#8a96b0);margin-bottom:14px">Tips: 1–2 minutes long, good lighting, look at the camera, talk naturally, no background noise. Record at <b>720p</b>. <b>Wear something different</b> from your other looks.</div>'+
      '<input id="twinLookName" placeholder="Name this look (e.g. Navy suit, Outdoors, Casual)" style="width:100%;margin-bottom:12px"/>'+
      '<input type="file" id="twinFile" accept="video/*" style="width:100%;margin-bottom:14px;color:#eef2fb"/>'+
      '<div id="twinStatus" style="font-size:13px;color:var(--muted,#8a96b0);min-height:18px;margin-bottom:8px"></div>'+
      '<button class="btn" id="twinGo" onclick="buildTwin()" style="width:100%">Add this look →</button>'+
      '<button class="btn ghost" onclick="closeTwin()" style="width:100%;margin-top:8px">Cancel</button>'
    );
    return;
  }
  /* ===== AV81 CHANGE (2026-07-18): twin creation REPOINTED BACK TO HEYGEN =====
     The Higgsfield "Soul" creation flow (openTwinCreateSoul / buildSoul, kept below) only ever
     set twinRequested - it never set twinReady / twinAvatarId / twinVoiceId. Every render gate
     in this app requires (twinReady && twinAvatarId), so customers who finished a twin build
     were permanently told "Your AI twin isn't ready yet".
     This branch now renders the original HeyGen consent-video upload UI and calls
     buildTwin() -> maybeCompressThenUpload() -> proceedTwinUpload() -> CONFIG.TWIN_WEBHOOK
     (/webhook/create-twin), which sets twinAvatarId / twinGroupId / twinReady, opens the HeyGen
     consent screen and starts checkTwinStatus() polling.
     The Higgsfield code is intentionally RETAINED but unreachable so we can switch back by
     calling openTwinCreateSoul() from here instead. */
  twinModal(
    '<h3 style="margin:0 0 6px">Create your AI twin</h3>'+
    '<p style="color:var(--muted,#8a96b0);font-size:13.5px;margin:0 0 16px;line-height:1.5">Record <b>one video of yourself, 1 to 2 minutes long</b>, talking naturally to the camera. That single clip becomes your AI twin - your real face and your real voice. Right after, you will record a quick 10-second consent so we know it is really you.</p>'+
    '<div style="background:#15102a;border:1px solid #3a2a6e;border-radius:12px;padding:13px;font-size:13px;color:#dcd5f4;margin-bottom:12px;line-height:1.5"><span style="font-size:17px">📱</span> <b>Hold your phone upright</b> and film <b>vertically</b> (9:16 - tall, like a TikTok or Reel).</div>'+
    '<div style="background:#0a0f1a;border:1px solid var(--line,#1d2740);border-radius:12px;padding:13px;font-size:12.5px;color:var(--muted,#8a96b0);margin-bottom:14px">Tips: keep it <b>between 1 and 2 minutes</b> (shorter or longer is rejected), good light on your face, look straight at the camera, talk naturally, no background noise. Record at <b>720p</b> if you can. Say anything you like - introduce yourself or describe what you do.</div>'+
    '<input type="file" id="twinFile" accept="video/*" style="width:100%;margin-bottom:14px;color:#eef2fb"/>'+
    '<div id="twinStatus" style="font-size:13px;color:var(--muted,#8a96b0);min-height:18px;margin-bottom:8px"></div>'+
    '<button class="btn" id="twinGo" onclick="buildTwin()" style="width:100%">Build my AI twin →</button>'+
    '<button class="btn ghost" onclick="closeTwin()" style="width:100%;margin-top:8px">Cancel</button>'+
    // ---- Phone handoff (JOB 2): the twin video must be filmed vertically on a phone, but people
    // often start on a desktop. This QR (and the tappable short link) opens a lightweight record
    // page on their phone that posts to the SAME /webhook/create-twin for THIS account.
    '<div id="twinQrWrap" style="border-top:1px solid var(--line,#1d2740);margin-top:18px;padding-top:16px;text-align:center">'+
      '<div style="font-size:13px;color:#dcd5f4;margin-bottom:4px"><b>On a computer?</b> Record on your phone instead</div>'+
      '<div style="font-size:12px;color:var(--muted,#8a96b0);margin-bottom:12px;line-height:1.5">Your phone films vertically and its camera is right there. Scan this, or open the link, to record and it lands back on this account automatically.</div>'+
      '<div id="twinQr" style="display:inline-block;background:#fff;padding:10px;border-radius:12px;min-height:140px;min-width:140px"></div>'+
      '<div id="twinQrHint" style="font-size:11.5px;color:var(--muted2,#98a0b6);margin-top:10px">Loading QR code…</div>'+
      '<div id="twinQrLink" style="font-size:12px;margin-top:8px"></div>'+
    '</div>'
  );
  twinInitQrHeyGen();
  return;
}
/* AV81: Higgsfield (Soul) twin creation UI - RETAINED FOR ROLLBACK ONLY, not reachable from any button. */
function openTwinCreateSoul(){
  window.__twinAddLook = false;
  twinModal(
    '<h3 style="margin:0 0 6px">Create your AI twin</h3>'+
    '<p style="color:var(--muted,#8a96b0);font-size:13.5px;margin:0 0 16px;line-height:1.5">Upload <b>5 to 20 clear photos</b> of yourself so we can train your AI twin, then record <b>one short video reading the script below</b>. That video confirms it is really you and gives your twin your real voice.</p>'+
    '<div style="background:#15102a;border:1px solid #3a2a6e;border-radius:12px;padding:13px;font-size:13px;color:#dcd5f4;margin-bottom:12px;line-height:1.5"><span style="font-size:17px">📸</span> <b>Best results:</b> mix of angles and expressions, good light on your face, some indoor and some outdoor. Plain selfies are perfect. Face clearly visible in every shot.</div>'+
    '<label style="display:block;font-size:13px;font-weight:700;margin-bottom:6px">Your photos (5 to 20)</label>'+
    '<input type="file" id="twinPhotos" accept="image/*" multiple style="width:100%;margin-bottom:8px;color:#eef2fb"/>'+
    '<div id="twinPhotoCount" style="font-size:12px;color:var(--muted,#8a96b0);margin-bottom:14px"></div>'+
    '<label style="display:block;font-size:13px;font-weight:700;margin-bottom:6px">Read this script on camera <span style="color:#e0674f">(required)</span></label>'+
    '<div id="twinScript" style="background:#0f1730;border:1px solid #2a3a6e;border-radius:12px;padding:13px;font-size:14px;color:#eaf0ff;line-height:1.55;margin-bottom:8px;min-height:44px">Preparing your verification script…</div>'+
    '<div style="font-size:12px;color:var(--muted,#8a96b0);margin-bottom:10px">Record about 30 seconds of yourself reading the exact words above. This confirms it is really you and clones your voice.</div>'+
    '<div id="twinRecDone" style="display:none;background:#0f1b12;border:1px solid #1f5133;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#bfe9cd;margin-bottom:10px">✓ Recording saved. You can build your twin now.</div>'+
    '<button class="btn" type="button" id="twinRecBtn" onclick="twinStartRecord()" style="width:100%;margin-bottom:8px">🎥 Record now</button>'+
    '<div style="font-size:12px;color:var(--muted2,#98a0b6);text-align:center;margin-bottom:8px">or upload a video file</div>'+
    '<input type="file" id="twinVoiceClip" accept="video/*,audio/*" style="width:100%;margin-bottom:8px;color:#eef2fb"/>'+
    '<div id="twinRecPanel" style="display:none;margin-bottom:10px"></div>'+
    '<div id="twinStatus" style="font-size:13px;color:var(--muted,#8a96b0);min-height:18px;margin-bottom:8px"></div>'+
    '<button class="btn" id="twinGo" onclick="buildSoul()" style="width:100%">Build my AI twin →</button>'+
    '<button class="btn ghost" onclick="closeTwin()" style="width:100%;margin-top:8px">Cancel</button>'+
    '<div id="twinQrWrap" style="border-top:1px solid var(--line,#1d2740);margin-top:16px;padding-top:14px;text-align:center">'+
      '<div style="font-size:12.5px;color:var(--muted,#8a96b0);margin-bottom:10px">Prefer to use your phone? Scan to record on your phone.</div>'+
      '<div id="twinQr" style="display:inline-block;background:#fff;padding:10px;border-radius:12px;min-height:120px;min-width:120px"></div>'+
      '<div id="twinQrHint" style="font-size:11.5px;color:var(--muted2,#98a0b6);margin-top:8px">Loading QR code…</div>'+
    '</div>'
  );
  window.__twinConsent=null; window.__twinRecordedUrl=null; twinInitQr();
  (function(){ var sb=document.getElementById('twinScript'); var u2=DB.user||{};
    fetch(CONFIG.TWINCONSENT_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:(u2.email||''),name:(u2.name||'')})})
      .then(function(r){return r.json();}).then(function(x){ if(x&&x.script){ window.__twinConsent={consentId:x.consentId,script:x.script}; if(sb) sb.textContent=x.script; } else if(sb){ sb.textContent='Could not load your script. Please close and reopen this window.'; } })
      .catch(function(){ if(sb) sb.textContent='Could not load your script. Please check your connection and reopen this window.'; });
  })();
  window.__twinPhotos = [];
  var pc=document.getElementById('twinPhotos');
  function twinRenderPhotoCount(){
    var el=document.getElementById('twinPhotoCount'); if(!el) return;
    var arr=window.__twinPhotos||[]; var n=arr.length;
    if(!n){ el.innerHTML='You can add them all at once, or a few at a time - they stack up here.'; return; }
    var col=(n>=5?'#16a34a':'#e0674f');
    var note=(n<5?' - add '+(5-n)+' more':(n>=20?' - that is plenty':' - looks great'));
    el.innerHTML='<b style="color:'+col+'">'+n+'</b> photo'+(n===1?'':'s')+' added'+note+' &nbsp;<a href="#" onclick="twinClearPhotos();return false" style="color:var(--muted2,#98a0b6);text-decoration:underline">clear</a>';
  }
  window.twinRenderPhotoCount=twinRenderPhotoCount;
  window.twinClearPhotos=function(){ window.__twinPhotos=[]; twinRenderPhotoCount(); };
  if(pc) pc.addEventListener('change',function(){
    var arr=window.__twinPhotos||[];
    var incoming=Array.prototype.slice.call(pc.files||[]);
    incoming.forEach(function(f){
      var dup=arr.some(function(g){ return g.name===f.name && g.size===f.size && g.lastModified===f.lastModified; });
      if(!dup) arr.push(f);
    });
    if(arr.length>20) arr=arr.slice(0,20);
    window.__twinPhotos=arr;
    try{ pc.value=''; }catch(e){}
    twinRenderPhotoCount();
  });
  twinRenderPhotoCount();
}
function openTwinStudio(){ if(window.AlignedCreate){ AlignedCreate.open('talking'); return; } if(typeof asstSeed==='function'){ asstSeed('A talking video of me about '); return; } 
  var u=DB.user||{}; var email=((u.email||'')+'').trim();
  twinModal('<h3 style="margin:0 0 10px">Avatar videos</h3><div id="tsBody" style="font-size:13.5px;color:var(--muted,#8a96b0);line-height:1.5">Checking your twin…</div>');
  if(!email){ var b0=document.getElementById('tsBody'); if(b0) b0.innerHTML='Please log in first.<button class="btn ghost" onclick="closeTwin()" style="width:100%;margin-top:12px">Close</button>'; return; }
  fetch(CONFIG.TWINBUILD_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'status',email:email})})
    .then(function(r){return r.json();}).then(function(x){
      var t=(x&&x.twin)||null; var body=document.getElementById('tsBody'); if(!body) return;
      if(t && t.status==='ready'){ tsForm(body, {photo:t.photo, voiceId:t.voice_id, soulId:t.soul_id, label:'your AI twin'}); return; }
      tsChoose(body, t);
    }).catch(function(){ var b1=document.getElementById('tsBody'); if(b1) tsChoose(b1, null); });
}
function tsChoose(body, t){
  var head = !t ? 'You have not created your AI twin yet.' : (t.status==='training' ? '⏳ Your AI twin is still training from your photos and voice.' : 'Your twin needs setting up.');
  body.innerHTML='<p style="margin:0 0 6px">'+head+'</p><p style="margin:0 0 14px">Make a video now with a <b>stock presenter</b>, or <b>create your own twin</b> so it is really you.</p>'+
    '<button class="btn" onclick="tsStockPicker(document.getElementById(\'tsBody\'))" style="width:100%">Use a stock presenter →</button>'+
    '<button class="btn ghost" onclick="closeTwin();openTwinCreate()" style="width:100%;margin-top:8px">Create my own twin →</button>';
}
/* PAGINATION LESSON (read before touching this picker):
   This modal ("Avatar videos" -> "Pick a presenter") used to render (STOCK_AVATARS||[]).slice(0,30).
   STOCK_AVATARS is the FULL cached Avatar V catalogue (582 presenters, loaded by loadAvatars() from
   CONFIG.PRESENTERS_FEED) and it is sorted alphabetically, so a raw .slice(0,30) showed ONLY the first
   ~30 names - every one starting with "A" (Aaron, Aarvi, Abigail...). That looked like a truncation
   bug because it WAS one. Never render a bare .slice(N) of a sorted catalogue again. This picker now
   uses the SAME single presenter source and the SAME search / gender / favourites / lazy-image /
   "More avatars" behaviour as the main Avatar library (avaLibList / avaLibInner), so there is ONE
   presenter source, not two. If you add a third presenter picker, reuse tsStockList()/STOCK_AVATARS -
   do not fetch page one of HeyGen again. */
var __tsQuery='', __tsGender='', __tsShown=0, __TS_PAGE=60, __tsAll=false;
function tsStockList(forceAll){
  var u=DB.user||{}; var favs=(u.favorites||[]);
  var list=(STOCK_AVATARS||[]).slice();
  // Curated tier-0 set first; "More avatars" (below) flips __tsAll to reveal the extras, exactly like the main library.
  if(!forceAll && !__tsAll) list=list.filter(function(a){ return (a.tier||0)===0; });
  if(__tsQuery) list=list.filter(function(a){return (a.name||'').toLowerCase().indexOf(__tsQuery)>=0;});
  if(__tsGender==='fav') list=list.filter(function(a){ return favs.indexOf(a.name)>=0; });
  else if(__tsGender) list=list.filter(function(a){ return (a.gender||'')===__tsGender; });
  list.sort(function(a,b){ var fa=favs.indexOf(a.name)>=0?0:1, fb=favs.indexOf(b.name)>=0?0:1; if(fa!==fb)return fa-fb; return (a.name||'').localeCompare(b.name||''); });
  return list;
}
function tsStockPicker(body){
  __tsQuery=''; __tsGender=''; __tsShown=__TS_PAGE; __tsAll=false;
  if(!(STOCK_AVATARS||[]).length){ body.innerHTML='<p>Presenters are still loading. Please close and reopen in a moment.</p><button class="btn ghost" onclick="openTwinStudio()" style="width:100%;margin-top:10px">← Back</button>'; return; }
  body.innerHTML=
    '<p style="margin:0 0 10px">Pick a presenter:</p>'+
    '<input id="tsPickSearch" oninput="tsPickSearch(this.value)" placeholder="Search presenters by name…" style="width:100%;margin-bottom:8px;font-size:13px;padding:8px 10px">'+
    '<div id="tsPickFilters" style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">'+
      '<span class="chip active" data-g="" onclick="tsPickGender(this)">All</span>'+
      '<span class="chip" data-g="female" onclick="tsPickGender(this)">Women</span>'+
      '<span class="chip" data-g="male" onclick="tsPickGender(this)">Men</span>'+
      '<span class="chip" data-g="fav" onclick="tsPickGender(this)">★ Favourites</span>'+
    '</div>'+
    '<div id="tsPickGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;max-height:52vh;overflow:auto">'+tsStockGrid()+'</div>'+
    '<button class="btn ghost" onclick="openTwinStudio()" style="width:100%">← Back</button>';
}
function tsPickSearch(v){ __tsQuery=(v||'').toLowerCase().trim(); __tsShown=__TS_PAGE; var g=document.getElementById('tsPickGrid'); if(g)g.innerHTML=tsStockGrid(); }
function tsPickGender(el){ __tsGender=el.dataset.g||''; __tsShown=__TS_PAGE; var p=document.getElementById('tsPickFilters'); if(p)p.querySelectorAll('.chip').forEach(function(c){c.classList.remove('active');}); el.classList.add('active'); var g=document.getElementById('tsPickGrid'); if(g)g.innerHTML=tsStockGrid(); }
function tsPickMore(){ __tsShown+=__TS_PAGE; var g=document.getElementById('tsPickGrid'); if(g)g.innerHTML=tsStockGrid(); }
function tsPickToggleAll(){ __tsAll=!__tsAll; __tsShown=__TS_PAGE; var g=document.getElementById('tsPickGrid'); if(g){g.innerHTML=tsStockGrid(); g.scrollTop=0;} }
function tsStockGrid(){
  var list=tsStockList();
  var extra = __tsAll ? 0 : Math.max(0, tsStockList(true).length - list.length);
  var toggle='';
  if(__tsAll) toggle='<div style="grid-column:1/-1;padding:6px 2px 2px"><button class="btn ghost" style="width:100%" onclick="tsPickToggleAll()">Show fewer</button></div>';
  else if(extra) toggle='<div style="grid-column:1/-1;padding:6px 2px 2px"><button class="btn ghost" style="width:100%" onclick="tsPickToggleAll()">More avatars ('+extra+' more)</button></div>';
  if(!list.length) return '<div style="grid-column:1/-1;color:var(--muted2);font-size:13px;padding:16px 2px">No presenters match that.</div>'+toggle;
  var shown=list.slice(0,__tsShown||__TS_PAGE);
  // loading="lazy" so a 500-tile grid only fetches the images actually on screen.
  var cells=shown.map(function(a){
    var nm=((a.name||'')+'').replace(/[^A-Za-z0-9 ]/g,'');
    var img=a.preview?('<img src="'+escAttr(a.preview)+'" loading="lazy" decoding="async" alt="" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display=\'none\'">'):'';
    return '<div onclick="tsPickStock(\''+esc1(nm)+'\')" style="cursor:pointer;text-align:center"><div style="width:100%;aspect-ratio:1;border-radius:12px;border:1px solid var(--line);overflow:hidden;background:#1a2236">'+img+'</div><div style="font-size:11.5px;margin-top:4px;color:#cdd6ea">'+escAttr(nm)+'</div></div>';
  }).join('');
  if(list.length>shown.length){
    cells+='<div style="grid-column:1/-1;padding:6px 2px 2px"><button class="btn ghost" style="width:100%" onclick="tsPickMore()">Show more presenters ('+(list.length-shown.length)+' left)</button></div>';
  }
  return cells+toggle;
}
/* The "generate a brand-new stock presenter" flow (tsGenPresenter / tsDoGenPresenter, calling
   CONFIG.GENPRESENTER) was removed here on Chris's instruction: HeyGen cannot create a net-new custom
   avatar from nothing in our flow, so that control led nowhere real. The legitimate "create your AI
   twin" flow (openTwinCreate -> buildTwin -> /webhook/create-twin, which records a consent video) is a
   different thing and is intentionally left intact. Do not re-add a fake presenter generator here. */
function tsPickStock(name){
  var a=(STOCK_AVATARS||[]).find(function(x){return (((x.name||'')+'').replace(/[^A-Za-z0-9 ]/g,''))===name;}); if(!a){ return; }
  // A stock presenter is a real HeyGen avatar, so this path now goes to the HeyGen engine and gets
  // the presenter's own HeyGen voice back. That is why avatarId is carried through: it is what tells
  // tsGenerate to use HeyGen instead of Higgsfield, and the engine needs it to render the right face.
  // If we somehow have no id, refuse rather than send a video of the wrong person (see below).
  if(!a.id){
    var bx=document.getElementById('tsBody');
    if(bx) bx.innerHTML='<p style="color:#e0674f">We could not load that presenter properly. Please pick another one.</p><button class="btn ghost" onclick="tsStockPicker(document.getElementById(\'tsBody\'))" style="width:100%;margin-top:8px">← Back</button>';
    return;
  }
  // gender travels with the presenter so the engine can pick a gender-matched fallback voice if
  // HeyGen rejects this presenter's own voice (some public presenters ship a dead default voice id).
  tsForm(document.getElementById('tsBody'), {avatarId:a.id, photo:a.preview||'', voiceId:(a.voice||''), gender:(a.gender||''), soulId:'', label:name});
}
function tsForm(body,presenter){
  window.__tsPresenter=presenter||{};
  var canScroll=!!(presenter&&presenter.soulId);
  body.innerHTML=
    '<div style="background:#0f1b12;border:1px solid #1f5133;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#bfe9cd;margin-bottom:12px">✓ Presenter: <b>'+((presenter&&presenter.label)||'your presenter')+'</b>. Write the script below.</div>'+
    '<label style="display:block;font-size:13px;font-weight:700;margin-bottom:6px">What should they say?</label>'+
    '<textarea id="tsScript" placeholder="Write a short script (about 30 to 50 words), spoken to camera." style="width:100%;min-height:80px;margin-bottom:12px"></textarea>'+
    /* STYLE PICKER. Two rules learned the hard way:
       1. A radio button only makes sense when there is something to choose BETWEEN. On an account
          with no trained twin, Scroll Stopper is locked, so Simple is the only option - and a lone
          pre-ticked radio floating next to a sentence reads as broken, not as a choice. In that
          case we show Simple as a plain stated fact and drop the radio entirely.
       2. Whatever the state, the row and its text must line up. The old markup let the radio sit
          mid-row against a two-line label. Both branches below use the same bordered card so this
          section matches the rest of the app's form controls. */
    '<label style="display:block;font-size:13px;font-weight:700;margin-bottom:8px">Style</label>'+
    (canScroll
      ? /* Real choice: two properly aligned, equally weighted options. */
        '<label class="tsOpt" style="display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line,#25304a);border-radius:10px;padding:11px 12px;margin-bottom:8px;cursor:pointer">'+
          '<input type="radio" name="tsMode" value="simple" checked style="margin:2px 0 0 0;flex:none">'+
          '<span style="line-height:1.5"><b>Simple</b><br><span style="font-size:12.5px;color:var(--muted,#8a96b0)">A fast, clean talking video. Best for everyday content.</span></span>'+
        '</label>'+
        '<label class="tsOpt" style="display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line,#25304a);border-radius:10px;padding:11px 12px;margin-bottom:12px;cursor:pointer">'+
          '<input type="radio" name="tsMode" value="scroll_stopper" style="margin:2px 0 0 0;flex:none">'+
          '<span style="line-height:1.5"><b>✨ Scroll Stopper</b><br><span style="font-size:12.5px;color:var(--muted,#8a96b0)">A cinematic video with big visual effects like fire and explosions. <span style="color:#e0a24f">Uses more Aligned Credits and takes longer to render.</span></span></span>'+
        '</label>'
      : /* Only one style available: state it, no radio. The locked option is visibly greyed out and
           says exactly why, with a working way to unlock it. */
        '<div style="display:flex;gap:10px;align-items:flex-start;border:1px solid #1f5133;background:#0f1b12;border-radius:10px;padding:11px 12px;margin-bottom:8px">'+
          '<span style="color:#4ade80;font-weight:700;line-height:1.5;flex:none">✓</span>'+
          '<span style="line-height:1.5;color:#bfe9cd"><b>Simple</b><br><span style="font-size:12.5px;color:#8fc3a2">A fast, clean talking video. Best for everyday content.</span></span>'+
        '</div>'+
        '<div style="display:flex;gap:10px;align-items:flex-start;border:1px dashed var(--line,#25304a);border-radius:10px;padding:11px 12px;margin-bottom:12px;opacity:.62">'+
          '<span style="line-height:1.5;flex:none">🔒</span>'+
          '<span style="line-height:1.5"><b>✨ Scroll Stopper</b> <span style="font-size:11px;color:var(--muted2,#6b7690);border:1px solid var(--line,#25304a);border-radius:20px;padding:1px 7px;margin-left:4px;white-space:nowrap">Locked</span><br>'+
          '<span style="font-size:12.5px;color:var(--muted,#8a96b0)">Cinematic effects need your own trained twin. <span onclick="closeTwin();openTwinCreate()" style="color:var(--purple);cursor:pointer;text-decoration:underline">Create your twin</span> to unlock this style.</span></span>'+
        '</div>')+
    '<div id="tsScene" style="display:none;margin-bottom:12px"><label style="display:block;font-size:12.5px;font-weight:600;margin:8px 0 6px">Describe the scene or effect (optional)</label><input id="tsSceneInput" placeholder="e.g. standing in front of a wall of fire, sparks flying"></div>'+
    '<div id="tsStatus" style="font-size:13px;color:var(--muted,#8a96b0);min-height:18px;margin:8px 0"></div>'+
    '<button class="btn" id="tsGo" onclick="tsGenerate()" style="width:100%">Generate my video →</button>'+
    '<button class="btn ghost" onclick="openTwinStudio()" style="width:100%;margin-top:8px">← Back</button>';
  document.querySelectorAll('input[name=tsMode]').forEach(function(r){ r.addEventListener('change',function(){ var sc=document.getElementById('tsScene'); if(sc) sc.style.display=((document.querySelector('input[name=tsMode]:checked')||{}).value==='scroll_stopper')?'block':'none'; }); });
}
function tsGenerate(){
  var u=DB.user||{}; var email=((u.email||'')+'').trim();
  var script=((document.getElementById('tsScript')||{}).value||'').trim();
  var mode=((document.querySelector('input[name=tsMode]:checked')||{}).value)||'simple';
  var sceneEl=document.getElementById('tsSceneInput'); var scene=(sceneEl&&sceneEl.value||'').trim();
  var p=window.__tsPresenter||{};
  var st=document.getElementById('tsStatus'); var go=document.getElementById('tsGo');
  if(script.length<8){ st.style.color='#e0674f'; st.textContent='Please write a short script first.'; return; }
  go.disabled=true; go.style.opacity=.6; st.style.color='var(--muted,#8a96b0)'; st.textContent='Sending your video to the engine…';
  var videoId='twin_'+Date.now();
  // TWO ENGINES, picked by what we actually know about the presenter:
  //  * A stock presenter is a genuine HeyGen avatar - we have its avatar id and its HeyGen voice -
  //    so it goes to the HeyGen engine, which is faster and sounds like the presenter you picked.
  //  * An AI-generated presenter is only a photo. There is no HeyGen avatar behind it, so it stays
  //    on the Higgsfield engine, which can animate a bare photo. Do not "tidy" these into one call.
  // The presence of avatarId is the switch.
  var useHeyGen = !!(p.avatarId && String(p.avatarId).trim());
  var endpoint, payload;
  if(useHeyGen){
    // The HeyGen engine treats every field as optional, so a missing avatarId would silently render
    // Chris's own twin and mail a stranger's face to the customer. Never send this call without one.
    endpoint=CONFIG.HGAVATAR_WEBHOOK;
    payload={ avatarId:String(p.avatarId).trim(), voiceId:(p.voiceId||''), gender:(p.gender||''), script:script, email:email,
              videoId:videoId, aspect:'9:16', callbackUrl:CONFIG.TWINDELIVER };
  } else {
    endpoint=CONFIG.HFAVATAR_WEBHOOK;
    payload={email:email, mode:mode, script:script, scene:scene, videoId:videoId, callbackUrl:CONFIG.TWINDELIVER};
    if(p.photo) payload.photo=p.photo;
    if(p.voiceId) payload.voiceId=p.voiceId;
    if(p.soulId) payload.soulId=p.soulId;
  }
  // Create the Library record with status 'processing' BEFORE calling the engine (like the script/link/upload paths) so Rendering shows immediately, checkReadyVideos() can flip it to review, and the customer gets a Retry option if it stalls.
  var vrec={ id:videoId, title:'Talking video'+((p&&p.label)?(' · '+p.label):''), src:'', mode:'twin',
             avatar:(useHeyGen?'stock':'twin'), presenter:((p&&p.label)||''), status:'processing',
             created:Date.now(), scrollStopper:(mode==='scroll_stopper') };
  try{ var _vs=DB.videos||[]; _vs.unshift(vrec); DB.videos=_vs; }catch(e){}
  // Both engines are fire-and-forget: they answer immediately and post the finished video to callbackUrl later. We read the reply and only mark success when the engine has accepted the render.
  function tsFail(msg){
    // Don't leave a phantom "Rendering" card for a render that was never accepted.
    try{ DB.videos=(DB.videos||[]).filter(function(x){ return x.id!==videoId; }); }catch(e){}
    st.style.color='#e0674f';
    st.textContent=msg||'Something went wrong sending your video. Please try again.';
    go.disabled=false; go.style.opacity=1; go.textContent='Generate my video →';
  }
  fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    .then(function(r){
      if(!r.ok) throw new Error('http '+r.status);
      return r.json().catch(function(){ return {ok:true}; }); // some engines answer with an empty body
    })
    .then(function(res){
      if(res && res.ok===false){ tsFail(res.error ? ('We could not start that video: '+res.error) : 'We could not start that video. Please try a different presenter or try again.'); return; }
      st.style.color='#16a34a';
      st.innerHTML='✓ Your '+(mode==='scroll_stopper'?'Scroll Stopper':'Simple')+' video is rendering. You can watch for it under <b>Library → Rendering</b>, and we will email it to you the moment it is ready'+(mode==='scroll_stopper'?'. Cinematic videos take a bit longer.':'.');
      go.textContent='Sent ✓';
      try{ startReadyPolling(); }catch(e){}
      setTimeout(function(){ closeTwin(); try{ goLib('processing'); }catch(e){} }, 3200);
    })
    .catch(function(){ tsFail(); });
}
/* ---------- Webcam recorder (shared: twin-create modal + phone handoff) ---------- */
