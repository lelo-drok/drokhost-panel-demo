/* DrokHost Panel — componentes comunes (iconos, sidebar, topbar, footer, modales) */
(function () {
  'use strict';

  var DISCORD_URL = 'https://discord.gg/6SJ6KHDfQ';

  var P = {
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
    terminal: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    memory: '<rect x="2" y="7" width="20" height="10" rx="1"/><line x1="6" y1="11" x2="6" y2="13"/><line x1="10" y1="11" x2="10" y2="13"/><line x1="14" y1="11" x2="14" y2="13"/><line x1="18" y1="11" x2="18" y2="13"/><line x1="6" y1="17" x2="6" y2="20"/><line x1="18" y1="17" x2="18" y2="20"/>',
    disk: '<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/>',
    down: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    up: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="15" x2="12" y2="3"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    file: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    star: '<polygon points="12 2 15 9 22 9.3 17 14 18.5 21 12 17.3 5.5 21 7 14 2 9.3 9 9"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
  };

function icon(name) {
  return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || '') + '</svg>';
}

function fmtMem(mb) { return mb >= 1024 ? (mb / 1024).toFixed(2) + ' GiB' : Math.round(mb) + ' MiB'; }
function fmtUptime(s) {
  if (!s) return 'Offline';
  var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = Math.floor(s % 60);
  return (d ? d + 'd ' : '') + h + 'h ' + m + 'm ' + x + 's';
}
function statusLabel(st) { return st === 'online' ? 'Online' : st === 'starting' ? 'Iniciando' : 'Offline'; }
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

/* nav: [{label, icon, href, key}] */
function renderShell(opts) {
  var sb = document.getElementById('sidebar');
  var items = opts.nav.map(function (n) {
    if (n === '-') return '<div class="sep"></div>';
    return '<a class="nav-btn' + (n.key === opts.active ? ' active' : '') + '" href="' + n.href + '" data-key="' + n.key +
      '" data-label="' + esc(n.label) + '" aria-label="' + esc(n.label) + '">' + icon(n.icon) + '</a>';
  }).join('');
  sb.innerHTML = '<a class="brand" href="dashboard.html" title="DrokHost"><img src="assets/img/logo-icon.png" alt="DrokHost"></a>' + items +
    '<div class="spacer"></div>' +
    '<a class="nav-btn" href="dashboard.html#cuenta" data-label="Mi cuenta y ajustes">' + icon('user') + '</a>' +
    '<a class="nav-btn" href="index.html" data-label="Cerrar sesión" id="logoutBtn">' + icon('logout') + '</a>';

  document.getElementById('topbar').innerHTML =
    '<div><h1 id="pageTitle">' + esc(opts.title) + '</h1><div class="sub" id="pageSub">' + esc(opts.sub || '') + '</div></div>' +
    '<div class="right">' + discordPill() + '<div class="avatar" title="' + esc(DB.data.admin.user) + '">' + esc(DB.data.admin.user.charAt(0).toUpperCase()) + '</div></div>';

  renderFooter();
  var lo = document.getElementById('logoutBtn');
  if (lo) lo.addEventListener('click', function () { DB.logout(); });
}

function discordPill() {
  return '<a class="pill-discord" href="' + DISCORD_URL + '" target="_blank" rel="noopener">' + icon('chat') + '<span>Discord</span></a>';
}

function renderFooter() {
  var f = document.getElementById('footer');
  if (f) f.innerHTML = '<a href="https://pterodactyl.io" target="_blank" rel="noopener">Pterodactyl®</a> © 2015 - 2026 • ' +
    '<a href="https://blueprint.zip" target="_blank" rel="noopener">Blueprint</a> © 2023 - 2026 • DrokHost';
}

var toastTimer;
function toast(msg) {
  var t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
}


function fmtBytes(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KiB'; if (b < 1073741824) return (b / 1048576).toFixed(2) + ' MiB'; return (b / 1073741824).toFixed(2) + ' GiB'; }
function ago(t) { var s = Math.floor((Date.now() - t) / 1000); if (s < 60) return 'hace ' + s + ' s'; if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min'; if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h'; return 'hace ' + Math.floor(s / 86400) + ' d'; }

/* Modal reutilizable: o = {title, body, submit, danger, wide, onSubmit(form) -> false o texto de error para no cerrar} */
function modal(o) {
  var w = document.createElement('div'); w.className = 'modal-bg';
  w.innerHTML = '<form class="modal card' + (o.wide ? ' wide' : '') + '" novalidate><h3>' + esc(o.title) + '</h3><div class="err"></div><div class="mb">' + o.body + '</div>' +
    '<div class="mf"><button type="button" class="btn" data-x>' + (o.submit === false ? 'Cerrar' : 'Cancelar') + '</button>' +
    (o.submit === false ? '' : '<button class="btn ' + (o.danger ? 'red' : 'gold') + '" type="submit">' + esc(o.submit || 'Guardar') + '</button>') + '</div></form>';
  document.body.appendChild(w);
  var f = w.querySelector('form'), er = w.querySelector('.err');
  function close() { w.remove(); document.removeEventListener('keydown', esc_); }
  function esc_(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', esc_);
  w.querySelector('[data-x]').onclick = close;
  w.addEventListener('mousedown', function (e) { if (e.target === w) close(); });
  f.onsubmit = function (e) {
    e.preventDefault();
    var r = o.onSubmit ? o.onSubmit(f) : null;
    if (typeof r === 'string') { er.textContent = r; return; }
    if (r === false) return;
    close();
  };
  var first = f.querySelector('.mb input:not([type=checkbox]), .mb textarea, .mb select'); if (first) first.focus();
  return { el: w, form: f, close: close };
}
function confirmar(msg, cb, label) { modal({ title: 'Confirmar', body: '<p>' + msg + '</p>', submit: label || 'Eliminar', danger: true, onSubmit: function () { cb(); } }); }
function download(name, content, mime) {
  var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
window.DH = { DISCORD_URL: DISCORD_URL, icon: icon, fmtMem: fmtMem, fmtBytes: fmtBytes, ago: ago, modal: modal, confirmar: confirmar, download: download,
  fmtUptime: fmtUptime, statusLabel: statusLabel, esc: esc, renderShell: renderShell, discordPill: discordPill,
  renderFooter: renderFooter, toast: toast };
})();
