# AQUARING // MAREA VIVA

Arcade de pesca de anillos en un acuario retro. Un solo archivo, sin recursos externos:
todo el HTML, CSS, JavaScript y los gráficos (canvas 2D) están dentro de `index.html`.

## Entregable

`index.html` (raíz del repo) — **31 519 bytes** (97,3 % del tope de 32 400 B; 96,2 % de la
rebanada dura de 32 KB = 32 768 B; objetivo de 32 000 B: **cumplido**, con 481 B de margen).
`node tools/build.mjs` sale con código 1 si se supera el tope de 32 400 B e imprime además
una línea informativa `meta 32 000 B ok / por encima`.

Esta versión **no tiene cañón**: se eliminaron el cañón, sus teclas (W/S/E/F), la absorción y
la munición. Los **dos volcanes** vuelven a ser parte del juego con **A** (izquierdo) y **D**
(derecho) **en la oleada 1 de ambas dificultades**, y los **dos pilares** están siempre presentes.

El juego es **solo en español**: se quitaron la fila ES/EN del menú, la tecla `L`, el estado
`G.lang`, `setLang` y el `localStorage` de idioma, junto con toda la maquinaria de traducción.
La tabla de textos conservó los índices de llamada, así que ningún sitio cambió de número.

## Cómo jugar

- **Menú**: solo texto, sin cajas ni bordes — `A` / `←` = FÁCIL (por defecto), `D` / `→` =
  DIFICIL (el activo resplandece). **Space** / **Enter** / tocar fuera de las zonas empieza.
- **Ventana de controles animada**: aparece al empezar la partida y al pausar. Muestra una
  mini pecera inclinándose, un pilar con anillos apilados y un volcán con arcos de impulso,
  además de las teclas que laten: `A D IMPULSO` (solo oleada 1), `← → INCLINA`,
  `P/ESC PAUSA`, `M MUDO`. Se cierra con **cualquier tecla o un toque**. El chip **!** de la
  esquina inferior derecha la reabre.
- **← / →** inclinan **el marco completo** (marco, HUD y agua giran como una sola pieza).
  **A** erupciona el volcán izquierdo y **D** el derecho (mantén para cargar, suelta para
  eruptar). **P** / **Esc**: pausa (misma ventana, título `PAUSA`; tocar en cualquier sitio
  reanuda). **M**: silencia. **R**: reinicia al terminar.
- **FÁCIL**: rampa gradual; desde la **oleada 6** el banner añade `- DIFICIL` y la presión es
  la de Difícil. **DIFICIL**: presión máxima desde la oleada 1.
- Temporizador por oleada (FÁCIL): 60 / 58 / 54 / 50 / 46 / 42 / 38 / 34 / 30 s (tope 30).
  DIFICIL (elegido en el menú): 46 / 42 / 38 / 34 / 30 s (tope 30 desde la oleada 5).

## Mecánicas

- Los anillos aparecen **pre-colocados sobre la grava** al empezar la oleada; la inclinación
  del agua los lleva hacia los pilares. Al engancharse se apilan y suman puntos.
- **Dos pilares siempre** (horizontal `288 / 672`, vertical `200 / 500`): no hay pilar
  central ni layout especial por dificultad.
- **Protector eléctrico (las DOS testas)**: cada **3 anillos apilados** (o combo de 8) carga
  **las 6 luces de ambas bobinas** y muestra `PROTECTOR x2`, en FÁCIL y en DIFICIL por igual.
  Una bobina con carga electrocuta a todos los monstruos a su alcance **menos al cangrejo**
  (~480 px) y protege a la otra testa. Cada electrocución consume 1 carga por testa. El HUD
  del pilar dibuja siempre 6 luces: encendidas = cargas restantes.
- **Recompensa por muerte**: 0, 1 o 2 s aleatorios (nunca fijos, nunca +3 s), con tope 99 s.
  El popup muestra el valor real: `+300 ¡ZAP! +1s`, `¡GLOBO! +0s`…
- **Oleadas**: hay que apilar **todos los anillos reales**; **las bombas no cuentan**.
  Oleada 1 = exactamente 10 anillos reales (+3 por oleada, tope 23) más `1 + oleada`
  bombas (tope 9); hasta `1 + ⌊oleada/3⌋` reales se vuelven **dorados** (500 pts).
  Al llegar a 0 salta `OLEADA N COMPLETA +bonus` (500×oleada + 10×segundos restantes) y la
  siguiente empieza en ~0,45 s. El HUD muestra `FALTAN N` (solo reales). Si una bomba apilada
  explota, sus anillos reales de cima vuelven al suelo.
- **Cada oleada es otro lugar**: el agua rota 42° de tono, vegetación/corales/peces 31° y
  enemigos 62°; la música sube +2 semitonos por oleada (tope +12). Las oleadas son infinitas.
- **¡COMBO LOCO!**: cada 8 de combo sin romper la racha da un `PROTECTOR x2` gratis.
  El anillo dorado vale 500 puntos (normal 100); dorado perfecto = 500 + 150×multiplicador.
- **Monstruos** (aviso corto antes de aparecer):
  - Cangrejo: **inmune a las testas**. Entra por la grava, sube por el fuste y se lleva
    hasta 3 anillos de la cima. El anillo robado reaparece libre 2 s después (`¡DE VUELTA!`)
    y cada bocado **chupa 1 s** del temporizador (`-1s`, barra pulsando).
    **La onda de los volcanes lo asusta y huye** (sale disparado fuera de la pantalla).
  - Pez globo: primera tanda a los 5–6 s; después cada **10 s en FÁCIL oleada 1** y **7 s**
    en el resto (DIFICIL o FÁCIL oleada 2+). Tandas de 1–2 (tope 2). Se infla al acercarse
    al pilar y al chocar suelta 1–2 anillos de la cima (`¡GLOBO! +0s..+2s`).
  - Tiburón: derriba **solo los 2 anillos de la cima** (−4 s).
  - Tope de 12 monstruos en pantalla; cada tanda de muertes llama como máximo a 2 nuevos.
- **Bombas**: cuerpo casi negro con **núcleo rojo pulsante** (r×0,68 oscuro + r×0,46 que
  parpadea + r×0,18 central); los reales son huecos con un arco blanco y los dorados brillan.
  Apiladas explotan a los 2,4 s: −3 s, expulsan 2 anillos de la cima y reinician combo/multiplicador.
- **Volcanes (A/D)**: solo en **oleada 1** (ambas dificultades). Empiezas con **3 impulsos**
  y recuperas 1 cada 1,7 s (máx. 3); el HUD muestra `IMPULSO` con tres luces. Mantén **A** o
  **D** para cargar (0,75 s a tope) y suelta: una onda radial empuja los anillos cercanos y
  los monstruos cercanos — **incluido el cangrejo, que huye** — y da un fuerte impulso
  vertical (`pw = 1 + carga × 1,3`, radio `215 × pw`). En la oleada 2+ los volcanes vuelven
  a ser decorativos.
- **Física de anillos**: gravedad de aire 1230 px/s², de agua 560 px/s²; al cruzar la
  superficie con `vy > 170` frenan (`vy *= 0.55`) y salpican. Rebotes de pared 0.3/0.5 y
  de fondo 0.16/0.36 (mojado/aire).
- Rondas con temporizador, combo y multiplicador; al acabar, rango S/A/B/C y récord en
  `localStorage`.

## Ambiente visual (esta ronda)

- **Rayos de luz**: 6 haces verticales con gradiente propio, vaivén lateral, ancho variable y
  brillo pulsado, dibujidos con composición `lighter`; dentro de ellos derivan 8 motas de
  polvo.
- **Cáusticas**: 3 bandas claras que se deslizan lentamente sobre la grava.
- **Burbujas**: sin tocar (ya estaban perfectas).
- Enemigos: sin cambios esta ronda (el presupuesto se gastó en luz y ambiente).

## Controles táctiles

En el menú, tocar la zona de `FÁCIL`/`DIFICIL` elige dificultad y tocar fuera de ellas empieza.
Durante la partida: tocar el chip **!** abre/cierra la ayuda, tocar el botón de pausa de la
esquina superior derecha pausa, y **cualquier toque** reanuda cuando está en pausa o cierra la
ventana de controles cuando está abierta. La inclinación es solo por teclado (←/→); el mapeo
del puntero deshace el giro y la escala del marco, así que los toques siguen cayendo donde se
ven incluso con el marco inclinado.

## Diseño y tamaño en pantalla

- Canvas adaptativo: horizontal `960 × 686`, vertical `800 × 1250`.
- En horizontal ocupa el 75 % del ancho, centrado, con laterales arcade deep-sea; en
  vertical llena el 100 % (100 vw × 100 vh).
- Estética retro CRT (scanlines + viñeta), marco con neón, sin imágenes ni fuentes externas.
- Menú solo texto (sin cajas/bordes): `AQUARING` con halo, `JUGAR` con `ESPACIO` debajo y
  `FÁCIL`/`DIFICIL`; el activo brilla, el resto se atenúa. Solo español.
- Música chiptune tensa (modo frigio: Mi–Fa–Sol–Si, 98 BPM, bajo galopante y arpegio) y
  efectos sintetizados con Web Audio (sin archivos).

## Compilar y verificar

```sh
node tools/build.mjs       # esbuild + terser; falla si index.html > 32 400 B
node tools/smoke.mjs       # DOM/Canvas/WebAudio simulados: controles, apilado, monstruos, audio
node tools/camtest.mjs     # sin cañón: dos pilares, A/D, marco entero y rampa 6
node tools/wavetest.mjs    # la oleada se completa (1 -> 2) en FÁCIL
node tools/wavetest.mjs --hard   # ídem en DIFICIL
node tools/ringtest.mjs    # composición de oleadas 1-3: reales/bombas/oro/FALTAN/colores
node tools/ringtest.mjs --hard   # ídem en DIFICIL
node tools/coiltest.mjs    # 6 cargas por torre (12 en total) al apilar, en ambas dificultades
node tools/coiltest.mjs --hard
node tools/volctest.mjs    # DIFICIL oleada 1: A/D gasta un impulso, anillo vuela, cangrejo huye
node tools/lefttest.mjs    # FALTAN solo cuenta anillos reales (10 -> 0)
node tools/aqshot.mjs play # captura CDP real (menu|menuhard|hardrun|hardwave5|play|wave5|help)
node tools/shot.mjs desktop-menu
node tools/cdpshot.mjs
```

`index.html` se regenera desde `index.template.html` + `src/`. Las capturas de partida se
hacen con CDP y frames de reloj real (`aqshot.mjs`), que permiten pulsar teclas reales
antes de la foto.

### Resultado de las verificaciones (2026-11-13, en la raíz del repo)

- `build.mjs`: exit 0 — **31 519 B / 32 400 B** (97,3 %; JS 30,28 KB + CSS 0,26 KB +
  HTML 0,24 KB; meta informativa 32 000 B: ok).
- `smoke.mjs`: `SMOKE OK` — el guard rechaza un `index.html` que no sea nuestro build por el
  marcador monolingüe `PUNTOS|OLEADA`; la ventana `CONTROLES` sale al empezar y se cierra con
  una tecla; pausa dibuja `PAUSA` y reanuda; audio, inclinación, apilado (10 anillos),
  monstruos, zaps con recompensas 0–2 s, reinicio con `R` y renderer activo.
- `camtest.mjs`: `>>> SIN CAÑÓN + CONTROLES OK` — `288|672` en oleadas 1, 2, 5, 6 y 50;
  dos volcanes siempre; **A** y **D** gastan un impulso y lanzan un anillo (vx/vy medidos);
  en la oleada 2 los volcanes ya no gastan impulsos; **la rotación se aplica al marco**
  (`#sc`) y no al lienzo; W/S/E/F no alteran el juego; sin estado `can`/`canA`; la ayuda
  no se reabre en la oleada 2; `OLEADA 5` sin `DIFICIL` y `OLEADA 6/50` con `DIFICIL`.
- `wavetest.mjs` (FÁCIL y `--hard`): oleada 1 apilada 10/10 → banner
  `OLEADA 1 COMPLETA +1047` (FÁCIL) y `+917` (DIFICIL) → **avanzan a la oleada 2**.
- `ringtest.mjs` (FÁCIL y `--hard`): `>>> RINGTEST OK` — oleada 1 = **10 reales**
  (normal + oro) + **2 bombas** `#ff4d6d`; oleada 2 = 13 + 3; oleada 3 = 16 + 4; el oro
  `#ffd166` nunca supera `1 + ⌊n/3⌋`; los normales son solo la paleta `#5ef2d6 #57b8ff
  #b784ff #ffc857 #ff7b9c #9bf6ff`; el HUD dibuja `FALTAN 10` (y 13, 16…).
- `coiltest.mjs` (FÁCIL y `--hard`): `>>> COILTEST OK` — tras 6 anillos apilados
  (2×`PROTECTOR`), **12 cargas totales (6 por torre) en FÁCIL y en DIFICIL**.
- `volctest.mjs`: `>>> VOLCTEST OK` — **DIFICIL oleada 1**: `A` carga y suelta → impulsos
  3 → 2, anillo con `vy = −854`; el cangrejo (modo `walk` antes) pasa a `flee` al detonar
  un impulso junto a él; **DIFICIL oleada 2**: mantener `A` no gasta impulsos (3 → 3) y el
  anillo no despega.
- `lefttest.mjs`: oleada 1 completada y avance a la 2.
- **`test_agent/`**: `auto_test.js` (Chrome real) → `AUTO TEST OK` con FÁCIL y DIFICIL,
  dos pilares en oleadas 1 y 5, dos volcanes, apilado real y cero errores de consola.
  `realtime.test.js` → `REALTIME TEST OK`: controles al empezar, inclinación real
  −1.00 → +1.00, **marco completo rotando**, **A/D lanzan el anillo** (vy ≈ −726/−650),
  apilado real y DIFICIL de dos pilares.
- Navegador real (Playwright MCP, servidor local `python -m http.server 8412` en la raíz):
  menú **solo español** (`JUGAR`, `ESPACIO`, `FÁCIL`/`DIFICIL`, sin fila de idioma), HUD
  `PUNTOS`/`OLEADA`/`FALTAN`/`TIEMPO`; partida con rayos de luz visibles; tras 3 anillos
  apilados medidos `coil = 12` (6 luces por torre) con banner `PROTECTOR x2`. La medición
  en vivo congela el reloj y vacía monstruos para aislar la concesión; `coiltest.mjs` es
  la autoridad headless.

## Estructura

```
index.template.html   carcasa HTML (canvas + marcos CRT/laterales)
src/config.js         constantes, colores, atajos matemáticos
src/state.js          estado, tabla de textos en español, layout responsive, oleadas, volcanes A/D, monstruos
src/game.js           entrada, física de anillos, monstruos, colisiones, erupciones
src/audio.js          música chiptune y efectos (Web Audio, sin assets)
src/render.js         render canvas 2D (tanque, rayos, cáusticas, peces, corales, HUD, menú, controles)
src/main.js           arranque, bucle RAF, hook de depuración window.__AQ
tools/build.mjs       build + minificado + control de 32 400 B (meta informativa 32 000 B)
tools/smoke.mjs       smoke test de mecánicas y de la ventana de controles
tools/wavetest.mjs    fin de oleada (wave 1 -> 2), admite --hard
tools/ringtest.mjs    composición y colores de anillos por oleada, admite --hard
tools/coiltest.mjs    6 cargas por torre en ambas dificultades, admite --hard
tools/volctest.mjs    DIFICIL: impulsos A/D y cangrejo asustado
tools/lefttest.mjs    FALTAN solo cuenta anillos reales
tools/camtest.mjs     verificación sin cañón: pilares, A/D, marco entero y rampa
tools/aqshot.mjs      capturas CDP con frames reales
tools/cdpshot.mjs     capturas CDP (pila + bobina)
tools/cdpcrab.mjs     captura CDP del cangrejo mordiendo la barra de tiempo
test_agent/           pruebas E2E en Chrome real (auto_test.js, realtime.test.js, README.md)
shots/                capturas de QA generadas
game_desinger_v2/     copia antigua congelada (no tocar; la fuente es la raíz)
```

## Notas honestas

- **No se ha probado en un dispositivo físico**: la verificación es build + harness headless
  + Chrome real de escritorio vía Playwright. No hay playtest humano ni juicio de “sensación”.
- **ES único**: se eliminó la i18n completa (fila del menú, `KeyL`, `setLang`, `G.lang`,
  `aqua_lang`). Los índices de la tabla española se dejaron donde estaban para no renumerar
  llamadas; el slot 20 (`IDIOMA`) quedó huérfano (~10 B) porque renumerar no compensa.
- **Testas unificadas**: antes FÁCIL daba +3/tope 6 y DIFICIL +2/tope 4; ahora **ambos modos**
  conceden las **6 cargas** por torre al completar 3 apilados (o combo de 8), y el HUD dibuja
  siempre 6 luces. Verificado en headless (`coiltest.mjs`, 12/12) y en navegador (12 en vivo).
- **Bug corregido en esta ronda**: la zona de toque de dificultad del menú seguía en `sy+102`
  mientras el texto se dibujaba en `sy+138`; ahora coinciden (`my = sy + 138`).
- **Ambiente**: se añadieron 6 haces de luz con vaivén y brillo pulsado, 8 motas de polvo y
  3 bandas de cáusticas sobre la grava; las burbujas no se tocaron.
- **Ronda anterior (1)**: los impulsos A/D solo estaban habilitados en FÁCIL
  (`!G.hard && wave < 2`) en tres sitios (carga en `game.js`, pips del HUD y fila `A D` de
  los controles en `render.js`); en DIFICIL no hacían nada. Ahora dependen solo de
  `wave < 2` (ambas dificultades) y está verificado en headless y en navegador.
- **Ronda anterior (2)**: `erupt()` solo empujaba anillos; ahora también pone
  a los monstruos de la zona en `flee` (el cangrejo sale disparado). Verificado en headless.
- **Bug real corregido en ronda anterior (3)**: el mangle de propiedades de terser incluye
  `left`, así que `getBoundingClientRect().left` se convertía en `undefined` y el puntero
  daba `NaN`. `toCanvas()` usa `r.right - r.width`.
- **Bug real corregido en ronda anterior (4)**: la inclinación se aplicaba dentro del canvas;
  ahora el CSS transform va en `#sc` (marco + HUD) y el puntero invierte ese giro.
- **Mangle de propiedades**: todas las claves internas de los objetos del juego se renombran.
  Para pruebas externas usa solo `window.__AQ` (ver `test_agent/README.md`); nunca leas
  `p.x` directamente. Las claves `kind`, `mode`, `col`, `left`, `stack`, `hard` están
  mangling; los tests las detectan por valor (p. ej. `Object.values(m).includes('crab')`).
- El equilibrio (tiempos, cadencia de monstruos, bonus) es una decisión de diseño sin
  playtest; el temporizador y la dificultad están pensados para ajustarse a mano.
