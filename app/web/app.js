const $ = (id) => document.getElementById(id);
// 鏈夌敤鎴峰彂璧风殑鎱㈡搷浣?寮€娴忚鍣ㄦ姄璇勮/鍙戣瘎璁?瑙ｆ瀽閾炬帴绛?鍦ㄨ繘琛屾椂,鏆傚仠 8 绉掕疆璇㈠埛鏂?
// 鍚﹀垯瀹氭椂閲嶆覆鏌撲細鎶婃寜閽殑銆屸€︿腑銆嶅姞杞芥€佸啿鎺夈€?let INFLIGHT = 0;
// 鍏ㄥ眬蹇欑寰界珷:>350ms 鎵嶆樉绀?蹇€熻疆璇笉闂?,鍦嗙幆杞湀 + 宸茬瓑寰呯鏁?+ 骞跺彂鏁般€?// 鎷夸笉鍒扮湡瀹炶繘搴︾櫨鍒嗘瘮(娴忚鍣ㄨ嚜鍔ㄥ寲/鎺ュ彛閮芥槸涓嶉€忔槑鎿嶄綔),鐢ㄨ鏃剁粰"鍦ㄨ繘琛?鐨勬竻鏅版劅鐭ャ€?// 鍒ゅ繖 = 鏈夋湭瀹屾垚璇锋眰(_apiActive)鎴栨湁鐢ㄦ埛鎱㈡搷浣?INFLIGHT);骞跺彂鏁扮敤 INFLIGHT(鐢ㄦ埛鐐圭殑鎿嶄綔鏁?銆?let _apiActive = 0, _barTimer = null, _busyStart = 0, _busyTick = null;
function _isBusy() { return _apiActive > 0 || INFLIGHT > 0; }
function _busyShow() { const sp = $("busy-spinner"); if (sp && _isBusy()) sp.classList.add("on"); }
function _busyLabel() {
  const l = $("bs-label"); if (!l) return;
  const sec = Math.floor((Date.now() - _busyStart) / 1000);
  l.textContent = "澶勭悊涓?" + (INFLIGHT > 1 ? "脳" + INFLIGHT + " 路 " : "") + sec + " 绉?;
}
function _barSync() {
  if (_isBusy()) {
    if (!_barTimer) {                 // 绌洪棽 -> 蹇?鍚姩璁℃椂,350ms 鍚庢墠鐪熸鏄剧ず
      _busyStart = Date.now();
      _barTimer = setTimeout(_busyShow, 350);
      _busyTick = setInterval(_busyLabel, 250);
    }
  } else {                            // 鍏ㄩ儴缁撴潫:娓呯悊骞堕殣钘?    clearTimeout(_barTimer); _barTimer = null;
    clearInterval(_busyTick); _busyTick = null;
    const sp = $("busy-spinner"); if (sp) sp.classList.remove("on");
    const l = $("bs-label"); if (l) l.textContent = "澶勭悊涓?;
  }
}
const api = async (path, opts) => {
  _apiActive++; _barSync();
  try {
    const r = await fetch(path, opts);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.detail || r.status); }
    return await r.json();
  } finally { _apiActive--; _barSync(); }
};

// 鈹€鈹€鈹€ UI helpers 鈹€鈹€鈹€
const ic = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
// 鎸夐挳鍔犺浇鎬?鎹㈡垚 spinner+label,杩斿洖 restore()銆傞厤鍚?INFLIGHT 鏆傚仠杞,鍔犺浇鎬佷笉浼氳閲嶆覆鏌撳啿鎺夈€?function btnLoading(btn, label) {
  if (!btn) return () => {};
  const html = btn.innerHTML, dis = btn.disabled;
  btn.disabled = true; btn.classList.add("busy");
  btn.innerHTML = `<span class="spin"></span>${label ? `<span>${esc(label)}</span>` : ""}`;
  return () => { try { btn.innerHTML = html; btn.disabled = dis; btn.classList.remove("busy"); } catch (e) {} };
}
// 鍖呰９涓€涓敤鎴峰彂璧风殑鎱㈡搷浣?鎸夐挳杞湀 + 鏆傚仠杞(閬垮厤 8 绉掗噸娓叉煋鍐叉帀鍔犺浇鎬?銆?// btn 鍙负 null(鏃犳寜閽満鏅?;fn 涓哄疄闄?async 閫昏緫銆?async function withBusy(btn, label, fn) {
  const restore = btnLoading(btn, label);
  INFLIGHT++; _barSync();
  try { return await fn(); }
  finally { INFLIGHT--; restore(); _barSync(); }
}
// 浠庡唴鑱?onclick 澶勭悊鍣ㄩ噷鎷垮埌琚偣鐨勬寜閽?event 鍦ㄥ悓姝ラ樁娈垫湁鏁?
function evtBtn() { try { return event.target.closest("button"); } catch (e) { return null; } }
function toast(msg, type = "info", ms = 3600) {
  const box = $("toasts");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const sym = type === "ok" ? "i-check" : type === "err" ? "i-x" : "i-info";
  el.innerHTML = `${ic(sym)}<span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add("hide"); setTimeout(() => el.remove(), 250); }, ms);
}
const empty = (cols, text, icon = "i-inbox", sub = "") =>
  `<tr><td colspan="${cols}"><div class="empty">` +
  `<div class="empty-ic">${ic(icon)}</div><div class="empty-t">${esc(text)}</div>` +
  `${sub ? `<div class="empty-sub">${esc(sub)}</div>` : ""}</div></td></tr>`;
const skeleton = (cols, rows = 3) => {
  let out = "";
  for (let i = 0; i < rows; i++) {
    let tds = "";
    for (let c = 0; c < cols; c++) tds += `<td><span class="sk" style="width:${40 + ((i + c) % 4) * 18}%"></span></td>`;
    out += `<tr>${tds}</tr>`;
  }
  return out;
};

// 鈹€鈹€鈹€ 閫氱敤妯℃€?鏇夸唬鍘熺敓 prompt / confirm:涓嬫媺 / 鏂囨湰杈撳叆 / 纭)鈹€鈹€鈹€
let _uiResolve = null, _uiGetVal = null, _uiCancelVal = null;
function _uiClose(val) {
  $("uimodal").style.display = "none";
  document.removeEventListener("keydown", _uiKey);
  const r = _uiResolve; _uiResolve = null; _uiGetVal = null;
  if (r) r(val);
}
function _uiKey(e) {
  if (e.key === "Escape") uiModalCancel();
  else if (e.key === "Enter" && document.activeElement && document.activeElement.tagName !== "TEXTAREA") uiModalOk();
}
function uiModalCancel() { _uiClose(_uiCancelVal); }
function uiModalOk() { _uiClose(_uiGetVal ? _uiGetVal() : ""); }
function _uiOpen(title, hint, { okText = "纭畾", danger = false } = {}) {
  $("ui-title").textContent = title || "";
  $("ui-hint").textContent = hint || "";
  const ok = $("ui-ok");
  ok.innerHTML = (danger ? "" : `<svg aria-hidden="true"><use href="#i-check"/></svg>`) + esc(okText);
  ok.classList.toggle("danger", !!danger);
  ok.style.cssText = danger ? "flex:0 0 auto;background:var(--danger);border-color:transparent" : "flex:0 0 auto";
  $("uimodal").style.display = "flex";
  document.addEventListener("keydown", _uiKey);
  setTimeout(() => { const el = $("ui-body").querySelector("select,input,textarea,button"); if (el && el.tagName !== "BUTTON") el.focus(); }, 30);
}
// 纭妗嗐€傝繑鍥?true / false銆俤anger=true 鏃剁‘瀹氭寜閽孩鑹?鍗遍櫓鎿嶄綔)
function uiConfirm({ title = "纭", message = "", okText = "纭畾", danger = false } = {}) {
  return new Promise(res => {
    _uiResolve = res; _uiGetVal = () => true; _uiCancelVal = false;
    $("ui-body").innerHTML = "";
    _uiOpen(title, message, { okText, danger });
  });
}
// 涓嬫媺閫夋嫨銆俹ptions:[{value,label,disabled}]銆傝繑鍥為€変腑 value 鎴?null(鍙栨秷)
function uiSelect({ title, hint, options, value }) {
  return new Promise(res => {
    _uiResolve = res; _uiCancelVal = null;
    _uiGetVal = () => { const el = $("ui-body").querySelector("select,input,textarea"); return el ? el.value : ""; };
    $("ui-body").innerHTML =
      `<select id="ui-sel" style="width:100%">` +
      options.map(o => `<option value="${esc(o.value)}"${o.value === value ? " selected" : ""}${o.disabled ? " disabled" : ""}>${esc(o.label)}</option>`).join("") +
      `</select>`;
    enhanceSelect($("ui-sel"));
    _uiOpen(title, hint);
  });
}
// 鏂囨湰杈撳叆(鍗曡鎴栧琛?銆傝繑鍥炲瓧绗︿覆鎴?null(鍙栨秷)
function uiPrompt({ title, hint, value, placeholder, multiline, rows }) {
  return new Promise(res => {
    _uiResolve = res; _uiCancelVal = null;
    _uiGetVal = () => { const el = $("ui-body").querySelector("select,input,textarea"); return el ? el.value : ""; };
    $("ui-body").innerHTML = multiline
      ? `<textarea id="ui-inp" rows="${rows || 6}" placeholder="${esc(placeholder || "")}">${esc(value || "")}</textarea>`
      : `<input id="ui-inp" value="${esc(value || "")}" placeholder="${esc(placeholder || "")}">`;
    _uiOpen(title, hint);
  });
}

// 鈹€鈹€鈹€ 鑷畾涔変笅鎷?娓愯繘澧炲己鍘熺敓 <select>(缇庡寲灞曞紑鍒楄〃)鈹€鈹€鈹€
function enhanceSelect(sel) {
  if (sel.dataset.cs) return;
  sel.dataset.cs = "1";
  const wrap = document.createElement("div");
  wrap.className = "cs" + (sel.className ? " " + sel.className : "");
  const st = sel.getAttribute("style");
  if (st) wrap.setAttribute("style", st);
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);
  sel.className = "cs-native";
  sel.removeAttribute("style");

  const trg = document.createElement("button");
  trg.type = "button";
  trg.className = "cs-trg";
  trg.innerHTML = `<span class="cs-lbl"></span>` +
    `<svg class="cs-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
  wrap.appendChild(trg);
  let panel = null;

  function sync() {
    const o = sel.options[sel.selectedIndex];
    trg.querySelector(".cs-lbl").textContent = o ? o.textContent : "";
    trg.classList.toggle("ph", !o || o.value === "");
  }
  function close() {
    if (panel) { panel.remove(); panel = null; }
    wrap.classList.remove("open");
    window.removeEventListener("scroll", close, true);
    window.removeEventListener("resize", close);
    document.removeEventListener("mousedown", onDoc, true);
  }
  function onDoc(e) { if (!wrap.contains(e.target) && (!panel || !panel.contains(e.target))) close(); }
  function open() {
    if (sel.disabled) return;
    panel = document.createElement("div");
    panel.className = "cs-panel";
    Array.from(sel.options).forEach((o, i) => {
      const it = document.createElement("div");
      it.className = "cs-opt" + (i === sel.selectedIndex ? " sel" : "") + (o.disabled ? " dis" : "");
      it.textContent = o.textContent;
      if (!o.disabled) it.addEventListener("mousedown", ev => {
        ev.preventDefault();
        if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event("change", { bubbles: true })); }
        sync(); close();
      });
      panel.appendChild(it);
    });
    document.body.appendChild(panel);
    const r = trg.getBoundingClientRect();
    panel.style.left = r.left + "px";
    panel.style.minWidth = r.width + "px";
    const below = window.innerHeight - r.bottom;
    if (below < 280 && r.top > below) panel.style.bottom = (window.innerHeight - r.top + 5) + "px";
    else panel.style.top = (r.bottom + 5) + "px";
    wrap.classList.add("open");
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    setTimeout(() => document.addEventListener("mousedown", onDoc, true), 0);
  }
  trg.addEventListener("click", e => { e.preventDefault(); panel ? close() : open(); });
  sel.addEventListener("change", sync);
  sel._csSync = sync;
  new MutationObserver(sync).observe(sel, { childList: true });
  sync();
}
function enhanceAllSelects(root) { (root || document).querySelectorAll("select:not([data-cs])").forEach(enhanceSelect); }
function csSyncAll() { document.querySelectorAll("select[data-cs]").forEach(s => s._csSync && s._csSync()); }

// 鈹€鈹€鈹€ 鑷畾涔?tooltip:鎺ョ鍘熺敓 title(棣栨 hover 鏃舵妸 title 杞?data-tip,閬垮厤绯荤粺鎻愮ず)鈹€鈹€鈹€
const _tip = document.createElement("div"); _tip.className = "tip"; document.body.appendChild(_tip);
let _tipTarget = null, _tipTimer = null;
function _tipShow(el) {
  const text = el.getAttribute("data-tip");
  if (!text || !el.isConnected) { _tipHide(); return; }
  _tip.textContent = text;
  const r = el.getBoundingClientRect(), tr = _tip.getBoundingClientRect();
  let below = false, top = r.top - tr.height - 8;
  if (top < 6) { below = true; top = r.bottom + 8; }
  const left = Math.max(6, Math.min(r.left + r.width / 2 - tr.width / 2, window.innerWidth - tr.width - 6));
  _tip.style.left = left + "px"; _tip.style.top = top + "px";
  _tip.classList.toggle("below", below);
  _tip.classList.add("show");
}
function _tipHide() { _tip.classList.remove("show"); _tipTarget = null; clearTimeout(_tipTimer); }
document.addEventListener("mouseover", e => {
  const el = e.target.closest && e.target.closest("[title],[data-tip]");
  if (!el || el === _tip) return;
  if (el.hasAttribute("title")) {       // 鎶婂師鐢?title 鎼埌 data-tip,浠庢涓嶅啀寮圭郴缁熸彁绀?    const t = el.getAttribute("title");
    if (t) { el.setAttribute("data-tip", t); if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", t); }
    el.removeAttribute("title");
  }
  if (el === _tipTarget) return;
  _tipTarget = el;
  clearTimeout(_tipTimer);
  _tipTimer = setTimeout(() => { if (_tipTarget === el) _tipShow(el); }, 300);
});
document.addEventListener("mouseout", e => {
  if (_tipTarget && (!e.relatedTarget || !_tipTarget.contains(e.relatedTarget))) _tipHide();
});
window.addEventListener("scroll", _tipHide, true);
document.addEventListener("click", _tipHide);

// 鈹€鈹€鈹€ 鑷畾涔夋棩鏈熸椂闂撮€夋嫨鍣?娓愯繘澧炲己 <input type=datetime-local> 鈹€鈹€鈹€
const _pad2 = n => String(n).padStart(2, "0");
function _dtFmt(d) { return `${d.getFullYear()}-${_pad2(d.getMonth() + 1)}-${_pad2(d.getDate())}T${_pad2(d.getHours())}:${_pad2(d.getMinutes())}`; }
function _dtDisp(d) { return `${d.getFullYear()}-${_pad2(d.getMonth() + 1)}-${_pad2(d.getDate())} ${_pad2(d.getHours())}:${_pad2(d.getMinutes())}`; }
function _dtParse(v) { const m = (v || "").match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null; }
function enhanceDateTime(inp) {
  if (inp.dataset.dt) return; inp.dataset.dt = "1";
  const wrap = document.createElement("div");
  wrap.className = "dt" + (inp.className ? " " + inp.className : "");
  const st = inp.getAttribute("style"); if (st) wrap.setAttribute("style", st);
  inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
  inp.className = "dt-native"; inp.removeAttribute("style");
  const ph = inp.getAttribute("aria-label") || "閫夋嫨鏃ユ湡鏃堕棿";
  const trg = document.createElement("button");
  trg.type = "button"; trg.className = "dt-trg";
  trg.innerHTML = `<span class="dt-lbl"></span>` +
    `<svg class="dt-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
  wrap.appendChild(trg);
  let panel = null;
  function sync() { const d = _dtParse(inp.value); trg.querySelector(".dt-lbl").textContent = d ? _dtDisp(d) : ph; trg.classList.toggle("ph", !d); }
  function close() { if (panel) { panel.remove(); panel = null; } wrap.classList.remove("open"); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); document.removeEventListener("mousedown", onDoc, true); }
  function onDoc(e) { if (!wrap.contains(e.target) && (!panel || !panel.contains(e.target))) close(); }
  function open() {
    const init = _dtParse(inp.value) || new Date();
    let view = new Date(init.getFullYear(), init.getMonth(), 1);
    let chosen = _dtParse(inp.value);
    let h = init.getHours(), mi = init.getMinutes();
    panel = document.createElement("div"); panel.className = "dt-panel";
    const getH = () => { const v = parseInt(panel.querySelector(".dt-h").value, 10); return isNaN(v) ? 0 : Math.max(0, Math.min(23, v)); };
    const getM = () => { const v = parseInt(panel.querySelector(".dt-m").value, 10); return isNaN(v) ? 0 : Math.max(0, Math.min(59, v)); };
    function render() {
      const y = view.getFullYear(), m = view.getMonth();
      const lead = (new Date(y, m, 1).getDay() + 6) % 7;   // 鍛ㄤ竴涓洪鍒?      const days = new Date(y, m + 1, 0).getDate();
      const t = new Date();
      let cells = "";
      for (let i = 0; i < lead; i++) cells += `<div class="dt-day off"></div>`;
      for (let d = 1; d <= days; d++) {
        const today = t.getFullYear() === y && t.getMonth() === m && t.getDate() === d;
        const sel = chosen && chosen.getFullYear() === y && chosen.getMonth() === m && chosen.getDate() === d;
        cells += `<div class="dt-day${today ? " today" : ""}${sel ? " sel" : ""}" data-d="${d}">${d}</div>`;
      }
      panel.innerHTML =
        `<div class="dt-head"><button type="button" class="dt-nav" data-nav="-1">鈥?/button>` +
        `<span class="dt-title">${y} 骞?${m + 1} 鏈?/span>` +
        `<button type="button" class="dt-nav" data-nav="1">鈥?/button></div>` +
        `<div class="dt-wk"><span>涓€</span><span>浜?/span><span>涓?/span><span>鍥?/span><span>浜?/span><span>鍏?/span><span>鏃?/span></div>` +
        `<div class="dt-grid">${cells}</div>` +
        `<div class="dt-time"><span>鏃堕棿</span><input type="number" class="dt-h" min="0" max="23" value="${_pad2(h)}"><b>:</b><input type="number" class="dt-m" min="0" max="59" value="${_pad2(mi)}"></div>` +
        `<div class="dt-foot"><button type="button" class="ghost sm" data-act="clear">娓呴櫎</button><button type="button" class="ghost sm" data-act="now">鐜板湪</button><button type="button" class="sm" data-act="ok">纭畾</button></div>`;
      panel.querySelectorAll(".dt-nav").forEach(b => b.onclick = () => { h = getH(); mi = getM(); view.setMonth(view.getMonth() + (+b.dataset.nav)); render(); });
      panel.querySelectorAll(".dt-day[data-d]").forEach(c => c.onclick = () => { h = getH(); mi = getM(); chosen = new Date(view.getFullYear(), view.getMonth(), +c.dataset.d, h, mi); render(); });
    }
    function commit(d) { inp.value = d ? _dtFmt(d) : ""; inp.dispatchEvent(new Event("change", { bubbles: true })); sync(); close(); }
    render();
    panel.addEventListener("click", e => {
      const a = e.target.closest("[data-act]"); if (!a) return;
      if (a.dataset.act === "clear") commit(null);
      else if (a.dataset.act === "now") commit(new Date());
      else { const base = chosen || new Date(); base.setHours(getH(), getM(), 0, 0); commit(base); }
    });
    document.body.appendChild(panel);
    const r = trg.getBoundingClientRect();
    panel.style.left = Math.max(6, Math.min(r.left, window.innerWidth - 280)) + "px";
    const below = window.innerHeight - r.bottom;
    if (below < 360 && r.top > below) panel.style.bottom = (window.innerHeight - r.top + 5) + "px";
    else panel.style.top = (r.bottom + 5) + "px";
    wrap.classList.add("open");
    window.addEventListener("scroll", close, true); window.addEventListener("resize", close);
    setTimeout(() => document.addEventListener("mousedown", onDoc, true), 0);
  }
  trg.addEventListener("click", e => { e.preventDefault(); panel ? close() : open(); });
  inp.addEventListener("change", sync);
  inp._dtSync = sync;
  sync();
}
function enhanceAllDateTime(root) { (root || document).querySelectorAll("input[type=datetime-local]:not([data-dt])").forEach(enhanceDateTime); }
function dtSyncAll() { document.querySelectorAll("input[type=datetime-local][data-dt]").forEach(i => i._dtSync && i._dtSync()); }

// 鈹€鈹€鈹€ 鎬昏杩蜂綘鍥捐〃(杩?7 澶╅噰闆?绾?SVG 鍒嗙粍鏌辩姸)鈹€鈹€鈹€
async function refreshOverviewChart() {
  const box = $("overview-chart");
  if (!box) return;
  let d;
  try { d = await api("/api/stats/series?days=7&platform=" + PLATFORM); }
  catch (e) { box.innerHTML = `<div class="chart-empty">鍥捐〃鍔犺浇澶辫触</div>`; return; }
  const days = d.days || [], A = d.contents || [], B = d.comments || [];
  const total = A.reduce((s, n) => s + n, 0) + B.reduce((s, n) => s + n, 0);
  if (!days.length || total === 0) {
    box.innerHTML = `<div class="chart-empty">杩?7 澶╂殏鏃犻噰闆嗘暟鎹?鈥?娣诲姞鐩戞帶骞躲€岀珛鍗虫姄鍙栥€嶅悗杩欓噷浼氬嚭鐜拌秼鍔?/div>`;
    return;
  }
  // viewBox 鍧愭爣绯?鍝嶅簲寮忕缉鏀?  const W = 720, H = 180, padL = 28, padR = 12, padT = 14, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const n = days.length, slot = iw / n;
  const maxV = Math.max(1, ...A, ...B);
  // y 杞村弬鑰冪嚎(0 / 涓?/ 椤?
  const ticks = [0, Math.round(maxV / 2), maxV].filter((v, i, a) => a.indexOf(v) === i);
  const y = v => padT + ih - (v / maxV) * ih;
  let gl = "", axt = "";
  ticks.forEach(t => {
    const yy = y(t).toFixed(1);
    gl += `<line class="gl" x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}"/>`;
    axt += `<text class="axt" x="${padL - 6}" y="${(+yy + 3).toFixed(1)}" text-anchor="end">${t}</text>`;
  });
  const bw = Math.max(5, Math.min(16, slot / 2 - 4));   // 姣忔牴鏌卞
  let bars = "", labels = "";
  const md = (s) => s.slice(5);   // MM-DD
  for (let i = 0; i < n; i++) {
    const cx = padL + slot * i + slot / 2;
    const xa = cx - bw - 1, xb = cx + 1;
    const ha = (A[i] / maxV) * ih, hb = (B[i] / maxV) * ih;
    bars += `<rect class="bar" x="${xa.toFixed(1)}" y="${y(A[i]).toFixed(1)}" width="${bw}" height="${ha.toFixed(1)}" rx="2" fill="var(--acc)"><title>${md(days[i])} 路 浣滃搧 ${A[i]}</title></rect>`;
    bars += `<rect class="bar" x="${xb.toFixed(1)}" y="${y(B[i]).toFixed(1)}" width="${bw}" height="${hb.toFixed(1)}" rx="2" fill="var(--info)"><title>${md(days[i])} 路 璇勮 ${B[i]}</title></rect>`;
    labels += `<text class="axt" x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle">${md(days[i])}</text>`;
  }
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="杩?7 澶╂瘡鏃ユ柊澧炰綔鍝佷笌璇勮鏌辩姸鍥?>${gl}${axt}${bars}${labels}</svg>`;
}

// 鈹€鈹€鈹€ 骞冲彴鍒囨崲(鎶栭煶 / 灏忕孩涔? 鈹€鈹€鈹€
let PLATFORM = "douyin";
const PF_NAME = { douyin: "鎶栭煶", xhs: "灏忕孩涔?, kuaishou: "蹇墜" };
// 鏄惁鏀寔銆屽彂甯冦€嶉潰鏉?鎶栭煶 / 灏忕孩涔?/ 蹇墜鍧囨湁)
function pfHasPublish(pf) { return pf === "xhs" || pf === "kuaishou" || pf === "douyin"; }
function switchPlatform(pf) {
  if (pf !== "douyin" && pf !== "xhs" && pf !== "kuaishou") pf = "douyin";
  PLATFORM = pf;
  try { localStorage.setItem("dym-pf", pf); } catch (e) {}
  applyPlatformUI();
  // 鍒囨崲鍚庣珛鍒诲埛鏂拌骞冲彴鏁版嵁
  refreshAccounts(); refreshMonitors(); refreshContents(); refreshWatches(); refreshComments(); refreshOverviewChart();
  populateAcAccount(); onAcMode(); refreshCommentRules(); refreshCommentTasks();
  if (pfHasPublish(PLATFORM)) refreshPublish();
}
function applyPlatformUI() {
  document.body.classList.toggle("pf-douyin", PLATFORM === "douyin");
  document.body.classList.toggle("pf-xhs", PLATFORM === "xhs");
  document.body.classList.toggle("pf-kuaishou", PLATFORM === "kuaishou");
  document.querySelectorAll(".pswitch button").forEach(b =>
    b.classList.toggle("active", b.dataset.pf === PLATFORM));
  document.querySelectorAll(".dy-only").forEach(e => e.classList.toggle("hidden", PLATFORM !== "douyin"));
  document.querySelectorAll(".xhs-only").forEach(e => e.classList.toggle("hidden", PLATFORM !== "xhs"));
  document.querySelectorAll(".ks-only").forEach(e => e.classList.toggle("hidden", PLATFORM !== "kuaishou"));
  // 鍙戝竷闈㈡澘鍏ュ彛:鎶栭煶 / 灏忕孩涔?/ 蹇墜鍧囨樉绀?  document.querySelectorAll(".pub-only").forEach(e => e.classList.toggle("hidden", !pfHasPublish(PLATFORM)));
  // 鍙戝竷闈㈡澘鏂囨闅忓钩鍙板垏鎹?  const ks = PLATFORM === "kuaishou", dy = PLATFORM === "douyin";
  const pubSub = $("pub-head-sub");
  if (pubSub) pubSub.textContent = dy ? "涓婁紶鍥鹃泦 / 瑙嗛鍒版姈闊冲垱浣滃钩鍙?瀹為獙鎬?"
    : ks ? "涓婁紶鍥鹃泦 / 瑙嗛鍒板揩鎵嬪垱浣滃钩鍙?瀹為獙鎬?" : "涓婁紶鍥鹃泦 / 瑙嗛鍒板皬绾功(瀹為獙鎬?";
  if ($("pub-head-lead")) $("pub-head-lead").textContent = (ks || dy) ? "鍙戝竷浣滃搧" : "鍙戝竷绗旇";
  if ($("pub-title")) $("pub-title").placeholder = (ks || dy) ? "缁欎綔鍝佽捣涓爣棰? : "缁欑瑪璁拌捣涓爣棰?;
  if ($("pub-hint")) $("pub-hint").textContent = dy
    ? "鍙戝竷閫氳繃鑷姩鍖栨姈闊冲垱浣滃钩鍙?creator.douyin.com)瀹屾垚,浼氬脊鍑烘祻瑙堝櫒绐楀彛銆傞娆℃垨瑙﹀彂椋庢帶鏃舵姈闊充細瑕佹眰銆岀煭淇￠獙璇佺爜/鎵爜銆嶉獙璇?璇峰湪寮瑰嚭绐楀彛閲屾墜鍔ㄥ畬鎴?鏈€澶氱瓑 5 鍒嗛挓,楠岃瘉閫氳繃鍚庤嚜鍔ㄧ户缁彂甯?;瑙嗛涓婁紶鍚庨渶绛夎浆鐮?鍙戝竷绋嶆參銆傗殸锔?鍥犻渶鏈汉楠岃瘉,瀹氭椂/鏃犱汉鍊煎畧鍙戝竷鍙兘琚姝ラ鎸′綇,寤鸿鍙戝竷鏃跺湪鍦恒€?
    : ks
    ? "鍙戝竷閫氳繃鑷姩鍖栧揩鎵嬪垱浣滃钩鍙?cp.kuaishou.com)瀹屾垚,浼氬脊鍑烘祻瑙堝櫒绐楀彛;鑻ラ亣楠岃瘉鐮?闇€琛ュ皝闈㈠彲鍦ㄧ獥鍙ｉ噷鎵嬪姩澶勭悊銆傚畾鏃朵换鍔＄敱鍚庡彴寮曟搸鍒扮偣鎵ц銆?
    : "鍙戝竷閫氳繃鑷姩鍖栧皬绾功鍒涗綔骞冲彴瀹屾垚,浼氬脊鍑烘祻瑙堝櫒绐楀彛;鑻ラ亣楠岃瘉鐮?闇€琛ュ皝闈㈠彲鍦ㄧ獥鍙ｉ噷鎵嬪姩澶勭悊銆傚畾鏃朵换鍔＄敱鍚庡彴寮曟搸鍒扮偣鎵ц銆?;
  // 璇勮鐩戞帶銆岀被鍨嬨€嶄笅鎷夐殢骞冲彴鏀瑰啓鏂囨
  const wk = $("w-kind");
  if (wk) {
    const cur = wk.value;
    wk.innerHTML = PLATFORM === "xhs"
      ? '<option value="auto">绫诲瀷:鑷姩璇嗗埆</option><option value="video">鍗曟潯绗旇</option><option value="user">鍒涗綔鑰呰繎鏈熺瑪璁?/option>'
      : '<option value="auto">绫诲瀷:鑷姩璇嗗埆</option><option value="video">鍗曟潯瑙嗛</option><option value="user">璐﹀彿杩戞湡浣滃搧</option>';
    if ([...wk.options].some(o => o.value === cur)) wk.value = cur;
  }
  const wl = $("w-url-label");
  if (wl) wl.textContent = PLATFORM === "xhs"
    ? "绗旇閾炬帴 / 鍒涗綔鑰呬富椤?/ xhslink 鐭摼 / id"
    : PLATFORM === "kuaishou" ? "浣滃搧閾炬帴 / 鍒涗綔鑰呬富椤?/ v.kuaishou.com 鐭摼 / id"
    : "瑙嗛閾炬帴 / 璐﹀彿涓婚〉 / sec_uid / 瑙嗛 id";
  if ($("w-url")) $("w-url").placeholder = PLATFORM === "xhs"
    ? "绗旇閾炬帴=鐩崟鏉＄瑪璁?鍒涗綔鑰呬富椤垫垨 user_id=鐩垱浣滆€呰繎鏈熺瑪璁?
    : PLATFORM === "kuaishou" ? "浣滃搧閾炬帴=鐩崟鏉′綔鍝?涓婚〉鎴?user_id=鐩垱浣滆€呰繎鏈熶綔鍝?
    : "浣滃搧閾炬帴=鐩崟鏉¤棰?涓婚〉閾炬帴鎴?sec_uid=鐩处鍙疯繎鏈熶綔鍝?;
  const ckl = $("ck-label");
  if (ckl) ckl.textContent = PLATFORM === "xhs"
    ? "瀹屾暣 Cookie(鍚?a1;鍙戝竷闇€鍒涗綔鑰呬細璇?"
    : PLATFORM === "kuaishou" ? "瀹屾暣 Cookie(鍚?userId 涓?web_st)" : "瀹屾暣 Cookie(鍚?sessionid)";
  if ($("ck-val")) $("ck-val").placeholder = PLATFORM === "xhs"
    ? "浠?creator.xiaohongshu.com 鐧诲綍鍚庡鍒跺畬鏁?Cookie"
    : PLATFORM === "kuaishou" ? "浠?www.kuaishou.com 鐧诲綍鍚庡鍒跺畬鏁?Cookie"
    : "浠庢祻瑙堝櫒寮€鍙戣€呭伐鍏峰鍒跺畬鏁?Cookie";
  applyMonitorForm();
  if ($("t-kind") && PLATFORM !== "xhs") $("t-kind").value = "creator";
  // 涓嶆敮鎸佸彂甯冪殑骞冲彴:鑻ユ鍋滃湪璇ラ潰鏉垮垯鍥炲埌鎬昏(褰撳墠涓夊钩鍙板潎鏀寔,鍏滃簳淇濈暀)
  if (!pfHasPublish(PLATFORM)) {
    const pub = document.querySelector('[data-panel="publish"]');
    if (pub && pub.style.display !== "none") switchTab("overview");
  }
  csSyncAll();   // 骞冲彴鍒囨崲鍙兘鏀逛簡涓嬫媺閫夐」/鍊?鍚屾鑷畾涔変笅鎷夋樉绀?}
function applyMonitorForm() {
  const title = $("mon-add-title");
  const lbl = $("t-url-label");
  if (PLATFORM === "douyin" || PLATFORM === "kuaishou") {
    const isKs = PLATFORM === "kuaishou";
    if (title) title.innerHTML = (isKs ? '娣诲姞鍒涗綔鑰呯洃鎺? : '娣诲姞浣滃搧鐩戞帶')
      + ' <span class="sub">鐩戞帶骞朵笅杞芥柊浣滃搧</span>';
    if (lbl) lbl.textContent = isKs ? "鍒涗綔鑰呬富椤甸摼鎺?/ 鐭摼 / user_id" : "涓婚〉閾炬帴 / 鐭摼 / sec_uid";
    $("t-url").placeholder = isKs
      ? "绮樿创蹇墜鍒涗綔鑰呬富椤甸摼鎺ャ€乿.kuaishou.com 鐭摼鎴?user_id"
      : "绮樿创鎶栭煶涓婚〉閾炬帴銆乿.douyin.com 鐭摼鎴?sec_uid";
    return;
  }
  const kind = $("t-kind") ? $("t-kind").value : "creator";
  if (kind === "keyword") {
    if (title) title.innerHTML = '娣诲姞鍏抽敭璇嶇洃鎺?<span class="sub">鐩竴涓悳绱㈣瘝鐨勬柊绗旇</span>';
    if (lbl) lbl.textContent = "鎼滅储鍏抽敭璇?;
    $("t-url").placeholder = "渚嬪:鍙ｇ孩璇曡壊 / 闇茶惀瑁呭";
  } else {
    if (title) title.innerHTML = '娣诲姞鍒涗綔鑰呯洃鎺?<span class="sub">鐩戞帶骞朵笅杞芥柊绗旇</span>';
    if (lbl) lbl.textContent = "鍒涗綔鑰呬富椤甸摼鎺?/ xhslink 鐭摼 / user_id";
    $("t-url").placeholder = "绮樿创灏忕孩涔﹀垱浣滆€呬富椤甸摼鎺ャ€亁hslink 鐭摼鎴?24 浣?user_id";
  }
}

// 鈹€鈹€鈹€ 鏍囩椤靛垏鎹?鈹€鈹€鈹€
function switchTab(name) {
  document.querySelectorAll("[data-panel]").forEach(p => { p.style.display = p.dataset.panel === name ? "" : "none"; });
  document.querySelectorAll(".navitem").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  try { localStorage.setItem("dym-tab", name); } catch (e) {}
  if (name === "hub") { refreshHubSummary(); refreshHubPanel(); }
  else stopDmStream();   // 绂诲紑鏈处鍙风鐞嗗嵆鏂紑绉佷俊瀹炴椂娴?}

// 鈹€鈹€鈹€ 鎵爜鐧诲綍(鐪熷疄娴忚鍣ㄧ獥鍙? 鈹€鈹€鈹€
let qrTimer = null;
// 鐧诲綍鍓嶉€変唬鐞?杩斿洖 "" (涓嶇敤) | "auto" | 鍏蜂綋url | null(鍙栨秷)
async function choosePreLoginProxy() {
  let opts = [];
  try { opts = await api("/api/proxies/options"); } catch (e) { }
  const options = [
    { value: "auto", label: opts.length ? "馃攢 鑷姩鍒嗛厤(鍗犵敤鏈€灏?" : "馃攢 鑷姩鍒嗛厤(姹犱负绌衡啋涓嶇敤浠ｇ悊)" },
    ...opts.map(p => ({ value: p.url, label: `${p.label} 路 ${p.status} 路 鍗犵敤${p.used_by} 路 ${p.masked}${p.enabled ? "" : " 路 宸插仠鐢?}` })),
    { value: "__custom__", label: "鉁?鎵嬪姩杈撳叆鎸囧畾浠ｇ悊鈥? },
    { value: "", label: "馃毇 涓嶇敤浠ｇ悊(璧版湰鏈虹湡瀹?IP)" },
  ];
  const v = await uiSelect({
    title: "閫夋嫨鏈鐧诲綍浣跨敤鐨勪唬鐞?,
    hint: "鏁翠釜鐧诲綍/鎵爜杩囩▼閮借蛋瀹?浠庝竴寮€濮嬪氨缁戝畾杩欐潯 IP(鏈€绋?銆?,
    options, value: "auto",
  });
  if (v === null) return null;
  if (v === "__custom__") {
    const url = await uiPrompt({
      title: "鎵嬪姩杈撳叆鎸囧畾浠ｇ悊",
      hint: "http://user:pass@host:port 鎴?socks5://host:port;瑁?ip:port 榛樿 HTTP",
      placeholder: "http://user:pass@host:port" });
    if (url === null || !url.trim()) return null;
    return url.trim();
  }
  return v;
}
function loginStartUrl(path, proxy) {
  return path + "?proxy=" + encodeURIComponent(proxy);
}
async function startLogin() {
  const proxy = await choosePreLoginProxy();
  if (proxy === null) return;
  $("cookiebox").style.display = "none";
  $("qrbox").style.display = "block";
  $("qrstatus").textContent = "姝ｅ湪鎵撳紑娴忚鍣ㄧ獥鍙ｂ€?;
  try {
    const res = await api(loginStartUrl("/api/login/browser/start", proxy), { method: "POST" });
    $("qrstatus").innerHTML = "馃獰 宸插脊鍑烘祻瑙堝櫒绐楀彛,璇峰湪<b>閭ｄ釜绐楀彛</b>閲岀偣鍑汇€岀櫥褰曘€嶅苟鐢ㄦ姈闊?App 鎵爜銆?br>瀹屾垚鍚庤繖閲屼細鑷姩鍒锋柊銆?;
    pollLogin(res.task_id);
  } catch (e) { $("qrstatus").textContent = "鍚姩澶辫触: " + e.message; toast("鐧诲綍鍚姩澶辫触:" + e.message, "err"); }
}
function pollLogin(tid) {
  clearInterval(qrTimer);
  qrTimer = setInterval(async () => {
    try {
      const res = await api("/api/login/browser/poll?task_id=" + tid);
      if (res.status === "confirmed") {
        clearInterval(qrTimer);
        $("qrstatus").textContent = "鐧诲綍鎴愬姛 鉁?" + (res.nickname || "");
        toast("鐧诲綍鎴愬姛 " + (res.nickname || ""), "ok");
        setTimeout(() => { $("qrbox").style.display = "none"; refreshAccounts(); }, 1200);
      } else if (res.status === "expired") {
        clearInterval(qrTimer); $("qrstatus").textContent = "瓒呮椂鏈櫥褰?璇烽噸璇?; toast("浜岀淮鐮佽秴鏃?璇烽噸璇?, "err");
      } else if (res.status === "error") {
        clearInterval(qrTimer); $("qrstatus").textContent = "鍑洪敊: " + (res.error || ""); toast("鐧诲綍鍑洪敊:" + (res.error || ""), "err");
      }
    } catch (e) { clearInterval(qrTimer); $("qrstatus").textContent = e.message; }
  }, 2000);
}

// 鈹€鈹€鈹€ 鍒涗綔鑰呯櫥褰?鑷湁璐﹀彿璇勮妯″紡鐢? 鈹€鈹€鈹€
async function startCreatorLogin() {
  const proxy = await choosePreLoginProxy();
  if (proxy === null) return;
  $("cookiebox").style.display = "none";
  $("qrbox").style.display = "block";
  $("qrstatus").textContent = "姝ｅ湪鎵撳紑鍒涗綔涓績绐楀彛鈥?;
  try {
    const res = await api(loginStartUrl("/api/login/creator/start", proxy), { method: "POST" });
    $("qrstatus").innerHTML = "馃獰 宸插脊鍑?b>鍒涗綔涓績</b>绐楀彛,璇峰湪閭ｄ釜绐楀彛閲屾壂鐮佺櫥褰曚綘鐨勬姈闊冲彿銆?br>鐧诲綍鎬佸悓鏍峰彲鐢ㄤ簬鍏紑鎶撳彇銆?;
    pollLogin(res.task_id);
  } catch (e) { $("qrstatus").textContent = "鍚姩澶辫触: " + e.message; toast("鍒涗綔鑰呯櫥褰曞惎鍔ㄥけ璐?" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 灏忕孩涔︽壂鐮佺櫥褰?鈹€鈹€鈹€
async function startXhsLogin() {
  const proxy = await choosePreLoginProxy();
  if (proxy === null) return;
  $("cookiebox").style.display = "none";
  $("qrbox").style.display = "block";
  $("qrstatus").textContent = "姝ｅ湪鎵撳紑灏忕孩涔︾獥鍙ｂ€?;
  try {
    const res = await api(loginStartUrl("/api/login/xhs/start", proxy), { method: "POST" });
    $("qrstatus").innerHTML = "馃獰 宸插脊鍑?b>灏忕孩涔?/b>绐楀彛,鎵爜鐧诲綍鍚庝細<b>鑷姩璺冲埌鍒涗綔骞冲彴</b>:<br>路 鍙湅/璇勮/棰勮 鈫?鎵畬 www 鍗冲彲,涓嶇敤绠″垱浣滃钩鍙?<br>路 杩樿<b>鍙戝竷</b> 鈫?鑻ュ垱浣滃钩鍙版彁绀虹櫥褰?鍚屾剰,璇峰湪绐楀彛閲?b>瀹屾垚瀹?/b>(鎷垮埌鍚庝細鑷姩鏀跺熬)銆?br>鏁翠釜杩囩▼<b>鍒€ョ潃鍏崇獥鍙?/b>,瀹屾垚鍚庤繖閲岃嚜鍔ㄥ埛鏂般€?;
    pollLogin(res.task_id);
  } catch (e) { $("qrstatus").textContent = "鍚姩澶辫触: " + e.message; toast("灏忕孩涔︾櫥褰曞惎鍔ㄥけ璐?" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 灏忕孩涔﹀垱浣滆€呯櫥褰?鍙戝竷鐢? 鈹€鈹€鈹€
async function startXhsCreatorLogin() {
  const proxy = await choosePreLoginProxy();
  if (proxy === null) return;
  $("cookiebox").style.display = "none";
  $("qrbox").style.display = "block";
  $("qrstatus").textContent = "姝ｅ湪鎵撳紑灏忕孩涔﹀垱浣滃钩鍙扮獥鍙ｂ€?;
  try {
    const res = await api(loginStartUrl("/api/login/xhs-creator/start", proxy), { method: "POST" });
    $("qrstatus").innerHTML = "馃獰 宸插脊鍑?b>灏忕孩涔﹀垱浣滃钩鍙?/b>绐楀彛,璇锋壂鐮佺櫥褰?姝ょ櫥褰曟€佺敤浜?b>鍙戝竷</b>)銆?br>鐧诲綍鎴愬姛鍚庣◢绛変竴涓ょ鍐嶅叧绐楀彛銆?;
    pollLogin(res.task_id);
  } catch (e) { $("qrstatus").textContent = "鍚姩澶辫触: " + e.message; toast("鍒涗綔鑰呯櫥褰曞惎鍔ㄥけ璐?" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 蹇墜鎵爜鐧诲綍 鈹€鈹€鈹€
async function startKsLogin() {
  const proxy = await choosePreLoginProxy();
  if (proxy === null) return;
  $("cookiebox").style.display = "none";
  $("qrbox").style.display = "block";
  $("qrstatus").textContent = "姝ｅ湪鎵撳紑蹇墜绐楀彛鈥?;
  try {
    const res = await api(loginStartUrl("/api/login/kuaishou/start", proxy), { method: "POST" });
    $("qrstatus").innerHTML = "馃獰 宸插脊鍑?b>蹇墜</b>绐楀彛,璇峰湪閭ｄ釜绐楀彛閲岀偣鍑汇€岀櫥褰曘€嶅苟鐢?b>蹇墜 App</b> 鎵爜銆?br>瀹屾垚鍚庤繖閲屼細鑷姩鍒锋柊銆?;
    pollLogin(res.task_id);
  } catch (e) { $("qrstatus").textContent = "鍚姩澶辫触: " + e.message; toast("蹇墜鐧诲綍鍚姩澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 蹇墜鍒涗綔鑰呯櫥褰?鍙戝竷鐢? 鈹€鈹€鈹€
async function startKsCreatorLogin() {
  const proxy = await choosePreLoginProxy();
  if (proxy === null) return;
  $("cookiebox").style.display = "none";
  $("qrbox").style.display = "block";
  $("qrstatus").textContent = "姝ｅ湪鎵撳紑蹇墜鍒涗綔骞冲彴绐楀彛鈥?;
  try {
    const res = await api(loginStartUrl("/api/login/kuaishou-creator/start", proxy), { method: "POST" });
    $("qrstatus").innerHTML = "馃獰 宸插脊鍑?b>蹇墜鍒涗綔骞冲彴</b>绐楀彛(cp.kuaishou.com),璇锋壂鐮佺櫥褰?姝ょ櫥褰曟€佺敤浜?b>鍙戝竷</b>)銆?br>鐧诲綍鎴愬姛鍚庣◢绛変竴涓ょ鍐嶅叧绐楀彛銆?;
    pollLogin(res.task_id);
  } catch (e) { $("qrstatus").textContent = "鍚姩澶辫触: " + e.message; toast("鍒涗綔鑰呯櫥褰曞惎鍔ㄥけ璐?" + e.message, "err"); }
}

// 鈹€鈹€鈹€ Cookie 鐧诲綍 鈹€鈹€鈹€
function toggleCookie() {
  $("qrbox").style.display = "none";
  clearInterval(qrTimer);
  const b = $("cookiebox");
  b.style.display = b.style.display === "none" ? "block" : "none";
}
async function saveCookie() {
  const cookie = $("ck-val").value.trim();
  if (!cookie) { toast("璇峰厛绮樿创 Cookie", "err"); return; }
  try {
    await api("/api/login/cookie", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookie, nickname: $("ck-nick").value.trim(), platform: PLATFORM }),
    });
    $("ck-val").value = ""; $("cookiebox").style.display = "none";
    toast("Cookie 宸蹭繚瀛?, "ok"); refreshAccounts();
  } catch (e) { toast("淇濆瓨澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 璐﹀彿 鈹€鈹€鈹€
let ACCOUNTS = [];
let MONITORS = [], WATCHES = [], CONTENT_SRC = "", COMMENT_SRC = "", CONTENTS = [];
function monitorName(t) { return t.target_kind === "keyword" ? "#" + t.keyword : (t.nickname || (t.sec_uid || "").slice(0, 12)); }
function watchName(w) { return w.title || w.aweme_id || (w.sec_uid || "").slice(0, 12); }
function monitorById(id) { return MONITORS.find(t => t.id === id); }
function watchById(id) { return WATCHES.find(w => w.id === id); }
function srcChip(name) { return `<span class="src-chip" title="鏉ユ簮鐩戞帶:${esc(name)}">${ic("i-target")}${esc(name)}</span>`; }
function populateContentSrc() {
  const sel = $("content-src"); if (!sel) return;
  sel.innerHTML = `<option value="">鍏ㄩ儴鏉ユ簮</option>` +
    MONITORS.map(t => `<option value="${t.id}">${esc(monitorName(t))}</option>`).join("");
  if (!MONITORS.some(t => String(t.id) === CONTENT_SRC)) CONTENT_SRC = "";
  sel.value = CONTENT_SRC;
}
function populateCommentSrc() {
  const sel = $("comment-src"); if (!sel) return;
  sel.innerHTML = `<option value="">鍏ㄩ儴鏉ユ簮</option>` +
    WATCHES.map(w => `<option value="${w.id}">${esc(watchName(w))}</option>`).join("");
  if (!WATCHES.some(w => String(w.id) === COMMENT_SRC)) COMMENT_SRC = "";
  sel.value = COMMENT_SRC;
}
function onContentSrc() { CONTENT_SRC = $("content-src").value; selContent.clear(); refreshContents(); }
function onCommentSrc() { COMMENT_SRC = $("comment-src").value; selComment.clear(); refreshComments(); }
async function refreshAccounts() {
  const accs = await api("/api/accounts?platform=" + PLATFORM);
  ACCOUNTS = accs;
  $("stat-acc").textContent = accs.length;
  $("acc-table").querySelector("tbody").innerHTML = accs.map(a => {
    const isXhs = a.platform === "xhs";
    const isKs = a.platform === "kuaishou";
    const idName = isXhs ? "灏忕孩涔﹀彿 " : isKs ? "蹇墜鍙?" : "鎶栭煶鍙?";
    const secName = (isXhs || isKs) ? "user_id " : "sec_uid ";
    const idline = [
      a.douyin_id ? idName + esc(a.douyin_id) : null,
      a.sec_uid ? secName + esc(a.sec_uid).slice(0, 16) + "鈥? : null,
    ].filter(Boolean).join(" 路 ");
    const detail = [
      a.aweme_count ? a.aweme_count + (isXhs ? " 绗旇" : " 浣滃搧") : null,
      a.follower_count ? fmtNum(a.follower_count) + " 绮変笣" : null,
      isXhs ? "鎵爜鐧诲綍" : (a.login_type === "cookie" ? "Cookie 鐧诲綍" : "鎵爜鐧诲綍"),
      a.has_storage ? "鐧诲綍鎬佹湁鏁? : "鏃犵櫥褰曟€?,
      `琚?${a.monitor_count} 涓洃鎺т娇鐢╜,
      a.created_at ? "鐧诲綍浜?" + new Date(a.created_at + "Z").toLocaleString() : null,
    ].filter(Boolean).join(" 路 ");
    const pill = isXhs
      ? (a.has_creator
          ? `<span class="pill active has-ic ic-text" title="宸插畬鎴愬垱浣滆€呯櫥褰?鍙彂甯?>${ic("i-film")}鍒涗綔鑰呭彿</span>`
          : `<span class="pill bare has-ic ic-text" title="浠呯洃鎺?璇诲彇,鏈巿鏉冨垱浣滃钩鍙?涓嶈兘鍙戝竷">${ic("i-eye")}璇诲彇鍙?/span>`)
      : `<span class="pill ${a.has_creator ? "active" : "bare"} has-ic ic-text" title="${a.has_creator ? "鍒涗綔鑰呯櫥褰?鍙敤浜庡垱浣滀腑蹇冭瘎璁烘ā寮?涔熷彲鎶撳彇" : "鏅€氭姄鍙栬处鍙?}">${a.has_creator ? ic("i-film") + "鍒涗綔鑰呭彿" : ic("i-card") + "鎶撳彇鍙?}</span>`;
    // 浠ｇ悊(椋庢帶闅旂):鏈変唬鐞嗘樉绀鸿劚鏁忓湴鍧€ + 鐘舵€?鏃犱唬鐞嗛珮浜彁閱?澶氳处鍙峰悓 IP 鏈夊叧鑱旈闄?
    const pxText = { ok: "浠ｇ悊姝ｅ父", bad: "浠ｇ悊涓嶅彲鐢?, unknown: "浠ｇ悊鏈祴" };
    const pxCls = a.proxy_status === "ok" ? "active" : a.proxy_status === "bad" ? "invalid" : "bare";
    const proxyLine = a.has_proxy
      ? `<div class="mut" style="font-size:11px;margin-top:2px">浠ｇ悊 <code>${esc(a.proxy)}</code> <span class="pill ${pxCls}">${pxText[a.proxy_status] || a.proxy_status}</span></div>`
      : `<div class="ic-text" style="font-size:11px;margin-top:2px;color:var(--warn)">${ic("i-info")}鏈厤缃唬鐞?璧版湰鏈虹湡瀹?IP,澶氳处鍙锋湁鍏宠仈椋庨櫓)</div>`;
    return `<tr>
      <td>
        <div class="user-cell">
          ${a.avatar ? `<img class="avatar" src="${a.avatar}" alt="" referrerpolicy="no-referrer">` : ""}
          <div>
            <div><b>${esc(a.nickname)}</b> ${pill}</div>
            ${idline ? `<div class="mut" style="font-size:11px;margin-top:2px">${idline}</div>` : ""}
            <div class="mut" style="font-size:11px;margin-top:2px">${esc(detail)}</div>
            ${proxyLine}
          </div>
        </div>
      </td>
      <td><span class="pill ${a.status}">${a.status === "invalid" ? "鐧诲綍澶辨晥" : "姝ｅ父"}</span></td>
      <td class="acttd">
        ${a.status === "invalid"
          ? `<button class="sm" style="background:var(--warn);border-color:transparent;color:#1a1a1a" onclick="relogin(${a.id})">閲嶆柊鐧诲綍</button>`
          : `<button class="ghost sm" onclick="relogin(${a.id})" title="${isXhs ? "閲嶇櫥鍙崌绾у垱浣滃钩鍙版巿鏉?鍙戝竷闇€瑕?" : "閲嶆柊鎵爜鐧诲綍"}">閲嶆柊鐧诲綍</button>`}
        <button class="ghost sm" onclick="refreshProfile(${a.id})">鍒锋柊璧勬枡</button>
        <button class="ghost sm" onclick="openAccountHub(${a.id})" title="鏌ョ湅璇ヨ处鍙风殑浣滃搧 / 鍏虫敞 / 绮変笣 / 绉佷俊">鏁版嵁</button>
        <button class="ghost sm" onclick="openAccountBrowser(${a.id})" title="鐢ㄨ璐﹀彿鐧诲綍鎬佸脊鍑虹湡瀹炴祻瑙堝櫒绐楀彛,鎵嬪姩鏀跺彂绉佷俊 / 缁存姢 / 鎶撴帴鍙?鍏崇獥鍗充繚瀛?">鎵撳紑娴忚鍣?/button>
        <button class="ghost sm" onclick="setProxy(${a.id})" title="璁剧疆/鍒嗛厤璇ヨ处鍙蜂笓灞炰唬鐞?闃插璐﹀彿鍏宠仈)">浠ｇ悊</button>
        ${a.has_proxy ? `<button class="ghost sm" onclick="testProxy(${a.id})" title="缁忚浠ｇ悊瀹炶繛涓€娆?楠岃瘉鍙敤">娴嬩唬鐞?/button>` : ""}
        <button class="ghost sm" onclick="delAccount(${a.id})" aria-label="鍒犻櫎璐﹀彿">鍒犻櫎</button>
      </td>
    </tr>`;
  }).join("") || empty(3, "杩樻病鏈夎处鍙?, "i-user", "鐢ㄤ笂鏂规寜閽壂鐮佺櫥褰?鎴栫矘璐?Cookie 娣诲姞涓€涓处鍙?);
  if ($("tb-acc")) $("tb-acc").textContent = accs.length;
  populateAccountSelect();
  populateWatchAccount();
  populatePubAcc();
  populateAcAccount();
  populateHubAccounts();
  const at = document.querySelector('.navitem.active');
  if (at && at.dataset.tab === "hub") refreshHubPanel();
}

// 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?璐﹀彿绠＄悊(鐙珛闈㈡澘:鎴戠殑浣滃搧 / 鍏虫敞 / 绮変笣 / 绉佷俊)鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺?// 褰撳墠鎿嶄綔鐨勮处鍙?id 鈥斺€?鎸夊钩鍙板悇璁板悇鐨?鍒囧钩鍙颁笉涓插彿銆佷笉涓叉暟
let HUB_ACC = "";
let HUB_TAB = (() => { try { return localStorage.getItem("dym-hubtab") || "myworks"; } catch (e) { return "myworks"; } })();
let DM_CONV = null;     // 褰撳墠鎵撳紑鐨勪細璇?id
let DM_CONVS = [];      // 浼氳瘽缂撳瓨(渚涘彂閫佹椂鍙?peer 淇℃伅)
function hubAccKey() { return "dym-hubacc:" + PLATFORM; }
function loadHubAcc() { try { HUB_ACC = localStorage.getItem(hubAccKey()) || ""; } catch (e) { HUB_ACC = ""; } }
function setHubAcc(id) { HUB_ACC = String(id || ""); try { localStorage.setItem(hubAccKey(), HUB_ACC); } catch (e) {} if (HUB_TAB === "dm") startDmStream(); }

// 鐢ㄨ璐﹀彿鐧诲綍鎬佸脊鍑虹湡瀹炴祻瑙堝櫒绐楀彛,鐣欑粰鐢ㄦ埛鎵嬪姩鎿嶄綔(鏀跺彂绉佷俊 / 缁存姢 / F12 鎶撴帴鍙?
async function openAccountBrowser(id) {
  await withBusy(evtBtn(), "鎵撳紑涓?, async () => {
    try {
      await api("/api/accounts/" + id + "/open-browser", { method: "POST" });
      toast("宸插脊鍑鸿璐﹀彿娴忚鍣ㄧ獥鍙?鐢ㄥ畬璇峰叧绐?鍏崇獥鍗充繚瀛樼櫥褰曟€?銆傜獥鍙ｅ紑鐫€鏃惰璐﹀彿鍚庡彴鍚屾浼氭殏鍋?, "ok", 6000);
    } catch (e) { toast("鎵撳紑澶辫触:" + e.message, "err"); }
  });
}

// 绉佷俊椤?鐢ㄥ綋鍓嶉€変腑璐﹀彿鎵撳紑鐪熷疄娴忚鍣ㄦ墜鍔ㄦ敹鍙?鎶栭煶绉佷俊璧?WS,鍙兘杩欐牱)
function openHubAccountBrowser() {
  if (!HUB_ACC) { toast("璇峰厛閫夋嫨璐﹀彿", "err"); return; }
  openAccountBrowser(+HUB_ACC);
}

// 浠庛€岃处鍙枫€嶉潰鏉挎煇琛岃烦杞煡鐪嬭璐﹀彿鐨勬湰璐﹀彿鏁版嵁(浣滃搧/鍏虫敞/绮変笣/绉佷俊)
function openAccountHub(id) {
  setHubAcc(id);
  const s = $("hub-acc"); if (s) { s.value = HUB_ACC; if (s._csSync) s._csSync(); }
  DM_CONV = null;
  refreshHubSummary();
  switchTab("hub");
  switchHubTab("myworks");   // 榛樿钀藉埌銆屾垜鐨勪綔鍝併€?鍙啀鍒囧叧娉?绮変笣/绉佷俊
}

function populateHubAccounts() {
  const sel = $("hub-acc"); if (!sel) return;
  const list = ACCOUNTS;
  loadHubAcc();   // 璐﹀彿鎸夊钩鍙板悇璁板悇鐨?鍏堝彇褰撳墠骞冲彴涓婃閫変腑鐨?  if (!list.some(a => String(a.id) === HUB_ACC)) setHubAcc(list.length ? list[0].id : "");
  sel.innerHTML = list.length
    ? list.map(a => `<option value="${a.id}">${esc(a.nickname || ("璐﹀彿#" + a.id))}${a.status === "invalid" ? " 路 鐧诲綍澶辨晥" : ""}</option>`).join("")
    : `<option value="">鏃犲凡鐧诲綍璐﹀彿</option>`;
  sel.value = HUB_ACC;
  if (sel._csSync) sel._csSync();
  refreshHubSummary();   // 璐﹀彿鍒楄〃/閫変腑璐﹀彿鍙樹簡(鍚垏骞冲彴)鈫?绔嬪埢鍒锋柊璁℃暟寰界珷
}
function onHubAcc() {
  const sel = $("hub-acc"); if (!sel) return;
  setHubAcc(sel.value);
  DM_CONV = null;
  refreshHubSummary();
  refreshHubPanel();
}
// 闈㈡澘鍐呭瓙鏍囩(鎴戠殑浣滃搧/鍏虫敞/绮変笣/绉佷俊)鍒囨崲
function switchHubTab(name) {
  HUB_TAB = name;
  try { localStorage.setItem("dym-hubtab", name); } catch (e) {}
  document.querySelectorAll("[data-hubpanel]").forEach(p => { p.style.display = p.dataset.hubpanel === name ? "" : "none"; });
  document.querySelectorAll("[data-hubtab]").forEach(t => t.classList.toggle("active", t.dataset.hubtab === name));
  if (name === "dm") startDmStream(); else stopDmStream();
  refreshHubPanel();
}
// 璁℃暟寰界珷:绾煡搴撴眹鎬?杩涢潰鏉?鎹㈣处鍙?鍒囧钩鍙板嵆鍒锋柊,涓嶇敤鐐硅繘瀛愰〉鎵嶆湁鏁?async function refreshHubSummary() {
  const ids = { works: "hb-myworks", following: "hb-following", fans: "hb-fans", dm: "hb-dm" };
  const setAll = r => Object.entries(ids).forEach(([k, i]) => { const el = $(i); if (el) el.textContent = (r && r[k]) || 0; });
  if (!HUB_ACC) { setAll(null); return; }
  try { setAll(await api("/api/hub/summary?account_id=" + HUB_ACC)); }
  catch (e) { setAll(null); }
}
function refreshHubPanel() {
  const active = document.querySelector('.navitem.active');
  if (!active || active.dataset.tab !== "hub") return;
  if (HUB_TAB === "myworks") refreshMyWorks();
  else if (HUB_TAB === "following") refreshFollows("following");
  else if (HUB_TAB === "fans") refreshFollows("fan");
  else if (HUB_TAB === "dm") { refreshDmConvs(); startDmStream(); }
}
function hubGridEmpty(text, sub = "") {
  return `<div class="empty" style="width:100%;column-span:all;break-inside:avoid"><div class="empty-ic">${ic("i-inbox")}</div>` +
    `<div class="empty-t">${esc(text)}</div>${sub ? `<div class="empty-sub">${esc(sub)}</div>` : ""}</div>`;
}

// 鈹€鈹€ 鎴戠殑浣滃搧 鈹€鈹€
async function refreshMyWorks() {
  const grid = $("mw-grid"); if (!grid) return;
  if (!HUB_ACC) { grid.innerHTML = hubGridEmpty("璇峰厛閫夋嫨宸茬櫥褰曡处鍙?); return; }
  try {
    const list = await api("/api/account-works?account_id=" + HUB_ACC);
    if ($("hb-myworks")) $("hb-myworks").textContent = list.length;
    grid.innerHTML = list.length ? list.map(workCard).join("")
      : hubGridEmpty("鏆傛棤浣滃搧", "鐐瑰彸涓娿€屽悓姝ヤ綔鍝併€嶆姄鍙栨湰璐﹀彿宸插彂甯冧綔鍝?);
  } catch (e) { grid.innerHTML = hubGridEmpty("鍔犺浇澶辫触:" + e.message); }
}
function workLink(platform, id) {
  id = encodeURIComponent(id);
  if (platform === "xhs") return "https://www.xiaohongshu.com/explore/" + id;
  if (platform === "kuaishou") return "https://www.kuaishou.com/short-video/" + id;
  return "https://www.douyin.com/video/" + id;
}
function openWork(platform, id) { try { window.open(workLink(platform, id), "_blank", "noopener"); } catch (e) {} }
function workCard(w) {
  const oc = `onclick="openWork('${esc(w.platform)}','${esc(w.item_id).replace(/'/g, "\\'")}')"`;
  // 鍥捐鏃跺洖閫€鍗犱綅(onerror 鎹㈡垚鐏板簳鍥炬爣),閬垮厤缁濆瑙掓爣鍘嬪埌鏍囬
  const cover = w.cover_url
    ? `<img class="ncard-cover" src="${w.cover_url}" referrerpolicy="no-referrer" loading="lazy" alt="" ${oc}
         onerror="this.onerror=null;this.removeAttribute('src');this.style.visibility='hidden'">`
    : `<div class="ncard-cover ph" ${oc}>${ic("i-image")}</div>`;
  const title = esc(w.desc || "鏃犳弿杩?);
  return `<div class="ncard">
    ${cover}
    <span class="ncard-type">${ic(w.media_type === "video" ? "i-play" : "i-image")}${w.media_type === "video" ? "瑙嗛" : "鍥炬枃"}</span>
    <div class="ncard-body">
      <p class="ncard-title" style="cursor:pointer" title="${title}" ${oc}>${title}</p>
      <div class="ncard-foot">
        <span class="metric like">${ic("i-heart")}${fmtNum(w.like_count)}</span>
        <span class="metric">${ic("i-msg")}${fmtNum(w.comment_count)}</span>
        ${w.play_count ? `<span class="metric">${ic("i-play")}${fmtNum(w.play_count)}</span>` : ""}
        <span class="like">${fmtTime(w.create_time)}</span>
      </div>
      <div class="ncard-actions">
        <button class="ghost sm" onclick="openWorkComments(${w.id},'${esc(w.platform)}','${title.replace(/'/g, "\\'")}')">${ic("i-msg")}璇勮</button>
      </div>
    </div>
  </div>`;
}
async function syncMyWorks() {
  if (!HUB_ACC) { toast("璇峰厛閫夋嫨璐﹀彿", "err"); return; }
  await withBusy(evtBtn(), "鍚屾涓?, async () => {
    try { const r = await api("/api/accounts/" + HUB_ACC + "/works/sync", { method: "POST" }); toast(`鍚屾瀹屾垚:鎶撳埌 ${r.fetched} 鏉?鏂板 ${r.added}`, "ok"); }
    catch (e) { toast("鍚屾澶辫触:" + e.message, "err"); }
  });
  refreshMyWorks();
}

// 鈹€鈹€ 浣滃搧璇勮(寮圭獥:鎶栭煶鐩磋繛鍒嗛〉 / 灏忕孩涔﹀鎴风 / 蹇墜鎷︽埅,钀藉簱鍚庡睍绀?鈹€鈹€
let WC_WORK = null;   // 褰撳墠鏌ョ湅璇勮鐨勪綔鍝?{id, platform, title}
async function openWorkComments(workId, platform, title) {
  WC_WORK = { id: workId, platform, title: title || "" };
  $("wc-title").textContent = "璇勮 路 " + (title || "");
  $("wc-count").textContent = "鍔犺浇涓€?;
  $("wc-list").innerHTML = "";
  $("wcmodal").style.display = "flex";
  await loadWorkComments();
}
function hideWorkComments() { $("wcmodal").style.display = "none"; WC_WORK = null; }
async function loadWorkComments() {
  if (!WC_WORK) return;
  try {
    const list = await api("/api/account-works/" + WC_WORK.id + "/comments");
    $("wc-count").textContent = list.length ? (list.length + " 鏉?鍚洖澶?") : "鏆傛棤璇勮";
    $("wc-list").innerHTML = list.length ? list.map(cmtRow).join("")
      : `<div class="empty" style="padding:26px"><div class="empty-ic">${ic("i-msg")}</div><div class="empty-t">杩樻病鎶撳埌璇勮</div><div class="empty-sub">鐐瑰彸涓娿€屾姄鍙栬瘎璁恒€嶇敤璇ヨ处鍙风櫥褰曟€佹媺鍙?/div></div>`;
  } catch (e) {
    $("wc-count").textContent = "鈥?;
    $("wc-list").innerHTML = `<div class="empty" style="padding:24px"><div class="empty-t">鍔犺浇澶辫触:${esc(e.message)}</div></div>`;
  }
}
function cmtRow(c) {
  return `<div class="wc-item${c.is_reply ? " reply" : ""}">
    <div class="wc-head"><b>${esc(c.user_nickname || "鍖垮悕")}</b><span class="wc-time">${fmtTime(c.create_time)}</span></div>
    <div class="wc-text">${esc(c.text || "")}</div>
    <div class="wc-meta">${ic("i-heart")}${fmtNum(c.like_count)}${c.is_reply ? " 路 鍥炲" : ""}</div>
  </div>`;
}
async function syncWorkComments() {
  if (!WC_WORK) return;
  await withBusy(evtBtn(), "鎶撳彇涓?, async () => {
    try { const r = await api("/api/account-works/" + WC_WORK.id + "/comments/sync", { method: "POST" }); toast(`鎶撳埌 ${r.fetched} 鏉?鏂板 ${r.added}`, "ok"); }
    catch (e) { toast("鎶撳彇澶辫触:" + e.message, "err"); }
  });
  await loadWorkComments();
}

// 鈹€鈹€ 鍏虫敞 / 绮変笣 鈹€鈹€
// 灏忕孩涔︾綉椤电涓嶆彁渚涘叧娉?绮変笣鍒楄〃(App 涓撳睘:瀹炴祴鏃犳帴鍙ｃ€佹棤寮瑰眰),涓嶅仛鏃犵敤鐨勫悓姝?const XHS_FOLLOW_NA = "灏忕孩涔︾綉椤电涓嶆彁渚涘叧娉?/ 绮変笣鍒楄〃(浠?App 鍙),鏃犳硶鍚屾銆傛姈闊?/ 蹇墜鍙甯稿悓姝ャ€?;
async function refreshFollows(direction) {
  const tbody = $(direction === "fan" ? "fans-table" : "following-table"); if (!tbody) return;
  if (PLATFORM === "xhs") {
    const badge = $(direction === "fan" ? "hb-fans" : "hb-following");
    if (badge) badge.textContent = "鈥?;
    tbody.innerHTML = empty(3, direction === "fan" ? "绮変笣鍒楄〃缃戦〉绔笉鍙敤" : "鍏虫敞鍒楄〃缃戦〉绔笉鍙敤",
      "i-info", XHS_FOLLOW_NA);
    return;
  }
  if (!HUB_ACC) { tbody.innerHTML = empty(3, "璇峰厛閫夋嫨宸茬櫥褰曡处鍙?, "i-user"); return; }
  try {
    const list = await api(`/api/follows?account_id=${HUB_ACC}&direction=${direction}`);
    const badge = $(direction === "fan" ? "hb-fans" : "hb-following");
    if (badge) badge.textContent = list.length;
    tbody.innerHTML = list.length ? list.map(f => followRow(f, direction)).join("")
      : empty(3, direction === "fan" ? "鏆傛棤绮変笣鏁版嵁" : "鏆傛棤鍏虫敞鏁版嵁", "i-user", "鐐瑰彸涓娿€屽悓姝ャ€嶆姄鍙?);
  } catch (e) { tbody.innerHTML = empty(3, "鍔犺浇澶辫触:" + e.message, "i-info"); }
}
function followRow(f, direction) {
  const rel = f.is_mutual ? `<span class="pill active bare">浜掔浉鍏虫敞</span>`
    : f.is_following ? `<span class="pill bare">宸插叧娉?/span>`
      : `<span class="pill bare" style="color:var(--mut)">鏈叧娉?/span>`;
  const act = f.is_following
    ? `<button class="ghost sm" onclick="actFollow('unfollow',${f.id})">鍙栧叧</button>`
    : `<button class="ghost sm" onclick="actFollow('follow',${f.id})">鍥炲叧</button>`;
  return `<tr>
    <td><div class="fu-cell">
      ${f.avatar ? `<img class="avatar" src="${f.avatar}" referrerpolicy="no-referrer" alt="">` : `<span class="avatar"></span>`}
      <div><div><b>${esc(f.nickname)}</b></div>${f.signature ? `<div class="fu-sign">${esc(f.signature)}</div>` : ""}</div>
    </div></td>
    <td>${rel}</td>
    <td class="acttd">${act}</td>
  </tr>`;
}
async function syncFollows(direction) {
  if (PLATFORM === "xhs") { toast(XHS_FOLLOW_NA, "info", 6000); return; }
  if (!HUB_ACC) { toast("璇峰厛閫夋嫨璐﹀彿", "err"); return; }
  await withBusy(evtBtn(), "鍚屾涓?, async () => {
    try { const r = await api(`/api/accounts/${HUB_ACC}/follows/sync?direction=${direction}`, { method: "POST" }); toast(`鍚屾瀹屾垚:鎶撳埌 ${r.fetched} 鏉?鏂板 ${r.added}`, "ok"); }
    catch (e) { toast("鍚屾澶辫触:" + e.message, "err"); }
  });
  refreshFollows(direction);
}
async function actFollow(action, edgeId) {
  // 鍙栬琛?follow 杈圭殑鐩爣淇℃伅(浠庡凡娓叉煋鍒楄〃閲屾嬁)
  const dir = HUB_TAB === "fans" ? "fan" : "following";
  let edge = null;
  try { const list = await api(`/api/follows?account_id=${HUB_ACC}&direction=${dir}`); edge = list.find(x => x.id === edgeId); } catch (e) {}
  if (!edge) { toast("鎵句笉鍒拌鐢ㄦ埛,璇烽噸鏂板悓姝?, "err"); return; }
  const label = action === "unfollow" ? "鍙栧叧" : "鍥炲叧";
  if (!await uiConfirm({ title: label + "纭", message: `纭瀵广€?{edge.nickname}銆?{label}?灏嗘墦寮€娴忚鍣ㄧ獥鍙ｆ墽琛?鏈夊ご绐楀彛,鍙墜鍔ㄨ繃楠岃瘉鐮?銆俙, danger: action === "unfollow" })) return;
  await withBusy(evtBtn(), label + "涓?, async () => {
    try {
      await api("/api/account-actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: +HUB_ACC, action, target_uid: edge.uid, target_sec_uid: edge.sec_uid || "", target_nick: edge.nickname, run_now: true })
      });
      toast(label + "鎴愬姛", "ok");
    } catch (e) { toast(label + "澶辫触:" + e.message, "err"); }
  });
  refreshFollows(dir);
}

// 鈹€鈹€ 绉佷俊 鈹€鈹€
// 鈹€鈹€鈹€ 绉佷俊瀹炴椂鎺ユ敹(SSE):杩?DM 闈㈡澘璁㈤槄,鏂版秷鎭嵆鏃跺埛鏂?绂诲紑鏂紑 鈹€鈹€鈹€
let DM_SSE = null, DM_SSE_ACC = "";
function startDmStream() {
  // 骞傜瓑:鍚岃处鍙峰凡杩炲氨涓嶉噸杩?閬垮厤姣忔闈㈡澘鍒锋柊/鏀跺埌娑堟伅閮芥柇寮€閲嶆潵)
  if (DM_SSE && DM_SSE_ACC === HUB_ACC && DM_SSE.readyState !== 2) return;
  stopDmStream();
  if (!HUB_ACC || PLATFORM !== "douyin") return;
  DM_SSE_ACC = HUB_ACC;
  try {
    DM_SSE = new EventSource(`/api/dm/stream?account_id=${HUB_ACC}`);
    DM_SSE.onmessage = (e) => {
      let evt; try { evt = JSON.parse(e.data); } catch (_) { return; }
      if (!evt || !evt.conv_id) return;
      // 褰撳墠鎵撳紑鐨勪細璇?瀹炴椂鍒锋柊绾跨▼ + 鏍囪宸茶(涓嶈绾㈢偣鍐掑嚭鏉?;鍚﹀垯鍙埛鍒楄〃(浼氭湁绾㈢偣)
      if (evt.conv_id === DM_CONV) { refreshDmMessages(); markDmRead(evt.conv_id); }
      else refreshDmConvs();
    };
    DM_SSE.onerror = () => { /* EventSource 鑷甫閲嶈繛 */ };
  } catch (_) {}
}
function stopDmStream() { if (DM_SSE) { try { DM_SSE.close(); } catch (_) {} DM_SSE = null; DM_SSE_ACC = ""; } }

async function refreshDmConvs() {
  const box = $("dm-convs"); if (!box) return;
  if (!HUB_ACC) { box.innerHTML = `<div class="empty" style="padding:24px"><div class="empty-t">璇峰厛閫夋嫨璐﹀彿</div></div>`; return; }
  try {
    const list = await api("/api/dm/conversations?account_id=" + HUB_ACC);
    DM_CONVS = list;
    if ($("hb-dm")) $("hb-dm").textContent = list.length;
    box.innerHTML = list.length ? list.map(convRow).join("")
      : `<div class="empty" style="padding:24px"><div class="empty-ic">${ic("i-send")}</div><div class="empty-t">鏆傛棤浼氳瘽</div><div class="empty-sub">鐐瑰彸涓娿€屽悓姝ョ淇°€?/div></div>`;
    if (DM_CONV) { const el = box.querySelector(`.dm-conv[data-conv="${cssAttr(DM_CONV)}"]`); if (el) el.classList.add("active"); }
  } catch (e) { box.innerHTML = `<div class="empty" style="padding:24px"><div class="empty-t">鍔犺浇澶辫触:${esc(e.message)}</div></div>`; }
}
function cssAttr(s) { return (s || "").toString().replace(/"/g, '\\"'); }
function convRow(c) {
  return `<div class="dm-conv" data-conv="${esc(c.conv_id)}" onclick="openDmConv('${esc(c.conv_id).replace(/'/g, "\\'")}')">
    ${c.peer_avatar ? `<img class="avatar" src="${c.peer_avatar}" referrerpolicy="no-referrer" alt="">` : `<span class="avatar"></span>`}
    <div class="meta"><b>${esc(c.peer_nickname)}</b><div class="last">${esc(c.last_text || "")}</div></div>
    ${c.unread_count ? `<span class="unread">${c.unread_count}</span>` : ""}
  </div>`;
}
async function syncDm() {
  if (!HUB_ACC) { toast("璇峰厛閫夋嫨璐﹀彿", "err"); return; }
  await withBusy(evtBtn(), "鍚屾涓?, async () => {
    try { const r = await api("/api/accounts/" + HUB_ACC + "/dm/sync", { method: "POST" }); toast(`鍚屾瀹屾垚:鎶撳埌 ${r.fetched} 涓細璇?鏂板 ${r.added}`, "ok"); }
    catch (e) { toast("鍚屾澶辫触:" + e.message, "err"); }
  });
  refreshDmConvs();
}
async function openDmConv(convId) {
  DM_CONV = convId;
  document.querySelectorAll("#dm-convs .dm-conv").forEach(e => e.classList.toggle("active", e.dataset.conv === convId));
  const thread = $("dm-thread");
  if (thread) thread.innerHTML = `<div class="empty"><div class="empty-t">鍔犺浇鑱婂ぉ璁板綍鈥?/div></div>`;
  // 鎶栭煶:鐐瑰紑浼氳瘽鏃舵棤澶存媺鍘嗗彶(imapi get_by_conversation),钀藉簱鍚庡啀娓叉煋
  if (PLATFORM === "douyin") {
    try { await api(`/api/accounts/${HUB_ACC}/dm/conversations/${convId}/fetch-history`, { method: "POST" }); }
    catch (e) { /* 鎷夊彇澶辫触涔熺収甯告樉绀哄簱閲屽凡鏈夌殑(鏈€鍚庝竴鏉? */ }
  }
  markDmRead(convId);
  await refreshDmMessages();
}
// 鏍囪宸茶:娓呯孩鐐?鍒锋柊宸︿晶鍒楄〃
function markDmRead(convId) {
  if (!HUB_ACC || !convId) return;
  api(`/api/accounts/${HUB_ACC}/dm/conversations/${convId}/mark-read`, { method: "POST" })
    .then(() => refreshDmConvs()).catch(() => {});
}
// 鍒嗕韩瑙嗛鍗＄墖(msg_type=8):灏侀潰+鏍囬+浣滆€?鐐瑰嚮璺虫姈闊宠瑙嗛
function dmVideoCard(c) {
  const url = c.item_id ? `https://www.douyin.com/video/${encodeURIComponent(c.item_id)}` : "#";
  const cover = c.cover
    ? `<img src="${esc(c.cover)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">`
    : "";
  const avatar = c.avatar
    ? `<img class="av" src="${esc(c.avatar)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'">`
    : "";
  return `<a class="dm-vcard" href="${url}" target="_blank" rel="noopener">
    <div class="cov">${cover}<span class="play">鈻?/span></div>
    <div class="meta">
      <div class="ttl">${esc(c.title || "[瑙嗛]")}</div>
      <div class="au">${avatar}<span>${esc(c.author || "")}</span></div>
    </div>
  </a>`;
}
function dmBody(m) {
  if (m.card && m.card.kind === "video") return dmVideoCard(m.card);
  return esc(m.text);
}
async function refreshDmMessages() {
  const thread = $("dm-thread"); if (!thread || !HUB_ACC || !DM_CONV) return;
  try {
    const msgs = await api(`/api/dm/messages?account_id=${HUB_ACC}&conv_id=${encodeURIComponent(DM_CONV)}`);
    thread.innerHTML = msgs.length
      ? msgs.map(m => `<div class="dm-bubble ${m.direction === "out" ? "out" : "in"}${m.card ? " card" : ""}">${dmBody(m)}<span class="t">${fmtTime(m.create_time)}</span></div>`).join("")
      : `<div class="empty"><div class="empty-t">鏆傛棤娑堟伅璁板綍</div><div class="empty-sub">璇ヤ細璇濇病鏈夊彲鎷夊彇鐨勫巻鍙?鎴栧鏂逛负绯荤粺鍙?</div></div>`;
    thread.scrollTop = thread.scrollHeight;
  } catch (e) { thread.innerHTML = `<div class="empty"><div class="empty-t">鍔犺浇澶辫触:${esc(e.message)}</div></div>`; }
}
async function sendDm() {
  const inp = $("dm-input"); const text = (inp.value || "").trim();
  if (!HUB_ACC) { toast("璇峰厛閫夋嫨璐﹀彿", "err"); return; }
  if (!DM_CONV) { toast("璇峰厛閫夋嫨宸︿晶浼氳瘽", "err"); return; }
  if (!text) return;
  const c = DM_CONVS.find(x => x.conv_id === DM_CONV) || {};
  await withBusy(evtBtn(), "鍙戦€佷腑", async () => {
    try {
      await api("/api/account-actions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: +HUB_ACC, action: "send_dm", target_uid: c.peer_uid || "", target_sec_uid: c.peer_sec_uid || "", target_nick: c.peer_nickname || "", conv_id: DM_CONV, content: text, run_now: true })
      });
      inp.value = ""; toast("宸插彂閫?, "ok");
      // 鍙戝畬閲嶆媺鍘嗗彶,灞曠ず鍒氬彂鍑虹殑娑堟伅(imapi 鏈夌煭鏆傚欢杩?绋嶇瓑鍐嶆媺)
      await new Promise(r => setTimeout(r, 700));
      await openDmConv(DM_CONV);
    } catch (e) { toast("鍙戦€佸け璐?" + e.message, "err"); }
  });
}
function accOptions(list, ph) {
  return `<option value="">${ph}</option>` +
    list.map(a => `<option value="${a.id}">${esc(a.nickname)}${a.has_creator ? " 路 鍒涗綔鍙? : ""}</option>`).join("");
}
function populateAccountSelect() {
  const sel = $("t-acc"); if (!sel) return;
  const xhs = PLATFORM === "xhs";
  sel.innerHTML = accOptions(ACCOUNTS, xhs ? "璇烽€夋嫨灏忕孩涔﹁处鍙?蹇呴€?" : "涓嶆寚瀹氳处鍙?);
  // 灏忕孩涔︽墍鏈夐〉闈㈤兘瑕佺櫥褰?鑷姩閫変腑绗竴涓处鍙?閬垮厤婕忛€夊鑷磋寮圭櫥褰曞
  if (xhs && ACCOUNTS.length) sel.value = String(ACCOUNTS[0].id);
}
function populateWatchAccount() {
  const sel = $("w-acc"); if (!sel) return;
  const xhs = PLATFORM === "xhs";
  const creatorOnly = !xhs && $("w-mode") && $("w-mode").value === "creator";
  const list = creatorOnly ? ACCOUNTS.filter(a => a.has_creator) : ACCOUNTS;
  const ph = xhs ? "璇烽€夋嫨灏忕孩涔﹁处鍙?蹇呴€?"
    : (creatorOnly && list.length === 0 ? "鏃犲垱浣滆€呰处鍙?璇峰厛鍒涗綔鑰呯櫥褰? : "涓嶆寚瀹氳处鍙?);
  sel.innerHTML = accOptions(list, ph);
  if (xhs && list.length) sel.value = String(list[0].id);
}
async function refreshProfile(id) {
  const btn = evtBtn();
  await withBusy(btn, "鎷夊彇涓?, async () => {
    try { const r = await api("/api/accounts/" + id + "/refresh-profile", { method: "POST" }); const idLbl = (r.platform || PLATFORM) === "xhs" ? " 路 灏忕孩涔﹀彿 " : " 路 鎶栭煶鍙?"; toast("璧勬枡宸叉洿鏂?" + (r.nickname || "") + (r.douyin_id ? idLbl + r.douyin_id : ""), "ok"); }
    catch (e) { toast("鍒锋柊澶辫触:" + e.message, "err"); }
  });
  refreshAccounts();
}
async function setProxy(id) {
  const a = ACCOUNTS.find(x => x.id === id);
  let opts = [];
  try { opts = await api("/api/proxies/options"); } catch (e) { }
  const cur = a && a.has_proxy ? a.proxy : "";
  const options = [
    { value: "auto", label: "馃攢 鑷姩鍒嗛厤(鍗犵敤鏈€灏?" },
    ...opts.map(p => ({ value: p.url, label: `${p.label} 路 ${p.status} 路 鍗犵敤${p.used_by} 路 ${p.masked}${p.enabled ? "" : " 路 宸插仠鐢?}` })),
    { value: "__custom__", label: "鉁?鎵嬪姩杈撳叆鍦板潃鈥? },
    { value: "", label: "馃毇 娓呴櫎浠ｇ悊(璧扮湡瀹?IP)" },
  ];
  const v = await uiSelect({
    title: "璐﹀彿浠ｇ悊",
    hint: (a ? a.nickname + " 路 " : "") + "褰撳墠:" + (cur || "鏈厤缃?),
    options, value: (cur && opts.some(o => o.value === cur)) ? cur : "auto",
  });
  if (v === null) return;
  try {
    if (v === "auto") {
      const r = await api("/api/accounts/" + id + "/assign-proxy", { method: "POST" });
      toast("宸蹭粠浠ｇ悊姹犲垎閰?" + r.proxy, "ok");
    } else if (v === "__custom__") {
      const url = await uiPrompt({
        title: "鎵嬪姩杈撳叆浠ｇ悊", value: cur,
        hint: "http://user:pass@host:port 鎴?socks5://host:port;鐣欑┖=娓呴櫎",
        placeholder: "http://user:pass@host:port" });
      if (url === null) return;
      const r = await api("/api/accounts/" + id + "/proxy", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxy: url.trim() }) });
      toast(url.trim() ? "浠ｇ悊宸茶缃?" + r.proxy : "浠ｇ悊宸叉竻闄?, "ok");
    } else {
      const r = await api("/api/accounts/" + id + "/proxy", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proxy: v }) });
      toast(v ? "浠ｇ悊宸茶缃?" + r.proxy : "浠ｇ悊宸叉竻闄?, "ok");
    }
    refreshAccounts(); refreshProxies();
  } catch (e) { toast("璁剧疆澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 浠ｇ悊姹?鈹€鈹€鈹€
let PROXIES = [];
let LAST_DETECT = null;   // {url, geo} 鍒ゅ埆缁撴灉,鍔犲叆姹犳椂涓€骞跺甫涓婂綊灞炲湴
async function refreshProxies() {
  const tb = $("proxy-table"); if (!tb) return;
  let rows = [];
  try { rows = await api("/api/proxies"); } catch (e) { return; }
  PROXIES = rows;
  const stCls = s => s === "ok" ? "active" : s === "bad" ? "invalid" : "bare";
  const stTxt = { ok: "姝ｅ父", bad: "涓嶅彲鐢?, unknown: "鏈祴" };
  const geoCell = p => {
    if (!p.geo_checked) return `<span class="pill bare">鏈祴</span>`;
    const cls = p.is_mainland ? "active" : "invalid";
    const warn = p.is_mainland ? "" : ' <span title="闈炰腑鍥藉ぇ闄?IP,涓庢姈闊?灏忕孩涔﹀浗鍐呰处鍙锋椂鍖轰笉绗?鏈夐鎺ч闄?>鈿狅笍</span>';
    return `<div><span class="pill ${cls}">${esc(p.geo_loc || "鏈煡")}</span>${warn}</div>` +
      (p.exit_ip ? `<div class="mut" style="font-size:11px;margin-top:2px">${esc(p.exit_ip)}${p.isp ? " 路 " + esc(p.isp) : ""}</div>` : "");
  };
  tb.querySelector("tbody").innerHTML = rows.map(p => `<tr>
      <td>
        <div><b>${esc(p.label || "(鏈懡鍚?")}</b> <span class="pill ${stCls(p.status)}">${stTxt[p.status] || p.status}</span>${p.enabled ? "" : ' <span class="pill bare">宸插仠鐢?/span>'}</div>
        <div class="mut" style="font-size:11px;margin-top:2px"><code>${esc(p.url)}</code></div>
        ${p.note ? `<div class="mut" style="font-size:11px">${esc(p.note)}</div>` : ""}
      </td>
      <td>${geoCell(p)}</td>
      <td><span class="pill ${p.used_by ? "active" : "bare"}">${p.used_by} 涓处鍙?/span></td>
      <td class="acttd">
        <button class="ghost sm" onclick="editPoolProxy(${p.id})">缂栬緫</button>
        <button class="ghost sm" onclick="testPoolProxy(${p.id})">娴嬭瘯</button>
        <button class="ghost sm" onclick="togglePoolProxy(${p.id},${p.enabled})">${p.enabled ? "鍋滅敤" : "鍚敤"}</button>
        <button class="ghost sm" onclick="delPoolProxy(${p.id},${p.used_by})">鍒犻櫎</button>
      </td>
    </tr>`).join("") || empty(4, "浠ｇ悊姹犱负绌?, "i-shield", "娣诲姞浣忓畢/4G 浠ｇ悊,璐﹀彿鍗冲彲涓€鍙蜂竴浠ｇ悊鍏宠仈浣跨敤");
}
async function detectProxy() {
  const raw = $("px-url").value.trim();
  if (!raw) { toast("璇峰厛濉唬鐞嗗湴鍧€", "err"); return; }
  const btn = event.target.closest("button"); btn.disabled = true; const old = btn.textContent; btn.textContent = "鍒ゅ埆涓€?;
  try {
    const r = await api("/api/proxies/detect", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: raw }) });
    if (!r.ok) { toast("鍒ゅ埆澶辫触:" + (r.error || ""), "err"); return; }
    if ($("px-proto") && (r.scheme === "http" || r.scheme === "socks5")) $("px-proto").value = r.scheme;
    $("px-url").value = r.recommend;        // 鍥炲～甯﹀崗璁殑瑙勮寖鍦板潃
    LAST_DETECT = { url: r.recommend, geo: r.geo || null };
    // 褰掑睘鍦板啓杩涘娉?鑻ュ娉ㄤ负绌?,鏂逛究鏍稿 IP 鍦板尯涓庤处鍙锋槸鍚︿竴鑷?    if (r.geo_text && $("px-label") && !$("px-label").value.trim()) {
      const g = r.geo || {};
      $("px-label").value = [g.country, g.region, g.city].filter(Boolean).join("路") || "宸插垽鍒?;
    }
    const tag = r.scheme.toUpperCase() + (r.auth === "required" ? " 路 闇€璐﹀瘑" : " 路 鍏嶅瘑");
    toast("鍒ゅ埆:" + tag + (r.geo_text ? "  |  " + r.geo_text : "  |  褰掑睘鍦版湭鍙栧埌"), r.browser_ok ? "ok" : "info");
    if (!r.browser_ok) toast("鈿狅笍 " + r.note, "err", 8000);
  } catch (e) { toast("鍒ゅ埆澶辫触:" + e.message, "err"); }
  finally { btn.disabled = false; btn.textContent = old; }
}
async function addProxy() {
  let url = $("px-url").value.trim();
  if (!url) { toast("璇峰～浠ｇ悊鍦板潃", "err"); return; }
  // 瑁?ip:port 鎸夋墍閫夊崗璁ˉ鍏?宸插甫鍗忚澶村垯灏婇噸鍘熷€?  if (!/:\/\//.test(url)) url = ($("px-proto") ? $("px-proto").value : "http") + "://" + url;
  const geo = (LAST_DETECT && LAST_DETECT.url === url) ? LAST_DETECT.geo : null;
  try {
    await api("/api/proxies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, label: $("px-label").value.trim(), geo }) });
    $("px-url").value = ""; $("px-label").value = "";
    toast("宸插姞鍏ヤ唬鐞嗘睜", "ok"); refreshProxies();
  } catch (e) { toast("娣诲姞澶辫触:" + e.message, "err"); }
}
async function delPoolProxy(id, used) {
  if (!await uiConfirm({ title: "鍒犻櫎浠ｇ悊", okText: "鍒犻櫎", danger: true,
    message: "鍒犻櫎璇ヤ唬鐞?" + (used ? `\n鈿狅笍 鏈?${used} 涓处鍙锋鍦ㄧ敤瀹?鍒犻櫎鍚庤繖浜涜处鍙烽渶鍙﹂€変唬鐞嗐€俙 : "") })) return;
  try { await api("/api/proxies/" + id, { method: "DELETE" }); toast("宸插垹闄?, "ok"); refreshProxies(); }
  catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); }
}
async function editPoolProxy(id) {
  const p = PROXIES.find(x => x.id === id);
  if (!p) return;
  const label = await uiPrompt({
    title: "缂栬緫浠ｇ悊澶囨敞",
    hint: p.url + (p.geo_loc ? "  路  " + p.geo_loc : ""),
    value: p.label || "", placeholder: "濡?浣忓畢-骞夸笢-01" });
  if (label === null) return;
  try {
    await api("/api/proxies/" + id, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim() }) });
    toast("澶囨敞宸叉洿鏂?, "ok"); refreshProxies();
  } catch (e) { toast("鏇存柊澶辫触:" + e.message, "err"); }
}
async function togglePoolProxy(id, enabled) {
  try {
    await api("/api/proxies/" + id, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }) });
    refreshProxies();
  } catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); }
}
async function testPoolProxy(id) {
  const btn = event.target.closest("button"); btn.disabled = true; const old = btn.textContent; btn.textContent = "娴嬭瘯涓€?;
  try { const r = await api("/api/proxies/" + id + "/test", { method: "POST" });
    toast((r.ok ? "鍙敤 鉁?" : "涓嶅彲鐢?鉁?") + (r.detail || "") + (r.geo_text ? "  |  " + r.geo_text : ""), r.ok ? "ok" : "err"); }
  catch (e) { toast("娴嬭瘯澶辫触:" + e.message, "err"); }
  finally { btn.disabled = false; btn.textContent = old; refreshProxies(); }
}
async function testAllProxies() {
  if (!PROXIES.length) { toast("浠ｇ悊姹犱负绌?, "info"); return; }
  toast("寮€濮嬮€愪釜娴嬭瘯鈥?, "info");
  for (const p of PROXIES) {
    try { await api("/api/proxies/" + p.id + "/test", { method: "POST" }); } catch (e) { }
  }
  toast("娴嬭瘯瀹屾垚", "ok"); refreshProxies();
}
async function importProxies() {
  const text = await uiPrompt({
    title: "鎵归噺瀵煎叆浠ｇ悊",
    hint: "姣忚涓€涓?鏀寔 # 娉ㄩ噴銆佺┖琛?鍙啓銆屽娉?鍦板潃銆嶃€俓n鈿狅笍 瑁?ip:port 榛樿 HTTP;SOCKS5 闇€鍔?socks5:// 鍓嶇紑銆?,
    multiline: true, rows: 8,
    placeholder: "浣忓畢-01,1.2.3.4:8080\nsocks5://user:pass@5.6.7.8:1080" });
  if (text === null || !text.trim()) return;
  try {
    const r = await api("/api/proxies/import", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }) });
    let msg = `瀵煎叆瀹屾垚:鏂板 ${r.added}`;
    if (r.skipped) msg += ` 路 閲嶅璺宠繃 ${r.skipped}`;
    if (r.invalid) msg += ` 路 鏍煎紡鏃犳晥 ${r.invalid}`;
    toast(msg, r.added ? "ok" : "info");
    refreshProxies();
  } catch (e) { toast("瀵煎叆澶辫触:" + e.message, "err"); }
}
async function assignAllProxies() {
  const noProxy = ACCOUNTS.filter(a => !a.has_proxy).length;
  if (!noProxy) { toast("鎵€鏈夎处鍙烽兘宸查厤缃唬鐞?, "info"); return; }
  if (!await uiConfirm({ title: "鎵归噺鍒嗛厤浠ｇ悊", message: `缁?${noProxy} 涓湭閰嶄唬鐞嗙殑璐﹀彿浠庢睜閲岃嚜鍔ㄥ垎閰?鍧囪　,鍗犵敤鏈€灏戜紭鍏??` })) return;
  const btn = event.target.closest("button"); if (btn) { btn.disabled = true; btn.textContent = "鍒嗛厤涓€?; }
  try {
    const r = await api("/api/accounts/assign-proxies-all", { method: "POST" });
    let msg = `宸插垎閰?${r.assigned} 涓处鍙穈;
    if (r.unassigned) msg += `,杩樻湁 ${r.unassigned} 涓病鍒嗗埌(浠ｇ悊姹犱笉澶?璇峰啀鍔犱唬鐞?`;
    toast(msg, r.unassigned ? "info" : "ok");
    refreshAccounts(); refreshProxies();
  } catch (e) { toast("鍒嗛厤澶辫触:" + e.message, "err"); }
  finally { if (btn) { btn.disabled = false; btn.textContent = "缁欒处鍙锋壒閲忓垎閰?; } }
}
async function testProxy(id) {
  const btn = event.target.closest("button"); btn.disabled = true; const old = btn.textContent; btn.textContent = "娴嬭瘯涓€?;
  try {
    const r = await api("/api/accounts/" + id + "/test-proxy", { method: "POST" });
    toast((r.ok ? "浠ｇ悊鍙敤 鉁?" : "浠ｇ悊涓嶅彲鐢?鉁?") + (r.detail || ""), r.ok ? "ok" : "err");
  } catch (e) { toast("娴嬭瘯澶辫触:" + e.message, "err"); }
  finally { btn.disabled = false; btn.textContent = old; refreshAccounts(); }
}
async function relogin(id) {
  const btn = evtBtn();
  await withBusy(btn, "鍚姩涓?, async () => {
    try {
      const res = await api("/api/accounts/" + id + "/relogin/start", { method: "POST" });
      toast("宸叉墦寮€娴忚鍣ㄧ獥鍙?璇锋壂鐮侀噸鏂扮櫥褰曡璐﹀彿", "info");
      pollReloginTask(res.task_id);
    } catch (e) { toast("鍚姩澶辫触:" + e.message, "err"); }
  });
}
function pollReloginTask(tid) {
  const t = setInterval(async () => {
    try {
      const r = await api("/api/login/browser/poll?task_id=" + tid);
      if (r.status === "confirmed") { clearInterval(t); toast("閲嶆柊鐧诲綍鎴愬姛 " + (r.nickname || ""), "ok"); refreshAccounts(); }
      else if (r.status === "expired") { clearInterval(t); toast("瓒呮椂鏈櫥褰?璇烽噸璇?, "err"); }
      else if (r.status === "error") { clearInterval(t); toast("鍑洪敊:" + (r.error || ""), "err"); }
    } catch (e) { clearInterval(t); }
  }, 2000);
}
async function delAccount(id) {
  const a = ACCOUNTS.find(x => x.id === id);
  const warn = a && a.monitor_count > 0 ? `\n鈿狅笍 鏈?${a.monitor_count} 涓洃鎺ф鍦ㄧ敤瀹?鍒犻櫎鍚庤繖浜涚洃鎺у皢鏃犵櫥褰曟€?闇€鏀圭敤鍏跺畠璐﹀彿)銆俙 : "";
  if (!await uiConfirm({ title: "鍒犻櫎璐﹀彿", message: "鍒犻櫎璇ヨ处鍙?" + warn, okText: "鍒犻櫎", danger: true })) return;
  try { await api("/api/accounts/" + id, { method: "DELETE" }); toast("璐﹀彿宸插垹闄?, "ok"); refreshAccounts(); }
  catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 涓嬭浇璁剧疆 鈹€鈹€鈹€
async function loadSettings() {
  try {
    const s = await api("/api/settings");
    $("dl-dir").value = s.download_dir || "";
    $("dl-quality").value = s.video_quality || "highest";
    if ($("ai-enabled")) {
      $("ai-enabled").checked = !!s.ai_enabled;
      $("ai-base").value = s.ai_base_url || "";
      $("ai-model").value = s.ai_model || "";
      $("ai-temp").value = s.ai_temperature || "0.9";
      $("ai-prompt").value = s.ai_prompt || "";
      $("ai-key").placeholder = s.ai_api_key_set ? "宸蹭繚瀛?鐣欑┖=涓嶄慨鏀?" : "API Key";
    }
    csSyncAll();
  } catch (e) {}
}
async function saveAiSettings() {
  $("ai-msg").textContent = "淇濆瓨涓€?;
  const body = {
    ai_enabled: $("ai-enabled").checked, ai_base_url: $("ai-base").value.trim(),
    ai_model: $("ai-model").value.trim(), ai_temperature: $("ai-temp").value.trim() || "0.9",
    ai_prompt: $("ai-prompt").value,
  };
  const key = $("ai-key").value.trim();
  if (key) body.ai_api_key = key;
  try {
    const s = await api("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    $("ai-key").value = ""; $("ai-key").placeholder = s.ai_api_key_set ? "宸蹭繚瀛?鐣欑┖=涓嶄慨鏀?" : "API Key";
    $("ai-msg").textContent = "宸蹭繚瀛?鉁?" + (s.ai_enabled ? "(瑙勫垯鍕鹃€夈€岀敤 AI銆嶅嵆鐢熸晥)" : "(褰撳墠鏈惎鐢?");
    toast("AI 璁剧疆宸蹭繚瀛?, "ok");
  } catch (e) { $("ai-msg").textContent = "澶辫触: " + e.message; toast("淇濆瓨澶辫触:" + e.message, "err"); }
}
async function testAi() {
  const btn = evtBtn();
  $("ai-msg").textContent = "娴嬭瘯涓€?;
  // 鐢ㄥ綋鍓嶈〃鍗曞€兼祴(key 鐣欑┖鍒欑敤宸蹭繚瀛樼殑),鏂逛究淇濆瓨鍓嶅厛楠岃瘉
  const body = {
    base_url: $("ai-base").value.trim(), model: $("ai-model").value.trim(),
    prompt: $("ai-prompt").value, temperature: $("ai-temp").value.trim() || "0.9",
  };
  const key = $("ai-key").value.trim();
  if (key) body.api_key = key;
  await withBusy(btn, "娴嬭瘯涓?, async () => {
    try {
      const r = await api("/api/settings/ai-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) { $("ai-msg").innerHTML = `杩為€氭甯?鉁?鏍蜂緥鏂囨:<b>${esc(r.sample || "")}</b>`; toast("AI 杩為€氭甯?鉁?, "ok", 6000); }
      else { $("ai-msg").textContent = "杩為€氬け璐?" + (r.error || ""); toast("AI 杩為€氬け璐?" + (r.error || ""), "err", 8000); }
    } catch (e) { $("ai-msg").textContent = "澶辫触:" + e.message; toast("娴嬭瘯澶辫触:" + e.message, "err"); }
  });
}
async function saveSettings() {
  $("dl-msg").textContent = "淇濆瓨涓€?;
  try {
    const s = await api("/api/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ download_dir: $("dl-dir").value.trim(), video_quality: $("dl-quality").value }),
    });
    $("dl-dir").value = s.download_dir || "";
    $("dl-quality").value = s.video_quality || "highest";
    csSyncAll();
    $("dl-msg").textContent = "宸蹭繚瀛?鉁?鏂颁綔鍝佸皢鎸夋璁剧疆涓嬭浇";
    toast("涓嬭浇璁剧疆宸蹭繚瀛?, "ok");
  } catch (e) { $("dl-msg").textContent = "澶辫触: " + e.message; toast("淇濆瓨澶辫触:" + e.message, "err"); }
}
const QMAP = { "": "榛樿", highest: "鍘熺敾", "1080": "1080P", "720": "720P", "540": "540P", lowest: "鐪佹祦" };

// 鈹€鈹€鈹€ 閫氱煡娓犻亾 鈹€鈹€鈹€
const N_TEMPLATES = {
  bark: '{\n  "key": "浣犵殑Bark璁惧key",\n  "server": "https://api.day.app"\n}',
  dingtalk: '{\n  "webhook": "https://oapi.dingtalk.com/robot/send?access_token=xxx",\n  "secret": "鍔犵瀵嗛挜(鍙€?",\n  "keyword": "鍏抽敭璇?鍙€?"\n}',
  telegram: '{\n  "bot_token": "123:abc",\n  "chat_id": "浣犵殑chat_id"\n}',
};
function onTypeChange() { $("n-config").value = N_TEMPLATES[$("n-type").value] || ""; }
async function addChannel() {
  let config;
  try { config = JSON.parse($("n-config").value || "{}"); }
  catch (e) { $("n-msg").textContent = "閰嶇疆涓嶆槸鍚堟硶 JSON"; toast("閰嶇疆涓嶆槸鍚堟硶 JSON", "err"); return; }
  $("n-msg").textContent = "娣诲姞涓€?;
  try {
    await api("/api/notifications", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: $("n-name").value.trim(), type: $("n-type").value, config }),
    });
    $("n-name").value = ""; $("n-msg").textContent = "宸叉坊鍔?鉁?; toast("閫氱煡娓犻亾宸叉坊鍔?, "ok");
    refreshChannels();
  } catch (e) { $("n-msg").textContent = "澶辫触: " + e.message; toast("娣诲姞澶辫触:" + e.message, "err"); }
}
async function refreshChannels() {
  const cs = await api("/api/notifications");
  $("n-table").querySelector("tbody").innerHTML = cs.map(c => `<tr>
    <td>${esc(c.name)} <span class="mut">${c.type}</span></td>
    <td><span class="pill ${c.enabled ? "active" : "invalid"}">${c.enabled ? "鍚敤" : "鍋滅敤"}</span></td>
    <td class="acttd">
      <button class="ghost sm" onclick="testChannel(${c.id})">娴嬭瘯</button>
      <button class="ghost sm" onclick="toggleChannel(${c.id}, ${!c.enabled})">${c.enabled ? "鍋滅敤" : "鍚敤"}</button>
      <button class="ghost sm" onclick="delChannel(${c.id})">鍒犻櫎</button>
    </td></tr>`).join("") || empty(3, "杩樻病鏈夐€氱煡娓犻亾", "i-bell", "娣诲姞 Bark / 椋炰功 / Webhook 绛夋笭閬?鏈夋柊浣滃搧鎴栨柊璇勮鏃舵帹閫佺粰浣?);
}
async function testChannel(id) {
  const btn = event.target.closest("button"); btn.disabled = true; btn.textContent = "鍙戦€佷腑鈥?;
  try { const r = await api("/api/notifications/" + id + "/test", { method: "POST" }); btn.textContent = r.ok ? "鎴愬姛 鉁? : "澶辫触"; toast(r.ok ? "娴嬭瘯鎺ㄩ€佸凡鍙戦€? : "鍙戦€佸け璐?" + (r.detail || ""), r.ok ? "ok" : "err"); }
  catch (e) { btn.textContent = "澶辫触"; toast("鍙戦€佸け璐?" + e.message, "err"); }
  setTimeout(() => { btn.disabled = false; btn.textContent = "娴嬭瘯"; }, 1500);
}
async function toggleChannel(id, enabled) { try { await api("/api/notifications/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled }) }); refreshChannels(); } catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); } }
async function delChannel(id) { if (await uiConfirm({ title: "鍒犻櫎娓犻亾", message: "鍒犻櫎璇ラ€氱煡娓犻亾?", okText: "鍒犻櫎", danger: true })) { try { await api("/api/notifications/" + id, { method: "DELETE" }); toast("娓犻亾宸插垹闄?, "ok"); refreshChannels(); } catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); } } }

// 鈹€鈹€鈹€ 鐩戞帶 鈹€鈹€鈹€
async function addMonitor() {
  const url_or_secuid = $("t-url").value.trim();
  const target_kind = (PLATFORM === "xhs" && $("t-kind")) ? $("t-kind").value : "creator";
  if (!url_or_secuid) { toast(target_kind === "keyword" ? "璇疯緭鍏ユ悳绱㈠叧閿瘝" : "璇疯緭鍏ヤ富椤甸摼鎺?/ 鐭摼 / id", "err"); return; }
  if (PLATFORM === "xhs" && !$("t-acc").value) {
    if (!ACCOUNTS.length) { toast("璇峰厛鍦ㄣ€岃处鍙枫€嶉噷瀹屾垚灏忕孩涔︽壂鐮佺櫥褰?, "err"); switchTab("accounts"); return; }
    toast("灏忕孩涔︾洃鎺у繀椤婚€夋嫨涓€涓凡鐧诲綍璐﹀彿", "err"); return;
  }
  const btn = evtBtn();
  $("add-msg").textContent = "瑙ｆ瀽涓€?;
  await withBusy(btn, "瑙ｆ瀽涓?, async () => {
    try {
      await api("/api/monitors", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url_or_secuid, platform: PLATFORM, target_kind, account_id: $("t-acc").value ? +$("t-acc").value : null, interval_seconds: +$("t-interval").value, download_dir: $("t-dir").value.trim(), video_quality: PLATFORM === "xhs" ? "" : $("t-quality").value }),
      });
      $("t-url").value = ""; $("t-dir").value = ""; $("add-msg").textContent = "宸叉坊鍔?鉁?;
      toast("宸插紑濮嬬洃鎺?, "ok");
    } catch (e) { $("add-msg").textContent = "澶辫触: " + e.message; toast("娣诲姞澶辫触:" + e.message, "err"); }
  });
  refreshMonitors();
}
async function editDir(id, cur) {
  const v = await uiPrompt({ title: "涓嬭浇鐩綍", hint: "鐣欑┖=鐢ㄩ粯璁ょ洰褰?, value: cur || "",
    placeholder: "渚嬪 D:\\downloads\\鎶栭煶" });
  if (v === null) return;
  try { await api("/api/monitors/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ download_dir: v.trim() }) }); toast("鐩綍宸叉洿鏂?, "ok"); refreshMonitors(); }
  catch (e) { toast("澶辫触:" + e.message, "err"); }
}
async function editQuality(id, cur) {
  const v = await uiSelect({
    title: "瑙嗛鐢昏川", hint: "鐣欑┖=璺熼殢鍏ㄥ眬榛樿",
    options: [
      { value: "", label: "璺熼殢鍏ㄥ眬榛樿" },
      { value: "highest", label: "highest(鍘熺敾)" },
      { value: "1080", label: "1080" }, { value: "720", label: "720" },
      { value: "540", label: "540" }, { value: "lowest", label: "lowest(鐪佹祦)" },
    ], value: cur || "" });
  if (v === null) return;
  try { await api("/api/monitors/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ video_quality: v.trim() }) }); toast("鐢昏川宸叉洿鏂?, "ok"); refreshMonitors(); }
  catch (e) { toast("澶辫触:" + e.message, "err"); }
}
function monRow(t) {
  const label = t.target_kind === "keyword"
    ? `<span class="ic-text">${ic("i-hash")}${esc(t.keyword)}</span>` : esc(t.nickname || (t.sec_uid || "").slice(0, 12));
  const acc = ACCOUNTS.find(a => a.id === t.account_id);
  // 鎶栭煶/灏忕孩涔﹂兘鏄剧ず缁戝畾璐﹀彿:鎶栭煶鏈櫥褰曟姄涓婚〉鏄撴嬁鍒伴鎺ц繃鐨勬棫蹇収,缁戝彿鎵嶇ǔ瀹?  const accTag = acc
    ? `<div class="mut" style="font-size:11px;margin-top:2px">璐﹀彿:${esc(acc.nickname)}</div>`
    : `<div class="ic-text" style="font-size:11px;margin-top:2px;color:var(--danger)">${ic("i-info")}鏈粦瀹氳处鍙?/div>`;
  const bindBtn = acc
    ? `<button class="ghost sm" onclick="bindAccount(${t.id})">鎹㈣处鍙?/button>`
    : `<button class="sm" style="background:var(--warn);border-color:transparent;color:#1a1a1a" onclick="bindAccount(${t.id})">缁戝畾璐﹀彿</button>`;
  return `<tr>
    <td><div class="user-cell">${t.avatar ? `<img class="avatar" src="${t.avatar}" alt="" referrerpolicy="no-referrer">` : ""}<div><span>${label}</span>${accTag}</div></div></td>
    <td class="num">${t.content_count}</td>
    <td class="num">${Math.round(t.interval_seconds / 60)} 鍒?/td>
    <td class="wrap" style="max-width:230px">
      ${t.platform === "xhs" ? "" : `<span class="pill q bare">${QMAP[t.video_quality] || "榛樿"}</span> `}
      <span class="mut" title="${esc(t.download_dir || "榛樿鐩綍")}" style="display:inline-block;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle">${esc(t.download_dir || "榛樿")}</span></td>
    <td class="mut">${t.last_scan_at ? new Date(t.last_scan_at + "Z").toLocaleString() : "鈥?}${t.last_error ? ` <span class="warn-ic" title="${esc(t.last_error)}">${ic("i-info")}</span>` : ""}</td>
    <td><span class="pill ${t.enabled ? "active" : "invalid"}">${t.enabled ? "鐩戞帶涓? : "宸叉殏鍋?}</span></td>
    <td class="acttd">
      <button class="ghost sm" onclick="runNow(${t.id})">绔嬪嵆鎶撳彇</button>
      <button class="ghost sm" onclick="editDir(${t.id}, ${JSON.stringify(t.download_dir || "").replace(/"/g, "&quot;")})">鐩綍</button>
      ${t.platform === "xhs" ? "" : `<button class="ghost sm" onclick="editQuality(${t.id}, ${JSON.stringify(t.video_quality || "").replace(/"/g, "&quot;")})">鐢昏川</button>`}
      ${bindBtn}
      ${t.platform === "douyin" ? `<button class="ghost sm" onclick="relayMon(${t.id})" title="${t.relay_to_xhs_account_id ? "涓嬭浇鍚庤嚜鍔ㄨ浆鍙戝埌灏忕孩涔?宸插紑鍚?" : "涓嬭浇鍚庤嚜鍔ㄨ浆鍙戝埌灏忕孩涔?}">杞彂${t.relay_to_xhs_account_id ? " 鉁? : ""}</button>` : ""}
      <button class="ghost sm" onclick="toggleMon(${t.id})">${t.enabled ? "鏆傚仠" : "鍚敤"}</button>
      <button class="ghost sm" onclick="delMon(${t.id})">鍒犻櫎</button>
    </td></tr>`;
}
async function bindAccount(id) {
  const pName = PLATFORM === "xhs" ? "灏忕孩涔? : "鎶栭煶";
  if (!ACCOUNTS.length) { toast(`璇峰厛鍦ㄣ€岃处鍙枫€嶉噷瀹屾垚${pName}鐧诲綍`, "err"); switchTab("accounts"); return; }
  const v = await uiSelect({
    title: `缁戝畾${pName}璐﹀彿`,
    hint: "閫夋嫨鐢ㄥ摢涓凡鐧诲綍璐﹀彿鐨勭櫥褰曟€佹潵鎶撳彇璇ョ洰鏍囥€?,
    options: ACCOUNTS.map(a => ({ value: String(a.id), label: a.nickname + (a.has_creator ? " 路 鍒涗綔鍙? : "") })),
    value: String(ACCOUNTS[0].id),
  });
  if (v === null) return;
  try { await api("/api/monitors/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ account_id: +v }) }); toast("宸茬粦瀹氳处鍙?鍙偣銆岀珛鍗虫姄鍙栥€嶈瘯璇?, "ok"); refreshMonitors(); }
  catch (e) { toast("缁戝畾澶辫触:" + e.message, "err"); }
}
async function refreshMonitors() {
  const ts = await api("/api/monitors?platform=" + PLATFORM);
  MONITORS = ts; populateContentSrc();
  $("stat-mon").textContent = ts.filter(t => t.enabled).length;
  if ($("tb-mon")) $("tb-mon").textContent = ts.length;
  $("mon-table").innerHTML = ts.map(monRow).join("")
    || empty(7, "鏆傛棤鐩戞帶", "i-target", "鍦ㄤ笂鏂圭矘璐翠富椤甸摼鎺ユ垨 sec_uid,寮€濮嬬洃鎺т竴涓处鍙风殑鏂颁綔鍝?);
}
async function runNow(id) {
  const btn = evtBtn();
  toast("鎶撳彇涓€︽鍦ㄥ紑娴忚鍣ㄦ媺鍙栨柊浣滃搧", "info", 7000);
  await withBusy(btn, "鎶撳彇涓?, async () => {
    try {
      const r = await api("/api/monitors/" + id + "/run-now", { method: "POST" });
      if (r.error) toast("鎶撳彇鏈垚鍔?" + r.error, "err", 6000);
      else toast(`鎶撳彇瀹屾垚,鏂板 ${r.new} 鏉, "ok");
    } catch (e) { toast("鎶撳彇澶辫触:" + e.message, "err"); }
  });
  refreshMonitors(); refreshContents();
}
async function toggleMon(id) { try { await api("/api/monitors/" + id + "/toggle", { method: "POST" }); refreshMonitors(); } catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); } }
async function delMon(id) { if (await uiConfirm({ title: "鍒犻櫎鐩戞帶", message: "鍒犻櫎璇ョ洃鎺?", okText: "鍒犻櫎", danger: true })) { try { await api("/api/monitors/" + id, { method: "DELETE" }); toast("鐩戞帶宸插垹闄?, "ok"); refreshMonitors(); } catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); } } }

// 鈹€鈹€鈹€ 鍐呭 鈹€鈹€鈹€
function fmtTime(unix) { return unix ? new Date(unix * 1000).toLocaleString() : "鈥?; }
function fmtDur(sec) { if (!sec) return ""; const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, "0")}`; }
function fmtNum(n) { return n >= 10000 ? (n / 10000).toFixed(1) + "w" : (n || 0); }

// 鈹€鈹€鈹€ 鎵归噺閫夋嫨 鈹€鈹€鈹€
const selContent = new Set(), selComment = new Set();
function pruneSel(set, ids) { const p = new Set(ids); [...set].forEach(id => { if (!p.has(id)) set.delete(id); }); }
const CONTENT_CBS = '#content-table input[type="checkbox"], #content-cards input[type="checkbox"]';
function contentToggleOne(id, on) { on ? selContent.add(id) : selContent.delete(id); updateContentSelBar(); }
function contentToggleAll(on) { document.querySelectorAll(CONTENT_CBS).forEach(cb => { const id = +cb.dataset.id; if (!id) return; cb.checked = on; on ? selContent.add(id) : selContent.delete(id); }); updateContentSelBar(); }
function contentSelAllToggle() {
  const ids = [...document.querySelectorAll(CONTENT_CBS)].map(cb => +cb.dataset.id).filter(Boolean);
  const allSel = ids.length > 0 && ids.every(id => selContent.has(id));
  contentToggleAll(!allSel);
}
function contentSelClear() { selContent.clear(); const sa = $("content-selall"); if (sa) sa.checked = false; refreshContents(); }
function updateContentSelBar() {
  const n = selContent.size;
  $("content-selcount").textContent = "宸查€?" + n;
  $("content-selbar").style.display = n ? "inline-flex" : "none";
  const ids = [...document.querySelectorAll(CONTENT_CBS)].map(cb => +cb.dataset.id).filter(Boolean);
  const allSel = ids.length > 0 && ids.every(id => selContent.has(id));
  const btn = $("content-selall-btn"); if (btn) btn.textContent = allSel ? "鍙栨秷鍏ㄩ€? : "鍏ㄩ€?;
  const sa = $("content-selall"); if (sa) sa.checked = allSel;
}
async function contentBatchDelete() {
  if (!selContent.size) return;
  if (!await uiConfirm({ title: "鎵归噺鍒犻櫎浣滃搧", message: `鍒犻櫎閫変腑鐨?${selContent.size} 鏉′綔鍝佸強鍏舵湰鍦版枃浠?`, okText: "鍒犻櫎", danger: true })) return;
  try { const r = await api("/api/contents/batch-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selContent], with_file: true }) }); toast(`宸插垹闄?${r.deleted} 鏉?娓呯悊 ${r.files_removed} 涓枃浠?`, "ok"); selContent.clear(); refreshContents(); }
  catch (e) { toast("鎵归噺鍒犻櫎澶辫触:" + e.message, "err"); }
}
const COMMENT_CBS = '#comment-table input[type="checkbox"]';
function commentToggleOne(id, on) { on ? selComment.add(id) : selComment.delete(id); updateCommentSelBar(); }
function commentToggleAll(on) { document.querySelectorAll(COMMENT_CBS).forEach(cb => { const id = +cb.dataset.id; if (!id) return; cb.checked = on; on ? selComment.add(id) : selComment.delete(id); }); updateCommentSelBar(); }
function commentSelAllToggle() {
  const ids = [...document.querySelectorAll(COMMENT_CBS)].map(cb => +cb.dataset.id).filter(Boolean);
  const allSel = ids.length > 0 && ids.every(id => selComment.has(id));
  commentToggleAll(!allSel);
}
function commentSelClear() { selComment.clear(); const sa = $("comment-selall"); if (sa) sa.checked = false; refreshComments(); }
function updateCommentSelBar() {
  const n = selComment.size; const c = $("comment-selcount"), b = $("comment-batchbtn");
  c.textContent = "宸查€?" + n; c.style.display = n ? "inline" : "none"; b.style.display = n ? "inline-flex" : "none";
  const ids = [...document.querySelectorAll(COMMENT_CBS)].map(cb => +cb.dataset.id).filter(Boolean);
  const allSel = ids.length > 0 && ids.every(id => selComment.has(id));
  const btn = $("comment-selall-btn"); if (btn) btn.textContent = allSel ? "鍙栨秷鍏ㄩ€? : "鍏ㄩ€?;
  const sa = $("comment-selall"); if (sa) sa.checked = allSel;
}
async function commentBatchDelete() {
  if (!selComment.size) return;
  if (!await uiConfirm({ title: "鎵归噺鍒犻櫎璇勮", message: `鍒犻櫎閫変腑鐨?${selComment.size} 鏉¤瘎璁?`, okText: "鍒犻櫎", danger: true })) return;
  try { const r = await api("/api/comments/batch-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selComment] }) }); toast(`宸插垹闄?${r.deleted} 鏉¤瘎璁篳, "ok"); selComment.clear(); refreshComments(); }
  catch (e) { toast("鎵归噺鍒犻櫎澶辫触:" + e.message, "err"); }
}

function srcOf(r) {
  const t = monitorById(r.target_id);
  return t ? `<div style="margin:0 0 8px">${srcChip(monitorName(t))}</div>` : "";
}
function noteCard(r) {
  const typeIc = r.media_type === "images" ? "i-image" : "i-play";
  const typeLabel = r.media_type === "images" ? "鍥炬枃" : "瑙嗛";
  const cover = r.cover_url
    ? `<img class="ncard-cover" src="${r.cover_url}" alt="${esc((r.desc || "绗旇").slice(0, 20))}" referrerpolicy="no-referrer" loading="lazy" onclick="openPreview(${r.id})">`
    : `<div class="ncard-cover ph" onclick="openPreview(${r.id})">${ic("i-image")}</div>`;
  return `<div class="ncard">
    ${cover}
    <span class="ncard-type">${ic(typeIc)}${typeLabel}</span>
    <input type="checkbox" class="ncard-sel" data-id="${r.id}" aria-label="閫夋嫨" onchange="contentToggleOne(${r.id}, this.checked)" ${selContent.has(r.id) ? "checked" : ""}>
    <div class="ncard-body">
      <p class="ncard-title">${esc(r.desc || "(鏃犳爣棰?")}</p>
      ${srcOf(r)}
      <div class="ncard-foot">
        <span>${fmtTime(r.create_time)}</span>
        <span class="like">${ic("i-heart")}${fmtNum(r.like_count)}</span>
      </div>
      <div class="ncard-actions">
        <span class="pill ${r.download_status}" style="flex:1;justify-content:center" title="${esc(r.error || "")}">${r.download_status}${r.error ? " 鈸? : ""}</span>
        ${r.download_status === "failed" ? `<button class="ghost sm" onclick="retryDl(${r.id})">閲嶈瘯</button>` : ""}
        ${(PLATFORM === "xhs" && r.download_status === "done") ? `<button class="ghost sm" onclick="repostDouyin(${r.id})">鍙戞姈闊?/button>` : ""}
        <button class="ghost sm" onclick="delContent(${r.id})">鍒犻櫎</button>
      </div>
    </div>
  </div>`;
}
async function refreshContents() {
  const rows = await api("/api/contents?limit=60&platform=" + PLATFORM +
    (CONTENT_SRC ? "&target_id=" + CONTENT_SRC : ""));
  CONTENTS = rows;
  $("stat-dl").textContent = rows.filter(r => r.download_status === "done").length;
  const xhs = PLATFORM === "xhs";
  $("content-title").textContent = xhs ? "鏈€鏂扮瑪璁?/ 涓嬭浇鐘舵€? : "鏈€鏂颁綔鍝?/ 涓嬭浇鐘舵€?;
  $("content-table-wrap").style.display = xhs ? "none" : "";
  $("content-cards").style.display = xhs ? "" : "none";
  if (xhs) {
    $("content-cards").innerHTML = rows.map(noteCard).join("")
      || `<div class="empty" style="columns:1">${ic("i-image")}<div class="empty-t">鏆傛棤绗旇</div></div>`;
    pruneSel(selContent, rows.map(r => r.id)); updateContentSelBar();
    return;
  }
  $("content-table").innerHTML = rows.map(r => `<tr>
    <td><input type="checkbox" data-id="${r.id}" onchange="contentToggleOne(${r.id}, this.checked)" ${selContent.has(r.id) ? "checked" : ""}></td>
    <td>${r.cover_url ? `<img class="thumb" src="${r.cover_url}" alt="灏侀潰" referrerpolicy="no-referrer" onclick="openPreview(${r.id})">` : ""}</td>
    <td class="wrap" style="max-width:260px">${esc(r.desc || "(鏃犳弿杩?").slice(0, 50)}${(() => { const t = monitorById(r.target_id); return t ? `<div style="margin-top:4px">${srcChip(monitorName(t))}</div>` : ""; })()}</td>
    <td>${r.media_type === "images" ? "鍥鹃泦" : "瑙嗛"}${r.quality ? ` <span class="mut">${esc(r.quality)}</span>` : ""}</td>
    <td class="mut num">${fmtTime(r.create_time)}</td>
    <td class="num"><span class="metric like">${ic("i-heart")}${fmtNum(r.like_count)}</span>${r.duration ? `<span class="metric">${ic("i-clock")}${fmtDur(r.duration)}</span>` : ""}</td>
    <td class="acttd">
      <span class="pill ${r.download_status}">${r.download_status}</span>${r.error ? ` <span class="warn-ic" title="${esc(r.error)}">${ic("i-info")}</span>` : ""}
      ${r.download_status === "failed" ? ` <button class="ghost sm" onclick="retryDl(${r.id})">閲嶈瘯</button>` : ""}
      ${(PLATFORM === "douyin" && r.download_status === "done") ? ` <button class="ghost sm" onclick="repostXhs(${r.id})">鍙戝皬绾功</button>` : ""}
      ${(PLATFORM === "xhs" && r.download_status === "done") ? ` <button class="ghost sm" onclick="repostDouyin(${r.id})">鍙戞姈闊?/button>` : ""}
      <button class="ghost sm" onclick="delContent(${r.id})">鍒犻櫎</button>
    </td>
    <td class="mut num" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(r.local_path || "")}">${esc(r.local_path || "")}</td>
  </tr>`).join("") || empty(8, "鏆傛棤浣滃搧", "i-film", "鐩戞帶鐩爣鏈夋柊浣滃搧鏃朵細鑷姩鎶撳彇骞朵笅杞?鏄剧ず鍦ㄨ繖閲?);
  pruneSel(selContent, rows.map(r => r.id)); updateContentSelBar();
}
async function retryDl(id) {
  const btn = event.target.closest("button"); btn.disabled = true; btn.textContent = "閲嶈瘯涓€?;
  try { await api("/api/contents/" + id + "/retry-download", { method: "POST" }); toast("宸查噸鏂板姞鍏ヤ笅杞介槦鍒?, "ok"); }
  catch (e) { toast("閲嶈瘯澶辫触:" + e.message, "err"); }
  setTimeout(() => refreshContents(), 1200);
}
async function delContent(id) {
  if (!await uiConfirm({ title: "鍒犻櫎浣滃搧", message: "鍒犻櫎杩欐潯浣滃搧璁板綍鍙婂叾宸蹭笅杞界殑鏈湴鏂囦欢?", okText: "鍒犻櫎", danger: true })) return;
  try { const r = await api("/api/contents/" + id + "?with_file=true", { method: "DELETE" }); toast(`宸插垹闄?娓呯悊 ${r.files_removed} 涓枃浠?`, "ok"); refreshContents(); }
  catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 璇勮鐩戞帶(鐙珛) 鈹€鈹€鈹€
const SRC = { public: "鍏紑", creator: "鍒涗綔涓績" };
async function addWatch() {
  const url_or_id = $("w-url").value.trim();
  if (!url_or_id) { toast("璇风矘璐磋棰戦摼鎺?/ 璐﹀彿涓婚〉 / sec_uid", "err"); return; }
  if (PLATFORM === "xhs" && !$("w-acc").value) {
    if (!ACCOUNTS.length) { toast("璇峰厛鍦ㄣ€岃处鍙枫€嶉噷瀹屾垚灏忕孩涔︽壂鐮佺櫥褰?, "err"); switchTab("accounts"); return; }
    toast("灏忕孩涔﹁瘎璁虹洃鎺у繀椤婚€夋嫨涓€涓凡鐧诲綍璐﹀彿", "err"); return;
  }
  const btn = evtBtn();
  $("w-msg").textContent = "瑙ｆ瀽涓€?;
  await withBusy(btn, "瑙ｆ瀽涓?, async () => {
    try {
      await api("/api/comment-watches", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url_or_id, platform: PLATFORM, kind: $("w-kind").value, mode: PLATFORM === "xhs" ? "public" : $("w-mode").value, account_id: $("w-acc").value ? +$("w-acc").value : null, interval_seconds: +$("w-interval").value }),
      });
      $("w-url").value = ""; $("w-msg").textContent = "宸叉坊鍔?鉁?; toast("宸插紑濮嬬洃鎺ц瘎璁?, "ok");
    } catch (e) { $("w-msg").textContent = "澶辫触: " + e.message; toast("娣诲姞澶辫触:" + e.message, "err"); }
  });
  refreshWatches();
}
async function refreshWatches() {
  const ws = await api("/api/comment-watches?platform=" + PLATFORM);
  WATCHES = ws; populateCommentSrc();
  if ($("tb-watch")) $("tb-watch").textContent = ws.length;
  $("watch-table").innerHTML = ws.map(w => `<tr>
    <td><div class="user-cell">${w.avatar ? `<img class="avatar" src="${w.avatar}" referrerpolicy="no-referrer">` : ""}<span>${esc(w.title || w.aweme_id || (w.sec_uid || "").slice(0, 12))}</span></div></td>
    <td>${w.kind === "video" ? (w.platform === "xhs" ? "绗旇" : "瑙嗛") : (w.platform === "xhs" ? "鍒涗綔鑰? : "璐﹀彿")}</td>
    <td>${w.platform === "xhs" ? "鍏紑" : (SRC[w.mode] || w.mode)}</td>
    <td class="num">${w.comment_count}</td>
    <td class="num">${Math.round(w.interval_seconds / 60)} 鍒?/td>
    <td class="mut">${w.last_scan_at ? new Date(w.last_scan_at + "Z").toLocaleString() : "鈥?}${w.last_error ? ` <span class="warn-ic" title="${esc(w.last_error)}">${ic("i-info")}</span>` : ""}</td>
    <td><span class="pill ${w.enabled ? "active" : "invalid"}">${w.enabled ? "鐩戞帶涓? : "宸叉殏鍋?}</span></td>
    <td class="acttd">
      <button class="ghost sm" onclick="scanWatch(${w.id})">绔嬪嵆鎶撳彇</button>
      <button class="ghost sm" onclick="toggleWatch(${w.id}, ${!w.enabled})">${w.enabled ? "鏆傚仠" : "鍚敤"}</button>
      <button class="ghost sm" onclick="delWatch(${w.id})">鍒犻櫎</button>
    </td></tr>`).join("") || empty(8, "鏆傛棤璇勮鐩戞帶", "i-msg", "绮樿创涓€鏉¤棰?绗旇閾炬帴鐩崟鏉?鎴栫矘璐翠富椤电洴鍒涗綔鑰呰繎鏈熶綔鍝佺殑璇勮");
}
async function scanWatch(id) {
  const btn = evtBtn();
  toast("鎶撳彇涓€︽鍦ㄦ媺鍙栬瘎璁哄尯", "info", 7000);
  await withBusy(btn, "鎶撳彇涓?, async () => {
    try { const r = await api("/api/comment-watches/" + id + "/scan-now", { method: "POST" }); toast(`璇勮鎶撳彇瀹屾垚,鏂板 ${r.new_comments ?? 0} 鏉, "ok"); }
    catch (e) { toast("鎶撳彇澶辫触:" + e.message, "err"); }
  });
  refreshWatches(); refreshComments();
}
async function toggleWatch(id, on) { try { await api("/api/comment-watches/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: on }) }); refreshWatches(); } catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); } }
async function delWatch(id) { if (await uiConfirm({ title: "鍒犻櫎璇勮鐩戞帶", message: "鍒犻櫎璇ヨ瘎璁虹洃鎺у強鍏舵姄鍒扮殑璇勮?", okText: "鍒犻櫎", danger: true })) { try { await api("/api/comment-watches/" + id, { method: "DELETE" }); toast("宸插垹闄?, "ok"); refreshWatches(); refreshComments(); } catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); } } }

async function refreshComments() {
  const rows = await api("/api/comments?limit=80&platform=" + PLATFORM +
    (COMMENT_SRC ? "&watch_id=" + COMMENT_SRC : ""));
  $("stat-cmt").textContent = rows.length;
  $("comment-table").innerHTML = rows.map(r => {
    const w = watchById(r.watch_id);
    const src = w ? `<div style="margin-top:4px">${srcChip(watchName(w))}</div>` : "";
    return `<tr>
    <td><input type="checkbox" data-id="${r.id}" onchange="commentToggleOne(${r.id}, this.checked)" ${selComment.has(r.id) ? "checked" : ""}></td>
    <td class="wrap" style="max-width:360px">${r.is_reply ? '<span class="mut">鈫?/span> ' : ""}${esc(r.text || "").slice(0, 60)}${src}</td>
    <td class="mut">${esc(r.user_nickname || "")}</td>
    <td class="mut num">${fmtNum(r.like_count)}</td>
    <td class="mut num">${fmtTime(r.create_time)}</td>
    <td class="acttd"><button class="ghost sm" onclick="delComment(${r.id})">鍒犻櫎</button></td>
  </tr>`;
  }).join("") || empty(6, "鏆傛棤璇勮", "i-msg", "娣诲姞璇勮鐩戞帶鍚?鎶撳埌鐨勬柊璇勮浼氭樉绀哄湪杩欓噷,骞跺彲鎺ㄩ€侀€氱煡");
  pruneSel(selComment, rows.map(r => r.id)); updateCommentSelBar();
}
async function delComment(id) {
  try { await api("/api/comments/" + id, { method: "DELETE" }); refreshComments(); }
  catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); }
}
async function clearComments() {
  if (!await uiConfirm({ title: "娓呯┖璇勮", message: "娓呯┖鎵€鏈夎瘎璁鸿褰?", okText: "娓呯┖", danger: true })) return;
  try { const r = await api("/api/comments", { method: "DELETE" }); toast(`宸叉竻绌?${r.deleted} 鏉¤瘎璁篳, "ok"); refreshComments(); }
  catch (e) { toast("娓呯┖澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 棰勮 lightbox(鍥鹃泦宸﹀彸缈诲姩)鈹€鈹€鈹€
let PV_N = 0, PV_I = 0;
function _pvRender(d) {
  const box = $("pv-media"), cap = $("pv-cap");
  const vid = (d.medias || []).find(m => m.kind === "video");
  if (d.media_type === "video" && vid) {
    box.innerHTML = `<video src="${vid.url}" controls autoplay playsinline preload="metadata" poster="${esc(d.cover_url || "")}" referrerpolicy="no-referrer"></video>`;
  } else {
    const imgs = (d.medias || []).filter(m => m.kind === "image");
    const list = imgs.length ? imgs : (d.cover_url ? [{ url: d.cover_url }] : []);
    if (!list.length) {
      box.innerHTML = `<div class="pv-loading">鏆傛棤鍙瑙堢殑濯掍綋</div>`;
    } else {
      PV_N = list.length; PV_I = 0;
      const slides = list.map(m => `<div class="pv-slide"><img src="${m.url}" referrerpolicy="no-referrer" alt=""></div>`).join("");
      const nav = PV_N > 1 ? `
        <button class="pv-arrow left" id="pv-prev" onclick="pvNav(-1)" aria-label="涓婁竴寮?>${ic("i-prev")}</button>
        <button class="pv-arrow right" id="pv-next" onclick="pvNav(1)" aria-label="涓嬩竴寮?>${ic("i-next")}</button>
        <div class="pv-counter" id="pv-counter"></div>` : "";
      box.innerHTML = `<div class="pv-carousel"><div class="pv-track" id="pv-track">${slides}</div>${nav}</div>`;
      _pvBindSwipe();
      pvUpdate();
    }
  }
  cap.textContent = d.desc || "";
}
async function _pvOpen(fetcher, startIdx) {
  const ov = $("preview"), box = $("pv-media");
  PV_N = 0; PV_I = 0;
  box.innerHTML = `<div class="pv-loading">鍔犺浇涓€?/div>`; $("pv-cap").textContent = "";
  ov.style.display = "flex";
  try {
    _pvRender(await fetcher());
    if (startIdx && PV_N > 1) { PV_I = Math.max(0, Math.min(startIdx, PV_N - 1)); pvUpdate(); }
  }
  catch (e) { box.innerHTML = `<div class="pv-loading">棰勮澶辫触:${esc(e.message)}</div>`; }
}
function openPreview(id, startIdx) {
  return _pvOpen(() => api("/api/contents/" + id + "/media"), startIdx || 0);
}
function openPubPreview(accId, noteId, tok, src) {
  return _pvOpen(() => api(`/api/publish/note-media?account_id=${accId}&note_id=${encodeURIComponent(noteId)}&xsec_token=${encodeURIComponent(tok || "")}&xsec_source=${encodeURIComponent(src || "")}`));
}
async function openPubComments(accId, noteId, tok, src) {
  const ov = $("preview"), box = $("pv-media"), cap = $("pv-cap");
  PV_N = 0; PV_I = 0;
  box.innerHTML = `<div class="pv-loading">鍔犺浇璇勮鈥?/div>`; cap.textContent = ""; ov.style.display = "flex";
  try {
    const d = await api(`/api/publish/note-comments?account_id=${accId}&note_id=${encodeURIComponent(noteId)}&xsec_token=${encodeURIComponent(tok || "")}&xsec_source=${encodeURIComponent(src || "")}`);
    cap.textContent = `鍏?${d.total} 鏉¤瘎璁篳 + (d.has_more ? "(浠呴椤?" : "");
    box.innerHTML = `<div class="cmt-wrap">` + ((d.comments || []).map(c => `
      <div class="cmt-item">
        <div class="cmt-head"><b>${esc(c.user_nickname || "鐢ㄦ埛")}</b><span class="like">${ic("i-heart")}${fmtNum(c.like_count)}</span></div>
        <div class="cmt-text">${c.is_reply ? '<span class="mut">鈫?</span>' : ""}${esc(c.text || "")}</div>
        <div class="cmt-time">${fmtTime(c.create_time)}</div>
      </div>`).join("") || `<div class="pv-loading">鏆傛棤璇勮</div>`) + `</div>`;
  } catch (e) { box.innerHTML = `<div class="pv-loading">鍔犺浇澶辫触:${esc(e.message)}</div>`; }
}
function pvUpdate() {
  const tr = $("pv-track"); if (!tr) return;
  tr.style.transform = `translateX(-${PV_I * 100}%)`;
  const c = $("pv-counter"); if (c) c.textContent = `${PV_I + 1} / ${PV_N}`;
  const p = $("pv-prev"), n = $("pv-next");
  if (p) p.disabled = PV_I <= 0;
  if (n) n.disabled = PV_I >= PV_N - 1;
}
function pvNav(delta) {
  if (!PV_N) return;
  PV_I = Math.max(0, Math.min(PV_N - 1, PV_I + delta));
  pvUpdate();
}
function _pvBindSwipe() {
  const tr = $("pv-track"); if (!tr) return;
  let x0 = null;
  tr.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  tr.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) pvNav(dx < 0 ? 1 : -1);
    x0 = null;
  }, { passive: true });
}
function hidePreview() {
  const v = $("pv-media").querySelector("video"); if (v) { try { v.pause(); } catch (e) {} }
  $("preview").style.display = "none"; $("pv-media").innerHTML = ""; $("pv-cap").textContent = "";
  PV_N = 0; PV_I = 0;
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && $("repost") && $("repost").style.display !== "none") { hideRepost(); return; }
  if ($("preview").style.display === "none") return;
  if (e.key === "Escape") hidePreview();
  else if (e.key === "ArrowLeft") pvNav(-1);
  else if (e.key === "ArrowRight") pvNav(1);
});

// 鈹€鈹€鈹€ 鍙戝竷鍒板皬绾功 鈹€鈹€鈹€
function populatePubAcc() {
  const sel = $("pub-acc"); if (!sel) return;
  // 灏忕孩涔﹀彂甯冮渶鍒涗綔鑰呭彿;鎶栭煶 / 蹇墜鍙戝竷鏈夌櫥褰曟€佸嵆鍙?璧版祻瑙堝櫒鑷姩鍖?
  const list = PLATFORM === "xhs" ? ACCOUNTS.filter(a => a.has_creator) : ACCOUNTS;
  const ph = list.length ? "閫夋嫨鍙戝竷璐﹀彿"
    : (PLATFORM === "kuaishou" ? "璇峰厛瀹屾垚銆屽揩鎵嬫壂鐮?鍒涗綔鑰呯櫥褰曘€?
      : PLATFORM === "douyin" ? "璇峰厛瀹屾垚銆屾姈闊虫壂鐮?鍒涗綔鑰呯櫥褰曘€? : "璇峰厛瀹屾垚銆屽皬绾功鍒涗綔鑰呯櫥褰曘€?);
  sel.innerHTML = accOptions(list, ph);
  if (list.length) sel.value = String(list[0].id);
}
let pubFilesDT = new DataTransfer();
function onPubType() {
  const v = $("pub-type").value, inp = $("pub-files"), lbl = $("pub-files-label");
  if (!inp) return;
  if (v === "video") { inp.accept = "video/*"; inp.multiple = false; lbl.textContent = "閫夋嫨瑙嗛鏂囦欢(鍗曚釜)"; }
  else { inp.accept = "image/*"; inp.multiple = true; lbl.textContent = "閫夋嫨鍥剧墖(鍙閫?鏈€澶?18 寮?"; }
  pubFilesClear();
}
function pubFilesClear() { pubFilesDT = new DataTransfer(); _pubSync(); }
function _pubSync() { const inp = $("pub-files"); if (inp) inp.files = pubFilesDT.files; renderPubFiles(); }
function pubAddFiles(files) {
  const isVideo = $("pub-type").value === "video";
  for (const f of files) {
    if (isVideo) { pubFilesDT = new DataTransfer(); pubFilesDT.items.add(f); break; }
    if ([...pubFilesDT.files].some(x => x.name === f.name && x.size === f.size)) continue;
    if (pubFilesDT.files.length >= 18) break;
    pubFilesDT.items.add(f);
  }
  _pubSync();
}
function pubRemoveFile(i) {
  const dt = new DataTransfer();
  [...pubFilesDT.files].forEach((f, idx) => { if (idx !== i) dt.items.add(f); });
  pubFilesDT = dt; _pubSync();
}
function renderPubFiles() {
  const box = $("pub-filelist"); if (!box) return;
  box.innerHTML = [...pubFilesDT.files].map((f, i) => {
    const thumb = f.type.startsWith("image/")
      ? `<img src="${URL.createObjectURL(f)}" alt="">`
      : `<span class="fp-ph">${ic("i-play")}</span>`;
    return `<span class="fp-chip">${thumb}<span title="${esc(f.name)}">${esc(f.name)}</span><button type="button" onclick="pubRemoveFile(${i})" aria-label="绉婚櫎">鉁?/button></span>`;
  }).join("");
}
function bindPubFilePicker() {
  const inp = $("pub-files"), zone = $("pub-drop");
  if (!inp || !zone) return;
  inp.addEventListener("change", e => { pubAddFiles(e.target.files); });
  ["dragenter", "dragover"].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add("drag"); }));
  ["dragleave", "drop"].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); if (ev === "dragleave" && zone.contains(e.relatedTarget)) return; zone.classList.remove("drag"); }));
  zone.addEventListener("drop", e => { if (e.dataTransfer && e.dataTransfer.files.length) pubAddFiles(e.dataTransfer.files); });
}
async function addPublish() {
  const acc = $("pub-acc").value;
  if (!acc) { toast("璇烽€夋嫨" + (PF_NAME[PLATFORM] || "鍙戝竷") + "璐﹀彿", "err"); return; }
  const files = $("pub-files").files;
  if (!files.length) { toast("璇峰厛閫夋嫨瑕佸彂甯冪殑鏂囦欢", "err"); return; }
  const btn = evtBtn();
  $("pub-msg").textContent = "涓婁紶涓€?;
  await withBusy(btn, "涓婁紶涓?, async () => {
    try {
      const fd = new FormData(); for (const f of files) fd.append("files", f);
      const ur = await fetch("/api/publish/upload", { method: "POST", body: fd });
      if (!ur.ok) throw new Error("涓婁紶澶辫触 " + ur.status);
      const up = await ur.json();
      const paths = (up.files || []).map(f => f.path);
      const when = $("pub-when").value || null;
      await api("/api/publish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: +acc, media_type: $("pub-type").value, title: $("pub-title").value.trim(), desc: $("pub-desc").value, topics: $("pub-topics").value.trim(), media_paths: paths, scheduled_at: when,
          visibility: $("pub-visibility") ? $("pub-visibility").value : "public",
          allow_save: $("pub-allowsave") ? $("pub-allowsave").value !== "0" : true }),
      });
      pubFilesClear(); $("pub-title").value = ""; $("pub-desc").value = ""; $("pub-topics").value = ""; $("pub-when").value = ""; dtSyncAll();
      $("pub-msg").textContent = when ? "宸插姞鍏ュ畾鏃堕槦鍒?鉁? : "宸插姞鍏ラ槦鍒?鍗冲皢鍙戝竷 鉁?;
      toast("宸插姞鍏ュ彂甯冮槦鍒?, "ok");
    } catch (e) { $("pub-msg").textContent = "澶辫触: " + e.message; toast("鍙戝竷澶辫触:" + e.message, "err"); }
  });
  refreshPublish();
}
const PUB_ST = { pending: "鎺掗槦涓?, publishing: "鍙戝竷涓?, done: "宸插彂甯?, failed: "澶辫触", canceled: "宸插彇娑? };
const PUB_PILL = { pending: "pending", publishing: "downloading", done: "done", failed: "failed", canceled: "invalid" };
async function refreshPublish() {
  if (!$("pub-table")) return;
  const rows = await api("/api/publish?platform=" + (pfHasPublish(PLATFORM) ? PLATFORM : "xhs"));
  if ($("tb-pub")) $("tb-pub").textContent = rows.length;
  $("pub-table").innerHTML = rows.map(t => `<tr>
    <td class="wrap" style="max-width:220px">${esc(t.title || "(鏃犳爣棰?")}</td>
    <td>${t.media_type === "video" ? "瑙嗛" : "鍥炬枃"}</td>
    <td class="num">${t.media_count}</td>
    <td>${t.source_platform ? esc(t.source_platform) + " 杞彂" : "鎵嬪姩"}</td>
    <td class="mut num">${t.scheduled_at ? new Date(t.scheduled_at + "Z").toLocaleString() : "灏藉揩"}</td>
    <td><span class="pill ${PUB_PILL[t.status] || "pending"}">${PUB_ST[t.status] || t.status}</span>${t.error ? ` <span class="warn-ic" title="${esc(t.error)}">${ic("i-info")}</span>` : ""}${t.result_url ? ` <a href="${esc(t.result_url)}" target="_blank">鏌ョ湅</a>` : ""}</td>
    <td class="acttd">
      ${(t.status !== "done" && t.status !== "publishing") ? `<button class="ghost sm" onclick="runPublish(${t.id})">绔嬪嵆鍙戝竷</button>` : ""}
      <button class="ghost sm" onclick="delPublish(${t.id})">鍒犻櫎</button>
    </td></tr>`).join("") || empty(7, "鏆傛棤鍙戝竷浠诲姟", "i-send",
      PLATFORM === "kuaishou" ? "涓婁紶鍥鹃泦/瑙嗛鍔犲叆闃熷垪(鍙戝竷鍒板揩鎵嬪垱浣滃钩鍙?"
      : PLATFORM === "douyin" ? "涓婁紶鍥鹃泦/瑙嗛鍔犲叆闃熷垪(鍙戝竷鍒版姈闊冲垱浣滃钩鍙?"
      : "涓婁紶鍥鹃泦/瑙嗛鍔犲叆闃熷垪,鎴栧湪鎶栭煶浣滃搧涓婄偣銆屽彂灏忕孩涔︺€嶈浆鍙戣繃鏉?);
}
async function runPublish(id) {
  const btn = evtBtn();
  toast("鍙戝竷涓€︿細寮瑰嚭娴忚鍣ㄧ獥鍙ｅ畬鎴愬彂甯?, "info", 8000);
  await withBusy(btn, "鍙戝竷涓?, async () => {
    try { const r = await api("/api/publish/" + id + "/run-now", { method: "POST" }); toast(r.ok ? "鍙戝竷鎴愬姛 鉁? : "鍙戝竷鏈垚鍔?" + (r.error || ""), r.ok ? "ok" : "err", 6000); }
    catch (e) { toast("鍙戝竷澶辫触:" + e.message, "err"); }
  });
  refreshPublish();
}
async function delPublish(id) {
  if (!await uiConfirm({ title: "鍒犻櫎鍙戝竷浠诲姟", message: "鍒犻櫎璇ュ彂甯冧换鍔?", okText: "鍒犻櫎", danger: true })) return;
  try { await api("/api/publish/" + id, { method: "DELETE" }); toast("宸插垹闄?, "ok"); refreshPublish(); }
  catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); }
}

let PUB_NOTES = [], PUB_ACC = "", PUB_GOOD = false;
async function loadPublished() {
  const acc = $("pub-acc").value;
  if (!acc) { toast("璇峰厛閫夋嫨灏忕孩涔﹁处鍙?, "err"); return; }
  PUB_ACC = acc;
  const btn = evtBtn();
  $("published-msg").textContent = "鎷夊彇涓€?璧板垱浣滃钩鍙?鍙兘闇€鍑犵)";
  $("published-grid").innerHTML = "";
  await withBusy(btn, "鎷夊彇涓?, async () => {
    try {
      const d = await api("/api/publish/published?account_id=" + acc);
      PUB_NOTES = d.notes || []; PUB_GOOD = !!d.good_tokens;
      $("published-msg").innerHTML = `鍏?${d.total} 鏉 + (PUB_GOOD ? "" :
        ` 路 <span style="color:var(--warn)">瑙嗛棰勮/璇勮闇€鍏堝璇ヨ处鍙峰仛銆屽皬绾功鎵爜鐧诲綍銆?璇诲彇鐧诲綍)</span>`);
      $("published-grid").innerHTML = PUB_NOTES.map((n, i) => `<div class="ncard">
        ${n.cover ? `<img class="ncard-cover" src="${n.cover}" referrerpolicy="no-referrer" loading="lazy" alt="" onclick="pubPreview(${i})">` : `<div class="ncard-cover ph" onclick="pubPreview(${i})">${ic("i-image")}</div>`}
        <span class="ncard-type">${ic(n.type === "video" ? "i-play" : "i-image")}${n.type === "video" ? "瑙嗛" : "鍥炬枃"}</span>
        <div class="ncard-body"><p class="ncard-title">${esc(n.title || "(鏃犳爣棰?")}</p>
          <div class="ncard-foot"><span>${n.time ? new Date((n.time + "").length > 10 ? n.time : n.time * 1000).toLocaleDateString() : ""}</span><span class="like">${ic("i-heart")}${fmtNum(n.like)}</span></div>
          <div class="ncard-actions"><button class="ghost sm" onclick="pubComments(${i})">${ic("i-msg")}璇勮</button></div>
        </div></div>`).join("") || `<div class="mut" style="columns:1">璇ヨ处鍙锋殏鏃犲凡鍙戝竷浣滃搧</div>`;
    } catch (e) { $("published-msg").textContent = "澶辫触:" + e.message; toast("鎷夊彇澶辫触:" + e.message, "err"); }
  });
}
function pubPreview(i) {
  const n = PUB_NOTES[i]; if (!n) return;
  if (n.images && n.images.length) {   // 鍥炬枃:鐩存帴鐢ㄥ垪琛ㄩ噷鐨勫叏鍥?鏃犻渶鍐嶈姹?    return _pvOpen(async () => ({
      media_type: "images", desc: n.title || "",
      medias: n.images.map((u, idx) => ({ url: u, kind: "image", ext: "jpeg", index: idx })),
    }));
  }
  return openPubPreview(PUB_ACC, n.note_id, n.xsec_token, n.xsec_source);  // 瑙嗛璧拌鎯呮帴鍙?}
function pubComments(i) {
  const n = PUB_NOTES[i]; if (!n) return;
  return openPubComments(PUB_ACC, n.note_id, n.xsec_token, n.xsec_source);
}

// 鈹€鈹€鈹€ 璺ㄥ钩鍙?鎶栭煶浣滃搧 鈫?灏忕孩涔?鈹€鈹€鈹€
async function _pickXhsAccount(withOff) {
  const all = await api("/api/accounts?platform=xhs");
  const accs = all.filter(a => a.has_creator);   // 鍙戝竷闇€鍒涗綔鑰呭彿
  if (!accs.length) { toast("璇峰厛鍦ㄥ皬绾功璐﹀彿椤靛畬鎴愩€屽垱浣滆€呯櫥褰曘€?鍙戝竷鐢?", "err"); return undefined; }
  if (!withOff && accs.length === 1) return accs[0].id;
  const options = (withOff ? [{ value: "-1", label: "馃毇 鍏抽棴杞彂" }] : [])
    .concat(accs.map(a => ({ value: String(a.id), label: a.nickname })));
  const v = await uiSelect({
    title: withOff ? "涓嬭浇鍚庤嚜鍔ㄨ浆鍙戝埌鈥? : "鍙戝竷鍒板摢涓皬绾功璐﹀彿",
    options, value: withOff ? "-1" : String(accs[0].id),
  });
  if (v === null) return undefined;
  return +v;
}
let REPOST_ID = null;
let REPOST_TARGET = "xhs";           // 杞彂鐩爣骞冲彴:xhs(鎶栭煶鈫掑皬绾功) | douyin(灏忕孩涔︹啋鎶栭煶)
const repostXhs = (id) => openRepost(id, "xhs");
const repostDouyin = (id) => openRepost(id, "douyin");
async function openRepost(id, target) {
  const rec = CONTENTS.find(r => r.id === id);
  // 鎷夊彇鐩爣骞冲彴鍙彂甯冭处鍙?灏忕孩涔﹂渶鍒涗綔鍙?鎶栭煶闇€浠讳竴鐧诲綍鎬?璧版祻瑙堝櫒鑷姩鍖?
  const all = await api("/api/accounts?platform=" + target);
  const accs = target === "xhs"
    ? all.filter(a => a.has_creator)
    : all.filter(a => a.has_storage || a.has_creator);
  if (!accs.length) {
    toast(target === "xhs" ? "璇峰厛鍦ㄥ皬绾功璐﹀彿椤靛畬鎴愩€屽垱浣滆€呯櫥褰曘€?鍙戝竷鐢?"
      : "璇峰厛鍦ㄦ姈闊宠处鍙烽〉瀹屾垚鐧诲綍(鎵爜/鍒涗綔鑰?Cookie)", "err");
    return;
  }
  REPOST_ID = id; REPOST_TARGET = target;
  const isDy = target === "douyin", cap = isDy ? 30 : 20;
  $("rp-head").textContent = (isDy ? "鍙戞姈闊? : "鍙戝皬绾功") + " 路 缂栬緫鍚庢帹閫?;
  $("rp-title-label").textContent = `鏍囬(鈮?{cap} 瀛?`;
  $("rp-title").maxLength = cap;
  $("rp-title").placeholder = isDy ? "缁欎綔鍝佽捣涓爣棰? : "缁欑瑪璁拌捣涓爣棰?;
  $("rp-acc").innerHTML = accs.map(a => `<option value="${a.id}">${esc(a.nickname)}</option>`).join("");
  const desc = (rec && rec.desc) || "";
  $("rp-title").value = desc.slice(0, cap);   // 榛樿鐢ㄤ綔鍝佹弿杩板墠鑻ュ共瀛楀綋鏍囬
  $("rp-desc").value = desc;
  $("rp-topics").value = "";
  $("rp-when").value = ""; dtSyncAll();
  $("rp-msg").textContent = "";
  $("rp-src").textContent = rec ? `鏉ユ簮:${rec.media_type === "images" ? "鍥鹃泦" : "瑙嗛"} 路 ${esc((rec.desc || "(鏃犳弿杩?").slice(0, 30))}` : "";
  // 鎶栭煶鍙戝竷璁剧疆(鍙鎬?/ 淇濆瓨鏉冮檺)浠呯洰鏍囦负鎶栭煶鏃舵樉绀?  if ($("rp-dy-opts")) $("rp-dy-opts").style.display = isDy ? "flex" : "none";
  if (isDy) { if ($("rp-visibility")) $("rp-visibility").value = "public"; if ($("rp-allowsave")) $("rp-allowsave").value = "1"; }
  renderRepostThumbs(id);   // 寮傛鎷夊獟浣撶缉鐣ュ浘,涓嶉樆濉炲脊绐?  $("rp-submit").disabled = false;
  $("repost").style.display = "flex";
  $("rp-title").focus();
}
let RP_MEDIA = [];         // 鍙紪杈戝浘闆?[{url, idx}](idx=鍘熷搴忓彿,鎻愪氦鏃跺洖浼?
let RP_MEDIA_LEN = 0;      // 鍘熷鍥剧墖鎬绘暟(鍒ゆ柇鏄惁琚紪杈戣繃)
let RP_IS_VIDEO = false;
async function renderRepostThumbs(id) {
  const box = $("rp-thumbs"); if (!box) return;
  RP_MEDIA = []; RP_MEDIA_LEN = 0; RP_IS_VIDEO = false;
  box.style.display = "none"; box.innerHTML = "";
  try {
    const d = await api("/api/contents/" + id + "/media");
    if (REPOST_ID !== id) return;   // 寮圭獥宸插垏鎹?鍏抽棴
    const vid = (d.medias || []).find(m => m.kind === "video");
    if (d.media_type === "video" && vid) {
      RP_IS_VIDEO = true;
      box.innerHTML = `<div class="rp-th-ph" onclick="openPreview(${id})" title="鐐瑰嚮棰勮瑙嗛">${ic("i-play")}</div>`;
      box.style.display = "flex";
      return;
    }
    const imgs = (d.medias || []).filter(m => m.kind === "image").map(m => m.url);
    const all = imgs.length ? imgs : (d.cover_url ? [d.cover_url] : []);
    RP_MEDIA = all.map((u, i) => ({ url: u, idx: i }));
    RP_MEDIA_LEN = RP_MEDIA.length;
    rpDrawThumbs();
  } catch (e) { /* 棰勮澶辫触涓嶅奖鍝嶈浆鍙?*/ }
}
function rpDrawThumbs() {
  const box = $("rp-thumbs"); if (!box) return;
  if (!RP_MEDIA.length) { box.style.display = "none"; box.innerHTML = ""; return; }
  const n = RP_MEDIA.length;
  box.innerHTML = RP_MEDIA.map((m, pos) => `
    <div class="rp-th" draggable="true" data-pos="${pos}"
         ondragstart="rpDragStart(${pos},event)" ondragover="rpDragOver(${pos},event)"
         ondragleave="rpDragLeave(event)" ondrop="rpDrop(${pos},event)" ondragend="rpDragEnd()">
      <img src="${esc(m.url)}" referrerpolicy="no-referrer" draggable="false" alt="" title="鐐瑰嚮鐪嬪ぇ鍥? onclick="openPreview(${REPOST_ID},${m.idx})">
      <span class="rp-th-badge${pos === 0 ? " cover" : ""}">${pos === 0 ? "灏侀潰" : pos + 1}</span>
      <button type="button" class="rp-th-x" title="绉婚櫎杩欏紶" onclick="rpImgRemove(${pos})">鉁?/button>
      <div class="rp-th-mv">
        <button type="button" onclick="rpImgMove(${pos},-1)" ${pos === 0 ? "disabled" : ""} title="鍓嶇Щ(绉诲埌鏈€鍓?灏侀潰)">鈥?/button>
        <button type="button" onclick="rpImgMove(${pos},1)" ${pos === n - 1 ? "disabled" : ""} title="鍚庣Щ">鈥?/button>
      </div>
    </div>`).join("") + `<span class="rp-th-more">鍏?${n} 寮?路 鎷栨嫿鎺掑簭 路 棣栧浘涓哄皝闈?/span>`;
  box.style.display = "flex";
}
let RP_DRAG = -1;
function rpDragStart(pos, ev) {
  RP_DRAG = pos;
  try { ev.dataTransfer.effectAllowed = "move"; ev.dataTransfer.setData("text/plain", String(pos)); } catch (e) {}
}
function rpDragOver(pos, ev) {
  ev.preventDefault();
  try { ev.dataTransfer.dropEffect = "move"; } catch (e) {}
  if (RP_DRAG !== -1 && pos !== RP_DRAG && ev.currentTarget) ev.currentTarget.classList.add("dragover");
}
function rpDragLeave(ev) { if (ev.currentTarget) ev.currentTarget.classList.remove("dragover"); }
function rpDrop(pos, ev) {
  ev.preventDefault();
  const from = RP_DRAG; RP_DRAG = -1;
  if (from < 0 || from >= RP_MEDIA.length || from === pos) { rpDrawThumbs(); return; }
  const [item] = RP_MEDIA.splice(from, 1);
  RP_MEDIA.splice(pos, 0, item);   // 鎷栧埌鐩爣浣嶇疆(鍏朵綑椤哄欢)
  rpDrawThumbs();
}
function rpDragEnd() {
  RP_DRAG = -1;
  document.querySelectorAll("#rp-thumbs .rp-th.dragover").forEach(e => e.classList.remove("dragover"));
}
function rpImgRemove(pos) {
  if (RP_MEDIA.length <= 1) { toast("鑷冲皯淇濈暀涓€寮犲浘鐗?, "err"); return; }
  RP_MEDIA.splice(pos, 1); rpDrawThumbs();
}
function rpImgMove(pos, dir) {
  const j = pos + dir;
  if (j < 0 || j >= RP_MEDIA.length) return;
  [RP_MEDIA[pos], RP_MEDIA[j]] = [RP_MEDIA[j], RP_MEDIA[pos]];
  rpDrawThumbs();
}
// 鍥剧墖琚紪杈戣繃(鍒犱簡 / 璋冧簡搴?鎵嶅洖浼?media_order;鏈姩鍒?null 鐢ㄥ叏閮ㄥ師搴?function rpMediaOrder() {
  if (RP_IS_VIDEO || !RP_MEDIA.length) return null;
  const order = RP_MEDIA.map(m => m.idx);
  const unchanged = order.length === RP_MEDIA_LEN && order.every((v, i) => v === i);
  return unchanged ? null : order;
}
function hideRepost() { $("repost").style.display = "none"; REPOST_ID = null; }
async function submitRepost() {
  if (REPOST_ID === null) return;
  const accId = +$("rp-acc").value;
  if (!accId) { toast("璇烽€夋嫨鍙戝竷璐﹀彿", "err"); return; }
  const btn = $("rp-submit"); btn.disabled = true;
  $("rp-msg").textContent = "鎻愪氦涓€?;
  const body = {
    account_id: accId,
    title: $("rp-title").value.trim(),
    desc: $("rp-desc").value,
    topics: $("rp-topics").value.trim(),
    scheduled_at: $("rp-when").value || null,
    visibility: $("rp-visibility") ? $("rp-visibility").value : "public",
    allow_save: $("rp-allowsave") ? $("rp-allowsave").value !== "0" : true,
    media_order: rpMediaOrder(),
  };
  const pname = REPOST_TARGET === "douyin" ? "鎶栭煶" : "灏忕孩涔?;
  try {
    const r = await api("/api/contents/" + REPOST_ID + "/repost-" + REPOST_TARGET, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    toast((body.scheduled_at ? "宸插姞鍏ュ畾鏃跺彂甯冮槦鍒? : `宸插姞鍏?{pname}鍙戝竷闃熷垪`) + "(浠诲姟 #" + r.task_id + ")", "ok");
    hideRepost();
    if (typeof refreshPublish === "function") refreshPublish();
  } catch (e) { $("rp-msg").textContent = "澶辫触:" + e.message; toast("杞彂澶辫触:" + e.message, "err"); btn.disabled = false; }
}
async function relayMon(id) {
  const accId = await _pickXhsAccount(true);
  if (accId === undefined) return;
  try { await api("/api/monitors/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ relay_to_xhs_account_id: accId }) }); toast(accId === -1 ? "宸插叧闂嚜鍔ㄨ浆鍙? : "宸茶缃?涓嬭浇鍚庤嚜鍔ㄨ浆鍙戝埌灏忕孩涔?, "ok"); refreshMonitors(); }
  catch (e) { toast("璁剧疆澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 鑷姩璇勮 鈹€鈹€鈹€
let AC_RULES = [];
const AC_MODE_T = { auto_reply: "鑷姩鍥炲", auto_comment: "鑷姩璇勮" };
const AC_KIND_T = { self: "鑷繁杩戞湡浣滃搧", work: "鎸囧畾浣滃搧", creator: "鎸囧畾鍗氫富", keyword: "鍏抽敭璇? };
const AC_TASK_ST = { draft: "鑽夌寰呭", pending: "鎺掗槦涓?, doing: "鍙戦€佷腑", done: "宸插彂閫?, failed: "澶辫触", canceled: "宸插彇娑? };
const AC_TASK_PILL = { draft: "downloading", pending: "pending", doing: "downloading", done: "done", failed: "failed", canceled: "invalid" };
let AC_TASKS = [];

function acKindOptions() {
  if ($("ac-mode").value === "auto_comment") {
    let html = '<option value="creator">鎸囧畾鍗氫富</option>';
    if (PLATFORM === "xhs") html += '<option value="keyword">鎼滅储鍏抽敭璇?/option>';
    return html;
  }
  return '<option value="self">鑷繁杩戞湡浣滃搧</option><option value="work">鎸囧畾浣滃搧</option>';
}
function onAcMode() {
  const k = $("ac-kind"); if (!k) return;
  const prev = k.value;
  k.innerHTML = acKindOptions();
  if ([...k.options].some(o => o.value === prev)) k.value = prev;
  onAcKind();
}
function onAcKind() {
  const mode = $("ac-mode").value, kind = $("ac-kind").value, xhs = PLATFORM === "xhs";
  let show = true, label = "鐩爣", ph = "";
  if (mode === "auto_reply") {
    if (kind === "self") show = false;
    else { label = xhs ? "绗旇閾炬帴 / id" : "浣滃搧閾炬帴 / id"; ph = xhs ? "explore 閾炬帴 / xhslink / note_id" : "浣滃搧閾炬帴 / 鐭摼 / 鏁板瓧 id"; }
  } else {
    if (kind === "keyword") { label = "鎼滅储鍏抽敭璇?; ph = "渚嬪:闇茶惀瑁呭 / 鍙ｇ孩璇曡壊"; }
    else { label = xhs ? "鍗氫富涓婚〉 / id" : "鍗氫富涓婚〉 / sec_uid"; ph = xhs ? "涓婚〉閾炬帴 / xhslink / user_id" : "涓婚〉閾炬帴 / 鐭摼 / sec_uid"; }
  }
  $("ac-target-wrap").style.display = show ? "" : "none";
  $("ac-target-label").textContent = label; $("ac-target").placeholder = ph;
  $("ac-reply-filter").style.display = mode === "auto_reply" ? "" : "none";
  csSyncAll();
}
function populateAcAccount() {
  const sel = $("ac-acc"); if (!sel) return;
  const xhs = PLATFORM === "xhs";
  sel.innerHTML = accOptions(ACCOUNTS, xhs ? "璇烽€夋嫨灏忕孩涔﹁处鍙?蹇呴€?" : "璇烽€夋嫨鎶栭煶璐﹀彿(蹇呴€?");
  if (ACCOUNTS.length) sel.value = String(ACCOUNTS[0].id);
  csSyncAll();
}
async function addCommentRule() {
  const acc = $("ac-acc").value;
  if (!acc) { toast("璇烽€夋嫨璐﹀彿", "err"); return; }
  const templates = $("ac-templates").value.split("\n").map(s => s.trim()).filter(Boolean);
  if (!templates.length) { toast("璇疯嚦灏戝啓涓€鏉℃枃妗堟ā鏉?AI 澶辫触鏃跺洖閫€鐢?", "err"); return; }
  const body = {
    platform: PLATFORM, mode: $("ac-mode").value, account_id: +acc,
    target_kind: $("ac-kind").value, target: $("ac-target").value.trim(),
    templates, use_ai: $("ac-use-ai").checked, require_review: $("ac-review").checked,
    reply_filter: $("ac-reply-filter").value.trim(), skip_keywords: $("ac-skip").value.trim(),
    daily_cap: +$("ac-cap").value || 0, min_gap_seconds: +$("ac-gap").value || 60,
    max_per_run: +$("ac-max").value || 5, interval_seconds: +$("ac-interval").value || 1800, enabled: false,
  };
  try {
    await api("/api/comment-rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    $("ac-templates").value = ""; $("ac-target").value = "";
    $("ac-msg").textContent = "瑙勫垯宸插垱寤?榛樿鍏抽棴),鍙湪涓嬫柟銆岃瘯璺戙€嶉瑙堟枃妗?鉁?;
    toast("瑙勫垯宸插垱寤?, "ok"); refreshCommentRules();
  } catch (e) { $("ac-msg").textContent = "澶辫触: " + e.message; toast("鍒涘缓澶辫触:" + e.message, "err"); }
}

// 鈹€鈹€鈹€ 缂栬緫瑙勫垯:鐙珛寮圭獥(澶嶇敤 uimodal 澹?鈹€鈹€鈹€
let EM_PF = "douyin";
function emKindOptions() {
  if ($("em-mode").value === "auto_comment") {
    let h = '<option value="creator">鎸囧畾鍗氫富</option>';
    if (EM_PF === "xhs") h += '<option value="keyword">鎼滅储鍏抽敭璇?/option>';
    return h;
  }
  return '<option value="self">鑷繁杩戞湡浣滃搧</option><option value="work">鎸囧畾浣滃搧</option>';
}
function emOnMode() {
  const k = $("em-kind"); if (!k) return;
  const prev = k.value;
  k.innerHTML = emKindOptions();
  if ([...k.options].some(o => o.value === prev)) k.value = prev;
  emOnKind();
}
function emOnKind() {
  const mode = $("em-mode").value, kind = $("em-kind").value, xhs = EM_PF === "xhs";
  let show = true, label = "鐩爣", ph = "";
  if (mode === "auto_reply") {
    if (kind === "self") show = false;
    else { label = xhs ? "绗旇閾炬帴 / id" : "浣滃搧閾炬帴 / id"; ph = xhs ? "explore / xhslink / note_id" : "浣滃搧閾炬帴 / 鐭摼 / 鏁板瓧 id"; }
  } else {
    if (kind === "keyword") { label = "鎼滅储鍏抽敭璇?; ph = "渚嬪:闇茶惀瑁呭 / 鍙ｇ孩璇曡壊"; }
    else { label = xhs ? "鍗氫富涓婚〉 / id" : "鍗氫富涓婚〉 / sec_uid"; ph = xhs ? "涓婚〉 / xhslink / user_id" : "涓婚〉 / 鐭摼 / sec_uid"; }
  }
  $("em-target-wrap").style.display = show ? "" : "none";
  $("em-target-label").textContent = label; $("em-target").placeholder = ph;
  $("em-filter-wrap").style.display = mode === "auto_reply" ? "" : "none";
  $("em-reply-filter").style.display = mode === "auto_reply" ? "" : "none";
  csSyncAll();
}
function editRule(id) {
  const r = AC_RULES.find(x => x.id === id); if (!r) return;
  EM_PF = r.platform;
  const accOpts = accOptions(ACCOUNTS, EM_PF === "xhs" ? "璇烽€夋嫨灏忕孩涔﹁处鍙? : "璇烽€夋嫨鎶栭煶璐﹀彿");
  new Promise(res => {
    _uiResolve = res; _uiCancelVal = null;
    _uiGetVal = () => ({
      name: $("em-name").value.trim(), mode: $("em-mode").value,
      target_kind: $("em-kind").value, target: $("em-target").value.trim(),
      account_id: +$("em-acc").value || null,
      templates: $("em-templates").value.split("\n").map(s => s.trim()).filter(Boolean),
      use_ai: $("em-use-ai").checked, require_review: $("em-review").checked,
      reply_filter: $("em-reply-filter").value.trim(), skip_keywords: $("em-skip").value.trim(),
      daily_cap: +$("em-cap").value || 0, min_gap_seconds: +$("em-gap").value || 60,
      max_per_run: +$("em-max").value || 5, interval_seconds: +$("em-interval").value || 1800,
    });
    $("ui-body").innerHTML = `
      <input id="em-name" placeholder="瑙勫垯鍚嶇О">
      <div class="row">
        <select id="em-mode" onchange="emOnMode()"><option value="auto_reply">鑷姩鍥炲(鍥炶嚜宸变綔鍝?</option><option value="auto_comment">鑷姩璇勮(鍘诲埆浜哄笘瀛?</option></select>
        <select id="em-kind" onchange="emOnKind()"></select>
      </div>
      <select id="em-acc">${accOpts}</select>
      <div id="em-target-wrap"><label class="field" id="em-target-label">鐩爣</label><input id="em-target"></div>
      <div><label class="field">鏂囨妯℃澘(姣忚涓€鏉?{nick} {kw} {濂絴涓嶉敊|璧瀩)</label><textarea id="em-templates" rows="4"></textarea></div>
      <label class="mut" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="em-use-ai" style="width:auto"> 鐢ㄥぇ妯″瀷鐢熸垚鏂囨(澶辫触鍥為€€妯℃澘)</label>
      <label class="mut" style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="em-review" style="width:auto"> 鑽夌瀹℃牳(鍙敓鎴愪笉鑷姩鍙?</label>
      <div class="row" id="em-filter-wrap"><input id="em-reply-filter" placeholder="浠呭洖澶嶅惈姝ゅ叧閿瘝鐨勮瘎璁?><input id="em-skip" placeholder="璺宠繃鍚繖浜涜瘝(閫楀彿鍒嗛殧)"></div>
      <div class="row" style="flex-wrap:wrap;gap:10px">
        <label class="mut" style="display:flex;align-items:center;gap:6px">姣忔棩涓婇檺 <input type="number" id="em-cap" min="0" style="width:70px"></label>
        <label class="mut" style="display:flex;align-items:center;gap:6px">鏈€灏忛棿闅旂 <input type="number" id="em-gap" min="1" style="width:82px"></label>
        <label class="mut" style="display:flex;align-items:center;gap:6px">姣忚疆鏈€澶?<input type="number" id="em-max" min="1" style="width:70px"></label>
        <select id="em-interval"><option value="900">姣?15 鍒嗛挓</option><option value="1800">姣?30 鍒嗛挓</option><option value="3600">姣忓皬鏃?/option></select>
      </div>`;
    // 鍥炲～鍊?    $("em-name").value = r.name || "";
    $("em-mode").value = r.mode; emOnMode();
    $("em-kind").value = r.target_kind; emOnKind();
    if ($("em-acc").querySelector(`option[value="${r.account_id}"]`)) $("em-acc").value = String(r.account_id);
    $("em-target").value = r.mode === "auto_comment"
      ? (r.target_kind === "keyword" ? r.keyword : r.sec_uid)
      : (r.target_kind === "work" ? r.aweme_id : "");
    $("em-templates").value = (r.templates || []).join("\n");
    $("em-use-ai").checked = !!r.use_ai;
    $("em-review").checked = !!r.require_review;
    $("em-reply-filter").value = r.reply_filter || "";
    $("em-skip").value = r.skip_keywords || "";
    $("em-cap").value = r.daily_cap; $("em-gap").value = r.min_gap_seconds;
    $("em-max").value = r.max_per_run;
    if ([...$("em-interval").options].some(o => o.value === String(r.interval_seconds))) $("em-interval").value = String(r.interval_seconds);
    _uiOpen("缂栬緫瑙勫垯 #" + id, "鏀逛簡銆岀洰鏍?鍏抽敭璇嶃€嶄細閲嶆柊瑙ｆ瀽;璐﹀彿闇€涓庤鍒欏钩鍙颁竴鑷?, { okText: "淇濆瓨淇敼" });
    ["em-mode", "em-kind", "em-acc", "em-interval"].forEach(idd => { const el = $(idd); if (el) enhanceSelect(el); });
  }).then(async val => {
    if (!val) return;   // 鍙栨秷
    if (!val.templates.length) { toast("璇疯嚦灏戝啓涓€鏉℃枃妗堟ā鏉?, "err"); return; }
    try {
      await api("/api/comment-rules/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(val) });
      toast("瑙勫垯宸叉洿鏂?鉁?, "ok"); refreshCommentRules();
    } catch (e) { toast("鏇存柊澶辫触:" + e.message, "err"); }
  });
}
async function refreshCommentRules() {
  if (!$("ac-rule-table")) return;
  const rows = await api("/api/comment-rules?platform=" + PLATFORM);
  if ($("tb-ac")) $("tb-ac").textContent = rows.length;
  AC_RULES = rows;
  $("ac-rule-table").innerHTML = rows.map(r => {
    const tgt = r.mode === "auto_comment"
      ? (r.target_kind === "keyword" ? "#" + esc(r.keyword) : esc((r.sec_uid || "").slice(0, 14)))
      : (r.target_kind === "work" ? esc(r.aweme_id) : "鑷繁杩戞湡浣滃搧");
    const acc = (ACCOUNTS.find(a => a.id === r.account_id) || {}).nickname || ("#" + r.account_id);
    const tags = [r.use_ai ? "AI鏂囨" : "", r.require_review ? "鑽夌瀹℃牳" : ""].filter(Boolean)
      .map(x => `<span class="pill downloading" style="margin-left:4px;font-size:10px">${x}</span>`).join("");
    return `<tr>
      <td>${esc(r.name)}${tags}</td>
      <td>${AC_MODE_T[r.mode] || r.mode}</td>
      <td class="wrap" style="max-width:160px">${AC_KIND_T[r.target_kind] || r.target_kind}<br><span class="mut">${tgt}</span></td>
      <td>${esc(acc)}</td>
      <td class="mut num">${r.daily_cap}/鏃?路 ${Math.round(r.interval_seconds / 60)}鍒?/td>
      <td class="mut num">${r.last_run_at ? new Date(r.last_run_at + "Z").toLocaleString() : "鈥?}${r.last_error ? ` <span class="warn-ic" title="${esc(r.last_error)}">${ic("i-info")}</span>` : ""}</td>
      <td><span class="pill ${r.enabled ? "done" : "invalid"}">${r.enabled ? "杩愯涓? : "宸插仠鐢?}</span></td>
      <td class="acttd">
        <button class="ghost sm" onclick="toggleRule(${r.id}, ${r.enabled ? "false" : "true"})">${r.enabled ? "鍋滅敤" : "鍚敤"}</button>
        <button class="ghost sm" onclick="editRule(${r.id})">缂栬緫</button>
        <button class="ghost sm" onclick="runRule(${r.id})">璇曡窇</button>
        <button class="ghost sm" onclick="delRule(${r.id})">鍒犻櫎</button>
      </td></tr>`;
  }).join("") || empty(8, "鏆傛棤璇勮瑙勫垯", "i-msg", "鍦ㄤ笂鏂瑰垱寤轰竴鏉¤嚜鍔ㄥ洖澶嶆垨鑷姩璇勮瑙勫垯");
}
async function toggleRule(id, en) {
  try { await api("/api/comment-rules/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: en }) }); toast(en ? "宸插惎鐢? : "宸插仠鐢?, "ok"); refreshCommentRules(); }
  catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); }
}
async function runRule(id) {
  const btn = evtBtn();
  toast("璇曡窇涓€︽鍦ㄦ姄鍙栫洰鏍囪瘎璁?鍙兘瑕佸崄鍑犵", "info", 8000);
  await withBusy(btn, "璇曡窇涓?, async () => {
    try {
      const r = await api("/api/comment-rules/" + id + "/run-now", { method: "POST" });
      if (!r.ok) toast("鏈敓鎴?" + (r.error || ""), "err", 7000);
      else if (r.created > 0) toast(`鐢熸垚 ${r.created} 鏉?{r.review ? "鑽夌(寰呬汉宸ラ€氳繃)" : "浠诲姟"}(鍙戠幇 ${r.candidates} 涓洰鏍?`, "ok", 6000);
      else toast(`鍙戠幇 ${r.candidates} 涓洰鏍?鐢熸垚 0 鏉 + (r.note ? `:${r.note}` : "(鍙兘閮藉凡鐢熸垚杩?"), "info", 9000);
    } catch (e) { toast("璇曡窇澶辫触:" + e.message, "err"); }
  });
  refreshCommentRules(); refreshCommentTasks();
}
async function delRule(id) {
  if (!await uiConfirm({ title: "鍒犻櫎瑙勫垯", message: "鍒犻櫎璇ヨ鍒欏強鍏舵湭鍙戦€佷换鍔?", okText: "鍒犻櫎", danger: true })) return;
  try { await api("/api/comment-rules/" + id, { method: "DELETE" }); toast("宸插垹闄?, "ok"); refreshCommentRules(); refreshCommentTasks(); }
  catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); }
}
async function refreshCommentTasks() {
  if (!$("ac-task-table")) return;
  const st = $("ac-task-filter") ? $("ac-task-filter").value : "";
  const rows = await api("/api/comment-tasks?platform=" + PLATFORM + (st ? "&status=" + st : ""));
  AC_TASKS = rows;
  const drafts = rows.filter(t => t.status === "draft");
  if ($("ac-draft-bar")) {
    $("ac-draft-bar").style.display = drafts.length ? "flex" : "none";
    if (drafts.length) $("ac-draft-count").textContent = `鏈?${drafts.length} 鏉¤崏绋垮緟瀹℃牳鈥斺€旈€愭潯銆岄€氳繃/缂栬緫銆?鎴栦竴閿叏閮ㄩ€氳繃鍚庣敱寮曟搸鎸夎妭娴佸彂鍑篳;
  }
  $("ac-task-table").innerHTML = rows.map(t => {
    const isDraft = t.status === "draft", canSend = t.status === "pending" || t.status === "failed";
    return `<tr>
    <td class="wrap" style="max-width:240px">${esc(t.content)}</td>
    <td class="mut">${esc((t.aweme_id || "").slice(0, 16))}</td>
    <td>${t.target_comment_id ? "鍥炲 " + esc(t.target_nick || "") : "椤跺眰璇勮"}</td>
    <td class="mut num">${t.scheduled_at ? new Date(t.scheduled_at + "Z").toLocaleString() : "灏藉揩"}</td>
    <td class="mut">${t.method === "browser" ? "娴忚鍣? : t.method === "api" ? "API" : "鈥?}</td>
    <td><span class="pill ${AC_TASK_PILL[t.status] || "pending"}">${AC_TASK_ST[t.status] || t.status}</span>${t.error ? ` <span class="warn-ic" title="${esc(t.error)}">${ic("i-info")}</span>` : ""}</td>
    <td class="acttd">
      ${isDraft ? `<button class="sm" onclick="approveTask(${t.id})">閫氳繃</button>` : ""}
      ${(isDraft || canSend) ? `<button class="ghost sm" onclick="editTaskContent(${t.id})">缂栬緫</button>` : ""}
      ${canSend ? `<button class="ghost sm" onclick="runTask(${t.id})">绔嬪嵆鍙?/button>` : ""}
      ${(isDraft || canSend) ? `<button class="ghost sm" onclick="cancelTask(${t.id})">${isDraft ? "寮冪敤" : "鍙栨秷"}</button>` : ""}
      <button class="ghost sm" onclick="delTask(${t.id})">鍒犻櫎</button>
    </td></tr>`;
  }).join("") || empty(7, "鏆傛棤璇勮浠诲姟", "i-msg", "鍚敤瑙勫垯鎴栫偣銆岃瘯璺戙€嶅悗,杩欓噷浼氬嚭鐜板緟鍙戣瘎璁?);
}
async function approveTask(id) {
  try { await api("/api/comment-tasks/" + id + "/approve", { method: "POST" }); toast("宸查€氳繃,杞叆寰呭彂闃熷垪", "ok"); refreshCommentTasks(); }
  catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); }
}
async function approveAllDrafts() {
  const ids = AC_TASKS.filter(t => t.status === "draft").map(t => t.id);
  if (!ids.length) return;
  if (!await uiConfirm({ title: "鍏ㄩ儴閫氳繃鑽夌", message: `閫氳繃 ${ids.length} 鏉¤崏绋?閫氳繃鍚庡紩鎿庢寜鑺傛祦(姣忚处鍙锋瘡鏃ヤ笂闄?鏈€灏忛棿闅?闄嗙画鍙戝嚭銆俙, okText: "鍏ㄩ儴閫氳繃" })) return;
  try { const r = await api("/api/comment-tasks/batch-approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }); toast(`宸查€氳繃 ${r.approved} 鏉, "ok"); refreshCommentTasks(); }
  catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); }
}
async function editTaskContent(id) {
  const t = AC_TASKS.find(x => x.id === id); if (!t) return;
  const v = await uiPrompt({ title: "缂栬緫璇勮鏂囨", hint: "鍙戝嚭鍓嶅彲寰皟杩欐潯璇勮鐨勫唴瀹?, value: t.content || "", multiline: true, rows: 3 });
  if (v === null) return;
  const content = v.trim();
  if (!content) { toast("鏂囨涓嶈兘涓虹┖", "err"); return; }
  try { await api("/api/comment-tasks/" + id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) }); toast("鏂囨宸叉洿鏂?, "ok"); refreshCommentTasks(); }
  catch (e) { toast("鏇存柊澶辫触:" + e.message, "err"); }
}
async function runTask(id) {
  const btn = evtBtn();
  toast("鍙戦€佷腑鈥︽鍦ㄥ紑娴忚鍣ㄥ彂璇勮(鏈夊ご绐楀彛浼氬脊鍑?", "info", 8000);
  await withBusy(btn, "鍙戦€佷腑", async () => {
    try { const r = await api("/api/comment-tasks/" + id + "/run-now", { method: "POST" }); toast(r.ok ? "宸插彂閫?鉁? : "鏈垚鍔?" + (r.error || ""), r.ok ? "ok" : "err", 7000); }
    catch (e) { toast("鍙戦€佸け璐?" + e.message, "err"); }
  });
  refreshCommentTasks();
}
async function cancelTask(id) {
  try { await api("/api/comment-tasks/" + id + "/cancel", { method: "POST" }); toast("宸插彇娑?, "ok"); refreshCommentTasks(); }
  catch (e) { toast("鎿嶄綔澶辫触:" + e.message, "err"); }
}
async function delTask(id) {
  try { await api("/api/comment-tasks/" + id, { method: "DELETE" }); toast("宸插垹闄?, "ok"); refreshCommentTasks(); }
  catch (e) { toast("鍒犻櫎澶辫触:" + e.message, "err"); }
}

function esc(s) { return (s || "").toString().replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

function loop() {
  if (INFLIGHT > 0) return;   // 鏈夋參鎿嶄綔杩涜涓?鍒噸娓叉煋(淇濅綇鎸夐挳鍔犺浇鎬?
  refreshMonitors(); refreshContents(); refreshWatches(); refreshComments(); refreshOverviewChart(); refreshCommentRules(); refreshCommentTasks(); if (pfHasPublish(PLATFORM)) refreshPublish();
}

// initial skeletons while data loads
$("mon-table").innerHTML = skeleton(7);
$("content-table").innerHTML = skeleton(8);
$("watch-table").innerHTML = skeleton(8);
$("comment-table").innerHTML = skeleton(6);

// restore last-selected section (default: 鎬昏);鏃х増鍥涗釜鐙珛椤靛凡骞跺叆銆岃处鍙风鐞嗐€?const VALID_TABS = ["overview", "accounts", "monitors", "comments", "hub", "publish", "autocomment", "notifications", "settings"];
const LEGACY_HUB_TABS = ["myworks", "following", "fans", "dm"];
switchTab((() => {
  try {
    const t = localStorage.getItem("dym-tab");
    if (LEGACY_HUB_TABS.includes(t)) { HUB_TAB = t; return "hub"; }
    return VALID_TABS.includes(t) ? t : "overview";
  } catch (e) { return "overview"; }
})());
switchHubTab(HUB_TAB);   // 鎭㈠涓婃鍋滅暀鐨勫瓙鏍囩(鎴戠殑浣滃搧/鍏虫敞/绮変笣/绉佷俊)

// restore last-selected platform (default: 鎶栭煶)
PLATFORM = (() => { try { const p = localStorage.getItem("dym-pf"); return (p === "xhs" || p === "douyin" || p === "kuaishou") ? p : "douyin"; } catch (e) { return "douyin"; } })();
applyPlatformUI();

onTypeChange(); bindPubFilePicker(); onPubType(); populateWatchAccount(); onAcMode(); loadSettings(); refreshAccounts(); refreshProxies(); refreshChannels(); loop();
enhanceAllSelects();   // 鎶婃墍鏈夊師鐢?<select> 鍗囩骇涓虹編鍖栦笅鎷?enhanceAllDateTime();  // 鎶?datetime-local 鍗囩骇涓鸿嚜瀹氫箟鏃ユ湡閫夋嫨鍣?setInterval(loop, 8000);

