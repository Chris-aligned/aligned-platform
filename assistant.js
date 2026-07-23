
  var asstSession='asst-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);
  var asstBusy=false, asstStarted=false;
  function asstEmail(){ return ((typeof DB!=='undefined'&&DB.user&&DB.user.email)||'').trim(); }

  // ===== Video builder context =====
  // The Assistant can now PRODUCE VIDEOS from a plain-English request. To do that safely it needs to
  // know the same things the app's own buttons know: is the twin ready, is the customer inside their
  // plan allowance, how many Aligned Credits do they have, what are their brand colours. We send that
  // as a "ctx" block with every message. The brain re-checks all of it server side before it fires
  // any render, so a customer can never start a video they are not entitled to make.

  // Silent version of canProduce() - same rules, but it returns the reason instead of toasting/navigating.
  function asstGate(){
    try{
      var u=DB.user||{};
      if(u.comped) return {ok:true,reason:''};
      if(u.status!=='active' && daysLeft()<=0) return {ok:false,reason:'their free trial has ended and they have not picked a plan yet, so they need to choose a plan in Account and billing before making more videos'};
      if(monthCount()>=planLimit()) return {ok:false,reason:'they have used all '+planLimit()+' videos in their plan this month, so they need to upgrade or add a video pack in Account and billing'};
      return {ok:true,reason:''};
    }catch(e){ return {ok:true,reason:''}; }
  }
  // The customer's own B-roll. Showcase videos put them in FRONT of moving footage, and their own
  // clips always beat anything we could source, so we hand the Assistant whatever they have uploaded.
  function asstBrollLib(){
    try{
      var out=[];
      var push=function(arr){ (Array.isArray(arr)?arr:[]).forEach(function(u){ if(typeof u==='string' && /^https?:/i.test(u) && out.indexOf(u)<0) out.push(u); }); };
      push((DB.plan||{}).brollLib);
      (DB.plans||[]).forEach(function(p){ if(p) push(p.brollLib); });
      (DB.user||{}).brollLib && push((DB.user||{}).brollLib);
      return out.slice(0,6);
    }catch(e){ return []; }
  }
  function asstCtx(){
    try{
      var u=DB.user||{};
      var bk=(typeof brandKitGet==='function')?(brandKitGet()||{}):{};
      var g=asstGate();
      var broll=asstBrollLib();
      return {
        brollLib:broll, brollHas:(broll.length>0),
        name:u.name||'', phone:u.phone||'', plan:u.plan||'', status:u.status||'',
        twinReady:!!u.twinReady, twinAvatarId:u.twinAvatarId||'', twinVoiceId:u.twinVoiceId||'',
        elevenVoiceId:u.elevenVoiceId||'',
        credits:(typeof creditBal==='function')?(creditBal()||0):0,
        canProduce:g.ok, gateReason:g.reason,
        monthUsed:(typeof monthCount==='function')?monthCount():0,
        monthLimit:(typeof planLimit==='function')?planLimit():0,
        brandColor:bk.accentFrom||'', brandAccent:bk.accentTo||'', logoPid:bk.logoPid||'',
        website:u.website||''
      };
    }catch(e){ return {}; }
  }
  // Fired when the brain reports it actually started a render.
  function asstVideoStarted(v){
    if(!v || !v.id) return;
    try{ bumpStreak(); }catch(e){}
    try{ startReadyPolling(); }catch(e){}
    try{ toast('<span class="ok">✓</span> Making your video - it lands in Approvals when it is ready.'); }catch(e){}
  }
  // Drop text into the Assistant and send it (used by the "describe your video" prompt field).
  function asstSeed(text){
    asstOpen(true);
    setTimeout(function(){
      var i=document.getElementById('asstInput'); if(!i) return;
      i.value=text; asstSend();
    },220);
  }
  function asstAdd(text,who){ var m=document.createElement('div'); m.className='asst-msg '+who; m.textContent=text; var w=document.getElementById('asstMsgs'); w.appendChild(m); w.scrollTop=w.scrollHeight; }
  function asstOpen(open){
    document.getElementById('asstPanel').classList.toggle('show',open!==false);
    if(open!==false){
      if(!asstStarted){ asstStarted=true; asstAdd("Hi! I'm your Aligned Assistant. Just tell me the video you want in plain English and I'll write it and make it - talking head, faceless, carousel, cinematic or a full showcase. I can also build you a website or an AI agent, or answer any question. What are we making?",'bot'); }
      setTimeout(function(){ var i=document.getElementById('asstInput'); if(i) i.focus(); },60);
    }
  }
  function asstSend(){
    if(asstBusy) return; var i=document.getElementById('asstInput'); var msg=(i.value||'').trim(); if(!msg) return;
    i.value=''; asstAdd(msg,'me'); asstBusy=true;
    var tp=document.createElement('div'); tp.className='asst-typing'; tp.id='asstTyping'; tp.textContent='Assistant is typing…'; var w=document.getElementById('asstMsgs'); w.appendChild(tp); w.scrollTop=w.scrollHeight;
    fetch('https://alignedwebservices.app.n8n.cloud/webhook/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:asstEmail(),message:msg,sessionId:asstSession,ctx:asstCtx()})})
      .then(function(r){ return r.json(); })
      .then(function(d){ var t=document.getElementById('asstTyping'); if(t) t.remove(); asstAdd((d&&d.reply)||'Sorry, I had trouble there - please try again.','bot'); asstBusy=false; if(d&&d.action==='make_video'&&d.video){ asstVideoStarted(d.video); } })
      .catch(function(){ var t=document.getElementById('asstTyping'); if(t) t.remove(); asstAdd('I could not reach the server just now. Please try again in a moment.','bot'); asstBusy=false; });
  }
  // Auto-open the Assistant when arrived at via a Support link (e.g. from the CRM help button)
  try{ if(/[?&#]support\b/i.test(location.href)){ setTimeout(function(){ asstOpen(true); }, 1300); } }catch(e){}

// Convenience namespace (module surface).
window.AlignedAssistant={open:function(o){return asstOpen(o);},seed:function(t){return asstSeed(t);},send:function(){return asstSend();},email:function(){return asstEmail();},context:function(){return asstCtx();}};
