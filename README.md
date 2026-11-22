# DrokHost Panel — versión funcional de prueba (GitHub Pages)

Panel de clientes de DrokHost con diseño tipo Pterodactyl/Nebula. Funciona entero en el navegador (HTML/CSS/JS + localStorage), sin backend, para probarlo desde GitHub Pages antes de instalar Pterodactyl real en el nodo.

**Acceso inicial:** `admin` / `drokhost` (cámbialo en *Mi cuenta*).

## Qué funciona (y se guarda)
- Login con usuario y contraseña cambiables, sesión persistente y cierre de sesión.
- Dashboard con servidores guardados. Al inicio trae «SampCity RolePlay» (SA-MP) y «Bot Discord SampCity».
- Crear servidor: nombre, tipo (SA-MP, MTA, Minecraft, Bot Discord o Web), RAM, disco y slots.
- Consola: Encender/Detener/Reiniciar cambian el estado guardado. Los comandos responden (`help`, `status`, `players`/`list`, `say`, `version`, `clear`, `restart`, `stop`, `ping` …).
- Archivos: subir archivos reales (también arrastrándolos), crear carpetas y archivos, editarlos y guardarlos, renombrar, descargar y borrar.
- Bases de datos, Tareas programadas (cron y «Ejecutar ahora»), Usuarios y Copias de seguridad (con restaurar): todo se crea, se borra y se guarda.
- Red (puertos), Inicio (comando de inicio, imagen y variables editables), Configuración (renombrar, reinstalar, eliminar) y Actividad con las acciones reales.
- Exportar e importar todos los datos (JSON) desde *Mi cuenta*.

## Límites (por ser solo navegador)
- Los datos viven en el navegador de cada persona: no se comparten entre equipos. Para pasarlos a otro equipo, usa Exportar/Importar.
- Los servidores no ejecutan procesos reales: el estado, la consola y las estadísticas son simulados.
- Máximo ~1.5 MB por archivo (el navegador permite unos 5 MB en total).
- Las tareas programadas solo corren mientras el panel está abierto.

## Publicar en GitHub Pages
1. Sube el contenido de esta carpeta a la raíz del repo `lelo-drok/drokhost-panel-demo`.
2. En el repo: **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`** → Save.
3. El panel quedará en `https://lelo-drok.github.io/drokhost-panel-demo/`.

## Estructura
```
index.html        Login
dashboard.html    Servidores, crear servidor, Mi cuenta, Actividad
server.html       Vista de servidor (?id=…#consola, #archivos, #bases-de-datos, #tareas,
                  #usuarios, #copias, #red, #inicio, #configuracion, #actividad)
assets/css/style.css
assets/js/app.js        iconos, barra lateral, Discord, pie, modales
assets/js/store.js      datos persistentes (localStorage) y plantillas por tipo
assets/js/dashboard.js
assets/js/server.js
assets/img/             logo y favicon
.nojekyll
```
