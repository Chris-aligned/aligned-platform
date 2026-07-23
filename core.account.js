/* Aligned app module: core.account.js (split from live; load order matters) */
function hasSocial(){ const u=DB.user||{}; return !!u.comped||!!u.socialAddon; }
function goSocials(){ go('socials'); }   // Hands-free posting is included in every plan - no upsell.
let connectingPlatform=null;
function openConnect(p){
  connectingPlatform=p;
  document.getElementById('connectTitle').textContent='Connect '+p;
  document.getElementById('connectPlatform').textContent=p;
  document.getElementById('connectConsent').checked=false;
  var cc=document.getElementById('connectCreate');
  if(cc){ var su=SIGNUP_URLS[p]; cc.innerHTML = su ? ("Don't have "+(p==='Instagram'||p==='X'?'an':'a')+" "+p+" account yet? <a href=\""+su+"\" target=\"_blank\" rel=\"noopener\" style=\"color:var(--purple);font-weight:600\">Create one →</a>") : ''; }
  document.getElementById('connectModal').classList.add('show');
}
function closeConnect(){ document.getElementById('connectModal').classList.remove('show'); connectingPlatform=null; }
function confirmConnect(){
  if(!document.getElementById('connectConsent').checked){ toast('Please authorize so we can send your connect link'); return; }
  const u=DB.user; u.socials=u.socials||{}; u.socials[connectingPlatform]='pending'; DB.user=u;
  const p=connectingPlatform;
  if(CONFIG.CONNECT_WEBHOOK){
    const link=(CONFIG.CONNECT_AUTH_URL||'')+'?platform='+encodeURIComponent(p)+'&email='+encodeURIComponent(u.email||'');
    fetch(CONFIG.CONNECT_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connect',platform:p,name:u.name,email:u.email,phone:u.phone,authorizeUrl:link,consent:true,consentedAt:new Date().toISOString()})}).catch(()=>{});
  }
  notifyChris('connect_request',{detail:p});
  closeConnect();
  toast('<span class="ok">✓</span> We\'ve texted and emailed you a secure link to connect '+p+'.');
  go('socials');
}
// Re-send the connect link for a platform that's still "Connecting…"
function resendConnect(p){
  var u=DB.user||{};
  if(CONFIG.CONNECT_WEBHOOK){
    var link=(CONFIG.CONNECT_AUTH_URL||'')+'?platform='+encodeURIComponent(p)+'&email='+encodeURIComponent(u.email||'');
    fetch(CONFIG.CONNECT_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'connect',platform:p,name:u.name,email:u.email,phone:u.phone,authorizeUrl:link,consent:true,consentedAt:new Date().toISOString()})}).catch(function(){});
  }
  notifyChris('connect_request',{detail:p+' (resend)'});
  toast('<span class="ok">✓</span> Resent your '+p+' connect link by text and email.');
}
// Clear a stuck "Connecting…" so the Connect button comes back and you can resubmit.
function cancelConnect(p){
  var u=DB.user||{}; u.socials=u.socials||{}; delete u.socials[p]; DB.user=u;
  toast('Cancelled - you can resubmit '+p+' whenever you\'re ready.');
  go('socials');
}
// Mark a platform as connected once you've authorized it on the platform's own page.
function markConnected(p){
  var u=DB.user||{}; u.socials=u.socials||{}; u.socials[p]='connected'; DB.user=u;
  notifyChris('connect_done',{detail:p});
  toast('<span class="ok">✓</span> '+p+' is connected - your approved videos will post here.');
  go('socials');
}
// Revert a connected platform back to not-connected.
function disconnectSocial(p){
  var u=DB.user||{}; u.socials=u.socials||{}; delete u.socials[p]; DB.user=u;
  toast(p+' disconnected - we\'ll stop posting there.');
  go('socials');
}

function choosePlan(k){
  const u=DB.user;
  if(u && u.comped){ toast('<span class="ok">✓</span> Your account is comped - it is on us 🎉'); return; }
  if(CONFIG.STRIPE_LINKS[k]){ window.location.href=CONFIG.STRIPE_LINKS[k]; return; }
  u.plan=k; u.status='active'; DB.user=u; updateTrialBar();
  toast('<span class="ok">✓</span> '+PLANS[k].name+' selected (Stripe checkout wires in here)');
  go('account');
}
function manageBilling(){ var u=DB.user; if(u&&u.comped){ toast('No billing - your account is comped 🎉'); return; } if(CONFIG.STRIPE_PORTAL){window.open(CONFIG.STRIPE_PORTAL,'_blank');return;} toast('Stripe billing portal opens here'); }

// ===== Light / dark theme (dark is the default) =====
function currentTheme(){ return document.documentElement.getAttribute('data-theme')==='light' ? 'light' : 'dark'; }
function updateThemeLabel(){ var l=document.getElementById('themeLabel'); if(l){ l.textContent = currentTheme()==='light' ? 'Dark mode' : 'Light mode'; } }
function toggleTheme(){
  var next = currentTheme()==='light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  try{ localStorage.setItem('aws_theme', next); }catch(e){}
  updateThemeLabel();
}
try{ window.addEventListener('DOMContentLoaded', updateThemeLabel); }catch(e){}

// ===== Suggest a feature (feedback) =====
function openFeedback(){ var m=document.getElementById('feedbackModal'); if(m){ m.classList.add('show'); var t=document.getElementById('fbMessage'); if(t){ setTimeout(function(){try{t.focus();}catch(e){}},60); } } }
function closeFeedback(){ var m=document.getElementById('feedbackModal'); if(m) m.classList.remove('show'); }
function sendFeedback(){
  var msg=(document.getElementById('fbMessage').value||'').trim();
  if(!msg){ toast('Tell us a little about the feature first'); return; }
  var title=(document.getElementById('fbTitle').value||'').trim();
  var u=DB.user||{};
  var btn=document.getElementById('fbSendBtn'); if(btn){ btn.disabled=true; btn.textContent='Sending…'; }
  var payload={ email:(u.email||''), name:(u.name||''), plan:(u.plan||'creator'), title:title, message:msg };
  var done=function(){
    if(btn){ btn.disabled=false; btn.textContent='Send suggestion'; }
    var t=document.getElementById('fbTitle'), mg=document.getElementById('fbMessage'); if(t)t.value=''; if(mg)mg.value='';
    closeFeedback();
    toast('<span class="ok">✓</span> Thanks - we read every suggestion.');
  };
  if(CONFIG.FEEDBACK){
    fetch(CONFIG.FEEDBACK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(done).catch(done);
  } else { done(); }
}

// ===== Partner program (affiliate) =====
// affiliateLink / affiliatePortal / isAffiliate are synced from the server (Account Store) once
// Chris enrols the customer as an affiliate in GHL - see refreshFromServer whitelist.
function affiliateCard(){
  var u=DB.user||{};
  var link=(u.affiliateLink||'').trim();
  var portal=(u.affiliatePortal||'').trim();
  if(u.isAffiliate && link){
    return '<div class="sect-title">Partner program</div>'
      +'<div class="card">'
      +'<div style="display:flex;align-items:center;gap:8px;margin:0 0 10px;flex-wrap:wrap"><span class="badge-status s-ready"><span class="d"></span>Active partner</span><span style="font-size:12.5px;color:var(--muted2)">You earn 30% recurring on every referral</span></div>'
      +'<div class="field"><label>Your referral link</label><div style="display:flex;gap:8px;align-items:center"><input id="afLink" readonly value="'+link.replace(/"/g,'&quot;')+'" style="flex:1"/><button class="btn small" style="white-space:nowrap" onclick="copyReferral()">Copy</button></div></div>'
      +(portal?'<button class="btn ghost small" style="margin-top:10px" onclick="window.open(\''+portal.replace(/'/g,"\\'")+'\',\'_blank\')">Open partner portal</button>':'')
      +'<p style="color:var(--muted2);font-size:12px;margin:10px 0 0">Share your link anywhere. Anyone who signs up through it stays tracked to you, and you get paid every month they stay.</p>'
      +'</div>';
  }
  return '<div class="sect-title">Partner program</div>'
    +'<div class="card">'
    +'<div style="font-size:14px;font-weight:700;margin:0 0 4px">Earn 30% recurring</div>'
    +'<p style="color:var(--muted);font-size:13px;margin:0 0 12px">Refer businesses to Aligned and earn 30% of every subscription - every month they stay. Free to join, and we hand you the captions, clips, and graphics to share.</p>'
    +'<button class="btn small" id="afJoinBtn" onclick="joinAffiliate()">Become a partner</button>'
    +'<div id="afJoinMsg" style="font-size:12.5px;color:var(--muted2);margin-top:10px"></div>'
    +'</div>';
}
function copyReferral(){
  var el=document.getElementById('afLink'); if(!el) return;
  try{ el.select(); el.setSelectionRange(0,99999); }catch(e){}
  var done=function(){ toast('<span class="ok">✓</span> Referral link copied'); };
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(el.value).then(done).catch(function(){ try{document.execCommand('copy');}catch(e){} done(); }); }
  else { try{document.execCommand('copy');}catch(e){} done(); }
}
function joinAffiliate(){
  var u=DB.user||{};
  var btn=document.getElementById('afJoinBtn'); var msg=document.getElementById('afJoinMsg');
  if(btn){ btn.disabled=true; btn.textContent='Sending…'; }
  fetch('https://alignedwebservices.app.n8n.cloud/webhook/aligned-lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'affiliate',source:'app-account',name:u.name||'',email:u.email||'',phone:u.phone||'',message:'Requested to join the partner program from inside their Aligned account.'})})
    .then(function(r){ if(!r.ok) throw new Error('bad'); return r; })
    .then(function(){ if(msg){ msg.style.color='#8fe0ad'; msg.textContent="You're on the list! We'll set you up and email your partner link shortly - it'll appear right here."; } if(btn){ btn.textContent='Request sent ✓'; } })
    .catch(function(){ if(msg){ msg.style.color='#e88'; msg.textContent='Something went wrong - email chris@alignedwebservices.ca and we\'ll set you up.'; } if(btn){ btn.disabled=false; btn.textContent='Become a partner'; } });
}
// ===== Social Autopilot (DM + comment automation + growth via Gram Genies, run behind the scenes) =====
function apEsc(s){ return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function openProModal(){ var m=document.getElementById('proAcctModal'); if(m) m.classList.add('show'); }
function closeProModal(){ var m=document.getElementById('proAcctModal'); if(m) m.classList.remove('show'); }
function openAutopilot(){ var u=DB.user||{}; var ap=u.autopilot||{}; var set=function(id,v){var e=document.getElementById(id); if(e) e.value=(v||'');}; set('apHandle',ap.handle); set('apFb',ap.fbPage); set('apTargets',ap.targets); set('apGoals',ap.goals); set('apAvoid',ap.avoid); var m=document.getElementById('autopilotModal'); if(m) m.classList.add('show'); }
function closeAutopilot(){ var m=document.getElementById('autopilotModal'); if(m) m.classList.remove('show'); }
function submitAutopilot(){
  var g=function(id){ var e=document.getElementById(id); return e?(e.value||'').trim():''; };
  var handle=g('apHandle'); if(!handle){ toast('Add your Instagram handle so we know which account to set up'); return; }
  var u=DB.user||{};
  var already=(u.autopilot&&u.autopilot.status==='active');
  u.autopilot={ status: already?'active':'setup', handle:handle, fbPage:g('apFb'), targets:g('apTargets'), goals:g('apGoals'), avoid:g('apAvoid'), requestedAt:(u.autopilot&&u.autopilot.requestedAt)||Date.now() };
  DB.user=u;
  var ap=u.autopilot;
  var payload={ email:u.email||'', name:u.name||'', handle:handle, fbPage:ap.fbPage||'', targets:ap.targets||'', goals:ap.goals||'', avoid:ap.avoid||'', website:u.website||'', plan:u.plan||'', phone:u.phone||'' };
  if(typeof CONFIG!=='undefined' && CONFIG.AUTOPILOT_ONBOARD){
    fetch(CONFIG.AUTOPILOT_ONBOARD,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .catch(function(){ notifyChris('autopilot_setup',{detail:'Onboard webhook failed. IG: '+handle+' | Goal: '+(ap.goals||'-')}); });
  } else {
    var sheet='Instagram: '+handle+' || FB Page: '+(ap.fbPage||'-')+' || Targets: '+(ap.targets||'-')+' || Goal/Audience: '+(ap.goals||'-')+' || Avoid: '+(ap.avoid||'-')+' || Plan: '+(u.plan||'-');
    notifyChris('autopilot_setup',{detail:sheet});
  }
  closeAutopilot();
  toast('<span class="ok">✓</span> You\'re in! We\'re setting up your Social Autopilot - we\'ll email you to connect Instagram and confirm you\'re live.');
  try{ go('account'); }catch(e){}
}
function buyAutopilot(){
  notifyChris('autopilot_buy',{detail:'Creator requested Social Autopilot ($297/mo)'});
  if(typeof CONFIG!=='undefined' && CONFIG.SOCIAL_AUTOPILOT_LINK){ window.location.href=CONFIG.SOCIAL_AUTOPILOT_LINK; return; }
  toast('Great choice - opening your setup. We\'ll confirm the $297/mo billing with you.');
  setTimeout(openAutopilot, 350);
}
function autopilotCard(){
  var u=DB.user||{};
  var included=!!u.comped;
  var ap=u.autopilot||null;
  var head='<div class="sect-title">Social Autopilot</div>';
  if(ap&&ap.status){
    var label=(ap.status==='active')?'Active':'Setup in progress';
    return head+'<div class="card">'
      +'<div style="display:flex;align-items:center;gap:8px;margin:0 0 8px;flex-wrap:wrap"><span class="badge-status s-ready"><span class="d"></span>'+label+'</span><span style="font-size:12.5px;color:var(--muted2)">We reply to your DMs &amp; comments and grow your following - hands-free.</span></div>'
      +'<p style="color:var(--muted2);font-size:12.5px;margin:0">Set up for '+(ap.handle?('@'+apEsc(ap.handle.replace(/^@/,''))):'your account')+'. We\'ll email you to connect Instagram and confirm you\'re live. Need to change something? <a class="link" style="color:var(--purple);cursor:pointer" onclick="openAutopilot()">Update details</a>.</p>'
      +'</div>';
  }
  var body='';
  if(included){
    body='<div style="display:flex;align-items:center;gap:8px;margin:0 0 6px;flex-wrap:wrap"><span class="badge-status s-ready"><span class="d"></span>Included</span><span style="font-size:13px;color:var(--muted2)">on your plan</span></div>'
      +'<p style="color:var(--muted);font-size:13px;margin:0 0 12px">We reply to your DMs, respond to comments, and grow your following on autopilot - so your Instagram works even when you don\'t.</p>'
      +'<button class="btn small" onclick="openAutopilot()">Set up Social Autopilot</button>';
  } else {
    body='<div style="font-size:14px;font-weight:700;margin:0 0 4px">Your Instagram, on autopilot - $297/mo</div>'
      +'<p style="color:var(--muted);font-size:13px;margin:0 0 12px">We reply to your DMs, respond to comments, and grow your following for you. Add it to your plan and we handle the rest.</p>'
      +'<button class="btn small" onclick="buyAutopilot()">Add Social Autopilot - $297/mo</button>';
  }
  return head+'<div class="card">'+body+'</div>';
}

// Optional hi-res portrait for the sharpest ultra-realistic (Avatar IV) videos.
// A single crisp photo beats a video frame (no motion blur / compression), so we offer it first.
function ultraPhotoCard(){
  var u=DB.user||{};
  if(!(u.twinReady && u.twinAvatarId)) return ''; // only relevant once they have a twin
  var have=(u.twinPhoto||'').trim();
  var thumb = have ? ('<img src="'+av4SourceImage(u)+'" alt="Ultra photo" style="width:54px;height:96px;object-fit:cover;border-radius:10px;border:1px solid var(--line)">') : '';
  var status = have ? '<span style="color:#7ee0a8;font-weight:600">✓ Using your photo for the sharpest results</span>'
                    : '<span style="color:var(--muted2)">No photo yet - we\'ll use a frame from your twin video for now.</span>';
  return '<div class="sect-title">Ultra-realistic photo</div>'
    + '<div class="card">'
    +   '<div style="display:flex;gap:14px;align-items:flex-start">'
    +     (thumb?('<div>'+thumb+'</div>'):'')
    +     '<div style="flex:1">'
    +       '<p style="color:var(--muted);font-size:13px;margin:0 0 8px">For the crispest ultra-realistic videos, add one clear, well-lit head-and-shoulders photo of yourself. A sharp photo beats a video still every time.</p>'
    +       '<div style="font-size:12px;margin:0 0 10px" id="twinPhotoStatus">'+status+'</div>'
    +       '<label class="btn small" style="cursor:pointer">'+(have?'Replace photo':'Add a photo')+'<input type="file" accept="image/*" style="display:none" onchange="twinPhotoUpload(this)"></label>'
    +     '</div>'
    +   '</div>'
    + '</div>';
}
function twinPhotoUpload(input){
  var f=(input.files||[])[0]; if(!f) return;
  var u=DB.user||{}; var st=document.getElementById('twinPhotoStatus'); if(st) st.textContent='Uploading…';
  var pid='ultra_'+String(u.email||'x').replace(/[^a-z0-9]/gi,'_')+'_'+Date.now();
  var fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET); fd.append('public_id',pid);
  fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/image/upload',{method:'POST',body:fd})
    .then(function(r){return r.json();}).then(function(x){
      var url=x&&(x.secure_url||x.url);
      if(url){ var uu=DB.user||{}; uu.twinPhoto=url; DB.user=uu; if(typeof render==='function'){ go('account'); } }
      else if(st){ st.textContent='Could not upload that image - please try another.'; }
    }).catch(function(){ if(st) st.textContent='Could not upload that image - please try again.'; });
}
function buyAddon(k){ var u=DB.user;
  if(k==='autopilot'){ buyAutopilot(); return; }   // Social engagement = Social Autopilot ($297/mo)
  if(k==='rss' && u && u.comped){ u.rssAddon=true; DB.user=u; go('account'); setTimeout(function(){ var el=document.getElementById('rssNew'); if(el){ try{el.scrollIntoView({behavior:'smooth',block:'center'});}catch(_){}; el.focus(); } toast('<span class="ok">✓</span> News Feed to Video is on - paste the feed you want and we\'ll make one video a day from it.'); }, 260); return; }
  if(u&&u.comped){ toast('<span class="ok">✓</span> Comped - this is already included on your account'); return; }
  notifyChris('addon_buy',{detail:k});
  if(CONFIG.STRIPE_LINKS[k]){ window.location.href=CONFIG.STRIPE_LINKS[k]; return; }
  // no payment link yet (e.g. RSS) - fall back to a request so Chris can set it up + bill
  toast('<span class="ok">✓</span> Got it - we\'ll set up your '+(k==='rss'?'News Feed to Video':k)+' add-on and reach out to confirm billing'); }
function requestAddon(name){ var u=DB.user||{}; if(CONFIG.SIGNUP_WEBHOOK){ fetch(CONFIG.SIGNUP_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'addon_request',addon:name,email:u.email,name:u.name,phone:u.phone})}).catch(function(){}); } notifyChris('addon_request',{detail:name}); toast('<span class="ok">✓</span> Got it - we\'ll reach out to set up '+name+' for you'); }
// ===== News Feed to Video add-on =====
function hasRss(){ var u=DB.user||{}; return !!u.rssAddon || !!u.comped; }   // comped accounts (Chris) get it for testing
function rssCard(){
  if(!hasRss()){
    return '<div class="sect-title">News Feed to Video</div>'
      +'<div class="card"><p style="color:var(--muted);font-size:13px;margin:0 0 4px">Turn a blog, newsletter or podcast feed into reels automatically - one video per day per feed, straight to your Approvals. It never uses your credits. As soon as you add it, we ask for the feed you want.</p>'
      +'<p style="font-size:12px;color:var(--muted2);margin:0 0 12px">$'+RSS_PRICE+'/mo · available on any plan.</p>'
      +'<button class="btn small" onclick="buyAddon(\'rss\')">Add News Feed to Video - $'+RSS_PRICE+'/mo</button></div>';
  }
  var u=DB.user||{}; var feeds=Array.isArray(u.rssFeeds)?u.rssFeeds:[];
  var rows = feeds.length ? feeds.map(function(f,i){
    return '<div class="kv" style="align-items:center"><span class="l" style="font-size:13px;word-break:break-all">'+cwEsc(f.url||f)+'</span>'
      +'<button class="btn ghost small" style="white-space:nowrap" onclick="removeRssFeed('+i+')">Remove</button></div>';
  }).join('') : '<p style="color:var(--muted2);font-size:13px;margin:0 0 6px">No feeds yet - add your first one below.</p>';
  return '<div class="sect-title">News Feed to Video <span class="badge-status s-ready" style="margin-left:6px"><span class="d"></span>On</span></div>'
    +'<div class="card">'
    +'<p style="color:var(--muted);font-size:13px;margin:0 0 12px">We check your feeds and turn each new post into a reel in your voice - one video per day per feed, sent to your <b>Approvals</b> first. Never uses your credits. Paste a blog, newsletter or podcast RSS URL below.</p>'
    +rows
    +'<div class="field" style="margin-top:12px"><label>Add a feed</label><input id="rssNew" placeholder="https://yourblog.com/feed or a podcast RSS URL"/></div>'
    +'<button class="btn small" onclick="addRssFeed()">Add feed</button>'
    +'</div>';
}
function addRssFeed(){
  var inp=document.getElementById('rssNew'); var url=(inp&&inp.value||'').trim();
  if(!url){ toast('Paste a feed URL first'); return; }
  if(!/^https?:\/\//i.test(url)) url='https://'+url;
  var u=DB.user||{}; var feeds=Array.isArray(u.rssFeeds)?u.rssFeeds:[];
  if(feeds.some(function(f){return (f.url||f)===url;})){ toast('That feed is already added'); return; }
  feeds.push({url:url, added:Date.now()}); u.rssFeeds=feeds; DB.user=u;
  syncRss();
  toast('<span class="ok">✓</span> Feed added - new posts will start becoming reels');
  go('account');
}
function removeRssFeed(i){
  var u=DB.user||{}; var feeds=Array.isArray(u.rssFeeds)?u.rssFeeds:[];
  if(i<0||i>=feeds.length) return;
  if(!confirm('Remove this feed? We\'ll stop making videos from it.')) return;
  feeds.splice(i,1); u.rssFeeds=feeds; DB.user=u;
  syncRss(); go('account');
}
// push the customer's feeds to the backend so the RSS engine knows what to watch
function syncRss(){
  var u=DB.user||{}; if(!CONFIG.RSS_SAVE||!u.email) return;
  fetch(CONFIG.RSS_SAVE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    email:u.email, phone:u.phone, name:u.name,
    active:!!hasRss(),
    feeds:(Array.isArray(u.rssFeeds)?u.rssFeeds:[]).map(function(f){return f.url||f;}),
    avatar_id:(u.twinAvatarId||'twin'), voice_id:(u.twinVoiceId||'')
  })}).catch(function(){});
}
// ===== Aligned Credits - one wallet for every premium extra =====
var TOKEN_THUMB=15;  // optional cinematic (Higgsfield) thumbnail - same cost for everyone
var TOKEN_CLIP=70;   // (legacy) Avatar Shots cinematic clip
var TOKEN_SCENE=150; // Cinematic scene clip (AI scene starring your twin)
function addonLbl(c){ return '<span style="color:#cbb6ff">('+c+' cr)</span>'; }
// Per-day add-on row: a thumbnail is an optional credit add-on, available to every plan for the same cost.
function dayAddonsHtml(d){
  var parts=[];
  parts.push('<label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" class="day-premthumb" style="width:auto;flex:none" '+(d.premiumThumb?'checked':'')+' onchange="planCostUpdate()"/> 🖼️ Add a thumbnail '+addonLbl(TOKEN_THUMB)+'</label>');
  if(!parts.length) return '';
  return '<div class="day-addons" onclick="event.stopPropagation()" style="display:flex;gap:14px;flex-wrap:wrap;margin-top:7px;font-size:11px;color:var(--muted2)">'+parts.join('')+'</div>';
}
// Running credit cost for the optional thumbnails a customer ticks across the plan.
function planCostUpdate(){
  var box=document.getElementById('planCostBox'); if(!box) return;
  box.style.borderColor='';
  var thumbN=0;
  document.querySelectorAll('#planList .plan-day').forEach(function(el){
    var pt=el.querySelector('.day-premthumb');
    if(pt&&pt.checked) thumbN++;
  });
  var cost = thumbN*TOKEN_THUMB;
  var bal = (typeof creditBal==='function')?creditBal():0;
  var over = cost>bal; if(over) box.style.borderColor='#5b2b2b';
  var costNote = (cost>0)
    ? ('Optional thumbnails this month: <b style="color:'+(over?'#ffb4ad':'#cbb6ff')+'">'+cost.toLocaleString()+' credits</b> &nbsp;('+thumbN+' × thumbnail). Balance: <b style="color:'+(over?'#ffb4ad':'#7ee0a8')+'">'+bal.toLocaleString()+'</b>.'+(over?' <span style="color:#ffb4ad">Not enough for all - days without credits post with the free branded cover.</span>':''))
    : ('Thumbnails are optional. Tick any day to add a click-worthy cover ('+TOKEN_THUMB+' credits each) - or leave them off at no charge.');
  box.innerHTML = costNote;
}
function creditBal(){ var u=DB.user||{}; var b=parseInt(u.credits,10); if(isNaN(b)){ b=0; } return Math.max(0, b); }
function creditSetBal(v){ var u=DB.user||{}; u.credits=Math.max(0, Math.round(v||0)); localStorage.setItem('aws_user', JSON.stringify(u)); var el=document.getElementById('creditBalNum'); if(el){ el.textContent=creditBal().toLocaleString(); } var el2=document.getElementById('creFormBal'); if(el2){ el2.textContent=creditBal().toLocaleString(); } var el3=document.getElementById('cmLeft'); if(el3){ el3.textContent=creditBal().toLocaleString(); } } // local optimistic display; server is source of truth
function creditMeterHtml(){
  var u=DB.user||{}; var used=Math.max(0,parseInt(u.creditUsed,10)||0); var grant=Math.max(0,parseInt(u.creditGrant,10)||0); var left=creditBal();
  var pct = grant>0 ? Math.min(100, Math.round(used/grant*100)) : (used>0?100:0);
  var denom = grant>0 ? (' of '+grant.toLocaleString()+' monthly') : '';
  return '<div id="creditMeter" style="margin:2px 0 14px">'
    + '<div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:5px"><span style="color:#c8d0e2">Used this month: <b id="cmUsed" style="color:#fff">'+used.toLocaleString()+'</b><span id="cmDenom">'+denom+'</span></span><span style="color:#c8d0e2"><b id="cmLeft" style="color:#fff">'+left.toLocaleString()+'</b> left</span></div>'
    + '<div style="height:8px;border-radius:99px;background:#1a2233;overflow:hidden"><div id="cmBar" style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#9B6BE0,#16A34A);transition:width .3s"></div></div>'
    + '</div>';
}
function creditMeterUpdate(){
  var u=DB.user||{}; var used=Math.max(0,parseInt(u.creditUsed,10)||0); var grant=Math.max(0,parseInt(u.creditGrant,10)||0);
  var pct = grant>0 ? Math.min(100, Math.round(used/grant*100)) : (used>0?100:0);
  var eU=document.getElementById('cmUsed'); if(eU) eU.textContent=used.toLocaleString();
  var eL=document.getElementById('cmLeft'); if(eL) eL.textContent=creditBal().toLocaleString();
  var eB=document.getElementById('cmBar'); if(eB) eB.style.width=pct+'%';
  var eD=document.getElementById('cmDenom'); if(eD) eD.textContent = grant>0 ? (' of '+grant.toLocaleString()+' monthly') : '';
}
// pull the authoritative balance (runs server-side migration + monthly grant)
function creditRefresh(){
  var u=DB.user||{}; if(!u.email||!CONFIG.CREDIT_BALANCE) return Promise.resolve(null);
  return fetch(CONFIG.CREDIT_BALANCE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email})})
    .then(function(r){return r.json();}).then(function(res){ if(res&&typeof res.available==='number'){ creditSetBal(res.available); } if(res){ var uu=DB.user||{}; if(typeof res.usedThisMonth==='number') uu.creditUsed=res.usedThisMonth; if(typeof res.monthlyGrant==='number') uu.creditGrant=res.monthlyGrant; localStorage.setItem('aws_user',JSON.stringify(uu)); creditMeterUpdate(); } return res; }).catch(function(){ return null; });
}
// spend N credits (server-authoritative); resolves {ok, remaining}
function creditUse(amount){
  var u=DB.user||{}; if(!u.email||!CONFIG.USE_CREDIT) return Promise.resolve({ok:false});
  return fetch(CONFIG.USE_CREDIT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,amount:amount})})
    .then(function(r){return r.json();}).then(function(res){ if(res&&typeof res.remaining==='number'){ creditSetBal(res.remaining); } return res||{ok:false}; }).catch(function(){ return {ok:false}; });
}
function upgradeSec(x){
  if(x && x.durationSec>0) return Math.min(90, Math.max(8, Math.ceil(x.durationSec)));
  var words=0;
  if(x && x.full_script){ words=x.full_script.trim().split(/\s+/).filter(Boolean).length; }
  else if(x && x.captionText){ words=cleanCaption(x.captionText).trim().split(/\s+/).filter(Boolean).length; }
  var sec=words?Math.round(words/2.5):30; // ~150 spoken words per minute
  return Math.min(90, Math.max(8, sec));
}
function upgradeCost(x){ return Math.max(16, upgradeSec(x)*2); } // 2 credits/sec - protects margin (ultra render costs ~1 Higgsfield credit/sec = break-even at 1/sec)
// Best source photo for an Avatar IV (ultra) render: a sharp full-res frame from the customer's
// own consent video (real detail, well-framed 9:16) when we have it, else the small twin thumbnail.
function av4SourceImage(u){
  u=u||DB.user||{};
  // 1st choice: a dedicated hi-res portrait photo (sharpest - no motion blur / video compression)
  var p=(u.twinPhoto||'').trim();
  if(p && p.indexOf('/image/upload/')>=0){
    return p.replace('/image/upload/','/image/upload/c_fill,g_auto,w_1080,h_1920,q_auto:best/').replace(/\.[A-Za-z0-9]+($|\?)/,'.jpg$1');
  }
  if(p) return p; // photo hosted elsewhere - use as-is
  // 2nd choice: a full-res frame from their consent video (real detail, well-framed)
  var v=(u.twinVideoUrl||'').trim();
  if(v && v.indexOf('/video/upload/')>=0){
    return v.replace('/video/upload/','/video/upload/so_2,c_fill,g_auto,w_1080,h_1920,q_auto:best/').replace(/\.[A-Za-z0-9]+($|\?)/,'.jpg$1');
  }
  // 3rd choice: the small twin thumbnail (last resort)
  return u.twinPreview||'';
}
function upgradeAV4(vid, auto){
  var u=DB.user||{}; var x=(DB.videos||[]).find(function(a){return a.id===vid;}); if(!x) return;
  if(!u.twinReady || !u.twinPreview){ if(!auto) toast('Ultra-realistic uses your digital twin - finish setting up your twin first, then try again.'); return; }
  var cost=upgradeCost(x), bal=creditBal();
  if(bal<cost){ if(!auto){ closeVideo(); openCreditTopUp(cost); } return; }
  if(!auto && !confirm('Make an ultra-realistic version of this video?\n\nEstimated length '+upgradeSec(x)+' seconds · uses '+cost+' credits of your '+bal.toLocaleString()+' balance.')) return;
  creditSetBal(bal-cost);     // optimistic local display
  creditUse(cost);            // server deducts (authoritative) + reconciles the balance
  var script=(x.full_script||cleanCaption(x.captionText)||'').trim();
  var payload={ script:script, image_url:av4SourceImage(u), voice_id:u.twinVoiceId||'', email:u.email, phone:u.phone||'', videoId:x.id+'-av4', caption:cleanCaption(x.captionText||''), postCaption:cleanCaption(x.captionText||'') };
  if(CONFIG.AVATAR_IV){ fetch(CONFIG.AVATAR_IV,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).catch(function(){}); }
  if(!auto){ closeVideo(); }
  startReadyPolling();
  if(!auto){ go('library'); }
  toast(auto ? '<span class="ok">✓</span> Upgrading your video to ultra-realistic - we\'ll text you when it\'s ready.' : '<span class="ok">✓</span> Making your ultra-realistic version - we\'ll text you when it\'s ready (usually a couple of minutes).');
}
// Premium upgrades panel shown in the avatar-video creation flow (link/script modes)
function premiumUpgradesPanel(){
  var bal=creditBal();
  var u=DB.user||{};
  var twinImg=u.twinPreview||'';
  var rowOpen='<label style="display:flex;gap:12px;align-items:flex-start;background:#0e1320;border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px;cursor:pointer">';
  return '<div class="field" id="premiumWrap">'
    + '<label>✨ Premium upgrades <span style="color:#aab4c8;font-weight:500">(optional · uses Aligned Credits)</span></label>'
    + '<div style="font-size:12.5px;color:#c8d0e2;margin:-2px 0 10px">You have <b id="creFormBal" style="color:#fff">'+bal.toLocaleString()+'</b> credits · <span onclick="go(\'account\')" style="color:#b794f6;cursor:pointer;font-weight:700">add credits</span></div>'
    + rowOpen
    +   '<input type="checkbox" id="optPremThumb" style="width:auto;flex:none;margin:3px 0 0"/>'
    +   '<img src="https://res.cloudinary.com/dpmcro85d/image/upload/c_fill,w_720,h_1280/e_brightness:-12/l_text:Arial_84_bold:YOUR%20HOOK,co_white,c_fit,w_600/fl_layer_apply,g_north,y_150/l_text:Arial_42_bold:Your%20Branding%20Here,co_white/fl_layer_apply,g_south,y_150/pkfqhwwdbzen8xctcrm8.jpg" alt="premium cover example" style="width:92px;height:164px;object-fit:cover;border-radius:10px;flex:none;border:1px solid var(--line)"/>'
    +   '<span style="font-size:13px;color:#eef2fb;line-height:1.5">🖼️ <b>Premium cinematic thumbnail</b> &nbsp;<span style="color:#7ee0a8;font-weight:700">'+TOKEN_THUMB+' credits</span><br><span style="color:#c8d0e2">Every video gets its own custom, on-brand cover - a unique scroll-stopping AI background in your brand colours, designed around your hook to stop the scroll.</span></span>'
    + '</label>'
    + '</div>';
}
function creditCard(){
  var bal=creditBal();
  function rateRow(label,cost){ return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-top:1px solid var(--line);font-size:13px"><span style="color:#c8d0e2">'+label+'</span><span style="color:#fff;font-weight:700;white-space:nowrap">'+cost+'</span></div>'; }
  return '<div class="sect-title" id="creditCard">Aligned Credits</div>'
    +'<div class="card">'
    +'<p style="font-size:14px;margin:0 0 4px">Your balance: <b id="creditBalNum">'+bal.toLocaleString()+'</b> credits</p>'
    +'<p style="color:var(--muted);font-size:12.5px;margin:0 0 12px">One balance powers every premium extra. Your plan tops you up every month - basic videos, reels and carousels never use credits.</p>'
    + creditMeterHtml()
    +'<div style="font-size:11px;font-weight:700;letter-spacing:.07em;color:#aab4c8;text-transform:uppercase;margin-bottom:1px">What credits cost</div>'
    + rateRow('🖼️ Thumbnail (optional, any video)', TOKEN_THUMB+' credits')
    + rateRow('🎥 Cinematic clip (AI scene)', TOKEN_SCENE+' credits')
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:15px"><button class="btn small" onclick="buyCredits(\'c20\')">200 credits · $20</button><button class="btn small" onclick="buyCredits(\'c50\')">575 credits · $50</button><button class="btn small" onclick="buyCredits(\'c80\')">1,000 credits · $80</button></div></div>';
}
function openCreditTopUp(cost){
  toast('That upgrade needs '+(cost||30)+' credits - top up your wallet to unlock it.');
  go('account');
  setTimeout(function(){ var el=document.getElementById('creditCard'); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.classList.add('flash'); setTimeout(function(){el.classList.remove('flash');},1600); } },150);
}
function buyCredits(pack){
  var u=DB.user||{}; var MAP={c20:200,c50:575,c80:1000}; var amt=MAP[pack]||0;
  if(u && u.comped){
    creditSetBal(creditBal()+amt);
    if(CONFIG.ADD_CREDIT&&u.email){ fetch(CONFIG.ADD_CREDIT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,credits:amt})}).then(function(r){return r.json();}).then(function(res){ if(res&&typeof res.balance==='number') creditSetBal(res.balance); }).catch(function(){}); }
    toast('<span class="ok">✓</span> Added '+amt.toLocaleString()+' test credits - balance '+creditBal().toLocaleString()); setTimeout(function(){try{go('account');}catch(e){}},400); return;
  }
  notifyChris('credit_topup',{detail:pack});
  if(CONFIG.STRIPE_LINKS[pack]){ window.location.href=CONFIG.STRIPE_LINKS[pack]; return; }
  toast('<span class="ok">✓</span> Got it - credit top-ups are being switched on; we\'ll confirm shortly.');
}
function saveProfile(){
  const u=DB.user||{};
  const nameEl=document.getElementById('acName'), emailEl=document.getElementById('acEmail'), phoneEl=document.getElementById('acPhone'), avaEl=document.getElementById('acAvatar');
  if(nameEl) u.name=(nameEl.value||'').trim()||u.name;
  if(emailEl) u.email=(emailEl.value||'').trim()||u.email;
  if(phoneEl) u.phone=(phoneEl.value||'').trim();
  if(avaEl) u.avatar=avaEl.value;
  DB.user=u;                              // 1) persist locally FIRST (before any DOM that could throw)
  try{
    var n=document.getElementById('userName'); if(n) n.textContent=titleCaseName(u.name||'');
    var e=document.getElementById('userEmail'); if(e) e.textContent=u.email||'';
    applyAvatar();
  }catch(_){}
  // 2) also save server-side so the profile isn't trapped in this one browser
  try{ if(CONFIG.PROFILE_WEBHOOK) fetch(CONFIG.PROFILE_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'profile_update',name:u.name||'',email:u.email||'',phone:u.phone||''})}).catch(function(){}); }catch(_){}
  // 3) re-render the page so the saved values are clearly reflected
  try{ if(typeof go==='function') go('account'); }catch(_){}
  toast('<span class="ok">✓</span> Profile saved');
}

let toastTimer;
function toast(html){ const t=document.getElementById('toast'); t.innerHTML=html; t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2600); }

function renderAuthDemo(){
  var url=(CONFIG.DEMO_VIDEO_URL||'').trim(); if(!url) return;
  var box=document.getElementById('authDemo'); if(!box) return;
  var isEmbed=/youtube|youtu\.be|vimeo|player\./i.test(url) && !/\.mp4($|\?)/i.test(url);
  box.innerHTML = isEmbed
    ? '<div style="position:relative;padding-top:56.25%;border-radius:14px;overflow:hidden;border:1px solid var(--line)"><iframe src="'+url+'" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>'
    : '<video src="'+url+'" controls playsinline preload="metadata" style="width:100%;border-radius:14px;border:1px solid var(--line);background:#000;display:block"></video>';
  box.innerHTML += '<div style="text-align:center;font-size:11.5px;color:var(--muted2);margin-top:7px">See how it works in 60 seconds</div>';
  box.style.display='block';
}
// One-time fix: Chris's twin was linked with a generic HeyGen TTS voice. Use his real cloned voice ("Chris Perkins").
(function(){ try{ var u=DB.user; if(u && u.twinVoiceId==='a167e418b1f04258b99c19614fb5a3d1'){ u.twinVoiceId='0fc1407f03b94db3b597ac7a2ed452d4'; u.twinVoiceName='Chris Perkins'; DB.user=u; } }catch(e){} })();
function requestLoginLink(){
  var email=(document.getElementById('auEmail').value||'').trim();
  if(!email||!email.includes('@')){ toast('Enter your email first, then tap the link option'); return; }
  if(CONFIG.LOGIN_LINK_WEBHOOK){ fetch(CONFIG.LOGIN_LINK_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})}).catch(function(){}); }
  toast('<span class="ok">✓</span> If that email has an account, we just sent a login link - check your inbox.');
}
// If the page was opened from a magic login link (?lk=token&em=email), verify it and log in.
function checkMagicLink(){
  var m=location.search.match(/[?&]lk=([^&]+)/), e=location.search.match(/[?&]em=([^&]+)/);
  if(!m||!e) return false;
  var token=decodeURIComponent(m[1]), email=decodeURIComponent(e[1]);
  try{ history.replaceState({},'',location.pathname); }catch(_){}
  if(!CONFIG.LOGIN_VERIFY_WEBHOOK) return false;
  fetch(CONFIG.LOGIN_VERIFY_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email, token:token})})
    .then(function(r){return r.json();}).then(function(j){
      if(j&&j.ok&&j.account){ tokenSet(j.token); _reloginShown=false; applyAccount(j.account); var u=DB.user||{}; applyComp(u); DB.user=u; enterApp(); toast('<span class="ok">✓</span> You’re logged in.'); }
      else { toast('That login link has expired or was already used - request a fresh one.'); }
    }).catch(function(){ toast('Couldn’t verify that link - please try again.'); });
  return true;
}
function changePassword(){
  var el=document.getElementById('acNewPw'); if(!el) return;
  var p=(el.value||'').trim();
  if(p.length<6){ toast('Choose a password with at least 6 characters'); return; }
  var u=DB.user||{}; if(!u.email){ toast('Please log in again first'); return; }
  authPost({action:'setpw', email:u.email, token:tokenGet(), password:p}).then(function(j){
    if(j&&j.ok){ el.value=''; toast('<span class="ok">✓</span> Password updated'); }
    else if(j&&j.authRequired){ requireRelogin('Please log in again to change your password.'); }
    else { toast('Couldn’t update your password - please try again.'); }
  }).catch(function(){ toast('Couldn’t update your password - please try again.'); });
}
// ===== Multi-account switcher (for running several client accounts) =====
function acctEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function getAccounts(){ try{ return JSON.parse(localStorage.getItem('aws_accounts')||'[]'); }catch(_){ return []; } }
function saveAccounts(a){ try{ localStorage.setItem('aws_accounts', JSON.stringify(a||[])); }catch(_){} }
// Cross-site account bridge: share the account list + current account with the homepage via a cookie
// scoped to the whole alignedwebservices.ca domain, so switching on one site applies to both. No tokens stored.
function hubSet(obj){ try{ document.cookie='aws_hub='+encodeURIComponent(JSON.stringify(obj))+';domain=.alignedwebservices.ca;path=/;max-age=31536000;samesite=lax'+(location.protocol==='https:'?';secure':''); }catch(_){} }
function hubGet(){ try{ var m=(document.cookie||'').match(/(?:^|;\s*)aws_hub=([^;]+)/); return m?JSON.parse(decodeURIComponent(m[1])):null; }catch(_){ return null; } }
function hubWrite(){ try{ var accs=getAccounts().map(function(a){return {email:a.email,name:a.name,phone:a.phone||'',status:a.status||''};}); var u=DB.user||{}; hubSet({cur:{email:u.email,name:u.name,phone:u.phone||'',status:u.status||'',plan:u.plan||''}, list:accs}); }catch(_){} }
function rememberAccount(u, token){
  if(!u||!u.email) return; var a=getAccounts(); var e=(u.email||'').toLowerCase();
  var i=a.findIndex(function(x){return (x.email||'').toLowerCase()===e;});
  var rec={email:u.email, name:u.name||u.email, token:token||tokenGet()||'', avatar:u.profilePic||'', phone:u.phone||'', status:u.status||'', plan:u.plan||''};
  if(i>=0){ a[i]=Object.assign({}, a[i], rec); } else { a.push(rec); }
  saveAccounts(a);
  try{ hubWrite(); }catch(_){}
}
// Wipe the ACTIVE session (so a fresh account starts clean) but keep the remembered-accounts list.
function clearActiveSession(){ ['aws_user','aws_videos','aws_agentchat','aws_plan','aws_plans','aws_teaser','aws_token','aws_lastServerAt','aws_dirtyAt'].forEach(function(k){ try{ localStorage.removeItem(k); }catch(_){} }); }
function switchAccount(email){
  var a=getAccounts().filter(function(x){return (x.email||'').toLowerCase()===(email||'').toLowerCase();})[0];
  if(!a){ return; }
  closeAcctMenu();
  if(DB.user && (DB.user.email||'').toLowerCase()===(email||'').toLowerCase()){ return; } // already active
  if(typeof toast==='function') toast('Switching to '+acctEsc(a.name||a.email)+'…');
  tokenSet(a.token||'');
  syncPull(a.email).then(function(acc){
    if(acc){ applyAccount(acc); var u=DB.user||{}; applyComp(u); DB.user=u; rememberAccount(u, a.token); _reloginShown=false; enterApp(); }
    else {
      // Stored session expired - clear and ask Chris to log into that account again.
      clearActiveSession();
      try{ document.getElementById('app').classList.remove('show'); var as=document.getElementById('authScreen'); if(as) as.style.display=''; }catch(_){}
      if(typeof mode!=='undefined' && mode==='signup' && typeof toggleAuth==='function') toggleAuth(); // to login mode
      setTimeout(function(){ var el=document.getElementById('auEmail'); if(el) el.value=a.email; },40);
      if(typeof toast==='function') toast('Please log in to '+acctEsc(a.email)+' again.');
    }
  });
}
// Start a clean slate to create or log into another account (keeps the other accounts saved).
function addManagedAccount(){
  closeAcctMenu();
  clearActiveSession();
  try{
    document.getElementById('app').classList.remove('show');
    var as=document.getElementById('authScreen'); if(as) as.style.display='';
    if(typeof mode!=='undefined' && mode==='login' && typeof toggleAuth==='function') toggleAuth(); // ensure Create-account (signup) mode
    ['auEmail','auPassword','suName','suPhone'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
    var ae=document.getElementById('auEmail'); if(ae) ae.focus();
  }catch(_){}
  if(typeof toast==='function') toast('Create or log into another account. Your other accounts stay saved.');
}
function signOutAll(){ saveAccounts([]); try{ hubSet({cur:{},list:[]}); }catch(_){} clearActiveSession(); location.reload(); }
function renderAcctMenu(){
  var m=document.getElementById('acctMenu'); if(!m) return;
  var accs=getAccounts(); var cur=(DB.user&&DB.user.email||'').toLowerCase();
  var html='';
  accs.forEach(function(a){
    var active=(a.email||'').toLowerCase()===cur;
    var ini=((a.name||a.email||'A').trim()[0]||'A').toUpperCase();
    html+='<div class="acct-item'+(active?' active':'')+'" onclick="event.stopPropagation(); switchAccount(\''+acctEsc(a.email).replace(/&#39;/g,"\\'")+'\')">'
      +'<div class="ai-dot">'+acctEsc(ini)+'</div>'
      +'<div class="ai-tx"><div class="ai-nm">'+acctEsc(a.name||a.email)+'</div><div class="ai-em">'+acctEsc(a.email)+'</div></div>'
      +(active?'<span class="ai-chk">✓</span>':'')+'</div>';
  });
  html+='<div class="acct-add" onclick="event.stopPropagation(); addManagedAccount()">+ Add or create an account</div>';
  if(cur) html+='<div class="acct-out" onclick="event.stopPropagation(); logout()">Sign out of this account</div>';
  if(accs.length>1) html+='<div class="acct-out" onclick="event.stopPropagation(); signOutAll()">Sign out of all accounts</div>';
  m.innerHTML=html;
}
function toggleAcctMenu(e){ if(e){ e.stopPropagation(); } var m=document.getElementById('acctMenu'); if(!m) return; if(m.style.display==='none'||!m.style.display){ renderAcctMenu(); m.style.display='block'; } else { m.style.display='none'; } }
function closeAcctMenu(){ var m=document.getElementById('acctMenu'); if(m) m.style.display='none'; }
try{ document.addEventListener('click', function(){ closeAcctMenu(); }); }catch(_){}
// One-hop CRM: open the ACTIVE client's own CRM sub-account (not a generic screen). Combined with the account
// switcher, this is the one-hop "switch client -> land in their CRM" flow (the CRM is GHL white-label so we deep-link in).
function openCRM(e){ if(e){ try{e.preventDefault();}catch(_){} }
  var u=DB.user||{}; var em=(u.email||''); var base='https://crm.alignedwebservices.ca';
  if(u.crmLocationId){ window.open(base+'/v2/location/'+u.crmLocationId+'/dashboard','_blank'); return false; }
  var w; try{ w=window.open('about:blank','_blank'); }catch(_){ w=null; }
  if(!em){ if(w) w.location=base; else window.open(base,'_blank'); return false; }
  try{
    fetch(CONFIG.CRM_LOC+'?email='+encodeURIComponent(em)).then(function(r){return r.json();}).then(function(d){
      var loc=d&&d.locationId; var url=loc?(base+'/v2/location/'+loc+'/dashboard'):base;
      if(loc){ try{ u.crmLocationId=loc; DB.user=u; }catch(_){} }
      if(w) w.location=url; else window.open(url,'_blank');
    }).catch(function(){ if(w) w.location=base; else window.open(base,'_blank'); });
  }catch(_){ if(w) w.location=base; else window.open(base,'_blank'); }
  return false;
}

