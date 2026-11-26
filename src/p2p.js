/* Between Us — standalone network: phones talk directly (WebRTC via PeerJS), no account, no server storage.
   Provides the same small `room` API the app uses inside Claude, so the game code stays the same.
   The first phone in a room takes the room's hub id; the other connects to it. Every few seconds both re-send
   their state, so the partner's status and answers stay fresh. */
(function () {
  window.BU_STANDALONE = true;
  const BEAT = 5000, STALE = 20000;
  const st = {peer: null, hubId: '', hub: false, conns: new Map(), me: {}, myU: 0, others: new Map(), subs: new Set(), errs: new Set(), name: '', retry: 0, beat: 0, alive: false};
  const now = () => Date.now();
  function peersList() {
    const out = [{peer: st.peer ? st.peer.id : 'me', isMe: true, presence: {...st.me}, updatedAt: st.myU || now()}];
    st.others.forEach((v, id) => out.push({peer: id, isMe: false, presence: v.p, updatedAt: v.u}));
    return out;
  }
  let emitT = 0;
  function emit() { clearTimeout(emitT); emitT = setTimeout(() => { const ch = {peers: peersList()}; st.subs.forEach(f => { try { f(ch); } catch (e) { console.error(e); } }); }, 30); }
  function send(conn, msg) { try { if (conn.open) conn.send(msg); } catch (e) {} }
  function broadcast(msg, except) { st.conns.forEach((c, id) => { if (id !== except) send(c, msg); }); }
  function myMsg() { return {t: 'p', id: st.peer && st.peer.id, p: st.me, u: st.myU}; }
  function onData(conn, d) {
    if (!d || typeof d !== 'object') return;
    if (d.t === 'p' && typeof d.id === 'string' && d.p && typeof d.p === 'object') {
      if (st.peer && d.id === st.peer.id) return;
      st.others.set(d.id, {p: d.p, u: now(), via: conn.peer});
      if (st.hub) broadcast(d, conn.peer);
      emit();
    } else if (d.t === 'gone' && typeof d.id === 'string') { st.others.delete(d.id); emit(); }
    else if (d.t === 'all' && Array.isArray(d.list)) { d.list.forEach(x => { if (x && x.id && x.p && (!st.peer || x.id !== st.peer.id)) st.others.set(x.id, {p: x.p, u: now(), via: conn.peer}); }); emit(); }
  }
  function wire(conn) {
    conn.on('open', () => {
      st.conns.set(conn.peer, conn); send(conn, myMsg());
      if (st.hub) { const list = []; st.others.forEach((v, id) => { if (id !== conn.peer) list.push({id, p: v.p}); }); if (list.length) send(conn, {t: 'all', list}); }
      emit();
    });
    conn.on('data', d => onData(conn, d));
    const drop = () => {
      st.conns.delete(conn.peer);
      [...st.others.entries()].forEach(([id, v]) => { if (v.via === conn.peer) { st.others.delete(id); if (st.hub) broadcast({t: 'gone', id}); } });
      emit(); if (!st.hub && st.alive) schedule();
    };
    conn.on('close', drop); conn.on('error', drop);
  }
  function opts() { return Object.assign({debug: 0}, window.BU_PEER_OPTS || {}); }
  function schedule(ms = 3000) { clearTimeout(st.retry); st.retry = setTimeout(() => st.alive && connect(), ms); }
  function connect() {
    if (!st.alive) return;
    if (st.peer && !st.peer.destroyed && !st.hub && st.peer.open) { // guest: (re)dial the hub
      if ([...st.conns.keys()].includes(st.hubId)) return;
      const c = st.peer.connect(st.hubId, {reliable: true, serialization: 'json'}); wire(c); return;
    }
    if (st.peer) { try { st.peer.destroy(); } catch (e) {} st.peer = null; }
    const P = window.Peer; if (!P) { st.errs.forEach(f => f(new Error('no peerjs'))); return; }
    // try to be the hub; if someone already is, join as guest
    const hp = new P(st.hubId, opts()); st.peer = hp;
    hp.on('open', () => { st.hub = true; emit(); });
    hp.on('connection', c => { c.on('open', () => {}); wire(c); });
    hp.on('disconnected', () => { if (st.alive && !hp.destroyed) setTimeout(() => { try { hp.reconnect(); } catch (e) {} }, 1500); });
    hp.on('error', e => {
      if (e && e.type === 'unavailable-id') {
        try { hp.destroy(); } catch (x) {}
        const gp = new P(opts()); st.peer = gp; st.hub = false;
        gp.on('open', () => { connect(); });
        gp.on('connection', c => wire(c));
        gp.on('disconnected', () => { if (st.alive && !gp.destroyed) setTimeout(() => { try { gp.reconnect(); } catch (x) {} }, 1500); });
        gp.on('error', e2 => { if (e2 && e2.type === 'peer-unavailable') { try { gp.destroy(); } catch (x) {} st.peer = null; schedule(1500); } else if (e2 && ['network', 'server-error', 'socket-error', 'socket-closed'].includes(e2.type)) { schedule(5000); } });
      } else if (e && ['network', 'server-error', 'socket-error', 'socket-closed', 'browser-incompatible'].includes(e.type)) { st.errs.forEach(f => f(e)); schedule(6000); }
    });
  }
  function heartbeat() {
    clearInterval(st.beat);
    st.beat = setInterval(() => {
      if (!st.alive) return;
      st.myU = now(); broadcast(myMsg());
      let ch = false; st.others.forEach((v, id) => { if (now() - v.u > STALE) { st.others.delete(id); ch = true; } });
      if (ch) emit();
      if (!st.peer || st.peer.destroyed) connect(); else if (!st.hub && !st.conns.size) connect();
      if (typeof window.buTick === 'function') try { window.buTick(); } catch (e) {}
    }, BEAT);
  }
  const named = {
    presence(obj) {
      Object.entries(obj || {}).forEach(([k, v]) => { if (v === null || v === undefined) delete st.me[k]; else st.me[k] = v; });
      st.myU = now(); broadcast(myMsg()); emit(); return Promise.resolve();
    },
    onPeers(f, onErr) { st.subs.add(f); if (onErr) st.errs.add(onErr); emit(); return () => { st.subs.delete(f); if (onErr) st.errs.delete(onErr); }; },
    peers() { return peersList(); },
    leave() {
      st.alive = false; clearInterval(st.beat); clearTimeout(st.retry);
      broadcast({t: 'gone', id: st.peer && st.peer.id});
      const old = st.peer; st.peer = null; st.conns.clear(); st.others.clear(); st.hub = false; emit(); setTimeout(() => { try { old && old.destroy(); } catch (e) {} }, 150);
      return Promise.resolve();
    },
    get hub() { return st.hub; }, get connected() { return st.conns.size > 0; }
  };
  const room = {
    async join(name) {
      if (st.alive && st.name === name) return named;
      if (st.alive) await named.leave();
      st.name = name; st.hubId = 'betweenus-' + String(name).replace(/[^a-z0-9-]/gi, '') + '-hub'; st.alive = true; st.others.clear();
      connect(); heartbeat(); return named;
    },
    presence: o => named.presence(o), onPeers: (f, e) => named.onPeers(f, e), peers: () => named.peers()
  };
  window.addEventListener('pagehide', () => { if (st.alive) broadcast({t: 'gone', id: st.peer && st.peer.id}); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && st.alive) { st.myU = now(); broadcast(myMsg()); if (!st.peer || st.peer.destroyed || st.peer.disconnected) connect(); } });
  window.claude = {use: async n => (n === 'room' ? room : null)};
  window.BU_NET = st;
})();
