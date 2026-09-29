# vue-odontogram

Componente Vue 3 para visualizar y seleccionar dientes mediante SVG e identificadores FDI. Renderiza dentición permanente y primaria; la geometría primaria actual es provisional y solo sirve para desarrollo visual.

## Instalación

```bash
npm install @kmanueldc/vue-odontogram
```

Importa los estilos del paquete:

```ts
import '@kmanueldc/vue-odontogram/style.css'
```

## Uso básico

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Odontogram } from '@kmanueldc/vue-odontogram'
import '@kmanueldc/vue-odontogram/style.css'

const selectedTeeth = ref<string[]>([])
</script>

<template>
  <Odontogram v-model="selectedTeeth" />
</template>
```

`v-model` contiene IDs FDI puros, por ejemplo `['11', '12', '26']`.

## Denticiones

### Permanente

La dentición permanente es el valor por defecto y muestra 32 piezas FDI `11–48`.

```vue
<Odontogram v-model="selectedTeeth" dentition="permanent" />
```

### Primaria

La dentición primaria muestra 20 piezas FDI. Su dataset SVG está marcado como **provisional**, no cuenta con validación odontológica y no debe emplearse para diagnóstico, tratamiento ni representación clínica definitiva.

```vue
<script setup lang="ts">
import { ref } from 'vue'

const selectedPrimary = ref(['51', '52', '65'])
</script>

<template>
  <Odontogram v-model="selectedPrimary" dentition="primary" />
</template>
```

| Cuadrante | Piezas FDI temporales |
| --- | --- |
| Superior derecha | `51–55` |
| Superior izquierda | `61–65` |
| Inferior izquierda | `71–75` |
| Inferior derecha | `81–85` |

Cada cuadrante contiene incisivo central, incisivo lateral, canino, primer molar temporal y segundo molar temporal. No se reutilizan premolares permanentes como molares temporales.

### Mixta

`dentition="mixed"` dibuja juntas las piezas permanentes y las temporales, como en la ficha de odontograma de la NTS. La prop `teeth` indica qué piezas están en boca; sin ella se muestran las 52.

```vue
<script setup lang="ts">
import { ref } from 'vue'

// Ocho años: primeros molares e incisivos permanentes, caninos y molares temporales.
const teeth = [
  '16', '12', '11', '21', '22', '26', '36', '32', '31', '41', '42', '46',
  '55', '54', '53', '63', '64', '65', '75', '74', '73', '83', '84', '85',
]
const selectedTeeth = ref<string[]>([])
</script>

<template>
  <Odontogram v-model="selectedTeeth" dentition="mixed" layout="horizontal" :teeth="teeth" show-numbers />
</template>
```

- **`horizontal`:** cuatro filas, de arriba abajo `18–28`, `55–65`, `85–75` y `48–38`. Las filas temporales están escaladas para que cada molar temporal quede alineado con el premolar que lo reemplaza (55 bajo 15) y comparten la línea media.
- **`arch`:** las arcadas temporales, a menor escala, dentro de las permanentes.

Las piezas conservan su ID FDI, así que `v-model`, `v-model:surfaces`, `toothStates`, `findings`, `conditions`, los eventos y `notation` funcionan igual que en las otras denticiones. Una fila es una arcada de una dentición: la navegación con `↑`/`↓` pasa por las cuatro filas, y los hallazgos de tramo o entre dos piezas deben estar en la misma fila. Las formas temporales son las mismas del dataset primario **provisional**.

`teeth` también filtra las denticiones `permanent` y `primary`. Los IDs que no pertenecen a la dentición se ignoran con un aviso en consola.

## Layouts

Los layouts cambian solamente la presentación: nunca modifican IDs FDI, selección, condiciones ni eventos.

| Dentición | Layouts disponibles | Nota |
| --- | --- | --- |
| Permanente | `arch`, `horizontal` | Ambos usan datasets SVG permanentes propios. |
| Primaria | `arch`, `horizontal` | Ambos usan datasets SVG pediátricos propios y **provisionales**. |
| Mixta | `arch`, `horizontal` | Combina ambos datasets; `horizontal` sigue las filas de la ficha NTS. Ver [Mixta](#mixta). |

```vue
<Odontogram layout="arch" />
<Odontogram layout="horizontal" dentition="permanent" />
<Odontogram layout="arch" dentition="primary" />
<Odontogram layout="horizontal" dentition="primary" />
```

Primary Horizontal usa un segundo dataset y composición pediátricos propios. Ambos layouts Primary son provisionales, se destinan a desarrollo visual y no representan anatomía validada.

## Selección y condiciones

La selección usa los mismos IDs FDI en ambas denticiones. Se puede limitar a una pieza con `singleSelect` y definir condiciones por ID:

```vue
<Odontogram
  v-model="selectedPrimary"
  dentition="primary"
  :conditions="[
    {
      label: 'observation',
      teeth: ['51', '65'],
      fillColor: '#fbbf24',
      outlineColor: '#b45309',
    },
  ]"
  show-labels
  show-tooltip
/>
```

Cada pieza muestra una sola condición: si un ID aparece en varios grupos, se aplica el **último** grupo de `conditions`.

## Props principales

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `modelValue` | `string[]` | `[]` | IDs FDI seleccionados; se usa con `v-model`. |
| `teeth` | `string[]` | todas | IDs FDI de las piezas que se dibujan. Pensada para la dentición mixta; ver [Mixta](#mixta). |
| `dentition` | `'permanent' \| 'primary' \| 'mixed'` | `'permanent'` | Conjunto de piezas que se renderiza. |
| `notation` | `ToothNotation` | `'FDI'` | `'FDI'`, `'Universal'` o `'Palmer'`. Solo cambia el texto mostrado; los IDs, `v-model` y eventos siguen en FDI. Ver [Notaciones](#notaciones). |
| `layout` | `OdontogramLayout` | `'arch'` | `'arch'` o `'horizontal'`, disponible para Permanent y Primary; el dataset Primary sigue siendo provisional. |
| `singleSelect` | `boolean` | `false` | Limita la selección a una pieza. |
| `disabled` | `boolean` | `false` | Deshabilita interacción y selección. |
| `showTooltip` | `boolean` | `true` | Activa el tooltip al pasar el cursor o enfocar una pieza con el teclado. |
| `showLabels` | `boolean` | `false` | Muestra la leyenda de condiciones. |
| `conditions` | `OdontogramCondition[]` | `undefined` | Colores y etiqueta por IDs FDI. |
| `labels` | `OdontogramLabelsInput` | textos en inglés | Traduce los textos visibles y accesibles. Ver [Textos e idioma](#textos-e-idioma). |
| `showNumbers` | `boolean` | `false` | Muestra el número FDI de cada pieza del lado oclusal: frente a la pieza, perpendicular al arco y hacia su interior en `arch`, y entre ambas filas en `horizontal`. |
| `toothStates` | `OdontogramToothStates` | `undefined` | Estado de presencia por ID FDI: `missing`, `extracted`, `implant` o `unerupted`; las piezas no indicadas son `present`. Ver [Estado de pieza](#estado-de-pieza). |
| `findings` | `OdontogramFinding[]` | `undefined` | Hallazgos clínicos (fractura, corona, prótesis…). Ver [Hallazgos](#hallazgos). |
| `findingCatalog` | `FindingCatalog` | `ntsPeruFindingCatalog` | Catálogo que define nombre, símbolo y color de cada código de hallazgo. |
| `showSurfaces` | `boolean` | `false` | Muestra el diagrama de 5 superficies junto a cada pieza. Ver [Superficies](#superficies). |
| `surfaces` | `OdontogramSurfaces` | `{}` | Superficies seleccionadas por ID FDI; se usa con `v-model:surfaces`. |
| `showHalf` | `OdontogramHalf` | `'full'` | `'full'`, `'upper'` o `'lower'`. Muestra una sola arcada y recorta el alto del `viewBox`; la selección de la arcada oculta se conserva. |

## Eventos

| Evento | Payload |
| --- | --- |
| `update:modelValue` | `string[]` con la nueva selección. |
| `change` | `string[]` con la nueva selección. |
| `tooth-click` | `ToothDefinition`, seguido de `string[]` con la selección. |
| `update:surfaces` | `OdontogramSurfaces` con las nuevas superficies seleccionadas. |
| `surface-click` | `ToothDefinition`, `ToothSurface` y `OdontogramSurfaces` resultante. |

## Estado de pieza

`toothStates` indica la presencia de cada pieza, indexada por ID FDI:

```vue
<Odontogram
  v-model="selectedTeeth"
  :tooth-states="{ 18: 'extracted', 28: 'missing', 36: 'implant', 48: 'unerupted' }"
  show-labels
/>
```

| Estado | Significado | Representación |
| --- | --- | --- |
| `present` | Pieza presente (por defecto). | Normal. |
| `missing` | Ausente (agenesia o causa desconocida). | Solo contorno punteado y atenuado. |
| `extracted` | Extraída. | Contorno punteado atenuado y una X. |
| `implant` | Reemplazada por un implante. | Pieza normal con un implante roscado encima. |
| `unerupted` | No erupcionada. | Pieza completa atenuada. |

El estado es independiente de la selección y de las condiciones: una pieza ausente sigue siendo seleccionable, enfocable y navegable (por ejemplo, para planificar un implante), y emite los mismos eventos. Las piezas ausentes no muestran el relleno de su condición.

El estado se añade al nombre accesible (`Tooth 18, Extracted`), aparece en el tooltip (`State: Extracted`) y en el slot `tooltip` como `state`. Con `show-labels`, la leyenda incluye los estados presentes en las piezas visibles. Cada pieza lleva el atributo `data-tooth-state` y la clase `odontogram-tooth--<estado>` para estilos propios; por ejemplo, para ocultar por completo las piezas ausentes:

```css
.odontogram-tooth--missing {
  opacity: 0;
}
```

## Notaciones

`notation` cambia cómo se muestran los números en la dentición permanente y en la primaria. Solo afecta al texto: los IDs de `v-model`, `v-model:surfaces`, `toothStates`, `findings`, `conditions` y de los eventos, así como `data-tooth-id`, siguen siendo FDI.

```vue
<Odontogram v-model="selectedTeeth" notation="Universal" show-numbers />
```

| FDI | Universal | Palmer |
| --- | --- | --- |
| `18` … `11`, `21` … `28` | `1` … `8`, `9` … `16` | `8┘` … `1┘`, `└1` … `└8` |
| `48` … `41`, `31` … `38` | `32` … `25`, `24` … `17` | `8┐` … `1┐`, `┌1` … `┌8` |
| `55` … `51`, `61` … `65` | `A` … `E`, `F` … `J` | `E┘` … `A┘`, `└A` … `└E` |
| `85` … `81`, `71` … `75` | `T` … `P`, `O` … `K` | `E┐` … `A┐`, `┌A` … `┌E` |

- **Dónde se aplica:** números de `show-numbers`, `<title>` de cada pieza, tooltip (`Tooth: 8`) y nombres accesibles de piezas y superficies. El slot `tooltip` recibe `number` con el número mostrado, además de `tooth` (con su `id` FDI).
- **Palmer:** en los números del gráfico, la esquina del cuadrante se dibuja con líneas SVG. La línea horizontal mira a la otra arcada y la vertical a la línea media. En `<title>` y en el tooltip se usan caracteres de recuadro (`6┘`). En los nombres accesibles se usa la forma textual `UR6`, `ULA`, `LL4`, `LRD`, porque los lectores de pantalla no leen bien esos caracteres.

`formatToothNumber(toothId, notation, style?)` hace la misma conversión fuera del componente (`style: 'text'` para la forma `UR6`), y `getPalmerQuadrant(toothId)` devuelve el cuadrante (`'upper-right'`…).

## Superficies

Con `show-surfaces`, cada pieza muestra un diagrama de 5 superficies en su lado vestibular. La selección de superficies es independiente de la de piezas y se enlaza con `v-model:surfaces`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Odontogram, type OdontogramSurfaces } from '@kmanueldc/vue-odontogram'

const selectedTeeth = ref<string[]>([])
const surfaces = ref<OdontogramSurfaces>({ 16: ['occlusal', 'mesial'] })
</script>

<template>
  <Odontogram v-model="selectedTeeth" v-model:surfaces="surfaces" show-surfaces />
</template>
```

El modelo indexa por ID FDI la lista de superficies seleccionadas. Las claves (`ToothSurface`) son las mismas en todas las piezas y el nombre clínico se adapta a cada una:

| Clave | Nombre | Posición en el diagrama |
| --- | --- | --- |
| `vestibular` | Vestibular | Lado exterior del arco (labios o mejillas). |
| `mesial` | Mesial | Lado de la línea media. |
| `occlusal` | Oclusal; **incisal** en incisivos y caninos | Cuadrado central. |
| `distal` | Distal | Lado opuesto a la línea media. |
| `lingual` | Lingual; **palatino** en piezas superiores | Lado interior del arco o de la otra fila. |

El diagrama gira con la pieza, así que en `arch` sigue la curva del arco y en `horizontal` queda con vestibular arriba en la arcada superior y abajo en la inferior. Todos los diagramas tienen el mismo tamaño, proporcional a las piezas; el `viewBox` crece para incluirlos y las siglas y tramos de los hallazgos se desplazan más allá del diagrama.

Cada superficie es un `checkbox` accesible (`Tooth 11, Incisal`) con `aria-checked`. Al hacer clic, o con `Enter`/`Espacio`, se emite `update:surfaces` con un modelo nuevo (las superficies en el orden de `toothSurfaces` y sin piezas vacías) y `surface-click`. Las piezas `missing` y `extracted` muestran el diagrama atenuado y no permiten seleccionar superficies; `disabled` bloquea todas.

Las superficies tienen su propia parada de tabulación: la última enfocada, la primera seleccionada o la primera superficie de la primera pieza.

| Tecla | Acción |
| --- | --- |
| `←` / `→`, `Inicio` / `Fin` | Misma superficie en la pieza anterior, siguiente, primera o última de la arcada, en el orden de pantalla. |
| `↑` / `↓` | Superficie anterior o siguiente de la pieza (vestibular, mesial, oclusal, distal, lingual). |
| `Enter` / `Espacio` | Selecciona o deselecciona la superficie. |

`toggleSurface(surfaces, toothId, surface)` aplica el mismo cambio fuera del componente y `getSurfaceName(surface, toothId)` devuelve el nombre clínico (`'incisal'`, `'palatal'`…).

## Hallazgos

`findings` registra hallazgos y tratamientos (incluidas las prótesis). Cada uno indica un código del catálogo, las piezas FDI y, si corresponde, las superficies y su estado. La librería solo dibuja: qué se puede planificar, cuándo un tratamiento queda realizado o qué color usar son reglas de la aplicación.

```vue
<Odontogram
  show-surfaces
  :findings="[
    { code: 'caries', teeth: ['26'], surfaces: ['occlusal', 'distal'] },
    { code: 'restoration', teeth: ['36'], surfaces: ['occlusal'], status: 'planned' },
    { code: 'extraction', teeth: ['48'], status: 'done' },
    { code: 'crown', teeth: ['14'], color: '#7c3aed' },
    { code: 'fracture', teeth: ['11'] },
    { code: 'crown', teeth: ['21'] },
    { code: 'diastema', teeth: ['11', '21'] },
    { code: 'migrated', teeth: ['24'], direction: 'distal' },
    { code: 'mobility', teeth: ['33'], label: 'M2' },
    { code: 'fixed-prosthesis', teeth: ['45', '47'] },
  ]"
  show-labels
/>
```

| Campo | Descripción |
| --- | --- |
| `code` | Código del catálogo, p. ej. `fracture`. |
| `teeth` | IDs FDI. Los hallazgos de superficie y de pieza dibujan un símbolo por pieza; los de dos piezas (`diastema`, `transposition`) usan exactamente dos; los de tramo (prótesis, aparatos) cubren desde la primera hasta la última pieza de la misma arcada, incluso cruzando la línea media. |
| `surfaces` | Superficies (`ToothSurface[]`) de los hallazgos de superficie (`fill`, `outline`); sin indicar, todas. Los demás hallazgos lo ignoran. |
| `status` | `'existing'` (por defecto: presente en boca), `'planned'` (por hacer) o `'done'` (realizado). Los planificados se dibujan con trazo discontinuo y relleno más claro. |
| `tone` | `'good'` (azul) o `'bad'` (rojo). Por defecto: rojo si está `planned`, azul si está `done` y, si es `existing`, el del catálogo. |
| `color` | Cualquier color CSS; reemplaza a `tone`. |
| `label` | Reemplaza la sigla de los hallazgos de texto, p. ej. `M2` o `PC`. |
| `direction` | `'mesial'` o `'distal'` para la migración. |

Los hallazgos de superficie se dibujan sobre el [diagrama de superficies](#superficies), así que necesitan `show-surfaces`; sin él se omiten con un aviso en consola. El resto de símbolos se dibujan con los anchors, así que se adaptan a los cuatro layouts: las flechas oclusales apuntan a la otra arcada, las mesiales siguen el arco hacia la línea media y las siglas se ubican del lado vestibular (los números van del lado lingual). Los hallazgos no cambian la selección; se añaden al nombre accesible de la pieza, al tooltip (`Findings: …`, y `findings` en el slot) y, con `show-labels`, a la leyenda con su ícono. El texto incluye las superficies y el estado cuando no es `existing`, p. ej. `Restauración definitiva (Oclusal, Planned)`; los nombres de estado se traducen con `labels.findingStatuses`. Los códigos desconocidos o las piezas inválidas se omiten con un aviso en consola.

### Catálogo NTS Perú

`ntsPeruFindingCatalog` es el catálogo por defecto. Se basa en la Norma Técnica de Salud para el uso del odontograma del MINSA (NTS N.° 150-MINSA/2019/DGIESP) y cubre hallazgos de superficie, de pieza completa, siglas, entre dos piezas y de tramo. Los sellantes y las siglas de material de las restauraciones (AM, R, IV…) aún no están incluidos. Como la vista es oclusal y no tiene raíces, los hallazgos radiculares se muestran con su sigla.

> **Verificar antes de uso clínico:** los códigos, colores y siglas se transcribieron para desarrollo y deben contrastarse con el documento oficial vigente.

| Código | Nombre | Símbolo | Color |
| --- | --- | --- | --- |
| `caries` | Lesión de caries dental | Relleno de las superficies | Rojo |
| `restoration` | Restauración definitiva | Relleno de las superficies | Azul |
| `temporary-restoration` | Restauración temporal | Contorno de las superficies | Rojo |
| `extraction` | Extracción | Aspa sobre la pieza | Rojo (azul con `status: 'done'`) |
| `fracture` | Fractura | Línea sobre la pieza | Rojo |
| `crown` / `temporary-crown` | Corona definitiva / temporal | Circunferencia | Azul / rojo |
| `extruded` / `intruded` | Diente extruido / intruido | Flecha hacia / desde la otra arcada | Azul |
| `rotated` | Giroversión | Flecha curva | Azul |
| `migrated` | Migración | Flecha mesial o distal | Azul |
| `erupting` | Pieza dentaria en erupción | Zigzag con flecha | Azul |
| `supernumerary` | Supernumerario | `S` en circunferencia | Azul |
| `fusion` | Fusión | Dos circunferencias | Azul |
| `peg` | Diente en clavija | Triángulo | Azul |
| `implant` | Implante dental | `IMP` | Azul |
| `root-remnant` | Remanente radicular | `RR` | Rojo |
| `mobility` | Movilidad | `M1` (`label`: `M2`, `M3`…) | Rojo |
| `discolored` | Diente discrómico | `DIS` | Rojo |
| `ectopic` | Diente ectópico | `E` | Rojo |
| `impacted` / `semi-impacted` | Impactación / semi-impactación | `I` / `SI` | Rojo |
| `macrodontia` / `microdontia` | Macrodoncia / microdoncia | `MAC` / `MIC` | Azul |
| `worn` | Superficie desgastada | `DES` | Rojo |
| `pulp-treatment` | Tratamiento pulpar | `TC` (`label`: `PC`, `PP`) | Azul |
| `enamel-defect` | Defecto de desarrollo del esmalte | `HP` (`label`: `HM`, `O`, `FL`…) | Rojo |
| `diastema` | Diastema | `)(` entre dos piezas | Azul |
| `transposition` | Transposición | Flechas cruzadas entre dos piezas | Azul |
| `fixed-prosthesis` | Prótesis fija | Línea con topes en los extremos | Azul |
| `removable-prosthesis` / `complete-prosthesis` | Prótesis removible / total | Dos líneas paralelas | Azul |
| `fixed-orthodontic-appliance` | Aparato ortodóntico fijo | Línea con brackets | Azul |
| `removable-orthodontic-appliance` | Aparato ortodóntico removible | Línea en zigzag | Azul |
| `edentulous` | Edéntulo total | Línea sobre las piezas | Azul |

### Catálogos propios

Un catálogo es el registro de formas de dibujo: asocia cada código con un nombre, un símbolo genérico y un color por defecto (`tone`). Se puede extender o reemplazar el catálogo NTS, o crear uno para otra norma:

```ts
import { ntsPeruFindingCatalog, type FindingCatalog } from '@kmanueldc/vue-odontogram'

const catalog: FindingCatalog = {
  ...ntsPeruFindingCatalog,
  sensitivity: { name: 'Sensibilidad', symbol: { kind: 'text', text: 'SEN' }, tone: 'bad' },
  sealant: { name: 'Sellante', symbol: { kind: 'fill' }, tone: 'good' },
}
```

Símbolos disponibles (`FindingSymbol['kind']`): de superficie `fill` (relleno) y `outline` (contorno); de pieza `line`, `cross`, `circle` (p. ej. corona), `double-circle`, `triangle`, `arrow` (con `direction`: `occlusal`, `apical`, `mesial`, `distal` o `auto`), `curved-arrow`, `zigzag`, `text` y `encircled-text` (con `text`); entre dos piezas `diastema` y `transposition`; de tramo `bridge`, `double-line`, `brackets`, `zigzag-line` y `center-line`.

## Teclado

El odontograma tiene una sola parada de tabulación: la última pieza enfocada o, si no hay, la primera seleccionada visible o la primera pieza renderizada.

| Tecla | Acción |
| --- | --- |
| `←` / `→` | Pieza anterior o siguiente de la misma arcada, en el orden en que se ve en pantalla. |
| `↑` / `↓` | Pieza más cercana de la arcada dibujada arriba o abajo. |
| `Inicio` / `Fin` | Primera o última pieza de la arcada. |
| `Enter` / `Espacio` | Selecciona o deselecciona la pieza. |

Moverse con el teclado muestra el tooltip de la pieza enfocada y no cambia la selección.

## Tooltip personalizado

El slot `tooltip` reemplaza el contenido por defecto y recibe `tooth`, `selected`, `condition`, `state`, `findings` y `number` (el número en la notación elegida):

```vue
<Odontogram v-model="selectedTeeth" :conditions="conditions">
  <template #tooltip="{ tooth, selected, condition }">
    <strong>Pieza {{ tooth.id }}</strong>
    <div v-if="condition">{{ condition.label }}</div>
    <div>{{ selected ? 'Seleccionada' : 'Sin seleccionar' }}</div>
  </template>
</Odontogram>
```

## Overlay y anchors

Cada pieza tiene un *anchor*: su caja (`box`) y centro (`center`) en las coordenadas del `viewBox` del layout, con todos los transforms ya aplicados. El slot `overlay` se dibuja dentro del SVG, encima de las piezas, y recibe `anchors` (indexados por ID FDI), `viewBox`, `dentition` y `layout`. Sirve para números, símbolos o marcas sin leer el DOM:

```vue
<Odontogram v-model="selectedTeeth">
  <template #overlay="{ anchors }">
    <text
      v-for="anchor in anchors"
      :key="anchor.toothId"
      :x="anchor.center.x"
      :y="anchor.box.y + anchor.box.height + 12"
      text-anchor="middle"
      font-size="10"
    >
      {{ anchor.toothId }}
    </text>
  </template>
</Odontogram>
```

El grupo del overlay usa `pointer-events: none` para no bloquear los clics sobre las piezas; un elemento propio puede reactivarlos con `pointer-events: auto`.

Fuera de Vue (por ejemplo, para exportar o validar posiciones) se puede usar `getToothAnchors(dentition, layout)`, que devuelve la lista en orden de renderizado, y `getLayoutViewBox(dentition, layout)`. El cálculo es exacto para curvas y arcos SVG, no requiere DOM y coincide con el `getBBox()` del navegador.

## Textos e idioma

Los textos por defecto están en inglés. La prop `labels` acepta un objeto parcial; lo que no se indique conserva el valor de `defaultOdontogramLabels`:

```vue
<Odontogram
  :labels="{
    odontogram: 'Odontograma',
    chartTitles: { permanent: 'odontograma permanente', primary: 'odontograma temporal' },
    tooth: 'Pieza',
    type: 'Tipo',
    selected: 'Seleccionada',
    yes: 'Sí',
    no: 'No',
    condition: 'Condición',
    legend: 'Leyenda de condiciones',
    toothTypes: { 'Central Incisor': 'Incisivo central', 'Primary Second Molar': 'Segundo molar temporal' },
    state: 'Estado',
    states: { missing: 'Ausente', extracted: 'Extraída', implant: 'Implante', unerupted: 'No erupcionada' },
    findings: 'Hallazgos',
    surfaces: 'Superficies dentales',
    surfaceNames: { vestibular: 'Vestibular', mesial: 'Mesial', occlusal: 'Oclusal', incisal: 'Incisal', distal: 'Distal', lingual: 'Lingual', palatal: 'Palatino' },
  }"
/>
```

`tooth` también forma el nombre accesible de cada pieza (`Pieza 11`). Los tipos sin traducción en `toothTypes` se muestran con su nombre original.

## Tema

Los colores se ajustan con variables CSS sobre `.odontogram` o un ancestro:

| Variable | Valor por defecto | Uso |
| --- | --- | --- |
| `--odontogram-stroke-color` | `#8a98be` | Contorno de las piezas. |
| `--odontogram-selected-color` | `#c6ccf8` | Relleno de piezas seleccionadas y en hover. |
| `--odontogram-selected-stroke-color` | `#b8c0cc` | Contorno de piezas seleccionadas. |
| `--odontogram-focus-outline-color` | `rgb(184 167 232 / 70%)` | Contorno de foco del teclado. |
| `--odontogram-number-color` | `#64748b` | Números de `showNumbers`. |
| `--odontogram-number-selected-color` | `#4338ca` | Números de piezas seleccionadas (en negrita). |
| `--odontogram-absent-opacity` | `0.55` | Opacidad de piezas `missing` y `extracted`. |
| `--odontogram-unerupted-opacity` | `0.45` | Opacidad de piezas `unerupted`. |
| `--odontogram-extracted-color` | `#dc2626` | X de las piezas extraídas. |
| `--odontogram-implant-color` | `#0f766e` | Contorno del implante. |
| `--odontogram-implant-fill` | `#ccfbf1` | Relleno del implante. |
| `--odontogram-finding-good-color` | `#1d4ed8` | Hallazgos en buen estado o tratamiento realizado (azul). |
| `--odontogram-finding-bad-color` | `#dc2626` | Hallazgos en mal estado o pendientes (rojo). |
| `--odontogram-finding-planned-dasharray` | proporcional al trazo | Trazo discontinuo de los hallazgos `planned`. |
| `--odontogram-finding-planned-fill-opacity` | `0.45` | Opacidad del relleno de los hallazgos `planned`. |
| `--odontogram-surface-fill` | `#fff` | Relleno de las superficies sin seleccionar. |
| `--odontogram-surface-stroke-color` | `--odontogram-stroke-color` | Contorno del diagrama de superficies. |
| `--odontogram-surface-hover-color` | `--odontogram-selected-color` | Superficie bajo el cursor. |
| `--odontogram-surface-selected-color` | `#6366f1` | Superficies seleccionadas. |
| `--odontogram-surface-focus-color` | `#4338ca` | Contorno de la superficie enfocada con el teclado. |
| `--odontogram-tooltip-bg` | `rgba(0, 0, 0, 0.85)` | Fondo del tooltip. |
| `--odontogram-tooltip-fg` | `#fff` | Texto del tooltip. |

```css
.mi-odontograma {
  --odontogram-stroke-color: #475569;
  --odontogram-selected-color: #bae6fd;
}
```

## Utilidades y tipos exportados

| Exportación | Descripción |
| --- | --- |
| `buildToothId(dentition, quadrant, position)` | Construye un ID FDI, p. ej. `buildToothId('primary', 8, 5) === '85'`. Los IDs son siempre FDI. |
| `formatToothNumber(toothId, notation, style?)` | Número de una pieza FDI en otra notación: `formatToothNumber('11', 'Universal') === '8'`, `formatToothNumber('55', 'Palmer', 'text') === 'URE'`. |
| `getPalmerQuadrant(toothId)` | Cuadrante Palmer de una pieza FDI. |
| `getQuadrant(dentition, arch, side)` | Cuadrante FDI de una arcada y lado del paciente. |
| `defaultOdontogramLabels` | Textos por defecto de la prop `labels`. |
| `getToothAnchors(dentition, layout)` | Caja y centro de cada pieza en coordenadas del `viewBox`. |
| `getLayoutViewBox(dentition, layout)` | `viewBox` de la composición como `{ x, y, width, height }`. |
| `toothStates` | Lista de todos los `ToothState`, en orden. |
| `ntsPeruFindingCatalog` | Catálogo de hallazgos basado en la NTS del MINSA (Perú). |
| `toothSurfaces` | Lista de todas las `ToothSurface`, en orden. |
| `toggleSurface(surfaces, toothId, surface)` | Devuelve un modelo de superficies nuevo con una superficie alternada. |
| `getSurfaceName(surface, toothId)` | Nombre clínico de una superficie en una pieza (`incisal`, `palatal`…). |
| `getFindingScope(symbol)` | `'surface'`, `'tooth'`, `'between'` o `'span'`: dónde se dibuja un símbolo. |
| `resolveFindingTone(finding, definition)` | Color por defecto (`'good'` o `'bad'`) de un hallazgo. |
| `findingStatuses` | Lista de todos los `FindingStatus`, en orden. |
| Tipos | `OdontogramFinding`, `FindingCatalog`, `FindingDefinition`, `FindingSymbol`, `FindingSymbolKind`, `FindingStatus`, `FindingDirection`, `FindingScope`, `NtsPeruFindingCode`, `ToothState`, `OdontogramToothStates`, `ToothAnchor`, `Box`, `Point`, `OdontogramHalf`, `Dentition`, `ToothNotation`, `OdontogramLayout`, `OdontogramCondition`, `OdontogramLabels`, `OdontogramLabelsInput`, `ToothDefinition`, `ToothShape`, `ToothType`, `ToothVisualCondition`, `ToothCondition`, `TooltipPlacement`, `DentalArch`, `DentalSide`. |

## Licencia y procedencia de los SVG

El código propio de `@kmanueldc/vue-odontogram` se distribuye bajo licencia MIT; consulta [LICENSE](LICENSE).

Las geometrías SVG permanentes de `src/data/permanent.ts` y `src/data/permanent-horizontal.ts` se portaron de [biomathcode/react-odontogram](https://github.com/biomathcode/react-odontogram), también bajo MIT © biomathcode. La atribución y la copia de esa licencia se conservan en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Los dos datasets pediátricos de cinco formas, `src/data/primary.ts` (Arch) y `src/data/primary-horizontal.ts` (Horizontal), son paths simplificados propios creados para prototipado. Son **provisionales**, no tienen validación odontológica y no deben emplearse para diagnóstico, tratamiento ni como representación clínica definitiva. Consulta [la nota de aproximación Arch](docs/primary-svg-approximation.md), [la aproximación Horizontal](docs/primary-horizontal-svg-approximation.md), [la composición Horizontal](docs/primary-horizontal-layout.md) y [el registro de fuentes](docs/primary-svg-sources.md) antes de redistribuirlos o considerarlos para uso clínico.

## Dentición mixta

Disponible con `dentition="mixed"` y `teeth`. Ver [Mixta](#mixta) y el [diseño de dentición mixta](docs/mixed-dentition.md).

## Playground

Para validar visualmente ambos conjuntos durante el desarrollo:

```bash
npm install
npm run dev:playground
```

El playground permite alternar Permanent/Primary/Mixed (con un ejemplo de ocho años), selección, tooltip, leyendas y los layouts compatibles. Incluye el ejemplo primario `["51", "52", "65"]`. La opción **Anchors** dibuja la caja y el número FDI de cada pieza mediante el slot `overlay`; **Numbers**, **Arches**, **States** y **Findings** prueban `showNumbers`, `showHalf`, `toothStates` y `findings`. El estado inicial se puede fijar por URL, por ejemplo `?dentition=primary&layout=horizontal&numbers&states&findings&half=upper&anchors`.

## Desarrollo

```bash
npm run test
npm run build
npm run build:playground
```






