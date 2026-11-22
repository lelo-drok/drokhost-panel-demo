/* DrokHost Panel — dashboard: servidores, crear servidor, cuenta y actividad */
(function(){
'use strict';
if(!DB.guard())return;
const I = DH.icon, esc = DH.esc;

const NAV = [
  {key: 'servers', label: 'Servidores', icon: 'server', href: 'dashboard.html'},
  {key: 'actividad', label: 'Actividad de la cuenta', icon: 'activity', href: 'dashboard.html#actividad'}
];

function metric(label, ic, val, pct) {
  return '<div class="metric"><div class="lbl">' + I(ic) + label + '</div><div class="val">' + val + '</div>' +
    '<div class="bar"><span style="width:' + Math.max(0, Math.min(100, pct)) + '%"></span></div></div>';
}
function diskUsed(s) {
  const f = DB.loadFiles(s.id); let n = 0; Object.values(f).forEach(x => { n += x.s || 0; });
  s.backups.forEach(b => { n += b.size || 0; }); return n;
}

function serversView() {
  const list = DB.data.servers;
  const cards = list.map(s => {
    const on = s.status === 'online', cpu = on ? 5 + Math.random() * 20 : 0, mem = on ? s.ramMb * (0.25 + Math.random() * 0.1) : 0, d = diskUsed(s);
    return '<a class="card srv" href="server.html?id=' + s.id + '">' +
      '<div class="ico">' + I(DB.TYPES[s.type].icon) + '</div>' +
      '<div><div class="name">' + esc(s.name) + '</div><div class="desc mono">' + s.ip + ':' + s.port + ' • ' + DB.TYPES[s.type].label + (s.desc ? ' • ' + esc(s.desc) : '') + '</div></div>' +
      metric('CPU', 'cpu', cpu.toFixed(1) + '% / 100%', cpu) +
      metric('Memoria', 'memory', DH.fmtMem(mem) + ' / ' + DH.fmtMem(s.ramMb), mem / s.ramMb * 100) +
      metric('Disco', 'disk', DH.fmtBytes(d) + ' / ' + DH.fmtMem(s.diskMb), d / (s.diskMb * 1048576) * 100) +
      '<span class="status ' + s.status + '">' + DH.statusLabel(s.status) + '</span></a>';
  }).join('');
  return '<div class="toolbar"><div class="crumb">Mostrando <b>tus servidores</b> (' + list.length + ')</div>' +
    '<div class="btns"><input class="input" style="max-width:240px" placeholder="Buscar servidor..." id="q">' +
    '<button class="btn gold" id="newSrv">' + I('plus') + 'Crear servidor</button></div></div>' +
    '<div class="srv-list" id="list">' + (cards || '<div class="card empty">No tienes servidores. Pulsa «Crear servidor».</div>') + '</div>';
}

function createModal() {
  const opts = Object.keys(DB.TYPES).map(k => '<option value="' + k + '">' + DB.TYPES[k].label + '</option>').join('');
  DH.modal({title: 'Crear servidor', submit: 'Crear servidor',
    body: '<div class="field"><label>Nombre</label><input class="input" name="name" maxlength="60" placeholder="Mi servidor"></div>' +
    '<div class="field"><label>Tipo</label><select class="input" name="type">' + opts + '</select></div>' +
    '<div class="field"><label>Descripción</label><input class="input" name="desc" maxlength="120" placeholder="Opcional"></div>' +
    '<div class="two"><div class="field"><label>RAM (MB)</label><input class="input" name="ram" type="number" min="128" value="1024"></div>' +
    '<div class="field"><label>Disco (MB)</label><input class="input" name="disk" type="number" min="256" value="5120"></div>' +
    '<div class="field"><label>Slots (jugadores)</label><input class="input" name="slots" type="number" min="0" value="50"><small>Pon 0 para bots o webs.</small></div>',
    onSubmit(f) {
      const name = f.name.value.trim(), ram = +f.ram.value, disk = +f.disk.value, slots = +f.slots.value;
      if (!name) return 'Escribe un nombre.';
      if (!(ram >= 128)) return 'La RAM mínima es 128 MB.';
      if (!(disk >= 256)) return 'El disco mínimo es 256 MB.';
      if (!(slots >= 0)) return 'Slots no válidos.';
      const s = DB.create({name, type: f.type.value, desc: f.desc.value.trim(), ramMb: ram, diskMb: disk, slots});
      DH.toast('Servidor «' + s.name + '» creado.');
      route();
    }});
}

function accountView() {
  const u = DB.data.admin.user;
  return '<div class="two">' +
    '<form class="card" id="credForm"><h3>' + I('lock') + 'Usuario y contraseña de administrador</h3><div class="err" id="credErr"></div>' +
    '<div class="field"><label>Usuario</label><input class="input" name="user" value="' + esc(u) + '"></div>' +
    '<div class="field"><label>Nueva contraseña</label><input class="input" name="pass" type="password" placeholder="Déjalo vacío para no cambiarla"><small>Mínimo 6 caracteres.</small></div>' +
    '<div class="field"><label>Contraseña actual</label><input class="input" name="cur" type="password"></div>' +
    '<button class="btn gold">Guardar cambios</button></form>' +
    '<div class="card"><h3>' + I('archive') + 'Datos del panel</h3><p class="hint" style="margin-bottom:12px">Todo se guarda en este navegador (' + DH.fmtBytes(DB.usage()) + ' usados). Exporta una copia para pasarla a otro equipo.</p>' +
    '<div class="btns" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="exp">' + I('down') + 'Exportar</button>' +
    '<label class="btn" style="cursor:pointer">' + I('up') + 'Importar<input type="file" id="imp" accept=".json" hidden></label>' +
    '<button class="btn red" id="rst">' + I('trash') + 'Restablecer</button></div></div></div>';
}

function activityView() {
  const rows = DB.data.activity.slice(0, 100);
  return '<div class="card"><h3>' + I('activity') + 'Actividad de la cuenta</h3>' + (rows.length ? '<ul class="activity">' + rows.map(r => {
    const s = r.srv ? DB.get(r.srv) : null;
    return '<li><div class="dot">' + I('activity') + '</div><div><div><span class="tag gold mono">' + esc(r.ev) + '</span> ' + esc(r.desc) + (s ? ' <span class="tag">' + esc(s.name) + '</span>' : '') +
    '</div><div class="when">' + esc(r.user) + ' • ' + DH.ago(r.t) + '</div></div></li>';
  }).join('') + '</ul>' : '<div class="empty">Sin actividad.</div>') + '</div>';
}

const VIEWS = {
  servers: ['Tus servidores', 'Bienvenido de nuevo, ' + DB.data.admin.user, serversView],
  cuenta: ['Mi cuenta', 'Credenciales de acceso y datos del panel', accountView],
  actividad: ['Actividad de la cuenta', 'Registro de acciones recientes', activityView]
};

function route() {
  let key = (location.hash || '').slice(1); if (!VIEWS[key]) key = 'servers';
  const v = VIEWS[key];
  DH.renderShell({nav: NAV, active: key, title: v[0], sub: key === 'servers' ? 'Bienvenido de nuevo, ' + DB.data.admin.user : v[1]});
  document.getElementById('content').innerHTML = v[2]();
  document.title = v[0] + ' | DrokHost';
  const q = document.getElementById('q');
  if (q) q.addEventListener('input', () => {
    const t = q.value.toLowerCase();
    document.querySelectorAll('#list .srv').forEach(el => { el.style.display = el.textContent.toLowerCase().includes(t) ? '' : 'none'; });
  });
  const ns = document.getElementById('newSrv'); if (ns) ns.onclick = createModal;
  const cf = document.getElementById('credForm');
  if (cf) {
    cf.onsubmit = e => {
      e.preventDefault();
      const r = DB.setAdmin(cf.cur.value, cf.user.value, cf.pass.value);
      if (r) { document.getElementById('credErr').textContent = r; return; }
      DH.toast('Credenciales actualizadas.'); route();
    };
    document.getElementById('exp').onclick = () => DH.download('drokhost-panel-' + new Date().toISOString().slice(0, 10) + '.json', DB.exportAll(), 'application/json');
    document.getElementById('imp').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(t => { try { DB.importAll(t); DH.toast('Datos importados.'); setTimeout(() => location.reload(), 600); } catch (err) { DH.toast('No se pudo importar: ' + err.message); } });
    };
    document.getElementById('rst').onclick = () => DH.confirmar('Se borrarán todos los servidores, archivos y copias, y el acceso volverá a admin / drokhost.', () => { DB.resetAll(); location.replace('index.html'); }, 'Restablecer');
  }
}

window.addEventListener('hashchange', route);
route();
setInterval(() => { if ((location.hash || '#servers') === '#servers' && !document.querySelector('.modal-bg') && document.activeElement.id !== 'q') route(); }, 5000);
})();
