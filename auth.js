/* ============================================================
   Mudrapuri — credential store
   ------------------------------------------------------------
   The GitHub login (token, repo, user) lives here, in its own
   browser-storage key, deliberately apart from the expenses.

   Two consequences, both intended:
     - signing out clears the login and leaves your data alone
     - clearing app data / a corrupt state blob cannot take the
       login with it, and vice versa

   This file is public code on GitHub Pages. It stores nothing
   itself and holds no secret: the token is only ever written to
   this device's localStorage by the user's own action. Never
   commit a token into this file.
   ============================================================ */
(function(){
  'use strict';

  var KEY = 'mudrapuri.auth';

  function uuid(){
    try{ if(window.crypto && crypto.randomUUID) return crypto.randomUUID(); }catch(e){}
    var b = new Uint8Array(16), i;
    try{ crypto.getRandomValues(b); }
    catch(e){ for(i=0;i<16;i++) b[i] = Math.floor(Math.random()*256); }
    b[6] = (b[6] & 0x0f) | 0x40;            /* version 4 */
    b[8] = (b[8] & 0x3f) | 0x80;            /* variant   */
    var h = [];
    for(i=0;i<16;i++) h.push((b[i]+0x100).toString(16).slice(1));
    return h.slice(0,4).join('') + '-' + h.slice(4,6).join('') + '-' + h.slice(6,8).join('') +
           '-' + h.slice(8,10).join('') + '-' + h.slice(10,16).join('');
  }

  function load(){
    try{
      var raw = localStorage.getItem(KEY);
      if(!raw) return null;
      var rec = JSON.parse(raw);
      return (rec && rec.v === 1) ? rec : null;
    }catch(e){ return null; }
  }

  function store(rec){
    try{ localStorage.setItem(KEY, JSON.stringify(rec)); return true; }
    catch(e){ return false; }               /* storage blocked: session still works in memory */
  }

  /* Called once per successful sign-in. A new sessionId is minted every
     time, so a login can be told apart from the one before it. */
  function save(cfg){
    cfg = cfg || {};
    var prev = load() || {};
    var rec = {
      v: 1,
      token: cfg.token || '',
      repo: cfg.repo || '',
      user: cfg.user || '',
      path: cfg.path || 'data/',
      branch: cfg.branch || 'main',
      sessionId: uuid(),
      createdAt: Date.now(),
      lastSync: (cfg.lastSync !== undefined ? cfg.lastSync : prev.lastSync) || null,
      localSig: (cfg.localSig !== undefined ? cfg.localSig : prev.localSig) || null,
      allowEmpty: cfg.allowEmpty === true
    };
    store(rec);
    return rec;
  }

  /* Updates bookkeeping fields (lastSync, localSig, branch…) without
     touching the token or minting a new session id. */
  function touch(patch){
    var rec = load();
    if(!rec) return null;
    if(patch) for(var k in patch){ if(Object.prototype.hasOwnProperty.call(patch, k)) rec[k] = patch[k]; }
    store(rec);
    return rec;
  }

  function clear(){
    try{ localStorage.removeItem(KEY); }catch(e){}
    return true;
  }

  function session(){
    var rec = load();
    return (rec && rec.sessionId) ? rec.sessionId : null;
  }

  window.MudrapuriAuth = {
    KEY: KEY,
    load: load,
    save: save,
    touch: touch,
    clear: clear,
    session: session,
    uuid: uuid
  };
})();
