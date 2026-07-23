/* Aligned app module: core.router.js (split from live; load order matters) */
const TITLES={home:'Dashboard',remake:'Other videos',socials:'Connect your socials',library:'Library',approvals:'Approvals',brandkit:'Brand kit',tutorials:'Tutorials',account:'Account & billing',websitebuilder:'Website builder',funnelbuilder:'Funnel builder'};
// Mobile drawer: open/close the slide-in sidebar. force=true opens, false closes, omitted toggles.
function toggleNav(force){
  var s=document.querySelector('.side'); if(!s) return;
  var b=document.getElementById('navBackdrop');
  var open = (typeof force==='boolean') ? force : !s.classList.contains('open');
  s.classList.toggle('open', open);
  if(b) b.classList.toggle('show', open);
}
function go(view){ if((view==='remake'||view==='ugc') && window.AlignedCreate){ AlignedCreate.open(view==='ugc'?'ugc':''); return; } if(view==='remake' && typeof asstOpen==='function'){ asstOpen(true); return; } if(view==='ugc' && typeof asstSeed==='function'){ asstSeed('A UGC-style ad for my product. My product is: '); return; } 
  document.querySelectorAll('#nav a').forEach(a=>a.classList.toggle('active',a.dataset.view===view));
  document.getElementById('pageTitle').textContent = TITLES[view];
  document.getElementById('content').innerHTML = RENDER[view]();
  refreshApvBadge();
  if(view==='socials') syncSocialStatus();
  if(view==='account') setTimeout(checkCrmStatus,50);
  if(view==='brandkit'){ renderBkLogo(); bkPreviewUpdate(); }
  try{ toggleNav(false); }catch(e){}   // close the mobile drawer after navigating
}
// ---- Connect your CRM (GoHighLevel) ----
var CRM_CONNECT_BASE='https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&client_id=6a4fbdd2008eda5c24bb2327-mrdr6pz6&redirect_uri='+encodeURIComponent('https://alignedwebservices.app.n8n.cloud/webhook/aligned-oauth')+'&scope='+encodeURIComponent('contacts.readonly contacts.write conversations.readonly conversations.write conversations/message.readonly conversations/message.write calendars.readonly calendars.write calendars/events.readonly calendars/events.write opportunities.readonly opportunities.write forms.readonly forms.write products.readonly products.write products/prices.readonly products/prices.write invoices.readonly invoices.write payments/orders.readonly payments/orders.write store/setting.readonly store/setting.write');
function connectCRM(){
  var email=((DB.user&&DB.user.email)||'').trim();
  if(!email){ toast('Add your email first, then connect.'); return; }
  window.open(CRM_CONNECT_BASE+'&state='+encodeURIComponent(email),'_blank');
  var row=document.getElementById('crmStatusRow'); if(row) row.innerHTML='<span class="badge-status s-processing"><span class="d"></span>Waiting for you to approve it…</span>';
  var tries=0, iv=setInterval(function(){ tries++; checkCrmStatus(); if(tries>=20) clearInterval(iv); },6000);
}
function checkCrmStatus(){
  var email=((DB.user&&DB.user.email)||'').trim();
  var row=document.getElementById('crmStatusRow'); if(!row) return;
  if(!email){ row.innerHTML=''; return; }
  fetch('https://alignedwebservices.app.n8n.cloud/webhook/crm-status?email='+encodeURIComponent(email))
    .then(function(r){return r.json();})
    .then(function(d){
      var btn=document.getElementById('crmConnectBtn');
      if(d&&d.connected){ row.innerHTML='<span class="badge-status s-posted"><span class="d"></span>✓ Connected - your website leads flow into your CRM</span>'; if(btn) btn.textContent='Reconnect'; }
      else { row.innerHTML='<span class="badge-status" style="opacity:.7">Not connected yet</span>'; if(btn) btn.textContent='Connect your CRM'; }
    }).catch(function(){ row.innerHTML='<span class="badge-status" style="opacity:.7">Not connected yet</span>'; });
}
// ---- Self-serve Website + Funnel builders (describe -> live preview -> chat refine loop) ----
// Reuses the hosted mockup engine (build-mockup / mockup / edit-mockup). No name/email/phone form:
// the customer is logged in, so identity + brand kit are pulled silently from DB.user. No lead is created.
var MB={ wbId:'', fnId:'', fnGoal:'book', wbBusy:false, fnBusy:false };
function mbEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c];}); }
function mbVal(id){ var e=document.getElementById(id); return e?String(e.value||'').trim():''; }
function mbNewId(){ return Math.random().toString(36).slice(2,10); }
function mbUser(){
  var u=DB.user||{}, bk=(u.brandKit||{});
  return {
    name:u.name||'', email:u.email||'', phone:u.phone||'',
    company: bk.brandName||u.company||u.name||'',
    brandColor: bk.accentFrom||'', brandAccent: bk.accentTo||'', brandLogo: bk.logoUrl||''
  };
}
function mbGoalChip(g,label){ return '<span class="chip" data-g="'+g+'" onclick="mbToggleChip(this)">'+mbEsc(label)+'</span>'; }
function mbFunnelChip(g,label,act){ return '<span class="chip'+(act?' active':'')+'" data-g="'+g+'" onclick="mbPickFunnelGoal(this)">'+mbEsc(label)+'</span>'; }
function mbToggleChip(el){ el.classList.toggle('active'); }
function mbPickFunnelGoal(el){
  var wrap=document.getElementById('fnGoals'); if(wrap){ [].slice.call(wrap.querySelectorAll('.chip')).forEach(function(c){ c.classList.remove('active'); }); }
  el.classList.add('active'); MB.fnGoal=el.dataset.g;
}
function mbSelectedGoals(){ return [].slice.call(document.querySelectorAll('#wbGoals .chip.active')).map(function(c){ return c.dataset.g; }); }
function mbStageHtml(kind,publishLabel){
  return '<div id="'+kind+'Stage" class="card" style="display:none;max-width:980px;margin-top:18px">'+
    '<div style="border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#0e1320">'+
      '<div style="display:flex;align-items:center;gap:6px;padding:9px 12px;border-bottom:1px solid var(--line);background:#0b0f1a">'+
        '<span style="width:11px;height:11px;border-radius:50%;background:#ff5f57;display:inline-block"></span>'+
        '<span style="width:11px;height:11px;border-radius:50%;background:#febc2e;display:inline-block"></span>'+
        '<span style="width:11px;height:11px;border-radius:50%;background:#28c840;display:inline-block"></span>'+
        '<span id="'+kind+'Status" style="margin-left:10px;font-size:12px;color:var(--muted2)">Building your preview...</span>'+
      '</div>'+
      '<iframe id="'+kind+'Frame" title="Your live preview" style="width:100%;height:560px;border:0;background:#fff;display:block"></iframe>'+
    '</div>'+
    '<div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:8px">'+
      '<button class="btn small" onclick="mbPublish(\''+kind+'\')">'+publishLabel+' &rarr;</button>'+
      '<button class="btn small ghost" onclick="mbReload(\''+kind+'\')">Refresh preview</button>'+
    '</div>'+
    '<div style="margin-top:18px"><div style="font-weight:700;font-size:14px;margin-bottom:8px">Chat with your AI designer</div>'+
      '<div id="'+kind+'Thread" style="background:#0e1320;border:1px solid var(--line);border-radius:12px;padding:12px;max-height:260px;overflow:auto;display:flex;flex-direction:column;gap:8px;margin-bottom:10px"></div>'+
      '<div class="filters" style="margin-bottom:10px">'+
        mbSug(kind,'Make the headline punchier')+mbSug(kind,'Add a testimonials section')+mbSug(kind,'Make the call to action stronger')+mbSug(kind,'Add a pricing section')+
      '</div>'+
      '<div style="display:flex;gap:8px"><input id="'+kind+'Msg" placeholder="Tell me what to change..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();mbRefine(\''+kind+'\');}"/><button class="btn small" onclick="mbRefine(\''+kind+'\')" style="flex:none">Send</button></div>'+
    '</div>'+
  '</div>';
}
function mbSug(kind,text){ return '<span class="chip" data-k="'+kind+'" onclick="mbSugClick(this)">'+mbEsc(text)+'</span>'; }
function mbSugClick(el){ var kind=el.dataset.k; var inp=document.getElementById(kind+'Msg'); if(inp){ inp.value=el.textContent; } mbRefine(kind); }
function mbBubble(kind,text,who){
  var th=document.getElementById(kind+'Thread'); if(!th) return {textContent:''};
  var b=document.createElement('div'); b.textContent=text;
  b.style.cssText='max-width:85%;padding:9px 12px;border-radius:12px;font-size:13.5px;line-height:1.5;'+(who==='me'?'align-self:flex-end;background:var(--grad);color:#fff':'align-self:flex-start;background:#141a29;border:1px solid var(--line);color:var(--text)');
  th.appendChild(b); th.scrollTop=th.scrollHeight; return b;
}
function mbNice(){ var a=['Done. Take a look at the preview above.','Updated. See what you think.','Got it, the preview is refreshed.','All set. Anything else you want to tweak?','Changed it. Keep the ideas coming.']; return a[Math.floor(Math.random()*a.length)]; }
function mbShowStage(kind){
  var st=document.getElementById(kind+'Stage'); if(st) st.style.display='block';
  var th=document.getElementById(kind+'Thread'); if(th) th.innerHTML='';
  mbBubble(kind,'Here is your first draft. Tell me anything you want changed and I will update it live.','bot');
  var s=document.getElementById(kind+'Status'); if(s) s.textContent='Building your preview...';
  if(st) st.scrollIntoView({behavior:'smooth',block:'start'});
}
function mbBuild(kind,payload){
  MB[kind+'Busy']=true;
  mbShowStage(kind);
  fetch(CONFIG.MOCKUP_BUILD,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){});
  setTimeout(function(){ mbPoll(kind,0); },1500);
}
function mbPoll(kind,tries){
  var id=(kind==='wb')?MB.wbId:MB.fnId; if(!id) return;
  var frame=document.getElementById(kind+'Frame'); if(!frame) return; // view changed
  fetch(CONFIG.MOCKUP_GET+'?id='+encodeURIComponent(id)+'&embed=1&t='+Date.now())
    .then(function(r){ return r.text(); })
    .then(function(html){
      if(!document.getElementById(kind+'Frame')) return;
      if(!html){ if(tries<40) setTimeout(function(){ mbPoll(kind,tries+1); },2500); return; }
      frame.srcdoc=html;
      if(html.indexOf('AWS_BUILDING')>-1){ if(tries<40) setTimeout(function(){ mbPoll(kind,tries+1); },2500); }
      else { MB[kind+'Busy']=false; var s=document.getElementById(kind+'Status'); if(s) s.textContent='Ready. Chat below to refine it, then take it live.'; }
    })
    .catch(function(){ if(tries<40) setTimeout(function(){ mbPoll(kind,tries+1); },3000); });
}
function mbReload(kind){
  var id=(kind==='wb')?MB.wbId:MB.fnId; var frame=document.getElementById(kind+'Frame'); if(!id||!frame){ return; }
  fetch(CONFIG.MOCKUP_GET+'?id='+encodeURIComponent(id)+'&embed=1&t='+Date.now()).then(function(r){ return r.text(); }).then(function(h){ if(h&&document.getElementById(kind+'Frame')) frame.srcdoc=h; }).catch(function(){});
}
function mbRefine(kind){
  var id=(kind==='wb')?MB.wbId:MB.fnId;
  if(!id){ toast('Build a preview first'); return; }
  var inp=document.getElementById(kind+'Msg'); if(!inp) return;
  var req=String(inp.value||'').trim(); if(!req) return;
  inp.value=''; mbBubble(kind,req,'me');
  var b=mbBubble(kind,'Working on that...','bot');
  fetch(CONFIG.MOCKUP_EDIT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id,request:req})})
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d&&d.ok){ b.textContent=mbNice(); mbReload(kind); }
      else { b.textContent='I could not apply that one cleanly, so I kept your current design. Try describing it a different way.'; }
    })
    .catch(function(){ b.textContent='Something went wrong on my end. Give it another try in a moment.'; });
}
function mbPublish(kind){
  var id=(kind==='wb')?MB.wbId:MB.fnId;
  if(!id){ toast('Build a preview first'); return; }
  window.open(CONFIG.GOLIVE_URL+encodeURIComponent(id),'_blank');
}
function wbGenerate(){
  var comp=mbVal('wbCompany'), purpose=mbVal('wbPurpose'), site=mbVal('wbSite');
  if(!comp){ toast('Add your business name first'); return; }
  if(!purpose){ toast('Tell us what your site is for'); return; }
  MB.wbId=mbNewId();
  var u=mbUser();
  var payload=Object.assign({},u,{ id:MB.wbId, company:comp, siteGoals:mbSelectedGoals().join(','), message:purpose, currentSite:site, source:'app' });
  mbBuild('wb',payload);
}
function fnGenerate(){
  var comp=mbVal('fnCompany'), offer=mbVal('fnOffer'), goal=MB.fnGoal||'book';
  if(!comp){ toast('Add your business name first'); return; }
  if(!offer){ toast('Describe your offer first'); return; }
  MB.fnId=mbNewId();
  var u=mbUser();
  var map={
    book:{sg:'booking',cta:'book a call',line:'get visitors to book a call'},
    buy:{sg:'sell',cta:'buy now',line:'get visitors to buy the product'},
    join:{sg:'leads',cta:'sign up',line:'get visitors to join the email list'},
    quote:{sg:'leads',cta:'request a quote',line:'get visitors to request a quote'}
  };
  var g=map[goal]||map.book;
  var msg='Build a single focused funnel landing page, not a full multi-section website. The one and only goal is to '+g.line+'. The offer: '+offer+'. Use one strong hero with a single clear call to action to '+g.cta+', a short benefits section, a bit of social proof, and repeat the same '+g.cta+' button near the bottom. Keep navigation minimal and remove anything that distracts from that one action.';
  var payload=Object.assign({},u,{ id:MB.fnId, company:comp, siteGoals:g.sg, message:msg, source:'app' });
  mbBuild('fn',payload);
}
// Ask the backend which platforms are truly connected in GHL, and reflect that with checkmarks.
function syncSocialStatus(){
  if(typeof CONFIG==='undefined' || !CONFIG.SOCIAL_STATUS) return;
  var u=DB.user||{}; if(!u.email) return;
  fetch(CONFIG.SOCIAL_STATUS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(!d || d.checked!==true || !Array.isArray(d.connected)) return; // only trust a real GHL read
      var uu=DB.user||{}; uu.socials=uu.socials||{}; var changed=false;
      d.connected.forEach(function(p){ if(uu.socials[p]!=='connected'){ uu.socials[p]='connected'; changed=true; } });
      PLATFORMS.forEach(function(p){ if(uu.socials[p]==='connected' && d.connected.indexOf(p)<0){ delete uu.socials[p]; changed=true; } });
      if(changed){
        DB.user=uu;
        var act=document.querySelector('#nav a.active');
        if(act && act.dataset.view==='socials'){ document.getElementById('content').innerHTML=RENDER.socials(); }
      }
    }).catch(function(){});
}

// First-run guided checklist: shows new users exactly what to do, in order, until their content is posting.
function gettingStarted(){
  var u=DB.user||{}; var v=DB.videos||[];
  if(u.hideGettingStarted) return '';
  var hasTwin=!!(u.twinReady||u.twinAvatarId||v.some(function(x){return x.avatar&&x.avatar!=='none'&&x.avatar!=='upload';}));
  var hasSocial=!!(u.socials&&Object.keys(u.socials).some(function(k){return u.socials[k]==='connected';}));
  var hasVideo=v.length>0;
  var hasPosted=v.some(function(x){return x.status==='posted';});
  var steps=[
    {done:hasTwin,  n:'Create your digital twin', d:'Record the short consent video and we build your AI twin - your real face and voice. Prefer not to film yet? Pick one of our studio presenters instead.', cta:'Create my twin', view:'remake'},
    {done:hasSocial,n:'Connect your socials', d:'Link Instagram, TikTok, Facebook and the rest so we can post for you automatically.', cta:'Connect socials', view:'socials'},
    {done:hasVideo, n:'Make your first video', d:'Pick a topic or paste a reel link and hit go. We render it, add captions, and message you when it is ready.', cta:'Make a video', view:'remake'},
    {done:hasPosted,n:'Approve it and go live', d:'Give it a quick look and approve - it posts straight to your connected socials. That is the whole loop.', cta:'Go to approvals', view:'approvals'}
  ];
  var doneCount=steps.filter(function(s){return s.done;}).length;
  if(doneCount>=steps.length) return '';
  var curIdx=steps.findIndex(function(s){return !s.done;});
  var rows=steps.map(function(s,i){
    var isCur=(i===curIdx);
    var icon=s.done
      ? '<span style="display:inline-flex;width:22px;height:22px;border-radius:50%;background:#16A34A;color:#fff;align-items:center;justify-content:center;font-size:12px;font-weight:800">✓</span>'
      : '<span style="display:inline-flex;width:22px;height:22px;border-radius:50%;border:2px solid '+(isCur?'var(--purple)':'var(--line)')+';color:'+(isCur?'#cbbcff':'var(--muted2)')+';align-items:center;justify-content:center;font-size:12px;font-weight:800">'+(i+1)+'</span>';
    return '<div style="display:flex;gap:12px;padding:12px 0;border-top:1px solid var(--line)">'+
      '<div style="flex:none;width:24px;display:flex;justify-content:center;padding-top:1px">'+icon+'</div>'+
      '<div style="flex:1"><div style="font-weight:700;font-size:14px;'+(s.done?'color:var(--muted);text-decoration:line-through':'')+'">'+s.n+'</div>'+
      (isCur?('<div style="font-size:12.5px;color:var(--muted);margin:4px 0 9px;line-height:1.5">'+s.d+'</div><button class="btn small" onclick="go(\''+s.view+'\')">'+s.cta+' →</button>'):'')+
      '</div></div>';
  }).join('');
  return '<div class="card" style="margin-bottom:18px;border:1px solid var(--purple);background:linear-gradient(180deg,rgba(124,92,255,.10),rgba(124,92,255,0))">'+
    '<div style="display:flex;align-items:center;gap:10px"><h3 style="margin:0;font-size:16px">🚀 Get your content live</h3>'+
      '<span style="font-size:12px;color:var(--muted)">'+doneCount+' of '+steps.length+' done</span>'+
      '<span style="margin-left:auto;font-size:12px;color:var(--muted2);cursor:pointer" onclick="dismissGettingStarted()">Hide</span></div>'+
    '<p style="font-size:12.5px;color:var(--muted);margin:7px 0 2px;line-height:1.5">Do these in order. Once all four are checked off, your videos are posting on autopilot.</p>'+
    rows+'</div>';
}
function dismissGettingStarted(){ var u=DB.user||{}; u.hideGettingStarted=true; DB.user=u; try{ var a=document.querySelector('#nav a.active'); go(a?a.dataset.view:'home'); }catch(e){} }

// ===== Gamification: streaks, rewards, and an always-obvious next step =====
var STREAK_REWARD=25; // Aligned Credits granted at every 7-day streak milestone
function _dstr(d){ return d.toISOString().slice(0,10); }
function streakGet(){ var u=DB.user||{}; var s=(u.streak&&typeof u.streak==='object')?u.streak:{current:0,best:0,lastDay:'',awarded:{}}; if(!s.awarded||typeof s.awarded!=='object') s.awarded={}; return s; }
function streakSet(s){ var u=DB.user||{}; u.streak=s; DB.user=u; }
// Register a day of real activity (approving or producing content). Extends the streak once per day,
// pays out Aligned Credits at each 7-day milestone, and celebrates.
function bumpStreak(){
  try{
    var s=streakGet(); var today=_dstr(new Date());
    if(s.lastDay===today) return;
    var y=new Date(); y.setDate(y.getDate()-1); var yest=_dstr(y);
    s.current=(s.lastDay===yest)?((s.current||0)+1):1;
    s.lastDay=today; if((s.current||0)>(s.best||0)) s.best=s.current;
    streakSet(s);
    if(s.current>0 && s.current%7===0 && !s.awarded[s.current]){ s.awarded[s.current]=true; streakSet(s); streakReward(s.current); }
    else { toast('<span class="ok">🔥</span> Day '+s.current+' streak - nice, keep it going!'); }
    try{ var a=document.querySelector('#nav a.active'); if((a?a.dataset.view:'home')==='home') go('home'); }catch(e){}
  }catch(e){}
}
function streakReward(days){
  var u=DB.user||{};
  if(CONFIG.ADD_CREDIT && u.email){ fetch(CONFIG.ADD_CREDIT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,credits:STREAK_REWARD})}).then(function(r){return r.json();}).then(function(){ try{ creditRefresh(); }catch(e){} }).catch(function(){}); }
  celebrate();
  toast('<span class="ok">🔥</span> '+days+'-day streak! You just earned <b>'+STREAK_REWARD+' Aligned Credits</b>.');
}
// The single most important thing to do next - the app's "game objective".
function nextStep(){
  var u=DB.user||{}; var v=DB.videos||[];
  var review=v.filter(function(x){return x.status==='review';}).length;
  var hasTwin=!!(u.twinReady||u.twinAvatarId);
  var hasSocial=!!(u.socials&&Object.keys(u.socials).some(function(k){return u.socials[k]==='connected';}));
  var hasVideo=v.length>0;
  var planActive=!!(DB.plan&&DB.plan.active);
  if(review>0) return {t:'Approve your video',d:'You have '+review+' waiting - approve it to keep your streak alive.',cta:'Review now',go:"go('approvals')",icon:'🎬'};
  if(u.twinConsentPending && !u.twinReady && (u.twinConsentUrl||'').trim()) return {t:'Confirm it\'s really you',d:'Your AI twin is almost ready - just record a quick 10-second consent to finish setting it up.',cta:'Confirm now',go:"reopenTwinConsent()",icon:'✅'};
  if(!hasTwin) return {t:'Create your AI twin',d:'Record one short video of yourself (1 to 2 minutes) and we build your AI twin - your real face and voice.',cta:'Create my twin',go:"openTwinCreate()",icon:'🧑'};
  if(!hasVideo) return {t:'Make your first video',d:'Write a short script and pick a style - we make it in your twin.',cta:'Make a video',go:"openTwinStudio()",icon:'✨'};
  if(!hasSocial) return {t:'Connect your socials',d:'Link your accounts so we can post for you automatically.',cta:'Connect socials',go:"go('socials')",icon:'🔗'};
  if(!planActive) return {t:'Turn on daily content',d:'A video every day is the easiest way to build a streak.',cta:'Set it up',go:"(typeof cwToggle==='function'?cwToggle(true):go('remake'))",icon:'📅'};
  return {t:'Make today\'s video',d:'You\'re on a roll - produce one to extend your streak.',cta:'Start',go:"openTwinStudio()",icon:'🚀'};
}
function streakHero(){
  var s=streakGet(); var cur=s.current||0;
  var inWeek=cur%7; var pct=cur>0?Math.round((inWeek/7)*100):0; if(cur>0&&inWeek===0) pct=100;
  var toNext=cur>0?(inWeek===0?7:(7-inWeek)):7;
  var ns=nextStep(); var flame=cur>0?'🔥':'✨';
  return '<div class="card" style="margin-bottom:16px;border:1px solid var(--purple);background:linear-gradient(180deg,rgba(155,107,224,.13),rgba(155,107,224,0))">'
    +'<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
    +'<div style="display:flex;align-items:center;gap:11px"><div style="font-size:30px">'+flame+'</div>'
    +'<div><div style="font-size:23px;font-weight:800;line-height:1">'+cur+'-day streak</div>'
    +'<div style="font-size:12px;color:var(--muted)">Best '+(s.best||0)+' · '+(cur>0?(toNext+' day'+(toNext===1?'':'s')+' to +'+STREAK_REWARD+' credits'):'Do one thing today to start')+'</div></div></div>'
    +'<div style="flex:1;min-width:150px"><div style="height:8px;background:#0e1320;border-radius:999px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#9B6BE0,#16A34A)"></div></div>'
    +'<div style="font-size:11px;color:var(--muted2);margin-top:4px">'+inWeek+' / 7 this week</div></div></div>'
    +'<div style="display:flex;gap:12px;align-items:center;margin-top:13px;background:#0e1320;border:1px solid var(--line);border-radius:12px;padding:12px 13px">'
    +'<div style="font-size:20px">'+ns.icon+'</div>'
    +'<div style="flex:1"><div style="font-size:10.5px;color:var(--purple);font-weight:800;letter-spacing:.5px">YOUR NEXT STEP</div>'
    +'<div style="font-weight:700;font-size:15px">'+ns.t+'</div><div style="font-size:12px;color:var(--muted);margin-top:1px">'+ns.d+'</div></div>'
    +'<button class="btn small" style="flex:none" onclick="'+ns.go+'">'+ns.cta+' →</button></div></div>';
}
function celebrate(){
  try{
    if(!document.getElementById('cfKF')){ var st=document.createElement('style'); st.id='cfKF'; st.textContent='@keyframes cfall{to{transform:translateY(106vh) rotate(720deg);opacity:0}}'; document.head.appendChild(st); }
    var c=document.createElement('div'); c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:4000;overflow:hidden';
    var cols=['#9B6BE0','#16A34A','#E0A33A','#3B82F6','#E0564A','#19C3B2'];
    for(var i=0;i<90;i++){ var p=document.createElement('div'); var sz=6+Math.random()*8;
      p.style.cssText='position:absolute;top:-24px;left:'+(Math.random()*100)+'%;width:'+sz+'px;height:'+(sz*0.6)+'px;background:'+cols[i%cols.length]+';border-radius:2px;transform:rotate('+(Math.random()*360)+'deg);animation:cfall '+(1.5+Math.random()*1.5)+'s linear '+(Math.random()*0.5)+'s forwards';
      c.appendChild(p); }
    document.body.appendChild(c); setTimeout(function(){ c.remove(); },3800);
  }catch(e){}
}

