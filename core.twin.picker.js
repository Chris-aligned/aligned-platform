/* Aligned app module: core.twin.picker.js (split from live core.twin.js) */
/* Aligned app module: core.twin.js (split from live; load order matters) */
function socialRow(p){
  const st=(DB.user.socials||{})[p];
  // The manual "mark as connected" overrides are an admin-only shortcut (Chris's account); everyone else only sees the real connect flow + live GHL status.
  const isAdmin=(((DB.user&&DB.user.email)||'').toLowerCase()==='chris@alignedwebservices.ca');
  const markPending=isAdmin?' <button class="btn small" style="margin-left:8px" onclick="markConnected(\''+p+'\')">I\'ve connected it ✓</button>':'';
  const markIdle=isAdmin?' <button class="btn ghost small" style="opacity:.65" onclick="markConnected(\''+p+'\')">Already connected? Mark it ✓</button>':'';
  let right;
  if(st==='connected') right='<span class="badge-status s-posted"><span class="d"></span>✓ Connected</span> <button class="btn ghost small" style="margin-left:8px" onclick="disconnectSocial(\''+p+'\')">Disconnect</button>';
  else if(st==='pending') right='<span class="badge-status s-processing" style="vertical-align:middle"><span class="d"></span>Connecting…</span>'+markPending+' <button class="btn ghost small" onclick="resendConnect(\''+p+'\')">Resend link</button> <button class="btn ghost small" onclick="cancelConnect(\''+p+'\')">Cancel</button>';
  else right='<button class="btn ghost small" onclick="openConnect(\''+p+'\')">Connect</button>'+markIdle;
  return `<div class="kv"><span class="l">${p}</span><span>${right}</span></div>`;
}

function id(){ return Math.random().toString(36).slice(2,10); }
function avaName(aid){ const a=allAvatars().find(x=>x.id===aid); return a?a.name:'Avatar'; }
function avaCell(a){
  if(a.twin){
    const u=DB.user||{};
    if(u.twinAvatarId && u.twinReady){
      const tbg = u.twinPreview ? `background-image:url('${u.twinPreview}');background-size:cover;background-position:center` : '';
      return `<div class="ava twin sel" data-id="twin" onclick="pickAva(this)"><div class="face" style="${tbg}">${u.twinPreview?'':'★'}</div><div class="nm">My twin</div><div class="ava-badge">Most lifelike</div></div>`;
    }
    if(u.twinAvatarId && !u.twinReady){
      if(u.twinConsentTapped){
        return `<div class="ava twin" data-id="twin-building" onclick="refreshFromServer();toast('Your twin is still finishing up - usually 10–15 minutes. We’ll text you when it’s ready; tap again to re-check.')"><div class="face" style="background:rgba(124,92,255,.14)">⏳</div><div class="nm">Twin building…</div><div class="ava-badge" style="background:#262d38;color:var(--muted)">~15 min · tap to re-check</div></div>`;
      }
      return `<div class="ava twin" data-id="twin-pending" onclick="openTwinConsent()"><div class="face" style="background:rgba(202,164,90,.18)">⏳</div><div class="nm">Confirm your twin</div><div class="ava-badge" style="background:#caa45a;color:#1a1408">Action needed</div></div>`;
    }
    return `<div class="ava twin" data-id="twin-create" onclick="openTwinCreate()"><div class="face" style="background:var(--grad);color:#fff;font-size:22px">+</div><div class="nm">Create your twin</div><div class="ava-badge">Most lifelike</div></div>`;
  }
  // stock presenter tile (with favourite star + looks count)
  var u=DB.user||{}; var favs=(u.favorites||[]);
  var looks=a.looks||[{id:a.id,look:'Default',preview:a.preview,voice:a.voice}];
  var isFav=favs.indexOf(a.name)>=0;
  var n=a.looksCount||looks.length;
  return '<div class="ava" data-id="'+looks[0].id+'" data-presenter="'+a.name+'" onclick="pickAva(this)" style="position:relative">'
    +'<span onclick="toggleFav(event,\''+a.name+'\')" title="Favourite" style="position:absolute;top:3px;right:6px;font-size:15px;cursor:pointer;z-index:3;color:'+(isFav?'#ffd24a':'#9aa6bf')+'">'+(isFav?'★':'☆')+'</span>'
    +faceImg(a.preview, (a.name||'?')[0])
    +'<div class="nm">'+a.name+'</div>'
    +(n>1?'<div class="ava-badge">'+n+' looks</div>':'')
    +'</div>';
}
// Twin looks (extra outfits added to the customer's own twin) + an "Add a look" tile.
function twinLookCells(){
  var u=DB.user||{}; var html='';
  if(u.twinAvatarId && u.twinReady){
    (Array.isArray(u.twinLooks)?u.twinLooks:[]).forEach(function(lk){
      var pv=lk.preview||u.twinPreview;
      var bg=pv?("background-image:url('"+pv+"');background-size:cover;background-position:center"):'';
      var pencil='<span onclick="renameTwinLook(event,\''+lk.id+'\')" title="Rename this look" style="position:absolute;top:3px;right:6px;font-size:13px;cursor:pointer;z-index:3;color:#9aa6bf">✎</span>';
      if(lk.ready){
        html+='<div class="ava twin" data-id="'+lk.id+'" data-twinlook="1" onclick="pickAva(this)" style="position:relative">'+pencil+'<div class="face" style="'+bg+'">'+(pv?'':'★')+'</div><div class="nm">'+(lk.name||'My look')+'</div><div class="ava-badge">My twin look</div></div>';
      } else {
        html+='<div class="ava twin" style="opacity:.75;position:relative">'+pencil+'<div class="face" style="background:rgba(124,92,255,.14)">⏳</div><div class="nm">'+(lk.name||'New look')+'</div><div class="ava-badge" style="background:#262d38;color:var(--muted)">building…</div></div>';
      }
    });
    html+='<div class="ava twin" data-id="twin-addlook" onclick="openTwinCreate(true)"><div class="face" style="background:var(--grad);color:#fff;font-size:22px">+</div><div class="nm">Add a look</div><div class="ava-badge">New look</div></div>';
  }
  return html;
}
// Rename a twin look after the fact (in case it was left blank or you want to change it).
function renameTwinLook(e,id){
  if(e&&e.stopPropagation)e.stopPropagation();
  var u=DB.user||{}; var looks=Array.isArray(u.twinLooks)?u.twinLooks:[];
  var lk=looks.find(function(x){return x.id===id;}); if(!lk) return;
  var name=window.prompt('Name this look (e.g. Navy suit, Outdoors, Casual):', lk.name||'');
  if(name===null) return; name=String(name).trim(); if(!name) return;
  lk.name=name; u.twinLooks=looks; DB.user=u; renderAvaGrid();
}
// Compact picker: your twin + its looks, your favourites, No-avatar, and a Browse-library button.
// The full presenter catalogue lives in the searchable library modal (loaded on demand) so the
// page stays light and there's no endless scroll before the next step.
function avaPickInner(){
  var u=DB.user||{}; var favs=(u.favorites||[]);
  var html=avaCell(TWIN)+twinLookCells();
  var favCells=(STOCK_AVATARS||[]).filter(function(a){return favs.indexOf(a.name)>=0;});
  favCells.sort(function(a,b){ return favs.indexOf(a.name)-favs.indexOf(b.name); });
  html+=favCells.map(function(a){return avaCell(a);}).join('');
  html+=noAvatarCell();
  html+=browseTile();
  return html;
}
function browseTile(){
  // Count the curated presenters only, not all 582. The badge is a promise about what you'll see
  // when you tap it, and tapping it opens the curated view - "Browse 582" then showing 454 would
  // look like something failed to load. The extras are offered inside, on the "More avatars" button.
  var n=(STOCK_AVATARS||[]).filter(function(a){ return (a.tier||0)===0; }).length;
  return '<div class="ava" data-lib="1" onclick="openAvaLib()" style="cursor:pointer"><div class="face" style="background:var(--grad);color:#fff;font-size:22px">⊞</div><div class="nm">Avatar library</div><div class="ava-badge">'+(n?('Browse '+n):'Browse all')+'</div></div>';
}
// ---- Avatar library modal ----
// Hundreds of presenters, so: search + gender/favourites filters, images that only load
// when they scroll into view, and a "Show more" pager instead of one enormous grid.
// __libAll is the "More avatars" switch. false (the default) = show only the curated presenters.
// true = also show the extra ones. It is deliberately SEPARATE from __libGender so that "More
// avatars" stacks with Women / Men / ★ Favourites instead of cancelling them out.
var __libQuery='', __libGender='', __libShown=0, __LIB_PAGE=120, __libGroup='', __libName='', __libAll=false;
function esc1(s){ return String(s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function escAttr(s){ return String(s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }
function openAvaLib(){
  // Every open starts back on the curated set, so the library always opens looking the same.
  __libQuery=''; __libGender=''; __libShown=__LIB_PAGE; __libAll=false;
  var m=document.getElementById('avaLibModal'); if(!m)return;
  var s=document.getElementById('avaLibSearch'); if(s)s.value='';
  document.querySelectorAll('#avaLibFilters .chip').forEach(function(c){ c.classList.toggle('active', c.dataset.g===''); });
  closeLooks();
  document.getElementById('avaLibGrid').innerHTML=avaLibInner();
  m.classList.add('show'); if(s)setTimeout(function(){s.focus();},60);
}
function closeAvaLib(){ var m=document.getElementById('avaLibModal'); if(m)m.classList.remove('show'); closeLooks(); }
function avaLibSearch(v){ __libQuery=(v||'').toLowerCase().trim(); __libShown=__LIB_PAGE; document.getElementById('avaLibGrid').innerHTML=avaLibInner(); }
function avaLibGender(el){
  __libGender=el.dataset.g||''; __libShown=__LIB_PAGE;
  document.querySelectorAll('#avaLibFilters .chip').forEach(function(c){ c.classList.remove('active'); });
  el.classList.add('active');
  document.getElementById('avaLibGrid').innerHTML=avaLibInner();
}
function libMore(){ __libShown+=__LIB_PAGE; document.getElementById('avaLibGrid').innerHTML=avaLibInner(); }
// The "More avatars" / "Show fewer" button. It has its own handler on purpose - it must NOT touch
// __libGender or the chip row, or turning it on would silently drop whatever gender/favourites
// filter the customer had chosen.
function libToggleAll(){
  __libAll=!__libAll; __libShown=__LIB_PAGE;
  document.getElementById('avaLibGrid').innerHTML=avaLibInner();
  var g=document.getElementById('avaLibGrid'); if(g) g.scrollTop=0; // expanding should not leave them stranded mid-scroll
}
// The ONE place presenters get filtered. Search, the chips, favourites and the pager all render
// through here, so the curated/full split only has to be handled once and it is honoured everywhere.
// Pass forceAll=true to peek at the full list (used only to count how many extras are hiding).
function avaLibList(forceAll){
  var u=DB.user||{}; var favs=(u.favorites||[]);
  var list=(STOCK_AVATARS||[]).slice();
  if(!forceAll && !__libAll) list=list.filter(function(a){ return (a.tier||0)===0; });
  if(__libQuery) list=list.filter(function(a){return (a.name||'').toLowerCase().indexOf(__libQuery)>=0;});
  if(__libGender==='fav') list=list.filter(function(a){ return favs.indexOf(a.name)>=0; });
  else if(__libGender) list=list.filter(function(a){ return (a.gender||'')===__libGender; });
  list.sort(function(a,b){ var fa=favs.indexOf(a.name)>=0?0:1, fb=favs.indexOf(b.name)>=0?0:1; if(fa!==fb)return fa-fb; return (a.name||'').localeCompare(b.name||''); });
  return list;
}
function avaLibInner(){
  var list=avaLibList();
  // How many extra presenters the "More avatars" button would add, counted AFTER the customer's
  // current search and chip filters - so the number on the button is the number they'd really get.
  var extra = __libAll ? 0 : Math.max(0, avaLibList(true).length - list.length);
  // grid-column:1/-1 makes this span the whole picker grid instead of sitting in one tile slot.
  var toggle = '';
  if(__libAll) toggle='<div style="grid-column:1/-1;padding:10px 2px 2px"><button class="btn ghost" style="width:100%" onclick="libToggleAll()">Show fewer</button></div>';
  else if(extra) toggle='<div style="grid-column:1/-1;padding:10px 2px 2px"><button class="btn ghost" style="width:100%" onclick="libToggleAll()">More avatars ('+extra+' more)</button></div>';
  // Note the empty case still offers the button: a search can match nothing in the curated set
  // while matching plenty in the extras, and a dead end there would feel like a bug.
  if(!list.length) return '<div style="grid-column:1/-1;color:var(--muted2);font-size:13px;padding:16px 2px">No presenters match that.</div>'+toggle;
  var shown=list.slice(0,__libShown||__LIB_PAGE);
  var html=shown.map(function(a){return avaLibCell(a);}).join('');
  if(list.length>shown.length){
    html+='<div style="grid-column:1/-1;padding:10px 2px 2px"><button class="btn ghost" style="width:100%" onclick="libMore()">Show more presenters ('+(list.length-shown.length)+' left)</button></div>';
  }
  return html+toggle;
}
// loading="lazy" means only the tiles actually on screen fetch their photo, so a 500-tile
// grid costs one screen's worth of images. onerror hides a dead image instead of showing a
// broken-picture icon (previews are filtered to permanent URLs server-side, this is belt and braces).
function faceImg(src, letter){
  if(!src) return '<div class="face">'+escAttr(letter||'?')+'</div>';
  return '<div class="face" style="overflow:hidden;padding:0">'
    +'<img src="'+escAttr(src)+'" loading="lazy" decoding="async" alt="" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display=\'none\';this.parentNode.textContent=\''+esc1(letter||'?')+'\'">'
    +'</div>';
}
function avaLibCell(a){
  var u=DB.user||{}; var favs=(u.favorites||[]); var isFav=favs.indexOf(a.name)>=0;
  var looks=a.looks||[{id:a.id,look:'Default',preview:a.preview,voice:a.voice}];
  var n=a.looksCount||looks.length;
  var badge = (n>1 && a.group)
    ? '<div class="ava-badge" onclick="openLooks(event,\''+esc1(a.group)+'\',\''+esc1(a.name)+'\')" style="cursor:pointer" title="See this presenter\'s other looks">'+n+' looks ›</div>'
    : (n>1 ? '<div class="ava-badge">'+n+' looks</div>' : '');
  return '<div class="ava" data-id="'+escAttr(looks[0].id)+'" data-presenter="'+escAttr(a.name)+'" onclick="pickFromLib(\''+esc1(a.name)+'\',\''+esc1(looks[0].id)+'\')" style="position:relative;cursor:pointer">'
    +'<span onclick="toggleFavLib(event,\''+esc1(a.name)+'\')" title="Favourite" style="position:absolute;top:3px;right:6px;font-size:15px;cursor:pointer;z-index:3;color:'+(isFav?'#ffd24a':'#9aa6bf')+'">'+(isFav?'★':'☆')+'</span>'
    +faceImg(looks[0].preview, (a.name||'?')[0])
    +'<div class="nm">'+escAttr(a.name)+'</div>'
    +badge
    +'</div>';
}
// ---- one presenter's looks (fetched on demand) ----
function openLooks(e, groupId, name){
  if(e&&e.stopPropagation)e.stopPropagation();
  __libGroup=groupId; __libName=name;
  document.getElementById('avaLibBrowse').style.display='none';
  var panel=document.getElementById('avaLibLooks'); panel.style.display='flex';
  document.getElementById('avaLibBack').style.display='';
  document.getElementById('avaLibTitle').textContent=name+' - looks';
  document.getElementById('avaLibSub').textContent='Same presenter, different outfit and setting. Tap the one you want.';
  var grid=document.getElementById('avaLibLooksGrid');
  grid.innerHTML='<div style="grid-column:1/-1;color:var(--muted2);font-size:13px;padding:16px 2px">Loading looks…</div>';
  loadPresenterLooks(groupId, function(looks){
    if(__libGroup!==groupId) return; // customer moved on
    if(!looks||!looks.length){ grid.innerHTML='<div style="grid-column:1/-1;color:var(--muted2);font-size:13px;padding:16px 2px">We could not load this presenter\'s other looks right now. Tap ← to go back and pick them as they are.</div>'; return; }
    grid.innerHTML=looks.map(function(l){
      return '<div class="ava" data-id="'+escAttr(l.id)+'" onclick="pickFromLib(\''+esc1(name)+'\',\''+esc1(l.id)+'\')" style="cursor:pointer">'
        +faceImg(l.preview, (name||'?')[0])
        +'<div class="nm">'+escAttr(l.look||'Look')+'</div></div>';
    }).join('');
  });
}
function closeLooks(){
  __libGroup=''; __libName='';
  var b=document.getElementById('avaLibBrowse'), p=document.getElementById('avaLibLooks'), k=document.getElementById('avaLibBack');
  if(b) b.style.display='flex';
  if(p) p.style.display='none';
  if(k) k.style.display='none';
  var t=document.getElementById('avaLibTitle'); if(t) t.textContent='Avatar library';
  var s=document.getElementById('avaLibSub'); if(s) s.textContent="Tap a presenter to use it - it'll be added to your favourites so it's one tap next time. Tap ☆ to favourite without selecting, or tap the looks badge to see their other outfits and settings.";
}
function toggleFavLib(e,name){ if(e&&e.stopPropagation)e.stopPropagation(); var u=DB.user||{}; u.favorites=u.favorites||[]; var i=u.favorites.indexOf(name); if(i>=0)u.favorites.splice(i,1); else u.favorites.unshift(name); DB.user=u; document.getElementById('avaLibGrid').innerHTML=avaLibInner(); renderAvaGrid(); }
function pickFromLib(name,lookId){
  var u=DB.user||{}; u.favorites=u.favorites||[]; if(u.favorites.indexOf(name)<0) u.favorites.unshift(name); DB.user=u;
  closeAvaLib(); renderAvaGrid();
  var tile=document.querySelector('#avaPick .ava[data-id="'+lookId+'"]')||document.querySelector('#avaPick .ava[data-presenter="'+String(name).replace(/"/g,'')+'"]');
  if(tile){
    pickAva(tile);
    // If they chose a specific look rather than the presenter's default, point the tile at it.
    if(tile.dataset.id!==lookId){ tile.dataset.id=lookId; setTileLook(lookId); }
    tile.scrollIntoView({block:'nearest'});
  }
}
function renderAvaGrid(){ var el=document.getElementById('avaPick'); if(el) el.innerHTML=avaPickInner(); var lr=document.getElementById('lookRow'); if(lr) lr.innerHTML=''; }
function toggleFav(e,name){ if(e&&e.stopPropagation)e.stopPropagation(); var u=DB.user||{}; u.favorites=u.favorites||[]; var i=u.favorites.indexOf(name); if(i>=0)u.favorites.splice(i,1); else u.favorites.unshift(name); DB.user=u; renderAvaGrid(); }
// When a look is chosen from the dropdown, point the selected tile at that look id + preview.
function setTileLook(lookId){ var tile=document.querySelector('#avaPick .ava.sel'); if(!tile)return; tile.dataset.id=lookId; var lk=LOOK_BY_ID[lookId]; if(lk&&lk.preview){ var f=tile.querySelector('.face'); if(f){ f.style.backgroundImage="url('"+lk.preview+"')"; f.style.backgroundSize='cover'; f.style.backgroundPosition='center'; f.textContent=''; } } }
function noAvatarCell(){
  return `<div class="ava" data-id="none" onclick="pickAva(this)"><div class="face" style="background:rgba(124,92,255,.12);color:#cbbcff;font-size:20px">🎬</div><div class="nm">No avatar</div><div class="ava-badge" style="background:#262d38;color:var(--muted)">B-roll only</div></div>`;
}
function pickAva(el){
  document.querySelectorAll('#avaPick .ava').forEach(x=>x.classList.remove('sel'));
  el.classList.add('sel');
  const isNone = el.dataset.id==='none';
  // show a look chooser when this presenter has more than one look
  var lr=document.getElementById('lookRow');
  if(lr){
    lr.innerHTML='';
    var pname=el.dataset.presenter;
    if(pname && !isNone && el.dataset.id!=='twin'){
      var pres=(STOCK_AVATARS||[]).find(function(a){return a.name===pname;});
      var looks=(pres&&pres.looks)||[];
      var drawLooks=function(list){
        if(!list||list.length<2) return;
        lr.innerHTML='<label style="font-size:12px;color:var(--muted);display:block;margin:9px 0 5px">Look for '+pname+' <span style="color:var(--muted2)">('+list.length+' available)</span></label>'+
          '<select onchange="setTileLook(this.value)" style="font-size:12.5px;padding:7px 9px;max-width:240px">'+
          list.map(function(lk,i){ return '<option value="'+lk.id+'"'+(lk.id===el.dataset.id?' selected':'')+'>'+(lk.look||('Look '+(i+1)))+'</option>'; }).join('')+
          '</select>';
      };
      if(looks.length>1){ drawLooks(looks); }
      else if(pres && pres.group && (pres.looksCount||1)>1){
        // The catalogue only ships one look per presenter to stay small. Pull the rest the
        // moment this presenter is actually selected.
        loadPresenterLooks(pres.group, function(fetched){
          if(!fetched||!fetched.length) return;
          pres.looks=fetched;
          if(document.querySelector('#avaPick .ava.sel')===el) drawLooks(fetched);
        });
      }
    }
  }
  const note=document.getElementById('avaNote');
  if(note){
    if(isNone){
      note.innerHTML='🎬 <b>No avatar</b> - your script plays as a voiceover (in your cloned voice) with animated captions over <b>your own B-roll</b>. Upload your clips below; they\'re required for this mode.';
    } else if(el.dataset.id==='twin'){
      note.innerHTML='✨ <b>Your AI twin</b> is the most lifelike option - your real face and voice, indistinguishable from a real recording.';
    } else {
      note.innerHTML='This is a <b>studio presenter</b> - a great quick start. For the most lifelike, indistinguishable result, switch to <b>your own AI twin</b> (your real face &amp; voice).';
    }
  }
  // B-roll becomes mandatory + highlighted for no-avatar; avatar-position is irrelevant so hide it
  var brEl=document.getElementById('rkBroll'); if(brEl) brEl.style.outline=isNone?'1.5px solid var(--purple)':'';
  var brReq=document.getElementById('brollReq'); if(brReq) brReq.style.display=isNone?'block':'none';
  var posWrap=document.getElementById('posWrap'); if(posWrap) posWrap.style.display=isNone?'none':'';
}
function pickCap(el){ document.querySelectorAll('#capPick .cap').forEach(x=>x.classList.remove('sel')); el.classList.add('sel'); }

/* ---------- Thumbnail (optional, credit-based add-on for everyone) ---------- */
function thumbField(){
  const cardBase='border:1px solid var(--line);border-radius:12px;padding:13px 14px;transition:.12s;';
  const cur=thumbColor();
  const ba=userBrandAccent();
  const bk=brandKitGet();
  const colorRow = ba
    ? ('<div id="thumbColorWrap" style="margin-top:11px;opacity:.55">'+
        '<div style="font-size:12px;color:var(--muted)">✓ Using your <b style="color:#c8d0e2">Brand kit</b> colours'+
        ' <span style="display:inline-flex;gap:5px;vertical-align:middle;margin-left:5px">'+
          '<span style="width:16px;height:16px;border-radius:4px;background:'+bk.accentFrom+';box-shadow:0 0 0 1px var(--line)"></span>'+
          '<span style="width:16px;height:16px;border-radius:4px;background:'+bk.accentTo+';box-shadow:0 0 0 1px var(--line)"></span>'+
        '</span></div></div>')
    : ('<div id="thumbColorWrap" style="margin-top:11px;opacity:.55">'+
        '<div style="font-size:12px;color:var(--muted);margin-bottom:7px">Hook accent color <span style="color:var(--muted2)">- pick one (yellow gets the most clicks), or set up a <b>Brand kit</b> to use your own</span></div>'+
        '<div id="thumbColors" style="display:flex;gap:9px;flex-wrap:wrap">'+
        THUMB_COLORS.map(c=>'<span onclick="pickThumbColor(this,\''+c.hex+'\')" data-hex="'+c.hex+'" title="'+c.name+'" style="width:28px;height:28px;border-radius:8px;cursor:pointer;background:#'+c.hex+';box-shadow:0 0 0 1px var(--line);outline:'+(c.hex===cur?'2px solid #fff':'2px solid transparent')+';outline-offset:2px"></span>').join('')+
        '</div></div>');
  return '<div class="field"><label>Thumbnail <span style="color:var(--muted2);font-weight:500">(optional)</span></label>'+
    '<div id="thumbOpt" data-on="0" onclick="toggleThumb(this)" style="'+cardBase+'cursor:pointer">'+
    '<div style="display:flex;align-items:center;gap:11px">'+
    '<span id="thumbBox" style="width:20px;height:20px;border-radius:6px;border:1.5px solid var(--line);flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff"></span>'+
    '<div><div style="font-weight:700">Add a click-worthy thumbnail <span style="color:var(--purple)">'+TOKEN_THUMB+' credits</span></div>'+
    '<div style="color:var(--muted);font-size:12.5px;margin-top:2px">A scroll-stopping cover with your hook, proven to lift views. Optional on every plan - leave it off and there is no charge. No thumbnail? Your video posts with a free branded cover.</div></div></div></div>'+
    colorRow+'</div>';
}
function pickThumbColor(el,hex){ document.querySelectorAll('#thumbColors span').forEach(s=>s.style.outline='2px solid transparent'); el.style.outline='2px solid #fff'; const u=DB.user||{}; u.thumbColor=hex; DB.user=u; }
function toggleThumb(el){
  const on=el.dataset.on==='1'; el.dataset.on=on?'0':'1';
  const box=document.getElementById('thumbBox');
  const w=document.getElementById('thumbColorWrap'); if(w) w.style.opacity = on?'.55':'1';
  if(on){ el.style.borderColor='var(--line)'; el.style.background='transparent'; if(box){box.style.background='transparent';box.style.borderColor='var(--line)';box.textContent='';} }
  else { el.style.borderColor='var(--purple)'; el.style.background='rgba(155,107,224,.10)'; if(box){box.style.background='var(--grad)';box.style.borderColor='var(--purple)';box.textContent='✓';} }
}

/* ---------- AI Twin creation ---------- */
