/* Aligned app module: core.session.js (split from live; load order matters) */
function enterApp(){
  const u = DB.user;
  if(u && !Array.isArray(u.twinLooks)){ u.twinLooks=[]; }   // heal old accounts where twinLooks was saved as a number
  if(u){ applyComp(u); DB.user = u; }   // comped emails get Concierge free on every load
  try{ rememberAccount(DB.user, tokenGet()); renderAcctMenu(); }catch(_){}   // keep the account switcher in sync
  document.getElementById('authScreen').style.display='none';
  document.getElementById('app').classList.add('show');
  document.getElementById('userName').textContent = titleCaseName(u.name);
  document.getElementById('userEmail').textContent = u.email;
  applyAvatar();
  updateTrialBar();
  loadAvatars();
  checkTwinReturn();
  go('home');
  // Deep-link from "My account" on the homepage: open Account & billing straight away.
  try{ if(/^#account/i.test(location.hash||'')){ go('account'); } }catch(e){}
  refreshFromServer();   // pull latest plan/billing/twin status (and restore videos on a fresh device)
  var tu=DB.user||{}; if(tu.twinGroupId && !(tu.twinReady && tu.twinPreview)){ startTwinPolling(); }
  if(tu.twinGroupId){ loadTwinLooks(); }
  startReadyPolling();   // move finished videos from "In the kitchen" to "Awaiting approval"
  // Deep-link from reminder emails: open the strategist chat straight away.
  try{ if(/^#(plan|chat|strategist|build)/i.test(location.hash||'')){ setTimeout(function(){ if(typeof cwToggle==='function') cwToggle(true); },500); } }catch(e){}
}
// Pull the twin's REAL looks from HeyGen (source of truth) so every recorded look shows in the pickers + plan,
// even on a fresh device. Excludes the base avatar (that's "Default look"). Preserves any custom name the user set.
function loadTwinLooks(){
  var u=DB.user||{}; if(!u.twinGroupId || typeof CONFIG==='undefined' || !CONFIG.TWIN_LOOKS) return;
  fetch(CONFIG.TWIN_LOOKS,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({group_id:u.twinGroupId})})
    .then(function(r){return r.json();}).then(function(res){
      if(!res||!Array.isArray(res.looks)) return;
      var uu=DB.user||{}; var base=uu.twinAvatarId;
      var prev={}; (Array.isArray(uu.twinLooks)?uu.twinLooks:[]).forEach(function(l){ if(l&&l.id) prev[l.id]=l; });
      uu.twinLooks=res.looks.filter(function(l){ return l.id && l.id!==base; }).map(function(l){
        var p=prev[l.id]||{};
        return { id:l.id, name:(p.name||l.name||'My look'), ready:(l.ready!==false), preview:(l.image||p.preview||'') };
      });
      // Auto-capture the twin's CLONED HeyGen voice so videos speak in the customer's own voice
      // (not a generic stand-in). Only set if we don't already have one.
      if(res.voiceId && !uu.twinVoiceId){ uu.twinVoiceId=res.voiceId; }
      DB.user=uu;
      try{ if(typeof renderAvaGrid==='function'){ var g=document.getElementById('avaGrid'); if(g) renderAvaGrid(); } }catch(e){}
    }).catch(function(){});
}
// Pull the server's copy and keep every device in sync. If another device saved more recently
// (and we have no unsaved local edits), adopt the full latest state so desktop and mobile match.
function refreshFromServer(){
  const u=DB.user; if(!u||!u.email||!CONFIG.ACCOUNT_GET) return;
  syncPull(u.email).then(function(acc){
    if(!acc) return; const cur=DB.user; if(!cur) return;
    var serverAt=acc.updatedAt||'';
    var lastAt=''; try{ lastAt=localStorage.getItem('aws_lastServerAt')||''; }catch(_){}
    var dirty=false; try{ dirty=!!localStorage.getItem('aws_dirtyAt'); }catch(_){}
    if(serverAt && serverAt>lastAt && !dirty){
      // Another device made the most recent change - pull the WHOLE account so this device matches it.
      applyAccount(acc);
      try{ var nu=JSON.parse(localStorage.getItem('aws_user')||'{}'); applyComp(nu); localStorage.setItem('aws_user', JSON.stringify(nu)); }catch(_){}
      creditRefresh();
      try{
        updateTrialBar();
        var un=DB.user||{};
        var unEl=document.getElementById('userName'); if(unEl) unEl.textContent=titleCaseName(un.name||'');
        var ueEl=document.getElementById('userEmail'); if(ueEl) ueEl.textContent=un.email||'';
        applyAvatar();
        var a=document.querySelector('#nav a.active'); go(a?a.dataset.view:'home');
      }catch(_){}
      return;
    }
    // Otherwise just refresh live status fields (billing / twin) without clobbering local content.
    ['plan','status','comped','trialEnd','twinAvatarId','twinVoiceId','twinGroupId','twinReady','twinPreview','twinVideoUrl','twinPhoto','elevenVoiceId','website','brandKnowledge','favorites','phone','name','rssAddon','rssFeeds','curPlanId','affiliateLink','affiliatePortal','isAffiliate','autopilot','profilePic'].forEach(function(k){ if(k in acc && acc[k]!=='' && acc[k]!=null) cur[k]=acc[k]; });
    // Tombstones must UNION (not overwrite) so a delete from this device and a delete from the
    // other device both survive. Then prune the local library against the merged list so a video
    // the other device deleted disappears here too - even when we're only refreshing status fields.
    var _del=tombUnion(cur.deletedVideos, acc.deletedVideos); cur.deletedVideos=_del;
    localStorage.setItem('aws_user', JSON.stringify(cur));
    creditRefresh(); // sync the unified wallet (runs server migration + monthly grant)
    if(_del.length){ var _cv=DB.videos||[]; var _pruned=pruneDeleted(_cv, _del); if(_pruned.length!==_cv.length){ localStorage.setItem('aws_videos', JSON.stringify(_pruned)); } }
    if((!DB.videos||!DB.videos.length) && acc._videos && acc._videos.length){ var _restore=pruneDeleted(acc._videos, _del); localStorage.setItem('aws_videos', JSON.stringify(_restore)); }
    if(!DB.plan && acc._plan){ localStorage.setItem('aws_plan', JSON.stringify(acc._plan)); }
    if((!DB.plans||!DB.plans.length) && acc._plans && acc._plans.length){ localStorage.setItem('aws_plans', JSON.stringify(acc._plans)); }
    if(!DB.agentChat && acc._agentChat){ localStorage.setItem('aws_agentchat', JSON.stringify(acc._agentChat)); }
    try{ updateTrialBar(); var a3=document.querySelector('#nav a.active'); go(a3?a3.dataset.view:'home'); }catch(_){}
  });
}
// Re-sync whenever the user returns to the app (e.g. picks up their phone after editing on desktop).
try{
  window.addEventListener('focus', function(){ try{ if(DB.user) refreshFromServer(); }catch(_){}});
  document.addEventListener('visibilitychange', function(){ try{ if(!document.hidden && DB.user) refreshFromServer(); }catch(_){}});
}catch(_){}

// Ask the server which of my submitted videos have finished rendering, and flip them from
// "processing" (In the kitchen) to "review" (Awaiting approval) so the dashboard reflects reality.
var _readyTimer=null;
// Pull finished videos for this account. Flips app-submitted videos processing->review AND surfaces
// daily-plan renders (which have no local entry) into the Library/Approvals so they can be reviewed in-app.
function checkReadyVideos(){
  try{
    var u=DB.user; if(!u||!u.email||!CONFIG.READY_VIDEOS) return;
    fetch(CONFIG.READY_VIDEOS+'?email='+encodeURIComponent(u.email)).then(function(r){return r.json();}).then(function(res){
      var ready=(res&&Array.isArray(res.videos))?res.videos:(Array.isArray(res)?res:[]); if(!ready.length) return;
      var v=DB.videos||[]; var changed=false, seenChanged=false;
      var seen=(u.readySeen&&Array.isArray(u.readySeen))?u.readySeen:[];
      var del=(u.deletedVideos&&Array.isArray(u.deletedVideos))?u.deletedVideos:[];
      ready.forEach(function(s){
        if(!s||!s.videoId) return;
        if(del.indexOf(s.videoId)>=0) return; // user deleted it - never resurface
        var ex=v.find(function(x){return x.id===s.videoId;});
        if(ex){
          if(ex.status==='processing'){
            ex.status='review'; ex.videoUrl=s.videoUrl||ex.videoUrl; ex.outUrl=s.videoUrl||ex.outUrl;
            if(!ex.src && s.videoUrl) ex.src=s.videoUrl.replace(/^https?:\/\//,'');
            if(s.caption) ex.captionText=cleanCaption(s.caption);
            if(s.thumbnailUrl) ex.thumbUrl=s.thumbnailUrl;
            changed=true;
          } else { if(s.caption && !ex.captionText){ ex.captionText=cleanCaption(s.caption); changed=true; } if(s.thumbnailUrl && s.thumbnailUrl!==ex.thumbUrl){ ex.thumbUrl=s.thumbnailUrl; changed=true; } }
        } else if(seen.indexOf(s.videoId)<0){
          // a finished video not submitted from this browser (e.g. a daily-plan render) - show it for review
          var isDaily=/^daily-/i.test(s.videoId);
          var isRss=/^rss-/i.test(s.videoId);
          var isAv4=/-av4$/i.test(s.videoId);
          var dayM=String(s.videoId).match(/-d(\d+)-/i);
          var title=isAv4?'Ultra-realistic version':(isDaily?('Daily reel'+(dayM?(' · Day '+dayM[1]):'')):(isRss?'From your feed':(s.title||'Your video')));
          v.unshift({ id:s.videoId, title:title, src:'', status:'review', videoUrl:s.videoUrl, outUrl:s.videoUrl, thumbUrl:s.thumbnailUrl||'', captionText:cleanCaption(s.caption||''), avatar:'twin', daily:isDaily, isAv4:isAv4, created:Date.now() });
          changed=true;
        }
        if(seen.indexOf(s.videoId)<0){ seen.push(s.videoId); seenChanged=true; }
      });
      if(changed){ DB.videos=v; }
      if(seenChanged){ u.readySeen=seen.slice(-300); DB.user=u; }
      if(changed){ try{ refreshApvBadge(); }catch(e){} try{ var a=document.querySelector('#nav a.active'); var view=a?a.dataset.view:'home'; if(view==='approvals'||view==='library'||view==='home') go(view); }catch(e){} }
    }).catch(function(){});
  }catch(e){}
}
// Auto-heal: if a render has been "processing" far longer than a real render takes (isStale = 25 min),
// re-fire it ONCE automatically so a one-off backend hiccup can't leave the customer stuck forever.
// Guarded by _autoRetried so it never loops or double-charges beyond a single retry; after that the
// customer still has the manual Retry button. Upload/faceless need the original files, so they aren't
// silently re-fired (their manual Retry still works).
function _autoRetryStalled(){
  try{
    var v=DB.videos||[]; var did=false;
    v.forEach(function(x){
      if(!isStale(x) || x._autoRetried) return;
      if(x.mode==='upload' || x.avatar==='none') return;
      x._autoRetried=true; x.created=Date.now(); x.rerender=false; x.rejectReasons=[]; x.rejectNote='';
      try{ sendToEngine(x,[]); }catch(e){}
      did=true;
    });
    if(did){ DB.videos=v; }
  }catch(e){}
}
function _hasProcessing(){ try{ return (DB.videos||[]).some(function(x){return x&&x.status==='processing';}); }catch(e){ return false; } }
// Adaptive poller: check often only while something is actually rendering, rarely when idle, and never
// while the tab is hidden. Replaces the old fixed 45s ping that hammered the backend around the clock.
function _readyTick(){
  try{ if(!document.hidden){ checkReadyVideos(); _autoRetryStalled(); } }catch(e){}
  var delay = document.hidden ? 120000 : (_hasProcessing() ? 30000 : 300000);
  _readyTimer=setTimeout(_readyTick, delay);
}
var _readyVisBound=false;
function startReadyPolling(){
  if(_readyTimer){ clearTimeout(_readyTimer); _readyTimer=null; }
  if(!_readyVisBound){ _readyVisBound=true; try{ document.addEventListener('visibilitychange', function(){ if(!document.hidden){ try{ checkReadyVideos(); _autoRetryStalled(); }catch(e){} } }); }catch(e){} }
  _readyTick();
}

// Sign out of the CURRENT account only. Fully clears the active session (token + sync markers too, so a
// new account starts clean). If other client accounts are remembered, boot loads the next one; otherwise
// the login screen shows. "Sign out of all accounts" (in the switcher) wipes everything.
function logout(){
  try{
    var cur=(DB.user&&DB.user.email||'').toLowerCase();
    var a=getAccounts().filter(function(x){return (x.email||'').toLowerCase()!==cur;});
    saveAccounts(a);
  }catch(_){}
  DB.clear();
  clearActiveSession();   // also removes aws_token + aws_lastServerAt + aws_dirtyAt (DB.clear left these behind)
  location.reload();
}

function daysLeft(){
  const u=DB.user; if(!u||!u.trialEnd) return 0;
  return Math.max(0, Math.ceil((u.trialEnd-Date.now())/86400000));
}
function trialRemainingText(){
  const u=DB.user; if(!u||!u.trialEnd) return 'Trial';
  let ms = u.trialEnd - Date.now();
  if(ms<=0) return 'Trial ended';
  const d=Math.floor(ms/86400000); ms-=d*86400000;
  const h=Math.floor(ms/3600000); ms-=h*3600000;
  const m=Math.floor(ms/60000);
  if(d>=1) return d+'d '+h+'h left in trial';
  if(h>=1) return h+'h '+m+'m left in trial';
  return m+'m left in trial';
}
var _trialTimer=null;
function updateTrialBar(){
  const u=DB.user; if(!u) return;
  // Property switcher (Home · App · CRM): show only to paying customers ($97/mo Creator or higher,
  // which is any active plan) or those still inside the 7-day free trial. Hidden once the trial ends
  // with no plan, so lapsed/free users don't see a CRM link they can't use.
  const sw=document.getElementById('propSwitch');
  // Every logged-in account has its own CRM sub-account now, and agencies switch between client accounts,
  // so the Home/App/CRM switcher always shows for a logged-in user (no longer hidden on lapsed trials).
  if(sw){ sw.style.display = (u && u.email) ? 'flex' : 'none'; }
  const bar=document.getElementById('trialbar');
  if(u.status==='active'){ if(_trialTimer){clearInterval(_trialTimer);_trialTimer=null;} bar.innerHTML='<span>✓</span> '+((PLANS[u.plan]||PLANS.creator).name)+' plan · <b style="cursor:pointer" onclick="go(\'account\')">Manage</b>'; return; }
  const tt=document.getElementById('trialText'); if(tt) tt.textContent = trialRemainingText();
  // keep it visibly counting down
  if(!_trialTimer){ _trialTimer=setInterval(function(){ var t=document.getElementById('trialText'); if(t) t.textContent=trialRemainingText(); }, 30000); }
}

