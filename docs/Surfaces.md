# Plan: hallazgos por superficie

Plan de trabajo para ver y registrar hallazgos por superficie dental y dar una
referencia visual de cada superficie. Está organizado en versiones
independientes que se pueden probar y comparar en el playground antes de
decidir la interacción definitiva.

## Punto de partida

Ya implementado (fases D y E):

- **Diagrama de superficies:** 5 superficies por pieza con `show-surfaces`,
  rotado con el arco. Los nombres clínicos se adaptan a la pieza: incisal en
  incisivos y caninos, palatino en piezas superiores.
- **Selección de superficies:** `v-model:surfaces` y el evento
  `surface-click`, independientes de la selección de piezas.
- **Hallazgos de superficie:** `findings` con `surfaces`, formas `fill`
  (relleno) y `outline` (contorno), `status` (`existing`, `planned`, `done`) y
  `color` propio. Se muestran en el tooltip y en el nombre accesible.

Falta:

1. Una forma cómoda de **ver y registrar** los hallazgos de cada superficie.
2. Una **referencia visual** que explique qué es cada superficie.

La librería solo dibuja y emite eventos. Guardar los datos y aplicar las
reglas clínicas sigue siendo responsabilidad de Odonto Pro.

## Alternativas

| | A. Cada superficie con su hallazgo (en línea) | B. Panel de la pieza (inspector) |
| --- | --- | --- |
| Interacción | Clic en una superficie del gráfico: se abre un menú junto a ella para elegir hallazgo y estado. | Clic en una pieza: un panel muestra su diagrama grande con los hallazgos de cada superficie. |
| Ventajas | Pocos clics; el registro queda en contexto. | Espacio para leer y editar, cómodo en pantallas táctiles, muestra todo lo guardado de la pieza. |
| Desventajas | Los diagramas son pequeños (difíciles de tocar), el menú tapa el gráfico, cuesta mostrar el historial. | Un paso más; la atención se reparte entre gráfico y panel. |
| Encaje en la librería | Slot `#surface-menu` posicionado en la superficie; la aplicación pone el contenido. | Componente `ToothInspector` que recibe la pieza y sus datos y emite eventos; la aplicación guarda. |

**C. Híbrida:** el gráfico sirve para navegar y marcar superficies, el panel
(B) para leer y editar, y el tooltip para un resumen rápido. Es el resultado
más probable, pero conviene probar A y B por separado antes de combinarlas.

## Referencia visual por superficie

Componente `SurfaceGuide`, compartido por todas las alternativas:

- **Diagrama grande de la pieza activa**, con las letras de cada superficie.
  Tiene la misma orientación que en el gráfico (en 21 la mesial queda a la
  izquierda, en 11 a la derecha), para que lo que se ve en el panel coincida
  con el odontograma.
- **Resaltado:** al pasar el cursor o enfocar una superficie, se resalta y se
  muestra su definición, adaptada a la pieza ("Palatina" en superiores,
  "Incisal" en anteriores).
- **Textos traducibles:** nuevos `labels.surfaceDescriptions` y
  `labels.surfaceLetters`.
- **Opcional:** prop `show-surface-letters` para dibujar las letras en el
  diagrama del gráfico. Es probable que solo se lean en `horizontal` o con
  zoom.

Definiciones de referencia:

| Letra | Superficie | Definición |
| --- | --- | --- |
| V | Vestibular | Cara que mira hacia los labios o las mejillas (afuera). |
| L / P | Lingual / Palatina | Cara que mira hacia la lengua (en dientes inferiores) o hacia el paladar (en dientes superiores). |
| M | Mesial | Superficie que está más cerca de la línea media de la boca. |
| D | Distal | Superficie que se aleja de la línea media de la boca. |
| O / I | Oclusal / Incisal | Superficie de masticación (en molares y premolares) o el borde filoso de corte (en incisivos y caninos). |

## Versiones

Cada versión es independiente y se activa en el playground con
`?surfaceUi=...`, para compararlas con el mismo conjunto de datos.

### V0: base de datos, sin interfaz

**Estado: completada (2026-09-29).** Implementada en
`src/utils/finding-records.ts` y en `layoutFindings`, con pruebas en
`tests/finding-records.test.ts`. Detalle en [Resultado de V0](#resultado-de-v0).

Todo lo demás depende de esta versión.

- **Funciones puras sobre `findings`**, en la misma línea que
  `toggleSurface`:
  - `getToothRecord(toothId, findings)`: agrupa los hallazgos de una pieza
    por superficie, más los de pieza completa.
  - `addSurfaceFinding` y `removeSurfaceFinding`: devuelven una lista
    `findings` nueva, sin mutar la original.
- **Dos hallazgos en la misma superficie** (por ejemplo, caries y
  restauración en la oclusal): hoy gana el último. Propuesta: `fill` debajo y
  `outline` encima; si hay dos `fill`, dividir la superficie en dos mitades.
- Solo tests.

### V1: referencia visual

**Estado: completada (2026-09-29).** Detalle en
[Resultado de V1](#resultado-de-v1).

- `SurfaceGuide` tal como se describe arriba.
- Demo en el playground junto al gráfico, siguiendo la pieza seleccionada.

### V2: alternativa A (en línea)

**Estado: completada (2026-09-29).** Detalle en
[Resultado de V2](#resultado-de-v2).

- Slot `#surface-menu` con `{ toothId, surface, record, close }`, que se abre
  al hacer clic en una superficie.
- El playground implementa el menú: hallazgos de superficie del catálogo más
  un selector de estado. Guarda en un `ref` local.
- Teclado: `Enter` abre el menú y `Esc` lo cierra.

### V3: alternativa B (panel)

**Estado: completada (2026-09-29).** Detalle en
[Resultado de V3](#resultado-de-v3).

- Componente `ToothInspector` con `tooth`, `findings`, `toothStates` y
  `catalog`.
  - Muestra el `SurfaceGuide` y la lista de hallazgos por superficie y de la
    pieza completa, con su estado.
  - Emite `add-finding` y `remove-finding`; la aplicación decide si se
    guarda.
- Se conecta con `single-select`: al seleccionar una pieza, el panel se
  actualiza.

### V4: híbrida y decisión

**Estado: completada (2026-09-29).** Detalle en
[Resultado de V4](#resultado-de-v4).

- Combinar lo que funcione mejor de V2 y V3.
- Añadir el resumen por superficie en el tooltip.
- Documentar la opción elegida en el README.

## Resultado de V0

- `getToothRecord(toothId, findings, catalog?)` devuelve `surfaces` (los
  hallazgos de cada superficie, en orden de la lista) y `tooth` (los de pieza
  completa, entre dos piezas, los tramos que cubren la pieza, calculados por
  orden FDI, y los códigos desconocidos). Cada entrada lleva `index`,
  `finding`, `definition` y `scope`.
- `addSurfaceFinding(findings, { code, toothId, surfaces, status?, tone?, color? })`
  fusiona las superficies en un hallazgo igual de la misma pieza (mismo
  código, estado, tono y color, y solo en esa pieza). Si no lo hay, añade uno
  nuevo al final.
- `removeSurfaceFinding(findings, { index, toothId, surface? })` quita una
  superficie o, sin `surface`, quita el hallazgo de toda la pieza:
  - Un hallazgo compartido con otras piezas se divide, y las demás lo
    conservan.
  - Un hallazgo sin superficies cuenta como las cinco.
  - Cuando no quedan superficies, el hallazgo se elimina.
  - `index` debe venir de un `getToothRecord` sobre la misma lista.
- **Dibujo** (se aplicó la propuesta de la decisión 3):
  - **Orden:** los `outline` se dibujan encima de todos los rellenos.
  - **Varios `fill` en una superficie:** la superficie se divide en franjas
    iguales, una por hallazgo, en el orden de la lista. En vestibular,
    lingual y oclusal las franjas van de mesial a distal; en mesial y distal,
    de vestibular a lingual.
- **Observado:** un contorno rojo sobre un relleno rojo (por ejemplo,
  restauración temporal sobre caries) apenas se distingue. Es una cuestión de
  colores del catálogo, a revisar con V1.

## Resultado de V1

- **`SurfaceGuide`** (`src/components/SurfaceGuide.vue`, exportado):
  - **Diagrama:** diagrama grande de `toothId`, con la orientación del
    gráfico en `horizontal`. La vestibular queda hacia fuera (arriba en
    superiores, abajo en inferiores) y la mesial hacia la línea media. En
    `arch` los diagramas del gráfico siguen la curva; la guía mantiene
    siempre esta orientación fija, que es la de la ficha.
  - **Letras y lista:** letras dentro del diagrama y, al lado, la lista de
    las 5 superficies con nombre, definición y los hallazgos registrados en
    cada una.
  - **Resaltado:** pasar el cursor o enfocar una superficie la resalta en el
    diagrama y en la lista, y emite `update:active`. `active` también se
    puede fijar desde fuera, para sincronizarlo con el gráfico.
  - **Hallazgos:** con `findings`, dibuja los hallazgos de superficie de la
    pieza con las mismas franjas y el mismo orden que el gráfico
    (`layoutToothSurfaceFindings`).
  - **Selección:** `selected` marca superficies seleccionadas; un clic en el
    diagrama o en la lista emite `surface-click`. La lista es de botones
    enfocables con `aria-pressed`.
- **`show-surface-letters`** en `Odontogram`: dibuja la letra de cada
  superficie sobre los diagramas del gráfico, por encima de los hallazgos.
  En pantallas estrechas las letras quedan pequeñas.
- **Textos nuevos:** `labels.surfaceLetters`, `labels.surfaceDescriptions` y
  `labels.surfaceGuide`. Las letras por defecto son V, M, O/I, D y L/P.
- **Playground:** casillas "Guide" y "Surface letters", y el selector
  "Language" (English o Español; en español, con las definiciones de este
  documento). En la URL, `?lang=es` elige el idioma y `?select=36`
  preselecciona una pieza para la guía. En `arch` la guía va en una columna
  a la derecha del gráfico; en `horizontal`, debajo, con el diagrama a la
  izquierda y el detalle a la derecha. La lista de la guía se reparte en
  varias columnas cuando hay espacio.
- **Margen de los diagramas** (ajuste posterior a V1): el diagrama se
  separa de la circunferencia de corona (el símbolo más ancho sobre una
  pieza) y no solo del contorno, más 3 unidades de margen (`surfaceMargin`).
  Las siglas y los tramos se separan también 3 unidades del diagrama. En la
  mixta horizontal, la banda entre filas pasó de 58 a 80 unidades para que
  las siglas temporales no pisen los números permanentes.
- **Arco de diagramas** (ajuste posterior a V1): la distancia de cada
  diagrama a su pieza se suaviza a lo largo de la fila. Ninguna pieza queda
  por debajo de su distancia mínima, y entre vecinas la distancia cambia
  como mucho un 12 % del lado del diagrama. Así los diagramas de 15 y 16
  siguen la curva que marcan 14 y 17, en vez de saltar hacia fuera junto al
  primer molar, que es más grande.
- **Curva en los primeros molares** (ajuste posterior a V1): la propia
  arcada gira bruscamente en 16, 26, 36 y 46, y los diagramas, al estar más
  lejos, lo amplificaban (17° en 16 frente a 11° de las piezas). En `arch`,
  el diagrama que sobresale más que sus dos vecinos de cada lado se acerca a
  su pieza hasta la curva suave (spline Catmull-Rom) que pasa por esos
  vecinos. Puede renunciar al margen de corona, pero nunca al contorno de la
  pieza. En la práctica solo afecta a los primeros molares. `horizontal`
  no cambia.
- **Canino temporal** (ajuste posterior a V1): el arco temporal provisional
  gira 32° en el canino, y el diagrama de 53 formaba ahí un codo (giro de
  30° entre 19° en 52 y 16° en 54). En `arch`, el diagrama de cada canino
  temporal (53, 63, 73, 83) se coloca, sobre la recta que sale de su pieza,
  a la distancia en la que el giro de la curva cambia de forma más pareja
  desde el incisivo central hasta el primer molar. Queda en 24°, entre 23°
  en 52 y 19° en 54. Puede acercarse a su pieza, nunca sobre su contorno.
- **Comparación con las piezas:** "Surface path" dibuja además, en celeste
  discontinuo, la línea que une los centros de las piezas, como referencia
  para la línea roja de los diagramas.
- **Filas alineadas en `horizontal`** (ajuste posterior a V1): todos los
  diagramas de una fila quedan sobre una misma línea, a la altura que marca
  la pieza que más espacio necesita. Ninguno se acerca a su pieza más de lo
  necesario; los de piezas más bajas quedan algo más separados. Las piezas
  no se mueven. Aplica también a las cuatro filas de la mixta horizontal.
- **Depuración:** la casilla "Surface path" del playground (`?surfacepath`)
  une los centros de los diagramas de cada fila con una línea. El slot
  `overlay` recibe `surfaceDiagrams` para dibujar este tipo de ayudas.
- **Tooltip de superficies:** con `showTooltip`, pasar el cursor o
  enfocar una superficie del gráfico muestra la pieza, la superficie, su
  definición, los hallazgos de esa superficie y si está seleccionada. El
  slot `tooltip` recibe `surface` y `surfaceName`. Nueva etiqueta
  `labels.surface`.
- **Esquinas redondeadas:** el diagrama cuadrado redondea las esquinas del
  cuadrado exterior y del central (radio del 22 % del medio lado). Las
  diagonales terminan en el punto medio de cada esquina.
  Corregido después: al unir las dos mitades de cada lado se perdía un
  punto, así que las superficies quedaban asimétricas y sus letras
  desalineadas (V fuera del eje, M y D a distinta altura). Ahora V, O y L
  quedan en una misma columna y M, O y D en una misma fila, igual que en el
  círculo.
- **Forma circular:** prop `surfaceShape` (`'square'` o `'circle'`) en
  `Odontogram` y `shape` en `SurfaceGuide`. El círculo tiene cuatro sectores
  y un círculo central, con las mismas posiciones, franjas, letras y
  separaciones que el cuadrado. En el playground: selector "Surface shape"
  (`?shape=circle`).
- **Observado:** el añil de la selección (`#6366f1`) se confunde con el azul
  de los hallazgos en buen estado (`#1d4ed8`) cuando ambos aparecen en el
  mismo diagrama. Propuesta para V2/V3: mostrar la selección como contorno
  en lugar de relleno cuando haya hallazgos.

## Resultado de V2

- **Slot `#surface-menu` en `Odontogram`**, con `{ toothId, tooth, surface,
  surfaceName, record, close }`. `record` es el `ToothRecord` de V0 y se
  recalcula cuando cambian los `findings`, así el menú muestra al instante
  lo que la aplicación añade o quita.
- **Apertura:** con el slot, un clic, `Enter` o `Espacio` sobre una
  superficie abre el menú en lugar de alternar la selección. `surface-click`
  se sigue emitiendo, con el modelo de superficies sin cambios. Las
  superficies pasan de `checkbox` a `button` con `aria-haspopup="dialog"` y
  `aria-expanded`.
- **Menú:** panel flotante (`role="dialog"`, nombre accesible "Surface
  findings: Tooth 36, Occlusal", texto en `labels.surfaceMenu`). Se coloca
  debajo de la superficie, encima si no cabe, y siempre dentro de la
  ventana. Al abrirse enfoca su primer control y oculta el tooltip.
- **Cierre:** con `close()`, `Esc` o un clic fuera del menú. Con `close()` y
  `Esc` el foco vuelve a la superficie. También se cierra si su pieza deja
  de dibujarse.
- **No se abre** en gráficos `disabled` ni en piezas `missing` o `extracted`.
  Sin el slot, todo sigue como en V1.
- **Tema:** `--odontogram-surface-menu-bg`, `--odontogram-surface-menu-fg` y
  `--odontogram-surface-menu-border`.
- **Playground:** selector "Surface UI" (Selection o Inline menu,
  `?surfaceUi=inline`). El menú lista los hallazgos de la superficie con un
  botón para quitarlos y permite añadir uno de superficie del catálogo
  (caries, restauración, restauración temporal) con su estado. Los hallazgos
  se guardan en un `ref` local que empieza con los ejemplos de la dentición.
  `?open=36:occlusal` abre un menú al cargar, para revisiones visuales.
- **Para comparar con V3:** registrar caries en oclusal y distal de 36
  lleva 6 clics (superficie, hallazgo, añadir; dos veces). El menú tapa
  parte del gráfico mientras está abierto y solo muestra una superficie a la
  vez.

## Resultado de V3

- **`ToothInspector`** (`src/components/ToothInspector.vue`, exportado),
  con `toothId`, `findings`, `findingCatalog`, `toothStates`, `labels`,
  `notation`, `shape` y `disabled`.
  - **Cabecera:** pieza (en la notación elegida), tipo (`getToothType`,
    nuevo) y estado si no es `present`.
  - **Diagrama:** el de `SurfaceGuide` sin su lista de texto (nueva prop
    `showList`), con los hallazgos dibujados. Un clic en sus superficies
    las elige para el siguiente hallazgo.
  - **Hallazgos por superficie:** solo las superficies con hallazgos, cada
    uno con su estado y un botón para quitarlo de esa superficie.
  - **Pieza completa:** hallazgos de pieza, entre dos piezas y tramos que la
    cubren. Solo se pueden quitar los de la propia pieza; los tramos y los
    de dos piezas se muestran pero se quitan desde sus piezas.
  - **Formulario:** hallazgo del catálogo, agrupado en "sobre superficies"
    y "en la pieza completa" (no se ofrecen tramos ni pares), más el estado.
    Los de superficie exigen elegir superficies antes; en piezas `missing`
    o `extracted` no se pueden elegir.
  - **Eventos:** `add-finding` con un `ToothFindingInput` y
    `remove-finding` con un `SurfaceFindingRemoval`. La aplicación guarda
    con `addFinding` (nuevo: fusiona superficies o añade el hallazgo de
    pieza) y `removeSurfaceFinding`.
  - **Textos:** `labels.inspector` (título, secciones, botones, pistas).
  - **Solo lectura:** con `disabled` no se muestran el formulario ni los
    botones para quitar.
- **Playground:** opción "Panel" en "Surface UI" (`?surfaceUi=panel`).
  Activa la selección simple, así que el panel sigue a la pieza
  seleccionada. Va a la derecha en `arch` y debajo en `horizontal`, con los
  textos en español cuando Language es Español.
- **Para comparar con V2:** registrar caries en oclusal y distal de 36
  lleva 4 clics (pieza, O, D, Añadir), frente a 6 del menú. El panel
  muestra todo lo registrado en la pieza a la vez, incluidos los hallazgos
  de pieza completa, y no tapa el gráfico. A cambio, hay que mirar a dos
  sitios y, en `arch`, ocupa una columna.

## Resultado de V4

- **Decisión:** la opción recomendada es la **híbrida**: el panel de la
  pieza (V3) manejado también desde el gráfico. Toma de V3 la vista
  completa de la pieza, el formulario y que no tape el gráfico; de V2, que
  se trabaja directamente sobre el odontograma. El menú en línea (V2) queda
  disponible como alternativa, por ejemplo para pantallas sin espacio para
  el panel.
- **Sincronización:** `ToothInspector` acepta `selectedSurfaces` con
  `v-model:selected-surfaces`. En el modo híbrido se enlaza con
  `surfaces[toothId]` del `v-model:surfaces` del gráfico: un clic en una
  superficie del odontograma selecciona su pieza (selección simple) y marca
  la superficie en el panel, y lo que se elige en el panel se ve en el
  gráfico. Controlado desde fuera, el panel no borra la elección al cambiar
  de pieza. Sin la prop, sigue funcionando por su cuenta como en V3.
- **Tooltip:** al pasar por una pieza, el tooltip separa los hallazgos de
  pieza completa (línea `Findings`) de un resumen por superficie (bloque
  `Surfaces`, una línea por superficie con hallazgos: `M Mesial: Caries…`).
  El slot `tooltip` recibe `surfaceSummary`. Nueva etiqueta
  `labels.surfaceSummary`.
- **Clics para registrar caries en oclusal y distal de 36:** 3 (O y D en
  el gráfico, Añadir), frente a 4 del panel y 6 del menú.
- **Playground:** opción "Hybrid" en "Surface UI" (`?surfaceUi=hybrid`).
- **Documentado en el README:** sección "Registrar hallazgos por superficie
  (opción recomendada)", con un ejemplo completo.

## Criterios de comparación

Para cada versión, en `arch` y `horizontal`, con ratón y con pantalla táctil:

1. Clics necesarios para registrar caries en oclusal y distal de 36.
2. Si se puede leer todo lo guardado de una pieza sin abrir nada.
3. Uso solo con teclado y con lector de pantalla.
4. Si la interfaz tapa el gráfico o se pierde el contexto.
5. Esfuerzo de integración en Odonto Pro.

## Decisiones pendientes

1. **¿V o B?** ¿Se mostrará alguna vez B (bucal) en lugar de V (vestibular)?
2. **¿Dónde vive el panel?** ¿`ToothInspector` va en la librería, como
   componente genérico sin reglas clínicas, o solo en Odonto Pro, con la
   librería aportando únicamente `SurfaceGuide` y las funciones de V0?
3. **Dos hallazgos en una superficie:** implementada en V0 la propuesta
   (`fill` debajo y `outline` encima, franjas si hay varios `fill`). Falta
   confirmarla visualmente con uso real.
4. **Historial** (odontograma histórico): ¿el panel debe mostrar fechas y
   evolución? En ese caso, a `OdontogramFinding` le falta un campo `date` o
   `id`.

## Orden recomendado

Empezar por **V0 y V1**: las necesitan todas las alternativas y todavía no
comprometen la interacción. Después, V2 y V3 en paralelo para compararlas, y
cerrar con V4.
