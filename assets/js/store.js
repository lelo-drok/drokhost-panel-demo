/* DrokHost Panel — almacenamiento persistente en localStorage (sin backend) */
(function () {
  'use strict';
  const KEY = 'dh_panel_v1', FKEY = 'dh_files_', BKEY = 'dh_backup_';
  const memory = {};
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return memory[k] ?? null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) {
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) { if (window.DH) DH.toast('Almacenamiento del navegador lleno: borra archivos o copias.'); return false; }
      memory[k] = v; return true; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { delete memory[k]; } }
  };

  function uid() { return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
  function hash(s) { // hash simple (demo, no es seguridad real)
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  const DIR = { d: 1 };

  const TYPES = {
    samp: { label: 'SA-MP', icon: 'server', port: 7777, image: 'ghcr.io/parkervcp/games:samp', startup: './omp-server',
      vars: [['NOMBRE DEL SERVIDOR', 'HOSTNAME', '{name}'], ['MÁXIMO DE JUGADORES', 'MAX_PLAYERS', '{slots}'], ['CONTRASEÑA RCON', 'RCON_PASSWORD', 'cambieme']],
      files: { 'gamemodes': DIR, 'gamemodes/main.pwn': '#include <open.mp>\n\nmain()\n{\n    print("{name} cargado.");\n}\n\npublic OnGameModeInit()\n{\n    SetGameModeText("RolePlay");\n    return 1;\n}\n',
        'filterscripts': DIR, 'plugins': DIR, 'scriptfiles': DIR,
        'config.json': '{\n    "name": "{name}",\n    "max_players": {slots},\n    "network": { "port": {port} },\n    "pawn": { "main_scripts": ["main"] }\n}\n' },
      boot: ['open.mp version 1.4.0.2779', 'Loading plugin: mysql', ' >> plugin.mysql: R41-4 successfully loaded.', 'Loading plugin: streamer',
        'Loaded gamemode: main.amx', 'Number of vehicle models: 0', 'Legacy Network started on port {port}'] },
    mta: { label: 'MTA', icon: 'server', port: 22003, image: 'ghcr.io/parkervcp/games:mta', startup: './mta-server64 --port {port} -n -t -u',
      vars: [['NOMBRE DEL SERVIDOR', 'SERVER_NAME', '{name}'], ['MÁXIMO DE JUGADORES', 'MAX_PLAYERS', '{slots}']],
      files: { 'mods': DIR, 'mods/deathmatch': DIR, 'mods/deathmatch/resources': DIR,
        'mods/deathmatch/mtaserver.conf': '<config>\n    <servername>{name}</servername>\n    <serverport>{port}</serverport>\n    <maxplayers>{slots}</maxplayers>\n</config>\n' },
      boot: ['MTA:SA Server v1.6 [64 bit]', 'Resources: 112 loaded, 0 failed', 'Server name      : {name}', 'Server port      : {port}', 'Server started and is ready to accept connections!'] },
    minecraft: { label: 'Minecraft', icon: 'server', port: 25565, image: 'ghcr.io/pterodactyl/yolks:java_21', startup: 'java -Xms128M -Xmx{ram}M -jar server.jar',
      vars: [['VERSIÓN', 'MINECRAFT_VERSION', 'latest'], ['ARCHIVO JAR', 'SERVER_JARFILE', 'server.jar']],
      files: { 'server.properties': 'motd={name}\nserver-port={port}\nmax-players={slots}\nonline-mode=true\n', 'eula.txt': 'eula=true\n', 'world': DIR, 'plugins': DIR },
      boot: ['Starting minecraft server version 1.21.4', 'Loading properties', 'Starting Minecraft server on *:{port}', 'Preparing level "world"', 'Done (4.213s)! For help, type "help"'] },
    bot: { label: 'Bot Discord', icon: 'chat', port: 25590, image: 'ghcr.io/parkervcp/yolks:nodejs_22', startup: 'if [ -f package.json ]; then npm install; fi; node {{MAIN_FILE}}',
      vars: [['ARCHIVO PRINCIPAL', 'MAIN_FILE', 'index.js']],
      files: { 'index.js': "const { Client, GatewayIntentBits } = require('discord.js');\nconst client = new Client({ intents: [GatewayIntentBits.Guilds] });\n\nclient.once('ready', () => console.log(`Conectado como ${client.user.tag}`));\nclient.login(process.env.TOKEN);\n",
        'package.json': '{\n  "name": "bot-discord",\n  "version": "1.0.0",\n  "main": "index.js",\n  "dependencies": { "discord.js": "^14.16.0" }\n}\n', '.env': 'TOKEN=pon_aqui_tu_token\n', 'commands': DIR },
      boot: ['npm install', 'up to date, audited 24 packages in 1s', 'node index.js', '[BOT] Cargando comandos...', 'Conectado como {name}#4821'] },
    web: { label: 'Web', icon: 'globe', port: 8080, image: 'ghcr.io/parkervcp/yolks:nodejs_22', startup: 'node server.js',
      vars: [['PUERTO WEB', 'WEB_PORT', '{port}']],
      files: { 'public': DIR, 'public/index.html': '<!DOCTYPE html>\n<html lang="es">\n<head><meta charset="utf-8"><title>{name}</title></head>\n<body><h1>{name}</h1><p>Alojado en DrokHost.</p></body>\n</html>\n',
        'server.js': "const http = require('http');\nconst fs = require('fs');\nhttp.createServer((req, res) => res.end(fs.readFileSync('public/index.html'))).listen({port});\nconsole.log('Web escuchando en {port}');\n" },
      boot: ['node server.js', 'Web escuchando en {port}'] }
  };

  function fill(t, s) {
    return String(t).replace(/\{name\}/g, s.name).replace(/\{port\}/g, s.port).replace(/\{slots\}/g, s.slots || 0).replace(/\{ram\}/g, s.ramMb);
  }
  function templateFiles(s) {
    const out = {}, t = TYPES[s.type], now = Date.now();
    Object.keys(t.files).forEach(p => {
      const v = t.files[p];
      if (v === DIR) out[p] = { d: 1, m: now };
      else { const c = fill(v, s); out[p] = { c, s: new Blob([c]).size, m: now }; }
    });
    return out;
  }

  let data = null;
  function defaults() {
    return { v: 1, admin: { user: 'admin', pass: hash('drokhost'), changed: false }, session: null, servers: [], activity: [], nextPort: {} };
  }
  function load() {
    try { data = JSON.parse(ls.get(KEY)); } catch (e) { data = null; }
    if (!data || !data.admin) { data = defaults(); seed(); }
    // finalizar estados transitorios tras recargar
    data.servers.forEach(s => { if (s.status === 'starting') { s.status = 'online'; s.startedAt = Date.now(); } if (s.status === 'stopping') s.status = 'offline'; });
    return data;
  }
  function save() { return ls.set(KEY, JSON.stringify(data)); }

  function nextPort(type) {
    const base = TYPES[type].port; const used = new Set();
    data.servers.forEach(s => s.allocations.forEach(a => used.add(a.port)));
    let p = base; while (used.has(p)) p++; return p;
  }

  function create(o) {
    const t = TYPES[o.type];
    const s = { id: uid(), name: o.name, desc: o.desc || '', type: o.type, ramMb: +o.ramMb, diskMb: +o.diskMb, slots: +o.slots || 0,
      status: 'offline', startedAt: 0, createdAt: Date.now(), ip: 'node1.drokhost.com', port: 0,
      startup: t.startup, image: t.image, vars: {}, allocations: [], databases: [], schedules: [], subusers: [], backups: [], console: [] };
    s.port = nextPort(o.type);
    s.allocations.push({ id: uid(), ip: s.ip, port: s.port, notes: 'Puerto principal', primary: true });
    t.vars.forEach(v => { s.vars[v[1]] = fill(v[2], s); });
    s.console.push(['mu', 'Servidor creado. Pulsa Encender para iniciarlo.']);
    data.servers.push(s);
    saveFiles(s.id, templateFiles(s));
    log(s, 'server:create', 'Creó el servidor «' + s.name + '»');
    save();
    return s;
  }
  function seed() {
    const a = create({ name: 'SampCity RolePlay', type: 'samp', ramMb: 2048, diskMb: 10240, slots: 100, desc: 'Servidor SA-MP RolePlay en español' });
    a.status = 'online'; a.startedAt = Date.now() - (3 * 86400 + 5 * 3600) * 1000;
    a.console = [['c', 'container@drokhost~ ./omp-server']].concat(TYPES.samp.boot.map(l => ['', fill(l, a)]));
    create({ name: 'Bot Discord SampCity', type: 'bot', ramMb: 512, diskMb: 5120, slots: 0, desc: 'Bot de Discord (Node.js)' });
    data.activity.forEach(x => { x.t -= 86400000; });
    save();
  }
  function get(id) { return data.servers.find(s => s.id === id) || null; }
  function remove(id) {
    const s = get(id); if (!s) return;
    s.backups.forEach(b => ls.del(BKEY + b.id)); ls.del(FKEY + id);
    data.servers = data.servers.filter(x => x.id !== id);
    log(null, 'server:delete', 'Eliminó el servidor «' + s.name + '»'); save();
  }
  function log(s, ev, desc) {
    data.activity.unshift({ t: Date.now(), ev, desc, srv: s ? s.id : null, user: data.admin.user });
    if (data.activity.length > 300) data.activity.length = 300;
  }

  function loadFiles(id) { try { return JSON.parse(ls.get(FKEY + id)) || {}; } catch (e) { return {}; } }
  function saveFiles(id, f) { return ls.set(FKEY + id, JSON.stringify(f)); }
  function saveBackup(bid, f) { return ls.set(BKEY + bid, JSON.stringify(f)); }
  function loadBackup(bid) { try { return JSON.parse(ls.get(BKEY + bid)); } catch (e) { return null; } }
  function delBackup(bid) { ls.del(BKEY + bid); }

  function login(u, p) {
    if (u.trim() === data.admin.user && hash(p) === data.admin.pass) { data.session = { user: data.admin.user, at: Date.now() }; log(null, 'auth:success', 'Inicio de sesión'); save(); return true; }
    log(null, 'auth:fail', 'Intento de inicio de sesión fallido (' + u.slice(0, 40) + ')'); save(); return false;
  }
  function logout() { data.session = null; save(); }
  function isAuth() { return !!(data.session && data.session.user === data.admin.user); }
  function guard() { if (!isAuth()) { location.replace('index.html'); return false; } return true; }
  function setAdmin(cur, user, pass) {
    if (hash(cur) !== data.admin.pass) return 'La contraseña actual no es correcta.';
    if (!user.trim()) return 'El usuario no puede estar vacío.';
    if (pass && pass.length < 6) return 'La nueva contraseña debe tener al menos 6 caracteres.';
    data.admin.user = user.trim(); if (pass) data.admin.pass = hash(pass); data.admin.changed = true;
    data.session = { user: data.admin.user, at: Date.now() };
    log(null, 'user:account.updated', 'Actualizó las credenciales de administrador'); save(); return null;
  }
  function exportAll() {
    const out = { panel: data, files: {}, backups: {} };
    data.servers.forEach(s => { out.files[s.id] = loadFiles(s.id); s.backups.forEach(b => { out.backups[b.id] = loadBackup(b.id); }); });
    return JSON.stringify(out);
  }
  function importAll(json) {
    const o = JSON.parse(json); if (!o.panel || !o.panel.admin) throw new Error('Archivo no válido');
    resetAll(true); data = o.panel;
    Object.keys(o.files || {}).forEach(k => saveFiles(k, o.files[k]));
    Object.keys(o.backups || {}).forEach(k => saveBackup(k, o.backups[k]));
    save();
  }
  function resetAll(silent) {
    data.servers.forEach(s => { ls.del(FKEY + s.id); s.backups.forEach(b => ls.del(BKEY + b.id)); });
    ls.del(KEY); if (!silent) load();
  }
  function usage() { let n = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('dh_')) n += (localStorage.getItem(k) || '').length * 2; } } catch (e) {} return n; }

  load();
  window.DB = { get data() { return data; }, TYPES, uid, save, create, get, remove, log, loadFiles, saveFiles, saveBackup, loadBackup, delBackup,
    templateFiles, login, logout, isAuth, guard, setAdmin, exportAll, importAll, resetAll, usage, fill, nextPort };
})();
