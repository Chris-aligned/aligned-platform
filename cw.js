/* Aligned app module: cw.js (split from live) */

  let cwHistory=[]; let cwBusy=false;
  function cwLoggedIn(){ var a=document.getElementById('app'); return a && a.classList.contains('show'); }
  function cwShowBubble(){ if(cwLoggedIn()){ document.getElementById('cwBubble').classList.add('show'); if(!DB.teaserDismissed){ var t=document.getElementById('cwTeaser'); if(t) t.classList.add('show'); } } }
  function cwDismissTeaser(){ var t=document.getElementById('cwTeaser'); if(t) t.classList.remove('show'); DB.teaserDismissed=true; }
  function cwScroll(){ var e=document.getElementById('cwMsgs'); e.scrollTop=e.scrollHeight; }
  function cwAdd(text,who){ var m=document.createElement('div'); m.className='cw-msg '+who; m.textContent=text; document.getElementById('cwMsgs').appendChild(m); cwScroll(); }
  function cwToggle(open){
    document.getElementById('cwPanel').classList.toggle('show',open);
    document.getElementById('cwBubble').classList.toggle('show',!open && cwLoggedIn());
    if(open){ var tz=document.getElementById('cwTeaser'); if(tz) tz.classList.remove('show'); DB.teaserDismissed=true; }
    if(open && !cwHistory.length) cwGreet();
    if(open) setTimeout(function(){var i=document.getElementById('cwInput'); if(i)i.focus();},60);
  }
  function cwGreet(){
    var saved=DB.agentChat;
    if(saved && saved.length){ cwHistory=saved; saved.forEach(function(m){cwAdd(m.content,m.role==='user'?'me':'bot');}); migratePlans(); if((DB.plan&&DB.plan.items)||((DB.plans||[]).length)) cwPlanButtons();
      var uu=DB.user||{}; if(!uu.brandKnowledge){ cwAdd("Tip: tap the ➕ below to add your website or a file - I'll tailor everything to your brand.",'bot'); }
      return; }
    cwAdd("Hey! I'm your content strategist 👋 I build you a 30-day content plan - daily hooks, scripts and captions across your funnel - that Aligned can auto-render for you.",'bot');
    var u=DB.user||{};
    if(u.brandKnowledge){ cwAdd("I've got your brand details on file, so your plan will be tailored to you. Tell me a bit about what you're focused on right now and I'll get building.",'bot'); }
    else { cwAdd("Tip: tap the ➕ below to share your website or a file - or just tell me about your business here and I'll build your plan.",'bot'); }
  }
  // The ➕ menu in the composer: pull brand context from a website / file, or offer a website quote.
  function cwPlusToggle(e){ if(e){e.stopPropagation();} var p=document.getElementById('cwPlusPop'); if(p) p.classList.toggle('show'); }
  function cwPlusPick(kind){
    var p=document.getElementById('cwPlusPop'); if(p) p.classList.remove('show');
    if(kind==='web'){ cwAskWebsite(); }
    else if(kind==='file'){ var fi=document.getElementById('cwKnowFile'); if(fi){ fi.value=''; fi.click(); } }
    else if(kind==='none'){ cwNoWebsite(); }
  }
  document.addEventListener('click',function(e){ var pop=document.getElementById('cwPlusPop'); var plus=document.getElementById('cwPlus'); if(pop&&pop.classList.contains('show')&&!pop.contains(e.target)&&e.target!==plus){ pop.classList.remove('show'); } });
  function cwSaveKnowledge(text, label){
    var u=DB.user||{}; var t=(text||'').replace(/\s+/g,' ').trim().slice(0,6000);
    if(!t){ cwAdd("Hmm, I couldn't pull any text from that. You can try another link or file, or just tell me about your business in the chat.",'bot'); return false; }
    u.brandKnowledge=t; if(label && /^https?:/i.test(label)) u.website=label; DB.user=u;
    cwAdd("Got it ✓ I've read "+(label||'your materials')+" and I'll tailor every hook, script and caption to your business. Now - anything specific you want to push this month? Otherwise I'll build the full 30-day plan.",'bot');
    return true;
  }
  async function cwAskWebsite(){
    var url=window.prompt('Paste your website or landing page link:'); if(!url) return;
    url=url.trim(); if(!/^https?:\/\//i.test(url)) url='https://'+url;
    cwAdd(url,'me'); cwAdd('Reading your site…','bot');
    try{
      var r=await fetch(CONFIG.FETCH_SITE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:url})});
      var j=await r.json(); var msgs=document.getElementById('cwMsgs'); if(msgs.lastChild&&/Reading your site/.test(msgs.lastChild.textContent)) msgs.removeChild(msgs.lastChild);
      cwSaveKnowledge(j&&j.text, url);
    }catch(e){ var m2=document.getElementById('cwMsgs'); if(m2.lastChild&&/Reading your site/.test(m2.lastChild.textContent)) m2.removeChild(m2.lastChild); cwAdd("I couldn't reach that site just now. You can try again, upload a file, or just tell me about your business here.",'bot'); }
  }
  function cwKnowFileChosen(input){
    var f=input.files&&input.files[0]; if(!f) return;
    if(f.size>2000000){ cwAdd("That file's a bit big - a short text/PDF export under 2MB works best, or just paste the key points in the chat.",'bot'); return; }
    cwAdd('📎 '+f.name,'me');
    var rd=new FileReader();
    rd.onload=function(){ cwSaveKnowledge(String(rd.result||''), f.name); };
    rd.onerror=function(){ cwAdd("I couldn't read that file. A plain-text or .md file works best - or paste the key points here.",'bot'); };
    rd.readAsText(f);
  }
  function cwNoWebsite(){
    var d=window.prompt("No problem - Aligned can build you one. In a sentence or two: what do you sell, and who's it for? I'll send this to Chris and he'll get you a quote.");
    if(!d) return; d=d.trim(); if(!d) return;
    cwAdd("I don't have a website - "+d,'me');
    try{ notifyChris('website_quote',{detail:'WEBSITE QUOTE REQUEST - '+d}); }catch(e){}
    cwAdd("Perfect - I've sent that to Chris for a website quote; he'll reach out by email. Meanwhile, tell me about your business and I'll build your 30-day plan now.",'bot');
  }
  function cwBindTap(btn,fn){
    // iOS Safari sometimes won't fire click on buttons inside a scrolling area within a fixed panel.
    // Bind touchend (with a small move-guard so scrolling doesn't trigger it) AND click.
    var sx=0,sy=0,moved=false;
    btn.addEventListener('touchstart',function(e){ var t=e.touches[0]; sx=t.clientX; sy=t.clientY; moved=false; },{passive:true});
    btn.addEventListener('touchmove',function(e){ var t=e.touches[0]; if(Math.abs(t.clientX-sx)>10||Math.abs(t.clientY-sy)>10) moved=true; },{passive:true});
    btn.addEventListener('touchend',function(e){ if(moved) return; e.preventDefault(); fn(); },{passive:false});
    btn.addEventListener('click',function(e){ fn(); });
  }
  // ===== Multiple 30-day plans =====
  function planId(){ return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  function nextPlanName(){ return 'Plan '+((DB.plans||[]).length+1); }
  function setCurrentPlan(id){ var arr=DB.plans||[]; var p=arr.find(function(x){return x&&x.id===id;}); if(p){ var u=DB.user||{}; u.curPlanId=id; DB.user=u; DB.plan=p; } return p; }
  // Make sure the current plan + library are reconciled and every plan has an id (handles legacy single-plan accounts).
  function migratePlans(){
    var legacy=DB.plan;
    if(legacy && !legacy.id){ legacy.id=planId(); legacy.name=legacy.name||'Plan 1'; localStorage.setItem('aws_plan',JSON.stringify(legacy)); }
    var arr=DB.plans||[];
    if((!arr.length) && legacy){ DB.plans=[legacy]; arr=DB.plans; }
    var u=DB.user||{}; var pick=null;
    if(u.curPlanId) pick=arr.find(function(x){return x&&x.id===u.curPlanId;});
    if(!pick) pick=arr.filter(function(x){return x&&x.active;}).pop();
    if(!pick) pick=arr[arr.length-1];
    if(pick) setCurrentPlan(pick.id);
  }
  function cwPlanButtons(){
    migratePlans();
    var p=DB.plan||{}; var arr=DB.plans||[];
    var w=document.createElement('div'); w.className='cw-acts';
    if(arr.length){ var lbl=document.createElement('div'); lbl.style.cssText='font-size:11.5px;color:var(--muted2);width:100%;margin:0 0 2px'; lbl.textContent='Current: '+(p.name||'Plan')+(p.active?' · running ●':(p.startedAt?' · paused':'')); w.appendChild(lbl); }
    var b1=document.createElement('button'); b1.type='button'; b1.className='cw-pill'; b1.textContent='📋 View plan'; cwBindTap(b1,cwViewPlan); w.appendChild(b1);
    var b2=document.createElement('button'); b2.type='button'; b2.className='cw-pill ghost';
    if(p.active){ b2.textContent='⏸ Pause renders'; cwBindTap(b2,cwPauseDaily); }
    else if(p.startedAt){ b2.textContent='▶ Resume renders'; cwBindTap(b2,cwResumeDaily); }
    else { b2.textContent='▶ Start daily renders'; cwBindTap(b2,cwStartDaily); }
    w.appendChild(b2);
    var bR=document.createElement('button'); bR.type='button'; bR.className='cw-pill ghost'; bR.textContent='🔄 Remake this plan'; cwBindTap(bR,cwRemakePlan); w.appendChild(bR);
    var bN=document.createElement('button'); bN.type='button'; bN.className='cw-pill ghost'; bN.textContent='➕ New plan'; cwBindTap(bN,cwNewPlan); w.appendChild(bN);
    if(arr.length>1){ var bP=document.createElement('button'); bP.type='button'; bP.className='cw-pill ghost'; bP.textContent='🗂 My plans ('+arr.length+')'; cwBindTap(bP,openPlans); w.appendChild(bP); }
    document.getElementById('cwMsgs').appendChild(w); cwScroll();
  }
  // Remake = rebuild the CURRENT plan's content from scratch (same slot/name).
  function cwRemakePlan(){
    if(cwBusy) return;
    if(!DB.plan||!DB.plan.items){ toast('No plan to remake yet'); return; }
    window.__planGenMode='remake';
    cwAdd('Let’s remake “'+((DB.plan&&DB.plan.name)||'your plan')+'”. What would you like to change or improve? For example: punchier hooks, more educational (or more promotional) content, push a specific offer or launch, try more faceless videos, a different tone, or a fresh set of topics. Tell me what to focus on - or just say “go” for a completely fresh take.','bot');
    var inp=document.getElementById('cwInput'); if(inp) inp.focus();
  }
  // New plan = generate an additional plan saved alongside the others.
  function cwNewPlan(){
    if(cwBusy) return;
    window.__planGenMode='new';
    cwAdd('Fresh plan it is! What should this one focus on - a launch, a theme, a particular audience or offer? Tell me, or just say “go” and I’ll build a well-rounded one.','bot');
    var inp=document.getElementById('cwInput'); if(inp) inp.focus();
  }
  // Plan switcher modal
  function openPlans(){
    var arr=DB.plans||[]; var cur=(DB.plan||{}).id;
    var rows=arr.slice().reverse().map(function(p){
      var isCur=p.id===cur;
      var when=p.createdAt?new Date(p.createdAt).toLocaleDateString():'';
      var status=p.active?'<span style="color:#39d98a">● running</span>':(p.startedAt?'<span style="color:#caa45a">paused</span>':'<span style="color:var(--muted2)">not started</span>');
      return '<div style="display:flex;align-items:center;gap:10px;border:1px solid '+(isCur?'var(--purple)':'var(--line)')+';background:var(--panel2);border-radius:11px;padding:11px 12px;margin-bottom:8px">'
        +'<div style="flex:1;min-width:0"><div style="font-weight:700;font-size:14px">'+cwEsc(p.name||'Plan')+(isCur?' <span style="color:var(--purple);font-size:11px">· current</span>':'')+'</div>'
        +'<div style="font-size:11.5px;color:var(--muted2)">'+(p.items?p.items.length:0)+' days · '+when+' · '+status+'</div></div>'
        +'<button class="btn ghost small" onclick="openPlanFromList(\''+p.id+'\')">Open</button>'
        +'<button class="btn ghost small" style="border-color:#5a2f37;color:#e9a0a8" onclick="deletePlan(\''+p.id+'\')">Delete</button>'
        +'</div>';
    }).join('');
    document.getElementById('plansList').innerHTML=rows||'<div style="color:var(--muted2);font-size:13px">No plans yet.</div>';
    document.getElementById('plansModal').classList.add('show');
  }
  function closePlans(){ var m=document.getElementById('plansModal'); if(m)m.classList.remove('show'); }
  function switchPlan(id){ var p=setCurrentPlan(id); closePlans(); if(p){ cwAdd('Switched to “'+(p.name||'Plan')+'”.','bot'); cwPlanButtons(); } }
  function openPlanFromList(id){ setCurrentPlan(id); closePlans(); cwViewPlan(); }
  function deletePlan(id){
    var arr=DB.plans||[]; var p=arr.find(function(x){return x&&x.id===id;}); if(!p) return;
    if(!confirm('Delete “'+(p.name||'this plan')+'”? This can’t be undone.')) return;
    if(p.active){ var u=DB.user||{}; if(CONFIG.PLAN_CONTROL){ fetch(CONFIG.PLAN_CONTROL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,active:false})}).catch(function(){}); } }
    arr=arr.filter(function(x){return x&&x.id!==id;}); DB.plans=arr;
    if((DB.plan||{}).id===id){ localStorage.removeItem('aws_plan'); var u2=DB.user||{}; if(u2.curPlanId===id){ u2.curPlanId=null; DB.user=u2; } if(arr.length){ setCurrentPlan(arr[arr.length-1].id); } }
    closePlans(); toast('Plan deleted'); if(arr.length) openPlans(); cwPlanButtons();
  }
  // Pause the daily render schedule (server stops queuing new days until resumed).
  function cwPauseDaily(){
    var u=DB.user||{}; var p=DB.plan; if(!p){ return; }
    p.active=false; DB.plan=p;
    if(CONFIG.PLAN_CONTROL){ fetch(CONFIG.PLAN_CONTROL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,active:false})}).catch(function(){}); }
    cwAdd('⏸ Daily content is paused - no new reels will be made until you turn it back on. Your plan is saved.','bot');
    cwPlanButtons();
  }
  // Resume the schedule where it left off (no immediate re-render).
  function cwResumeDaily(){
    var u=DB.user||{}; var p=DB.plan; if(!p){ return; }
    if(typeof canProduce==='function' && !canProduce()){ cwAdd('Your account needs attention before I can turn this back on - check Account & billing.','bot'); return; }
    p.active=true; DB.plan=p;
    if(CONFIG.PLAN_CONTROL){ fetch(CONFIG.PLAN_CONTROL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:u.email,active:true})}).catch(function(){}); }
    cwAdd('▶ Daily content is back ON - I’ll pick up where we left off and keep sending each reel to your Approvals for a yes before it posts.','bot');
    cwPlanButtons();
  }
  // Tolerant parser for the agent reply. Handles clean JSON, code fences, leading/trailing
  // junk, AND salvages a plan even if the JSON got cut off mid-array (recovers every complete day).
  function cwParse(raw){
    var s=String(raw==null?'':raw).trim();
    s=s.replace(/^```[a-z]*\s*/i,'').replace(/```\s*$/,'').trim();
    var i=s.indexOf('{'); if(i>0){ s=s.slice(i); }
    try{ return JSON.parse(s); }catch(e){}
    try{ return JSON.parse(s.replace(/[^}\]]*$/,'')); }catch(e){}
    // salvage: pull reply + every complete day object out of a truncated response
    try{
      var reply=''; var rm=s.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/); if(rm){ try{ reply=JSON.parse('"'+rm[1]+'"'); }catch(_){ reply=rm[1]; } }
      var pm=s.indexOf('"plan"');
      if(pm>-1){
        var arrStart=s.indexOf('[',pm);
        if(arrStart>-1){
          var items=[]; var depth=0; var objStart=-1;
          for(var k=arrStart+1;k<s.length;k++){
            var ch=s[k];
            if(ch==='{'){ if(depth===0){ objStart=k; } depth++; }
            else if(ch==='}'){ depth--; if(depth===0 && objStart>-1){ try{ items.push(JSON.parse(s.slice(objStart,k+1))); }catch(_){} objStart=-1; } }
          }
          if(items.length){ return { reply:(reply||'Here is your plan.'), plan:items }; }
        }
      }
      if(reply){ return { reply:reply }; }
    }catch(e){}
    return { reply:s };
  }
  function pwToggle(id,el){ var i=document.getElementById(id); if(!i) return; if(i.type==='password'){ i.type='text'; el.textContent='Hide'; } else { i.type='password'; el.textContent='Show'; } }
  async function cwTry(body){
    // Async pattern: kick off the job (returns a jobId instantly), then poll for the finished
    // result. This dodges the ~100s proxy limit that used to kill long 30-day plan builds.
    var jobId='';
    try{
      var startResp=await fetch(CONFIG.AGENT_WEBHOOK,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
      var startTxt=await startResp.text();
      try{ jobId=(JSON.parse(startTxt)||{}).jobId||''; }catch(e){ jobId=''; }
      if(!jobId){ return startTxt; } // fallback: server replied directly (old style)
    }catch(e){ throw e; }
    var startedAt=Date.now();
    while(Date.now()-startedAt < 300000){
      await new Promise(function(r){ setTimeout(r,3000); });
      var tp=document.getElementById('cwTyping');
      if(tp && (Date.now()-startedAt)>11000){ tp.textContent='building your 30-day plan… this takes a minute or two'; }
      try{
        var pr=await fetch(CONFIG.AGENT_POLL+'?jobId='+encodeURIComponent(jobId),{method:'GET'});
        var pj={}; try{ pj=JSON.parse(await pr.text()); }catch(e){ pj={}; }
        if(pj && pj.ready){ return pj.text||''; }
      }catch(e){ /* transient, keep polling */ }
    }
    throw new Error('timeout');
  }
  async function cwSend(){
    if(cwBusy) return; var inp=document.getElementById('cwInput'); var text=(inp.value||'').trim(); if(!text) return;
    inp.value=''; cwAdd(text,'me'); cwHistory.push({role:'user',content:text}); cwBusy=true;
    var tp=document.createElement('div'); tp.className='cw-typing'; tp.id='cwTyping'; tp.textContent='thinking…'; document.getElementById('cwMsgs').appendChild(tp); cwScroll();
    try{
      var u=DB.user||{}; var brand={name:u.name||'',email:u.email||'',plan:u.plan||'',website:u.website||'',knowledge:u.brandKnowledge||''};
      // Format guard appended to the latest user turn so the 30-day plan always fits + returns valid JSON (prevents truncation).
      var modeDirective='';
      if(window.__planGenMode==='remake'){ modeDirective="\n\n[Remake my current 30-day content plan from scratch, incorporating the direction in my message above. Give all-new hooks, scripts, formats and angles, still tailored to my business. Return the full updated 30-day plan.]"; }
      else if(window.__planGenMode==='new'){ modeDirective="\n\n[Build me a new 30-day content plan incorporating the direction in my message above, tailored to my business. Return the full 30-day plan.]"; }
      var guard=modeDirective+"\n\n[Format guard for the 30-day plan, follow EXACTLY: keep EACH day's script UNDER 45 words, the visual field UNDER 40 words, captions to 1-2 short sentences, 5-8 hashtags. This is critical so the whole plan fits: the complete 30-item JSON MUST be returned whole and valid, every bracket closed, no commentary before or after the JSON. Compact is better than clever.]";
      var msgsToSend=cwHistory.map(function(m,i){ return (i===cwHistory.length-1 && m.role==='user') ? {role:'user',content:m.content+guard} : {role:m.role,content:m.content}; });
      if(u.brandKnowledge){ for(var k=0;k<msgsToSend.length;k++){ if(msgsToSend[k].role==='user'){ msgsToSend[k]={role:'user',content:"[BRAND CONTEXT - pulled from my website/materials. Use this so every hook, script and caption matches my real business, offers, audience and voice:]\n"+u.brandKnowledge+"\n\n"+msgsToSend[k].content}; break; } } }
      var raw=await cwTry({messages:msgsToSend,brand:brand}); var data=cwParse(raw);
      var t=document.getElementById('cwTyping'); if(t)t.remove();
      var reply=(data&&data.reply)||"Sorry, I had trouble there - mind trying again?";
      cwAdd(reply,'bot'); cwHistory.push({role:'assistant',content:reply}); DB.agentChat=cwHistory;
      if(data && Array.isArray(data.plan) && data.plan.length){
        if(window.__planGenMode==='remake' && DB.plan && DB.plan.id){
          var cp=DB.plan; cp.items=data.plan; cp.createdAt=Date.now(); cp.active=false; cp.startedAt=null; DB.plan=cp; setCurrentPlan(cp.id);
          cwAdd('🔄 Done - I rebuilt “'+(cp.name||'your plan')+'” with all-new hooks and angles. Tap “📋 View plan” to look it over, then start daily renders when you’re happy.','bot');
        } else {
          var np={id:planId(),name:nextPlanName(),createdAt:Date.now(),items:data.plan,active:false,autoMode:(DB.user&&DB.user.autoRenderMode)||'approve'};
          var arr=DB.plans||[]; arr.push(np); DB.plans=arr; setCurrentPlan(np.id);
          if(arr.length>1){ cwAdd('✨ Saved as “'+np.name+'”. You now have '+arr.length+' plans - switch anytime with “🗂 My plans”. Only one runs daily renders at a time.','bot'); }
        }
        window.__planGenMode=null;
        cwPlanButtons();
      }
    }catch(e){ var t2=document.getElementById('cwTyping'); if(t2)t2.remove(); cwAdd("I couldn't reach the planner just now - please try again in a moment.",'bot'); }
    cwBusy=false; cwScroll();
  }
  function cwEsc(s){ return String(s==null?'':s).replace(/[&<>]/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;'})[c];}); }
  // Presenter dropdown options (value = presenter name; 'twin' first).
  function presOpts(selP){
    var u=DB.user||{}; var o='';
    if(u.twinReady && u.twinAvatarId){ o+='<option value="twin"'+(selP==='twin'?' selected':'')+'>My twin</option>'; }
    // Stock presenters come from the curated HeyGen set (STOCK_AVATARS), not the old paginated avatars2 feed.
    (STOCK_AVATARS||[]).forEach(function(a){ o+='<option value="'+cwEsc(a.name)+'"'+(selP===a.name?' selected':'')+'>'+cwEsc(a.name)+'</option>'; });
    if(!o) o='<option value="twin">My twin</option>';
    return o;
  }
  // Look dropdown options for a presenter (value = look id).
  function lookOpts(presenterName, selLookId){
    if(presenterName==='twin'||!presenterName){
      // In the Higgsfield model a twin is a single look, so no multi-look list (old HeyGen concept).
      return '<option value="twin" selected>Default look</option>';
    }
    // A Higgsfield stock presenter is a single photo, so it has one look. Value = the avatar id.
    var a=(STOCK_AVATARS||[]).find(function(x){return x.name===presenterName;});
    if(!a) return '<option value="">-</option>';
    return '<option value="'+a.id+'" selected>Default look</option>';
  }
  // Stored choice (look id or 'twin') -> {presenter, look}.
  function choiceParts(choice){
    if(!choice||choice==='twin') return {presenter:'twin', look:'twin'};
    var u0=DB.user||{}; if(Array.isArray(u0.twinLooks)&&u0.twinLooks.some(function(l){return l&&l.id===choice;})) return {presenter:'twin', look:choice};
    var lk=(typeof LOOK_BY_ID!=='undefined')?LOOK_BY_ID[choice]:null; if(lk) return {presenter:lk.presenter, look:choice};
    var pres=(STOCK_AVATARS||[]).find(function(a){return a.id===choice;});
    if(pres) return {presenter:pres.name, look:choice};
    return {presenter:'twin', look:'twin'};
  }
  // When a presenter select changes, repopulate its sibling look select.
  function onPlanPresChange(sel){
    var wrap=sel.closest('[data-avwrap]'); if(!wrap) return;
    var look=wrap.querySelector('.av-look'); if(!look) return;
    look.style.display='';
    if(sel.value==='twin'){ look.innerHTML=lookOpts('twin','twin'); }
    else { var a=(STOCK_AVATARS||[]).find(function(x){return x.name===sel.value;}); look.innerHTML=lookOpts(sel.value,(a&&a.id)||''); }
  }
  // Resolve a look choice (id) to the engine's avatar_id + voice_id.
  function resolveAva(choice){
    var u=DB.user||{};
    if(!choice || choice==='twin'){ return {avatar_id:(u.twinAvatarId||'twin'), voice_id:(u.twinVoiceId||''), photo:(u.twinPreview||'')}; }
    if(Array.isArray(u.twinLooks)&&u.twinLooks.some(function(l){return l&&l.id===choice;})){ var tl=u.twinLooks.find(function(l){return l&&l.id===choice;}); return {avatar_id:choice, voice_id:(u.twinVoiceId||''), photo:((tl&&tl.preview)||u.twinPreview||'')}; }
    var lk=(typeof LOOK_BY_ID!=='undefined')?LOOK_BY_ID[choice]:null; if(lk) return {avatar_id:choice, voice_id:lk.voice||'', photo:lk.preview||''};
    var a=(typeof allAvatars==='function'?allAvatars():[]).find(function(x){return x.id===choice;});
    return {avatar_id:choice, voice_id:(a&&a.voice)||'', photo:(a&&(a.preview||a.img||a.face))||''};
  }
  // Plain-language funnel stage labels (no TOFU/MOFU/BOFU acronyms). Class still uses the raw stage for colour.
  function stageLabel(s){ var m={TOFU:'Attract',MOFU:'Engage',BOFU:'Convert'}; return m[String(s||'').toUpperCase().trim()]||s||''; }
  function cwViewPlan(){
    var p=DB.plan; if(!p||!p.items){ toast('No plan yet'); return; }
    var hdr=document.querySelector('#planModal h3'); if(hdr) hdr.textContent=(p.name||'Your 30-day content plan');
    var u=DB.user||{}; var planDef=p.avatarChoice||u.avatar||'twin';
    var planStyle=p.styleChoice||'avatar';
    var cpTop=choiceParts(planDef);
    var av=document.getElementById('planAvatarWrap'); if(av) av.innerHTML='<select class="av-pres" onchange="onPlanPresChange(this)" style="font-size:12.5px;padding:6px 8px;max-width:150px">'+presOpts(cpTop.presenter)+'</select><select class="av-look" style="font-size:12.5px;padding:6px 8px;max-width:150px">'+lookOpts(cpTop.presenter,cpTop.look)+'</select>';
    var pss=document.getElementById('planStyleSel'); if(pss) pss.value=planStyle;
    document.getElementById('planList').innerHTML=p.items.map(function(d,i){ var cp=choiceParts(d.avatar||planDef); return '<div class="plan-day" data-i="'+i+'"><div class="ph" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="dn">DAY '+cwEsc(d.day)+'</span><span class="stg '+cwEsc(d.stage)+'">'+cwEsc(stageLabel(d.stage))+'</span><select class="day-style" onclick="event.stopPropagation()" onchange="onDayStyleChange()" style="font-size:11px;padding:3px 5px;max-width:120px"><option value="avatar"'+((((d.style||planStyle)!=='faceless')&&((d.style||planStyle)!=='cinematic')&&((d.style||planStyle)!=='reel'))?' selected':'')+'>🎥 Avatar</option><option value="faceless"'+(((d.style||planStyle)==='faceless')?' selected':'')+'>🎬 Faceless</option><option value="cinematic"'+(((d.style||planStyle)==='cinematic')?' selected':'')+'>🎞️ Cinematic</option><option value="reel"'+(((d.style||planStyle)==='reel')?' selected':'')+'>🌀 Cinematic reel</option></select><span data-avwrap style="margin-left:auto;display:flex;align-items:center;gap:4px" onclick="event.stopPropagation()">🎬 <select class="av-pres" onchange="onPlanPresChange(this)" onclick="event.stopPropagation()" style="font-size:11px;padding:3px 5px;max-width:94px">'+presOpts(cp.presenter)+'</select><select class="av-look" onclick="event.stopPropagation()" style="font-size:11px;padding:3px 5px;max-width:94px">'+lookOpts(cp.presenter,cp.look)+'</select></span></div><div class="hk" contenteditable="true" data-f="hook">'+cwEsc(d.hook)+'</div><div class="sc" contenteditable="true" data-f="script">'+cwEsc(d.script)+'</div><div class="cp" contenteditable="true" data-f="caption">'+cwEsc(d.caption)+'</div><div class="cp" contenteditable="true" data-f="hashtags" style="color:#cbbcff;margin-top:2px">'+cwEsc(d.hashtags||'')+'</div>'+dayAddonsHtml(d)+'</div>'; }).join(''); setTimeout(planCostUpdate,0);
    renderBrollLib(); toggleBrollWrap();
    document.getElementById('planModal').classList.add('show');
  }
  // Show the B-roll library uploader whenever faceless is in play (plan default or any single day).
  function planAnyFaceless(){
    var p=DB.plan; if(!p) return false;
    var pss=document.getElementById('planStyleSel'); var planStyle=(pss?pss.value:(p.styleChoice||'avatar'));
    if(planStyle==='faceless') return true;
    var sels=document.querySelectorAll('#planList .day-style');
    for(var i=0;i<sels.length;i++){ if(sels[i].value==='faceless') return true; }
    return false;
  }
  // Always visible now: the B-roll library is no longer faceless-only, it is also the background
  // source for showcase videos, so customers need a permanent place to put their own footage.
  function toggleBrollWrap(){ var w=document.getElementById('brollLibWrap'); if(w) w.style.display='block'; }
  function onPlanStyleChange(){ toggleBrollWrap(); }
  function onDayStyleChange(){ toggleBrollWrap(); }
  function renderBrollLib(){
    var box=document.getElementById('brollLibList'); if(!box) return;
    var p=DB.plan||{}; var lib=Array.isArray(p.brollLib)?p.brollLib:[];
    box.innerHTML=lib.map(function(u,i){ return '<span style="display:inline-flex;align-items:center;gap:5px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:4px 8px;font-size:11px;color:var(--muted)">clip '+(i+1)+' <span style="cursor:pointer;color:#e06a6a;font-weight:700" onclick="removeBrollLib('+i+')">×</span></span>'; }).join('');
  }
  function removeBrollLib(i){ var p=DB.plan; if(!p||!Array.isArray(p.brollLib)) return; p.brollLib.splice(i,1); DB.plan=p; renderBrollLib(); }
  function uploadBrollLib(input){
    var files=Array.prototype.slice.call(input.files||[]); if(!files.length) return;
    var st=document.getElementById('brollLibStatus'); if(st) st.textContent='Uploading '+files.length+' clip'+(files.length>1?'s':'')+'…';
    var p=DB.plan||{}; p.brollLib=Array.isArray(p.brollLib)?p.brollLib:[];
    Promise.all(files.map(function(f){ var fd=new FormData(); fd.append('file',f); fd.append('upload_preset',CONFIG.CLOUDINARY_PRESET);
      return fetch('https://api.cloudinary.com/v1_1/'+CONFIG.CLOUDINARY_CLOUD+'/auto/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(x){return x.secure_url||x.url||'';}).catch(function(){return '';});
    })).then(function(urls){
      urls.forEach(function(u){ if(u) p.brollLib.push(u); }); DB.plan=p; renderBrollLib();
      if(st) st.textContent='✓ Added to your library';
      input.value='';
    });
  }
  function savePlanEdits(btn){
    var p=DB.plan; if(!p||!p.items) return false;
    document.querySelectorAll('#planList .plan-day').forEach(function(el){
      var i=+el.dataset.i; if(isNaN(i)||!p.items[i]) return;
      el.querySelectorAll('[data-f]').forEach(function(c){ p.items[i][c.dataset.f]=(c.textContent||'').trim(); });
      var dp=el.querySelector('.av-pres'), dl=el.querySelector('.av-look');
      if(dp){ p.items[i].avatar=(dl&&dl.value)?dl.value:(dp.value||'twin'); }
      var dsy=el.querySelector('.day-style'); if(dsy){ p.items[i].style=(dsy.value==='faceless')?'faceless':((dsy.value==='cinematic')?'cinematic':'avatar'); }
      var dpt=el.querySelector('.day-premthumb'); if(dpt){ p.items[i].premiumThumb=!!dpt.checked; }
    });
    var tw=document.getElementById('planAvatarWrap');
    if(tw){ var tp=tw.querySelector('.av-pres'), tl=tw.querySelector('.av-look'); p.avatarChoice=(tl&&tl.value)?tl.value:((tp&&tp.value)||'twin'); }
    var pssv=document.getElementById('planStyleSel'); if(pssv) p.styleChoice=(pssv.value==='faceless')?'faceless':((pssv.value==='cinematic')?'cinematic':'avatar');
    DB.plan=p;
    // The plan modal covers the toast, so confirm right on the button.
    if(btn){ var o=btn.textContent; btn.textContent='Saved ✓'; btn.style.color='#39d98a'; setTimeout(function(){ btn.textContent=o||'Save changes'; btn.style.color=''; },1600); }
    else { toast('<span class="ok">✓</span> Plan saved'); }
    return true;
  }
  function cwStartDaily(){
    var u=DB.user||{};
    var pm0=document.getElementById('planModal'); if(pm0 && pm0.classList.contains('show')) savePlanEdits(); // bank any edits before activating
    var p=DB.plan;
    if(!p||!p.items||!p.items.length){ cwAdd('Let’s build your 30-day plan first - tell me a bit about your business and I’ll create it, then you can switch on daily renders.','bot'); toast('Build your plan first'); return; }
    if(typeof canProduce==='function' && !canProduce()){ cwAdd('Your account needs attention before I can switch this on - take a quick look at Account & billing (your trial may have ended or you’ve hit this month’s video limit).','bot'); return; }
    if(p.active){ cwAdd('✓ Daily content is already running - one reel a day goes to your Approvals for a quick yes before it posts. You can change any day’s look in “View 30-day plan”.','bot'); return; }
    var planDef=p.avatarChoice||u.avatar||'twin';   // default look for days the user didn't change
    var planStyle=p.styleChoice||'avatar';          // avatar vs faceless default
    var def=resolveAva(planDef);
    var lib=Array.isArray(p.brollLib)?p.brollLib:[];
    // resolve EACH day's look + style; for faceless days, attach B-roll (library rotation, else auto-sourced stock)
    var stockJobs=[];
    p.items.forEach(function(it,idx){ var r=resolveAva(it.avatar||planDef); it.avatar_id=r.avatar_id; it.voice_id=r.voice_id; it.image_url=r.photo||'';
      var s0=(it.style||planStyle); var sty=(s0==='faceless')?'faceless':((s0==='cinematic')?'cinematic':((s0==='reel')?'reel':'avatar')); it.style=sty;
      it.makeUltra=false;
      if(sty==='faceless' && !(Array.isArray(it.broll)&&it.broll.length)){
        if(lib.length){ var n=lib.length; it.broll=[lib[idx%n], lib[(idx+1)%n], lib[(idx+2)%n]].filter(Boolean); }
        else if(CONFIG.STOCK_BROLL){ stockJobs.push(fetch(CONFIG.STOCK_BROLL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:(it.hook||it.caption||'business marketing'),count:4})}).then(function(rr){return rr.json();}).then(function(jj){ it.broll=(jj&&Array.isArray(jj.urls))?jj.urls:[]; }).catch(function(){ it.broll=[]; })); }
      }
    });
    p.active=true; p.startedAt=Date.now(); p.autoMode='approve'; DB.plan=p;   // always route through approval
    // only one plan runs daily renders at a time - pause any other active plan locally (server is keyed per account)
    var allp=DB.plans||[]; var changed=false; allp.forEach(function(x){ if(x&&x.id!==p.id&&x.active){ x.active=false; changed=true; } }); if(changed) DB.plans=allp;
    var bk=brandKitGet();
    var doPost=function(){ if(CONFIG.PLAN_WEBHOOK){ fetch(CONFIG.PLAN_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'activate_plan',email:u.email,phone:u.phone,name:u.name,autoMode:'approve',avatar_id:def.avatar_id,voice_id:def.voice_id,image_url:(def.photo||u.twinPreview||''),style:planStyle,elevenVoiceId:(u.elevenVoiceId||''),brollLib:lib,planLimit:(PLAN_LIMITS[u.plan]||30),twinPreview:(u.twinPreview||''),twinVoiceId:(u.twinVoiceId||''),brandKit:{brandName:(bk.brandName||u.name||''),logo:(bk.logoUrl||''),bg:bk.bg,accentFrom:bk.accentFrom,accentTo:bk.accentTo,text:bk.text,muted:bk.muted},plan:p.items})}).catch(function(){}); } };
    if(stockJobs.length){ Promise.all(stockJobs).then(doPost); } else { doPost(); }
    var pm=document.getElementById('planModal'); if(pm)pm.classList.remove('show');
    cwAdd('✅ Daily content is ON - and I’m making your first reel right now. After that you’ll get one a day, each sent to your Approvals for a quick yes before it posts, so nothing goes out without your OK. You can change any day’s look anytime under “View 30-day plan”, and pause anytime.','bot');
    toast('<span class="ok">✓</span> Daily content is on');
    cwPlanButtons();
  }
  if(typeof enterApp==='function'){ var _ea=enterApp; window.enterApp=function(){ _ea.apply(this,arguments); cwShowBubble(); }; }
  document.getElementById('cwInput').addEventListener('keydown',function(e){ if(e.key==='Enter'){ e.preventDefault(); cwSend(); } });
  cwShowBubble();
