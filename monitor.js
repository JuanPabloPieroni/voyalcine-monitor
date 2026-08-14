#!/usr/bin/env node
/**
 * Monitor de funciones - voyalcine.net (Showcase)
 *
 * Consulta la API publica que usa el sitio para cargar horarios,
 * compara contra el ultimo estado guardado en state.json, y si
 * aparecen funciones nuevas (fecha, cine, formato u horario nuevo)
 * dispara una notificacion push via ntfy.sh.
 *
 * Variables de entorno requeridas:
 *   FILM_ID     -> id de la pelicula (5875 = La Odisea)
 *   NTFY_TOPIC  -> nombre del topic privado de ntfy.sh
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILM_ID = process.env.FILM_ID || "5875";
const NTFY_TOPIC = process.env.NTFY_TOPIC;
const STATE_FILE = "state.json";
const API_URL = `https://api.voyalcine.net/films/${FILM_ID}/tree/showcase`;

if (!NTFY_TOPIC) {
  console.error("Falta la variable de entorno NTFY_TOPIC");
  process.exit(1);
}

async function fetchFunciones() {
  const res = await fetch(API_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (monitor-personal; contacto en README)" },
  });
  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status} al consultar la API`);
  }
  return res.json();
}

// Convierte el JSON anidado (dias -> cines -> formatos -> funciones)
// en un mapa plano performanceId -> datos legibles. Comparar este mapa
// es mas robusto que comparar el JSON crudo: no importa el orden ni
// campos irrelevantes, solo si aparecio un performanceId nuevo.
function flatten(data) {
  const flat = {};
  const days = data.days || {};
  for (const [date, cines] of Object.entries(days)) {
    for (const cine of cines) {
      if (!cine.name.toLowerCase().includes("norcenter")) continue;
      for (const formato of cine.formats) {
        if (!formato.formatDescription.toLowerCase().includes("imax")) continue;
        for (const perf of formato.performances) {
          flat[perf.performanceId] = {
            date,
            cine: cine.name,
            formato: formato.formatDescription,
            hora: perf.showTime,
          };
        }
      }
    }
  }
  return flat;
}

function loadPreviousState() {
  if (!existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveState(flat) {
  writeFileSync(STATE_FILE, JSON.stringify(flat, null, 2));
}

async function notify(mensaje) {
  const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: "POST",
    headers: {
      Title: "Nuevas funciones: La Odisea",
      Priority: "urgent",
      Tags: "movie_camera,ticket",
    },
    body: mensaje,
  });
  if (!res.ok) {
    console.error(`No se pudo enviar la notificacion (HTTP ${res.status})`);
  }
}

async function main() {
  const data = await fetchFunciones();
  const current = flatten(data);
  const previous = loadPreviousState();

  const nuevos = Object.entries(current).filter(([id]) => !(id in previous));

  if (nuevos.length > 0) {
    console.log(`Se encontraron ${nuevos.length} funcion(es) nueva(s).`);
    const lineas = nuevos
      .sort((a, b) => (a[1].date + a[1].hora).localeCompare(b[1].date + b[1].hora))
      .map(([, f]) => `${f.date} ${f.hora} - ${f.cine} (${f.formato})`)
      .slice(0, 20); // ntfy tiene limite de tamanio de mensaje
    const extra = nuevos.length > 20 ? `\n...y ${nuevos.length - 20} mas` : "";
    await notify(lineas.join("\n") + extra);
  } else {
    console.log("Sin cambios respecto a la ultima corrida.");
  }

  saveState(current);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
