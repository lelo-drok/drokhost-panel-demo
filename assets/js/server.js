/* DrokHost Panel — vista de servidor funcional (todo persistido en localStorage) */
(function () {
'use strict';
if (!DB.guard()) return;
const I = DH.icon, esc = DH.esc;
const S = DB.get(new URLSearchParams(location.search).get('id'));
if (!S) { location.replace('dashboard.html'); return; }
const T = DB.TYPES[S.type];
const base = 'server.html?id=' + S.id;
const MAX_FILE = 1.5 * 1048576;
const TEXT_EXT = /\.(txt|pwn|inc|p|json|js|mjs|cjs|ts|cfg|conf|properties|md|html?|css|xml|ya?ml|lua|ini|env|log|sh|sql|py|php|toml|csv)$|\.env$|^[^.]+$/i;

const SECTIONS = [
  ['consola', 'Consola', 'terminal'], ['archivos', 'Archivos', 'folder'], ['bases-de-datos', 'Bases de datos', 'database'],
  ['tareas', 'Tareas programadas', 'clock'], ['usuarios', 'Usuarios', 'users'], ['copias', 'Copias de seguridad', 'archive'],
  ['red', 'Red', 'globe'], ['inicio', 'Inicio', 'play'], ['configuracion', 'Configuración', 'sliders'], ['actividad', 'Actividad', 'activity']
];
const NAV = [{key: 'back', label: 'Volver a servidores', icon: 'back', href: 'dashboard.html'}, '-']
  .concat(SECTIONS.map(s => ({key: s[0], label: s[1], icon: s[2], href: base + '#' + s[0]})));

let files = DB.loadFiles(S.id);
let cwd = '';
function save() { return DB.save(); }
function saveFiles() { return DB.saveFiles(S.id, files); }
function log(ev, desc) { DB.log(S, ev, desc); }

/* ================= Simulación de proceso ================= */
const N = 40, hist = {cpu: [], mem: [], rx: [], tx: []};
const sim = {cpu: 0, mem: 0, rx: 0, tx: 0, players: 0};
function resetSim(on) {
  sim.cpu = on ? 8 + Math.random() * 10 : 0; sim.mem = on ? S.ramMb * (0.22 + Math.random() * 0.1) : 0;
  sim.players = on && S.slots ? Math.floor(Math.random() * Math.min(12, S.slots)) : 0;
}
resetSim(S.status === 'online');
for (let i = 0; i < N; i++) { hist.cpu.push(sim.cpu); hist.mem.push(sim.mem); hist.rx.push(0); hist.tx.push(0); }

function ts() { return '[' + new Date().toTimeString().slice(0, 8) + ']'; }
function pushLog(cls, text) {
  S.console.push([cls, text]); if (S.console.length > 300) S.console.splice(0, S.console.length - 300);
  const out = document.getElementById('out');
  if (out) { out.insertAdjacentHTML('beforeend', lineHTML([cls, text])); out.scrollTop = out.scrollHeight; }
}
function lineHTML(l) {
  if (l[0] === 'd') return '<div><span class="d">[DrokHost Daemon]:</span> ' + esc(l[1]) + '</div>';
  if (l[0] === 'c') return '<div><span class="c">container@drokhost~</span> ' + esc(l[1].replace(/^container@drokhost~ /, '')) + '</div>';
  return '<div' + (l[0] ? ' class="' + l[0] + '"' : '') + '>' + esc(l[1]) + '</div>';
}

let bootTimer = null;
function setStatus(st) { S.status = st; save(); updatePower(); }
function startServer() {
  if (S.status !== 'offline') return;
  setStatus('starting'); log('server:power.start', 'Encendió el servidor');
  const lines = [['c', 'Server marked as starting...'], ['d', 'Checking server disk space usage, this could take a few seconds...'],
    ['d', 'Updating process configuration files...'], ['d', 'Ensuring file permissions are set correctly, this could take a few seconds...'],
    ['c', DB.fill(S.startup, S).replace(/\{\{(\w+)\}\}/g, (m, k) => S.vars[k] ?? m)]]
    .concat(T.boot.map((l, i) => ['' + (i === T.boot.length - 1 ? 'ok' : ''), ts() + ' ' + DB.fill(l, S)]))
    .concat([['c', 'Server marked as running...']]);
  let i = 0; clearInterval(bootTimer);
  bootTimer = setInterval(() => {
    pushLog(lines[i][0], lines[i][1]); i++;
    if (i >= lines.length) { clearInterval(bootTimer); S.startedAt = Date.now(); resetSim(true); setStatus('online'); }
    else save();
  }, 160);
}
function stopServer(cb) {
  if (S.status === 'offline') { if (cb) cb(); return; }
  clearInterval(bootTimer); setStatus('stopping'); log('server:power.stop', 'Detuvo el servidor');
  pushLog('c', 'Server marked as stopping...');
  if (sim.players) pushLog('mu', ts() + ' Desconectando ' + sim.players + ' jugador(es)...');
  setTimeout(() => {
    pushLog('c', 'Server marked as offline...'); S.startedAt = 0; resetSim(false); setStatus('offline'); if (cb) cb();
  }, 800);
}
function restartServer() { log('server:power.restart', 'Reinició el servidor'); stopServer(startServer); }

function command(raw) {
  const v = raw.trim(); if (!v) return;
  pushLog('c', v);
  if (S.status !== 'online') { pushLog('er', 'El servidor no está encendido; el comando no se envió.'); save(); return; }
  log('server:console.command', 'Ejecutó «' + v.slice(0, 80) + '»');
  const parts = v.split(/\s+/), c = parts[0].toLowerCase().replace(/^\//, ''), arg = parts.slice(1).join(' ');
  const mc = S.type === 'minecraft', bot = S.type === 'bot';
  const say = t => pushLog('', ts() + ' ' + t);
  switch (c) {
    case 'help': case 'ayuda': case '?':
      say('Comandos: help, status, players' + (mc ? '/list, op <jugador>, time set <day|night>' : '') + ', say <texto>, version, clear, restart' + (S.type === 'samp' ? ' /gmx' : '') + ', stop' + (bot ? ', ping' : '')); break;
    case 'status': say('Estado: online • Tiempo activo ' + DH.fmtUptime(Math.floor((Date.now() - S.startedAt) / 1000)) + ' • CPU ' + sim.cpu.toFixed(1) + '% • RAM ' + DH.fmtMem(sim.mem) + ' / ' + DH.fmtMem(S.ramMb)); break;
    case 'players': case 'list':
      if (bot || S.type === 'web') say('Este servidor no tiene jugadores.');
      else if (mc) say('There are ' + sim.players + ' of a max of ' + S.slots + ' players online.');
      else say('Jugadores conectados: ' + sim.players + '/' + S.slots); break;
    case 'say': if (!arg) { pushLog('er', 'Uso: say <texto>'); break; } say(mc ? '[Server] ' + arg : bot ? '[BOT] Mensaje enviado: ' + arg : '[Consola]: ' + arg); break;
    case 'version': say(DB.fill(T.boot[0], S)); break;
    case 'clear': case 'cls': S.console = []; const out = document.getElementById('out'); if (out) out.innerHTML = ''; break;
    case 'stop': case 'exit': case 'quit': stopServer(); break;
    case 'restart': case 'gmx': restartServer(); break;
    case 'ping': if (bot) { say('Pong! ' + (20 + Math.floor(Math.random() * 60)) + 'ms'); break; } /* falls through */
    case 'op': if (mc && arg) { say('Made ' + arg + ' a server operator'); break; } /* falls through */
    case 'time': if (mc && /^set (day|night)$/i.test(arg)) { say('Set the time to ' + (/day/i.test(arg) ? '1000' : '13000')); break; } /* falls through */
    default:
      if (mc) pushLog('er', ts() + ' Unknown or incomplete command, see below for error');
      else pushLog('er', ts() + ' Comando desconocido: «' + c + '». Escribe help.');
  }
  save();
}

/* ================= Vistas ================= */
const statCard = (ic, k, v, id) => '<div class="card stat"><div class="si">' + I(ic) + '</div><div><div class="k">' + k + '</div><div class="v" id="' + id + '">' + v + '</div></div></div>';
const chartCard = (id, title) => '<div class="card chart"><div class="h"><b>' + title + '</b><span id="' + id + 'Val"></span></div><canvas id="' + id + '" height="150"></canvas></div>';
const iconBtn = (act, ic, label, extra) => '<button class="ib' + (act === 'del' ? ' del' : '') + '" data-a="' + act + '" ' + (extra || '') + ' title="' + label + '" aria-label="' + label + '">' + I(ic) + '</button>';
const empty = t => '<tr><td colspan="9" class="empty">' + t + '</td></tr>';

function consoleView() {
  return '<div class="console-wrap"><div class="console"><div class="out mono" id="out"></div>' +
    '<div class="in mono"><span>$</span><input id="cmd" placeholder="Escribe un comando... (help)" autocomplete="off"></div></div>' +
    '<div class="stats">' + statCard('globe', 'Dirección', '<span class="mono">' + S.ip + ':' + S.port + '</span>', 'stAddr') +
    statCard('clock', 'Tiempo activo', '', 'stUp') + statCard('cpu', 'Uso de CPU', '', 'stCpu') + statCard('memory', 'Memoria', '', 'stMem') +
    statCard('disk', 'Disco', '', 'stDisk') + statCard('down', 'Red (entrada)', '', 'stRx') + statCard('up', 'Red (salida)', '', 'stTx') +
    '</div></div><div class="charts">' + chartCard('cCpu', 'Uso de CPU') + chartCard('cMem', 'Memoria') + chartCard('cNet', 'Red') + '</div>';
}

/* ---------- Archivos ---------- */
const join = (d, n) => d ? d + '/' + n : n;
const parentOf = p => p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '';
const baseName = p => p.slice(p.lastIndexOf('/') + 1);
const validName = n => n && !/[\/\\]/.test(n) && n !== '.' && n !== '..';
function children(dir) {
  return Object.keys(files).filter(p => parentOf(p) === dir && p !== dir)
    .sort((a, b) => (files[b].d ? 1 : 0) - (files[a].d ? 1 : 0) || a.localeCompare(b));
}
function dirSize(p) { let n = 0; Object.keys(files).forEach(k => { if (k === p || k.startsWith(p + '/')) n += files[k].s || 0; }); return n; }
function filesView() {
  if (cwd && !(files[cwd] && files[cwd].d)) cwd = '';
  const crumbs = ['<a href="#" data-cd="">/home/container</a>'];
  let acc = ''; cwd.split('/').filter(Boolean).forEach(p => { acc = join(acc, p); crumbs.push('<a href="#" data-cd="' + acc + '">' + esc(p) + '</a>'); });
  const rows = children(cwd).map(p => {
    const f = files[p], n = baseName(p);
    return '<tr data-p="' + esc(p) + '"><td><div class="row clickable" data-a="open">' + I(f.d ? 'folder' : 'file') + '<span class="mono">' + esc(n) + '</span></div></td>' +
      '<td>' + (f.d ? DH.fmtBytes(dirSize(p)) : DH.fmtBytes(f.s || 0)) + '</td><td>' + DH.ago(f.m || Date.now()) + '</td><td><div class="acts">' +
      (f.d ? '' : iconBtn('edit', 'edit', 'Editar') + iconBtn('dl', 'down', 'Descargar')) +
      iconBtn('ren', 'sliders', 'Renombrar') + iconBtn('del', 'trash', 'Eliminar') + '</div></td></tr>';
  }).join('');
  return '<div class="card"><div class="toolbar"><div class="crumb mono">' + crumbs.join(' / ') + '</div><div class="btns">' +
    '<button class="btn sm" id="fDir">' + I('folder') + 'Crear carpeta</button>' +
    '<label class="btn sm" style="cursor:pointer">' + I('up') + 'Subir<input type="file" id="fUp" multiple hidden></label>' +
    '<button class="btn sm gold" id="fNew">' + I('plus') + 'Nuevo archivo</button></div></div>' +
    '<table class="table"><tr><th>Nombre</th><th>Tamaño</th><th>Modificado</th><th></th></tr>' +
    (cwd ? '<tr><td colspan="4"><div class="row clickable" data-up="1">' + I('back') + '<span class="mono">..</span></div></td></tr>' : '') +
    (rows || empty('Carpeta vacía. Sube archivos o crea uno nuevo.')) + '</table>' +
    '<p class="hint" style="margin-top:10px">Máximo ' + DH.fmtBytes(MAX_FILE) + ' por archivo (se guarda en este navegador). Disco usado: ' + DH.fmtBytes(dirSizeAll()) + ' / ' + DH.fmtMem(S.diskMb) + '</p></div>';
}
function dirSizeAll() { let n = 0; Object.values(files).forEach(f => { n += f.s || 0; }); return n; }
function persistFiles(undo, ok) { if (saveFiles()) { if (ok) DH.toast(ok); save(); route(); return true; } files = undo; route(); return false; }
function snapshot() { return JSON.parse(JSON.stringify(files)); }

function editFile(p, isNew) {
  const f = files[p] || {c: ''};
  if (f.b) {
    DH.modal({title: baseName(p), submit: false, body: '<p>Archivo binario (' + DH.fmtBytes(f.s) + '). No se puede editar como texto.</p><button type="button" class="btn gold" id="dlb">' + I('down') + 'Descargar</button>'});
    document.getElementById('dlb').onclick = () => downloadFile(p); return;
  }
  DH.modal({title: isNew ? 'Nuevo archivo' : 'Editando: /' + p, wide: true, submit: isNew ? 'Crear archivo' : 'Guardar',
    body: (isNew ? '<div class="field"><label>Nombre del archivo</label><input class="input mono" name="fname" placeholder="archivo.txt"></div>' : '') +
    '<textarea class="editor" name="content" spellcheck="false">' + esc(f.c || '') + '</textarea>',
    onSubmit(form) {
      let path = p;
      if (isNew) {
        const n = form.fname.value.trim(); if (!validName(n)) return 'Nombre no válido.';
        path = join(cwd, n); if (files[path]) return 'Ya existe un archivo con ese nombre.';
      }
      const c = form.content.value, undo = snapshot();
      files[path] = {c, s: new Blob([c]).size, m: Date.now()};
      log(isNew ? 'server:file.create' : 'server:file.write', (isNew ? 'Creó ' : 'Editó ') + '/' + path);
      if (!persistFiles(undo, isNew ? 'Archivo creado.' : 'Archivo guardado.')) return 'No hay espacio suficiente en el navegador.';
    }});
  const ta = document.querySelector('.editor');
  ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } });
  if (!isNew) ta.focus();
}
function downloadFile(p) {
  const f = files[p]; if (!f) return;
  if (f.b) fetch(f.c).then(r => r.blob()).then(b => DH.download(baseName(p), b)); else DH.download(baseName(p), f.c);
}
function renameFile(p) {
  DH.modal({title: 'Renombrar', submit: 'Renombrar', body: '<div class="field"><label>Nuevo nombre</label><input class="input mono" name="n" value="' + esc(baseName(p)) + '"></div>',
    onSubmit(form) {
      const n = form.n.value.trim(); if (!validName(n)) return 'Nombre no válido.';
      const np = join(parentOf(p), n); if (np === p) return; if (files[np]) return 'Ya existe un elemento con ese nombre.';
      const undo = snapshot(), out = {};
      Object.keys(files).forEach(k => { if (k === p) out[np] = files[k]; else if (k.startsWith(p + '/')) out[np + k.slice(p.length)] = files[k]; else out[k] = files[k]; });
      out[np].m = Date.now(); files = out;
      log('server:file.rename', 'Renombró /' + p + ' a /' + np); persistFiles(undo, 'Renombrado.');
    }});
}
function deleteFile(p) {
  DH.confirmar('¿Eliminar <b class="mono">/' + esc(p) + '</b>' + (files[p].d ? ' y todo su contenido' : '') + '? No se puede deshacer.', () => {
    const undo = snapshot();
    Object.keys(files).forEach(k => { if (k === p || k.startsWith(p + '/')) delete files[k]; });
    log('server:file.delete', 'Eliminó /' + p); persistFiles(undo, 'Eliminado.');
  });
}
function uploadFiles(list) {
  const arr = Array.from(list); if (!arr.length) return;
  let pending = arr.length, done = 0; const undo = snapshot();
  arr.forEach(file => {
    if (file.size > MAX_FILE) { DH.toast('«' + file.name + '» supera ' + DH.fmtBytes(MAX_FILE) + '.'); if (--pending === 0) finish(); return; }
    const r = new FileReader(), text = TEXT_EXT.test(file.name) && file.size < 600000 && !/^(image|audio|video)\//.test(file.type);
    r.onload = () => {
      files[join(cwd, file.name)] = text ? {c: r.result, s: file.size, m: Date.now()} : {c: r.result, b: 1, s: file.size, m: Date.now()};
      done++; if (--pending === 0) finish();
    };
    r.onerror = () => { if (--pending === 0) finish(); };
    text ? r.readAsText(file) : r.readAsDataURL(file);
  });
  function finish() { if (!done) return; log('server:file.upload', 'Subió ' + done + ' archivo(s) a /' + cwd); persistFiles(undo, done + ' archivo(s) subido(s).'); }
}
function bindFiles(c) {
  c.querySelectorAll('[data-cd]').forEach(a => a.onclick = e => { e.preventDefault(); cwd = a.dataset.cd; route(); });
  const up = c.querySelector('[data-up]'); if (up) up.onclick = () => { cwd = parentOf(cwd); route(); };
  c.querySelectorAll('tr[data-p]').forEach(tr => {
    const p = tr.dataset.p;
    tr.querySelectorAll('[data-a]').forEach(b => b.onclick = e => {
      e.preventDefault(); const a = b.dataset.a;
      if (a === 'open') { if (files[p].d) { cwd = p; route(); } else editFile(p); }
      else if (a === 'edit') editFile(p); else if (a === 'dl') downloadFile(p); else if (a === 'ren') renameFile(p); else if (a === 'del') deleteFile(p);
    });
  });
  c.querySelector('#fNew').onclick = () => editFile(null, true);
  c.querySelector('#fUp').onchange = e => uploadFiles(e.target.files);
  c.querySelector('#fDir').onclick = () => DH.modal({title: 'Crear carpeta', submit: 'Crear', body: '<div class="field"><label>Nombre</label><input class="input mono" name="n"></div>',
    onSubmit(f) { const n = f.n.value.trim(); if (!validName(n)) return 'Nombre no válido.'; const p = join(cwd, n); if (files[p]) return 'Ya existe.';
      const undo = snapshot(); files[p] = {d: 1, m: Date.now()}; log('server:file.create-directory', 'Creó la carpeta /' + p); persistFiles(undo, 'Carpeta creada.'); }});
  const card = c.querySelector('.card');
  card.addEventListener('dragover', e => { e.preventDefault(); card.style.borderColor = 'var(--gold)'; });
  card.addEventListener('dragleave', () => { card.style.borderColor = ''; });
  card.addEventListener('drop', e => { e.preventDefault(); card.style.borderColor = ''; uploadFiles(e.dataTransfer.files); });
}

/* ---------- Listas genéricas (BD, tareas, usuarios, copias, red) ---------- */
function rnd(n) { const a = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }

function dbView() {
  const rows = S.databases.map(d => '<tr data-id="' + d.id + '"><td><div class="row">' + I('database') + '<span class="mono">' + esc(d.name) + '</span></div></td><td class="mono">db.drokhost.com:3306</td><td class="mono">' + esc(d.remote) + '</td><td class="mono">' + esc(d.user) + '</td>' +
    '<td><div class="acts">' + iconBtn('see', 'eye', 'Ver credenciales') + iconBtn('del', 'trash', 'Eliminar') + '</div></td></tr>').join('');
  return '<div class="toolbar"><div class="crumb">' + S.databases.length + ' de 3 bases de datos</div><button class="btn gold" id="add">' + I('plus') + 'Nueva base de datos</button></div>' +
    '<div class="card"><table class="table"><tr><th>Nombre</th><th>Endpoint</th><th>Conexiones desde</th><th>Usuario</th><th></th></tr>' + (rows || empty('No hay bases de datos.')) + '</table></div>';
}
function dbBind(c) {
  c.querySelector('#add').onclick = () => {
    if (S.databases.length >= 3) { DH.toast('Límite de 3 bases de datos alcanzado.'); return; }
    DH.modal({title: 'Nueva base de datos', submit: 'Crear', body: '<div class="field"><label>Nombre</label><input class="input mono" name="n" placeholder="principal"></div><div class="field"><label>Conexiones desde</label><input class="input mono" name="r" value="%"><small>% permite cualquier IP.</small></div>',
      onSubmit(f) { const n = f.n.value.trim().replace(/[^\w]/g, ''); if (!n) return 'Nombre no válido (letras, números y _).';
        const d = {id: DB.uid(), name: 's' + (DB.data.servers.indexOf(S) + 1) + '_' + n, remote: f.r.value.trim() || '%', user: 'u' + (DB.data.servers.indexOf(S) + 1) + '_' + rnd(8), pass: rnd(20), t: Date.now()};
        if (S.databases.some(x => x.name === d.name)) return 'Ya existe.';
        S.databases.push(d); log('server:database.create', 'Creó la base de datos ' + d.name); save(); route(); DH.toast('Base de datos creada.'); } });
  };
  rowActs(c, S.databases, {
    see: d => DH.modal({title: 'Credenciales: ' + d.name, submit: false, body: '<div class="field"><label>Host</label><input class="input mono" readonly value="db.drokhost.com:3306"></div><div class="field"><label>Usuario</label><input class="input mono" readonly value="' + esc(d.user) + '"></div><div class="field"><label>Contraseña</label><input class="input mono" readonly value="' + esc(d.pass) + '"></div><div class="field"><label>JDBC</label><input class="input mono" readonly value="jdbc:mysql://' + esc(d.user) + ':' + esc(d.pass) + '@db.drokhost.com:3306/' + esc(d.name) + '"></div>'}),
    del: d => DH.confirmar('¿Eliminar la base de datos <b>' + esc(d.name) + '</b>?', () => { S.databases = S.databases.filter(x => x !== d); log('server:database.delete', 'Eliminó la base de datos ' + d.name); save(); route(); })
  });
}
function rowActs(c, list, handlers) {
  c.querySelectorAll('tr[data-id]').forEach(tr => {
    const item = list.find(x => x.id === tr.dataset.id);
    tr.querySelectorAll('[data-a]').forEach(b => b.onclick = () => handlers[b.dataset.a] && handlers[b.dataset.a](item));
  });
}

const ACTIONS = {command: 'Enviar comando', start: 'Encender', stop: 'Detener', restart: 'Reiniciar', backup: 'Crear copia'};
const cronOk = e => /^(\S+\s+){4}\S+$/.test(e.trim()) && e.trim().split(/\s+/).every(p => /^(\*|\d+|\*\/\d+|\d+-\d+(,(\*|\d+|\*\/\d+|\d+-\d+))*)$/.test(p));
function cronMatch(expr, d) {
  const f = expr.trim().split(/\s+/), v = [d.getMinutes(), d.getHours(), d.getDate(), d.getMonth() + 1, d.getDay()];
  return f.every((p, i) => p.split(',').some(x => { if (x === '*') return true; let m = x.match(/^\*\/(\d+)$/); if (m) return v[i] % +m[1] === 0;
    m = x.match(/^(\d+)-(\d+)$/); if (m) return v[i] >= +m[1] && v[i] <= +m[2]; return +x === v[i]; }));
}
function runTask(t, manual) {
  t.last = Date.now(); log('server:schedule.execute', (manual ? 'Ejecutó manualmente' : 'Se ejecutó') + ' la tarea «' + t.name + '»');
  if (t.action === 'command') command(t.payload || 'help');
  else if (t.action === 'start') startServer(); else if (t.action === 'stop') stopServer(); else if (t.action === 'restart') restartServer();
  else if (t.action === 'backup') makeBackup('Tarea: ' + t.name);
  save();
}
function tasksView() {
  const rows = S.schedules.map(t => '<tr data-id="' + t.id + '"><td><div class="row">' + I('clock') + esc(t.name) + '</div></td><td class="mono">' + esc(t.cron) + '</td><td>' + ACTIONS[t.action] + (t.payload ? ' <span class="tag mono">' + esc(t.payload) + '</span>' : '') + '</td>' +
    '<td>' + (t.last ? DH.ago(t.last) : 'Nunca') + '</td><td><span class="tag ' + (t.on ? 'green' : '') + '">' + (t.on ? 'Activa' : 'Inactiva') + '</span></td><td><div class="acts">' +
    iconBtn('run', 'play', 'Ejecutar ahora') + iconBtn('tog', 'refresh', t.on ? 'Desactivar' : 'Activar') + iconBtn('del', 'trash', 'Eliminar') + '</div></td></tr>').join('');
  return '<div class="toolbar"><div class="crumb">Las tareas se ejecutan mientras el panel esté abierto en el navegador.</div><button class="btn gold" id="add">' + I('plus') + 'Crear tarea</button></div>' +
    '<div class="card"><table class="table"><tr><th>Nombre</th><th>Cron</th><th>Acción</th><th>Última</th><th>Estado</th><th></th></tr>' + (rows || empty('No hay tareas programadas.')) + '</table></div>';
}
function tasksBind(c) {
  c.querySelector('#add').onclick = () => DH.modal({title: 'Crear tarea', submit: 'Crear tarea',
    body: '<div class="field"><label>Nombre</label><input class="input" name="n" placeholder="Reinicio diario"></div>' +
    '<div class="field"><label>Cron (min hora día mes díaSemana)</label><input class="input mono" name="c" value="0 6 * * *"><small>Ej.: */30 * * * * = cada 30 minutos.</small></div>' +
    '<div class="field"><label>Acción</label><select class="input" name="a">' + Object.keys(ACTIONS).map(k => '<option value="' + k + '">' + ACTIONS[k] + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>Comando (si la acción es «Enviar comando»)</label><input class="input mono" name="p" placeholder="say Reinicio en 5 minutos"></div>',
    onSubmit(f) { const n = f.n.value.trim(); if (!n) return 'Escribe un nombre.'; if (!cronOk(f.c.value)) return 'Expresión cron no válida.';
      if (f.a.value === 'command' && !f.p.value.trim()) return 'Escribe el comando.';
      S.schedules.push({id: DB.uid(), name: n, cron: f.c.value.trim().replace(/\s+/g, ' '), action: f.a.value, payload: f.a.value === 'command' ? f.p.value.trim() : '', on: true, last: 0 });
      log('server:schedule.create', 'Creó la tarea «' + n + '»'); save(); route(); DH.toast('Tarea creada.'); }});
  rowActs(c, S.schedules, {
    run: t => { runTask(t, true); DH.toast('Tarea ejecutada.'); route(); },
    tog: t => { t.on = !t.on; log('server:schedule.update', (t.on ? 'Activó' : 'Desactivó') + ' la tarea «' + t.name + '»'); save(); route(); },
    del: t => DH.confirmar('¿Eliminar la tarea <b>' + esc(t.name) + '</b>?', () => { S.schedules = S.schedules.filter(x => x !== t); log('server:schedule.delete', 'Eliminó la tarea «' + t.name + '»'); save(); route(); })
  });
}

const PERMS = {'control.console': 'Consola', 'control.start': 'Encender', 'control.stop': 'Detener', 'control.restart': 'Reiniciar', 'file.read': 'Ver archivos', 'file.update': 'Editar archivos',
  'database.read': 'Bases de datos', 'schedule.read': 'Tareas', 'backup.read': 'Copias', 'startup.read': 'Inicio'};
function usersView() {
  const rows = S.subusers.map(u => '<tr data-id="' + u.id + '"><td><div class="row">' + I('user') + esc(u.email) + '</div></td><td>' + u.perms.length + ' permisos</td><td>' + DH.ago(u.t) + '</td><td><div class="acts">' + iconBtn('edit', 'edit', 'Editar permisos') + iconBtn('del', 'trash', 'Eliminar') + '</div></td></tr>').join('');
  return '<div class="toolbar"><div class="crumb">Subusuarios con acceso a este servidor</div><button class="btn gold" id="add">' + I('plus') + 'Invitar usuario</button></div>' +
    '<div class="card"><table class="table"><tr><th>Correo</th><th>Permisos</th><th>Añadido</th><th></th></tr>' + (rows || empty('No hay subusuarios.')) + '</table></div>';
}
function userModal(u) {
  DH.modal({title: u ? 'Permisos de ' + u.email : 'Nuevo usuario', submit: u ? 'Guardar' : 'Invitar',
    body: (u ? '' : '<div class="field"><label>Correo</label><input class="input" name="e" type="email" placeholder="staff@correo.com"></div>') +
    '<div class="field"><label>Permisos</label><div class="checks">' + Object.keys(PERMS).map(k => '<label><input type="checkbox" name="p" value="' + k + '"' + (u && u.perms.includes(k) ? ' checked' : '') + '> ' + PERMS[k] + '</label>').join('') + '</div></div>',
    onSubmit(f) {
      const perms = Array.from(f.querySelectorAll('[name=p]:checked')).map(x => x.value); if (!perms.length) return 'Elige al menos un permiso.';
      if (u) { u.perms = perms; log('server:subuser.update', 'Actualizó permisos de ' + u.email); }
      else { const e = f.e.value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return 'Correo no válido.'; if (S.subusers.some(x => x.email === e)) return 'Ese usuario ya existe.';
        S.subusers.push({id: DB.uid(), email: e, perms, t: Date.now()}); log('server:subuser.create', 'Añadió a ' + e); }
      save(); route(); DH.toast('Guardado.');
    }});
}
function usersBind(c) {
  c.querySelector('#add').onclick = () => userModal(null);
  rowActs(c, S.subusers, {edit: userModal, del: u => DH.confirmar('¿Quitar el acceso de <b>' + esc(u.email) + '</b>?', () => { S.subusers = S.subusers.filter(x => x !== u); log('server:subuser.delete', 'Eliminó a ' + u.email); save(); route(); })});
}

const MAX_BK = 5;
function makeBackup(name) {
  if (S.backups.length >= MAX_BK) { DH.toast('Límite de ' + MAX_BK + ' copias alcanzado.'); return false; }
  const b = {id: DB.uid(), name: name || 'Copia ' + new Date().toLocaleString('es'), t: Date.now(), size: dirSizeAll(), count: Object.keys(files).length};
  if (!DB.saveBackup(b.id, files)) return false;
  S.backups.push(b); log('server:backup.complete', 'Creó la copia «' + b.name + '»'); save(); return true;
}
function backupsView() {
  const rows = S.backups.slice().reverse().map(b => '<tr data-id="' + b.id + '"><td><div class="row">' + I('archive') + esc(b.name) + '</div></td><td>' + DH.fmtBytes(b.size) + ' • ' + b.count + ' elementos</td><td>' + DH.ago(b.t) + '</td><td><div class="acts">' +
    iconBtn('res', 'refresh', 'Restaurar') + iconBtn('dl', 'down', 'Descargar') + iconBtn('del', 'trash', 'Eliminar') + '</div></td></tr>').join('');
  return '<div class="toolbar"><div class="crumb">' + S.backups.length + ' de ' + MAX_BK + ' copias usadas</div><button class="btn gold" id="add">' + I('plus') + 'Crear copia</button></div>' +
    '<div class="card"><table class="table"><tr><th>Nombre</th><th>Tamaño</th><th>Creada</th><th></th></tr>' + (rows || empty('No hay copias de seguridad.')) + '</table></div>';
}
function backupsBind(c) {
  c.querySelector('#add').onclick = () => DH.modal({title: 'Crear copia de seguridad', submit: 'Crear copia', body: '<div class="field"><label>Nombre</label><input class="input" name="n" placeholder="Antes de actualizar"></div><p>Se copian todos los archivos del servidor.</p>',
    onSubmit(f) { if (makeBackup(f.n.value.trim())) { DH.toast('Copia creada.'); route(); } else return 'No se pudo crear la copia (límite o espacio del navegador).'; } });
  rowActs(c, S.backups, {
    res: b => DH.confirmar('¿Restaurar <b>' + esc(b.name) + '</b>? Los archivos actuales se reemplazarán.', () => {
      const f = DB.loadBackup(b.id); if (!f) { DH.toast('Copia dañada o no encontrada.'); return; }
      files = f; saveFiles(); log('server:backup.restore', 'Restauró la copia «' + b.name + '»'); save(); DH.toast('Copia restaurada.'); route(); }, 'Restaurar'),
    dl: b => DH.download(b.name.replace(/[^\w.-]+/g, '_') + '.json', JSON.stringify(DB.loadBackup(b.id) || {}), 'application/json'),
    del: b => DH.confirmar('¿Eliminar la copia <b>' + esc(b.name) + '</b>?', () => { DB.delBackup(b.id); S.backups = S.backups.filter(x => x !== b); log('server:backup.delete', 'Eliminó la copia «' + b.name + '»'); save(); route(); })
  });
}

function networkView() {
  const rows = S.allocations.map(a => '<tr data-id="' + a.id + '"><td><div class="row">' + I('globe') + '<span class="mono">' + esc(a.ip) + '</span></div></td><td class="mono">' + a.port + '</td><td>' + esc(a.notes || '—') + '</td><td><div class="acts">' +
    (a.primary ? '<span class="tag gold">Primaria</span>' : iconBtn('pri', 'star', 'Hacer primaria')) + iconBtn('note', 'edit', 'Editar nota') + (a.primary ? '' : iconBtn('del', 'trash', 'Eliminar')) + '</div></td></tr>').join('');
  return '<div class="toolbar"><div class="crumb">' + S.allocations.length + ' de 5 asignaciones</div><button class="btn gold" id="add">' + I('plus') + 'Crear asignación</button></div>' +
    '<div class="card"><table class="table"><tr><th>Dirección</th><th>Puerto</th><th>Notas</th><th></th></tr>' + rows + '</table></div>';
}
function networkBind(c) {
  c.querySelector('#add').onclick = () => {
    if (S.allocations.length >= 5) { DH.toast('Límite de 5 asignaciones.'); return; }
    const used = new Set(); DB.data.servers.forEach(s => s.allocations.forEach(a => used.add(a.port)));
    let p = S.port + 1; while (used.has(p)) p++;
    S.allocations.push({id: DB.uid(), ip: S.ip, port: p, notes: '', primary: false}); log('server:allocation.create', 'Añadió el puerto ' + p); save(); route(); DH.toast('Puerto ' + p + ' asignado.');
  };
  rowActs(c, S.allocations, {
    pri: a => { S.allocations.forEach(x => { x.primary = x === a; }); S.port = a.port; log('server:allocation.primary', 'Puerto principal: ' + a.port); save(); route(); },
    note: a => DH.modal({title: 'Nota del puerto ' + a.port, body: '<div class="field"><label>Nota</label><input class="input" name="n" maxlength="60" value="' + esc(a.notes) + '"></div>', onSubmit(f) { a.notes = f.n.value.trim(); save(); route(); } }),
    del: a => DH.confirmar('¿Eliminar el puerto ' + a.port + '?', () => { S.allocations = S.allocations.filter(x => x !== a); log('server:allocation.delete', 'Eliminó el puerto ' + a.port); save(); route(); })
  });
}

function startupView() {
  const imgs = [S.image].concat(['ghcr.io/parkervcp/games:samp', 'ghcr.io/parkervcp/games:mta', 'ghcr.io/pterodactyl/yolks:java_21', 'ghcr.io/parkervcp/yolks:nodejs_22', 'ghcr.io/parkervcp/yolks:nodejs_20'].filter(x => x !== S.image));
  return '<form id="stForm"><div class="card" style="margin-bottom:16px"><h3>' + I('play') + 'COMANDO DE INICIO</h3><textarea class="input mono startup-cmd" name="cmd" rows="2">' + esc(S.startup) + '</textarea>' +
    '<p class="hint" style="margin-top:8px">Puedes usar variables como {{' + T.vars.map(v => v[1]).join('}}, {{') + '}}</p></div>' +
    '<div class="two" style="margin-bottom:16px"><div class="card"><h3>' + I('server') + 'Imagen Docker</h3><select class="input mono" name="img">' + imgs.map(x => '<option>' + esc(x) + '</option>').join('') + '</select></div>' +
    '<div class="card"><h3>' + I('cpu') + 'Tipo</h3><div class="v">' + T.label + '</div><p class="hint" style="margin-top:6px">' + DH.fmtMem(S.ramMb) + ' RAM • ' + DH.fmtMem(S.diskMb) + ' disco • ' + S.slots + ' slots</p></div></div>' +
    '<div class="section-title">Variables</div><div class="two">' + T.vars.map(v => '<div class="card"><div class="field"><label>' + v[0] + '</label><input class="input" name="v_' + v[1] + '" value="' + esc(S.vars[v[1]] ?? '') + '"></div><span class="tag mono">{{' + v[1] + '}}</span></div>').join('') +
    '</div><div style="margin-top:16px"><button class="btn gold">Guardar cambios</button></div></form>';
}
function startupBind(c) {
  const f = c.querySelector('#stForm');
  f.onsubmit = e => { e.preventDefault(); const cmd = f.cmd.value.trim(); if (!cmd) { DH.toast('El comando de inicio no puede estar vacío.'); return; }
    S.startup = cmd; S.image = f.img.value; T.vars.forEach(v => { S.vars[v[1]] = f['v_' + v[1]].value; });
    log('server:startup.edit', 'Actualizó el inicio y las variables'); save(); DH.toast('Inicio guardado. Se aplicará al próximo encendido.'); };
}

function settingsView() {
  return '<div class="two"><form class="card" id="detForm"><h3>' + I('sliders') + 'Detalles del servidor</h3>' +
    '<div class="field"><label>Nombre del servidor</label><input class="input" name="n" maxlength="60" value="' + esc(S.name) + '"></div>' +
    '<div class="field"><label>Descripción</label><textarea class="input" name="d" rows="3" maxlength="120">' + esc(S.desc) + '</textarea></div><button class="btn gold">Guardar</button></form>' +
    '<div class="card"><h3>' + I('lock') + 'Detalles SFTP</h3><div class="field"><label>Dirección</label><input class="input mono" readonly value="sftp://' + S.ip + ':2022"></div>' +
    '<div class="field"><label>Usuario</label><input class="input mono" readonly value="' + esc(DB.data.admin.user) + '.' + S.id + '"></div><p class="hint">SFTP real disponible al instalar Pterodactyl en el nodo.</p></div>' +
    '<div class="card"><h3>' + I('refresh') + 'Reinstalar servidor</h3><p class="hint" style="margin-bottom:14px">Detiene el servidor y restaura los archivos de la plantilla. Se borran tus archivos actuales.</p><button class="btn red" id="reins">Reinstalar</button></div>' +
    '<div class="card"><h3>' + I('trash') + 'Eliminar servidor</h3><p class="hint" style="margin-bottom:14px">Borra el servidor, sus archivos y copias. No se puede deshacer.</p><button class="btn red" id="delSrv">Eliminar servidor</button></div></div>';
}
function settingsBind(c) {
  const f = c.querySelector('#detForm');
  f.onsubmit = e => { e.preventDefault(); const n = f.n.value.trim(); if (!n) { DH.toast('El nombre no puede estar vacío.'); return; }
    const old = S.name; S.name = n; S.desc = f.d.value.trim(); log('server:settings.rename', old === n ? 'Actualizó la descripción' : 'Renombró «' + old + '» a «' + n + '»'); save(); DH.toast('Guardado.'); route(); };
  c.querySelector('#reins').onclick = () => DH.confirmar('Se borrarán los archivos actuales y se restaurará la plantilla de ' + T.label + '.', () => {
    stopServer(() => { files = DB.templateFiles(S); saveFiles(); pushLog('d', 'Servidor reinstalado.'); log('server:reinstall', 'Reinstaló el servidor'); save(); DH.toast('Servidor reinstalado.'); route(); });
  }, 'Reinstalar');
  c.querySelector('#delSrv').onclick = () => DH.modal({title: 'Eliminar servidor', submit: 'Eliminar', danger: true,
    body: '<p>Escribe <b>' + esc(S.name) + '</b> para confirmar.</p><input class="input" name="n">',
    onSubmit(fm) { if (fm.n.value.trim() !== S.name) return 'El nombre no coincide.'; clearInterval(bootTimer); DB.remove(S.id); location.replace('dashboard.html'); } });
}

function activityView() {
  const rows = DB.data.activity.filter(a => a.srv === S.id).slice(0, 100);
  return '<div class="card"><h3>' + I('activity') + 'Actividad del servidor</h3>' + (rows.length ? '<ul class="activity">' + rows.map(r => '<li><div class="dot">' + I('activity') + '</div><div><div><span class="tag gold mono">' + esc(r.ev) + '</span> ' + esc(r.desc) +
    '</div><div class="when">' + esc(r.user) + ' • ' + DH.ago(r.t) + ' • ' + new Date(r.t).toLocaleString('es') + '</div></div></li>').join('') + '</ul>' : '<div class="empty">Sin actividad todavía.</div>') + '</div>';
}

const VIEWS = {consola: [consoleView], archivos: [filesView, bindFiles], 'bases-de-datos': [dbView, dbBind], tareas: [tasksView, tasksBind], usuarios: [usersView, usersBind],
  copias: [backupsView, backupsBind], red: [networkView, networkBind], inicio: [startupView, startupBind], configuracion: [settingsView, settingsBind], actividad: [activityView] };

/* ================= Cabecera, gráficos y router ================= */
function headHTML(label) {
  return '<div class="srv-head"><div class="t"><h2>' + esc(S.name) + '</h2><span class="status ' + S.status + '" id="stBadge"></span><span class="tag">' + label + '</span></div>' +
    '<div class="power"><button class="btn green" id="bStart">' + I('play') + 'Encender</button><button class="btn gray" id="bRestart">' + I('refresh') + 'Reiniciar</button>' +
    '<button class="btn red" id="bStop">' + I('stop') + 'Detener</button></div></div>';
}
const STATUS_TXT = {online: 'Online', offline: 'Offline', starting: 'Iniciando', stopping: 'Deteniendo'};
function updatePower() {
  const b = document.getElementById('stBadge');
  if (b) { b.className = 'status ' + (S.status === 'stopping' ? 'starting' : S.status); b.textContent = STATUS_TXT[S.status]; }
  const st = document.getElementById('bStart'); if (!st) return;
  st.disabled = S.status !== 'offline';
  document.getElementById('bRestart').disabled = S.status !== 'online';
  document.getElementById('bStop').disabled = S.status === 'offline' || S.status === 'stopping';
}

function draw(id, series, colors, max) {
  const c = document.getElementById(id); if (!c) return;
  const dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = 150;
  c.width = w * dpr; c.height = h * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, w, h);
  g.strokeStyle = '#1d2a45'; g.lineWidth = 1;
  for (let y = 0; y <= 4; y++) { const yy = 6 + (h - 12) * y / 4; g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
  series.forEach((data, k) => {
    const m = max || Math.max(...data, 1) * 1.25;
    const pts = data.map((v, i) => [i * w / (data.length - 1), h - 6 - (h - 12) * Math.max(0, v) / m]);
    const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, colors[k] + '55'); grad.addColorStop(1, colors[k] + '00');
    g.beginPath(); g.moveTo(pts[0][0], h); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(w, h); g.closePath(); g.fillStyle = grad; g.fill();
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = colors[k]; g.lineWidth = 2; g.stroke();
  });
}
const setText = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
function renderStats() {
  const on = S.status === 'online';
  setText('stUp', on ? DH.fmtUptime(Math.max(1, Math.floor((Date.now() - S.startedAt) / 1000))) : STATUS_TXT[S.status]);
  setText('stCpu', on ? sim.cpu.toFixed(2) + '% / 100%' : '—');
  setText('stMem', on ? DH.fmtMem(sim.mem) + ' / ' + DH.fmtMem(S.ramMb) : '—');
  setText('stDisk', DH.fmtBytes(dirSizeAll()) + ' / ' + DH.fmtMem(S.diskMb));
  setText('stRx', DH.fmtBytes(Math.round(sim.rx))); setText('stTx', DH.fmtBytes(Math.round(sim.tx)));
  setText('cCpuVal', sim.cpu.toFixed(1) + '%'); setText('cMemVal', DH.fmtMem(sim.mem));
  setText('cNetVal', on ? '↓ ' + hist.rx[N - 1].toFixed(0) + ' KiB/s  ↑ ' + hist.tx[N - 1].toFixed(0) + ' KiB/s' : '—');
  draw('cCpu', [hist.cpu], ['#f2c94c'], 100); draw('cMem', [hist.mem], ['#22d3ee'], S.ramMb); draw('cNet', [hist.rx, hist.tx], ['#8b5cf6', '#22d3ee']);
}

let lastMinute = new Date().getMinutes();
function tick() {
  const on = S.status === 'online';
  if (on) {
    sim.cpu = Math.max(1, Math.min(100, sim.cpu + (Math.random() - .5) * 4));
    sim.mem = Math.max(32, Math.min(S.ramMb, sim.mem + (Math.random() - .5) * S.ramMb * 0.01));
    const rx = 5 + Math.random() * 40 + sim.players * 4, tx = 10 + Math.random() * 60 + sim.players * 6;
    sim.rx += rx * 1024 * 2; sim.tx += tx * 1024 * 2; hist.rx.push(rx); hist.tx.push(tx);
  } else { sim.cpu = 0; sim.mem = 0; hist.rx.push(0); hist.tx.push(0); }
  hist.cpu.push(sim.cpu); hist.mem.push(sim.mem);
  Object.keys(hist).forEach(k => { while (hist[k].length > N) hist[k].shift(); });
  renderStats();
  const d = new Date();
  if (d.getMinutes() !== lastMinute) { lastMinute = d.getMinutes(); S.schedules.forEach(t => { if (t.on && cronMatch(t.cron, d)) runTask(t, false); }); }
}

function route() {
  let key = (location.hash || '').slice(1); if (!VIEWS[key]) key = 'consola';
  const sec = SECTIONS.find(s => s[0] === key);
  DH.renderShell({nav: NAV, active: key, title: S.name, sub: S.ip + ':' + S.port + ' • ' + T.label});
  const c = document.getElementById('content');
  c.innerHTML = headHTML(sec[1]) + VIEWS[key][0]();
  document.title = sec[1] + ' • ' + S.name + ' | DrokHost';
  updatePower();
  document.getElementById('bStart').onclick = startServer;
  document.getElementById('bStop').onclick = () => stopServer();
  document.getElementById('bRestart').onclick = restartServer;
  if (VIEWS[key][1]) VIEWS[key][1](c);
  const out = document.getElementById('out');
  if (out) {
    out.innerHTML = S.console.map(lineHTML).join(''); out.scrollTop = out.scrollHeight;
    const cmd = document.getElementById('cmd'), histCmd = []; let hi = 0;
    cmd.addEventListener('keydown', e => {
      if (e.key === 'Enter') { histCmd.push(cmd.value); hi = histCmd.length; command(cmd.value); cmd.value = ''; }
      else if (e.key === 'ArrowUp' && hi > 0) { cmd.value = histCmd[--hi]; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { hi = Math.min(histCmd.length, hi + 1); cmd.value = histCmd[hi] || ''; }
    });
    renderStats();
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('resize', renderStats);
route();
setInterval(tick, 2000);
})();
