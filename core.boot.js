/* Aligned app module: core.boot.js (split from live; load order matters) */
(function boot(){
  // Partner referral: if the visitor arrived via ?ref=CODE, remember it so it survives the whole signup flow.
  try{ var _rm=(location.search||'').match(/[?&]ref=([^&]+)/); if(_rm){ var _rc=decodeURIComponent(_rm[1]||'').trim().toLowerCase().replace(/[^a-z0-9]/g,''); if(_rc){ localStorage.setItem('aws_ref', _rc); } } }catch(_){}
  if(checkTwinRec()) return;      // ?twinrec=TOKEN: open the phone record screen directly (no login needed)
  renderAuthDemo();
  if(checkMagicLink()) return;   // a magic link is being processed - it'll log in on success
  // Cross-site: if the homepage (or another tab) switched the active account, follow it here.
  try{ var _hub=hubGet(); if(_hub&&_hub.cur&&_hub.cur.email){ var _ce=(_hub.cur.email||'').toLowerCase(); var _mine=(DB.user&&DB.user.email||'').toLowerCase(); if(_ce && _ce!==_mine && getAccounts().some(function(a){return (a.email||'').toLowerCase()===_ce;})){ switchAccount(_hub.cur.email); return; } } }catch(_){}
  if(DB.user){
    if(tokenGet()){ enterApp(); }
    else { requireRelogin('Welcome back - please log in once to secure your account.'); }
  } else {
    // Signed out of the active account but other client accounts are remembered: load the first one.
    var accs=getAccounts(); if(accs && accs.length){ switchAccount(accs[0].email); }
  }
})();
