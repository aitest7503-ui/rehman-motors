/* Rehman Motors – Job Cards menu + payments */
let jf = "all", jd = "all", jq = "";
const isPend = j => j.status === "Aaya" || j.status === "Kaam chalu";
const JF = [["all", "Sab", j => true], ["pend", "Pending", isPend], ["ready", "Ready", j => j.status === "Ready"], ["done", "Complete", j => j.status === "Delivered"], ["due", "Baaki paisa", j => dueAmt(j) > 0]];
function jdOk(j) {
  const t = today(); if (jd === "all") return true; if (jd === "today") return j.date === t;
  if (jd === "week") return j.date >= addDays(t, -6); return j.date.slice(0, 7) === t.slice(0, 7);
}
const pillCls = s => s === "Kaam chalu" ? "chalu" : s;
function jobsView() {
  const q = jq.trim().toUpperCase().replace(/\s/g, "");
  const base = D.jobs.filter(j => jdOk(j) && (!q || [j.no, j.cust.name, j.cust.phone, j.bike.number, j.bike.model].join(" ").toUpperCase().replace(/\s/g, "").includes(q)));
  const f = JF.find(x => x[0] === jf) || JF[0], l = base.filter(f[2]).sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
  const totDue = D.jobs.reduce((a, j) => a + dueAmt(j), 0);
  return `<div class="stats" style="grid-template-columns:1fr 1fr 1fr"><div class="stat" onclick="jf='pend';render()"><b>${D.jobs.filter(isPend).length}</b><span>Pending</span></div>
<div class="stat" onclick="jf='ready';render()"><b>${D.jobs.filter(j => j.status === "Ready").length}</b><span>Ready</span></div>
<div class="stat" onclick="jf='due';render()"><b style="font-size:19px">${rs(totDue)}</b><span>Kul baaki</span></div></div>
<div class="card" style="margin-top:12px"><input id="jq" placeholder="🔍 Naam, mobile, bike no., job no." value="${esc(jq)}" oninput="jq=this.value;render();const e=document.getElementById('jq');e.focus();e.setSelectionRange(e.value.length,e.value.length)">
<div style="margin-top:6px;display:flex;flex-wrap:wrap">${JF.map(x => `<button class="btn s ${jf === x[0] ? "" : "w"}" onclick="jf='${x[0]}';render()">${x[1]} (${base.filter(x[2]).length})</button>`).join("")}</div>
<select style="margin-top:8px" onchange="jd=this.value;render()">${[["today", "Aaj"], ["week", "Is hafte (7 din)"], ["month", "Is mahine"], ["all", "Sab din"]].map(x => `<option value="${x[0]}" ${jd === x[0] ? "selected" : ""}>📅 ${x[1]}</option>`).join("")}</select>
${l.map(j => { const t = tot(j).total, p = paidAmt(j), d = dueAmt(j); return `<div class="item" onclick="go('card','${j.id}')"><div style="display:flex;justify-content:space-between;gap:6px"><b>${esc(j.no)}</b><span class="pill ${pillCls(j.status)}">${esc(j.status)}</span></div>
<div>${esc(j.cust.name || "-")} · ${esc(j.bike.number || j.bike.model || "")}</div>
<div class="muted">${fd(j.date)} · Total ${rs(t)} · Mila ${rs(p)} · ${d > 0 ? `<b style="color:#C62828">Baaki ${rs(d)}</b>${p > 0 ? " (Aanshik)" : ""}` : `<span style="color:#1f9d55">Paid ✔</span>`}</div></div>` }).join("") || '<div class="muted" style="margin-top:10px">Koi job card nahi mila.</div>'}</div>`;
}
function readyMsg(j) { const s = D.settings; return `Namaste ${j.cust.name || ""} ji,\nAapki bike ${j.bike.model || ""} ${j.bike.number || ""} taiyaar hai ✔\nTotal: ${rs(tot(j).total)}${dueAmt(j) > 0 ? ` · Baaki: ${rs(dueAmt(j))}` : ""}\nAa kar le jaiye.\n${s.name}${s.phone ? " · " + s.phone : ""}` }
function jobExtras(j) {
  const d = dueAmt(j), ps = (j.payments || []).filter(p => num(p.amt)), wr = waLink(j.cust.phone, readyMsg(j));
  return `<div class="card" style="margin-top:12px"><h2>💰 Payment</h2><div class="row"><div>Total<br><b>${rs(tot(j).total)}</b></div><div>Mila<br><b style="color:#1f9d55">${rs(paidAmt(j))}</b></div><div>Baaki<br><b style="color:${d > 0 ? "#C62828" : "#1f9d55"}">${rs(d)}</b></div></div>
${ps.length ? `<h3>Payment history</h3>${ps.map(p => `<div class="chk"><span>${fd(p.date)} · ${esc(p.mode)}</span><b>${rs(p.amt)}</b><button class="btn s w" onclick="delPay('${j.id}','${p.id}')">✕</button></div>`).join("")}` : (!ps.length && d === 0 && tot(j).total > 0 ? `<div class="muted">Poora paisa mil gaya (${esc(j.pay)}).</div>` : "")}
<div class="muted">${(b => [b.Cash ? "💵 Cash " + rs(b.Cash) : "", b.UPI ? "📱 UPI " + rs(b.UPI) : ""].filter(Boolean).join(" + "))(payBreak(j))}${paidAmt(j) ? " · " : ""}<b>${payStatus(j)}</b></div>
${d > 0 ? `<h3>Payment le lo</h3><div class="row"><div><label>💵 Cash ₹</label><input id="py_cash" type="number" inputmode="numeric" value="${d}" oninput="pyCalc(${d})"></div><div><label>📱 UPI ₹</label><input id="py_upi" type="number" inputmode="numeric" placeholder="0" oninput="pyCalc(${d})"></div></div><div id="py_left" class="muted">Is payment ke baad baaki: ₹0</div>
<label>Date</label><input id="py_date" type="date" value="${today()}"><button class="btn g" onclick="addPay('${j.id}')">✔ Payment save karo</button>` : ""}</div>
<div class="card"><h2>📲 Customer ko bhejo</h2>
<button class="btn g" onclick="billImgShare('${j.id}')">🖼️ Bill dobara bhejo (photo)</button>
${waLink(j.cust.phone, "x") ? `<a class="btn w" href="${waLink(j.cust.phone, billMsg(j))}" target="_blank" rel="noopener">📝 Bill dobara bhejo (text)</a>
<a class="btn w" href="${wr}" target="_blank" rel="noopener">🏍️ "Bike ready hai" WhatsApp</a>
${d > 0 ? `<a class="btn w" href="${waLink(j.cust.phone, udhaarMsg(j))}" target="_blank" rel="noopener">💰 Udhaar yaad dilao (WhatsApp)</a>` : ""}
<a class="btn w" href="tel:${esc(p10(j.cust.phone))}">📞 Call karo</a>` : `<div class="warn">WhatsApp/Call ke liye sahi 10 digit mobile chahiye.</div>`}
<button class="btn w" onclick="billImgDl('${j.id}')">⬇️ Bill image download</button></div>
<button class="btn w" style="border-color:#999;color:#777" onclick="delJob('${j.id}')">🗑️ Job card mitao</button>`;
}
function pyCalc(d) { const l = d - num($("#py_cash").value) - num($("#py_upi").value); $("#py_left").innerHTML = l > 0 ? `Is payment ke baad baaki: <b style="color:#C62828">${rs(l)}</b>` : "Is payment ke baad baaki: ₹0 ✔" }
function addPay(id) {
  const j = D.jobs.find(x => x.id === id), c = num($("#py_cash").value), u = num($("#py_upi").value), a = c + u, d = dueAmt(j);
  if (a <= 0) { alert("Amount likho"); return } if (a > d && !confirm(`Baaki sirf ${rs(d)} hai. Phir bhi ${rs(a)} likhein?`)) return;
  if (!Array.isArray(j.payments) || !j.payments.length) { j.payments = []; const already = paidAmt(j); if (already > 0 && j.pay !== "Udhaar") j.payments.push({ id: "p0" + Date.now(), amt: already, mode: j.pay, date: j.date }) }
  const dt = $("#py_date").value || today(), rid = "p" + Date.now() + Math.random().toString(36).slice(2, 5);
  if (c) j.payments.push({ id: rid + "c", amt: c, mode: "Cash", date: dt }); if (u) j.payments.push({ id: rid + "u", amt: u, mode: "UPI", date: dt });
  j.paid = dueAmt(j) <= 0; save(); render();
}
function delPay(id, pid) { if (!confirm("Ye payment hatana hai?")) return; const j = D.jobs.find(x => x.id === id); j.payments = (j.payments || []).filter(p => p.id !== pid); if (!j.payments.length) j.payments = [{ id: "p0", amt: 0, mode: "-", date: j.date }]; j.paid = dueAmt(j) <= 0; save(); render() }
