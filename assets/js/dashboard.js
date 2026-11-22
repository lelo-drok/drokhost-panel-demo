/* DrokHost Panel — Demo: dashboard (lista de servidores y cuenta) */
(function () {
  'use strict';
  var I = DH.icon;

  var NAV = [
    { key: 'servers', label: 'Servidores', icon: 'server', href: 'dashboard.html' },
    { key: 'api', label: 'Credenciales API', icon: 'key', href: 'dashboard.html#api' },
    { key: 'actividad', label: 'Actividad de la cuenta', icon: 'activity', href: 'dashboard.html#actividad' }
  ];

  function metric(label, ic, val, pct) {
    return '<div class="metric"><div class="lbl">' + I(ic) + label + '</div><div class="val">' + val + '</div>' +
      '<div class="bar"><span style="width:' + Math.min(100, pct) + '%"></span></div></div>';
  }

  function serversView() {
    var cards = DH.SERVERS.map(function (s) {
      var on = s.status === 'online';
      return '<a class="card srv" href="server.html?id=' + s.id + '">' +
        '<div class="ico">' + I(s.id === 'bot' ? 'chat' : 'server') + '</div>' +
        '<div><div class="name">' + DH.esc(s.name) + '</div><div class="desc mono">' + s.ip + ':' + s.port + ' • ' + DH.esc(s.desc) + '</div></div>' +
        metric('CPU', 'cpu', on ? s.cpu.toFixed(1) + '% / ' + s.cpuMax + '%' : '0% / ' + s.cpuMax + '%', on ? s.cpu / s.cpuMax * 100 : 0) +
        metric('Memoria', 'memory', DH.fmtMem(s.mem) + ' / ' + DH.fmtMem(s.memMax), s.mem / s.memMax * 100) +
        metric('Disco', 'disk', s.disk.toFixed(2) + ' GiB / ' + s.diskMax + ' GiB', s.disk / s.diskMax * 100) +
        '<span class="status ' + s.status + '">' + DH.statusLabel(s.status) + '</span></a>';
    }).join('');
    return '<div class="toolbar"><div class="crumb">Mostrando <b>tus servidores</b> (' + DH.SERVERS.length + ')</div>' +
      '<input class="input" style="max-width:260px" placeholder="Buscar servidor..." id="q"></div>' +
      '<div class="srv-list" id="list">' + cards + '</div>';
  }

  function accountView() {
    return '<div class="two">' +
      '<div class="card"><h3>' + I('user') + 'Actualizar correo</h3>' +
      '<div class="field"><label>Correo</label><input class="input" value="lenin@drokhost.com"></div>' +
      '<div class="field"><label>Contraseña actual</label><input class="input" type="password"></div>' +
      '<button class="btn gold demo-btn">Actualizar correo</button></div>' +
      '<div class="card"><h3>' + I('lock') + 'Cambiar contraseña</h3>' +
      '<div class="field"><label>Contraseña actual</label><input class="input" type="password"></div>' +
      '<div class="field"><label>Nueva contraseña</label><input class="input" type="password"><small>Mínimo 8 caracteres.</small></div>' +
      '<button class="btn gold demo-btn">Actualizar contraseña</button></div>' +
      '<div class="card"><h3>' + I('key') + 'Verificación en dos pasos</h3><p style="color:var(--muted);margin-bottom:14px">La verificación en dos pasos no está activada en tu cuenta.</p>' +
      '<button class="btn green demo-btn">Activar</button></div></div>';
  }

  function apiView() {
    return '<div class="two"><div class="card"><h3>' + I('plus') + 'Crear clave API</h3>' +
      '<div class="field"><label>Descripción</label><input class="input" placeholder="Mi integración"></div>' +
      '<div class="field"><label>IPs permitidas</label><textarea class="input" rows="3" placeholder="Deja en blanco para permitir cualquiera"></textarea></div>' +
      '<button class="btn gold demo-btn">Crear</button></div>' +
      '<div class="card"><h3>' + I('key') + 'Claves API</h3><table class="table"><tr><th>Descripción</th><th>Identificador</th><th>Último uso</th></tr>' +
      '<tr><td>Bot de estado</td><td class="mono">ptlc_7Hq2…</td><td>Hace 2 horas</td></tr></table></div></div>';
  }

  function activityView() {
    var rows = [['auth:success', 'Inicio de sesión correcto', 'hace 1 minuto'], ['server:power.start', 'Encendió SAMP | Drok', 'hace 3 días'],
      ['user:api-key.create', 'Creó una clave API', 'hace 5 días'], ['user:account.password-changed', 'Cambió la contraseña', 'hace 2 semanas']];
    return '<div class="card"><h3>' + I('activity') + 'Actividad de la cuenta</h3><ul class="activity">' + rows.map(function (r) {
      return '<li><div class="dot">' + I('activity') + '</div><div><div><span class="tag gold mono">' + r[0] + '</span> ' + r[1] +
        '</div><div class="when">Lenin • 181.52.xx.xx • ' + r[2] + '</div></div></li>';
    }).join('') + '</ul></div>';
  }

  var VIEWS = {
    servers: ['Tus servidores', 'Bienvenido de nuevo, Lenin', serversView],
    cuenta: ['Mi cuenta', 'Gestiona tu correo, contraseña y seguridad', accountView],
    api: ['Credenciales API', 'Claves para acceder a la API de cliente', apiView],
    actividad: ['Actividad de la cuenta', 'Registro de acciones recientes', activityView]
  };

  function route() {
    var key = (location.hash || '').slice(1);
    if (!VIEWS[key]) key = 'servers';
    var v = VIEWS[key];
    DH.renderShell({ nav: NAV, active: key, title: v[0], sub: v[1] });
    document.getElementById('content').innerHTML = v[2]();
    document.title = v[0] + ' | DrokHost';
    var q = document.getElementById('q');
    if (q) q.addEventListener('input', function () {
      var t = q.value.toLowerCase();
      Array.prototype.forEach.call(document.querySelectorAll('#list .srv'), function (el) {
        el.style.display = el.textContent.toLowerCase().indexOf(t) > -1 ? '' : 'none';
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.demo-btn'), function (b) {
      b.addEventListener('click', function () { DH.toast('Demo: esta acción no se guarda.'); });
    });
  }

  window.addEventListener('hashchange', route);
  route();
})();
