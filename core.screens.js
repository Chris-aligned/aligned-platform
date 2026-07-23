/* Aligned app module: core.screens.js (split from live; load order matters) */
// ===== Content Health auditor - exposure-focused audit of the customer's socials =====
function auVal(id){ var e=document.getElementById(id); return e?(e.value||'').trim():''; }
function openAudit(){
  var m=document.getElementById('auditOverlay'); if(m) m.remove();
  var ov=document.createElement('div'); ov.id='auditOverlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(6,9,15,.72);z-index:3500;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:26px 14px';
  ov.onclick=function(){ ov.remove(); };
  ov.innerHTML='<div style="width:100%;max-width:560px;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:22px" onclick="event.stopPropagation()">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><div style="font-size:22px">🔎</div><h3 style="margin:0;font-size:18px">Social content health</h3><span style="margin-left:auto;cursor:pointer;color:var(--muted2);font-size:18px" onclick="document.getElementById(\'auditOverlay\').remove()">✕</span></div>'
    +'<p style="font-size:13px;color:var(--muted);margin:0 0 14px;line-height:1.5">Drop in your profile links and we\'ll score your reach and show the biggest gaps holding back your exposure.</p>'
    +'<div id="auditForm">'
    +'<div class="field"><label>Your business or niche</label><input id="auNiche" placeholder="e.g. Okanagan real estate agent"/></div>'
    +'<div class="field"><label>Instagram</label><input id="auIg" placeholder="instagram.com/yourhandle"/></div>'
    +'<div class="field"><label>TikTok</label><input id="auTt" placeholder="tiktok.com/@yourhandle"/></div>'
    +'<div class="field"><label>YouTube</label><input id="auYt" placeholder="youtube.com/@yourchannel"/></div>'
    +'<div class="field"><label>Facebook</label><input id="auFb" placeholder="facebook.com/yourpage"/></div>'
    +'<button class="btn" onclick="auditRun()" style="width:100%;margin-top:6px">🔎 Run my content health check</button>'
    +'</div><div id="auditResult"></div></div>';
  document.body.appendChild(ov);
}
function auditRun(){
  var u=DB.user||{};
  var links={ig:auVal('auIg'),tiktok:auVal('auTt'),youtube:auVal('auYt'),facebook:auVal('auFb')};
  var niche=auVal('auNiche');
  if(!niche && !links.ig && !links.tiktok && !links.youtube && !links.facebook){ toast('Add your niche or at least one profile link'); return; }
  var f=document.getElementById('auditForm'); if(f) f.style.display='none';
  var r=document.getElementById('auditResult'); if(r) r.innerHTML='<div style="text-align:center;padding:26px;color:var(--muted)"><div style="font-size:26px">🔎</div><div style="margin-top:8px">Analysing your content for reach…</div></div>';
  if(!CONFIG.CONTENT_AUDIT){ if(r) r.innerHTML='<p style="color:#ffb4ad">Audit isn\'t available right now.</p>'; return; }
  fetch(CONFIG.CONTENT_AUDIT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,niche:niche,links:links})})
    .then(function(x){return x.json();}).then(function(a){ renderAudit(a); })
    .catch(function(){ var rr=document.getElementById('auditResult'); if(rr) rr.innerHTML='<p style="color:#ffb4ad;text-align:center;padding:16px">Couldn\'t run the audit - please try again.</p><button class="btn ghost" style="width:100%" onclick="openAudit()">Try again</button>'; });
}
function renderAudit(a){
  var r=document.getElementById('auditResult'); if(!r) return;
  var sc=Math.max(0,Math.min(100,Math.round((a&&a.score)||0)));
  var col=sc>=70?'#7ee0a8':(sc>=40?'#f0d08a':'#ffb4ad');
  var gaps=(a&&Array.isArray(a.gaps))?a.gaps:[];
  var gh=gaps.map(function(g){ var imp=(g.impact==='high'); return '<div style="display:flex;gap:11px;padding:12px 0;border-top:1px solid var(--line)"><div style="flex:none;font-size:10.5px;font-weight:800;color:'+(imp?'#ffb4ad':'#f0d08a')+';padding-top:3px">'+(imp?'HIGH':'MED')+'</div><div style="flex:1"><div style="font-weight:700;font-size:14px">'+cwEsc(g.title||'')+'</div><div style="font-size:12.5px;color:var(--muted);margin:2px 0 6px;line-height:1.5">'+cwEsc(g.why||'')+'</div><div style="font-size:12.5px;color:#cbbcff"><b>Do this:</b> '+cwEsc(g.action||'')+'</div></div></div>'; }).join('');
  r.innerHTML='<div style="text-align:center;margin:8px 0 2px"><div style="font-size:46px;font-weight:800;color:'+col+';line-height:1">'+sc+'</div><div style="font-size:12px;color:var(--muted2)">content health · exposure score</div></div>'
    +(a&&a.headline?'<div style="text-align:center;font-weight:700;font-size:15px;margin:8px 0 2px">'+cwEsc(a.headline)+'</div>':'')
    +(a&&a.summary?'<div style="text-align:center;font-size:13px;color:var(--muted);margin:0 auto 8px;max-width:440px;line-height:1.5">'+cwEsc(a.summary)+'</div>':'')
    +(gh?('<div style="font-size:11px;color:var(--muted2);margin:14px 2px 0;font-weight:800;letter-spacing:.5px">YOUR BIGGEST GAPS</div>'+gh):'')
    +'<button class="btn" style="width:100%;margin-top:14px" onclick="document.getElementById(\'auditOverlay\').remove();go(\'remake\')">Make a video to close a gap →</button>'
    +'<button class="btn ghost" style="width:100%;margin-top:8px" onclick="openAudit()">Run again</button>';
}

// ===== Describe-your-video prompt field =====
// The customer types what they want in plain English. It goes straight to the Aligned Assistant,
// which decides the format (talking head / faceless / carousel / cinematic / showcase), writes the
// script, confirms with them, and then fires the matching render engine. Same chat component as the
// Assistant panel, just given a video-shaped front door.
var VB_EXAMPLES=[
  'A 30 second video of me explaining why spring is the best time to list a house',
  'A faceless reel with 3 tips for booking more jobs this month',
  'A carousel about the 3 mistakes people make hiring a contractor',
  'A cinematic shot of me on site saying we build fast'
];
function vbEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function videoBuilderCard(){
  var chips=VB_EXAMPLES.map(function(x){
    return '<span class="chip" style="cursor:pointer" onclick="vbFill(this)" data-p="'+vbEsc(x)+'">'+vbEsc(x)+'</span>';
  }).join('');
  return '<div class="card" style="margin-bottom:18px;border:1px solid var(--purple);background:linear-gradient(180deg,rgba(155,107,224,.12),rgba(155,107,224,0))">'
    +'<div style="display:flex;align-items:center;gap:10px"><div style="font-size:24px">🎬</div>'
    +'<div><h3 style="margin:0;font-size:16px">Just describe the video you want</h3>'
    +'<div style="font-size:12.5px;color:var(--muted);margin-top:2px">No forms. Tell me in your own words, even a rough idea, and I will help you shape it, show you the script, and make it.</div></div></div>'
    +'<textarea id="vbPrompt" placeholder="e.g. A short video of me explaining why now is a good time to buy. Or just a rough idea like: something about spring cleaning, and I will help you shape it." style="width:100%;margin-top:13px;min-height:92px" onkeydown="if((event.key===\'Enter\')&&(event.metaKey||event.ctrlKey)){event.preventDefault();vbGo();}"></textarea>'
    +'<button class="btn" style="width:100%;margin-top:10px" onclick="vbGo()">Make it →</button>'
    +'<div style="font-size:11.5px;color:var(--muted2);margin:8px 2px 0;text-align:center">I will chat it through with you first, no charge to explore ideas.</div>'
    +'<div style="font-size:11px;color:var(--muted2);margin:14px 2px 6px;font-weight:800;letter-spacing:.5px">TRY ONE OF THESE</div>'
    +'<div class="filters" style="margin-bottom:0">'+chips+'</div>'
    +'</div>';
}
function vbFill(el){
  var i=document.getElementById('vbPrompt'); if(!i||!el) return;
  i.value=el.getAttribute('data-p')||el.textContent||''; i.focus();
}
function vbGo(){
  var i=document.getElementById('vbPrompt');
  var t=(i&&i.value||'').trim();
  if(!t){ toast('Tell me what the video should be about'); if(i) i.focus(); return; }
  if(i) i.value='';
  if(window.AlignedCreate){ AlignedCreate.fromDescribeBox(t); } else { asstSeed(t); }
}

const RENDER = {
  websitebuilder(){
    var mu=mbUser();
    return ''+
      '<p style="color:var(--muted);font-size:13.5px;margin:0 0 16px;max-width:660px">Describe your business and what you want your site to do. Aligned builds you a live first draft in seconds, then you refine it by chatting with the AI designer until it looks exactly right. When you love it, take it live in a few clicks. Your brand kit logo and colors are applied automatically.</p>'+
      '<div class="card" id="wbForm" style="max-width:660px">'+
        '<div class="field"><label>Your business name</label><input id="wbCompany" value="'+mbEsc(mu.company)+'" placeholder="e.g. Kelowna Landscaping Co"/></div>'+
        '<div class="field"><label>What is your site for?</label><textarea id="wbPurpose" placeholder="e.g. A clean site that shows our landscaping services and our work, and lets homeowners in Kelowna book a free consult."></textarea></div>'+
        '<div class="field"><label style="display:block;margin-bottom:8px">What should it help you do? (optional)</label>'+
          '<div id="wbGoals" class="filters" style="margin-bottom:0">'+
            mbGoalChip('booking','Take bookings')+mbGoalChip('sell','Sell products or services')+mbGoalChip('leads','Get more leads')+mbGoalChip('credibility','Look professional')+mbGoalChip('showcase','Show my work')+
          '</div></div>'+
        '<div class="field" style="margin-bottom:16px"><label>Already have a site to draw from? (optional)</label><input id="wbSite" placeholder="yourbusiness.com"/></div>'+
        '<button class="btn" onclick="wbGenerate(this)">Build my preview &rarr;</button>'+
      '</div>'+
      mbStageHtml('wb','This looks great, take it live');
  },
  funnelbuilder(){
    MB.fnGoal='book';
    var mu=mbUser();
    return ''+
      '<p style="color:var(--muted);font-size:13.5px;margin:0 0 16px;max-width:660px">Pick the one action you want visitors to take, describe your offer, and Aligned builds you a focused funnel landing page in seconds. Refine it by chatting with the AI designer until it converts, then take it live. Your brand kit logo and colors are applied automatically.</p>'+
      '<div class="card" id="fnForm" style="max-width:660px">'+
        '<div class="field"><label style="display:block;margin-bottom:8px">What is the goal of this funnel?</label>'+
          '<div id="fnGoals" class="filters" style="margin-bottom:0">'+
            mbFunnelChip('book','Book a call',true)+mbFunnelChip('buy','Buy a product',false)+mbFunnelChip('join','Join a list',false)+mbFunnelChip('quote','Request a quote',false)+
          '</div></div>'+
        '<div class="field"><label>Your business name</label><input id="fnCompany" value="'+mbEsc(mu.company)+'" placeholder="e.g. Kelowna Landscaping Co"/></div>'+
        '<div class="field" style="margin-bottom:16px"><label>Describe your offer</label><textarea id="fnOffer" placeholder="e.g. A free 20-minute strategy call where we map out a landscaping plan for your yard. Limited spots each week."></textarea></div>'+
        '<button class="btn" onclick="fnGenerate(this)">Build my funnel preview &rarr;</button>'+
      '</div>'+
      mbStageHtml('fn','This is great, take it live');
  },
  brandkit(){
    var bk=brandKitGet();
    function cf(label,id,val){
      return '<div><label style="font-size:12px;color:var(--text);font-weight:600;display:block;margin-bottom:5px">'+label+'</label>'+
        '<div style="display:flex;align-items:center;gap:8px"><input type="color" id="'+id+'" value="'+val+'" oninput="bkPickColor(\''+id+'\')" style="width:46px;height:38px;padding:0;border:1px solid var(--line);border-radius:8px;background:none;cursor:pointer"/>'+
        '<input type="text" id="'+id+'_h" value="'+val+'" maxlength="7" spellcheck="false" oninput="bkTypeHex(\''+id+'\')" aria-label="'+label+' hex code" style="width:94px;font-size:12.5px;color:var(--text);font-family:monospace;background:var(--card2);border:1px solid var(--line);border-radius:8px;padding:8px 9px"/></div></div>';
    }
    return '<p style="color:var(--muted);font-size:13.5px;margin:0 0 16px;max-width:620px">Set up your brand once. Your logo and colors are applied automatically to your carousels, animated reels, and branded content, so everything you post looks like <b>you</b>.</p>'+
      '<div class="card" style="max-width:560px"><label style="font-size:13px;color:var(--text);font-weight:600">Your logo</label>'+
        '<div style="font-size:11.5px;color:var(--muted2);margin:4px 0 8px">A PNG with a transparent background looks best. Your content sits on a dark background, so a white or light logo shows up best.</div>'+
        '<input id="bkLogoInput" type="file" accept="image/*" onchange="uploadBrandLogo(this)" style="font-size:12px"/>'+
        '<div id="bkLogoStatus" style="font-size:11.5px;color:var(--purple);margin-top:5px"></div>'+
        '<div id="bkLogoPrev" style="margin-top:8px"></div></div>'+
      '<div class="card" style="max-width:560px;margin-top:14px"><label style="font-size:13px;color:var(--text);font-weight:600;display:block;margin-bottom:6px">Brand name</label>'+
        '<input id="bkName" type="text" value="'+cwEsc(bk.brandName||'')+'" placeholder="Your business name" style="width:100%"/></div>'+
      '<div class="card" style="max-width:560px;margin-top:14px"><label style="font-size:13px;color:var(--text);font-weight:600;display:block;margin-bottom:4px">Brand colors</label>'+
        '<div style="font-size:11.5px;color:var(--muted2);margin-bottom:10px">Primary and Accent blend into the gradient on your badges and buttons.</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">'+cf('Primary','bkFrom',bk.accentFrom)+cf('Accent','bkTo',bk.accentTo)+cf('Background','bkBg',bk.bg)+cf('Text','bkText',bk.text)+'</div>'+
        '<div id="bkPreview" style="margin-top:16px;height:110px;border-radius:12px;border:1px solid var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"></div></div>'+
      '<div style="margin-top:16px;display:flex;gap:10px"><button class="btn" onclick="saveBrandKit(this)">Save brand kit</button></div>';
  },
  tutorials(){
    function card(num,title,desc,steps,cta){
      return '<div class="card" style="margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="flex:none;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#7c5cff,#39d98a);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px">'+num+'</span><h3 style="margin:0;font-size:16px">'+title+'</h3></div>'+
        (desc?'<p style="color:var(--muted);font-size:13px;margin:0 0 10px">'+desc+'</p>':'')+
        '<ol style="margin:0;padding-left:18px;color:#d7dcea;font-size:13.5px;line-height:1.7">'+steps.map(function(s){return '<li>'+s+'</li>';}).join('')+'</ol>'+
        (cta?'<div style="margin-top:12px">'+cta+'</div>':'')+'</div>';
    }
    return '<p style="color:var(--muted);font-size:13.5px;margin:0 0 16px;max-width:640px">New here? These walk you through everything, from building your digital twin to posting your first video. Follow them in order and you will be live in a few minutes.</p>'+
      card('1','Create your digital twin','Your twin is your AI version, your real face and voice, so you never have to film again.',[
        'Go to <b>Start content production</b> and open the avatar picker.',
        'Choose <b>Create your twin</b> and record the short consent video it asks for (about a minute, good light, look at the camera).',
        'We build your twin in the background, usually around 15 minutes. You will get a text and email when it is ready.',
        'Prefer not to film yet? You can use one of our studio presenters in the meantime.'
      ],'<button class="btn small" onclick="go(\'remake\')">Start content production →</button>')+
      card('2','Produce your first video','Three ways to make one, all hands-off after you hit submit.',[
        'Open <b>Start content production</b>.',
        'Pick how you want to make it: remake a reel from a link, write your own script, upload your own video, or make a carousel.',
        'Choose who delivers it, your twin or a presenter, and a caption style.',
        'Hit submit. We render it, add captions, and text plus email you a link to review.'
      ],'<button class="btn small" onclick="go(\'remake\')">Make a video →</button>')+
      card('3','Connect your socials','Connect once and your approved videos can post for you automatically.',[
        'Go to <b>Connect socials</b>.',
        'Tap <b>Connect</b> next to each platform. We send a secure link to your phone and email.',
        'Open the link and approve on the platform\'s own page. We never see your password.',
        'A green check means you are connected.'
      ],'<button class="btn small" onclick="goSocials()">Connect socials →</button>')+
      card('4','Approve and post','Nothing goes out without your yes.',[
        'When a video is ready, it lands in <b>Approvals</b> (and you get a text and email).',
        'Watch it, then tap <b>Approve</b> to post it, or <b>Request a change</b> and we remake it free.',
        'Approved videos post to your connected socials automatically.'
      ],'<button class="btn small" onclick="go(\'approvals\')">Go to Approvals →</button>')+
      card('5','Make a carousel','Branded swipe posts, great for reach and saves.',[
        'In <b>Start content production</b>, choose the <b>Carousel</b> option.',
        'Type the topic or paste a script. We write the slides and pick the right number.',
        'Add your logo once (optional) and it brands every slide.',
        'We email you the finished carousel plus a ready-to-post caption.'
      ],'<button class="btn small" onclick="go(\'remake\')">Make a carousel →</button>')+
      card('6','Your 30-day content plan','A full month of content, on autopilot.',[
        'Open the chat bubble and tell the strategist about your business.',
        'It builds a 30-day plan of hooks, scripts and captions across your funnel.',
        'Tweak any day, pick avatar or faceless per day, then turn on daily auto-render.',
        'One video a day goes to your Approvals for a quick yes before it posts.'
      ],'');
  },
  socials(){
    return `<div class="card" style="border:1px solid var(--purple);background:linear-gradient(180deg,rgba(155,107,224,.10),rgba(155,107,224,0));margin:0 0 14px;display:flex;gap:12px;align-items:flex-start">
        <span onclick="openProModal()" title="How to switch to a Professional account" style="flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;border:1.6px solid var(--purple);color:var(--purple);font-size:13px;font-weight:700;font-style:italic;font-family:Georgia,serif;cursor:pointer">i</span>
        <div style="flex:1"><div style="font-weight:700;font-size:14px">Set your Instagram to a Professional account first</div><div style="font-size:12.5px;color:var(--muted);margin-top:2px">Instagram only lets us connect Business or Creator accounts - required before connecting here. It's free and takes 2 minutes. <a class="link" style="color:var(--purple);cursor:pointer" onclick="openProModal()">Show me how &rarr;</a></div></div>
      </div>
      <p style="color:var(--muted);font-size:13.5px;margin:0 0 16px;max-width:640px">Connect the accounts you'd like us to post to. We'll send a secure link to your phone and email, and you authorize on the platform's own page (we never see your password). Once connected, your approved videos post automatically, every day, hands-free.</p>
      <div class="card">${PLATFORMS.map(p=>socialRow(p)).join('')}</div>`;
  },
  home(){
    const v=DB.videos, u=DB.user;
    const posted=v.filter(x=>x.status==='posted').length;
    const review=v.filter(x=>x.status==='review').length;
    const proc=v.filter(x=>x.status==='processing').length;
    const trialBanner = u.status!=='active'
      ? `<div class="banner"><span>⏳</span><div>You're on a <b>free trial</b> - ${daysLeft()} days left. No card was charged. <b style="cursor:pointer;text-decoration:underline" onclick="go('account')">Pick a plan</b> any time to keep going.</div></div>` : '';
    return `${trialBanner}${twinConsentBanner()}${streakHero()}${gettingStarted()}
      ${videoBuilderCard()}
      <div class="hero">
        <div><h3>Hey ${u.name.split(' ')[0]} 👋</h3><p>Drop in a reel and we'll rebuild it as a cinematic video in your voice.</p></div>
        <div class="spacer"></div>
        <button class="btn small" style="padding:13px 22px" onclick="go('remake')">Start content production →</button>
      </div>
      <div class="grid cards3" style="margin-top:20px">
        <div class="card stat" style="cursor:pointer" onclick="goLib('posted')"><div class="k">Videos posted</div><div class="v">${posted}</div></div>
        <div class="card stat" style="cursor:pointer" onclick="goLib('review')"><div class="k">Awaiting approval</div><div class="v">${review} ${review?'<small>review now</small>':''}</div></div>
        <div class="card stat" style="cursor:pointer" onclick="goLib('processing')"><div class="k">Rendering videos</div><div class="v">${proc} ${proc?'<small>rendering</small>':''}</div></div>
      </div>
      <div class="card" style="margin-top:20px;cursor:pointer;display:flex;align-items:center;gap:12px;border:1px solid var(--purple);background:linear-gradient(180deg,rgba(155,107,224,.10),rgba(155,107,224,0))" onclick="openAudit()">
        <div style="font-size:26px">🔎</div>
        <div style="flex:1"><div style="font-weight:700;font-size:15px">Check my social content health</div><div style="font-size:12.5px;color:var(--muted)">See where your reach is leaking and what to post next to grow.</div></div>
        <button class="btn small" style="flex:none" onclick="event.stopPropagation();openAudit()">Run check →</button>
      </div>
      <div class="sect-title">Recent activity</div>
      ${v.length? recentList(v) : emptyState('No videos yet','Remake your first reel to see it here.')}
    `;
  },

  remake(){
    window.__avaQuery='';
    const loading = STOCK_AVATARS.length===0
      ? `<p style="color:var(--muted2);font-size:12px;margin:8px 0 0">Loading your avatars…</p>`
      : ``;
    return `
      <div class="card" style="max-width:640px">
        <h3 style="margin:0 0 4px">Other videos</h3>
        <p style="color:var(--muted);font-size:13.5px;margin:0 0 18px">Videos that don't use your avatar. Upload your own clip and we polish it, or generate an animated reel or a carousel. Want an on-camera video of yourself? Use <b onclick="closeAllModals&&closeAllModals();openTwinStudio()" style="cursor:pointer;color:var(--purple)">Avatar videos</b>.</p>
        <div class="field"><label>What are we making?</label>
          <div class="filters" id="modePick" style="margin-bottom:10px">
            <span class="chip active" data-mode="upload" onclick="pickMode(this)">Upload my own video</span>
            <span class="chip" data-mode="reel" onclick="pickMode(this)">Animated reel</span>
            <span class="chip" data-mode="carousel" onclick="pickMode(this)">Carousel</span>
          </div>
          <div id="linkMode" style="display:none"><textarea id="rkUrls" placeholder="https://instagram.com/reel/...&#10;https://tiktok.com/@.../video/..."></textarea></div>
          <div id="scriptMode" style="display:none"><textarea id="rkScriptFull" placeholder="Write exactly what you want to say on camera - we'll have your avatar deliver it word-for-word, then auto-write your caption & hashtags." style="min-height:120px"></textarea></div>
          <div id="uploadMode">
            <div class="hint" style="margin-bottom:8px">Upload your own video - a screen recording, a clip you filmed, anything. We polish it: add your branded captions, optional music, and get it ready to post. No avatar needed.</div>
            <input type="file" id="rkVideo" accept="video/*"/>
          </div>
          <div id="carouselMode" style="display:none">
            <div class="hint" style="margin-bottom:8px">🖼️ A swipe carousel of branded text slides - great for reach and saves. Tell us the topic or paste a script; we'll write the slides (we pick the right number), brand them, and email you the finished carousel + caption to post.</div>
            <textarea id="rkCarouselTopic" placeholder="What's this carousel about? e.g. '3 mistakes small businesses make on Instagram' - or paste a script/notes." style="min-height:110px"></textarea>
            <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px">
              <label style="font-size:12px;color:var(--text);font-weight:600">Your logo <span style="color:var(--muted2);font-weight:500">(optional - appears on every slide)</span></label>
              <div style="font-size:11.5px;color:var(--muted2);margin:4px 0 6px">Upload once and we'll brand your carousels with it. A PNG with a transparent background looks best.</div>
              <input id="carouselLogoInput" type="file" accept="image/*" onchange="uploadCarouselLogo(this)" style="font-size:12px"/>
              <div id="carouselLogoStatus" style="font-size:11.5px;color:var(--purple);margin-top:5px"></div>
              <div id="carouselLogoPrev" style="margin-top:7px"></div>
            </div>
          </div>
          <div id="reelMode" style="display:none">
            <div class="hint" style="margin-bottom:8px">🎬 A short animated motion-graphic reel - bold on-screen text, no filming and no avatar needed. Tell us the topic; we write a punchy 3-point script, render it in <b>your Brand kit</b> (logo + colours), and drop the finished video into Approvals to review and post.</div>
            <textarea id="rkReelTopic" placeholder="What's this reel about? e.g. '3 signs your business is ready to automate' - or paste a few notes." style="min-height:110px"></textarea>
            <div id="reelBrandNote" style="font-size:11.5px;color:var(--muted2);margin-top:8px"></div>
            <div id="reelThumbBox" style="font-size:12px;margin-top:12px;padding:11px 13px;border:1px solid var(--line);border-radius:11px;background:rgba(155,107,224,.06)">✨ Premium thumbnails - a cinematic, scroll-stopping cover on your reel.</div>
          </div>
          <div id="shotsMode" style="display:none">
            <div class="hint" style="margin-bottom:8px">🎥 A short cinematic clip starring you in a real-world scene - generated by AI, no filming. Describe the scene and what you say; we render a vertical clip and drop it in Approvals.</div>
            <label>What should the scene look like?</label>
            <textarea id="rkShotPrompt" placeholder="e.g. Walking toward camera on the Kelowna lakefront boardwalk at golden hour, seagulls overhead" style="min-height:110px"></textarea>
            <label style="margin-top:12px">What do you say? (one or two sentences)</label>
            <input type="text" id="rkShotScript" maxlength="2000" placeholder="e.g. Your content should work as hard as you do - here's how."/>
            <div class="hint" style="margin-top:8px">Cinematic scenes are short (about 8–15 seconds) - keep it to a punchy line or two. Uses 150 credits.</div>
            <div id="shotsCreditNote" style="font-size:11.5px;color:var(--muted2);margin-top:8px"></div>
          </div>
        </div>
        <div class="field" id="avaWrap" style="display:none"><label>Which avatar should deliver it?</label>
          <div class="avatar-pick" id="avaPick">${avaPickInner()}</div>
          <div id="lookRow"></div>
          ${loading}
          <p id="avaNote" class="ava-note">✨ <b>Your AI twin</b> is the most lifelike option - your real face and voice. Your twin, its looks, and your ⭐ favourites show here. Tap <b>Avatar library</b> to browse all studio presenters and star the ones you use most.</p>
        </div>
        <div class="field" id="posWrap" style="display:none"><label>Where should your avatar sit on screen?</label>
          <div class="filters" id="posPick">
            <span class="chip active" data-pos="center" onclick="pickPos(this)">Center</span>
            <span class="chip" data-pos="left" onclick="pickPos(this)">Left</span>
            <span class="chip" data-pos="right" onclick="pickPos(this)">Right</span>
            <span class="chip" data-pos="corner" onclick="pickPos(this)">Lower corner</span>
          </div>
          <p class="ava-note" style="margin-top:8px">Center fills the frame. Lower corner shrinks you into a bubble so your B-roll or screen takes the stage.</p>
        </div>
        <div class="field"><label>Post to</label>
          <div class="filters" id="platPick">
            ${PLATFORMS.map(p=>{const on=((DB.user&&DB.user.socials)||{})[p]==='connected';return `<span class="chip${on?' active':''}" onclick="this.classList.toggle('active')">${p}</span>`;}).join('')}
          </div>
          <p class="ava-note" style="margin-top:8px">Your connected accounts are pre-selected, so you're set up once. Tap any to add or remove for this video.</p>
        </div>
        <div class="field"><label>Captions</label>
          <label style="display:flex;gap:10px;align-items:center;font-size:13.5px;color:var(--text);cursor:pointer;background:#0e1320;border:1px solid var(--line);border-radius:12px;padding:13px;line-height:1.45">
            <input type="checkbox" id="rkCaptions" checked style="width:auto;flex:none;margin:0" onchange="var w=document.getElementById('capOptsWrap');if(w)w.style.display=this.checked?'':'none'"/>
            <span>💬 Add captions - word-by-word in your brand colours. <b style="color:var(--muted)">Uncheck for a clean video with no captions.</b></span>
          </label>
          <div id="capOptsWrap" style="margin-top:10px">
            <label style="font-size:12.5px;color:var(--muted)">Caption style</label>
            <div class="cap-pick" id="capPick">
              ${CAPTIONS.map(c=>`<div class="cap ${c.def?'sel':''}" data-id="${c.id}" onclick="pickCap(this)"><div class="cap-nm">${c.name}</div><div class="cap-ds">${c.desc}</div></div>`).join('')}
            </div>
            <label style="display:flex;gap:10px;align-items:center;font-size:13.5px;color:var(--text);cursor:pointer;background:#0e1320;border:1px solid var(--line);border-radius:12px;padding:13px;line-height:1.45;margin-top:12px">
              <input type="checkbox" id="rkEmojis" style="width:auto;flex:none;margin:0"/>
              <span>😄 Add emojis on the captions - fitting emojis pop in as you speak. <b style="color:var(--muted)">Off by default.</b></span>
            </label>
          </div>
        </div>
        <div class="field"><label>Background music</label>
          <label style="display:flex;gap:10px;align-items:center;font-size:13.5px;color:var(--text);cursor:pointer;background:#0e1320;border:1px solid var(--line);border-radius:12px;padding:13px;line-height:1.45">
            <input type="checkbox" id="rkMusic" checked style="width:auto;flex:none;margin:0" onchange="var w=document.getElementById('musicStyleWrap');if(w)w.style.display=this.checked?'':'none'"/>
            <span>🎵 Add a background music track - freshly generated for every video. <b style="color:var(--muted)">Uncheck for no music.</b></span>
          </label>
          <div id="musicStyleWrap" style="margin-top:10px">
            <label style="font-size:12.5px;color:var(--muted)">Music style</label>
            <select id="rkMusicStyle">
              <option value="surprise">Surprise me - a fresh vibe each time</option>
              <option value="upbeat">Upbeat &amp; energetic</option>
              <option value="chill">Chill / lo-fi</option>
              <option value="cinematic">Cinematic &amp; inspirational</option>
              <option value="corporate">Corporate &amp; clean</option>
              <option value="funk">Funky &amp; groovy</option>
              <option value="electronic">Electronic &amp; modern</option>
              <option value="acoustic">Acoustic &amp; warm</option>
            </select>
          </div>
        </div>
        ${thumbField()}
        <div class="field"><label>Make it yours <span style="color:var(--muted2);font-weight:500">(optional)</span></label>
          <div class="extras">
            <div class="hint">Add your own B-roll/inlay clips and a script idea - or leave blank and we'll handle the whole thing for you.</div>
            <label>Your B-roll / inlay clips</label>
            <input type="file" id="rkBroll" multiple accept="video/*,image/*" onchange="addRkBroll(this)"/>
            <div style="font-size:11.5px;color:var(--muted2);margin-top:5px">Add as many clips as you like - pick a few now, then add more anytime. They stack up below. You can also add a line of <b>on-screen text</b> to any clip and choose where it sits.</div>
            <div id="rkBrollList" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px"></div>
            <div id="brollReq" style="display:none;color:#e9a0a8;font-size:12px;margin-top:7px">⚠️ Required for <b>No avatar</b> videos - add at least one clip. Your script plays as a voiceover (your cloned voice) with captions over these.</div>
            <label style="margin-top:14px">Script ideas or notes</label>
            <textarea id="rkScript" placeholder="A hook you love, points to hit, words to avoid, your call-to-action…" style="min-height:74px"></textarea>
          </div>
        </div>
        <button class="btn" onclick="submitRemake()">Render the video →</button>
        <p style="color:var(--muted2);font-size:12px;margin:12px 0 0">You'll get to approve each video before anything is posted.</p>
      </div>`;
  },

  library(){
    const af=window.__libFilter||'all'; window.__libFilter=null;
    const labels={all:'All',processing:'Rendering',review:'Review',ready:'Ready',posted:'Posted',rejected:'Rejected'};
    return `
      <div class="filters" id="libFilters">
        ${['all','processing','review','ready','posted','rejected'].map(f=>`<span class="chip ${f===af?'active':''}" onclick="filterLib('${f}',this)">${labels[f]}</span>`).join('')}
      </div>
      <div id="libGrid">${libGrid(af)}</div>`;
  },

  approvals(){
    const list=DB.videos.filter(v=>v.status==='review');
    if(!list.length) return emptyState('Nothing to approve','When a video is ready, it lands here for your thumbs-up before posting.');
    return `<p style="color:var(--muted);font-size:13.5px;margin:0 0 16px">Review each video, then approve to post or reject to discard.</p>`
      + list.map(v=>`
        <div class="arow">
          <div class="mini" style="cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;${v.thumbUrl?`background-image:url('${v.thumbUrl}');background-size:cover;background-position:center`:''}" onclick="openVideo('${v.id}')" title="Tap to play"><svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style="opacity:.85;filter:drop-shadow(0 1px 3px rgba(0,0,0,.6))"><path d="M8 5v14l11-7z"/></svg></div>
          <div class="info" style="cursor:pointer" onclick="openVideo('${v.id}')">
            <div class="t">${v.title}</div>
            ${v.captionText?`<div class="m" style="color:#c9d2e6;white-space:normal;line-height:1.45;max-height:3em;overflow:hidden">${cwEsc(cleanCaption(v.captionText))}</div>`:`<div class="m">From ${v.src} · ${avaName(v.avatar)} · ${(v.platforms||[]).join(', ')||'no platforms set'}</div>`}
            <div style="margin-top:7px"><span class="badge-status s-review"><span class="d"></span>Ready for review · tap to play</span></div>
          </div>
          <div class="acts">
            <button class="btn green small" onclick="openVideo('${v.id}')">▶ Review</button>
            <button class="btn danger small" onclick="openReject('${v.id}')">Reject</button>
            <button class="btn green small" onclick="decide('${v.id}','posted')">Approve &amp; post</button>
            <button class="btn ghost small" onclick="deleteVideo('${v.id}')">Delete</button>
          </div>
        </div>`).join('');
  },

  account(){
    const u=DB.user;
    const avas = allAvatars();
    const planCards = Object.entries(PLANS).map(([k,p])=>`
      <div class="card plan ${u.plan===k?'sel':''}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>${p.name}</b>${u.plan===k?'<span class="badge-status s-ready"><span class="d"></span>Current</span>':'<span class="founding">Founding rate</span>'}
        </div>
        <div style="margin:8px 0 2px"><span class="anchor">$${p.anchor}</span><span style="font-size:26px;font-weight:800">$${p.price}</span><small style="font-size:13px;color:var(--muted)">/mo</small></div>
        <div style="font-size:12.5px;color:var(--muted2);margin:0 0 8px;line-height:1.4"><b style="color:var(--text)">Best for:</b> ${p.who}</div>
        <ul class="plan-feats">${p.features.map(f=>`<li>${f}</li>`).join('')}</ul>
        ${p.note?`<div style="font-size:11.5px;color:var(--muted2);margin:8px 0 0">${p.note}</div>`:''}
        <button class="btn small ${u.plan===k?'ghost':''}" style="width:100%;margin-top:12px" onclick="choosePlan('${k}')">${u.comped&&u.plan===k?'Comped ✓':(u.status==='active'&&u.plan===k?'Manage':'Choose')}</button>
      </div>`).join('');
    const inc = !!u.comped;
    function addonCtl(a){
      const included = inc && a.buy==='autopilot';
      if(included) return '<span class="badge-status s-ready" style="white-space:nowrap"><span class="d"></span>Included</span>';
      if(a.buy) return `<button class="btn small" style="white-space:nowrap;padding:7px 13px" onclick="buyAddon('${a.buy}')">Add</button>`;
      return `<button class="btn ghost small" style="white-space:nowrap;padding:7px 13px" onclick="requestAddon('${(a.name||'').replace(/'/g,'')}')">Request</button>`;
    }
    const addonCards = ADDONS.map(a=>`<div class="kv" ${a.buy==='social'?'id="addonSocial"':''} style="align-items:center"><span class="l">${a.name} ${a.beta?'<span class="beta">Beta</span>':''}</span><span style="display:flex;align-items:center;gap:10px;max-width:64%;justify-content:flex-end"><span style="font-size:12px;color:var(--muted2);text-align:right">${a.desc}</span>${addonCtl(a)}</span></div>`).join('');
    return `
      ${u.status!=='active'?`<div class="banner"><span>⏳</span><div>Free trial - <b>${daysLeft()} days left</b>. Lock in your <b>founding rate</b> below to continue after your trial. No charge until you do.</div></div>`:''}
      <div class="sect-title" style="margin-top:0">Plans</div>
      <div class="grid cards3">
        ${planCards}
        <div class="card plan">
          <div style="display:flex;justify-content:space-between;align-items:center"><b>Agency</b></div>
          <div style="margin:8px 0 2px"><span style="font-size:26px;font-weight:800">$287</span><small style="font-size:13px;color:var(--muted)">/mo base</small></div>
          <div style="font-size:12.5px;color:var(--muted2);margin:0 0 8px;line-height:1.4"><b style="color:var(--text)">Best for:</b> marketers and agencies running content for several clients under one roof.</div>
          <ul class="plan-feats"><li>3 client seats included, then $97/seat</li><li>A full client account per seat, own login</li><li>AI twin + presenters, 15 videos each</li><li>Run every client from one dashboard</li></ul>
          <button class="btn small" style="width:100%;margin-top:12px" onclick="window.open('https://alignedwebservices.ca/','_blank')">Apply as an agency</button>
        </div>
        
      </div>
      <div class="sect-title">Add-ons <span style="color:var(--muted2);font-weight:500;font-size:12px">· available on any tier</span></div>
      <div class="card">${addonCards}</div>
      ${u.comped?`<div style="margin-top:14px;font-size:12.5px;color:var(--muted2)">✓ Your account is <b style="color:#8fe0ad">comped</b> - no billing on this account.</div>`:(u.status==='active'?`<div style="margin-top:14px"><button class="btn ghost small" onclick="manageBilling()">Manage billing &amp; invoices</button></div>`:'')}

      <div class="sect-title">Socials</div>
      <div class="card"><p style="color:var(--muted);font-size:13px;margin:0">Manage your connected accounts on the <a class="link" style="color:var(--purple);cursor:pointer" onclick="goSocials()">Connect socials</a> page.</p></div>

      ${autopilotCard()}

      ${affiliateCard()}

      ${rssCard()}

      ${creditCard()}

      <div class="sect-title">Your CRM connection</div>
      <div class="card">
        <p style="color:var(--muted);font-size:13px;margin:0 0 12px;max-width:560px">Connect your account once, and every lead, booking, and review from your website flows straight into your CRM - no setup needed. We tag it to your email automatically.</p>
        <div id="crmStatusRow"><span class="badge-status s-processing"><span class="d"></span>Checking…</span></div>
        <div style="margin-top:12px"><button class="btn small" id="crmConnectBtn" onclick="connectCRM()">Connect your CRM</button></div>
      </div>

      <div class="sect-title">Profile</div>
      <div class="card">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
          <div id="acPicPreview" style="width:64px;height:64px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;color:#fff;flex:none;background-size:cover;background-position:center;${u.profilePic?`background-image:url('${u.profilePic}')`:''}">${u.profilePic?'':((u.name||'A')[0]||'A').toUpperCase()}</div>
          <div>
            <label style="display:block;font-size:12px;color:var(--muted);margin-bottom:6px">Profile picture or company logo</label>
            <input id="acPicFile" type="file" accept="image/*" onchange="uploadProfilePic(this)" style="font-size:12px;max-width:210px"/>
            <span id="acPicStatus" style="color:var(--purple);font-size:12px;margin-left:6px"></span>
            ${u.profilePic?`<div style="margin-top:8px"><button class="btn ghost small" style="padding:5px 12px" onclick="removeProfilePic()">Remove picture</button></div>`:''}
          </div>
        </div>
        <div class="row2">
          <div class="field"><label>Full name</label><input id="acName" value="${u.name}" placeholder="Your full name"/></div>
          <div class="field"><label>Email</label><input id="acEmail" value="${u.email}"/></div>
          <div class="field"><label>Mobile (video delivery)</label><input id="acPhone" value="${u.phone||''}" placeholder="+1 555 123 4567"/></div>
          <div class="field"><label>Default avatar</label>
            <select id="acAvatar">${avas.map(a=>`<option value="${a.id}" ${u.avatar===a.id?'selected':''}>${a.name}</option>`).join('')}</select>
          </div>
        </div>
        <button class="btn small" onclick="saveProfile()">Save changes</button>
      </div>

      <div class="sect-title">Password</div>
      <div class="card">
        <div class="field"><label>Change password</label><div style="position:relative"><input id="acNewPw" type="password" autocomplete="new-password" placeholder="New password (at least 6 characters)" style="width:100%;padding-right:66px"/><span onclick="pwToggle('acNewPw',this)" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:12px;font-weight:600;color:var(--purple);cursor:pointer;user-select:none">Show</span></div></div>
        <button class="btn small" onclick="changePassword()">Update password</button>
        <p style="color:var(--muted2);font-size:12px;margin:10px 0 0">Prefer not to use a password? You can always log in with a one-time link we email you - just tap “Email me a login link” on the login screen.</p>
      </div>

      <div class="sect-title">Session &amp; accounts</div>
      <div class="card">
        <p style="color:var(--muted2);font-size:12.5px;margin:0 0 10px">Running more than one account? Click your name at the bottom of the sidebar to switch between them or add a new one.</p>
        <button class="btn small" onclick="addManagedAccount()" style="margin-right:8px">Add or create an account</button>
        <button class="btn danger small" onclick="logout()">Sign out of this account</button>
      </div>
    `;
  }
};

