/* Rehman Motors – Customers tab, Camp mode, Offer bhejo, Bill image */
const p10 = p => { let d = String(p || "").replace(/\D/g, ""); if (d.length > 10) d = d.slice(-10); return d };
if (!Array.isArray(D.cust)) D.cust = [];
// Job cards se saare customers apne aap (mobile se ek hi record)
function syncCustFromJobs() {
  if (!Array.isArray(D.cust)) D.cust = [];
  const by = {}; D.cust.forEach(c => by[c.id] = c); let ch = false;
  D.jobs.forEach(j => {
    const ph = p10(j.cust && j.cust.phone); if (ph.length !== 10) return;
    const id = "c" + ph; let c = by[id];
    if (!c) { c = by[id] = { id, phone: ph, name: j.cust.name || "", gaon: j.cust.gaon || "", address: "", bikes: [], note: "", source: "garage", createdAt: j.date || today() }; D.cust.push(c); ch = true }
    if (!c.name && j.cust.name) { c.name = j.cust.name; ch = true }
    if (!c.gaon && j.cust.gaon) { c.gaon = j.cust.gaon; ch = true }
    const bn = (j.bike.number || "").toUpperCase(); c.bikes = c.bikes || [];
    if ((bn || j.bike.model) && !c.bikes.some(b => (b.number || "") === bn && (bn || b.model === j.bike.model))) { c.bikes.push({ model: j.bike.model || "", number: bn }); ch = true }
  });
  return ch;
}
function custStats(c) { const js = D.jobs.filter(j => p10(j.cust.phone) === c.phone); return { n: js.length, last: js.reduce((a, j) => j.date > a ? j.date : a, ""), spent: js.reduce((a, j) => a + tot(j).total, 0), js } }
const bikeTxt = c => (c.bikes || []).map(b => [b.model, b.number].filter(Boolean).join(" ")).join(", ");

let cq = "", csort = "name", custSel = null;
function custView() {
  if (syncCustFromJobs()) save();
  const m = today().slice(0, 7), all = D.cust;
  const q = cq.trim().toUpperCase().replace(/\s/g, "");
  let l = all.filter(c => !q || [c.name, c.phone, c.gaon, c.address, bikeTxt(c), c.campPlace].join(" ").toUpperCase().replace(/\s/g, "").includes(q));
  const st = Object.fromEntries(l.map(c => [c.id, custStats(c)]));
  l.sort(csort === "name" ? (a, b) => (a.name || "~").localeCompare(b.name || "~") : (a, b) => ((b.createdAt || "") + b.id).localeCompare((a.createdAt || "") + a.id));
  return `<div class="stats"><div class="stat" style="grid-column:span 2;text-align:center"><b style="font-size:34px">${all.length}</b><span>Kul customer</span></div>
<div class="stat"><b>${all.filter(c => (c.createdAt || "").startsWith(m)).length}</b><span>Is mahine naye</span></div><div class="stat"><b>${all.filter(c => c.source === "camp").length}</b><span>Camp se</span></div></div>
<div class="row"><button class="btn" onclick="go('camp')">⛺ Camp mode</button><button class="btn g" onclick="go('offer')">📢 Offer bhejo</button></div>
<div class="row"><button class="btn w" onclick="custSel=null;go('custEdit')">➕ Naya customer</button><button class="btn w" onclick="custCsv()">⬇️ CSV export</button></div>
<div class="card" style="margin-top:12px"><input id="cq" placeholder="🔍 Naam, mobile, gaon, bike no." value="${esc(cq)}" oninput="cq=this.value;render();const e=document.getElementById('cq');e.focus();e.setSelectionRange(e.value.length,e.value.length)">
<div style="margin-top:6px"><button class="btn s ${csort === "name" ? "" : "w"}" onclick="csort='name';render()">A-Z naam</button><button class="btn s ${csort === "new" ? "" : "w"}" onclick="csort='new';render()">Naye pehle</button> <span class="muted">${l.length} dikh rahe</span></div>
${l.slice(0, 300).map(c => { const s = st[c.id]; return `<div class="item" onclick="custSel='${c.id}';go('custEdit')"><b>${esc(c.name || "(naam nahi)")}</b> · ${esc(c.phone)}${c.source === "camp" ? ' <span class="pill">⛺ camp</span>' : ""}
<div class="muted">${esc([c.gaon, c.address].filter(Boolean).join(", ") || "-")} · ${esc(bikeTxt(c) || "bike -")}</div><div class="muted">Aakhri visit: ${s.last ? fd(s.last) : "-"} · Kul kharch: ${rs(s.spent)}</div></div>` }).join("") || '<div class="muted" style="margin-top:10px">Koi customer nahi mila.</div>'}
${l.length > 300 ? `<div class="muted">Pehle 300 dikh rahe hain, search se dhundo.</div>` : ""}</div>`;
}
function custEdit() {
  const c = D.cust.find(x => x.id === custSel) || { id: "", phone: "", name: "", gaon: "", address: "", bikes: [{ model: "", number: "" }], note: "" };
  const s = c.id ? custStats(c) : { js: [] }, b = (c.bikes && c.bikes[0]) || {};
  const wl = c.phone ? waLink(c.phone, `Namaste ${c.name || ""} ji,\n${D.settings.name} – ${D.settings.tagline}`) : "";
  return `<div class="card"><h2>${c.id ? "👤 Customer" : "➕ Naya customer"}</h2>
<label>Mobile *</label><input id="ce_ph" type="tel" inputmode="numeric" value="${esc(c.phone)}" ${c.id ? "readonly" : ""}>
<label>Naam</label><input id="ce_name" value="${esc(c.name)}"><label>Gaon / Area</label><input id="ce_gaon" value="${esc(c.gaon)}">
<label>Pura pata</label><input id="ce_addr" value="${esc(c.address)}">
<div class="row"><div><label>Bike model</label><input id="ce_model" value="${esc(b.model || "")}"></div><div><label>Bike no.</label><input id="ce_num" value="${esc(b.number || "")}"></div></div>
${(c.bikes || []).length > 1 ? `<div class="muted">Aur bikes: ${esc(c.bikes.slice(1).map(x => [x.model, x.number].filter(Boolean).join(" ")).join(", "))}</div>` : ""}
<label>Note</label><textarea id="ce_note">${esc(c.note)}</textarea>
${c.source === "camp" ? `<div class="muted">⛺ Camp: ${esc(c.campPlace || "")} · ${fd(c.campDate)}</div>` : ""}
<button class="btn" onclick="custSave()">Save karo</button>
${c.id ? `<div class="row"><a class="btn g" href="tel:${esc(c.phone)}">📞 Call</a>${wl ? `<a class="btn g" href="${wl}" target="_blank" rel="noopener">📲 WhatsApp</a>` : ""}</div>` : ""}
<button class="btn w" onclick="go('cust')">⬅️ Wapas</button></div>
${c.id ? `<div class="card"><h2>Job history (${s.js.length})</h2>${s.js.length ? s.js.slice().reverse().map(jobRow).join("") : '<div class="muted">Abhi koi job nahi.</div>'}
${!s.js.length ? `<button class="btn w s" onclick="custDel('${c.id}')">🗑️ Customer mitao</button>` : ""}</div>` : ""}`;
}
function custSave() {
  const ph = p10($("#ce_ph").value); if (ph.length !== 10) { alert("Sahi 10 digit mobile number likho"); return }
  let c = D.cust.find(x => x.id === custSel);
  if (!c) { if (D.cust.some(x => x.phone === ph)) { if (!confirm("Ye number pehle se hai. Usi ko update karein?")) return; c = D.cust.find(x => x.phone === ph) } else { c = { id: "c" + ph, phone: ph, bikes: [], source: "manual", createdAt: today() }; D.cust.push(c) } }
  c.name = $("#ce_name").value.trim(); c.gaon = $("#ce_gaon").value.trim(); c.address = $("#ce_addr").value.trim(); c.note = $("#ce_note").value.trim();
  const bk = { model: $("#ce_model").value.trim(), number: $("#ce_num").value.trim().toUpperCase() }; c.bikes = c.bikes || [];
  if (bk.model || bk.number) c.bikes[0] = bk;
  custSel = c.id; save(); alert("Save ho gaya ✔"); render();
}
function custDel(id) { if (confirm("Pakka mitana hai?")) { D.cust = D.cust.filter(c => c.id !== id); save(); go("cust") } }

/* CAMP MODE */
let campPlace = sessionStorage.getItem("rmCampPlace") || "", campDate = today(), campN = 0;
function campView() {
  if (!campPlace) return `<div class="card"><h2>⛺ Camp mode</h2><div class="muted">Bazaar/mele mein jaldi-jaldi customer likhne ke liye. Internet ki zaroorat nahi, baad mein sync ho jayega.</div>
<label>Camp ki jagah</label><input id="cp_place" placeholder="Jaise: Devipur bazaar"><label>Date</label><input id="cp_date" type="date" value="${campDate}">
<button class="btn" onclick="const p=$('#cp_place').value.trim();if(!p){alert('Jagah likho');return}campPlace=p;campDate=$('#cp_date').value||today();sessionStorage.setItem('rmCampPlace',p);render()">Camp shuru karo</button><button class="btn w" onclick="go('cust')">⬅️ Wapas</button></div>`;
  const tc = D.cust.filter(c => c.source === "camp" && c.campDate === campDate && c.campPlace === campPlace).length;
  return `<div class="card"><h2>⛺ ${esc(campPlace)} · ${fd(campDate)}</h2><div class="tot"><b style="font-size:22px;color:#1f9d55">Aaj is camp mein: <span id="cp_cnt">${tc}</span></b></div>
<label>Mobile * (10 digit)</label><input id="cp_ph" type="tel" inputmode="numeric" maxlength="14" autofocus oninput="campChk()"><div id="cp_hint" class="muted"></div>
<label>Naam</label><input id="cp_name"><label>Gaon / Pata</label><input id="cp_gaon">
<div class="row"><div><label>Bike model</label><input id="cp_model"></div><div><label>Bike no.</label><input id="cp_num"></div></div>
<label>Note</label><input id="cp_note">
<button class="btn g" onclick="campSave()">✔ Save & agla</button>
<button class="btn w" onclick="campPlace='';sessionStorage.removeItem('rmCampPlace');go('cust')">Camp band karo</button></div>`;
}
function campChk() { const ph = p10($("#cp_ph").value), e = $("#cp_hint"), c = D.cust.find(x => x.phone === ph);
  e.innerHTML = ph.length === 10 ? (c ? `<b style="color:#C62828">⚠️ Ye number pehle se hai: ${esc(c.name || "")} ${esc(c.gaon || "")}</b>` : "✔ Naya number") : (ph.length ? `${ph.length}/10 digit` : "") }
function campSave() {
  const ph = p10($("#cp_ph").value); if (ph.length !== 10 || !/^[6-9]/.test(ph)) { alert("Sahi 10 digit mobile number likho"); $("#cp_ph").focus(); return }
  let c = D.cust.find(x => x.phone === ph);
  if (c && !confirm(`Ye number pehle se hai (${c.name || "bina naam"}). Details update karein?`)) return;
  const v = k => $("#cp_" + k).value.trim();
  if (!c) { c = { id: "c" + ph, phone: ph, name: "", gaon: "", address: "", bikes: [], note: "", source: "camp", campDate, campPlace, createdAt: campDate }; D.cust.push(c) }
  if (v("name")) c.name = v("name"); if (v("gaon")) c.gaon = v("gaon"); if (v("note")) c.note = [c.note, v("note")].filter(Boolean).join("; ");
  const bk = { model: v("model"), number: v("num").toUpperCase() }; c.bikes = c.bikes || [];
  if ((bk.model || bk.number) && !c.bikes.some(b => b.number === bk.number && b.model === bk.model)) c.bikes.push(bk);
  save(); render(); setTimeout(() => { const e = $("#cp_ph"); e && e.focus(); const h = $("#cp_hint"); if (h) h.innerHTML = `<b style="color:#1f9d55">✔ Save hua: ${esc(c.name || ph)}</b>` }, 30);
}

/* OFFER BHEJO */
const TPL = [
  "Namaste {naam} ji! 🙏\n{garage} mein is hafte General Service par special offer. Aaj hi aaiye!\n{phone}",
  "Namaste {naam} ji,\nAapki bike ki service ka time ho gaya hoga. {garage} mein aaiye, achhi service, sahi rate.\n{phone}",
  "🪔 Tyohar offer! {garage} mein Wash + Polish par chhoot. Offer sirf kuch din ke liye.\n{phone}"];
let ofF = { gaon: "", camp: "" }, ofMsg = localStorage.getItem("rmOfferMsg") || TPL[0], ofPick = null;
function ofList() { return D.cust.filter(c => (!ofF.gaon || (c.gaon || "") === ofF.gaon) && (!ofF.camp || (c.campPlace || "") === ofF.camp)) }
const ofText = c => ofMsg.replace(/\{naam\}/g, c.name || "").replace(/\{garage\}/g, D.settings.name).replace(/\{phone\}/g, D.settings.phone ? "📞 " + D.settings.phone : "").replace(/ +ji/, " ji");
function offerView() {
  if (syncCustFromJobs()) save();
  const gaons = [...new Set(D.cust.map(c => c.gaon).filter(Boolean))].sort(), camps = [...new Set(D.cust.map(c => c.campPlace).filter(Boolean))].sort();
  const l = ofList(); if (!ofPick) ofPick = {}; const sel = l.filter(c => ofPick[c.id] !== false);
  const key = "o" + ofMsg.length + ofMsg.slice(0, 20); const sent = sel.filter(c => c.offers && c.offers[key]).length;
  const next = sel.find(c => !(c.offers && c.offers[key]));
  return `<div class="card"><h2>📢 Offer bhejo</h2><div class="warn">Ek saath sabko apne-aap message bhejna WhatsApp ke paid API ke bina possible nahi. Yahan har tap pe agle customer ka WhatsApp khulega, message bhara hoga, aapko bas Send dabana hai.</div>
<label>Message (naam ke liye {naam})</label><textarea id="of_msg" style="min-height:110px" onchange="ofMsg=this.value;localStorage.setItem('rmOfferMsg',ofMsg);render()">${esc(ofMsg)}</textarea>
<div>${TPL.map((t, i) => `<button class="btn s w" onclick="ofMsg=TPL[${i}];localStorage.setItem('rmOfferMsg',ofMsg);render()">Template ${i + 1}</button>`).join("")}</div>
<div class="row"><div><label>Gaon</label><select onchange="ofF.gaon=this.value;render()"><option value="">Sab</option>${gaons.map(g => `<option ${g === ofF.gaon ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></div>
<div><label>Camp</label><select onchange="ofF.camp=this.value;render()"><option value="">Sab</option>${camps.map(g => `<option ${g === ofF.camp ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></div></div>
<div class="tot" style="margin-top:10px"><b>Bheje: ${sent} / ${sel.length}</b></div>
${next ? `<a class="btn g" href="${waLink(next.phone, ofText(next))}" target="_blank" rel="noopener" onclick="ofSent('${next.id}','${key}')">📲 Agla bhejo: ${esc(next.name || next.phone)}</a>` : sel.length ? `<div class="muted">✔ Sabko bhej diya!</div>` : ""}
<button class="btn s w" onclick="ofReset('${key}')">↺ Dobara shuru</button>
<h3>Customer chuno</h3><button class="btn s w" onclick="ofPick={};render()">Sab chuno</button><button class="btn s w" onclick="ofPick=Object.fromEntries(ofList().map(c=>[c.id,false]));render()">Koi nahi</button>
${l.map(c => `<div class="chk"><input type="checkbox" ${ofPick[c.id] !== false ? "checked" : ""} onchange="ofPick['${c.id}']=this.checked;render()"><span>${esc(c.name || "-")} · ${esc(c.phone)}<br><small class="muted">${esc(c.gaon || "")}</small></span>${c.offers && c.offers[key] ? "✔" : ""}</div>`).join("")}
<button class="btn w" onclick="go('cust')">⬅️ Wapas</button></div>`;
}
function ofSent(id, key) { const c = D.cust.find(x => x.id === id); c.offers = c.offers || {}; c.offers[key] = today(); save(); setTimeout(render, 400) }
function ofReset(key) { if (!confirm("Sabka 'bheja' mark hata dein?")) return; D.cust.forEach(c => { if (c.offers && c.offers[key]) delete c.offers[key] }); save(); render() }
function custCsv() {
  if (syncCustFromJobs()) save(); const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const h = ["phone", "fn", "ct", "country", "Naam", "Mobile", "Gaon", "Pata", "Bike", "Source", "Camp", "Camp date", "Aakhri visit", "Kul kharch"];
  const r = D.cust.map(c => { const s = custStats(c); return ["+91" + c.phone, c.name, c.gaon, "IN", c.name, c.phone, c.gaon, c.address, bikeTxt(c), c.source, c.campPlace, c.campDate, s.last, s.spent] });
  dl(`rehman-motors-customers-${today()}.csv`, "\ufeff" + [h, ...r].map(x => x.map(q).join(",")).join("\n"), "text/csv");
}

/* BILL IMAGE (canvas) – Design A "Bold Red Premium" */
const RM_LOGO = new Image(); RM_LOGO.src = "icons/logo-full-badge.png";
function billCanvas(j) {
  const s = D.settings, t = tot(j), S = 2, W = 800, P = 36;
  const T = { ink: "#222", sub: "#666", card: "#FFF5F5", line: "#F3D0D0", zebra: "#FFF8F8", acc: "#C62828" };
  const c = document.createElement("canvas"); const items = [];
  j.works.forEach(w => items.push([w.name, 1, num(w.rate)])); if (num(j.labourExtra)) items.push(["Extra labour", 1, num(j.labourExtra)]);
  j.parts.forEach(p => items.push([p.name || "Part", num(p.qty) || 1, num(p.price)]));
  const n = items.length, MAXH = 900 + n * 48 + 400; c.width = W * S; c.height = MAXH * S;
  const x = c.getContext("2d"); x.scale(S, S);
  const FN = '"Noto Sans", "Noto Sans Devanagari", Roboto, Arial, sans-serif';
  const F = (sz, w) => x.font = `${w || 400} ${sz}px ${FN}`;
  const txt = (v, X, Y, al, col) => { if (col) x.fillStyle = col; x.textAlign = al || "left"; x.fillText(v, X, Y) };
  const fit = (v, w) => { v = String(v ?? ""); if (x.measureText(v).width <= w) return v; while (v.length > 1 && x.measureText(v + "…").width > w) v = v.slice(0, -1); return v + "…" };
  const rr = (X, Y, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h) };
  const grad = (y0, y1, a, b) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g };
  x.fillStyle = "#fff"; x.fillRect(0, 0, W, MAXH);
  // header
  const contact = [s.phone && "📞 " + s.phone, s.address && "📍 " + s.address].filter(Boolean).join("   ·   ");
  const HH = contact ? 210 : 170;
  x.fillStyle = grad(0, HH, "#B71C1C", "#E53935"); x.fillRect(0, 0, W, HH);
  x.fillStyle = "rgba(255,255,255,0.10)"; x.beginPath(); x.moveTo(W * 0.62, 0); x.lineTo(W, 0); x.lineTo(W, HH); x.lineTo(W * 0.48, HH); x.closePath(); x.fill();
  x.fillStyle = "rgba(255,255,255,0.07)"; x.beginPath(); x.moveTo(W * 0.74, 0); x.lineTo(W, 0); x.lineTo(W, HH); x.lineTo(W * 0.6, HH); x.closePath(); x.fill();
  const ix = P + 46, iy = 88;
  const LW = 140, LH = RM_LOGO.naturalWidth ? Math.round(LW * RM_LOGO.naturalHeight / RM_LOGO.naturalWidth) : 100;
  if (RM_LOGO.complete && RM_LOGO.naturalWidth) { x.save(); x.shadowColor = "rgba(0,0,0,0.35)"; x.shadowBlur = 10; x.drawImage(RM_LOGO, P, iy - LH / 2, LW, LH); x.restore() }
  else { x.fillStyle = "#191B20"; rr(ix - 50, iy - 50, 100, 100, 20); x.fill(); F(38, 900); txt("RM", ix, iy + 13, "center", "#E53935") }
  const hx = P + (RM_LOGO.naturalWidth ? 160 : 112); F(44, 800); txt(fit(s.name || "Rehman Motors", W - hx - P), hx, 84, "left", "#fff");
  if (s.tagline) { F(21, 500); txt(fit(s.tagline, W - hx - P), hx, 118, "left", "rgba(255,255,255,0.92)") }
  if (contact) { F(17); txt(fit(contact, W - 2 * P), P, 178, "left", "rgba(255,255,255,0.92)") }
  let y = HH + 30;
  // title + status
  const due = dueAmt(j), paid = paidAmt(j);
  F(15, 700); txt("BILL / CASH MEMO", P, y + 6, "left", T.sub); F(30, 800); txt("BILL  " + j.no, P, y + 42, "left", T.ink);
  const pill = due <= 0 ? "✔ Paid" : paid > 0 ? "● Aanshik (Partial)" : "● Udhaar";
  F(18, 700); const pw = x.measureText(pill).width + 34;
  x.fillStyle = due > 0 ? "#FFE9E7" : "#E6F6EC"; rr(W - P - pw, y + 12, pw, 38, 19); x.fill(); txt(pill, W - P - pw / 2, y + 38, "center", due > 0 ? T.acc : "#1E8E4E");
  y += 70;
  // info block
  const info = [["👤", "Customer", j.cust.name], ["📱", "Mobile", j.cust.phone], ["🏍️", "Bike", j.bike.model], ["🔢", "Bike no.", j.bike.number], ["📅", "Date", fd(j.date)], ["🔧", "Mechanic", j.mech], ["📍", "Gaon", j.cust.gaon], ["🛣️", "KM", j.bike.km]].filter(r => String(r[2] ?? "").trim());
  const rows = Math.ceil(info.length / 2), bh = rows * 64 + 24, cw2 = (W - 2 * P) / 2;
  x.fillStyle = T.card; rr(P, y, W - 2 * P, bh, 18); x.fill(); x.fillStyle = T.acc; rr(P, y, 8, bh, 4); x.fill();
  info.forEach((it, i) => { const X = P + 26 + (i % 2) * cw2, Y = y + 22 + Math.floor(i / 2) * 64;
    x.fillStyle = "#fff"; x.beginPath(); x.arc(X + 20, Y + 22, 20, 0, 7); x.fill(); F(19); txt(it[0], X + 20, Y + 29, "center", T.ink);
    F(14, 600); txt(it[1].toUpperCase(), X + 52, Y + 14, "left", T.sub); F(20, 700); txt(fit(it[2], cw2 - 80), X + 52, Y + 40, "left", T.ink) });
  y += bh + 26;
  // items table
  const cols = [P + 20, W - 330, W - 215, W - P - 20], th = 46, rh = 48, tw = W - 2 * P;
  x.save(); rr(P, y, tw, th + rh * n, 16); x.clip(); x.fillStyle = "#fff"; x.fillRect(P, y, tw, th + rh * n);
  x.fillStyle = T.acc; x.fillRect(P, y, tw, th); F(16, 800); x.fillStyle = "#fff";
  txt("KAAM / PART", cols[0], y + 29); txt("QTY", cols[1], y + 29, "center"); txt("RATE", cols[2], y + 29, "right"); txt("AMOUNT", cols[3], y + 29, "right");
  items.forEach((r, i) => { const Y = y + th + i * rh; x.fillStyle = i % 2 ? T.zebra : "#fff"; x.fillRect(P, Y, tw, rh);
    F(19, 500); txt(fit(r[0], cols[1] - cols[0] - 40), cols[0], Y + 31, "left", T.ink); F(18); txt(String(r[1]), cols[1], Y + 31, "center", T.sub); txt(rs(r[2]), cols[2], Y + 31, "right", T.sub);
    F(19, 700); txt(rs(r[1] * r[2]), cols[3], Y + 31, "right", T.ink) });
  if (!n) { F(18); txt("—", W / 2, y + th + 31, "center", T.sub) }
  x.restore(); x.strokeStyle = T.line; x.lineWidth = 1.5; rr(P, y, tw, th + rh * Math.max(n, 1), 16); x.stroke();
  y += th + rh * Math.max(n, 1) + 22;
  // total
  x.fillStyle = grad(y, y + 88, "#C62828", "#8E0000"); rr(P, y, tw, 88, 18); x.fill();
  F(22, 700); txt("KUL TOTAL", P + 28, y + 54, "left", "rgba(255,255,255,0.9)"); F(15, 500); txt(`${n} items`, P + 178, y + 53, "left", "rgba(255,255,255,0.7)");
  F(42, 900); txt(rs(t.total), W - P - 28, y + 60, "right", "#fff"); y += 112;
  // payment chips
  const pb = payBreak(j), chips = [];
  if (pb.Cash) chips.push(["💵 Cash", pb.Cash, "#E8F7EE", "#1E8E4E"]); if (pb.UPI) chips.push(["📱 UPI", pb.UPI, "#E8F0FE", "#1A5FD0"]);
  if (due > 0) chips.push(["⏳ Baaki", due, "#FFE9E7", T.acc]);
  F(16, 800); txt("PAYMENT", P, y, "left", T.sub); y += 14;
  if (chips.length) { const k = chips.length, cw = (tw - 12 * (k - 1)) / k;
    chips.forEach((ch, i) => { const X = P + i * (cw + 12); x.fillStyle = ch[2]; rr(X, y, cw, 84, 16); x.fill();
      if (ch[0].includes("Baaki")) { x.strokeStyle = T.acc; x.lineWidth = 2.5; rr(X + 1, y + 1, cw - 2, 82, 15); x.stroke() }
      F(18, 700); txt(ch[0], X + 18, y + 32, "left", "#444"); F(28, 900); txt(rs(ch[1]), X + 18, y + 68, "left", ch[3]) });
    y += 104 } else { y += 10 }
  if (due > 0) { F(17, 600); txt(fit(`Mila: ${rs(paid)}  ·  Baaki: ${rs(due)} (agli baar jama karein)`, tw), P, y + 6, "left", T.acc); y += 30 }
  else { x.fillStyle = "#E6F6EC"; rr(P, y - 4, tw, 50, 14); x.fill(); F(20, 800); txt("✔ Poora payment mil gaya – Paid", W / 2, y + 28, "center", "#1E8E4E"); y += 66 }
  // next service
  if (j.nextService) { x.fillStyle = "#FFF4D6"; rr(P, y, tw, 62, 14); x.fill(); x.fillStyle = "#F4B400"; rr(P, y, 10, 62, 5); x.fill();
    F(22); txt("🔔", P + 30, y + 40, "left", T.ink); F(20, 700); txt("Agli service: " + fd(j.nextService), P + 70, y + 30, "left", "#7A5600");
    F(16); txt("Time par service = lambi umar wali bike", P + 70, y + 52, "left", "#8A6D1F"); y += 86 }
  // footer (cropped)
  const foot2 = [s.timing && "⏰ Timing: " + s.timing, s.name].filter(Boolean).join("  ·  ");
  const fh = 128, FH = Math.ceil(y + fh), o = document.createElement("canvas"); o.width = W * S; o.height = FH * S;
  const ox = o.getContext("2d"); ox.drawImage(c, 0, 0, W * S, FH * S, 0, 0, W * S, FH * S); ox.scale(S, S);
  const fy = FH - fh; ox.fillStyle = T.acc; ox.fillRect(0, fy, W, fh);
  ox.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 12; i < W; i += 22) { ox.beginPath(); ox.arc(i, fy + 18, 3, 0, 7); ox.fill() }
  ox.textAlign = "center"; ox.fillStyle = "#fff"; ox.font = `800 26px ${FN}`; ox.fillText("Dhanyavaad! 🙏 Aapki bike, hamari zimmedari", W / 2, fy + 62);
  ox.fillStyle = "rgba(255,255,255,0.88)"; ox.font = `400 17px ${FN}`; ox.fillText(foot2, W / 2, fy + 96);
  return o;
}
const billName = j => `Bill-${j.no}.png`;
function billCaption(j) { const s = D.settings; return `${s.name} – Bill ${j.no}\nNamaste ${j.cust.name || ""} ji, aapka bill. Total: ${rs(tot(j).total)}${dueAmt(j) > 0 ? " · Baaki: " + rs(dueAmt(j)) : " · Paid ✔"}\nDhanyavaad! ${s.phone ? "📞 " + s.phone : ""}` }
async function billImgShare(id) {
  const j = D.jobs.find(x => x.id === id), cv = billCanvas(j), cap = billCaption(j);
  if (window.Android && Android.shareImage) { Android.shareImage(cv.toDataURL("image/png").split(",")[1], waNum(j.cust.phone), cap); return }
  const blob = await new Promise(r => cv.toBlob(r, "image/png")); const f = new File([blob], billName(j), { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], text: cap }); return } catch (e) { if (e.name === "AbortError") return } }
  billImgDl(id); const wl = waLink(j.cust.phone, cap + "\n(Bill ki photo bhej rahe hain)"); if (wl) setTimeout(() => window.open(wl, "_blank"), 600);
  alert("Bill photo download ho gayi. WhatsApp khulega, wahan 📎 se photo jod do.");
}
function billImgDl(id) {
  const j = D.jobs.find(x => x.id === id), cv = billCanvas(j);
  if (window.Android && Android.saveImage) { Android.saveImage(billName(j), cv.toDataURL("image/png").split(",")[1]); return }
  const a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = billName(j); document.body.appendChild(a); a.click(); a.remove();
}
