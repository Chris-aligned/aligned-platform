/* Aligned app module: core.state.js (split from live; load order matters) */
const DB = {
  get user(){ return JSON.parse(localStorage.getItem('aws_user')||'null'); },
  set user(v){ localStorage.setItem('aws_user', JSON.stringify(v)); scheduleSync(); },
  get videos(){ return JSON.parse(localStorage.getItem('aws_videos')||'[]'); },
  set videos(v){ localStorage.setItem('aws_videos', JSON.stringify(v)); scheduleSync(); },
  // Persisted so chat history + the 30-day plan survive reloads (previously these were in-memory only and were lost).
  get agentChat(){ return JSON.parse(localStorage.getItem('aws_agentchat')||'null'); },
  set agentChat(v){ localStorage.setItem('aws_agentchat', JSON.stringify(v)); scheduleSync(); },
  // DB.plan = the CURRENT working plan (the one being viewed/edited/run). DB.plans = the saved library of plans.
  // Setting DB.plan also upserts it into the library by id, so a customer can keep several 30-day plans.
  get plan(){ return JSON.parse(localStorage.getItem('aws_plan')||'null'); },
  set plan(v){ localStorage.setItem('aws_plan', JSON.stringify(v));
    try{ if(v&&v.id){ var arr=JSON.parse(localStorage.getItem('aws_plans')||'[]'); var i=arr.findIndex(function(x){return x&&x.id===v.id;}); if(i>=0)arr[i]=v; else arr.push(v); localStorage.setItem('aws_plans',JSON.stringify(arr)); } }catch(e){}
    scheduleSync(); },
  get plans(){ return JSON.parse(localStorage.getItem('aws_plans')||'[]'); },
  set plans(v){ localStorage.setItem('aws_plans', JSON.stringify(v||[])); scheduleSync(); },
  get teaserDismissed(){ return localStorage.getItem('aws_teaser')==='1'; },
  set teaserDismissed(v){ localStorage.setItem('aws_teaser', v?'1':'0'); },
  clear(){ ['aws_user','aws_videos','aws_agentchat','aws_plan','aws_plans','aws_teaser'].forEach(function(k){localStorage.removeItem(k);}); }
};

/* ===== Server-side account store (cross-device source of truth) =====
   The app is no longer browser-only: the account (profile, plan, videos) is
   mirrored to n8n so it survives a cleared browser and follows the customer
   across devices. localStorage stays as a fast local cache. */
let _syncTimer=null, _syncing=false;
// ---- Deleted-video tombstones (the reason a delete now "sticks" across every device) ----
// A delete is recorded as a tombstone id in user.deletedVideos. Because devices merge on a
// last-writer-wins timestamp, a delete would otherwise come back whenever a device that still
// had the video wrote last. These helpers make the tombstone list authoritative: we UNION the
// tombstones from both sides on every merge, and we PRUNE any video whose id is tombstoned. So
// no matter which device syncs last, a deleted video can never reappear.
function tombUnion(a,b){ var out=[]; var seen={}; [a,b].forEach(function(list){ if(Array.isArray(list)) list.forEach(function(id){ if(id!=null && !seen[id]){ seen[id]=1; out.push(id); } }); }); return out.length>500?out.slice(-500):out; }
function pruneDeleted(videos, del){ if(!Array.isArray(videos)) return []; if(!Array.isArray(del)||!del.length) return videos; return videos.filter(function(v){ return v && del.indexOf(v.id)<0; }); }
// ---- Session token (signed by the server; proves who we are on every account read/write) ----
function tokenGet(){ try{ return localStorage.getItem('aws_token')||''; }catch(_){ return ''; } }
function tokenSet(t){ try{ if(t) localStorage.setItem('aws_token', t); }catch(_){} }
function tokenClear(){ try{ localStorage.removeItem('aws_token'); }catch(_){} } /* __awsTokenFetchWrap: attach signed session token to Aligned backend calls (P2 auth) */ (function(){ if(window.__awsTokenFetchWrap) return; window.__awsTokenFetchWrap=1; var _f=window.fetch; window.fetch=function(u,o){ try{ var url=(typeof u==='string')?u:((u&&u.url)||''); if(url.indexOf('/webhook/')>=0 && url.indexOf('alignedwebservices')>=0 && o && typeof o.body==='string'){ var t=(typeof tokenGet==='function')?tokenGet():''; if(t){ var j=JSON.parse(o.body); if(j && typeof j==='object' && !Array.isArray(j) && !j.token){ j.token=t; o=Object.assign({},o,{body:JSON.stringify(j)}); } } } }catch(_){} return _f.call(this,u,o); }; })();
var _reloginShown=false;
// Server says our token is missing/expired - send the user back to log in once to get a fresh one.
function requireRelogin(msg){
  if(_reloginShown) return; _reloginShown=true;
  tokenClear();
  try{
    var u=DB.user||{};
    if(mode!=='login' && typeof toggleAuth==='function') toggleAuth();
    var ae=document.getElementById('auEmail'); if(ae && u.email) ae.value=u.email;
    document.getElementById('app').classList.remove('show');
    var as=document.getElementById('authScreen'); if(as) as.style.display='';
  }catch(_){}
  toast(msg||'Please log in again to keep your account secure.');
}
function scheduleSync(){ if(typeof CONFIG==='undefined'||!CONFIG.ACCOUNT_SAVE) return; try{ localStorage.setItem('aws_dirtyAt', String(Date.now())); }catch(_){} clearTimeout(_syncTimer); _syncTimer=setTimeout(syncPush,1500); }
function syncPush(_attempt){
  try{
    const u=DB.user; if(!u||!u.email||!CONFIG.ACCOUNT_SAVE) return;
    const snap=Object.assign({}, u);
    // Never push a video that has been tombstoned - otherwise a stale device would re-upload a
    // deleted video and resurrect it for every other device on the next merge.
    var _del=(u.deletedVideos&&Array.isArray(u.deletedVideos))?u.deletedVideos:[];
    snap.deletedVideos=_del; snap._videos=pruneDeleted(DB.videos||[], _del); snap._plan=DB.plan||null; snap._plans=DB.plans||[]; snap._agentChat=DB.agentChat||null;
    delete snap.av4Credits; delete snap.credits; delete snap.pw; // wallet + password are server-authoritative - never let a client snapshot overwrite them
    var attempt=_attempt||0;
    fetch(CONFIG.ACCOUNT_SAVE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,token:tokenGet(),account:snap})})
      .then(function(r){ if(!r||!r.ok){ throw new Error('save '+(r?r.status:'failed')); } return r.json().catch(function(){return {};}); })
      .then(function(j){ if(j&&j.authRequired){ requireRelogin('Your session expired - please log in again to keep syncing.'); return; } try{ localStorage.removeItem('aws_dirtyAt'); localStorage.setItem('aws_lastServerAt', new Date().toISOString()); }catch(_){} })
      .catch(function(){
        // Don't lose the save on a transient network blip: retry a couple of times with backoff.
        if(attempt<2){ setTimeout(function(){ syncPush(attempt+1); }, 4000*(attempt+1)); }
        else { try{ if(typeof toast==='function') toast('We had trouble saving your latest changes. Check your connection - we’ll keep trying.'); }catch(_){} }
      });
  }catch(_){}
}
function syncPull(email){
  if(!CONFIG.ACCOUNT_GET||!email) return Promise.resolve(null);
  return fetch(CONFIG.ACCOUNT_GET+'?email='+encodeURIComponent(email)+'&token='+encodeURIComponent(tokenGet())).then(function(r){return r.json();})
    .then(function(j){ if(j&&j.authRequired){ requireRelogin('Your session expired - please log in again.'); return null; } return (j&&j.found)?j.account:null; }).catch(function(){ return null; });
}
// Restore a full account snapshot from the server into local storage (server wins).
function applyAccount(acc){
  if(!acc) return;
  const videos=acc._videos||[]; const plan=('_plan' in acc)?acc._plan:null; const chat=('_agentChat' in acc)?acc._agentChat:null; const plans=acc._plans||[];
  const clean=Object.assign({}, acc); delete clean._videos; delete clean._plan; delete clean._plans; delete clean._agentChat; delete clean.updatedAt;
  // Union this device's tombstones with the server's so a delete that happened on either side
  // wins, then drop any tombstoned video from the adopted list. Guarantees a delete stays deleted
  // even when we're doing a full "server wins" adopt.
  var _localDel=[]; try{ var _lu=JSON.parse(localStorage.getItem('aws_user')||'null'); if(_lu&&Array.isArray(_lu.deletedVideos)) _localDel=_lu.deletedVideos; }catch(_){}
  var _del=tombUnion(_localDel, clean.deletedVideos);
  clean.deletedVideos=_del;
  localStorage.setItem('aws_user', JSON.stringify(clean));
  localStorage.setItem('aws_videos', JSON.stringify(pruneDeleted(videos, _del)));
  localStorage.setItem('aws_plan', JSON.stringify(plan));
  localStorage.setItem('aws_plans', JSON.stringify(plans));
  localStorage.setItem('aws_agentchat', JSON.stringify(chat));
  // remember the server version we just adopted, and clear the local-changes flag (we're in sync now)
  try{ if(acc.updatedAt) localStorage.setItem('aws_lastServerAt', acc.updatedAt); localStorage.removeItem('aws_dirtyAt'); }catch(_){}
}

// ---- Full stock-avatar library: grouped into presenters-with-looks, cached, searchable ----
var PRESENTERS=[]; var LOOK_BY_ID={};
function lookLabelFix(fullName, first){ var s=String(fullName||'').trim(); if(s.toLowerCase().indexOf(String(first).toLowerCase())===0) s=s.slice(String(first).length).trim(); s=s.replace(/^[\(\)\-\s]+/,'').replace(/[\(\)]/g,'').replace(/^in\s+/i,'').replace(/\s+/g,' ').trim(); return s||'Default'; }
// Collapse the feed's over-split entries (e.g. "Abigail Office Front") into one presenter ("Abigail") with many looks.
function groupAvatarFeed(raw){
  var groups={};
  (raw||[]).forEach(function(e){
    if(!e||!e.name) return;
    var first=(String(e.name).trim().match(/^[A-Za-z]+/)||['Presenter'])[0];
    var g=groups[first]||(groups[first]={name:first, gender:(e.gender||'').toLowerCase(), looks:[]});
    (e.looks||[]).forEach(function(lk){ if(lk&&lk.id && g.looks.length<24) g.looks.push({id:lk.id, look:lookLabelFix(e.name,first), preview:lk.preview||'', voice:lk.voice||''}); });
  });
  return Object.keys(groups).map(function(k){return groups[k];}).filter(function(g){return g.looks.length;}).sort(function(a,b){return a.name.localeCompare(b.name);});
}
function applyPresenters(presenters){
  PRESENTERS=presenters; LOOK_BY_ID={};
  STOCK_AVATARS = presenters.map(function(g){
    var d=g.looks[0];
    g.looks.forEach(function(lk){ LOOK_BY_ID[lk.id]={id:lk.id,presenter:g.name,look:lk.look,preview:lk.preview,voice:lk.voice,gender:g.gender}; });
    // tier travels with the presenter all the way to the picker: 0 = the curated set we show by
    // default, 1 = the extra presenters hidden behind the "More avatars" button. If it got dropped
    // here the button would have nothing to reveal.
    return {id:d.id, name:g.name, preview:d.preview, voice:d.voice, looks:g.looks, gender:g.gender, presenter:g.name, group:g.group||'', looksCount:g.looksCount||g.looks.length, tier:(g.tier||0)};
  });
  try{ if(document.getElementById('avaPick')) renderAvaGrid(); }catch(e){}
}
/* ====================================================================================
   THE FULL AVATAR V PRESENTER LIBRARY

   PAGINATION LESSON - read this before "fixing" the avatar library again.
   The old stock library looked broken because every presenter had an A-name (Abigail,
   Adam, Alice...). That was never a HeyGen limitation. The old /webhook/avatars2 feed
   simply fetched page ONE of an alphabetical list and stopped. HeyGen's public library
   actually holds ~1,466 presenters / ~21,000 looks, and its list endpoints return an
   opaque `token` cursor that you MUST follow until has_more is false.

   That pagination now happens SERVER-SIDE, in the n8n workflow
   "Aligned - Avatar V Presenter Library", so the browser never waits on a 400-page pull
   and the HeyGen key never leaves the server. That workflow also enforces the two
   filters that matter:
     * the presenter must support the avatar_v render engine (our renders send
       engine:{type:"avatar_v"} - a look without it fails at render time), and
     * the preview image must be a PERMANENT unsigned heygen.ai URL. Many HeyGen previews
       are signed CloudFront links with an Expires= parameter; those die and leave broken
       images in the picker. Expiring URLs have burned this product before.

   Do NOT hardcode a shortlist to work around a pagination bug. FALLBACK_AVATARS above is
   a safety net for when the feed is unreachable, not the library.
   ==================================================================================== */
