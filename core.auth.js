/* Aligned app module: core.auth.js (split from live; load order matters) */
function loadAvatars(){
  if(!CONFIG.PRESENTERS_FEED) return;
  // 1) paint the cached library instantly, so the picker is never empty or slow
  try{
    // Cache key is _v2: presenters carry a tier field; bump the key whenever the presenter shape changes so stale caches are retired.
    var c=JSON.parse(localStorage.getItem('aws_avatars_cache_v2')||'null');
    if(c&&c.presenters&&c.presenters.length&&(Date.now()-(c.ts||0)<7*864e5)) applyPresenters(c.presenters);
  }catch(e){}
  // 2) refresh from the cached server feed in the background (fast - no live HeyGen call)
  fetch(CONFIG.PRESENTERS_FEED).then(function(r){return r.json();}).then(function(res){
    if(!res||res.ok!==true||!Array.isArray(res.presenters)||!res.presenters.length) return; // keep whatever we already show
    var presenters=res.presenters.map(function(p){
      // p.t is the tier the server gives us: 0 = the ~454 curated presenters (their photos are
      // permanent HeyGen images), 1 = the ~128 extra ones we recovered by re-hosting their photos
      // on Cloudinary. All of them render fine; we just keep the extras behind a button so the
      // library does not feel overwhelming on first open.
      return { name:(p.n||'Presenter'), gender:String(p.s||'').toLowerCase(), group:(p.g||''), looksCount:(p.k||1), tier:(p.t||0),
               looks:[{id:p.id, look:'Default', preview:(p.p||''), voice:(p.v||'')}] };
    }).filter(function(p){ return p.looks[0].id && p.looks[0].preview && p.looks[0].voice; });
    if(!presenters.length) return;
    applyPresenters(presenters);
    try{ localStorage.setItem('aws_avatars_cache_v2', JSON.stringify({ts:Date.now(),presenters:presenters})); }catch(e){}
  }).catch(function(){ /* offline or feed down - the cache or FALLBACK_AVATARS stays on screen */ });
}
// One presenter's other looks are only fetched when the customer actually opens that
// presenter, so browsing hundreds of them stays light.
var __looksCache={};
function loadPresenterLooks(groupId, cb){
  if(!groupId||!CONFIG.PRESENTER_LOOKS){ cb(null); return; }
  if(__looksCache[groupId]!==undefined){ cb(__looksCache[groupId]); return; }
  fetch(CONFIG.PRESENTER_LOOKS+'?group='+encodeURIComponent(groupId)).then(function(r){return r.json();}).then(function(res){
    var looks=null;
    if(res&&res.ok&&Array.isArray(res.looks)&&res.looks.length){
      looks=res.looks.map(function(l){ return {id:l.id, look:(l.l||'Default'), preview:(l.p||''), voice:(l.v||'')}; })
                     .filter(function(l){ return l.id && l.preview; });
      looks.forEach(function(l){ LOOK_BY_ID[l.id]={id:l.id, presenter:(res.name||''), look:l.look, preview:l.preview, voice:l.voice, gender:''}; });
    }
    __looksCache[groupId]=looks; cb(looks);
  }).catch(function(){ __looksCache[groupId]=null; cb(null); });
}

let mode = 'signup';
function toggleAuth(){
  mode = mode==='signup' ? 'login' : 'signup';
  document.getElementById('signupFields').classList.toggle('hidden', mode==='login');
  document.getElementById('phoneField').classList.toggle('hidden', mode==='login');
  document.getElementById('consentFields').classList.toggle('hidden', mode==='login');
  document.getElementById('authTitle').textContent = mode==='login' ? 'Welcome back' : 'Create your account';
  document.getElementById('authSub').textContent = mode==='login' ? 'Log in to your dashboard.' : 'Start remaking your reels into cinematic videos today.';
  document.getElementById('authBtn').textContent = mode==='login' ? 'Log in →' : 'Start free trial →';
  var pwl=document.getElementById('pwLabel'); if(pwl) pwl.textContent = mode==='login' ? 'Password' : 'Choose a password';
  var pwi=document.getElementById('auPassword'); if(pwi) pwi.placeholder = mode==='login' ? 'Your password' : 'At least 6 characters';
  document.querySelector('.trial-pill').classList.toggle('hidden', mode==='login');
  var mr=document.getElementById('magicRow'); if(mr) mr.style.display = mode==='login' ? 'block' : 'none';
  document.getElementById('authSwitch').innerHTML = mode==='login'
    ? "New here? <b onclick=\"toggleAuth()\">Create an account</b>"
    : "Already have an account? <b onclick=\"toggleAuth()\">Log in</b>";
}

// Comped accounts - these emails get the full platform free, no trial, no payment prompts.
const COMP_EMAILS = ['chris@alignedwebservices.ca'];
function pwHash(s){ var h=5381; for(var i=0;i<s.length;i++){ h=((h<<5)+h+s.charCodeAt(i))>>>0; } return 'h'+h; }
function applyComp(u){
  if(u && u.email && COMP_EMAILS.indexOf((u.email||'').toLowerCase())>-1){
    u.plan='creator'; u.status='active'; u.comped=true;
  }
  return u;
}
function authPost(body){ return fetch(CONFIG.AUTH_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(r){return r.json();}); }
async function doAuth(){
  const email = document.getElementById('auEmail').value.trim();
  if(!email || !email.includes('@')){ toast('Enter a valid email'); return; }
  const pw = (document.getElementById('auPassword').value||'');
  const btn=document.getElementById('authBtn'); if(btn){ btn.disabled=true; btn.style.opacity=.6; }
  function done(){ if(btn){ btn.disabled=false; btn.style.opacity=1; } }
  if(mode==='signup'){
    const name = document.getElementById('suName').value.trim();
    if(!name){ toast('Enter your name'); return done(); }
    if(!pw || pw.length<6){ toast('Choose a password (at least 6 characters)'); return done(); }
    const phone = document.getElementById('suPhone').value.trim();
    if(!phone){ toast('Enter your mobile number'); return done(); }
    const smsConsent = document.getElementById('suSmsConsent').checked;
    const emailConsent = document.getElementById('suEmailConsent').checked;
    if(!smsConsent){ toast('Please agree to receive text messages to continue'); return done(); }
    if(!emailConsent){ toast('Please agree to receive emails to continue'); return done(); }
    let res;
    try{ res = await authPost({action:'register', email:email, password:pw, name:name, phone:phone, plan:'creator', trialDays:CONFIG.TRIAL_DAYS, smsConsent:true, emailConsent:true}); }
    catch(e){ toast('Couldn’t reach the server - check your connection and try again.'); return done(); }
    if(!res || !res.ok){
      if(res && res.reason==='exists'){ toast('An account already exists for that email - please log in instead.'); }
      else { toast('Couldn’t create your account - please try again.'); }
      return done();
    }
    tokenSet(res.token);
    applyAccount(res.account); var nu=DB.user||{}; applyComp(nu); DB.user=nu; if(!Array.isArray(DB.videos)) DB.videos=[];
    if(CONFIG.SIGNUP_WEBHOOK) saveSignup(DB.user);
    try{ postReferral(email, name, (res.account&&res.account.plan)||DB.user.plan||'creator'); }catch(_){}
  } else {
    if(!pw){ toast('Enter your password'); return done(); }
    // Password is verified on the SERVER now - the browser never sees the stored hash.
    let res;
    try{ res = await authPost({action:'login', email:email, password:pw}); }
    catch(e){ toast('Couldn’t reach the server - check your connection and try again.'); return done(); }
    if(!res || !res.ok){
      if(res && res.reason==='nouser'){ toast('No account found for that email - please sign up first.'); }
      else { toast('Incorrect password'); }
      return done();
    }
    tokenSet(res.token);
    applyAccount(res.account); var uu=DB.user||{}; applyComp(uu); DB.user=uu;
  }
  _reloginShown=false;
  done();
  enterApp();
}

// If this visitor arrived through a partner link (?ref=CODE, saved to aws_ref), record the referral once they sign up.
function postReferral(email, name, plan){
  try{
    var ref=''; try{ ref=(localStorage.getItem('aws_ref')||'').trim(); }catch(_){}
    if(!ref || typeof CONFIG==='undefined' || !CONFIG.REFERRAL) return;
    fetch(CONFIG.REFERRAL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:ref, email:email, name:name, plan:plan})}).catch(function(){});
  }catch(_){}
}
function saveSignup(u){
  fetch(CONFIG.SIGNUP_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'signup',name:u.name,email:u.email,phone:u.phone,plan:u.plan,trialEnd:u.trialEnd,smsConsent:!!u.smsConsent,emailConsent:!!u.emailConsent,consentedAt:u.consentedAt})}).catch(()=>{});
  notifyChris('signup',{detail:'Started a '+CONFIG.TRIAL_DAYS+'-day trial'});
}
// Ping Chris by email (via n8n) when something needs a human - signups, add-on buys, connect requests.
function notifyChris(type, extra){
  try{ if(!CONFIG.NOTIFY_WEBHOOK) return; var u=DB.user||{};
    var body=Object.assign({type:type, name:u.name||'', email:u.email||'', phone:u.phone||'', plan:u.plan||''}, extra||{});
    fetch(CONFIG.NOTIFY_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(function(){});
  }catch(_){}
}

// Capitalise the first letter of each word for friendly display of names.
function titleCaseName(s){ return String(s||'').replace(/\b\w/g,function(c){return c.toUpperCase();}); }
// Show the user's uploaded profile picture / logo as the sidebar avatar, else their initial.
function applyAvatar(){
  var u=DB.user||{}; var el=document.getElementById('userInitial'); if(!el) return;
  if(u.profilePic){ el.textContent=''; el.style.backgroundImage="url('"+u.profilePic+"')"; el.style.backgroundSize='cover'; el.style.backgroundPosition='center'; }
  else { el.style.backgroundImage=''; el.textContent=((u.name||'A')[0]||'A').toUpperCase(); }
}
function uploadProfilePic(input){
  var f=(input.files||[])[0]; if(!f) return;
  var u=DB.user||{}; var st=document.getElementById('acPicStatus'); if(st) st.textContent='Uploading…';
  var pid='ppic_'+String(u.email||('u'+Date.now())).replace(/[^a-z0-9]/gi,'');
  var fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET); fd.append('public_id',pid);
  fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/image/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(x){
    var url=(x&&(x.secure_url||x.url))||''; if(!url){ if(st) st.textContent='Could not upload - try a PNG or JPG'; return; }
    var uu=DB.user||{}; uu.profilePic=url; DB.user=uu;   // set user auto-syncs to the server
    if(st) st.textContent='✓ Saved';
    var pv=document.getElementById('acPicPreview'); if(pv){ pv.style.backgroundImage="url('"+url+"')"; pv.style.backgroundSize='cover'; pv.style.backgroundPosition='center'; pv.textContent=''; }
    applyAvatar();
  }).catch(function(){ if(st) st.textContent='Could not upload - try a PNG or JPG'; });
}
function removeProfilePic(){
  var u=DB.user||{}; u.profilePic=''; DB.user=u; applyAvatar();
  try{ if(typeof go==='function') go('account'); }catch(e){}
}
