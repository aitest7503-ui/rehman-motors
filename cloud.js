// Rehman Motors – Cloud Sync (Firebase Auth + Firestore). Local data (D) hi asli source hai.
const CFG = window.FIREBASE_CONFIG || {};
const READY = CFG.apiKey && !/PASTE_/.test(JSON.stringify(CFG));
const SK = KEY + "_sync";
const INAPP = !!window.Android;
let S; try { S = JSON.parse(localStorage.getItem(SK)) || {} } catch (e) { S = {} }
S.h = S.h || {}; S.p = S.p || {};           // h: id->hash (last known), p: pending "col/id"
const saveS = () => localStorage.setItem(SK, JSON.stringify(S));
const C = { ready: READY, user: null, gid: S.gid || null, state: READY ? "login nahi" : "off", err: "", busy: false };
let fb = null, unsubs = [], pushT = null;
const COLS = { jobs: "jobs", exp: "exp" };
const strip = o => { const x = { ...o }; delete x.updatedAt; delete x.deleted; return JSON.stringify(x) };
const rawSave = () => localStorage.setItem(KEY, JSON.stringify(D));

// Har save ke baad: kya badla dekho, updatedAt lagao, pending mein daalo
function mark() {
  const now = Date.now(), seen = {};
  for (const col of Object.keys(COLS)) for (const it of (D[col] || [])) {
    if (!it.id) it.id = col[0] + now + Math.random().toString(36).slice(2, 7);
    const k = col + "/" + it.id, hs = strip(it); seen[k] = 1;
    if (S.h[k] !== hs) { S.h[k] = hs; it.updatedAt = now; S.p[k] = 1 }
  }
  const st = JSON.stringify({ s: D.settings, seq: D.seq });
  if (S.h["meta/settings"] !== st) { S.h["meta/settings"] = st; D.settingsAt = now; S.p["meta/settings"] = 1 }
  for (const k of Object.keys(S.h)) if (k !== "meta/settings" && !seen[k]) { delete S.h[k]; S.p[k] = "del" } // mitaya gaya
  rawSave(); saveS(); upd(); schedule();
}
window.onDataSaved = () => { if (READY) mark() };

function schedule() { clearTimeout(pushT); pushT = setTimeout(push, 800) }
async function push() {
  if (!fb || !C.user || !C.gid || !navigator.onLine) { upd(); return }
  const { doc, writeBatch, deleteField } = fb.fs; const keys = Object.keys(S.p); if (!keys.length) { upd(); return }
  try {
    for (let i = 0; i < keys.length; i += 400) {
      const b = writeBatch(fb.db);
      for (const k of keys.slice(i, i + 400)) {
        const [col, id] = k.split("/"); const ref = doc(fb.db, "garages", C.gid, col, id);
        if (k === "meta/settings") b.set(ref, { settings: D.settings, seq: D.seq || 0, updatedAt: D.settingsAt || Date.now() });
        else if (S.p[k] === "del") b.set(ref, { id, deleted: true, updatedAt: Date.now() });
        else { const it = D[col].find(x => x.id === id); if (it) b.set(ref, JSON.parse(JSON.stringify(it))) }
      }
      await b.commit();
      keys.slice(i, i + 400).forEach(k => delete S.p[k]);
    }
    S.last = Date.now(); C.err = ""; saveS();
  } catch (e) { C.err = e.code || e.message }
  upd();
}

function applyRemote(col, snap) {
  let changed = false;
  snap.docChanges().forEach(ch => {
    if (ch.doc.metadata.hasPendingWrites) return;
    const r = ch.doc.data(), id = ch.doc.id, k = col + "/" + id;
    if (col === "meta") {
      if (id !== "settings") return;
      if (!S.p[k] && (r.updatedAt || 0) > (D.settingsAt || 0)) { D.settings = r.settings; D.settingsAt = r.updatedAt; changed = true }
      if ((r.seq || 0) > (D.seq || 0)) { D.seq = r.seq; changed = true }
      S.h[k] = JSON.stringify({ s: D.settings, seq: D.seq }); return;
    }
    const arr = D[col] = D[col] || []; const i = arr.findIndex(x => x.id === id); const loc = i >= 0 ? arr[i] : null;
    if (S.p[k] && loc && (loc.updatedAt || 0) >= (r.updatedAt || 0)) return; // local naya hai – wahi jeetega
    if (S.p[k] === "del") return;
    if (r.deleted) { if (loc && (loc.updatedAt || 0) <= r.updatedAt) { arr.splice(i, 1); delete S.h[k]; delete S.p[k]; changed = true } return }
    if (!loc || (r.updatedAt || 0) > (loc.updatedAt || 0)) { if (loc) arr[i] = r; else arr.push(r); S.h[k] = strip(r); delete S.p[k]; changed = true }
  });
  if (col === "jobs" && changed) { const mx = Math.max(0, ...D.jobs.map(j => parseInt(String(j.no || "").replace(/\D/g, "")) || 0)); if (mx > (D.seq || 0)) D.seq = mx; S.h["meta/settings"] = JSON.stringify({ s: D.settings, seq: D.seq }) }
  S.last = Date.now(); saveS();
  if (changed) { rawSave(); if (view !== "job") render() }
  upd();
}

function listen() {
  unsubs.forEach(u => u()); unsubs = [];
  const { collection, onSnapshot } = fb.fs;
  for (const col of ["jobs", "exp", "meta"]) unsubs.push(onSnapshot(collection(fb.db, "garages", C.gid, col), { includeMetadataChanges: false }, s => applyRemote(col, s), e => { C.err = e.code || e.message; upd() }));
}

async function afterLogin(u) {
  C.user = u; const { doc, getDoc, setDoc } = fb.fs;
  try {
    const us = await getDoc(doc(fb.db, "users", u.uid));
    if (us.exists() && us.data().garageId) C.gid = us.data().garageId;
    else if (S.gid && S.gidUid === u.uid) C.gid = S.gid;
    else C.gid = null;
    if (C.gid) start(true); else upd();   // pehle se bana garage: cloud ki settings hi chalengi
  } catch (e) { C.err = e.code || e.message; upd() }
}
function start(join) {
  S.gid = C.gid; S.gidUid = C.user.uid;
  const fresh = S.migrated !== C.gid;
  if (fresh) { S.h = {}; S.migrated = C.gid; }   // pehli baar: saara local data cloud pe (same id, duplicate nahi)
  saveS(); mark();
  if (join && fresh) { delete S.p["meta/settings"]; D.settingsAt = 0; rawSave(); saveS() }   // join karne wale ki settings garage ki settings ko na badlein
  listen(); push();
}
const code = () => { const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let s = "RM-"; crypto.getRandomValues(new Uint8Array(10)).forEach(n => s += a[n % a.length]); return s };
async function createGarage() {
  const { doc, setDoc } = fb.fs; const g = code();
  await setDoc(doc(fb.db, "garages", g), { owner: C.user.uid, name: D.settings.name || "Rehman Motors", members: { [C.user.uid]: true }, created: Date.now() });
  await setDoc(doc(fb.db, "users", C.user.uid), { garageId: g, email: C.user.email || "" });
  C.gid = g; start(false);
}
async function joinGarage(g) {
  const { doc, updateDoc, setDoc } = fb.fs;
  await updateDoc(doc(fb.db, "garages", g), { ["members." + C.user.uid]: true });
  await setDoc(doc(fb.db, "users", C.user.uid), { garageId: g, email: C.user.email || "" });
  C.gid = g; start(true);   // apna local data bhi us garage mein jud jayega
}

async function boot() {
  if (!READY || fb) return;
  try {
    const [app, auth, fs] = await Promise.all([import("./vendor/firebase-app.js"), import("./vendor/firebase-auth.js"), import("./vendor/firebase-firestore.js")]);
    const a = app.initializeApp(CFG);
    const au = INAPP ? auth.initializeAuth(a, { persistence: [auth.indexedDBLocalPersistence, auth.browserLocalPersistence] }) : auth.getAuth(a);
    let db; try { db = fs.initializeFirestore(a, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) }) } catch (e) { db = fs.getFirestore(a) }
    fb = { app: a, auth, au, fs, db };
    auth.onAuthStateChanged(au, u => { if (u) afterLogin(u); else { C.user = null; unsubs.forEach(x => x()); unsubs = []; upd() } });
    if (!INAPP) auth.getRedirectResult(au).catch(e => { C.err = e.code; upd() });
  } catch (e) { C.err = "Cloud load nahi hua (" + (e.message || e) + ")"; upd() }
}

function status() {
  if (!READY) return ["⚪", "Cloud sync abhi set nahi hai"];
  if (!fb) return ["⚪", C.err || "Cloud load ho raha hai..."];
  if (!C.user) return ["⚪", "Login nahi hai"];
  if (!C.gid) return ["🟡", "Garage chuno / banao"];
  if (!navigator.onLine) return ["🔴", "Offline – " + Object.keys(S.p).length + " badlav baaki (net aate hi jayenge)"];
  const n = Object.keys(S.p).length;
  return n ? ["🟡", "Pending – " + n + " badlav bhej rahe hain"] : ["🟢", "Synced ✔"];
}
function upd() { const e = document.getElementById("cs"); if (e) e.textContent = READY ? status()[0] : ""; const c = document.getElementById("cloudBox"); if (c) c.innerHTML = inner() }
const t = ms => ms ? new Date(ms).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "kabhi nahi";
function inner() {
  const [ic, tx] = status();
  let h = `<div class="tot"><b>${ic} ${esc(tx)}</b></div>`;
  if (!READY) return h + `<div class="muted">Abhi data sirf is phone mein hai. Firebase set hone ke baad yahan login aayega.</div>`;
  if (C.err) h += `<div class="warn">Galti: ${esc(C.err)}</div>`;
  if (!fb) return h;
  if (!C.user) return h + `${INAPP ? "" : `<button class="btn" onclick="cloud.google()">Google se login karo</button>`}
<label>Email</label><input id="c_em" type="email" autocomplete="username"><label>Password (kam se kam 6 akshar)</label><input id="c_pw" type="password" autocomplete="current-password">
<div class="row"><div><button class="btn g" onclick="cloud.email(false)">Login</button></div><div><button class="btn w" onclick="cloud.email(true)">Naya account</button></div></div>
<button class="btn s w" onclick="cloud.reset()">Password bhool gaye?</button>${INAPP ? `<div class="muted">App mein Google login kaam nahi karta, isliye email/password se login karo.</div>` : ""}`;
  h += `<div class="muted">Login: ${esc(C.user.email || C.user.uid)}</div>`;
  if (!C.gid) return h + `<button class="btn" onclick="cloud.create()">🏠 Naya garage banao (pehli baar)</button>
<label>Ya invite code daalo (bhai/mama ke liye)</label><input id="c_code" placeholder="RM-XXXXXXXXXX"><button class="btn g" onclick="cloud.join()">Garage join karo</button>
<button class="btn w" onclick="cloud.logout()">Logout</button>`;
  return h + `<div class="muted">Aakhri sync: ${t(S.last)}</div><div class="muted">Invite code (bhai/mama ko bhejo): <b>${esc(C.gid)}</b></div>
<button class="btn g" onclick="cloud.now()">🔄 Abhi sync karo</button><button class="btn w" onclick="cloud.logout()">Logout</button>`;
}
window.cloudCard = () => `<div class="card"><h2>☁️ Cloud Sync</h2><div id="cloudBox">${inner()}</div></div>`;
const busy = async f => { C.err = ""; try { await f() } catch (e) { C.err = e.code || e.message } upd() };
window.cloud = {
  google: () => busy(async () => { const p = new fb.auth.GoogleAuthProvider(); try { await fb.auth.signInWithPopup(fb.au, p) } catch (e) { if (/popup/.test(e.code || "")) await fb.auth.signInWithRedirect(fb.au, p); else throw e } }),
  email: nw => busy(async () => { const em = $("#c_em").value.trim(), pw = $("#c_pw").value; if (!em || pw.length < 6) throw { message: "Email aur 6+ akshar ka password likho" }; await (nw ? fb.auth.createUserWithEmailAndPassword : fb.auth.signInWithEmailAndPassword)(fb.au, em, pw) }),
  reset: () => busy(async () => { const em = $("#c_em").value.trim(); if (!em) throw { message: "Pehle email likho" }; await fb.auth.sendPasswordResetEmail(fb.au, em); alert("Password reset ka email bhej diya") }),
  create: () => busy(createGarage),
  join: () => busy(async () => { const g = $("#c_code").value.trim().toUpperCase(); if (!/^RM-[A-Z0-9]{10}$/.test(g)) throw { message: "Code sahi nahi hai" }; await joinGarage(g) }),
  logout: () => busy(async () => { if (Object.keys(S.p).length && !confirm("Kuch badlav abhi cloud pe nahi gaye. Phir bhi logout?")) return; await fb.auth.signOut(fb.au); C.gid = null }),
  now: () => busy(async () => { if (!navigator.onLine) throw { message: "Internet nahi hai" }; mark(); await push(); if (!C.err) alert("Sync ho gaya ✔") }),
  state: () => ({ ready: READY, user: !!C.user, gid: C.gid, pending: Object.keys(S.p).length, status: status()[1] })
};
addEventListener("online", () => { boot(); push() }); addEventListener("offline", upd);
upd(); boot();
