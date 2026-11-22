/* DrokHost Panel — Demo: vista de servidor (consola + secciones) */
(function () {
  'use strict';
  var I = DH.icon, esc = DH.esc;
  var params = new URLSearchParams(location.search);
  var S = DH.getServer(params.get('id'));
  var base = 'server.html?id=' + S.id;

  var SECTIONS = [
    { key: 'consola', label: 'Consola', icon: 'terminal' },
    { key: 'archivos', label: 'Archivos', icon: 'folder' },
    { key: 'bases-de-datos', label: 'Bases de datos', icon: 'database' },
    { key: 'tareas', label: 'Tareas programadas', icon: 'clock' },
    { key: 'usuarios', label: 'Usuarios', icon: 'users' },
    { key: 'copias', label: 'Copias de seguridad', icon: 'archive' },
    { key: 'red', label: 'Red', icon: 'globe' },
    { key: 'inicio', label: 'Inicio', icon: 'play' },
    { key: 'configuracion', label: 'Configuración', icon: 'sliders' },
    { key: 'actividad', label: 'Actividad', icon: 'activity' }
  ];
  var NAV = [{ key: 'back', label: 'Volver a servidores', icon: 'back', href: 'dashboard.html' }, '-']
    .concat(SECTIONS.map(function (s) { return { key: s.key, label: s.label, icon: s.icon, href: base + '#' + s.key }; }));

  /* ---------- Estado simulado ---------- */
  var N = 40, hist = { cpu: [], mem: [], rx: [], tx: [] };
  for (var i = 0; i < N; i++) {
    var on = S.status === 'online';
    hist.cpu.push(on ? S.cpu + (Math.random() - .5) * 6 : 0);
    hist.mem.push(on ? S.mem + (Math.random() - .5) * 30 : 0);
    hist.rx.push(on ? 20 + Math.random() * 40 : 0);
    hist.tx.push(on ? 30 + Math.random() * 60 : 0);
  }
  var net = { rx: S.status === 'online' ? 184.6 : 0, tx: S.status === 'online' ? 412.3 : 0 }; // MiB
  var logs = [];

  function ts() { var d = new Date(); return '[' + d.toTimeString().slice(0, 8) + ']'; }
  function daemon(t) { return '<span class="d">[DrokHost Daemon]:</span> ' + esc(t); }
  function sys(t) { return '<span class="c">container@drokhost~</span> ' + esc(t); }
  function line(t, cls) { return cls ? '<span class="' + cls + '">' + esc(t) + '</span>' : esc(t); }

  var BOOT_SAMP = [
    sys('Server marked as starting...'),
    daemon('Checking server disk space usage, this could take a few seconds...'),
    daemon('Updating process configuration files...'),
    daemon('Ensuring file permissions are set correctly, this could take a few seconds...'),
    sys(S.startup),
    line(ts() + ' open.mp version 1.4.0.2779 (2026)', 'ok'),
    line(ts() + ' Loading plugin: mysql'),
    line(ts() + '  >> plugin.mysql: R41-4 successfully loaded.'),
    line(ts() + ' Loading plugin: streamer'),
    line(ts() + '  *** Streamer Plugin v2.9.6 by Incognito loaded ***'),
    line(ts() + ' Loading plugin: sscanf'),
    line(ts() + ' Filterscripts: 2 loaded (mapeos.amx, admin.amx)'),
    line(ts() + ' [MySQL] Conexión establecida con la base de datos s1_drokrp'),
    line(ts() + ' Number of vehicle models: 112'),
    line(ts() + ' Gamemode cargado: Drok RolePlay v2.3', 'ok'),
    sys('Server marked as running...'),
    line(ts() + ' [connection] incoming connection: 181.52.14.7:51234 id: 0'),
    line(ts() + ' [join] Carlos_Mendez has joined the server (0:181.52.14.7)'),
    line(ts() + ' [chat] [Carlos_Mendez]: buenas a todos!', 'mu')
  ];
  var BOOT_BOT = [
    sys('Server marked as starting...'),
    daemon('Updating process configuration files...'),
    sys('npm install'),
    line('up to date, audited 142 packages in 2s'),
    sys('node index.js'),
    line('[BOT] Cargando 24 comandos...'),
    line('[BOT] Conectado como Drok Bot#4821', 'ok'),
    sys('Server marked as running...')
  ];
  var boot = S.id === 'bot' ? BOOT_BOT : BOOT_SAMP;

  if (S.status === 'online') logs = boot.slice();
  else logs = [sys('Server marked as offline...'), daemon('El servidor está apagado. Pulsa Start para iniciarlo.')];

  /* ---------- Vistas ---------- */
  function statCard(ic, k, v, id) {
    return '<div class="card stat"><div class="si">' + I(ic) + '</div><div><div class="k">' + k + '</div><div class="v" id="' + id + '">' + v + '</div></div></div>';
  }
  function chartCard(id, title) {
    return '<div class="card chart"><div class="h"><b>' + title + '</b><span id="' + id + 'Val"></span></div><canvas id="' + id + '" height="150"></canvas></div>';
  }

  function consoleView() {
    return '<div class="console-wrap"><div class="console"><div class="out mono" id="out"></div>' +
      '<div class="in mono"><span>$</span><input id="cmd" placeholder="Escribe un comando..." autocomplete="off"></div></div>' +
      '<div class="stats">' +
      statCard('globe', 'Address', '<span class="mono">' + S.ip + ':' + S.port + '</span>', 'stAddr') +
      statCard('clock', 'Uptime', '', 'stUp') +
      statCard('cpu', 'CPU Load', '', 'stCpu') +
      statCard('memory', 'Memory', '', 'stMem') +
      statCard('disk', 'Disk', S.disk.toFixed(2) + ' GiB / ' + S.diskMax + ' GiB', 'stDisk') +
      statCard('down', 'Network (Inbound)', '', 'stRx') +
      statCard('up', 'Network (Outbound)', '', 'stTx') +
      '</div></div><div class="charts">' + chartCard('cCpu', 'CPU Load') + chartCard('cMem', 'Memory') + chartCard('cNet', 'Network') + '</div>';
  }

  function filesView() {
    var f = S.id === 'bot'
      ? [['folder', 'commands', '—', 'hace 2 días'], ['folder', 'node_modules', '—', 'hace 5 días'], ['file', '.env', '312 B', 'hace 5 días'],
        ['file', 'index.js', '4.8 KiB', 'hace 2 días'], ['file', 'package.json', '612 B', 'hace 5 días']]
      : [['folder', 'filterscripts', '—', 'hace 1 día'], ['folder', 'gamemodes', '—', 'hace 3 días'], ['folder', 'plugins', '—', 'hace 2 semanas'],
        ['folder', 'scriptfiles', '—', 'hace 3 días'], ['file', 'config.json', '2.1 KiB', 'hace 3 días'], ['file', 'log.txt', '86.4 KiB', 'hace 1 minuto'],
        ['file', 'omp-server', '7.9 MiB', 'hace 2 semanas']];
    return '<div class="card"><div class="toolbar"><div class="crumb mono">/home/container/</div><div style="display:flex;gap:8px">' +
      '<button class="btn sm demo-btn">Crear carpeta</button><button class="btn sm demo-btn">Subir</button><button class="btn sm gold demo-btn">Nuevo archivo</button></div></div>' +
      '<table class="table"><tr><th>Nombre</th><th>Tamaño</th><th>Modificado</th></tr>' + f.map(function (r) {
        return '<tr><td><div class="row">' + I(r[0]) + '<span class="mono">' + r[1] + '</span></div></td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>';
      }).join('') + '</table></div>';
  }

  function dbView() {
    return '<div class="toolbar"><div class="crumb">1 de 2 bases de datos asignadas</div><button class="btn gold demo-btn">' + I('plus') + 'Nueva base de datos</button></div>' +
      '<div class="card"><table class="table"><tr><th>Nombre</th><th>Endpoint</th><th>Conexiones desde</th><th>Usuario</th></tr>' +
      '<tr><td><div class="row">' + I('database') + '<span class="mono">s1_drok' + (S.id === 'bot' ? 'bot' : 'rp') + '</span></div></td><td class="mono">db.drokhost.com:3306</td><td class="mono">%</td><td class="mono">u1_x8Kd2Pq</td></tr></table></div>';
  }

  function tasksView() {
    var rows = [['Reinicio diario', '0 6 * * *', 'Cada día a las 06:00', true], ['Copia semanal', '0 4 * * 0', 'Domingos a las 04:00', true], ['Aviso de reinicio', '55 5 * * *', 'Cada día a las 05:55', false]];
    return '<div class="toolbar"><div class="crumb">Tareas programadas</div><button class="btn gold demo-btn">' + I('plus') + 'Crear tarea</button></div>' +
      '<div class="card"><table class="table"><tr><th>Nombre</th><th>Cron</th><th>Descripción</th><th>Estado</th></tr>' + rows.map(function (r) {
        return '<tr><td><div class="row">' + I('clock') + r[0] + '</div></td><td class="mono">' + r[1] + '</td><td>' + r[2] + '</td><td><span class="tag ' + (r[3] ? 'green' : '') + '">' + (r[3] ? 'Activa' : 'Inactiva') + '</span></td></tr>';
      }).join('') + '</table></div>';
  }

  function usersView() {
    return '<div class="toolbar"><div class="crumb">Subusuarios con acceso a este servidor</div><button class="btn gold demo-btn">' + I('plus') + 'Nuevo usuario</button></div>' +
      '<div class="card"><table class="table"><tr><th>Usuario</th><th>Correo</th><th>Permisos</th><th>2FA</th></tr>' +
      '<tr><td><div class="row">' + I('user') + 'staff_mod</div></td><td>mod@drokhost.com</td><td>12 permisos</td><td><span class="tag green">Sí</span></td></tr>' +
      '<tr><td><div class="row">' + I('user') + 'dev_scripter</div></td><td>dev@drokhost.com</td><td>Consola, Archivos</td><td><span class="tag">No</span></td></tr></table></div>';
  }

  function backupsView() {
    return '<div class="toolbar"><div class="crumb">2 de 3 copias usadas</div><button class="btn gold demo-btn">' + I('plus') + 'Crear copia</button></div>' +
      '<div class="card"><table class="table"><tr><th>Nombre</th><th>Tamaño</th><th>Creada</th><th>Checksum</th></tr>' +
      '<tr><td><div class="row">' + I('archive') + 'Copia automática semanal</div></td><td>412.6 MiB</td><td>hace 2 días</td><td class="mono">sha1:9f2c…e81</td></tr>' +
      '<tr><td><div class="row">' + I('archive') + 'Antes de actualizar mapeos</div></td><td>398.1 MiB</td><td>hace 9 días</td><td class="mono">sha1:41ab…07c</td></tr></table></div>';
  }

  function networkView() {
    return '<div class="toolbar"><div class="crumb">Asignaciones de red</div><button class="btn gold demo-btn">' + I('plus') + 'Crear asignación</button></div>' +
      '<div class="card"><table class="table"><tr><th>Dirección</th><th>Puerto</th><th>Notas</th><th></th></tr>' +
      '<tr><td><div class="row">' + I('globe') + '<span class="mono">' + S.ip + '</span></div></td><td class="mono">' + S.port + '</td><td>Puerto principal</td><td><span class="tag gold">Primaria</span></td></tr>' +
      '<tr><td><div class="row">' + I('globe') + '<span class="mono">' + S.ip + '</span></div></td><td class="mono">' + (S.port + 1) + '</td><td>Query / extra</td><td><button class="btn sm demo-btn">Hacer primaria</button></td></tr></table></div>';
  }

  function startupView() {
    var vars = S.id === 'bot'
      ? [['ARCHIVO PRINCIPAL', 'MAIN_FILE', 'index.js', 'El archivo que inicia el bot.'], ['VERSIÓN DE NODE', 'NODE_VERSION', '20', 'Versión de Node.js a usar.']]
      : [['PUERTO', 'SERVER_PORT', String(S.port), 'Puerto del servidor SA-MP / open.mp.'], ['NOMBRE DEL SERVIDOR', 'HOSTNAME', 'Drok RolePlay | Español', 'Nombre que aparece en la lista.'],
        ['MÁXIMO DE JUGADORES', 'MAX_PLAYERS', '100', 'Slots disponibles.'], ['GAMEMODE', 'GAMEMODE', 'drokrp', 'Nombre del .amx en gamemodes/.']];
    return '<div class="card" style="margin-bottom:16px"><h3>' + I('play') + 'COMANDO DE INICIO</h3><div class="startup-cmd mono">' + esc(S.startup) + '</div></div>' +
      '<div class="two" style="margin-bottom:16px"><div class="card"><h3>' + I('server') + 'Imagen Docker</h3><select class="input mono"><option>' + S.image + '</option></select>' +
      '<p style="color:var(--muted);font-size:12.5px;margin-top:8px">Imagen avanzada para ejecutar el servidor.</p></div>' +
      '<div class="card"><h3>' + I('cpu') + 'Egg</h3><div class="v">' + esc(S.egg) + '</div><p style="color:var(--muted);font-size:12.5px;margin-top:8px">Nodo: ' + S.node + '</p></div></div>' +
      '<div class="section-title">Variables</div><div class="two">' + vars.map(function (v) {
        return '<div class="card"><div class="field"><label>' + v[0] + '</label><input class="input" value="' + esc(v[2]) + '"><small>' + v[3] + '</small></div>' +
          '<span class="tag mono">{{' + v[1] + '}}</span></div>';
      }).join('') + '</div>';
  }

  function settingsView() {
    return '<div class="two"><div class="card"><h3>' + I('lock') + 'Detalles SFTP</h3>' +
      '<div class="field"><label>Dirección del servidor</label><input class="input mono" readonly value="sftp://' + S.ip + ':2022"></div>' +
      '<div class="field"><label>Usuario</label><input class="input mono" readonly value="lenin.' + S.id + '4f2a"></div>' +
      '<p style="color:var(--muted);font-size:12.5px;margin-bottom:12px">Tu contraseña SFTP es la misma que la del panel.</p>' +
      '<button class="btn gold demo-btn">Abrir SFTP</button></div>' +
      '<div class="card"><h3>' + I('sliders') + 'Detalles del servidor</h3>' +
      '<div class="field"><label>Nombre del servidor</label><input class="input" value="' + esc(S.name) + '"></div>' +
      '<div class="field"><label>Descripción</label><textarea class="input" rows="3">' + esc(S.desc) + '</textarea></div>' +
      '<button class="btn gold demo-btn">Guardar</button></div>' +
      '<div class="card"><h3>' + I('server') + 'Información de depuración</h3><table class="table"><tr><td>Nodo</td><td class="mono">' + S.node + '</td></tr>' +
      '<tr><td>ID del servidor</td><td class="mono">7c1e' + S.id + '-91ab-4d2f</td></tr></table></div>' +
      '<div class="card"><h3>' + I('refresh') + 'Reinstalar servidor</h3><p style="color:var(--muted);margin-bottom:14px">Detiene el servidor y vuelve a ejecutar el script de instalación. Algunos archivos podrían borrarse o modificarse.</p>' +
      '<button class="btn red demo-btn">Reinstalar servidor</button></div></div>';
  }

  function activityView() {
    var rows = [['server:power.start', 'Encendió el servidor', 'hace 3 días'], ['server:file.write', 'Editó /gamemodes/drokrp.pwn', 'hace 3 días'],
      ['server:backup.complete', 'Completó la copia "Copia automática semanal"', 'hace 2 días'], ['server:sftp.write', 'Subió 3 archivos por SFTP', 'hace 1 día'],
      ['server:console.command', 'Ejecutó "say Reinicio en 5 minutos"', 'hace 6 horas']];
    return '<div class="card"><h3>' + I('activity') + 'Actividad del servidor</h3><ul class="activity">' + rows.reverse().map(function (r) {
      return '<li><div class="dot">' + I('activity') + '</div><div><div><span class="tag gold mono">' + r[0] + '</span> ' + r[1] + '</div><div class="when">Lenin • 181.52.xx.xx • ' + r[2] + '</div></div></li>';
    }).join('') + '</ul></div>';
  }

  var VIEWS = { consola: consoleView, archivos: filesView, 'bases-de-datos': dbView, tareas: tasksView, usuarios: usersView,
    copias: backupsView, red: networkView, inicio: startupView, configuracion: settingsView, actividad: activityView };

  /* ---------- Cabecera con estado y botones de encendido ---------- */
  function headHTML(key) {
    var sec = SECTIONS.filter(function (s) { return s.key === key; })[0];
    return '<div class="srv-head"><div class="t"><h2>' + esc(S.name) + '</h2><span class="status ' + S.status + '" id="stBadge">' +
      DH.statusLabel(S.status) + '</span><span class="tag">' + sec.label + '</span></div>' +
      '<div class="power"><button class="btn green" id="bStart">' + I('play') + 'Start</button>' +
      '<button class="btn gray" id="bRestart">' + I('refresh') + 'Restart</button>' +
      '<button class="btn red" id="bStop">' + I('stop') + 'Stop</button></div></div>';
  }

  function updatePower() {
    var b = document.getElementById('stBadge');
    if (b) { b.className = 'status ' + S.status; b.textContent = DH.statusLabel(S.status); }
    var on = S.status !== 'offline';
    var st = document.getElementById('bStart'), rs = document.getElementById('bRestart'), sp = document.getElementById('bStop');
    if (st) { st.disabled = on; rs.disabled = !on; sp.disabled = !on; }
  }

  function pushLog(html) {
    logs.push(html); if (logs.length > 300) logs.shift();
    var out = document.getElementById('out');
    if (out) { out.insertAdjacentHTML('beforeend', '<div>' + html + '</div>'); out.scrollTop = out.scrollHeight; }
  }

  var bootTimer;
  function startServer() {
    S.status = 'starting'; updatePower(); clearInterval(bootTimer);
    var i = 0;
    bootTimer = setInterval(function () {
      pushLog(boot[i]); i++;
      if (boot[i - 1].indexOf('marked as running') > -1) { S.status = 'online'; S.uptime = 1; S.cpu = S.id === 'bot' ? 3.2 : 14.2; S.mem = S.id === 'bot' ? 118 : 612; updatePower(); }
      if (i >= boot.length) clearInterval(bootTimer);
    }, 180);
  }
  function stopServer(cb) {
    clearInterval(bootTimer);
    pushLog(sys('Server marked as stopping...'));
    pushLog(line(ts() + ' Guardando datos de jugadores... OK', 'mu'));
    setTimeout(function () {
      S.status = 'offline'; S.uptime = 0; S.cpu = 0; S.mem = 0;
      pushLog(sys('Server marked as offline...')); updatePower(); if (cb) cb();
    }, 700);
  }

  /* ---------- Gráficos (canvas) ---------- */
  function draw(id, series, colors, max) {
    var c = document.getElementById(id); if (!c) return;
    var dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = 150;
    c.width = w * dpr; c.height = h * dpr;
    var g = c.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, w, h);
    g.strokeStyle = '#1d2a45'; g.lineWidth = 1;
    for (var y = 0; y <= 4; y++) { var yy = 6 + (h - 12) * y / 4; g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); }
    series.forEach(function (data, k) {
      var m = max || Math.max.apply(null, data.concat([1])) * 1.25;
      var pts = data.map(function (v, i) { return [i * w / (data.length - 1), h - 6 - (h - 12) * Math.max(0, v) / m]; });
      var grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, colors[k] + '55'); grad.addColorStop(1, colors[k] + '00');
      g.beginPath(); g.moveTo(pts[0][0], h);
      pts.forEach(function (p) { g.lineTo(p[0], p[1]); });
      g.lineTo(w, h); g.closePath(); g.fillStyle = grad; g.fill();
      g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); });
      g.strokeStyle = colors[k]; g.lineWidth = 2; g.stroke();
    });
  }

  function setText(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }

  function tick() {
    var on = S.status === 'online';
    if (on) {
      S.uptime += 2;
      S.cpu = Math.max(1, Math.min(S.cpuMax, S.cpu + (Math.random() - .5) * 4));
      S.mem = Math.max(50, Math.min(S.memMax, S.mem + (Math.random() - .5) * 20));
      var rx = 10 + Math.random() * 50, tx = 20 + Math.random() * 70;
      net.rx += rx / 1024; net.tx += tx / 1024;
      hist.rx.push(rx); hist.tx.push(tx);
    } else { hist.rx.push(0); hist.tx.push(0); }
    hist.cpu.push(on ? S.cpu : 0); hist.mem.push(on ? S.mem : 0);
    ['cpu', 'mem', 'rx', 'tx'].forEach(function (k) { if (hist[k].length > N) hist[k].shift(); });
    render();
  }

  function render() {
    var on = S.status === 'online';
    setText('stUp', DH.fmtUptime(on ? S.uptime : 0));
    setText('stCpu', on ? S.cpu.toFixed(2) + '% / ' + S.cpuMax + '%' : 'Offline');
    setText('stMem', on ? DH.fmtMem(S.mem) + ' / ' + DH.fmtMem(S.memMax) : 'Offline');
    setText('stRx', net.rx.toFixed(2) + ' MiB');
    setText('stTx', net.tx.toFixed(2) + ' MiB');
    setText('cCpuVal', on ? S.cpu.toFixed(1) + '%' : '0%');
    setText('cMemVal', on ? DH.fmtMem(S.mem) : '0 MiB');
    setText('cNetVal', on ? '↓ ' + hist.rx[hist.rx.length - 1].toFixed(0) + ' KiB/s  ↑ ' + hist.tx[hist.tx.length - 1].toFixed(0) + ' KiB/s' : '—');
    draw('cCpu', [hist.cpu], ['#f2c94c'], S.cpuMax);
    draw('cMem', [hist.mem], ['#22d3ee'], S.memMax);
    draw('cNet', [hist.rx, hist.tx], ['#8b5cf6', '#22d3ee']);
  }

  /* ---------- Router ---------- */
  function route() {
    var key = (location.hash || '').slice(1);
    if (!VIEWS[key]) key = 'consola';
    var sec = SECTIONS.filter(function (s) { return s.key === key; })[0];
    DH.renderShell({ nav: NAV, active: key, title: S.name, sub: S.ip + ':' + S.port + ' • ' + S.egg });
    document.getElementById('content').innerHTML = headHTML(key) + VIEWS[key]();
    document.title = sec.label + ' • ' + S.name + ' | DrokHost';
    updatePower();

    document.getElementById('bStart').onclick = function () { startServer(); DH.toast('Iniciando servidor (demo)…'); };
    document.getElementById('bStop').onclick = function () { stopServer(); DH.toast('Deteniendo servidor (demo)…'); };
    document.getElementById('bRestart').onclick = function () { stopServer(startServer); DH.toast('Reiniciando servidor (demo)…'); };

    var out = document.getElementById('out');
    if (out) {
      out.innerHTML = logs.map(function (l) { return '<div>' + l + '</div>'; }).join('');
      out.scrollTop = out.scrollHeight;
      var cmd = document.getElementById('cmd');
      cmd.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || !cmd.value.trim()) return;
        var v = cmd.value.trim(); cmd.value = '';
        pushLog(sys(v));
        if (S.status !== 'online') pushLog(line('El servidor está apagado; el comando no se envió.', 'er'));
        else pushLog(line(ts() + ' Comando recibido: ' + v + ' (demo)', 'ok'));
      });
      render();
    }
    Array.prototype.forEach.call(document.querySelectorAll('.demo-btn'), function (b) {
      b.addEventListener('click', function () { DH.toast('Demo: esta acción no está disponible.'); });
    });
  }

  window.addEventListener('hashchange', route);
  window.addEventListener('resize', render);
  route();
  setInterval(tick, 2000);
})();
