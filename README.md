# Monitor de funciones - La Odisea (voyalcine.net Showcase)

Avisa por notificacion push (via [ntfy.sh](https://ntfy.sh)) apenas aparece
una funcion nueva (fecha, cine, formato u horario) para la pelicula, usando
la API publica que ya usa el sitio internamente:

```
GET https://api.voyalcine.net/films/5875/tree/showcase
```

No requiere scraping de HTML: el JSON ya viene estructurado.

## Setup (5 minutos)

1. **Instalate la app ntfy** ([Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy) /
   [iOS](https://apps.apple.com/us/app/ntfy/id1625396347)) o usa la web
   https://ntfy.sh/app.
2. Elegi un **nombre de topic dificil de adivinar** (es publico: cualquiera
   que sepa el nombre puede leer o postear ahi). Por ejemplo:
   `odisea-showcase-x7f3k9`. Suscribite a ese topic en la app.
3. Cread un repo en GitHub y subi estos archivos (`monitor.js`, `state.json`,
   `.github/workflows/monitor.yml`).    
4. En el repo: **Settings -> Secrets and variables -> Actions -> New repository
   secret**
   - Nombre: `NTFY_TOPIC`
   - Valor: el topic que elegiste en el paso 2
5. Andá a la pestaña **Actions** del repo, habilitá los workflows si te lo
   pide, y corré el workflow "Monitor funciones La Odisea" manualmente una
   vez (`Run workflow`) para verificar que ande.
6. **Armá el disparador externo cada 1 minuto** (el `schedule` nativo de
   Actions no es preciso, asi que el workflow ahora se dispara por
   `repository_dispatch` desde afuera):
   1. Generá un **Personal Access Token (fine-grained)** en GitHub:
      Settings de tu cuenta -> Developer settings -> Personal access
      tokens -> Fine-grained tokens -> New token. Dale acceso solo a este
      repo, con permiso **Actions: Read and write**.
   2. Creá una cuenta gratis en https://cron-job.org.
   3. Creá un nuevo cronjob:
      - URL: `https://api.github.com/repos/TU_USUARIO/TU_REPO/dispatches`
      - Metodo: `POST`
      - Headers:
        - `Authorization: Bearer TU_TOKEN`
        - `Accept: application/vnd.github+json`
        - `Content-Type: application/json`
      - Body: `{"event_type": "check-funciones"}`
      - Intervalo: cada 1 minuto
   4. Guardá y activá el cronjob. Deberias ver correr el workflow en la
      pestaña Actions del repo cada 1 minuto.

**Importante:** guardá el token de forma segura (no lo subas al repo). Si
se filtra, alguien podria disparar workflows en tu nombre - revocalo y
generá uno nuevo si sospechas que se filtro.

## Como funciona

- `monitor.js` pide el JSON de la API, lo aplana a un mapa
  `performanceId -> {fecha, cine, formato, hora}` y lo compara contra
  `state.json` (el ultimo estado commiteado).
- Si hay `performanceId` nuevos que antes no estaban, manda una notificacion
  con el detalle (fecha, hora, cine, formato) y actualiza `state.json`.
- El workflow de Actions commitea `state.json` de vuelta al repo despues de
  cada corrida, asi el estado persiste entre ejecuciones (Actions no tiene
  disco persistente propio).

## Para otra pelicula

Cambia `FILM_ID` en `.github/workflows/monitor.yml` por el id de la otra
pelicula (lo sacas de la URL `pelicula.aspx?filmid=XXXX` en la web).

## Notas

- Con `repository_dispatch` + cron-job.org a 1 min, la latencia real entre
  que el cine publica una funcion y que te llega la notificacion deberia
  rondar 1-3 minutos (1 min del cron externo + el tiempo que tarda el job
  de Actions en arrancar y correr, que normalmente son segundos).
- cron-job.org en su plan gratis permite intervalos de 1 minuto. Si en el
  futuro necesitas algo mas agresivo (segundos), ahi si conviene mudar todo
  a un VPS propio con un loop real, pero para este caso 1 min ya es un piso
  bastante competitivo.
- Si el topic de ntfy se filtra, cualquiera puede ver tus notificaciones o
  spamearte el topic. Se puede migrar a un servidor ntfy propio o a auth por
  token si eso preocupa.
- El endpoint es publico y no requiere headers especiales, pero igual
  conviene no bajar la frecuencia por debajo de unos minutos para no generar
  carga innecesaria en su servidor.
