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

/* BILL IMAGE (canvas) */
function billCanvas(j) {
  const s = D.settings, t = tot(j), W = 800, P = 40;
  const rows = j.works.map(w => [w.name, "", num(w.rate)]); if (num(j.labourExtra)) rows.push(["Extra labour", "", num(j.labourExtra)]);
  j.parts.forEach(p => rows.push([p.name, "x" + p.qty, num(p.qty) * num(p.price)]));
  const qrOk = s.upi && typeof qrcode === "function";
  const H = 470 + rows.length * 46 + (qrOk ? 350 : s.upi ? 60 : 0) + (j.nextService ? 40 : 0);
  const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
  const F = (sz, b) => x.font = `${b ? "bold " : ""}${sz}px Roboto, "Noto Sans", Arial, sans-serif`;
  const txt = (s_, X, Y, al) => { x.textAlign = al || "left"; x.fillText(s_, X, Y) };
  const fit = (s_, w) => { s_ = String(s_ || ""); while (s_.length > 3 && x.measureText(s_).width > w) s_ = s_.slice(0, -2); return s_ };
  x.fillStyle = "#fff"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#C62828"; x.fillRect(0, 0, W, 150);
  x.fillStyle = "#fff"; F(40, 1); txt(s.name || "Rehman Motors", P, 58); F(22); txt(s.tagline || "", P, 92);
  F(19); txt(fit([s.phone && "📞 " + s.phone, s.address].filter(Boolean).join("  ·  "), W - 2 * P), P, 126);
  let y = 200; x.fillStyle = "#222"; F(26, 1); txt("BILL: " + j.no, P, y); F(22); txt("Date: " + fd(j.date), W - P, y, "right");
  y += 44; F(22); txt(fit(`${j.cust.name || ""}  ·  ${j.cust.phone || ""}${j.cust.gaon ? "  ·  " + j.cust.gaon : ""}`, W - 2 * P), P, y);
  y += 36; F(22, 1); txt(fit(`Bike: ${j.bike.model || ""} ${j.bike.number || ""}${j.bike.km ? "  ·  " + j.bike.km + " km" : ""}`, W - 2 * P), P, y);
  y += 30; x.fillStyle = "#f3d6d6"; x.fillRect(P, y, W - 2 * P, 40); x.fillStyle = "#C62828"; F(20, 1); txt("Kaam / Part", P + 12, y + 27); txt("Qty", W - 250, y + 27, "center"); txt("₹", W - P - 12, y + 27, "right");
  y += 40; x.fillStyle = "#222"; F(21);
  rows.forEach((r, i) => { if (i % 2) { x.fillStyle = "#fafafa"; x.fillRect(P, y, W - 2 * P, 46); x.fillStyle = "#222" } txt(fit(r[0], W - 380), P + 12, y + 30); txt(r[1], W - 250, y + 30, "center"); txt(rs(r[2]), W - P - 12, y + 30, "right"); y += 46 });
  x.strokeStyle = "#C62828"; x.lineWidth = 2; x.beginPath(); x.moveTo(P, y + 6); x.lineTo(W - P, y + 6); x.stroke();
  y += 50; F(32, 1); x.fillStyle = "#C62828"; txt("Total: " + rs(t.total), W - P, y, "right");
  y += 38; F(22, 1); const due = j.pay === "Udhaar" && !j.paid;
  x.fillStyle = due ? "#C62828" : "#1f9d55"; txt(due ? `Baaki (Udhaar): ${rs(t.total)}` : `Paid ✔ (${j.pay})`, W - P, y, "right");
  if (j.nextService) { y += 40; x.fillStyle = "#222"; F(21); txt("Agli service: " + fd(j.nextService), P, y) }
  if (qrOk) {
    try { const q = qrcode(0, "M"); q.addData(`upi://pay?pa=${s.upi}&pn=${encodeURIComponent(s.name)}&am=${due || j.pay !== "Cash" ? t.total : ""}&cu=INR&tn=${j.no}`.replace("&am=&", "&")); q.make();
      const n = q.getModuleCount(), sz = 220, cs = sz / n, qx = (W - sz) / 2, qy = y + 30; x.fillStyle = "#000";
      for (let r = 0; r < n; r++) for (let cc = 0; cc < n; cc++) if (q.isDark(r, cc)) x.fillRect(Math.floor(qx + cc * cs), Math.floor(qy + r * cs), Math.ceil(cs), Math.ceil(cs));
      F(19); x.fillStyle = "#444"; txt("Scan karke UPI se pay karein · " + s.upi, W / 2, qy + sz + 30, "center"); y = qy + sz + 40 } catch (e) { y += 10 }
  } else if (s.upi) { y += 40; F(21); x.fillStyle = "#222"; txt("UPI: " + s.upi, P, y) }
  x.fillStyle = "#C62828"; x.fillRect(0, H - 70, W, 70); x.fillStyle = "#fff"; F(24, 1); txt("Dhanyavaad! 🙏  Aapki bike, hamari zimmedari.", W / 2, H - 27, "center");
  return c;
}
const billName = j => `Bill-${j.no}.png`;
function billCaption(j) { const s = D.settings; return `${s.name} – Bill ${j.no}\nNamaste ${j.cust.name || ""} ji, aapka bill. Total: ${rs(tot(j).total)}\nDhanyavaad! ${s.phone ? "📞 " + s.phone : ""}` }
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
