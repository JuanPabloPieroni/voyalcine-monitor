# Monitor de funciones - La Odisea IMAX Norcenter

Avisa por notificacion push (via [ntfy.sh](https://ntfy.sh)) apenas aparece
una funcion nueva de **La Odisea en IMAX en Norcenter**, usando la API publica
de voyalcine.net:

```
GET https://api.voyalcine.net/films/5875/tree/showcase
```

Corre automaticamente cada 5 minutos via GitHub Actions (gratis en repos publicos).

## Setup

### 1. Configurar ntfy (la app que manda las notificaciones)

1. Instalate la app ntfy ([Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy) /
   [iOS](https://apps.apple.com/us/app/ntfy/id1625396347)) o usa la web https://ntfy.sh/app.
2. Elegi un **nombre de topic dificil de adivinar**, por ejemplo: `odisea-imax-x7f3k9`.
   Es publico: cualquiera que sepa el nombre puede leer ahi, por eso tiene que ser dificil de adivinar.
3. Suscribite a ese topic en la app.

### 2. Subir el repo a GitHub

1. Crea una cuenta en [github.com](https://github.com) si no tenes.
2. Crea un **nuevo repositorio publico** (importante: tiene que ser publico para que Actions sea gratis).
3. Subi estos 3 archivos al repo:
   - `monitor.js`
   - `state.json`
   - `.github/workflows/monitor.yml` (respeta la estructura de carpetas)

   La forma mas facil si no usas Git: en la pagina del repo, boton **Add file -> Upload files**.
   Para la carpeta `.github/workflows/`, tenes que crearla desde **Add file -> Create new file**
   y escribir `.github/workflows/monitor.yml` como nombre — GitHub crea las carpetas solo.

### 3. Guardar el topic de ntfy como Secret

En tu repo de GitHub:
**Settings -> Secrets and variables -> Actions -> New repository secret**
- Nombre: `NTFY_TOPIC`
- Valor: el topic que elegiste (ej: `odisea-imax-x7f3k9`)

Esto evita que el topic quede visible en el codigo.

### 4. Habilitar y probar Actions

1. Anda a la pestana **Actions** del repo.
2. Si te aparece un cartel para habilitar workflows, aceptalo.
3. Hace click en el workflow **"Monitor funciones La Odisea"** en el panel izquierdo.
4. Boton **Run workflow** -> **Run workflow** para correrlo manualmente una vez.
5. Hace click en la corrida que aparece y fijate que el paso "Ejecutar monitor" termine sin errores.

A partir de ahi, el workflow corre solo cada 5 minutos. Cuando aparezca una funcion nueva
de La Odisea en IMAX Norcenter, te llega una notificacion push en el celular.

## Como funciona

- `monitor.js` consulta la API, filtra solo funciones de **Norcenter** en formato **IMAX**,
  y compara contra `state.json` (el ultimo estado guardado).
- Si hay funciones nuevas, manda una notificacion con fecha, hora y formato.
- El workflow commitea `state.json` actualizado al repo despues de cada corrida,
  para que el estado persista entre ejecuciones.

## Para otra pelicula

Cambia `FILM_ID` en `.github/workflows/monitor.yml` (el id lo sacas de la URL
`pelicula.aspx?filmid=XXXX` en voyalcine.net). Tambien podes ajustar los filtros
de cine/formato en `monitor.js`.

## Notas

- GitHub Actions `schedule` puede demorar algunos minutos extra bajo carga de la plataforma,
  pero para este caso (entradas que se publican con horas de anticipacion) es mas que suficiente.
- Si el topic de ntfy se filtra, cualquiera puede ver tus notificaciones. Podes cambiarlo
  en cualquier momento generando uno nuevo y actualizando el Secret.
