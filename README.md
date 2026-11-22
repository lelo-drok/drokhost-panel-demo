# DrokHost Panel — Demo visual (estático)

Demo de solo front-end (HTML/CSS/JS, sin backend) del panel de clientes de DrokHost, con estilo oscuro tipo Pterodactyl + Blueprint + Nebula.

## Estructura
```
index.html          → Login (cualquier usuario/contraseña entra)
dashboard.html      → Lista de servidores (#cuenta, #api, #actividad)
server.html?id=samp → Vista de servidor (#consola, #archivos, #bases-de-datos, #tareas,
                      #usuarios, #copias, #red, #inicio, #configuracion, #actividad)
server.html?id=bot  → Servidor «Bot DSC | Drok» (Offline)
assets/css/style.css
assets/js/app.js        → datos de ejemplo, sidebar, botón Discord, pie
assets/js/dashboard.js
assets/js/server.js
assets/img/             → logo, icono, favicon
render.yaml
```

## Desplegar en Render (Static Site)
1. Sube esta carpeta a un repositorio de GitHub (la raíz del repo debe contener `index.html`).
2. En Render: **New → Static Site** → elige el repo.
3. Build Command: *(vacío)* · Publish Directory: `.`
4. Create Static Site. (O usa **New → Blueprint** y Render leerá `render.yaml`.)

## Personalizar
- Enlace de Discord: `DISCORD_URL` en `assets/js/app.js` (y el enlace «Soporte» en `index.html`).
- Servidores de ejemplo: array `SERVERS` en `assets/js/app.js`.
- Colores: variables `:root` en `assets/css/style.css`.
