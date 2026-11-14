# test_agent — probar AQUARING en un navegador real

Agente de pruebas del build final (`../index.html`, ≤ 32 500 B; rebanada dura 32 768 B)
contra **Chrome real**, no contra un DOM simulado. Dos niveles de prueba:

| Archivo | Qué hace |
| --- | --- |
| `realtime.test.js` | Juega **en tiempo real** con teclado: controles, inclinación del marco completo, erupciones **A/D**, apilado y DIFICIL. Sin saltos de oleada. |
| `auto_test.js` | Suite E2E: menú → controles → partida → oleada **5 en FÁCIL y DIFICIL**, capturas y código de salida. |
| `README.md` | Esta guía (incluye el uso con la Playwright MCP). |
| `shots/` | Capturas generadas por los tests (PNG). |

## Requisitos

- Node.js ≥ 18
- Google Chrome instalado (`channel: 'chrome'` — **no** se descarga navegador)
- `npm install` **en esta carpeta** (ya ejecutado si recibiste el repo con `node_modules/`)

## Cómo ejecutarlo

```powershell
cd game_desinger_v2\test_agent
npm install        # una vez
node auto_test.js  # FÁCIL y DIFICIL, oleada 1 → 5
node realtime.test.js
```

Código de salida: `0` = todo OK, `1` = algo falla (los motivos se listan en consola).

**Antes de probar**, regenera el build:

```powershell
cd game_desinger_v2
node tools/build.mjs   # exit 1 si supera 32 500 B
```

Lo que verifica `auto_test.js`:

- FÁCIL (`A`, por defecto): menú → `Space` → escena `play` + ventana de controles →
  `Space` la cierra → oleada 1 con **dos pilares** (`xs() === '288|672'`) y **dos volcanes**
  → el hook/estado del cañón ya no existe → un anillo apilado con frames reales.
- `__AQ.sw(5)` → oleada 5 con **dos pilares** y volcanes (sin pilar central).
- DIFICIL (`D`): oleada 1 con dos pilares, dos volcanes y `q.p.length === 2`; `sw(5)` igual.
- Cero `pageerror` y cero `console.error` (se ignoran avisos benignos de autoplay).

## Probar a mano en navegador real con la Playwright MCP

El harness expone herramientas `playwright_*` para manejar Chrome real:

```text
1. python -m http.server 8137 --bind 127.0.0.1   # en game_desinger_v2/ (MCP bloquea file://)
2. browser_navigate   http://127.0.0.1:8137/index.html
3. browser_snapshot                       # vacío: el juego es un <canvas>
4. browser_press_key  "a" | "d"           # FÁCIL | DIFICIL (o ArrowLeft / ArrowRight)
5. browser_take_screenshot                # menú con el selector resaltado
6. browser_press_key  "Space"             # empieza y abre la ventana CONTROLES
7. browser_take_screenshot                # ventana animada
8. browser_press_key  "Space"             # cualquier tecla la cierra
9. browser_evaluate   function = "() => window.__AQ.s()"   # 'menu' | 'play' | 'over'
10. browser_press_key "p"                 # pausa: mismo panel con título PAUSA
11. browser_take_screenshot               # pausa; un toque reanuda
12. browser_console_messages level="error"
13. browser_close
```

Notas del entorno real:

- `browser_navigate` **no admite `file://`**: sirve el build por HTTP local.
- `browser_evaluate` recibe una **función** (`"() => ..."`), no una expresión suelta.
- `filename` de `browser_take_screenshot` se resuelve contra la raíz del workspace del
  servidor MCP (`game32-hackathon/`, carpeta padre de `game_desinger_v2/`): usa el prefijo
  `game_desinger_v2/...` o mueve las capturas después.
- El snapshot de accesibilidad es `<canvas>` vacío: lee el estado con `__AQ` y usa capturas.

### Hook de depuración `window.__AQ` (lo único estable)

| Hook | Devuelve |
| --- | --- |
| `__AQ.s()` | escena: `'menu'` · `'play'` · `'over'` |
| `__AQ.sc()` | puntuación |
| `__AQ.wv()` | oleada actual |
| `__AQ.p()` | `1` si está en pausa |
| `__AQ.ti()` | inclinación (−1…+1) |
| `__AQ.hp()` · `__AQ.hs()` | ayuda abierta · ayuda ya vista (chip **!**) |
| `__AQ.jp()` | impulsos de volcán restantes (0–3) |
| `__AQ.tm(n)` | fuerza el temporizador (fin de partida determinista) |
| `__AQ.sw(n)` | **hook de prueba**: salta a la oleada n |
| `__AQ.ts()` | anillos apilados en total |
| `__AQ.n()` | anillos libres/en vuelo |
| `__AQ.xs()` | `x` de los pilares unidos por `\|` — siempre `'288\|672'` en horizontal |
| `__AQ.q.st()` | suma de anillos apilados |
| `__AQ.q.co()` | suma de cargas de bobina |
| `__AQ.q.rr` / `q.p` / `q.m` / `q.v` | arrays vivos: anillos / pilares / monstruos / volcanes |
| `__AQ.q.vp(i)` | `[x, y]` del volcán i (0 = izquierdo, 1 = derecho) |
| `__AQ.q.drop(i)` | **hook de prueba**: teletransporta un anillo libre sobre el pilar i |
| `__AQ.rt(x, y)` · `__AQ.rg()` | **hook de prueba**: coloca/lee el primer anillo libre como `[x, y, vx, vy]` |

Ya **no existen** `__AQ.cn()` ni `__AQ.ca()`: el cañón se eliminó por completo.

### Elegir el nivel

En el menú: **`A` o `←` = FÁCIL** (por defecto), **`D` o `→` = DIFICIL** (también tocando
la caja izquierda/derecha). Después **`Space`** o tocar `JUGAR`.

- **FÁCIL**: rampa gradual; desde la **oleada 6** el banner añade `- DIFICIL`.
- **DIFICIL**: presión máxima desde la oleada 1; banner `OLEADA 1 - DIFICIL`.
- En ambos niveles hay **dos pilares** y **dos volcanes**. **A** y **D** erupcionan el volcán
  izquierdo/derecho solo en la **oleada 1 de ambas dificultades** (3 impulsos, recarga 1/1,7 s).

### Llegar a la oleada 5

Partida real: hay que apilar todos los anillos reales de cada oleada (ver `../README.md`).
Para una pasada rápida determinista:

```text
FÁCIL:   "a" → "Space" → "Space" (cerrar controles)
         → browser_evaluate function="() => { window.__AQ.sw(5); return true; }"
DIFICIL: "d" → "Space" → "Space" → browser_evaluate function="() => { window.__AQ.sw(5); return true; }"
```

Estado esperado: `__AQ.wv() === 5`, `__AQ.xs() === '288|672'`, `__AQ.q.v.length === 2`.
En FÁCIL el banner **no** dice `- DIFICIL` hasta la oleada 6; en DIFICIL lo dice desde la 1.
Los volcanes solo responden a **A/D** en la oleada 1 (ambas dificultades); en la 2+ `__AQ.jp()` no baja.

## Aviso: las propiedades internas están ofuscadas (terser)

El build pasa `terser --mangle-props` con lista blanca: **todas** las claves internas se
renombran (`topY` → `A`, `stack` → `T`…). No leas propiedades directamente:

```js
await browser_evaluate("__AQ.q.p[0].x")   // NO es la x del pilar
```

Usa exclusivamente los métodos de `__AQ` (arriba). Si un evaluate devuelve `undefined` o un
número raro, casi seguro caes en este mangle. Ojo: el mangle incluye `left`, por eso el
código usa `r.right - r.width` para el puntero.

## Honestidad de las pruebas

- `auto_test.js` **prueba mecánicas** (apilado, dos pilares, dos volcanes, ausencia del cañón,
  consola limpia) y usa `sw()` para viajar a la oleada 5. No mide equilibrio ni dificultad.
- `realtime.test.js` usa teclado real: comprueba la inclinación −1…+1, que la rotación está en
  `#sc` (marco) y no en el lienzo, que **A** y **D** gastan impulso y lanzan un anillo
  (vy < −200), y el apilado. Tampoco juzga “sensación”.
- Nadie ha jugado este build en un dispositivo físico; el ajuste de números es de diseño.
  Ver “Notas honestas” en `../README.md`.

## Última corrida registrada (2026-11-13, Windows 11 + Chrome real)

```text
node auto_test.js     → AUTO TEST OK
                         FÁCIL oleada 1: 288|672, 2 volcanes, stack=1, sin hook/estado de cañón
                         FÁCIL oleada 5 y DIFICIL oleadas 1/5: 288|672, 2 volcanes, 0 errores
node realtime.test.js → REALTIME TEST OK
                         controles visibles al empezar; inclinación −1.00 → +1.00;
                         marco rota (rotate(1.64deg) scale(...)) y el lienzo no;
                         A/D lanzan el anillo (vy ≈ −690; impulsos 3→2→1);
                         drop asistido apila 1; DIFICIL 288|672 con 2 volcanes
```

Corrida en vivo con la Playwright MCP (Chrome real, servidor HTTP local):

```text
Menú solo en español · selector FÁCIL/DIFICIL por toque (sin arrancar la partida)
Space → play + panel CONTROLES con fila A D IMPULSO → Space lo cierra
HUD IMPULSO con 3 luces · A y D erupcionan (anillo + partículas) en oleada 1
←/→ giran el MARCO COMPLETO (borde + HUD), en horizontal y en vertical
Con el marco a −5° (scale 0.89), el chip "!" abre la ayuda: el puntero inverso acierta
__AQ.sw(2) → oleada 2 con xs=288|672, 2 volcanes, volcanes ya sin impulsos
Consola: 0 errores del juego (solo "favicon.ico 404" del servidor estático, benigno)
```

Capturas en `shots/`: `realtime-*.png` (incluye `realtime-1b-volcanes.png`),
`facil-*.png`, `dificil-*.png`, las de navegador `browser-1-controles.png`,
`browser-2-tilt-right.png`, `browser-3-volcan-a.png`, `browser-4-volcan-d.png`,
`browser-6-tilt-portrait-left.png` y `browser-10-help-while-tilted.png`, y las de QA en
`../shots/` (`menu-cannonless.png`, `help-start.png`, `pause-panel.png`, `help-en.png`,
`wave2-play.png`, `chip-open2.png`, `pause-click.png`).