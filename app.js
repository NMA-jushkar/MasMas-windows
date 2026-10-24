(function(){
  "use strict";
  var PLATFORM = "windows"; // "android" | "ios"
  var APP_VERSION = "1.0.1";
  var IS_IOS = PLATFORM === "ios";
  var IS_WIN = PLATFORM === "windows";
  var DEV = IS_WIN ? "کامپیوتر" : "گوشی";
  var PLATFORM_NAME = IS_IOS ? "iOS" : IS_WIN ? "ویندوز" : "اندروید";
  var root = document.getElementById("app");
  if (window.top !== window.self) { root.textContent = "این برنامه را مستقیم باز کن، نه داخل صفحه‌ی دیگر."; return; }
  var toastEl = document.getElementById("toast");
  var toastText = document.getElementById("toastText");
  var toastUndo = document.getElementById("toastUndo");

  /* ---------- digits ---------- */
  var FA_D = "۰۱۲۳۴۵۶۷۸۹";
  function toFa(s){ return String(s).replace(/[0-9]/g, function(d){ return FA_D.charAt(+d); }); }
  function fa(n){ return toFa(n); }
  function signed(n){ return n > 0 ? "+" + fa(n) : n < 0 ? "−" + fa(-n) : fa(0); }
  function pad(n){ return n < 10 ? "0" + n : "" + n; }

  /* ---------- Jalali calendar (jalaali-js algorithm; no dependency on the phone's calendar data) ---------- */
  function div(a, b){ return ~~(a / b); }
  function mod(a, b){ return a - ~~(a / b) * b; }
  var BREAKS = [-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
  function jalCal(jy){
    var gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump = 0, leap, leapG, march, n, i;
    for (i = 1; i < BREAKS.length; i++) { jm = BREAKS[i]; jump = jm - jp; if (jy < jm) break; leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4); jp = jm; }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return {leap:leap, gy:gy, march:march};
  }
  function g2d(gy, gm, gd){
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  }
  function d2g(jdn){
    var j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    var i = div(mod(j, 1461), 4) * 5 + 308;
    var gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1, gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return {gy:gy, gm:gm, gd:gd};
  }
  function j2d(jy, jm, jd){ var r = jalCal(jy); return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1; }
  function d2j(jdn){
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy), k = jdn - g2d(gy, 3, r.march), jm, jd;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return {jy:jy, jm:jm, jd:jd}; }
      k -= 186;
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return {jy:jy, jm:jm, jd:jd};
  }

  /* ---------- dates (Iran: fixed UTC+03:30, no daylight saving since 1402) ---------- */
  var TEH = 3.5 * 3600e3;
  function isoOf(d){ return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  // A shift runs past midnight (ends 00:30), so anything before 05:00 Tehran time belongs to the previous day.
  function shiftKey(ms){ return isoOf(new Date(ms + TEH - 5 * 3600e3)); }
  function calKey(ms){ return isoOf(new Date(ms + TEH)); }
  function hhmm(ms){ var d = new Date(ms + TEH); return toFa(pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes())); }
  function addDays(k, n){ var d = new Date(k + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return isoOf(d); }
  var JC = {};
  function jal(k){
    var c = JC[k]; if (c) return c;
    var g = k.split("-"), gy = +g[0], gm = +g[1], gd = +g[2];
    var j = d2j(g2d(gy, gm, gd));
    c = {y:j.jy, m:j.jm, d:j.jd, wd:new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay()};
    JC[k] = c; return c;
  }
  function keyOfJdn(n){ var g = d2g(n); return g.gy + "-" + pad(g.gm) + "-" + pad(g.gd); }
  var MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  var WEEKDAYS = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه","شنبه"]; // by getUTCDay()
  var WD1 = ["ی","د","س","چ","پ","ج","ش"];
  function dayLabel(k){ var j = jal(k); return WEEKDAYS[j.wd] + " " + fa(j.d) + " " + MONTHS[j.m - 1]; }
  function fullDate(k){ return dayLabel(k) + " " + fa(jal(k).y); }
  function monthLabel(k){ var j = jal(k); return MONTHS[j.m - 1] + " " + fa(j.y); }
  function monthId(k){ var j = jal(k); return j.y + "-" + pad(j.m); }
  function jKey(k){ var j = jal(k); return j.y + "-" + pad(j.m) + "-" + pad(j.d); }
  function monthDays(k){
    var j = jal(k), a = j2d(j.y, j.m, 1), b = j.m === 12 ? j2d(j.y + 1, 1, 1) : j2d(j.y, j.m + 1, 1), out = [];
    for (var n = a; n < b; n++) out.push(keyOfJdn(n));
    return out;
  }
  function weekStart(k){ return addDays(k, -((jal(k).wd + 1) % 7)); } // Iranian week starts on Saturday
  function rangeLabel(a, b){
    var x = jal(a), y = jal(b);
    if (x.m === y.m && x.y === y.y) return fa(x.d) + " تا " + fa(y.d) + " " + MONTHS[y.m - 1] + " " + fa(y.y);
    if (x.y === y.y) return fa(x.d) + " " + MONTHS[x.m - 1] + " تا " + fa(y.d) + " " + MONTHS[y.m - 1] + " " + fa(y.y);
    return fa(x.d) + " " + MONTHS[x.m - 1] + " " + fa(x.y) + " تا " + fa(y.d) + " " + MONTHS[y.m - 1] + " " + fa(y.y);
  }
  function daysAgo(ms){ return Math.floor((Date.now() - ms) / 864e5); }

  /* ---------- tiny PDF writer: one full-page JPEG per A4 page ---------- */
  function makePdf(pages){
    var enc = new TextEncoder(), chunks = [], offs = [], pos = 0;
    function push(x){ var b = typeof x === "string" ? enc.encode(x) : x; chunks.push(b); pos += b.length; }
    function obj(num, body){ offs[num] = pos; push(num + " 0 obj\n"); body(); push("\nendobj\n"); }
    push(new Uint8Array([0x25,0x50,0x44,0x46,0x2D,0x31,0x2E,0x34,0x0A,0x25,0xE2,0xE3,0xCF,0xD3,0x0A]));
    var n = pages.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + 3 * i) + " 0 R");
    obj(1, function(){ push("<< /Type /Catalog /Pages 2 0 R >>"); });
    obj(2, function(){ push("<< /Type /Pages /Kids [" + kids.join(" ") + "] /Count " + n + " >>"); });
    pages.forEach(function(p, i){
      var W = p.land ? "841.89" : "595.28", H = p.land ? "595.28" : "841.89";
      var pn = 3 + 3 * i, cn = pn + 1, im = pn + 2;
      obj(pn, function(){ push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] /Resources << /XObject << /Im" + i + " " + im + " 0 R >> >> /Contents " + cn + " 0 R >>"); });
      var cs = "q " + W + " 0 0 " + H + " 0 0 cm /Im" + i + " Do Q";
      obj(cn, function(){ push("<< /Length " + cs.length + " >>\nstream\n"); push(cs); push("\nendstream"); });
      obj(im, function(){ push("<< /Type /XObject /Subtype /Image /Width " + p.w + " /Height " + p.h + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + p.u8.length + " >>\nstream\n"); push(p.u8); push("\nendstream"); });
    });
    var size = 3 + 3 * n, xref = pos, x = "xref\n0 " + size + "\n0000000000 65535 f \n";
    for (var k = 1; k < size; k++) x += ("000000000" + offs[k]).slice(-10) + " 00000 n \n";
    push(x);
    push("trailer\n<< /Size " + size + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");
    return chunks;
  }

  var ATT = [["p","حاضر"],["l","تأخیر"],["a","غایب"]];
  var ATT_NAME = {p:"حاضر", l:"تأخیر", a:"غایب"};
  var ICON_TRASH = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  var ICON_DOWN = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
  var ICON_SHARE = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
  var chevR = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var chevL = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }

  /* ---------- local storage (this phone only) ---------- */
  var LS_KEY = "masmas-hozoor-v1";
  /* Everything read from storage or a backup file is untrusted: ids end up in HTML attributes, so only safe shapes pass. */
  var ID_RE = /^[A-Za-z0-9_-]{1,40}$/, DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
  function okId(k){ return typeof k === "string" && ID_RE.test(k) && k !== "__proto__" && k !== "constructor" && k !== "prototype"; }
  function str(v, max){ return typeof v === "string" ? v.slice(0, max) : ""; }
  function num(v){ return typeof v === "number" && isFinite(v) ? v : 0; }
  function isObj(v){ return !!v && typeof v === "object" && !Array.isArray(v); }
  function cleanStaff(list){
    var out = [], seen = {};
    (Array.isArray(list) ? list : []).slice(0, 500).forEach(function(s){
      if (!isObj(s) || !okId(s.id) || seen["$" + s.id]) return;
      var name = str(s.name, 40).trim(); if (!name) return;
      seen["$" + s.id] = 1; out.push({id:s.id, name:name, active:s.active !== false});
    });
    return out;
  }
  function cleanDay(k, d){
    var out = {date:k, att:{}, note:{}, marks:{}};
    if (!isObj(d)) return out;
    if (isObj(d.att)) Object.keys(d.att).forEach(function(sid){ var v = d.att[sid]; if (okId(sid) && (v === "p" || v === "l" || v === "a")) out.att[sid] = v; });
    if (isObj(d.note)) Object.keys(d.note).forEach(function(sid){ var v = str(d.note[sid], 200); if (okId(sid) && v) out.note[sid] = v; });
    if (isObj(d.marks)) Object.keys(d.marks).forEach(function(sid){
      var src = d.marks[sid]; if (!okId(sid) || !isObj(src)) return;
      var o = {}, n = 0;
      Object.keys(src).forEach(function(mid){
        var m = src[mid];
        if (n >= 500 || !okId(mid) || !isObj(m) || (m.v !== 1 && m.v !== -1)) return;
        o[mid] = {v:m.v, t:num(m.t), r:str(m.r, 200)}; n++;
      });
      if (n) out.marks[sid] = o;
    });
    return out;
  }
  function validDay(k){ return typeof k === "string" && DAY_RE.test(k) && addDays(k, 0) === k; }
  function cleanDays(days){
    var out = {}, n = 0;
    if (isObj(days)) Object.keys(days).forEach(function(k){ if (n < 5000 && validDay(k)) { out[k] = cleanDay(k, days[k]); n++; } });
    return out;
  }
  function cleanMeta(m){
    m = isObj(m) ? m : {};
    var out = {};
    if (num(m.lastBackup)) out.lastBackup = num(m.lastBackup);
    if (num(m.created)) out.created = num(m.created);
    if (m.hideInstall === true) out.hideInstall = true;
    return out;
  }
  var S = {
    staff: [], days: {}, meta: {},
    sel: shiftKey(Date.now()),
    tab: "day", open: null, exType: "d",
    confirmDel: null, focusAfter: null,
    storageOk: true, persisted: null, corrupt: false, followToday: true,
    importDraft: null, installEvt: null
  };
  function loadData(){
    var raw;
    try { raw = localStorage.getItem(LS_KEY); } catch (e) { S.storageOk = false; return null; }
    if (!raw) return null;
    try { var d = JSON.parse(raw); if (isObj(d)) return d; } catch (e) {}
    // Unreadable data is set aside, never overwritten
    try { localStorage.setItem(LS_KEY + "-unreadable-" + Date.now(), raw); } catch (e) {}
    S.corrupt = true;
    return null;
  }
  function saveData(){
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({app:"masmas-hozoor", v:1, staff:S.staff, days:S.days, meta:S.meta}));
      S.storageOk = true;
      return true;
    } catch (e) {
      S.storageOk = false;
      toast("ذخیره نشد: حافظه‌ی مرورگر پر یا غیرفعال است. فوراً پشتیبان بگیر.");
      return false;
    }
  }
  function applyData(d){
    S.staff = cleanStaff(d.staff);
    S.days = cleanDays(d.days);
    S.meta = cleanMeta(d.meta);
  }
  function patchObj(obj, patch){ // null deletes a key; nested objects merge
    var out = Object.assign({}, obj);
    Object.keys(patch).forEach(function(k){
      var v = patch[k];
      if (v === null) delete out[k];
      else if (typeof v === "object" && !Array.isArray(v)) out[k] = patchObj(out[k] && typeof out[k] === "object" ? out[k] : {}, v);
      else out[k] = v;
    });
    return out;
  }
  function writeDay(key, patch){
    S.days[key] = patchObj(S.days[key] || {date:key}, patch);
    saveData(); render();
    askPersist();
  }
  function writeStaff(list){ S.staff = list; saveData(); render(); }
  function staffById(id){ for (var i = 0; i < S.staff.length; i++) if (S.staff[i] && S.staff[i].id === id) return S.staff[i]; return null; }
  function markPatch(sid, mid, val){ var p = {marks:{}}; p.marks[sid] = {}; p.marks[sid][mid] = val; return p; }
  var persistAsked = false;
  function askPersist(){
    if (persistAsked || !navigator.storage || !navigator.storage.persist) return;
    persistAsked = true;
    navigator.storage.persist().then(function(ok){ S.persisted = !!ok; }, function(){});
  }

  function activeStaff(){ return S.staff.filter(function(s){ return s && s.active !== false; }); }
  function marksOf(day, sid){
    var src = (day && day.marks && day.marks[sid]) || {};
    return Object.keys(src).map(function(id){ var m = src[id]; return m && typeof m.v === "number" ? {id:id, v:m.v, t:m.t || 0, r:m.r || ""} : null; })
      .filter(Boolean).sort(function(a, b){ return a.t - b.t; });
  }
  function personDay(k, sid){
    var d = S.days[k] || {};
    var st = (d.att || {})[sid] || null;
    var why = (d.note || {})[sid] || "";
    var marks = marksOf(d, sid);
    var plus = 0, minus = 0;
    marks.forEach(function(m){ if (m.v > 0) plus += m.v; else minus -= m.v; });
    return {st:st, why:(st === "a" || st === "l") ? why : "", marks:marks, plus:plus, minus:minus, net:plus - minus};
  }
  function monthTotals(mid){
    var out = {};
    Object.keys(S.days).forEach(function(k){
      if (monthId(k) !== mid) return;
      var d = S.days[k] || {};
      var att = d.att || {};
      Object.keys(att).forEach(function(sid){
        var o = out[sid] || (out[sid] = {p:0,l:0,a:0,plus:0,minus:0});
        if (att[sid] === "p") o.p++; else if (att[sid] === "l") o.l++; else if (att[sid] === "a") o.a++;
      });
      Object.keys(d.marks || {}).forEach(function(sid){
        var o = out[sid] || (out[sid] = {p:0,l:0,a:0,plus:0,minus:0});
        marksOf(d, sid).forEach(function(m){ if (m.v > 0) o.plus += m.v; else o.minus -= m.v; });
      });
    });
    return out;
  }

  /* ---------- files: save / share / open (platform specific) ---------- */
  function fileOf(blob, name){ try { return new File([blob], name, {type:blob.type}); } catch (e) { return null; } }
  function canShareType(type, ext){
    if (!navigator.share || !navigator.canShare) return false;
    var f = fileOf(new Blob(["x"], {type:type}), "test." + ext);
    try { return !!(f && navigator.canShare({files:[f]})); } catch (e) { return false; }
  }
  var SHARE_PDF = canShareType("application/pdf", "pdf");
  var SHARE_JPG = canShareType("image/jpeg", "jpg");
  var SHARE_JSON = canShareType("application/json", "json");
  function shareFile(blob, name){
    var f = fileOf(blob, name);
    if (!f) return Promise.reject({name:"NoFile"});
    return navigator.share({files:[f], title:name});
  }
  function downloadFile(blob, name){
    var u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.download = name; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function(){ a.remove(); URL.revokeObjectURL(u); }, 60000);
  }
  function openFile(blob){
    var u = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = u; a.target = "_blank"; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function(){ a.remove(); URL.revokeObjectURL(u); }, 120000);
  }
  // Give the file to the user the way this phone handles best. Must run inside the tap.
  function deliver(blob, name, kind, done){
    var canShare = kind === "pdf" ? SHARE_PDF : kind === "jpg" ? SHARE_JPG : SHARE_JSON;
    if (IS_IOS && canShare) {
      shareFile(blob, name).then(function(){ if (done) done(); }, function(e){
        if (e && e.name === "AbortError") return; // the user closed the share sheet
        openFile(blob); if (done) done();
      });
      return;
    }
    if (IS_IOS) { openFile(blob); if (done) done(); return; }
    downloadFile(blob, name);
    toast(IS_WIN ? "دانلود شد؛ در پوشه‌ی Downloads پیدایش می‌کنی" : "دانلود شد؛ در پوشه‌ی Download گوشی پیدایش می‌کنی");
    if (done) done();
  }
  function shareOnly(blob, name){
    shareFile(blob, name).then(null, function(e){ if (!e || e.name !== "AbortError") toast("اشتراک‌گذاری ممکن نشد؛ از دکمه‌ی ذخیره استفاده کن."); });
  }

  /* ---------- backup / restore ---------- */
  function backupBlob(){
    var data = {app:"masmas-hozoor", v:1, exportedAt:Date.now(), staff:S.staff, days:S.days};
    return new Blob([JSON.stringify(data)], {type:"application/json"});
  }
  function doBackup(){
    var name = "پشتیبان-حضور-" + jKey(calKey(Date.now())) + ".json";
    deliver(backupBlob(), name, "json", function(){ S.meta.lastBackup = Date.now(); saveData(); render(); });
  }
  function readImport(file){
    if (file.size > 5 * 1024 * 1024) { toast("این فایل بزرگ‌تر از یک پشتیبان معمولی است."); return; }
    var fr = new FileReader();
    fr.onload = function(){
      var d;
      try { d = JSON.parse(String(fr.result)); } catch (e) { d = null; }
      if (!isObj(d) || d.app !== "masmas-hozoor" || !Array.isArray(d.staff) || !isObj(d.days)) { toast("این فایل، پشتیبان حضور و غیاب نیست."); return; }
      S.importDraft = {staff:cleanStaff(d.staff), days:cleanDays(d.days), exportedAt:num(d.exportedAt)};
      S.tab = "settings"; render();
    };
    fr.onerror = function(){ toast("فایل خوانده نشد."); };
    fr.readAsText(file);
  }
  function applyImport(mode){
    var d = S.importDraft; if (!d) return;
    if (mode === "replace") { applyData({staff:d.staff, days:d.days, meta:S.meta}); }
    else {
      var pos = {}, list = S.staff.slice();
      list.forEach(function(s, i){ pos["$" + s.id] = i; });
      d.staff.forEach(function(s){ if (pos["$" + s.id] != null) list[pos["$" + s.id]] = s; else list.push(s); });
      S.staff = list;
      Object.keys(d.days).forEach(function(k){ S.days[k] = patchObj(S.days[k] || {date:k}, d.days[k]); });
    }
    S.importDraft = null; saveData(); render();
    toast(mode === "replace" ? "داده‌ها از پشتیبان جایگزین شد" : "پشتیبان با داده‌های فعلی ادغام شد");
  }

  /* ---------- views ---------- */
  function header(){
    var tabs = [["day","روز"],["month","جمع ماه"],["export","خروجی A4"],["settings","تنظیمات"]];
    return '<header class="top" data-k="hdr"><div class="brand"><h1>حضور و غیاب</h1><p>کافه‌رستوران مس‌مس · شیفت عصر ۱۸:۰۰ تا ۰۰:۳۰</p></div>' +
      '<nav class="tabs" role="tablist" aria-label="بخش‌ها">' + tabs.map(function(t){
        return '<button type="button" role="tab" data-act="tab" data-tab="' + t[0] + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + '</button>';
      }).join("") + '</nav></header>';
  }
  function isStandalone(){
    try { return (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true; } catch (e) { return false; }
  }
  function notices(){
    var h = "";
    if (S.corrupt) h += '<div class="note warn" data-k="n-corrupt"><p><strong>داده‌های قبلی خوانده نشد.</strong> یک نسخه از آن‌ها دست‌نخورده کنار گذاشته شد. از «تنظیمات ← بازگردانی از فایل» آخرین پشتیبان را وارد کن.</p></div>';
    if (!S.storageOk) h += '<div class="note warn" data-k="n-storage"><p><strong>ذخیره‌سازی کار نمی‌کند.</strong> اگر در حالت خصوصی (Private) هستی، از آن خارج شو. تا درست نشده، ثبت‌ها با بستن برنامه پاک می‌شوند.</p></div>';
    if (S.tab === "day" && !isStandalone() && !S.meta.hideInstall) {
      h += '<div class="note" data-k="n-install"><p>' + (IS_IOS
        ? '<strong>نصب روی آیفون:</strong> در Safari دکمه‌ی Share را بزن و «Add to Home Screen» را انتخاب کن.'
        : IS_WIN
        ? (S.installEvt ? '<strong>نصب روی کامپیوتر:</strong> با یک دکمه، برنامه در منوی Start و پنجره‌ی جدای خودش نصب می‌شود.' : '<strong>نصب روی کامپیوتر:</strong> در Edge یا Chrome روی آیکون نصب در نوار آدرس بزن، یا از منوی «…» گزینه‌ی «Apps» ← «Install this site as an app» را انتخاب کن.')
        : (S.installEvt ? '<strong>نصب روی گوشی:</strong> با یک دکمه آیکون برنامه روی صفحه‌ی اصلی می‌آید.' : '<strong>نصب روی گوشی:</strong> در Chrome منوی سه‌نقطه را بزن و «Install app» یا «Add to Home screen» را انتخاب کن.')) + '</p>' +
        (!IS_IOS && S.installEvt ? '<button type="button" class="btn primary" data-act="install">نصب برنامه</button>' : '') +
        '<button type="button" class="x" data-act="hideinstall">بستن</button></div>';
    }
    if (S.tab === "day" && Object.keys(S.days).length) {
      var lb = S.meta.lastBackup, age = lb ? daysAgo(lb) : null;
      if (!lb || age >= 7) {
        h += '<div class="note warn" data-k="n-backup"><p>' + (lb ? "آخرین پشتیبان " + fa(age) + " روز پیش گرفته شده." : "هنوز پشتیبان نگرفته‌ای.") + ' داده‌ها فقط روی همین ' + DEV + ' است.</p><button type="button" class="btn" data-act="backup">' + ICON_DOWN + 'پشتیبان بگیر</button></div>';
      }
    }
    return h;
  }

  function dayView(){
    var today = shiftKey(Date.now());
    var isToday = S.sel === today;
    var day = S.days[S.sel] || {};
    var att = day.att || {};
    var notes = day.note || {};
    var staff = activeStaff();
    var c = {p:0,l:0,a:0,n:0};
    staff.forEach(function(s){ var v = att[s.id]; if (v === "p") c.p++; else if (v === "l") c.l++; else if (v === "a") c.a++; else c.n++; });
    var mt = monthTotals(monthId(S.sel));

    var h = '<section class="datebar" data-k="datebar" aria-label="انتخاب روز">' +
      '<button type="button" class="navbtn" data-act="prev">' + chevR + 'روز قبل</button>' +
      '<div class="date"><strong>' + esc(dayLabel(S.sel)) + '</strong>' +
      (isToday ? '<span>شیفت امشب</span>' : '<button type="button" class="today" data-act="today">برو به امشب</button>') + '</div>' +
      '<button type="button" class="navbtn" data-act="next"' + (S.sel >= today ? " disabled" : "") + '>روز بعد' + chevL + '</button></section>';

    h += '<section class="counts" data-k="counts" aria-label="خلاصه‌ی حضور">' +
      '<div class="count p"><b class="num">' + fa(c.p) + '</b><span>حاضر</span></div>' +
      '<div class="count l"><b class="num">' + fa(c.l) + '</b><span>تأخیر</span></div>' +
      '<div class="count a"><b class="num">' + fa(c.a) + '</b><span>غایب</span></div>' +
      '<div class="count n"><b class="num">' + fa(c.n) + '</b><span>ثبت‌نشده</span></div></section>';

    h += '<section class="sheet" data-k="sheet" aria-label="فهرست بچه‌ها">';
    if (!staff.length) { h += '<div class="empty"><strong>هنوز اسمی ثبت نشده</strong>فایل پشتیبان را وارد کن یا اسم‌ها را دستی اضافه کن.<div class="actions"><button type="button" class="btn primary" data-act="tab" data-tab="settings">رفتن به تنظیمات</button></div></div>'; }
    else {
      h += '<div class="head" aria-hidden="true"><span>نام</span><span>امتیاز این شیفت</span><span class="h-att">حضور</span></div>';
      staff.forEach(function(s){
        var st = att[s.id] || null;
        var marks = marksOf(day, s.id);
        var net = marks.reduce(function(a, m){ return a + m.v; }, 0);
        var m = mt[s.id] || {plus:0, minus:0};
        var mnet = m.plus - m.minus;
        var open = S.open === s.id;
        var nm = esc(s.name);
        var hasWhy = st === "a" || st === "l";
        h += '<div class="row' + (open ? " is-open" : "") + (hasWhy ? " has-why" : "") + '" data-k="' + s.id + '">' +
          '<button type="button" class="name" data-act="open" data-sid="' + s.id + '" aria-expanded="' + open + '">' +
            '<span class="nm">' + nm + '</span>' +
            '<span class="sub">ماه: <bdi class="n">' + signed(mnet) + '</bdi> · <u>تاریخچه' + (marks.length ? ' (' + fa(marks.length) + ')' : '') + '</u> <span class="chev">▾</span></span>' +
          '</button>' +
          '<div class="score">' +
            '<button type="button" class="pm plus" data-act="mark" data-v="1" data-sid="' + s.id + '" aria-label="یک مثبت برای ' + nm + '">+</button>' +
            '<output class="val num ' + (net > 0 ? "pos" : net < 0 ? "neg" : "zero") + '"><bdi class="n">' + signed(net) + '</bdi></output>' +
            '<button type="button" class="pm minus" data-act="mark" data-v="-1" data-sid="' + s.id + '" aria-label="یک منفی برای ' + nm + '">−</button>' +
          '</div>' +
          '<div class="att" role="group" aria-label="حضور ' + nm + '">' + ATT.map(function(a){
            return '<button type="button" data-act="att" data-sid="' + s.id + '" data-st="' + a[0] + '" aria-pressed="' + (st === a[0]) + '">' + a[1] + '</button>';
          }).join("") + '</div>' +
          (hasWhy ? '<div class="why ' + st + '" data-k="why"><label for="why-' + s.id + '">دلیل ' + (st === "a" ? "غیبت" : "تأخیر") + ':</label>' +
            '<input type="text" id="why-' + s.id + '" data-act="why" data-day="' + S.sel + '" data-sid="' + s.id + '" value="' + esc(notes[s.id] || "") + '" placeholder="' + (st === "a" ? "مثلاً بیماری، مرخصی، بدون اطلاع" : "مثلاً ۲۰ دقیقه، ترافیک") + '" maxlength="200" enterkeyhint="done" autocomplete="off"></div>' : '') +
          (open ? detailsHtml(s, marks) : "") +
        '</div>';
      });
    }
    return h + '</section>';
  }

  function detailsHtml(s, marks){
    if (!marks.length) return '<div class="details" data-k="details"><p class="none">در این شیفت برای ' + esc(s.name) + ' مثبت یا منفی ثبت نشده.</p></div>';
    return '<div class="details" data-k="details"><h3>تاریخچه‌ی این شیفت · ثبت اشتباه را با «پاک کن» بردار</h3><ul class="marks">' + marks.map(function(m){
      return '<li data-k="' + m.id + '"><span class="mv num ' + (m.v > 0 ? "pos" : "neg") + '"><bdi class="n">' + signed(m.v) + '</bdi></span>' +
        '<time class="num">' + hhmm(m.t) + '</time>' +
        '<input type="text" id="r-' + s.id + '-' + m.id + '" data-act="reason" data-day="' + S.sel + '" data-sid="' + s.id + '" data-mid="' + m.id + '" value="' + esc(m.r) + '" placeholder="دلیل (اختیاری)" aria-label="دلیل" maxlength="200" enterkeyhint="done" autocomplete="off">' +
        '<button type="button" class="delbtn" data-act="delmark" data-sid="' + s.id + '" data-mid="' + m.id + '" aria-label="پاک کردن این ' + (m.v > 0 ? "مثبت" : "منفی") + '">' + ICON_TRASH + 'پاک کن</button></li>';
    }).join("") + '</ul></div>';
  }

  function monthView(){
    var mid = monthId(S.sel);
    var mt = monthTotals(mid);
    var nDays = Object.keys(S.days).filter(function(k){ return monthId(k) === mid; }).length;
    var rows = [];
    S.staff.forEach(function(s, i){
      if (!s) return;
      var t = mt[s.id];
      if (s.active === false && !t) return;
      t = t || {p:0,l:0,a:0,plus:0,minus:0};
      rows.push({id:s.id, name:s.name, gone:s.active === false, i:i, t:t, net:t.plus - t.minus});
    });
    rows.sort(function(a, b){ return b.net - a.net || a.i - b.i; });
    var h = '<section class="monthbar" data-k="monthbar"><h2>' + esc(monthLabel(S.sel)) + '</h2><p>' + fa(nDays) + ' شیفت ثبت‌شده در این ماه · مرتب بر اساس جمع امتیاز</p></section>';
    if (!rows.length) return h + '<section class="sheet"><div class="empty"><strong>فهرست اسامی خالی است</strong>از برگه‌ی «تنظیمات» اضافه کن.</div></section>';
    h += '<div class="tablewrap"><table><thead><tr><th>نام</th><th>حاضر</th><th>تأخیر</th><th>غایب</th><th>مثبت</th><th>منفی</th><th>جمع</th></tr></thead><tbody>';
    rows.forEach(function(r, idx){
      h += '<tr data-k="' + r.id + '"' + (r.gone ? ' class="gone"' : '') + '><td><span class="rank num">' + fa(idx + 1) + '</span>' + esc(r.name) + (r.gone ? ' (حذف‌شده)' : '') + '</td>' +
        '<td class="p num">' + fa(r.t.p) + '</td><td class="l num">' + fa(r.t.l) + '</td><td class="a num">' + fa(r.t.a) + '</td>' +
        '<td class="num">' + fa(r.t.plus) + '</td><td class="num">' + fa(r.t.minus) + '</td>' +
        '<td class="net num ' + (r.net > 0 ? "pos" : r.net < 0 ? "neg" : "") + '"><bdi class="n">' + signed(r.net) + '</bdi></td></tr>';
    });
    return h + '</tbody></table></div>';
  }

  function exportView(){
    var today = shiftKey(Date.now());
    var spec = reportSpec();
    var nextStart = S.exType === "d" ? addDays(S.sel, 1) : S.exType === "w" ? addDays(spec.keys[0], 7) : addDays(spec.keys[spec.keys.length - 1], 1);
    var unit = S.exType === "d" ? "روز" : S.exType === "w" ? "هفته" : "ماه";
    var h = '<div class="exwrap" data-k="export"><div class="seg" role="group" aria-label="نوع گزارش">' +
      [["d","روزانه"],["w","هفتگی"],["m","ماهانه"]].map(function(t){
        return '<button type="button" data-act="extype" data-t="' + t[0] + '" aria-pressed="' + (S.exType === t[0]) + '">' + t[1] + '</button>';
      }).join("") + '</div>' +
      '<section class="datebar" aria-label="انتخاب بازه">' +
        '<button type="button" class="navbtn" data-act="exprev">' + chevR + unit + ' قبل</button>' +
        '<div class="date"><strong>' + esc(spec.label) + '</strong><span>' + (S.exType === "d" ? "برگه‌ی A4 عمودی" : "برگه‌ی A4 افقی") + '</span></div>' +
        '<button type="button" class="navbtn" data-act="exnext"' + (nextStart > today ? " disabled" : "") + '>' + unit + ' بعد' + chevL + '</button>' +
      '</section>';
    var ready = EX.hash === spec.hash && EX.urls && EX.pdf;
    var dis = ready ? "" : " disabled";
    var one = ready && EX.pages.length === 1;
    h += '<div class="actions">';
    if (IS_IOS) {
      h += '<button type="button" class="btn primary" data-act="pdf"' + dis + '>' + ICON_SHARE + (SHARE_PDF ? 'اشتراک‌گذاری یا چاپ PDF' : 'باز کردن PDF') + '</button>' +
        (one ? '<button type="button" class="btn" data-act="img">' + (SHARE_JPG ? 'اشتراک‌گذاری عکس' : 'باز کردن عکس') + '</button>' : '') +
        '<p class="hint">' + (ready ? fa(EX.pages.length) + ' صفحه‌ی A4' + (EX.land ? ' افقی' : ' عمودی') + '. در پنجره‌ی اشتراک‌گذاری، «Print» برای چاپ و «Save to Files» برای ذخیره است.' : 'پیش‌نمایش در حال آماده شدن است.') + '</p>';
    } else {
      h += '<button type="button" class="btn primary" data-act="pdf"' + dis + '>' + ICON_DOWN + 'ذخیره‌ی PDF</button>' +
        (SHARE_PDF ? '<button type="button" class="btn" data-act="sharepdf"' + dis + '>' + ICON_SHARE + 'اشتراک‌گذاری</button>' : '') +
        (one ? '<button type="button" class="btn" data-act="img">ذخیره‌ی عکس</button>' : '') +
        '<p class="hint">' + (ready ? fa(EX.pages.length) + ' صفحه‌ی A4' + (EX.land ? ' افقی' : ' عمودی') + '. ' + (IS_WIN ? 'فایل در پوشه‌ی Downloads ذخیره می‌شود؛ برای چاپ، بازش کن و Ctrl+P را بزن.' : 'فایل در پوشه‌ی Download ذخیره می‌شود؛ برای چاپ، بازش کن و از منو Print را بزن.') : 'پیش‌نمایش در حال آماده شدن است.') + '</p>';
    }
    h += '</div><div class="preview">';
    if (EX.hash === spec.hash && EX.urls) {
      h += EX.urls.map(function(u, i){ return '<img class="paper' + (EX.land ? " land" : "") + '" data-k="pv' + i + '" src="' + u + '" alt="پیش‌نمایش صفحه‌ی ' + fa(i + 1) + '" decoding="async">'; }).join("");
    } else if (EX.failed === spec.hash) {
      h += '<div class="pv-wait">ساختن پیش‌نمایش ممکن نشد.<button type="button" class="btn" data-act="rebuild">دوباره بساز</button></div>';
    } else {
      h += '<div class="pv-wait">در حال ساختن پیش‌نمایش…</div>';
    }
    return h + '</div></div>';
  }

  function settingsView(){
    var staff = activeStaff();
    var h = '';
    if (S.importDraft) {
      var d = S.importDraft;
      var nStaff = d.staff.filter(function(s){ return s && s.active !== false; }).length, nDays = Object.keys(d.days).length;
      h += '<section class="confirmbox" data-k="import"><p><strong>فایل پشتیبان آماده است:</strong> ' + fa(nStaff) + ' نفر و ' + fa(nDays) + ' شیفت' + (d.exportedAt ? '، گرفته‌شده در ' + esc(fullDate(calKey(d.exportedAt))) : '') + '.</p>' +
        '<p class="hint">«ادغام» ثبت‌های این ' + DEV + ' را نگه می‌دارد و ثبت‌های فایل را اضافه می‌کند. «جایگزینی» همه‌ی داده‌های این ' + DEV + ' را با فایل عوض می‌کند.</p>' +
        '<div class="actions"><button type="button" class="btn primary" data-act="importmerge">ادغام</button><button type="button" class="btn danger" data-act="importreplace">جایگزینی کامل</button><button type="button" class="btn" data-act="importcancel">لغو</button></div></section>';
    }
    h += '<section class="panel" data-k="names"><h2>اسامی</h2>' +
      '<form class="addform" id="addForm" autocomplete="off"><input type="text" id="newName" placeholder="اسم نفر جدید" aria-label="اسم نفر جدید" maxlength="40" enterkeyhint="done"><button type="submit">افزودن</button></form>';
    if (staff.length) {
      h += '<ul class="namelist">' + staff.map(function(s){
        var conf = S.confirmDel === s.id;
        return '<li data-k="' + s.id + '"><input type="text" id="nm-' + s.id + '" data-act="rename" data-sid="' + s.id + '" value="' + esc(s.name) + '" aria-label="اسم" maxlength="40" enterkeyhint="done" autocomplete="off">' +
          '<button type="button" class="del' + (conf ? " confirm" : "") + '" data-act="del" data-sid="' + s.id + '">' + (conf ? "مطمئنی؟ حذف" : "حذف") + '</button></li>';
      }).join("") + '</ul>';
    } else h += '<p class="hint">هنوز کسی در فهرست نیست.</p>';
    h += '<p class="hint">برای تغییر اسم، روی آن بزن و ویرایش کن. حذف فقط اسم را از فهرست برمی‌دارد؛ سابقه‌ی شیفت‌های قبل در جمع ماه و خروجی‌ها می‌ماند.</p></section>';

    var lb = S.meta.lastBackup;
    h += '<section class="panel" data-k="backup"><h2>پشتیبان‌گیری</h2>' +
      '<p class="hint">همه‌ی داده‌ها فقط روی همین ' + DEV + ' است. اگر برنامه پاک شود یا ' + DEV + ' عوض شود، فقط با فایل پشتیبان برمی‌گردد. هفته‌ای یک بار پشتیبان بگیر و فایل را جای امنی بفرست.</p>' +
      '<div class="kv"><span>آخرین پشتیبان</span><b>' + (lb ? esc(fullDate(calKey(lb))) + " · " + hhmm(lb) : "هنوز گرفته نشده") + '</b></div>' +
      '<div class="actions"><button type="button" class="btn primary" data-act="backup">' + (IS_IOS ? ICON_SHARE : ICON_DOWN) + (IS_IOS ? 'گرفتن پشتیبان (ذخیره در Files)' : 'گرفتن پشتیبان') + '</button>' +
      '<button type="button" class="btn" data-act="pickrestore">بازگردانی از فایل</button>' +
      '<input type="file" id="restoreFile" hidden></div></section>';

    h += '<section class="panel" data-k="about"><h2>درباره‌ی برنامه</h2>' +
      '<div class="kv"><span>نسخه</span><b class="num">' + esc(APP_VERSION) + ' · ' + PLATFORM_NAME + '</b></div>' +
      '<div class="kv"><span>حالت اجرا</span><b>' + (isStandalone() ? 'نصب‌شده روی ' + DEV : 'داخل مرورگر') + '</b></div>' +
      '<div class="kv"><span>ذخیره‌ی ماندگار</span><b>' + (S.persisted === true ? 'فعال' : S.persisted === false ? 'تأیید نشده؛ پشتیبان را جدی بگیر' : 'نامشخص') + '</b></div>' +
      '<div class="kv"><span>تعداد شیفت‌های ذخیره‌شده</span><b class="num">' + fa(Object.keys(S.days).length) + '</b></div></section>';
    return h;
  }

  /* ---------- DOM patching: keeps buttons and inputs alive between updates, so taps, focus and the keyboard are never lost ---------- */
  var drafts = {};
  function sameNode(a, b){
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
    if (a.nodeType !== 1) return true;
    return (a.id || "") === (b.id || "") && (a.getAttribute("data-k") || "") === (b.getAttribute("data-k") || "") && (a.getAttribute("type") || "") === (b.getAttribute("type") || "");
  }
  function morphNode(a, b){
    if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    var focused = a === document.activeElement, i, at;
    if (!focused) {
      for (i = a.attributes.length - 1; i >= 0; i--) { at = a.attributes[i].name; if (!b.hasAttribute(at)) a.removeAttribute(at); }
      for (i = 0; i < b.attributes.length; i++) { at = b.attributes[i]; if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value); }
    }
    if (a.tagName === "INPUT") {
      if (a.type !== "file" && !focused && !drafts[a.id]) { var v = b.getAttribute("value") || ""; if (a.value !== v) a.value = v; }
      return;
    }
    morphChildren(a, b);
  }
  function keyOf(n){ return n.nodeType === 1 ? (n.getAttribute("data-k") || n.id || "") : ""; }
  function morphChildren(from, to){
    var fc = from.firstChild, tc = to.firstChild;
    while (tc) {
      var next = tc.nextSibling;
      if (!fc) { from.appendChild(tc); tc = next; continue; }
      if (sameNode(fc, tc)) { morphNode(fc, tc); fc = fc.nextSibling; tc = next; continue; }
      var k = keyOf(tc), match = null, s2;
      if (k) for (s2 = fc.nextSibling; s2; s2 = s2.nextSibling) if (keyOf(s2) === k && sameNode(s2, tc)) { match = s2; break; }
      if (match) { from.insertBefore(match, fc); morphNode(match, tc); tc = next; continue; } // an existing block moved up
      var fk = keyOf(fc), later = false;
      if (fk) for (s2 = next; s2; s2 = s2.nextSibling) if (keyOf(s2) === fk) { later = true; break; }
      if (later) { from.insertBefore(tc, fc); tc = next; continue; } // a new block was inserted; keep the existing one
      var nf = fc.nextSibling; from.replaceChild(tc, fc); fc = nf; tc = next;
    }
    while (fc) { var n = fc.nextSibling; from.removeChild(fc); fc = n; }
  }
  var scratch = document.createElement("template"); // inert: nothing in it loads or runs
  function render(){
    var body = S.tab === "month" ? monthView() : S.tab === "settings" ? settingsView() : S.tab === "export" ? exportView() : dayView();
    scratch.innerHTML = header() + notices() + body;
    morphChildren(root, scratch.content);
    if (S.focusAfter) {
      var f = document.getElementById(S.focusAfter);
      S.focusAfter = null;
      if (f && document.activeElement !== f && !f.value) f.focus();
    }
    if (S.tab === "export") ensureBuild();
  }

  /* ---------- A4 report drawing ---------- */
  var SC = 2; // 96 px/in layout × 2 ≈ 192 dpi: sharp on paper, light on phone memory
  var P = {ink:"#1A1E1D", muted:"#5F6A66", faint:"#A3ABA8", line:"#CBD1CE", soft:"#EEF1EF", copper:"#9E4F2A",
           p:"#1F6E5C", pSoft:"#DCEFE8", l:"#8A5700", lSoft:"#F6EBD2", a:"#A3302A", aSoft:"#F7E0DC"};
  var FAM = "Vazirmatn, Tahoma, sans-serif";
  function fnt(w, s){ return w + " " + s + "px " + FAM; }
  var DISPLAY = "400 24px Lalezar, Vazirmatn, Tahoma, sans-serif";

  var fontsP = null;
  function fontsReady(){
    if (fontsP) return fontsP;
    var sample = "حضور و غیاب ۱۲۳ abc";
    var loads = (document.fonts && document.fonts.load) ? ["400 12px Vazirmatn", "500 12px Vazirmatn", "700 12px Vazirmatn", "400 24px Lalezar"].map(function(f){
      return document.fonts.load(f, sample).catch(function(){});
    }) : [];
    fontsP = Promise.race([Promise.all(loads), new Promise(function(r){ setTimeout(r, 3000); })]);
    return fontsP;
  }

  function txt(ctx, s, x, y, o){
    ctx.font = o.font; ctx.fillStyle = o.color || P.ink;
    ctx.direction = o.dir || "rtl"; ctx.textAlign = o.align || "right";
    ctx.fillText(String(s), x, y);
  }
  function wrapLines(ctx, s, maxW, f){
    ctx.font = f;
    var words = String(s || "").split(/\s+/).filter(Boolean), lines = [], cur = "";
    words.forEach(function(w){ var t = cur ? cur + " " + w : w; if (!cur || ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; } });
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  }
  function hline(ctx, x1, x2, y, color, w){ ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); }

  function Report(land, title, subtitle){
    this.land = land; this.title = title; this.subtitle = subtitle; this.M = 34; this.pages = [];
    this.addPage(true);
  }
  Report.prototype.addPage = function(first){
    var w = this.land ? 1123 : 794, h = this.land ? 794 : 1123;
    var cv = document.createElement("canvas");
    cv.width = Math.round(w * SC); cv.height = Math.round(h * SC); cv.setAttribute("dir", "rtl");
    var ctx = cv.getContext("2d"); ctx.scale(SC, SC);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.textBaseline = "middle";
    var pg = {cv:cv, ctx:ctx, w:w, h:h}; this.pages.push(pg); this.pg = pg;
    var M = this.M, y = M;
    if (first) {
      txt(ctx, "کافه‌رستوران مس‌مس", w - M, y + 6, {font:fnt(700, 11), color:P.copper});
      txt(ctx, this.title, w - M, y + 34, {font:DISPLAY});
      txt(ctx, this.subtitle, w - M, y + 62, {font:fnt(500, 13), color:P.muted});
      var now = Date.now();
      txt(ctx, "تهیه: " + fullDate(calKey(now)) + " · ساعت " + hhmm(now), M, y + 6, {font:fnt(400, 10), color:P.muted, align:"left"});
      y += 80;
    } else {
      txt(ctx, this.title + " · " + this.subtitle + " (ادامه)", w - M, y + 6, {font:fnt(500, 11), color:P.muted});
      y += 20;
    }
    hline(ctx, M, w - M, y, P.copper, 1.2);
    this.y = y + 12;
  };
  Report.prototype.bottom = function(){ return this.pg.h - this.M - 22; };
  Report.prototype.ensure = function(hgt){ if (this.y + hgt > this.bottom()) this.addPage(false); };
  Report.prototype.space = function(n){ this.y += n; };
  Report.prototype.para = function(s, o){
    o = o || {}; var size = o.size || 11, f = fnt(o.weight || 400, size);
    var lines = wrapLines(this.pg.ctx, s, this.pg.w - 2 * this.M, f);
    this.ensure(lines.length * size * 1.6);
    for (var i = 0; i < lines.length; i++) { txt(this.pg.ctx, lines[i], this.pg.w - this.M, this.y + size * 0.8, {font:f, color:o.color || P.ink}); this.y += size * 1.6; }
  };
  Report.prototype.heading = function(s){
    this.ensure(76);
    txt(this.pg.ctx, s, this.pg.w - this.M, this.y + 10, {font:fnt(700, 13), color:P.copper});
    this.y += 24;
  };
  Report.prototype.table = function(cols, rows, o){
    var self = this, M = this.M, W = this.pg.w - 2 * M;
    var fixed = 0, flex = 0;
    cols.forEach(function(c){ if (c.w) fixed += c.w; else flex++; });
    var x = this.pg.w - M;
    cols.forEach(function(c){ c.cw = c.w || (W - fixed) / flex; c.x2 = x; c.x1 = x - c.cw; x -= c.cw; });
    var fs = o.fs || 11, padX = o.padX == null ? 6 : o.padX, padY = 5, headH = o.headH || 26;
    var segTop = 0;
    function cx(c){ return c.align === "center" ? (c.x1 + c.x2) / 2 : c.x2 - padX; }
    function closeSeg(){
      var ctx = self.pg.ctx; ctx.strokeStyle = P.line; ctx.lineWidth = .6;
      cols.forEach(function(c, i){ if (i) { ctx.beginPath(); ctx.moveTo(c.x2, segTop); ctx.lineTo(c.x2, self.y); ctx.stroke(); } });
      ctx.strokeStyle = P.ink; ctx.lineWidth = .8; ctx.strokeRect(M, segTop, W, self.y - segTop);
    }
    function head(){
      var ctx = self.pg.ctx; segTop = self.y;
      ctx.fillStyle = P.soft; ctx.fillRect(M, self.y, W, headH);
      cols.forEach(function(c){
        var al = c.align === "center" ? "center" : "right";
        if (c.label2 != null) {
          txt(ctx, c.label, cx(c), self.y + headH * .34, {font:fnt(700, fs), color:P.ink, align:al});
          txt(ctx, c.label2, cx(c), self.y + headH * .72, {font:fnt(400, fs - 1.5), color:c.headColor || P.muted, align:al});
        } else {
          txt(ctx, c.label, cx(c), self.y + headH / 2, {font:fnt(700, fs), color:P.ink, align:al});
        }
      });
      self.y += headH;
      hline(ctx, M, M + W, self.y, P.ink, .8);
    }
    this.ensure(headH + (o.rowH || 24) * 2);
    head();
    rows.forEach(function(r){
      var ctx = self.pg.ctx;
      var cells = cols.map(function(c){ return c.cell(r) || {t:""}; });
      var need = 0;
      cells.forEach(function(cell, i){
        var c = cols[i];
        if (c.wrap && cell.t) {
          var cfs = cell.fs || fs;
          cell.lines = wrapLines(ctx, cell.t, c.cw - 2 * padX, fnt(cell.bold ? 700 : 400, cfs));
          need = Math.max(need, cell.lines.length * cfs * 1.5);
        }
      });
      var rh = Math.max(o.rowH || 24, need + 2 * padY);
      if (self.y + rh > self.bottom()) { closeSeg(); self.addPage(false); head(); ctx = self.pg.ctx; }
      var top = self.y;
      cells.forEach(function(cell, i){
        var c = cols[i];
        ctx.save(); ctx.beginPath(); ctx.rect(c.x1, top, c.cw, rh); ctx.clip();
        if (cell.bg) { ctx.fillStyle = cell.bg; ctx.fillRect(c.x1 + 1.5, top + 1.5, c.cw - 3, rh - 3); }
        var al = c.align === "center" ? "center" : "right";
        var f = fnt(cell.bold ? 700 : 400, cell.fs || fs);
        if (cell.lines) {
          var llh = (cell.fs || fs) * 1.5;
          var y0 = top + (rh - cell.lines.length * llh) / 2 + llh / 2;
          cell.lines.forEach(function(l, li){ txt(ctx, l, cx(c), y0 + li * llh, {font:f, color:cell.color, align:al, dir:cell.dir}); });
        } else if (cell.sub) {
          txt(ctx, cell.t, cx(c), top + rh * .36, {font:f, color:cell.color, align:al, dir:cell.dir});
          txt(ctx, cell.sub, cx(c), top + rh * .72, {font:fnt(700, fs - 1.5), color:cell.subColor || P.muted, align:al, dir:"ltr"});
        } else {
          txt(ctx, cell.t, cx(c), top + rh / 2, {font:f, color:cell.color, align:al, dir:cell.dir});
        }
        ctx.restore();
      });
      self.y += rh;
      hline(ctx, M, M + W, self.y, P.line, .6);
    });
    closeSeg();
    this.y += 10;
  };
  Report.prototype.signatures = function(){
    this.ensure(64);
    var ctx = this.pg.ctx, w = this.pg.w, M = this.M, y = this.y + 40, half = (w - 2 * M) / 2;
    [["امضای مدیر", w - M], ["امضای سوپروایزر", w - M - half]].forEach(function(s){
      txt(ctx, s[0] + ":", s[1], y, {font:fnt(500, 11), color:P.muted});
      ctx.font = fnt(500, 11); var lw = ctx.measureText(s[0] + ":").width;
      ctx.setLineDash([2, 3]); hline(ctx, s[1] - half + 24, s[1] - lw - 8, y + 6, P.muted, .8); ctx.setLineDash([]);
    });
    this.y = y + 20;
  };
  Report.prototype.finish = function(){
    var n = this.pages.length, M = this.M;
    this.pages.forEach(function(pg, i){
      hline(pg.ctx, M, pg.w - M, pg.h - M - 8, P.line, .6);
      txt(pg.ctx, "حضور و غیاب مس‌مس", pg.w - M, pg.h - M + 4, {font:fnt(400, 9), color:P.muted});
      txt(pg.ctx, "صفحه‌ی " + fa(i + 1) + " از " + fa(n), M, pg.h - M + 4, {font:fnt(400, 9), color:P.muted, align:"left"});
    });
    return this;
  };

  function attCell(st, short){
    if (st === "p") return {t:short ? "ح" : "حاضر", color:P.p, bg:P.pSoft, bold:true};
    if (st === "l") return {t:short ? "ت" : "تأخیر", color:P.l, bg:P.lSoft, bold:true};
    if (st === "a") return {t:short ? "غ" : "غایب", color:P.a, bg:P.aSoft, bold:true};
    return {t:"—", color:P.faint};
  }
  function netCell(n){ return {t:signed(n), dir:"ltr", bold:true, color:n > 0 ? P.p : n < 0 ? P.a : P.muted}; }
  function cntCell(n, color){ return {t:n ? fa(n) : "—", color:n ? (color || P.ink) : P.faint}; }

  function reportStaff(keys){
    return S.staff.filter(function(s){
      if (!s) return false;
      if (s.active !== false) return true;
      return keys.some(function(k){ var pd = personDay(k, s.id); return pd.st || pd.marks.length; });
    });
  }
  function reportSpec(){
    var t = S.exType, keys, label, base;
    if (t === "d") { keys = [S.sel]; label = fullDate(S.sel); base = "حضور-روزانه-" + jKey(S.sel); }
    else if (t === "w") {
      var s = weekStart(S.sel); keys = [];
      for (var i = 0; i < 7; i++) keys.push(addDays(s, i));
      label = "هفته‌ی " + rangeLabel(keys[0], keys[6]); base = "حضور-هفتگی-" + jKey(keys[0]);
    } else { keys = monthDays(S.sel); label = monthLabel(S.sel); base = "حضور-ماهانه-" + jKey(keys[0]).slice(0, 7); }
    return {t:t, keys:keys, label:label, base:base, hash:JSON.stringify([t, keys, keys.map(function(k){ return S.days[k] || 0; }), S.staff])};
  }
  function notesRows(keys, staff){
    var out = [];
    keys.forEach(function(k){
      staff.forEach(function(s){
        var pd = personDay(k, s.id);
        if (pd.st === "a" || pd.st === "l") out.push({date:dayLabel(k), name:s.name, item:ATT_NAME[pd.st], kind:pd.st, why:pd.why || "دلیلی ثبت نشده"});
        pd.marks.forEach(function(m){ if (m.r) out.push({date:dayLabel(k), name:s.name, item:(m.v > 0 ? "مثبت" : "منفی") + " · " + hhmm(m.t), kind:m.v > 0 ? "p" : "a", why:m.r}); });
      });
    });
    return out;
  }
  function notesTable(R, keys, staff){
    var rows = notesRows(keys, staff);
    if (!rows.length) { R.para("در این بازه غیبت، تأخیر یا امتیاز دلیل‌داری ثبت نشده است.", {color:P.muted, size:10.5}); return; }
    R.heading("یادداشت‌ها: غیبت‌ها، تأخیرها و امتیازهای دلیل‌دار");
    R.table([
      {label:"تاریخ", w:140, align:"right", cell:function(r){ return {t:r.date}; }},
      {label:"نام", w:130, align:"right", wrap:true, cell:function(r){ return {t:r.name, bold:true}; }},
      {label:"مورد", w:110, align:"center", cell:function(r){ var c = r.kind === "p" ? P.p : r.kind === "l" ? P.l : P.a; return {t:r.item, color:c, bold:true}; }},
      {label:"دلیل", w:0, align:"right", wrap:true, cell:function(r){ return {t:r.why}; }}
    ], rows, {fs:10.5, rowH:24});
  }

  function buildDaily(spec){
    var k = spec.keys[0], staff = reportStaff(spec.keys);
    var R = new Report(false, "گزارش حضور و غیاب روزانه", fullDate(k) + " · شیفت عصر ۱۸:۰۰ تا ۰۰:۳۰");
    var rows = staff.map(function(s, i){ var pd = personDay(k, s.id); pd.name = s.name; pd.i = i + 1; return pd; });
    var c = {p:0,l:0,a:0,n:0};
    rows.forEach(function(r){ if (r.st) c[r.st]++; else c.n++; });
    R.para("از " + fa(rows.length) + " نفر: حاضر " + fa(c.p) + " · تأخیر " + fa(c.l) + " · غایب " + fa(c.a) + " · ثبت‌نشده " + fa(c.n), {weight:500, size:11.5});
    R.space(4);
    R.table([
      {label:"ردیف", w:34, align:"center", cell:function(r){ return {t:fa(r.i), color:P.muted}; }},
      {label:"نام", w:118, align:"right", wrap:true, cell:function(r){ return {t:r.name, bold:true}; }},
      {label:"حضور", w:62, align:"center", cell:function(r){ return attCell(r.st); }},
      {label:"دلیل غیبت / تأخیر", w:150, align:"right", wrap:true, cell:function(r){ return {t:r.st === "a" || r.st === "l" ? (r.why || "ثبت نشده") : "", color:r.why ? P.ink : P.muted}; }},
      {label:"مثبت", w:44, align:"center", cell:function(r){ return cntCell(r.plus, P.p); }},
      {label:"منفی", w:44, align:"center", cell:function(r){ return cntCell(r.minus, P.a); }},
      {label:"جمع", w:50, align:"center", cell:function(r){ return netCell(r.net); }},
      {label:"شرح امتیازها", w:0, align:"right", wrap:true, cell:function(r){
        return {t:r.marks.map(function(m){ return (m.v > 0 ? "مثبت" : "منفی") + " " + hhmm(m.t) + (m.r ? "، " + m.r : ""); }).join(" ؛ "), color:P.muted, fs:10};
      }}
    ], rows, {fs:11, rowH:28});
    R.signatures();
    return {pages:R.finish().pages, land:false};
  }
  function personRows(keys, staff){
    return staff.map(function(s, i){
      var r = {name:s.name, i:i + 1, days:keys.map(function(k){ return personDay(k, s.id); }), p:0, l:0, a:0, plus:0, minus:0};
      r.days.forEach(function(d){ if (d.st) r[d.st]++; r.plus += d.plus; r.minus += d.minus; });
      r.net = r.plus - r.minus; return r;
    });
  }
  function totalCols(cols, w, wNet){
    cols.push(
      {label:"حاضر", w:w, align:"center", cell:function(r){ return cntCell(r.p, P.p); }},
      {label:"تأخیر", w:w, align:"center", cell:function(r){ return cntCell(r.l, P.l); }},
      {label:"غایب", w:w, align:"center", cell:function(r){ return cntCell(r.a, P.a); }},
      {label:"مثبت", w:w, align:"center", cell:function(r){ return cntCell(r.plus, P.p); }},
      {label:"منفی", w:w, align:"center", cell:function(r){ return cntCell(r.minus, P.a); }},
      {label:"جمع", w:wNet, align:"center", cell:function(r){ return netCell(r.net); }}
    );
  }
  function buildWeekly(spec){
    var keys = spec.keys, staff = reportStaff(keys);
    var R = new Report(true, "گزارش حضور و غیاب هفتگی", spec.label + " · شیفت عصر");
    var rows = personRows(keys, staff);
    var cols = [
      {label:"ردیف", w:30, align:"center", cell:function(r){ return {t:fa(r.i), color:P.muted}; }},
      {label:"نام", w:0, align:"right", wrap:true, cell:function(r){ return {t:r.name, bold:true}; }}
    ];
    keys.forEach(function(k, di){
      var j = jal(k);
      cols.push({label:WEEKDAYS[j.wd], label2:fa(j.d) + " " + MONTHS[j.m - 1], w:88, align:"center", cell:function(r){
        var d = r.days[di], c = attCell(d.st);
        if (d.marks.length) { c.sub = signed(d.net); c.subColor = d.net > 0 ? P.p : d.net < 0 ? P.a : P.muted; }
        return c;
      }});
    });
    totalCols(cols, 44, 50);
    R.para("عدد زیر هر خانه، جمع امتیاز همان شیفت است.", {color:P.muted, size:10});
    R.table(cols, rows, {fs:10.5, rowH:31, headH:36});
    notesTable(R, keys, staff);
    R.signatures();
    return {pages:R.finish().pages, land:true};
  }
  function buildMonthly(spec){
    var keys = spec.keys, staff = reportStaff(keys);
    var recorded = keys.filter(function(k){ return S.days[k]; }).length;
    var R = new Report(true, "گزارش حضور و غیاب ماهانه", spec.label + " · شیفت عصر · " + fa(recorded) + " شیفت ثبت‌شده");
    var rows = personRows(keys, staff);
    var cols = [
      {label:"ردیف", w:24, align:"center", cell:function(r){ return {t:fa(r.i), color:P.muted}; }},
      {label:"نام", w:96, align:"right", wrap:true, cell:function(r){ return {t:r.name, bold:true}; }}
    ];
    keys.forEach(function(k, di){
      var j = jal(k);
      cols.push({label:fa(j.d), label2:WD1[j.wd], headColor:j.wd === 5 ? P.copper : P.muted, w:0, align:"center", cell:function(r){ return attCell(r.days[di].st, true); }});
    });
    totalCols(cols, 36, 44);
    R.para("ح = حاضر · ت = تأخیر · غ = غایب · ستون‌های مثبت و منفی، جمع امتیازهای کل ماه است.", {color:P.muted, size:10});
    R.table(cols, rows, {fs:9.5, rowH:24, headH:34, padX:2});
    notesTable(R, keys, staff);
    R.signatures();
    return {pages:R.finish().pages, land:true};
  }

  /* ---------- export pipeline: draw → JPEG blobs (canvases freed) → preview + ready-made PDF ---------- */
  var EX = {hash:null, building:null, failed:null, pages:null, urls:null, pdf:null, land:false, base:""};
  function toJpeg(cv){
    return new Promise(function(res, rej){
      if (cv.toBlob) cv.toBlob(function(b){ b ? res(b) : rej(new Error("blob")); }, "image/jpeg", 0.92);
      else { try { var d = atob(cv.toDataURL("image/jpeg", 0.92).split(",")[1]), u = new Uint8Array(d.length); for (var i = 0; i < d.length; i++) u[i] = d.charCodeAt(i); res(new Blob([u], {type:"image/jpeg"})); } catch (e) { rej(e); } }
    });
  }
  function blobToU8(b){
    if (b.arrayBuffer) return b.arrayBuffer().then(function(ab){ return new Uint8Array(ab); });
    return new Promise(function(res, rej){ var fr = new FileReader(); fr.onload = function(){ res(new Uint8Array(fr.result)); }; fr.onerror = rej; fr.readAsArrayBuffer(b); });
  }
  function revoke(u){ if (typeof u === "string" && u.indexOf("blob:") === 0) { try { URL.revokeObjectURL(u); } catch (_) {} } }
  function ensureBuild(){
    var spec = reportSpec();
    if (EX.hash === spec.hash || EX.building === spec.hash || EX.failed === spec.hash) return;
    EX.building = spec.hash;
    fontsReady().then(function(){
      if (EX.building !== spec.hash) return null;
      var r = spec.t === "d" ? buildDaily(spec) : spec.t === "w" ? buildWeekly(spec) : buildMonthly(spec);
      var seq = Promise.resolve(), pages = [];
      r.pages.forEach(function(pg){
        seq = seq.then(function(){ return toJpeg(pg.cv); }).then(function(blob){
          pages.push({blob:blob, w:pg.cv.width, h:pg.cv.height});
          pg.cv.width = 0; pg.cv.height = 0; // release canvas memory right away (matters on iPhone)
        });
      });
      return seq.then(function(){
        return Promise.all(pages.map(function(p){ return blobToU8(p.blob).then(function(u8){ return {u8:u8, w:p.w, h:p.h, land:r.land}; }); }));
      }).then(function(pp){
        if (EX.building !== spec.hash) return;
        var old = EX.urls;
        // The PDF is built ahead of time so a tap can hand it to the share sheet immediately (iOS requires that).
        EX = {hash:spec.hash, building:null, failed:null, pages:pages, land:r.land, base:spec.base,
              pdf:new Blob(makePdf(pp), {type:"application/pdf"}),
              urls:pages.map(function(p){ return URL.createObjectURL(p.blob); })};
        if (S.tab === "export") render();
        if (old) setTimeout(function(){ old.forEach(revoke); }, 2000);
      });
    }).catch(function(){
      if (EX.building === spec.hash) { EX.building = null; EX.failed = spec.hash; if (S.tab === "export") render(); }
    });
  }

  /* ---------- toast ---------- */
  var toastTimer = null, toastFn = null;
  function toast(text, undo){
    toastText.textContent = text;
    toastFn = undo || null;
    toastUndo.hidden = !undo;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.hidden = true; toastFn = null; }, undo ? 6000 : 3500);
  }
  toastUndo.addEventListener("click", function(){
    var f = toastFn; toastFn = null; toastEl.hidden = true; clearTimeout(toastTimer);
    if (f) f();
  });

  /* ---------- typing: saved after a short pause, on leaving the field, and when the app goes to background ---------- */
  function saveField(el){
    if (drafts[el.id]) { clearTimeout(drafts[el.id]); delete drafts[el.id]; }
    var act = el.dataset.act, val = el.value.trim();
    if (act === "why") {
      var k = el.dataset.day, sid = el.dataset.sid; val = val.slice(0, 200);
      var cur = ((S.days[k] || {}).note || {})[sid] || "";
      if (cur !== val) { var p = {note:{}}; p.note[sid] = val || null; writeDay(k, p); }
    } else if (act === "reason") {
      var k2 = el.dataset.day, sid2 = el.dataset.sid, mid = el.dataset.mid; val = val.slice(0, 200);
      var m = marksOf(S.days[k2] || {}, sid2).filter(function(x){ return x.id === mid; })[0];
      if (m && m.r !== val) writeDay(k2, markPatch(sid2, mid, {r:val}));
    } else if (act === "rename") {
      var s = staffById(el.dataset.sid); val = val.slice(0, 40);
      if (!s) return;
      if (!val) { if (document.activeElement !== el) el.value = s.name; return; }
      if (s.name !== val) writeStaff(S.staff.map(function(x){ return x.id === s.id ? Object.assign({}, x, {name:val}) : x; }));
    }
  }
  function isField(t){ return t && t.tagName === "INPUT" && t.dataset && /^(why|reason|rename)$/.test(t.dataset.act || ""); }
  root.addEventListener("input", function(e){
    var t = e.target; if (!isField(t)) return;
    if (drafts[t.id]) clearTimeout(drafts[t.id]);
    drafts[t.id] = setTimeout(function(){ delete drafts[t.id]; saveField(t); }, 900);
  });
  root.addEventListener("change", function(e){
    var t = e.target;
    if (t && t.id === "restoreFile") { if (t.files && t.files[0]) readImport(t.files[0]); t.value = ""; return; }
    if (isField(t)) saveField(t);
  });
  root.addEventListener("keydown", function(e){ if (e.key === "Enter" && isField(e.target)) { e.preventDefault(); e.target.blur(); } });
  function flushDrafts(){
    Object.keys(drafts).forEach(function(id){ var el = document.getElementById(id); clearTimeout(drafts[id]); delete drafts[id]; if (el) saveField(el); });
  }
  // A phone keeps the app alive in the background for days: when it comes back, "tonight" must be the real tonight.
  function syncToday(){
    var t = shiftKey(Date.now());
    if (S.followToday && S.sel !== t) { S.sel = t; S.open = null; render(); }
  }
  document.addEventListener("visibilitychange", function(){ if (document.visibilityState === "hidden") flushDrafts(); else syncToday(); });
  window.addEventListener("pagehide", flushDrafts);
  window.addEventListener("pageshow", syncToday);
  window.addEventListener("focus", syncToday);
  setInterval(syncToday, 60000);

  /* ---------- taps ---------- */
  root.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!b || b.disabled || b.tagName === "INPUT") return;
    var act = b.dataset.act, sid = b.dataset.sid;
    if (act === "tab") { S.tab = b.dataset.tab; S.confirmDel = null; render(); window.scrollTo(0, 0); return; }
    if (act === "prev") { S.sel = addDays(S.sel, -1); S.followToday = false; render(); return; }
    if (act === "next") { var t = shiftKey(Date.now()); if (S.sel < t) { S.sel = addDays(S.sel, 1); S.followToday = S.sel === t; render(); } return; }
    if (act === "today") { S.sel = shiftKey(Date.now()); S.followToday = true; render(); return; }
    if (act === "open") { S.open = S.open === sid ? null : sid; render(); return; }
    if (act === "mark") {
      var v = Number(b.dataset.v), key = S.sel;
      var id = "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      writeDay(key, markPatch(sid, id, {v:v, t:Date.now(), r:""}));
      var s = staffById(sid);
      toast((v > 0 ? "یک مثبت" : "یک منفی") + " برای " + (s ? s.name : "") + " ثبت شد", function(){ writeDay(key, markPatch(sid, id, null)); });
      return;
    }
    if (act === "att") {
      var cur = ((S.days[S.sel] || {}).att || {})[sid] || null;
      var st = b.dataset.st;
      var p2 = {att:{}}; p2.att[sid] = cur === st ? null : st;
      if (p2.att[sid] === "a" || p2.att[sid] === "l") S.focusAfter = "why-" + sid; // focus inside the tap so the phone keyboard opens
      writeDay(S.sel, p2);
      return;
    }
    if (act === "delmark") {
      var k2 = S.sel, mid = b.dataset.mid;
      var old = marksOf(S.days[k2] || {}, sid).filter(function(m){ return m.id === mid; })[0];
      writeDay(k2, markPatch(sid, mid, null));
      if (old) {
        var s2 = staffById(sid);
        toast((old.v > 0 ? "مثبت" : "منفی") + " " + (s2 ? s2.name : "") + " پاک شد", function(){ writeDay(k2, markPatch(sid, mid, {v:old.v, t:old.t, r:old.r})); });
      }
      return;
    }
    if (act === "del") {
      if (S.confirmDel !== sid) { S.confirmDel = sid; render(); return; }
      S.confirmDel = null;
      writeStaff(S.staff.map(function(x){ return x.id === sid ? Object.assign({}, x, {active:false}) : x; }));
      return;
    }
    if (act === "extype") { S.exType = b.dataset.t; render(); return; }
    if (act === "exprev" || act === "exnext") {
      var dir = act === "exprev" ? -1 : 1, today = shiftKey(Date.now()), ns;
      if (S.exType === "d") ns = addDays(S.sel, dir);
      else if (S.exType === "w") ns = addDays(weekStart(S.sel), dir * 7);
      else { var md = monthDays(S.sel); ns = dir < 0 ? addDays(md[0], -1) : addDays(md[md.length - 1], 1); }
      if (ns > today) ns = today;
      S.sel = ns; S.followToday = ns === today; render(); return;
    }
    if (act === "rebuild") { EX.failed = null; render(); return; }
    if (act === "pdf") { if (EX.pdf) deliver(EX.pdf, EX.base + ".pdf", "pdf"); return; }
    if (act === "sharepdf") { if (EX.pdf) shareOnly(EX.pdf, EX.base + ".pdf"); return; }
    if (act === "img") { if (EX.pages) deliver(EX.pages[0].blob, EX.base + ".jpg", "jpg"); return; }
    if (act === "backup") { doBackup(); return; }
    if (act === "pickrestore") { var fi = document.getElementById("restoreFile"); if (fi) fi.click(); return; }
    if (act === "importmerge") { applyImport("merge"); return; }
    if (act === "importreplace") { applyImport("replace"); return; }
    if (act === "importcancel") { S.importDraft = null; render(); return; }
    if (act === "install") {
      var ev = S.installEvt; S.installEvt = null;
      if (ev && ev.prompt) { ev.prompt(); if (ev.userChoice) ev.userChoice.then(function(){ render(); }, function(){}); }
      render(); return;
    }
    if (act === "hideinstall") { S.meta.hideInstall = true; saveData(); render(); return; }
  });

  root.addEventListener("submit", function(e){
    if (e.target.id !== "addForm") return;
    e.preventDefault();
    var input = document.getElementById("newName");
    var name = (input.value || "").trim().slice(0, 40);
    if (!name) return;
    input.value = "";
    var list = S.staff.slice();
    list.push({id:"s" + Date.now().toString(36), name:name, active:true});
    writeStaff(list);
    toast(name + " به فهرست اضافه شد");
  });

  /* ---------- install, other windows, offline ---------- */
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); S.installEvt = e; render(); });
  window.addEventListener("appinstalled", function(){ S.installEvt = null; render(); toast("برنامه روی " + DEV + " نصب شد"); });
  window.addEventListener("storage", function(e){
    if (e.key !== LS_KEY) return;
    var d = loadData(); if (d) { applyData(d); render(); }
  });
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    var reg = function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); };
    if (document.readyState === "complete") reg(); else window.addEventListener("load", reg);
  }

  /* ---------- boot ---------- */
  (function boot(){
    var d = loadData();
    if (d) applyData(d);
    else { S.staff = []; S.days = {}; S.meta = {created:Date.now()}; }
    if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(function(p){ S.persisted = p; if (S.tab === "settings") render(); }, function(){});
    render();
  })();
})();
