/* Aligned app module: core.twin.record.js (split from live core.twin.js) */
var __rec={ stream:null, recorder:null, chunks:[], timer:null, secs:0 };
function twEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }
function recTeardown(){
  try{ if(__rec.recorder && __rec.recorder.state!=='inactive') __rec.recorder.stop(); }catch(_){}
  try{ if(__rec.stream){ __rec.stream.getTracks().forEach(function(t){ t.stop(); }); } }catch(_){}
  if(__rec.timer){ clearInterval(__rec.timer); __rec.timer=null; }
  __rec.stream=null; __rec.recorder=null; __rec.chunks=[]; __rec.secs=0;
}
function recFail(container, opts, err){
  var denied=(err && (err.name==='NotAllowedError'||err.name==='SecurityError'||err.name==='PermissionDeniedError'));
  var msg=denied ? 'We could not use your camera. Please allow camera and microphone access in your browser, then try again, or upload a video file instead.' : 'No camera or microphone was found. Please upload a video file instead.';
  container.innerHTML='<div style="background:#2a1518;border:1px solid #6e2a2a;border-radius:12px;padding:14px;font-size:13px;color:#f2c9c9;line-height:1.5;margin-bottom:12px">'+msg+'</div>'+
    '<button class="btn ghost" id="recBack" style="width:100%">← Back</button>';
  var b=container.querySelector('#recBack'); if(b) b.onclick=function(){ if(opts&&opts.onCancel) opts.onCancel(); else { recTeardown(); container.style.display='none'; container.innerHTML=''; } };
}
function recRender(container, onAccept, opts){
  opts=opts||{};
  container.innerHTML=
    '<div style="position:relative;border-radius:14px;overflow:hidden;background:#05070d;border:1px solid var(--line,#1d2740);margin-bottom:10px">'+
      '<video id="recVideo" autoplay muted playsinline style="width:100%;display:block;max-height:52vh;background:#05070d"></video>'+
      '<div id="recTimer" style="position:absolute;top:8px;right:10px;background:rgba(0,0,0,.6);color:#fff;font-size:12.5px;font-weight:700;padding:3px 9px;border-radius:20px;display:none">0:00</div>'+
    '</div>'+
    '<div style="background:#15102a;border:1px solid #3a2a6e;border-radius:10px;padding:10px 12px;font-size:12.5px;color:#dcd5f4;margin-bottom:10px;line-height:1.5">'+(opts.guide||'Read the script out loud, looking at the camera. Aim for about 30 seconds. Tap <b>Record</b> to start and <b>Stop</b> when you are done.')+'</div>'+
    '<div id="recStatus" style="font-size:12.5px;color:var(--muted,#8a96b0);min-height:16px;margin-bottom:8px"></div>'+
    '<div id="recControls"><div style="font-size:13px;color:var(--muted,#8a96b0);text-align:center;padding:6px 0">Starting your camera…</div></div>';
  var video=container.querySelector('#recVideo');
  var controls=container.querySelector('#recControls');
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ recFail(container, opts); return; }
  navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:true }).then(function(stream){
    __rec.stream=stream; try{ video.srcObject=stream; }catch(_){ video.src=URL.createObjectURL(stream); } video.muted=true;
    controls.innerHTML='<button class="btn" id="recStart" style="width:100%">● Record</button>';
    var s=container.querySelector('#recStart'); if(s) s.onclick=function(){ recStart(container, onAccept, opts); };
  }).catch(function(err){ recFail(container, opts, err); });
}
function recStart(container, onAccept, opts){
  var controls=container.querySelector('#recControls');
  var timerEl=container.querySelector('#recTimer');
  var statusEl=container.querySelector('#recStatus');
  __rec.chunks=[]; __rec.secs=0;
  var mime='';
  try{ if(window.MediaRecorder && MediaRecorder.isTypeSupported){ if(MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) mime='video/webm;codecs=vp9,opus'; else if(MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) mime='video/webm;codecs=vp8,opus'; else if(MediaRecorder.isTypeSupported('video/webm')) mime='video/webm'; else if(MediaRecorder.isTypeSupported('video/mp4')) mime='video/mp4'; } }catch(_){}
  try{ __rec.recorder = mime ? new MediaRecorder(__rec.stream,{ mimeType:mime }) : new MediaRecorder(__rec.stream); }
  catch(e){ try{ __rec.recorder=new MediaRecorder(__rec.stream); }catch(e2){ recFail(container, opts, e2); return; } }
  __rec.recorder.ondataavailable=function(e){ if(e.data && e.data.size) __rec.chunks.push(e.data); };
  __rec.recorder.onstop=function(){ recShowPlayback(container, onAccept, opts); };
  __rec.recorder.start();
  if(timerEl){ timerEl.style.display='block'; timerEl.textContent='0:00'; }
  var nudgeAt=(opts&&opts.minSecs)||25;
  __rec.timer=setInterval(function(){ __rec.secs++; var mm=Math.floor(__rec.secs/60), ss=__rec.secs%60; if(timerEl) timerEl.textContent=mm+':'+(ss<10?'0':'')+ss; if(__rec.secs===nudgeAt && statusEl){ statusEl.style.color='#7ee0a8'; statusEl.textContent='Nice, that’s enough - you can stop any time now (up to 2 minutes).'; } if(__rec.secs>=120){ recStop(); } }, 1000);
  controls.innerHTML='<button class="btn" id="recStop" style="width:100%;background:#c0392b;border-color:#c0392b">■ Stop</button>';
  var st=container.querySelector('#recStop'); if(st) st.onclick=function(){ recStop(); };
}
function recStop(){ if(__rec.timer){ clearInterval(__rec.timer); __rec.timer=null; } try{ if(__rec.recorder && __rec.recorder.state!=='inactive') __rec.recorder.stop(); }catch(_){} }
function recShowPlayback(container, onAccept, opts){
  var mime=(__rec.recorder && __rec.recorder.mimeType)||'video/webm';
  var blob=new Blob(__rec.chunks,{ type:mime });
  var url=URL.createObjectURL(blob);
  try{ if(__rec.stream){ __rec.stream.getTracks().forEach(function(t){ t.stop(); }); __rec.stream=null; } }catch(_){}
  container.innerHTML=
    '<div style="border-radius:14px;overflow:hidden;background:#05070d;border:1px solid var(--line,#1d2740);margin-bottom:10px"><video src="'+url+'" controls playsinline style="width:100%;display:block;max-height:52vh"></video></div>'+
    '<div style="font-size:12.5px;color:var(--muted,#8a96b0);margin-bottom:10px">Happy with it? Tap <b>Use this</b>. Want another take? Tap <b>Redo</b>.</div>'+
    '<button class="btn" id="recUse" style="width:100%">Use this ✓</button>'+
    '<button class="btn ghost" id="recRedo" style="width:100%;margin-top:8px">↺ Redo</button>'+
    ((opts&&opts.onCancel)?'<button class="btn ghost" id="recCancel" style="width:100%;margin-top:8px">Cancel</button>':'');
  var u=container.querySelector('#recUse'); if(u) u.onclick=function(){ onAccept(blob); };
  var r=container.querySelector('#recRedo'); if(r) r.onclick=function(){ recRender(container, onAccept, opts); };
  var c=container.querySelector('#recCancel'); if(c && opts && opts.onCancel) c.onclick=function(){ recTeardown(); opts.onCancel(); };
}
function recUpload(blob, email, cb, errcb){
  var pid='twinrec_'+String(email||('u'+Date.now())).replace(/[^a-z0-9]/gi,'')+'_'+Date.now();
  var fd=new FormData(); fd.append('file',blob,'consent.webm'); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET); fd.append('public_id',pid);
  fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/video/upload',{ method:'POST', body:fd })
    .then(function(r){ return r.json(); }).then(function(x){ var url=(x&&(x.secure_url||x.url))||''; if(url) cb(url); else if(errcb) errcb(); }).catch(function(){ if(errcb) errcb(); });
}
/* Twin-create modal: record flow */
function twinStartRecord(){
  var panel=document.getElementById('twinRecPanel'); if(!panel) return;
  var btn=document.getElementById('twinRecBtn'); if(btn) btn.style.display='none';
  var qr=document.getElementById('twinQrWrap'); if(qr) qr.style.display='none';
  panel.style.display='block';
  var u=DB.user||{};
  recRender(panel, function(blob){
    panel.innerHTML='<div style="font-size:13px;color:var(--muted,#8a96b0);padding:10px 0;text-align:center">Saving your recording…</div>';
    recUpload(blob,(u.email||''),function(url){
      window.__twinRecordedUrl=url;
      var d=document.getElementById('twinRecDone'); if(d) d.style.display='block';
      var vc=document.getElementById('twinVoiceClip'); if(vc){ try{ vc.value=''; }catch(_){}}
      panel.style.display='none'; panel.innerHTML='';
      if(btn) btn.style.display=''; if(btn) btn.textContent='🎥 Record again';
    }, function(){
      panel.innerHTML='<div style="color:#e0674f;font-size:13px;padding:8px 0;text-align:center">Upload failed. Please try again or upload a file.</div><button class="btn ghost" style="width:100%" onclick="twinCancelRecord()">Back</button>';
    });
  }, { onCancel: twinCancelRecord });
}
function twinCancelRecord(){
  recTeardown();
  var panel=document.getElementById('twinRecPanel'); if(panel){ panel.style.display='none'; panel.innerHTML=''; }
  var btn=document.getElementById('twinRecBtn'); if(btn) btn.style.display='';
  var qr=document.getElementById('twinQrWrap'); if(qr) qr.style.display='';
}
/* Twin-create modal: QR handoff to phone */
function twinInitQr(){
  var wrap=document.getElementById('twinQr'); var hint=document.getElementById('twinQrHint'); if(!wrap) return;
  if(typeof CONFIG==='undefined' || !CONFIG.HANDOFF_WEBHOOK || typeof QRCode==='undefined'){ var w0=document.getElementById('twinQrWrap'); if(w0) w0.style.display='none'; return; }
  var u=DB.user||{};
  fetch(CONFIG.HANDOFF_WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ op:'create', email:(u.email||''), name:(u.name||'') }) })
    .then(function(r){ return r.json(); }).then(function(x){
      var token=x&&x.token; if(!token){ if(hint) hint.textContent='Phone handoff is unavailable right now.'; return; }
      if(x.consentScript){ window.__twinConsent={ consentId:x.consentId, script:x.consentScript }; var sb=document.getElementById('twinScript'); if(sb && /Preparing/.test(sb.textContent||'')) sb.textContent=x.consentScript; }
      var link=location.origin+location.pathname+'?twinrec='+encodeURIComponent(token);
      wrap.innerHTML='';
      try{ new QRCode(wrap,{ text:link, width:120, height:120, correctLevel:QRCode.CorrectLevel.M }); if(hint) hint.textContent='Scan with your phone camera'; }
      catch(e){ wrap.innerHTML='<a href="'+link+'" style="color:var(--purple);font-size:12px">Open on your phone</a>'; if(hint) hint.textContent=''; }
    }).catch(function(){ if(hint) hint.textContent='Phone handoff is unavailable right now.'; });
}
/* ===== JOB 2: QR phone handoff for the LIVE HeyGen twin flow =====
   Desktop mints a short-lived token (30 min) bound to THIS logged-in email via /webhook/twin-handoff
   op=create. The QR / link opens ?twinrec=TOKEN on the phone. The phone records a 1-2 min vertical
   clip, posts it to the SAME /webhook/create-twin (so the HeyGen twin is created), then writes the
   result (avatar_id/group_id/consent_url) back to the token via op=save. This desktop poller reads
   op=resolve until it sees the twin, then continues into the normal consent + polling flow.
   Identity is carried ENTIRELY by the server-minted token - the phone never needs the password. */
var __twinHandoffPoll=null, __twinHandoffToken=null;
function twinStopHandoffPoll(){ if(__twinHandoffPoll){ clearInterval(__twinHandoffPoll); __twinHandoffPoll=null; } }
function twinInitQrHeyGen(){
  var wrap=document.getElementById('twinQr'); var hint=document.getElementById('twinQrHint'); var linkEl=document.getElementById('twinQrLink');
  if(!wrap) return;
  twinStopHandoffPoll();
  if(typeof CONFIG==='undefined' || !CONFIG.HANDOFF_WEBHOOK){ var w0=document.getElementById('twinQrWrap'); if(w0) w0.style.display='none'; return; }
  var u=DB.user||{};
  if(!((u.email||'')+'').trim()){ if(hint) hint.textContent='Log in first to record on your phone.'; return; }
  fetchTimeout(CONFIG.HANDOFF_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ op:'create', email:(u.email||''), name:(u.name||'') })},20000,'handoff')
    .then(function(r){ return r.json(); }).then(function(x){
      var token=x&&x.token; if(!token){ if(hint) hint.textContent='Phone handoff is unavailable right now - you can still upload above.'; return; }
      __twinHandoffToken=token;
      var link=location.origin+location.pathname+'?twinrec='+encodeURIComponent(token);
      wrap.innerHTML='';
      var haveQr=false;
      try{ if(typeof QRCode!=='undefined'){ new QRCode(wrap,{ text:link, width:140, height:140, correctLevel:QRCode.CorrectLevel.M }); haveQr=true; } }catch(e){}
      if(!haveQr){ wrap.style.display='none'; }
      if(hint) hint.textContent = haveQr ? 'Scan with your phone camera - this screen updates itself when your phone is done.' : 'Open the link below on your phone.';
      if(linkEl){ linkEl.innerHTML='<a href="'+link+'" target="_blank" rel="noopener" style="color:var(--purple);text-decoration:underline;word-break:break-all">Open the phone record page</a>'; }
      twinPollHandoff(token);
    }).catch(function(){ if(hint) hint.textContent='Phone handoff is unavailable right now - you can still upload above.'; });
}
function twinPollHandoff(token){
  twinStopHandoffPoll();
  var hint=document.getElementById('twinQrHint');
  __twinHandoffPoll=setInterval(function(){
    if(!document.getElementById('twinModal')){ twinStopHandoffPoll(); return; } // modal closed
    fetch(CONFIG.HANDOFF_WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ op:'resolve', token:token }) })
      .then(function(r){ return r.json(); }).then(function(d){
        if(!d) return;
        if(d.twinError){ twinStopHandoffPoll(); if(hint){ hint.style.color='#ff6b6b'; hint.textContent='Your phone recording could not be built: '+d.twinError+'. Please try again.'; } return; }
        if(d.done && d.avatar_id){
          twinStopHandoffPoll();
          var user=DB.user||{};
          user.twinAvatarId=d.avatar_id; user.twinGroupId=d.group_id; user.twinConsentUrl=d.consent_url||''; user.twinReady=false; user.twinConsentPending=true; user.twinConsentReminderSent=false; if(d.videoUrl) user.twinVideoUrl=d.videoUrl; DB.user=user;
          startTwinPolling();
          openTwinConsent(); // shows the consent link on desktop too; the phone also offers it
          return;
        }
        if(d.recording){ if(hint){ hint.style.color='#7ee0a8'; hint.textContent='Recording on your phone… keep going, this screen will update itself.'; } }
      }).catch(function(){});
  }, 4000);
}
/* Shared confirmation state */
function twinBuildingHtml(){
  return '<div style="text-align:center;padding:8px 0">'+
    '<div style="font-size:42px;margin-bottom:8px">🎬</div>'+
    '<h3 style="margin:0 0 8px;font-size:20px">Your AI twin is building</h3>'+
    '<p style="color:var(--muted,#8a96b0);font-size:14px;line-height:1.6;margin:0">We are creating your twin now. We will email and text you the moment it is ready, usually within a few minutes. You can close this window.</p>'+
    '</div>';
}
/* Phone handoff landing: ?twinrec=TOKEN opens a minimal record screen */
function checkTwinRec(){
  var m=(location.search||'').match(/[?&]twinrec=([^&]+)/); if(!m) return false;
  var token=decodeURIComponent(m[1]);
  window.__phToken=token; // carried into the create-twin + handoff-save calls to tie the twin to the right account
  try{ var as=document.getElementById('authScreen'); if(as) as.style.display='none'; }catch(_){}
  try{ var ap=document.getElementById('app'); if(ap) ap.classList.remove('show'); }catch(_){}
  var host=document.createElement('div'); host.id='twinRecHost';
  host.style.cssText='position:fixed;inset:0;z-index:99999;background:#080b12;overflow:auto;padding:18px;color:#eef2fb';
  host.innerHTML='<div style="max-width:440px;margin:0 auto"><div style="text-align:center;margin-bottom:16px;font-weight:800;letter-spacing:.16em;color:#9B6BE0;font-size:13px">ALIGNED WEB SERVICES</div><div id="phRecBody"><div style="text-align:center;color:#8a96b0;font-size:14px;padding:34px 0">Loading your recording session…</div></div></div>';
  document.body.appendChild(host);
  if(typeof CONFIG==='undefined' || !CONFIG.HANDOFF_WEBHOOK){ document.getElementById('phRecBody').innerHTML=phErr('This link is unavailable.'); return true; }
  fetch(CONFIG.HANDOFF_WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ op:'resolve', token:token }) })
    .then(function(r){ return r.json(); }).then(function(x){
      var body=document.getElementById('phRecBody'); if(!body) return;
      if(!x || x.error || !x.email){ body.innerHTML=phErr('This recording link has expired. Please reopen the QR code on your computer to get a fresh one.'); return; }
      phRenderRecord(x);
    }).catch(function(){ var b=document.getElementById('phRecBody'); if(b) b.innerHTML=phErr('Something went wrong loading this link. Please reopen the QR code on your computer.'); });
  return true;
}
function phErr(msg){ return '<div style="background:#2a1518;border:1px solid #6e2a2a;border-radius:12px;padding:16px;font-size:14px;color:#f2c9c9;line-height:1.5;text-align:center">'+twEsc(msg)+'</div>'; }
// Phone record page for the HeyGen twin (JOB 2). Records/uploads a 1-2 min vertical clip, posts it
// to the SAME /webhook/create-twin as the desktop, then writes the twin result back to the handoff
// token (op=save) so the desktop that opened the QR picks it up automatically.
function phPing(recording){
  try{ if(window.__phToken && CONFIG.HANDOFF_WEBHOOK) fetch(CONFIG.HANDOFF_WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ op:'save', token:window.__phToken, recording:!!recording }) }); }catch(e){}
}
function phRenderRecord(info){
  window.__phInfo=info;
  phPing(true); // tell the desktop the phone is on the record screen (shows "Recording on your phone…")
  var body=document.getElementById('phRecBody');
  body.innerHTML=
    '<h2 style="margin:0 0 6px;font-size:20px">Record your AI twin video</h2>'+
    '<p style="color:#8a96b0;font-size:13.5px;margin:0 0 12px;line-height:1.5">Hi '+(twEsc(info.name)||'there')+' - hold your phone <b>upright</b> and record <b>1 to 2 minutes</b> of yourself talking naturally to the camera. Good light on your face, look at the lens. Say anything: introduce yourself or describe what you do.</p>'+
    '<div id="phRecPanel"></div>'+
    '<div style="text-align:center;color:#5c6680;font-size:12px;margin:12px 0 6px">or</div>'+
    '<label class="btn ghost" style="width:100%;display:block;text-align:center;cursor:pointer">Upload a video from your phone<input type="file" id="phFile" accept="video/*" style="display:none"></label>'+
    '<div id="phRecStatus" style="font-size:13px;color:#8a96b0;min-height:18px;margin-top:10px;text-align:center"></div>';
  var panel=document.getElementById('phRecPanel');
  recRender(panel, function(blob){
    var st=document.getElementById('phRecStatus'); if(st){ st.style.color='#8a96b0'; st.textContent='Uploading your video…'; }
    recUpload(blob, info.email, function(url){ phSubmitTwin(url); }, function(){ var s2=document.getElementById('phRecStatus'); if(s2){ s2.style.color='#ff6b6b'; s2.textContent='Upload failed. Please tap Redo and try again.'; } });
  }, { guide:'Hold your phone upright. Tap <b>Record</b>, talk naturally for 1 to 2 minutes, then tap <b>Stop</b>.', minSecs:60 });
  var fileInp=document.getElementById('phFile');
  if(fileInp) fileInp.addEventListener('change', function(){
    var f=fileInp.files&&fileInp.files[0]; if(!f) return;
    var st=document.getElementById('phRecStatus'); if(st){ st.style.color='#8a96b0'; st.textContent='Checking your video…'; }
    var vid=document.createElement('video'); vid.preload='metadata'; var settled=false;
    var guard=setTimeout(function(){ if(settled)return; settled=true; phUploadFile(f); },10000);
    vid.onloadedmetadata=function(){ if(settled)return; settled=true; clearTimeout(guard); try{URL.revokeObjectURL(vid.src);}catch(e){} var d=vid.duration||0;
      if(isFinite(d)&&d>0&&d<45){ if(st){ st.style.color='#ff6b6b'; st.textContent='That clip is only '+Math.round(d)+' seconds - please record at least a minute.'; } return; }
      if(isFinite(d)&&d>150){ if(st){ st.style.color='#ff6b6b'; st.textContent='That clip is over 2.5 minutes - please keep it to about 2 minutes.'; } return; }
      phUploadFile(f); };
    vid.onerror=function(){ if(settled)return; settled=true; clearTimeout(guard); phUploadFile(f); };
    vid.src=URL.createObjectURL(f);
  });
}
function phUploadFile(f){
  var st=document.getElementById('phRecStatus'); if(st){ st.style.color='#8a96b0'; st.textContent='Uploading your video…'; }
  cloudinaryUpload(f, function(pct){ if(st) st.textContent='Uploading your video… '+pct+'%'; })
    .then(function(up){ var url=up&&(up.secure_url||up.url); if(!url){ if(st){ st.style.color='#ff6b6b'; st.textContent='Upload failed. Please try again.'; } return; } phSubmitTwin(url); })
    .catch(function(){ if(st){ st.style.color='#ff6b6b'; st.textContent='Upload stalled. Please try again on a stronger connection.'; } });
}
function phSubmitTwin(url){
  var info=window.__phInfo||{};
  var st=document.getElementById('phRecStatus'); if(st){ st.style.color='#8a96b0'; st.textContent='Building your AI twin… this can take a moment.'; }
  var hg=heygenUrl(url);
  var reqBody={ name:((info.name||'My')+' Twin'), email:info.email||'', videoUrl:hg };
  fetch(hg,{mode:'no-cors'}).catch(function(){}).then(function(){
    return fetchTimeout(CONFIG.TWIN_WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(reqBody) },90000,'build')
      .then(function(r){ return r.json(); }).then(function(res){
        if(!res || !res.avatar_id){
          var em=(res&&res.message)?res.message:'We could not build your twin. Make sure your face is clearly visible and well lit, then try again.';
          if(st){ st.style.color='#ff6b6b'; st.textContent=em; }
          try{ if(window.__phToken) fetch(CONFIG.HANDOFF_WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ op:'save', token:window.__phToken, error:em }) }); }catch(e){}
          return;
        }
        // hand the result back to the desktop that opened the QR
        try{ fetch(CONFIG.HANDOFF_WEBHOOK,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ op:'save', token:(window.__phToken||''), avatar_id:res.avatar_id, group_id:res.group_id, consent_url:res.consent_url||'', videoUrl:url }) }); }catch(e){}
        phConsent(res.consent_url||'');
      });
  }).catch(function(){ if(st){ st.style.color='#ff6b6b'; st.textContent='Something went wrong building your twin. Please try again.'; } });
}
function phConsent(consentUrl){
  var b=document.getElementById('phRecBody'); if(!b) return;
  var btn = consentUrl ? ('<a class="btn" href="'+twEsc(consentUrl)+'" target="_blank" rel="noopener" style="width:100%;display:block;text-align:center;text-decoration:none;margin-bottom:10px">Confirm it’s you →</a>') : '';
  b.innerHTML=
    '<div style="text-align:center">'+
    '<div style="font-size:42px;margin-bottom:8px">✅</div>'+
    '<h2 style="margin:0 0 8px;font-size:20px">Almost done</h2>'+
    '<p style="color:#8a96b0;font-size:14px;line-height:1.6;margin:0 0 16px">Tap below to record a quick 10-second consent confirming it is really you. Then your twin finishes building - you can head back to your computer, it updates there automatically.</p>'+
    btn+
    '<div style="font-size:12.5px;color:#5c6680;margin-top:6px">You can close this window once you have confirmed.</div>'+
    '</div>';
}
function phDone(){ var b=document.getElementById('phRecBody'); if(b) b.innerHTML=twinBuildingHtml(); }

function buildSoul(){
  var inp=document.getElementById('twinPhotos');
  var files=(window.__twinPhotos&&window.__twinPhotos.length)?window.__twinPhotos.slice():Array.prototype.slice.call((inp&&inp.files)||[]);
  var st=document.getElementById('twinStatus');
  var go=document.getElementById('twinGo');
  if(files.length<5){ st.style.color='#e0674f'; st.textContent='Please add at least 5 photos (up to 20).'; return; }
  if(files.length>20) files=files.slice(0,20);
  var vcEl0=document.getElementById('twinVoiceClip'); var vfile0=(vcEl0&&vcEl0.files&&vcEl0.files[0])||null;
  if(!vfile0 && !window.__twinRecordedUrl){ st.style.color='#e0674f'; st.textContent='Please record your verification video (or upload one) before building your twin.'; return; }
  var u=DB.user||{}; var email=(u.email||'').trim();
  go.disabled=true; go.style.opacity=.6; st.style.color='var(--muted,#8a96b0)';
  var urls=[]; var done=0; st.innerHTML='Uploading your photos… <b>0/'+files.length+'</b>';
  function up(f){
    var pid='twin_'+String(email||('u'+Date.now())).replace(/[^a-z0-9]/gi,'')+'_'+Date.now()+'_'+Math.floor(Math.random()*99999);
    var fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET); fd.append('public_id',pid);
    return fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/image/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(x){ var url=(x&&(x.secure_url||x.url))||''; if(url) urls.push(url); done++; st.innerHTML='Uploading your photos… <b>'+done+'/'+files.length+'</b>'; }).catch(function(){ done++; });
  }
  Promise.all(files.map(up)).then(function(){
    if(urls.length<5){ st.style.color='#e0674f'; st.textContent='Some photos did not upload. Please try again with JPG or PNG.'; go.disabled=false; go.style.opacity=1; return; }
    function submit(voiceUrl){
      st.style.color='var(--muted,#8a96b0)'; st.textContent='Building your AI twin…';
      fetch(CONFIG.TWINBUILD_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email, name:(u.name||''), photos:urls, voiceClip:(voiceUrl||''), consentId:((window.__twinConsent||{}).consentId||''), consentScript:((window.__twinConsent||{}).script||'')})})
        .then(function(){
          var uu=DB.user||{}; uu.twinRequested=true; uu.twinPhotoCount=urls.length; DB.user=uu;
          window.__twinRecordedUrl=null; window.__twinPhotos=[];
          twinModal(twinBuildingHtml()+'<button class="btn" onclick="closeTwin()" style="width:100%;margin-top:16px">Close</button>');
        })
        .catch(function(){ st.style.color='#e0674f'; st.textContent='Something went wrong sending your twin. Please try again.'; go.disabled=false; go.style.opacity=1; });
    }
    if(window.__twinRecordedUrl){ submit(window.__twinRecordedUrl); return; }
    var vc=document.getElementById('twinVoiceClip'); var vf=(vc&&vc.files&&vc.files[0])||null;
    if(vf){ st.textContent='Uploading your voice clip…';
      var vpid='twinvoice_'+String(email||'u').replace(/[^a-z0-9]/gi,'')+'_'+Date.now();
      var vfd=new FormData(); vfd.append('file',vf); vfd.append('upload_preset',CONFIG.CLOUDINARY_PRESET); vfd.append('public_id',vpid);
      fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/video/upload',{method:'POST',body:vfd}).then(function(r){return r.json();}).then(function(x){ submit((x&&(x.secure_url||x.url))||''); }).catch(function(){ submit(''); });
    } else { submit(''); }
  });
}
// Show a twin-modal status message. Errors are RED and bold so they can never be
// mistaken for "nothing happened" - the recurring "it just didn't work" complaint was
// partly this text being the same muted grey as ordinary progress. ok=true = normal progress.
function twSay(st, html, ok){
  if(!st) return;
  st.style.color = ok ? 'var(--muted,#8a96b0)' : '#ff6b6b';
  st.style.fontWeight = ok ? '400' : '700';
  st.innerHTML = html;
}
function buildTwin(){
  const f=document.getElementById('twinFile').files[0];
  const st=document.getElementById('twinStatus');
  const go=document.getElementById('twinGo');
  if(!f){ twSay(st,'Choose a video first (tap “Choose File” above).',false); return; }
  if(f.size > 2*1024*1024*1024){ twSay(st,'That clip is over 2GB - please record at 720p (1–2 minutes) and try again.',false); return; }
  twSay(st,'Checking your clip…',true);
  // Validate duration: aim for 1–2 minutes. We allow a little slack (55s–2m10s) so a clip a
  // couple of seconds over/under "2 minutes" is not bounced with a message that is easy to miss.
  const vid=document.createElement('video'); vid.preload='metadata';
  let settled=false;
  // Some phone .mov/HEVC files never fire loadedmetadata OR error on desktop browsers - guard so
  // the modal can't sit silently forever. If metadata hasn't loaded in 12s, tell the user plainly.
  const metaGuard=setTimeout(function(){ if(settled) return; settled=true; try{URL.revokeObjectURL(vid.src);}catch(e){} twSay(st,'We couldn’t read that video in this browser (often an iPhone .mov/HEVC file). Easiest fix: tap the <b>QR code below</b> and record it straight from your phone, or upload a standard <b>.mp4</b>.',false); },12000);
  vid.onloadedmetadata=function(){
    if(settled) return; settled=true; clearTimeout(metaGuard);
    URL.revokeObjectURL(vid.src);
    const d=vid.duration||0;
    if(!isFinite(d) || d<=0){ twSay(st,'We couldn’t read that video in this browser (often an iPhone .mov/HEVC file). Tap the <b>QR code below</b> to record on your phone, or upload a standard <b>.mp4</b>.',false); return; }
    if(d < 55){ const s=Math.round(d); twSay(st,'Your clip is only <b>'+s+' seconds</b>. We need about <b>1 to 2 minutes</b> for a quality twin - please record a longer one and try again.',false); return; }
    if(d > 130){ const m=Math.floor(d/60), s=Math.round(d%60); twSay(st,'Your clip is <b>'+m+'m '+s+'s</b>. Please keep it to about <b>2 minutes</b> and try again.',false); return; }
    maybeCompressThenUpload(f, st, go);
  };
  vid.onerror=function(){ if(settled) return; settled=true; clearTimeout(metaGuard); twSay(st,'We couldn’t read that video in this browser (often an iPhone .mov/HEVC file). Tap the <b>QR code below</b> to record on your phone, or upload a standard <b>.mp4</b>.',false); };
  vid.src=URL.createObjectURL(f);
}
// If the clip is too big for the storage limit, shrink it to 720p on the device first.
function maybeCompressThenUpload(f, st, go){
  if(f.size <= 90*1024*1024){ proceedTwinUpload(f, st, go); return; }
  go.disabled=true; go.style.opacity=.6;
  st.innerHTML='Optimizing your video… <b>0%</b> (about as long as the clip itself)';
  compressVideo(f, function(pct){ st.innerHTML='Optimizing your video… <b>'+pct+'%</b>'; })
    .then(function(out){
      if(!out){ st.textContent='Couldn’t optimize that clip - please record at 720p and try again.'; go.disabled=false; go.style.opacity=1; return; }
      if(out.size > 95*1024*1024){ st.innerHTML='Even after optimizing it’s too large to upload. Please record at <b>720p</b>, 1–2 minutes, and try again.'; go.disabled=false; go.style.opacity=1; return; }
      proceedTwinUpload(out, st, go);
    })
    .catch(function(){ st.textContent='Couldn’t optimize that clip - please record at 720p and try again.'; go.disabled=false; go.style.opacity=1; });
}
// Re-encode a video down to ~720p in the browser using canvas + MediaRecorder.
// Keeps audio (via Web Audio) so the voice clone still works. Resolves to a smaller File,
// or to null if the browser can't do it (caller then asks for a smaller recording).
function compressVideo(file, onProgress){
  return new Promise(function(resolve){
    if(typeof MediaRecorder==='undefined'){ resolve(null); return; }
    var video=document.createElement('video');
    video.muted=true; video.playsInline=true; video.preload='auto';
    var done=false;
    function finish(val){ if(done) return; done=true; try{URL.revokeObjectURL(video.src);}catch(e){} resolve(val); }
    video.onloadedmetadata=function(){
      var w=video.videoWidth, h=video.videoHeight;
      if(!w||!h){ finish(null); return; }
      var scale=Math.min(1, 1280/Math.max(w,h));
      var cw=Math.max(2, Math.round(w*scale/2)*2), ch=Math.max(2, Math.round(h*scale/2)*2);
      var canvas=document.createElement('canvas'); canvas.width=cw; canvas.height=ch;
      var ctx=canvas.getContext('2d');
      var stream;
      try{ stream=canvas.captureStream(30); }catch(e){ finish(null); return; }
      // tap the audio through Web Audio so it survives even though the element is muted
      try{
        var AC=window.AudioContext||window.webkitAudioContext;
        if(AC){ var ac=new AC(); if(ac.resume)ac.resume(); var src=ac.createMediaElementSource(video); var dest=ac.createMediaStreamDestination(); src.connect(dest); dest.stream.getAudioTracks().forEach(function(t){ stream.addTrack(t); }); }
      }catch(e){}
      var mime='video/mp4';
      if(!MediaRecorder.isTypeSupported(mime)){ mime='video/webm;codecs=vp8,opus'; if(!MediaRecorder.isTypeSupported(mime)){ mime='video/webm'; if(!MediaRecorder.isTypeSupported(mime)){ finish(null); return; } } }
      // HeyGen caps URL video inputs at 32MB, so size the bitrate to land near 24MB (margin),
      // adapting to clip length: shorter clips get higher bitrate (sharper), longer clips lower.
      var dur=video.duration||90;
      var audioBps=96000;
      var videoBps=Math.min(5000000, Math.max(800000, Math.floor(24*1024*1024*8/dur) - audioBps));
      var rec;
      try{ rec=new MediaRecorder(stream,{mimeType:mime, videoBitsPerSecond:videoBps, audioBitsPerSecond:audioBps}); }catch(e){ finish(null); return; }
      var chunks=[];
      rec.ondataavailable=function(e){ if(e.data&&e.data.size) chunks.push(e.data); };
      rec.onstop=function(){ var blob=new Blob(chunks,{type:mime}); var ext=mime.indexOf('mp4')>=0?'mp4':'webm'; finish(new File([blob],'twin-720p.'+ext,{type:mime})); };
      var dur=video.duration||0;
      function draw(){ if(done) return; if(video.paused||video.ended){ return; } ctx.drawImage(video,0,0,cw,ch); if(onProgress&&dur){ onProgress(Math.min(99,Math.round(video.currentTime/dur*100))); } requestAnimationFrame(draw); }
      video.onended=function(){ try{ if(rec.state!=='inactive') rec.stop(); }catch(e){} };
      try{ rec.start(1000); }catch(e){ finish(null); return; }
      var p=video.play();
      if(p&&p.catch){ p.catch(function(){ finish(null); }); }
      requestAnimationFrame(draw);
    };
    video.onerror=function(){ finish(null); };
    video.src=URL.createObjectURL(file);
  });
}
// Upload to Cloudinary in chunks so large phone videos upload reliably; small files use a single POST. A hard timeout (AbortController) rejects a stalled upload with a tagged error the caller surfaces as a clear message.
function fetchTimeout(url, opts, ms, tag){
  opts=opts||{};
  const ctl=(typeof AbortController!=='undefined')?new AbortController():null;
  if(ctl) opts.signal=ctl.signal;
  const t=setTimeout(function(){ try{ ctl&&ctl.abort(); }catch(e){} }, ms||120000);
  return fetch(url,opts).then(function(r){ clearTimeout(t); return r; }, function(err){
    clearTimeout(t);
    const e=new Error((tag||'network')+'_timeout'); e.__timeout=(err&&err.name==='AbortError'); e.__tag=tag; throw e;
  });
}
function cloudinaryUpload(file, onProgress){
  const endpoint='https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/video/upload';
  const CHUNK=20*1024*1024; // 20MB per chunk
  const PERREQ=150000;      // 150s per request - generous for one 20MB chunk on a slow line
  if(file.size<=CHUNK){
    const fd=new FormData(); fd.append('file',file); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET);
    return fetchTimeout(endpoint,{method:'POST',body:fd},PERREQ,'upload').then(r=>r.json());
  }
  const uid='aws-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  let start=0, lastJson=null;
  function next(){
    if(start>=file.size) return Promise.resolve(lastJson);
    const end=Math.min(start+CHUNK,file.size);
    const blob=file.slice(start,end);
    const fd=new FormData(); fd.append('file',blob); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET);
    return fetchTimeout(endpoint,{method:'POST',headers:{'X-Unique-Upload-Id':uid,'Content-Range':'bytes '+start+'-'+(end-1)+'/'+file.size},body:fd},PERREQ,'upload')
      .then(r=>r.json()).then(j=>{ lastJson=j; if(j&&j.error){ return j; } if(onProgress) onProgress(Math.min(99,Math.round(end/file.size*100))); start=end; return next(); });
  }
  return next();
}
// Build a Cloudinary delivery URL that re-encodes the stored clip to a compact H.264 mp4
// (capped bitrate) so HeyGen's 32MB URL-input limit is respected - sizing happens on
// Cloudinary's servers, which is reliable, unlike the phone's own encoder.
function heygenUrl(u){
  try{
    var marker='/upload/';
    var i=u.indexOf(marker);
    if(i<0) return u;
    var head=u.slice(0,i+marker.length);
    var tail=u.slice(i+marker.length).replace(/\.[A-Za-z0-9]+($|\?)/, '.mp4$1');
    return head + 'c_limit,w_1280,h_1280,vc_h264,br_1500k/' + tail;
  }catch(e){ return u; }
}
function proceedTwinUpload(f, st, go){
  if(!CONFIG.CLOUDINARY_CLOUD || !CONFIG.CLOUDINARY_PRESET){ twSay(st,'Twin uploads aren’t switched on yet - hang tight, this is being set up.',false); return; }
  go.disabled=true; go.style.opacity=.6; twSay(st,'Uploading your clip…',true);
  const u=DB.user||{};
  // 1) upload the clip to the storage bucket in chunks (no API keys exposed)
  cloudinaryUpload(f, function(pct){ twSay(st,'Uploading your clip… '+pct+'%',true); })
    .then(up=>{
      const url=up&&(up.secure_url||up.url);
      if(!url){
        var em=(up&&up.error&&up.error.message)?up.error.message:'Upload didn’t complete';
        twSay(st,'Upload failed: '+em+'. Please try again, or use the QR code below to record on your phone.',false);
        go.disabled=false; go.style.opacity=1; return;
      }
      var addLook = !!window.__twinAddLook;
      twSay(st, addLook ? 'Adding your new look…' : 'Building your twin… this can take a moment.', true);
      // clone the voice from the clip only when first creating the twin (extra looks reuse the cloned voice)
      if(!addLook){
        try{
          fetch(CONFIG.VOICE_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ videoUrl:url, name:(u.name||'My')+' voice' })})
            .then(r=>r.json()).then(vr=>{ if(vr&&vr.voice_id){ const uu=DB.user||{}; uu.elevenVoiceId=vr.voice_id; DB.user=uu; } }).catch(function(){});
        }catch(e){}
      }
      // warm the resized link (so Cloudinary generates the mp4), then hand it to HeyGen
      var hg=heygenUrl(url);
      var lookName = addLook ? (((document.getElementById('twinLookName')&&document.getElementById('twinLookName').value.trim()))||('Look '+(((Array.isArray(u.twinLooks)?u.twinLooks:[]).length)+2))) : ((u.name||'My')+' Twin');
      var body = { name:lookName, email:u.email||'', phone:u.phone||'', videoUrl:hg };
      if(addLook && u.twinGroupId){ body.avatar_group_id = u.twinGroupId; } // attach the new look to the SAME identity
      return fetch(hg,{mode:'no-cors'}).catch(function(){}).then(function(){
        return fetchTimeout(CONFIG.TWIN_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify(body)},90000,'build')
          .then(r=>r.json()).then(res=>{
            if(!res || !res.avatar_id){ twSay(st, (res && res.message) ? ('Couldn’t build it: '+res.message) : 'Hmm, that didn’t go through. Make sure your face is clearly visible and well lit, then try again.', false); go.disabled=false; go.style.opacity=1; return; }
            const user=DB.user||{};
            if(addLook){
              user.twinLooks = Array.isArray(user.twinLooks)?user.twinLooks:[];
              user.twinLooks.push({ id:res.avatar_id, name:lookName, ready:false });
              if(!user.twinVideoUrl){ user.twinVideoUrl=url; } // backfill a hi-res ultra source for existing twins on their next look
              DB.user=user; startTwinPolling();
              twinModal('<div style="text-align:center"><div style="width:56px;height:56px;border-radius:50%;background:rgba(155,107,224,.16);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 12px">⏳</div><h3 style="margin:0 0 6px">New look is building</h3><p style="color:var(--muted,#8a96b0);font-size:13.5px;margin:0 0 16px;line-height:1.5">“'+lookName+'” is being added to your twin - usually ready within 10–15 minutes. You’ll be able to pick it (and choose it per day in your plan) once it’s ready.</p><button class="btn" onclick="closeTwin();go(\'remake\')" style="width:100%">Got it</button></div>');
              return;
            }
            user.twinAvatarId=res.avatar_id; user.twinGroupId=res.group_id; user.twinConsentUrl=res.consent_url; user.twinReady=false; user.twinConsentPending=true; user.twinConsentReminderSent=false; user.twinVideoUrl=url; DB.user=user;
            startTwinPolling();
            openTwinConsent();
          });
      });
    }).catch(function(err){
      var stalled = err && (err.__timeout || /_timeout$/.test(err.message||''));
      var tag = err && err.__tag;
      var msg = stalled
        ? (tag==='build'
            ? 'Your clip uploaded, but building the twin took too long to answer. Please try again in a moment - if it keeps happening, use the QR code to record on your phone.'
            : 'The upload stalled (this can happen on a slow or dropped connection with a large clip). Please try again, or use the QR code below to record on your phone.')
        : 'Connection issue - please try again, or use the QR code below to record on your phone.';
      twSay(st, msg, false); go.disabled=false; go.style.opacity=1;
    });
}
function openTwinConsent(){
  const u=DB.user||{};
  const url=u.twinConsentUrl||'#';
  twinModal(
    '<div style="text-align:center"><div style="width:56px;height:56px;border-radius:50%;background:rgba(155,107,224,.16);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 12px">✓</div>'+
    '<h3 style="margin:0 0 6px">One last step - confirm it’s you</h3>'+
    '<p style="color:var(--muted,#8a96b0);font-size:13.5px;margin:0 0 16px;line-height:1.5">For your protection, record a quick one-line consent on the next screen confirming this is you. It takes about 10 seconds, then your twin finishes building - usually within 10–15 minutes.</p>'+
    '<a class="btn" href="'+url+'" target="_blank" rel="noopener" style="width:100%;display:block;text-align:center;text-decoration:none" onclick="markTwinConsentTapped()">Record my consent →</a>'+
    '<button class="btn ghost" onclick="deferTwinConsent()" style="width:100%;margin-top:8px">I’ll do it later</button>'+
    '<div style="font-size:11.5px;color:var(--muted2);margin-top:9px;line-height:1.45">No rush - we’ll email you a link so you can finish this anytime. Your half-built twin is saved and you’ll see a reminder on your home screen too.</div></div>'
  );
}
function markTwinConsentTapped(){ const u=DB.user||{}; u.twinConsentTapped=true; DB.user=u; }
/* "I'll do it later" is a PAUSE, not a cancel: keep the consent-pending state (so the home banner +
   next-step card stay), close the modal, and email the user a one-tap link back to their consent page. */
function deferTwinConsent(){
  var u=DB.user||{};
  u.twinConsentPending=true; DB.user=u; // make sure the resume path survives
  var url=(u.twinConsentUrl||'').trim();
  if(url && !u.twinConsentReminderSent && CONFIG.TWIN_CONSENT_REMINDER && (u.email||'').trim()){
    try{
      fetch(CONFIG.TWIN_CONSENT_REMINDER,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ email:u.email, name:(u.name||''), consent_url:url })});
      u.twinConsentReminderSent=true; DB.user=u; // one email per defer, no nagging
    }catch(e){}
  }
  try{ closeTwin(); }catch(e){}
  try{ toast && toast('No problem - we emailed you a link to finish confirming your twin. You can also finish it from your home screen anytime.'); }catch(e){}
  try{ go('home'); }catch(e){}
}
/* Reopen the exact same consent step from the home banner / next-step card. */
function reopenTwinConsent(){
  var u=DB.user||{};
  if(!(u.twinConsentUrl||'').trim()){ try{ toast && toast('We could not find your consent link - please start your twin again.'); }catch(e){} return; }
  try{ if(document.getElementById('twinModal')) closeTwin(); }catch(e){}
  openTwinConsent();
}
/* Persistent, obvious way back: a home-screen card shown while a twin is awaiting its consent step.
   Clears automatically once checkTwinStatus() sees consent accepted / the twin trained. */
function twinConsentBanner(){
  var u=DB.user||{};
  if(!u.twinConsentPending || u.twinReady || !(u.twinConsentUrl||'').trim()) return '';
  return '<div class="card" style="margin-bottom:16px;border:1px solid var(--purple);background:linear-gradient(180deg,rgba(155,107,224,.16),rgba(155,107,224,0));display:flex;gap:13px;align-items:center;flex-wrap:wrap">'
    +'<div style="font-size:26px">✅</div>'
    +'<div style="flex:1;min-width:180px"><div style="font-weight:800;font-size:15px">Finish setting up your AI twin</div>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:2px">Just confirm it’s really you - a quick 10-second on-camera step - and your twin finishes building.</div></div>'
    +'<button class="btn small" style="flex:none" onclick="reopenTwinConsent()">Confirm it’s me →</button></div>';
}
function checkTwinReturn(){
  if(/[?&]twin=done/.test(location.search)){
    history.replaceState({},'',location.pathname);
    setTimeout(function(){ toast && toast('Thanks - your twin is finishing up. We’ll show its preview here the moment it’s ready.'); },400);
    startTwinPolling();
  }
}
// Ask HeyGen (via our backend) for the twin's real training status + preview image, and reflect it.
function checkTwinStatus(){
  if(typeof CONFIG==='undefined' || !CONFIG.TWIN_STATUS) return;
  var u=DB.user||{};
  if(!u.twinGroupId) return;
  var looksPending=(Array.isArray(u.twinLooks)?u.twinLooks:[]).some(function(l){return !l.ready;});
  if(u.twinReady && u.twinPreview && !looksPending) return; // fully complete, nothing to poll
  fetch(CONFIG.TWIN_STATUS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({group_id:u.twinGroupId})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(!d) return;
      var uu=DB.user||{}; var changed=false, justReady=false;
      if(d.preview_image_url && uu.twinPreview!==d.preview_image_url){ uu.twinPreview=d.preview_image_url; changed=true; }
      if(typeof d.looks_count==='number'){ uu.twinLooksCount=d.looks_count; }
      // Consent finished? Clear the pending flag so the home "confirm it's you" reminder disappears.
      // HeyGen only leaves the pending/waiting consent state AFTER the user records their consent, at
      // which point consent_status flips off 'pending', a preview image appears, and/or training completes.
      var consentDone = d.ready || !!d.preview_image_url || (d.consent_status && !/pending|wait/i.test(String(d.consent_status)));
      if(consentDone && uu.twinConsentPending){ uu.twinConsentPending=false; uu.twinConsentReminderSent=false; changed=true; }
      if(d.ready && !uu.twinReady){ uu.twinReady=true; changed=true; justReady=true; }
      // when the identity finishes training, mark any pending extra looks ready (they share the same group)
      if(d.ready){ (Array.isArray(uu.twinLooks)?uu.twinLooks:[]).forEach(function(l){ if(!l.ready){ l.ready=true; if(!l.preview && uu.twinPreview) l.preview=uu.twinPreview; changed=true; } }); }
      if(changed){
        DB.user=uu;
        if(justReady){ try{ toast && toast('<span class="ok">✓</span> Your digital twin is ready to use!'); }catch(e){} }
        try{ var a=document.querySelector('#nav a.active'); if(a) go(a.dataset.view); }catch(e){}
      }
    }).catch(function(){});
}
var _twinPoll=null;
function startTwinPolling(){
  checkTwinStatus();
  if(_twinPoll) return;
  _twinPoll=setInterval(function(){
    var u=DB.user||{};
    if(!u.twinGroupId || (u.twinReady && u.twinPreview && !(Array.isArray(u.twinLooks)?u.twinLooks:[]).some(function(l){return !l.ready;}))){ clearInterval(_twinPoll); _twinPoll=null; return; }
    checkTwinStatus();
  }, 30000);
}

function isStale(x){ return x && x.status==='processing' && (Date.now()-(x.created||0) > 25*60000); }
function statusBadge(s, x){
  if(s==='processing' && isStale(x)) return `<span class="badge-status s-processing"><span class="d"></span>Still working…</span>`;
  const map={processing:['s-processing','Rendering video'],review:['s-review','Ready for review'],ready:['s-ready','Ready'],posted:['s-posted','Posted'],rejected:['s-rejected','Rejected']};
  const [c,t]=map[s]||['s-ready',s];
  return `<span class="badge-status ${c}"><span class="d"></span>${t}</span>`;
}
function recentList(v){
  return v.slice().sort((a,b)=>b.created-a.created).slice(0,5).map(x=>`
    <div class="arow" style="padding:12px 14px;cursor:pointer" onclick="goLib('${x.status}')">
      <div class="mini" style="width:40px;height:71px"></div>
      <div class="info"><div class="t">${x.title}</div><div class="m">${timeAgo(x.created)} · ${avaName(x.avatar)}</div></div>
      <div>${statusBadge(x.status, x)}</div>
    </div>`).join('');
}
