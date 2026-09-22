# TODO — Crear `vue-odontogram` a partir de `react-odontogram`

## Objetivo general

Migrar la librería existente `react-odontogram` a una nueva dependencia para Vue 3 + TypeScript, conservando la representación SVG actual de los dientes permanentes y preparando la arquitectura para soportar:

* Dentición permanente.
* Dentición temporal/pediátrica.
* Dentición mixta en una fase posterior.
* Notación FDI inicialmente.
* Selección de dientes.
* Eventos compatibles con Vue.
* Tooltip.
* Estados/condiciones visuales.
* API reutilizable como dependencia externa.

La migración NO debe consistir en una traducción literal React → Vue.

Debe separarse:

```text
Datos anatómicos / SVG
        ↓
Modelo de dominio
        ↓
Lógica del odontograma
        ↓
Componentes Vue
```

---

# [x] TAREA 01 — Auditoría de `react-odontogram`

Analizar completamente el proyecto original antes de modificar código.

Revisar especialmente:

```text
src/data.ts
src/Teeth.tsx
src/Odontogram.tsx
src/Tooltip.tsx
src/Labels.tsx
src/utils.ts
src/styles.css
src/types*
```

Identificar:

* Props públicas del componente.
* Tipos públicos.
* Modelo de `teethPaths`.
* Generación de IDs de dientes.
* Transformaciones SVG.
* Cuadrantes.
* Selección simple/múltiple.
* Condiciones visuales.
* Tooltip.
* Labels.
* Notaciones soportadas.
* Dependencias específicas de React.

Generar un archivo:

```text
docs/react-odontogram-analysis.md
```

que indique para cada elemento:

```text
REUTILIZAR
ADAPTAR
REDISEÑAR
DESCARTAR
```

No implementar todavía componentes Vue.

Criterio de aceptación:

* Existe documentación de la arquitectura actual.
* Se identificaron todas las dependencias React.
* Se identificó qué código puede reutilizarse directamente.

---

# TAREA 02 — Crear estructura base de `vue-odontogram`

Crear una nueva librería Vue 3 utilizando:

```text
Vue 3
TypeScript
Composition API
<script setup>
Vite
```

Estructura inicial:

```text
src/
├── components/
│   ├── Odontogram.vue
│   ├── Tooth.vue
│   ├── OdontogramTooltip.vue
│   └── ConditionLabels.vue
│
├── composables/
│   ├── useOdontogram.ts
│   └── useToothSelection.ts
│
├── data/
│   ├── permanent.ts
│   ├── primary.ts
│   └── index.ts
│
├── types/
│   └── odontogram.ts
│
├── utils/
│   ├── notation.ts
│   ├── quadrants.ts
│   └── odontogram.ts
│
├── styles/
│   └── odontogram.css
│
└── index.ts
```

Configurar build de librería para poder utilizar posteriormente:

```ts
import { Odontogram } from 'vue-odontogram'
```

No implementar todavía lógica clínica.

Criterio de aceptación:

```bash
npm install
npm run build
```

deben funcionar correctamente.

---

# TAREA 03 — Extraer y portar los `teethPaths`

Mover las geometrías SVG existentes de `react-odontogram/src/data.ts` a:

```text
src/data/permanent.ts
```

Los SVG existentes deben conservarse exactamente.

No redibujar ni modificar los paths.

Crear un modelo desacoplado del framework:

```ts
export interface ToothShape {
  position: number
  type: ToothType
  outlinePath: string
  shadowPath?: string
  lineHighlightPath?: string | string[]
}
```

Crear:

```ts
export const permanentTeethPaths: ToothShape[]
```

con los ocho tipos de piezas permanentes:

```text
Central Incisor
Lateral Incisor
Canine
First Premolar
Second Premolar
First Molar
Second Molar
Third Molar
```

Importante:

Los datos SVG no pueden importar absolutamente nada de Vue.

Criterios de aceptación:

* Los paths originales se conservan.
* `permanent.ts` es completamente independiente de Vue.
* Existen ocho posiciones dentales permanentes.
* TypeScript no genera errores.

---

# TAREA 04 — Crear modelo de dominio del odontograma

Crear los tipos centrales de la dependencia en:

```text
src/types/odontogram.ts
```

Incluir como mínimo:

```ts
export type Dentition =
  | 'permanent'
  | 'primary'
  | 'mixed'

export type ToothNotation =
  | 'FDI'
  | 'Universal'
  | 'Palmer'

export type DentalArch =
  | 'upper'
  | 'lower'

export type DentalSide =
  | 'left'
  | 'right'
```

Crear una representación de diente independiente del SVG:

```ts
export interface ToothDefinition {
  id: string
  position: number
  quadrant: number
  dentition: Dentition
  type: ToothType
  shape: ToothShape
}
```

Separar claramente:

```text
ToothShape
```

de:

```text
ToothDefinition
```

`ToothShape` representa geometría.

`ToothDefinition` representa una pieza dental dentro del odontograma.

No implementar todavía dentición mixta.

Solo dejar preparado el modelo.

---

# TAREA 05 — Implementar numeración FDI correctamente

Crear:

```text
src/utils/notation.ts
src/utils/quadrants.ts
```

No utilizar la estrategia antigua de simplemente concatenar un prefijo fijo.

Dentición permanente:

```text
Superior derecha:   11–18
Superior izquierda: 21–28
Inferior izquierda: 31–38
Inferior derecha:   41–48
```

Dentición temporal:

```text
Superior derecha:   51–55
Superior izquierda: 61–65
Inferior izquierda: 71–75
Inferior derecha:   81–85
```

Crear funciones del estilo:

```ts
getQuadrant(
  dentition,
  arch,
  side
)
```

y:

```ts
buildToothId(
  dentition,
  quadrant,
  position,
  notation
)
```

Ejemplos esperados:

```ts
buildToothId('permanent', 1, 1, 'FDI')
// "11"

buildToothId('permanent', 4, 8, 'FDI')
// "48"

buildToothId('primary', 5, 1, 'FDI')
// "51"

buildToothId('primary', 8, 5, 'FDI')
// "85"
```

Agregar tests unitarios.

No implementar todavía Universal/Palmer si requiere demasiado cambio.

Puede dejarse explícitamente preparado como extensión futura.

---

# TAREA 06 — Portar `Tooth` de React a Vue

Crear:

```text
src/components/Tooth.vue
```

Responsabilidad exclusiva:

renderizar UN diente.

Debe recibir mediante props:

```ts
tooth
selected
disabled
condition
```

Debe generar los SVG correspondientes utilizando:

```text
outlinePath
shadowPath
lineHighlightPath
```

Debe emitir:

```ts
select
mouseenter
mouseleave
```

No debe contener lógica de:

* cuadrantes;
* numeración;
* dentición completa;
* selección múltiple global.

Ejemplo conceptual:

```vue
<Tooth
  :tooth="tooth"
  :selected="isSelected"
  @select="handleSelect"
/>
```

El resultado visual debe ser equivalente al `Teeth.tsx` original.

---

# TAREA 07 — Implementar odontograma permanente

Crear:

```text
src/components/Odontogram.vue
```

Primera versión soportará exclusivamente:

```text
dentition="permanent"
```

Debe generar 32 dientes.

Utilizar los mismos transforms SVG de la dependencia original cuando sean necesarios para reflejar:

```text
superior derecha
superior izquierda
inferior derecha
inferior izquierda
```

No duplicar manualmente los SVG.

Utilizar:

```text
permanentTeethPaths
```

como fuente de geometría.

API propuesta:

```vue
<Odontogram
  v-model="selectedTeeth"
  dentition="permanent"
  notation="FDI"
/>
```

Props mínimas:

```ts
modelValue?: string[]

dentition?: Dentition

notation?: ToothNotation

singleSelect?: boolean

disabled?: boolean

showLabels?: boolean

showTooltip?: boolean
```

Eventos:

```ts
update:modelValue

change

tooth-click
```

Criterios de aceptación:

* Renderiza exactamente 32 dientes.
* IDs FDI correctos.
* Permite selección.
* Soporta selección simple/múltiple.
* `v-model` funciona correctamente.

---

# TAREA 08 — Portar tooltip y labels

Portar las funcionalidades equivalentes de:

```text
Tooltip.tsx
Labels.tsx
```

a:

```text
OdontogramTooltip.vue
ConditionLabels.vue
```

El tooltip debe ser independiente de la lógica del diente.

Debe poder mostrar como mínimo:

```text
ID FDI
Tipo de diente
Estado seleccionado
Condición si existe
```

No incluir lógica clínica específica de Odonto Pro dentro de la librería.

La dependencia debe permanecer genérica.

---

# TAREA 09 — Crear soporte real para odontograma pediátrico

NO utilizar:

```ts
permanentTeethPaths.slice(0, 5)
```

para representar dentición temporal.

Esto sería anatómicamente incorrecto porque produciría:

```text
incisivo
incisivo
canino
premolar
premolar
```

cuando la dentición temporal debe contener:

```text
incisivo central
incisivo lateral
canino
primer molar temporal
segundo molar temporal
```

Crear:

```text
src/data/primary.ts
```

con:

```ts
export const primaryTeethPaths: ToothShape[]
```

Debe contener cinco geometrías:

```text
Primary Central Incisor
Primary Lateral Incisor
Primary Canine
Primary First Molar
Primary Second Molar
```

IMPORTANTE:

No inventar automáticamente los SVG pediátricos copiando premolares permanentes.

Si todavía no existen SVG adecuados para molares temporales:

* crear la estructura;
* dejar las piezas pendientes claramente identificadas;
* documentarlo;
* NO utilizar premolares como sustitutos silenciosos.

---

# TAREA 10 — Implementar `dentition="primary"`

Una vez disponibles los SVG temporales, extender:

```vue
<Odontogram />
```

para aceptar:

```vue
<Odontogram dentition="primary" />
```

Debe renderizar exactamente 20 piezas:

```text
51 52 53 54 55
61 62 63 64 65

71 72 73 74 75
81 82 83 84 85
```

Verificar orientación visual de cada cuadrante.

El componente debe utilizar el mismo `Tooth.vue`.

NO crear un componente separado:

```text
PediatricOdontogram.vue
```

La dentición debe ser una configuración del odontograma:

```ts
dentition="primary"
```

---

# TAREA 11 — Preparar arquitectura para dentición mixta

No implementar todavía comportamiento clínico completo.

Solamente eliminar supuestos arquitectónicos como:

```text
un paciente = exactamente una dentición
```

Preparar el dominio para eventualmente representar simultáneamente piezas como:

```text
11
12
53
54
55
16
```

Documentar diseño propuesto en:

```text
docs/mixed-dentition.md
```

No introducir lógica experimental al componente principal.

---

# TAREA 12 — API pública de la dependencia

Configurar:

```text
src/index.ts
```

para exportar únicamente la API pública necesaria.

Por ejemplo:

```ts
export { default as Odontogram }
  from './components/Odontogram.vue'

export { default as Tooth }
  from './components/Tooth.vue'

export type {
  Dentition,
  ToothNotation,
  ToothDefinition,
  ToothShape
} from './types/odontogram'
```

No exponer detalles internos innecesarios.

---

# TAREA 13 — Playground de desarrollo

Crear una aplicación/página de demostración para validar la librería.

Debe permitir cambiar dinámicamente:

```text
Dentition
    Permanent
    Primary

Selection
    Single
    Multiple

Labels
    On
    Off

Tooltip
    On
    Off
```

Mostrar debajo:

```json
[
  "11",
  "12",
  "26"
]
```

con los dientes actualmente seleccionados.

Debe existir también ejemplo pediátrico:

```json
[
  "51",
  "52",
  "65"
]
```

El playground NO forma parte necesariamente del bundle publicado.

---

# TAREA 14 — Tests

Agregar pruebas como mínimo para:

### Numeración FDI

```text
11–18
21–28
31–38
41–48

51–55
61–65
71–75
81–85
```

### Cantidad de dientes

```text
permanent = 32
primary = 20
```

### Selección

```text
singleSelect=true
```

debe mantener una única pieza seleccionada.

```text
singleSelect=false
```

debe permitir múltiples.

### Eventos

Verificar:

```text
update:modelValue
change
tooth-click
```

---

# TAREA 15 — Documentación

Crear README con:

```bash
npm install vue-odontogram
```

y ejemplos:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Odontogram } from 'vue-odontogram'

const selected = ref<string[]>([])
</script>

<template>
  <Odontogram
    v-model="selected"
    dentition="permanent"
    notation="FDI"
  />
</template>
```

Ejemplo pediátrico:

```vue
<Odontogram
  v-model="selected"
  dentition="primary"
  notation="FDI"
/>
```

Documentar:

* Props.
* Emits.
* Tipos.
* Notación FDI.
* Dentición permanente.
* Dentición temporal.
* Limitaciones actuales.
* Futuro soporte para dentición mixta.

---

# Orden obligatorio de implementación

Codex debe trabajar en este orden:

```text
01 Auditoría
      ↓
02 Base Vue
      ↓
03 SVG permanentes
      ↓
04 Modelo de dominio
      ↓
05 FDI
      ↓
06 Tooth.vue
      ↓
07 Odontograma permanente
      ↓
08 Tooltip / Labels
      ↓
09 Dataset pediátrico
      ↓
10 Odontograma pediátrico
      ↓
11 Preparación mixed
      ↓
12 API pública
      ↓
13 Playground
      ↓
14 Tests
      ↓
15 Documentación
```

No realizar toda la migración en un único cambio.

Cada tarea debe:

1. Mantener el proyecto compilando.
2. Ejecutar TypeScript.
3. Ejecutar los tests existentes.
4. No romper tareas previamente terminadas.
5. Mostrar un resumen de archivos modificados.
6. Explicar cualquier desviación respecto al diseño.
7. Evitar cambios no relacionados.

---

# Restricciones importantes

No convertir automáticamente JSX a Vue y asumir que la migración está terminada.

No mantener `maxTeeth=5` como mecanismo para representar dentición pediátrica.

No utilizar premolares permanentes como molares temporales.

No introducir lógica específica de Laravel/Odonto Pro dentro de esta dependencia.

No duplicar geometrías SVG para los cuatro cuadrantes si pueden resolverse mediante transforms.

No mezclar generación FDI con componentes visuales.

No acoplar los datasets SVG a Vue.

La librería debe poder evolucionar posteriormente hacia:

```text
dentición mixta
superficies dentales
hallazgos
condiciones
tratamientos
estado de pieza
ausencia dental
prótesis
odontograma histórico
```

sin tener que reconstruir su arquitectura.


---

# Extensión futura — Layout horizontal / cuadrado

## Objetivo

Incorporar una representación horizontal del odontograma permanente, equivalente al
layout `square` de la dependencia React original, sin alterar el layout curvo actual
ni duplicar la lógica de selección, condiciones, tooltip o FDI.

El layout será una decisión de presentación. La dentición, los IDs FDI y las
definiciones de diente seguirán siendo los mismos.

## FASE 16 — Auditoría del segundo dataset SVG

Analizar exclusivamente `react-odontogram/src/data.ts::NewTeethPaths` y los
transforms asociados a `newquadrants`.

Documentar en:

```text
docs/horizontal-layout-analysis.md
```

Verificar:

* Si cada uno de los ocho paths representa la misma posición anatómica que
  `permanentTeethPaths`.
* Las diferencias de coordenadas, `viewBox` y orientación.
* Los transforms exactos de los cuadrantes.
* Si todos los paths pueden conservarse literalmente.

Criterio de aceptación:

* Se documenta la relación entre `teethPaths` y `NewTeethPaths`.
* No se modifica el layout curvo.

## FASE 17 — Modelo de layout desacoplado

Crear un tipo de presentación, sin incorporarlo al modelo clínico:

```ts
export type OdontogramLayout =
  | 'arch'
  | 'horizontal'
```

Definir una configuración interna por layout que incluya:

```ts
interface LayoutDefinition {
  viewBox: string
  quadrants: QuadrantTransform[]
}
```

El modelo no debe generar IDs ni elegir dentición.

Criterio de aceptación:

* La lógica FDI no conoce el layout.
* Un cuadrante conserva su número FDI aunque cambie de presentación.

## FASE 18 — Portar dataset horizontal permanente

Crear:

```text
src/data/permanent-horizontal.ts
```

Portar literalmente los ocho paths de `NewTeethPaths`, con `position` y
`ToothType` compatibles con el modelo de geometría.

No sustituir ni sobrescribir:

```text
src/data/permanent.ts
```

Criterio de aceptación:

* Hay ocho formas horizontales permanentes.
* Los datos no importan Vue.
* Se prueba que las posiciones 1–8 están completas.

## FASE 19 — Renderizar layout horizontal

Extender `Odontogram.vue` con:

```vue
<Odontogram layout="horizontal" />
```

Comportamiento:

* `layout="arch"` continúa siendo el valor por defecto.
* `layout="horizontal"` usa el dataset y `viewBox` horizontal.
* Selección, `v-model`, condiciones, tooltip, etiquetas y accesibilidad se
  reutilizan sin bifurcar componentes.
* `Tooth.vue` no conoce el layout.

Criterio de aceptación:

* Los cuatro cuadrantes muestran IDs FDI 11–48 correctos.
* El modo horizontal muestra 32 dientes.
* Cambiar de layout no cambia la selección actual.

## FASE 20 — Playground horizontal

Añadir al playground un selector:

```text
Layout
  Arch
  Horizontal
```

El JSON de selección debe conservarse al alternar la vista.

Criterio de aceptación:

* La demostración permite validar ambos layouts visualmente.
* El modo pediátrico sigue deshabilitado hasta disponer de sus SVG.

## FASE 21 — Pruebas del layout

Agregar pruebas para:

* `layout="arch"` como valor predeterminado.
* `layout="horizontal"` con 32 piezas.
* `viewBox` y transforms de los cuatro cuadrantes.
* FDI correcto en ambos layouts.
* Selección simple y múltiple al alternar layout.
* Tooltip y condiciones en layout horizontal.

Criterio de aceptación:

```bash
npm run test
npm run build
npm run build:playground
```

funcionan correctamente.

## FASE 22 — Documentación de layouts

Ampliar el README con ejemplos:

```vue
<Odontogram layout="arch" />
<Odontogram layout="horizontal" />
```

Documentar que ambos modos representan la misma dentición permanente y son
alternativas visuales, no notaciones ni modelos clínicos distintos.

## Orden obligatorio para la extensión

```text
16 Auditoría del dataset horizontal
      ↓
17 Modelo de layout
      ↓
18 Dataset horizontal
      ↓
19 Renderizado
      ↓
20 Playground
      ↓
21 Pruebas
      ↓
22 Documentación
```

Restricciones:

* No reemplazar el dataset curvo existente.
* No duplicar `Tooth.vue`.
* No acoplar FDI, selección ni condiciones al layout.
* No habilitar dentición primaria horizontal hasta que existan sus cinco SVG
  temporales anatómicamente adecuados.


---

# Extensión futura — Dentición primaria anatómicamente válida

## Objetivo

Habilitar <Odontogram dentition="primary" /> con 20 piezas temporales FDI
(51–55, 61–65, 71–75, 81–85) y geometrías pediátricas reales. La
implementación no podrá comenzar por el componente: primero se requiere una
fuente SVG con licencia compatible y validación anatómica de las cinco formas.

## Definición clínica mínima

Cada cuadrante temporal contiene exactamente:

~~~text
1  Primary Central Incisor
2  Primary Lateral Incisor
3  Primary Canine
4  Primary First Molar
5  Primary Second Molar
~~~

No hay premolares en dentición temporal. Los premolares permanentes nunca
podrán reutilizarse como sustitutos de las posiciones 4 y 5.

## FASE 23 — Adquisición y validación de SVG pediátricos

Localizar o aportar una fuente que incluya cinco geometrías pediátricas
anatómicamente diferenciadas para la vista en arco.

Registrar para cada asset:

* Origen, autor y licencia compatible con la publicación de la biblioteca.
* Resolución/vector original y sistema de coordenadas.
* Forma representada y posición dental.
* Revisión visual por una persona con conocimiento odontológico.

Crear:

~~~text
docs/primary-svg-sources.md
~~~

Criterio de aceptación:

* Existen cinco paths SVG aprobados.
* Los dos molares temporales son explícitamente distintos de premolares.
* La fuente permite redistribución en vue-odontogram.

## FASE 24 — Contrato de datos pediátricos

Revisar y ampliar el modelo geométrico antes de introducir los assets.

Decisiones requeridas:

* Extender ToothType o definir una unión de tipos que admita los cinco tipos
  temporales sin perder los ocho permanentes.
* Mantener ToothShape libre de Vue y sin propiedades de cuadrante.
* Confirmar que position se interpreta por dentición: 1–8 permanente,
  1–5 temporal.
* Mantener ToothDefinition como vínculo entre geometría, FDI y dentición.

Criterio de aceptación:

* TypeScript admite las cinco formas temporales sin casts ni any.
* Las formas temporales no se mezclan silenciosamente con el dataset
  permanente.

## FASE 25 — Crear SVG pediátricos provisionales

Crear una primera aproximación visual para:

~~~text
Primary Central Incisor
Primary Lateral Incisor
Primary Canine
Primary First Molar
Primary Second Molar
~~~

Los SVG se crearán como assets **provisionales para desarrollo visual**. Podrán
tomar las formas permanentes existentes como referencia técnica y punto de
partida, pero deben modificarse de forma explícita para reflejar proporciones
pediátricas y no se presentarán como anatomía clínicamente validada.

### Reglas de creación

* Conservar el origen y licencia MIT de los paths permanentes usados como
  referencia.
* Derivar o redibujar paths en SVG; no usar una copia silenciosa de First/Second
  Premolar como First/Second Primary Molar.
* Los dos molares temporales deben distinguirse visualmente de los premolares
  permanentes y entre sí.
* Mantener el formato ToothShape: position, type, outlinePath, shadowPath y
  lineHighlightPath cuando aplique.
* Etiquetar cada asset como provisional en el código y documentación.
* No reclamar precisión anatómica, validez clínica ni uso diagnóstico.
* Iterar mediante el playground y revisión visual antes de considerar estable
  una forma.

Crear:

~~~text
docs/primary-svg-approximation.md
~~~

con el origen de cada forma, los cambios realizados, limitaciones conocidas y
resultados de revisión visual.

### Criterios de aceptación provisionales

* primaryTeethPaths.length === 5.
* Las posiciones son 1, 2, 3, 4 y 5.
* La vista permite distinguir incisivos, canino y ambos molares temporales.
* Los molares temporales no son premolares permanentes sin modificar.
* Datos y tests no importan Vue.
* Cada SVG y README incluyen la advertencia de estado provisional.

### Validación iterativa

1. Crear las cinco aproximaciones iniciales.
2. Renderizarlas en el playground de desarrollo.
3. Ajustar tamaño, líneas y proporciones según revisión visual.
4. Repetir hasta contar con una alternativa coherente para prototipado.
5. Mantener pendiente la validación odontológica antes de cualquier publicación
   como asset clínico.

## FASE 26 — Reglas de composición primaria en arco

Definir una configuración de presentación específica para las formas
pediátricas, sin asumir que las coordenadas o transforms permanentes son
válidos para ellas.

Determinar y documentar:

* viewBox de la composición temporal.
* Transform de Q5, Q6, Q8 y Q7.
* Orden visual y orientación de cada cuadrante.
* Compatibilidad explícita de layouts: inicialmente arch; el horizontal
  pediátrico será una tarea posterior con un segundo dataset pediátrico.

Criterio de aceptación:

* La composición renderiza la anatomía temporal sin estirarla ni solaparla.
* El layout horizontal no se anuncia como disponible para primaria si no tiene
  sus propias geometrías.

## FASE 27 — Habilitar dentition="primary"

Extender Odontogram.vue para seleccionar el dataset y configuración por
dentición.

Comportamiento requerido:

* dentition="permanent" conserva sus 32 piezas y ambos layouts.
* dentition="primary" renderiza 20 piezas y usa Tooth.vue.
* IDs FDI: 51–55, 61–65, 71–75, 81–85.
* v-model, selección simple/múltiple, disabled, condiciones, tooltip, labels y
  eventos se conservan.
* Una combinación de dentición/layout no soportada debe rechazarse con un
  mensaje claro o restringirse en tipos; nunca debe usar geometría permanente.

Criterio de aceptación:

* La selección no cambia de formato entre denticiones.
* No se crea PediatricOdontogram.vue.

## FASE 28 — Playground pediátrico

Habilitar el selector Primary del playground cuando la Fase 27 esté terminada.

Añadir ejemplos interactivos:

~~~json
["51", "52", "65"]
~~~

y controles equivalentes de selección, tooltip y etiquetas. Mostrar
explícitamente las opciones de layout disponibles para primaria.

Criterio de aceptación:

* El usuario puede cambiar entre Permanent y Primary sin recargar.
* La selección se reinicia o se normaliza al cambiar de dentición para evitar
  IDs que no existen en el nuevo conjunto.

## FASE 29 — Pruebas pediátricas

Agregar pruebas para:

* Dataset de cinco geometrías, tipos y posiciones.
* FDI completo temporal y 20 piezas renderizadas.
* Transforms y orientación de Q5, Q6, Q8 y Q7.
* Selección simple y múltiple, v-model y eventos.
* Tooltip, condiciones y leyendas temporales.
* Aislamiento: el render temporal no usa permanentTeethPaths ni
  permanentHorizontalTeethPaths.

Criterio de aceptación:

~~~bash
npm run test
npm run build
npm run build:playground
~~~

funcionan correctamente.

## FASE 30 — Documentación y preparación mixta

Actualizar README y documentación de dentición mixta para incluir:

* Uso de dentition="primary".
* Tabla FDI temporal.
* Layouts disponibles y limitaciones pediátricas.
* Origen/licencia de los assets SVG.
* Ejemplos de selección y condiciones temporales.
* Cómo coexistirán los datos temporal y permanente antes de activar la UI mixta.

## Orden obligatorio para dentición primaria

~~~text
23 SVG y validación clínica/licencia
      ↓
24 Contrato de datos
      ↓
25 Dataset pediátrico
      ↓
26 Composición en arco
      ↓
27 Odontogram primario
      ↓
28 Playground
      ↓
29 Pruebas
      ↓
30 Documentación y preparación mixta
~~~

Restricciones:

* No implementar la Fase 27 antes de completar las Fases 23–26.
* No usar geometría, transforms o escalas permanentes como sustituto temporal
  sin una validación visual y anatómica explícita.
* No publicar ni redistribuir SVG sin verificar licencia.
* No habilitar layout="horizontal" para primaria hasta contar con su segundo
  dataset pediátrico.






---

# Extensión futura — Layout horizontal para dentición primaria

## Objetivo

Incorporar `<Odontogram dentition="primary" layout="horizontal" />` como una
segunda presentación para las 20 piezas temporales FDI. Debe conservar
selección, condiciones, tooltip, etiquetas, eventos y accesibilidad del
componente existente.

El layout horizontal es una decisión visual. No modifica IDs FDI ni el modelo de
dentición. Requiere cinco geometrías pediátricas horizontales propias y una
composición independiente; no se habilitará usando el dataset permanente ni
los transforms del arco pediátrico.

Los SVG pediátricos actuales y los que se creen en esta extensión siguen siendo
**provisionales para desarrollo visual** hasta contar con revisión odontológica.

## FASE 31 — Auditoría y especificación del layout horizontal Primary

Analizar las cinco formas primarias actuales, los ajustes locales de incisivos y
canino, y la composición horizontal permanente solo como referencia de
interacción, no como fuente geométrica.

Crear:

~~~text
docs/primary-horizontal-layout-analysis.md
~~~

Definir y documentar:

* Objetivo visual: dos filas horizontales de cinco piezas por lado, sin
  solapamientos.
* Orden de lectura y correspondencia FDI de Q5, Q6, Q8 y Q7.
* Área de trabajo, `viewBox` tentativo y límites de cada pieza.
* Separación de centrales, laterales y caninos ya aprobada para el arco, y qué
  ajustes deben redibujarse para el layout horizontal.
* Origen, autoría y licencia de cualquier path que se derive o cree.
* Criterios de revisión visual: orientación lateral, distancia entre piezas,
  simetría, ausencia de recortes y legibilidad en pantallas pequeñas.

Criterio de aceptación:

* Existe una especificación independiente del arco y de la dentición
  permanente.
* Se confirma que se necesitan cinco formas horizontales pediátricas propias.

## FASE 32 — Contrato interno de datasets por dentición y layout

Revisar el selector interno de geometría para expresar de forma explícita la
combinación:

~~~text
permanent + arch
permanent + horizontal
primary + arch
primary + horizontal
~~~

Mantener la API pública `OdontogramLayout = 'arch' | 'horizontal'` y evitar
duplicar `Tooth.vue` o crear un odontograma pediátrico separado.

Definir, si es necesario, un mapa interno de capacidades/datasets que permita:

* Resolver geometría y composición por dentición + layout.
* Mantener `mixed` fuera del renderizado.
* Rechazar con un mensaje claro una combinación que aún no tenga dataset.
* Mantener `ToothShape` libre de Vue, cuadrante e ID FDI.

Criterio de aceptación:

* El contrato no mezcla FDI, datos SVG y presentación clínica.
* TypeScript impide seleccionar un dataset inexistente internamente.

## FASE      — Dataset SVG horizontal pediátrico provisional

Crear:

~~~text
src/data/primary-horizontal.ts
~~~

Incluir cinco `ToothShape` independientes, posiciones 1–5:

~~~text
Primary Central Incisor
Primary Lateral Incisor
Primary Canine
Primary First Molar
Primary Second Molar
~~~

Reglas:

* Las coordenadas se diseñan para la composición horizontal; no se escala o
  transforma automáticamente `primaryTeethPaths` en tiempo de renderizado.
* Puede derivarse explícitamente una aproximación de los paths primarios de
  arco, pero el resultado debe registrarse como un segundo dataset y
  documentar sus cambios.
* No usar `permanentTeethPaths`, `permanentHorizontalTeethPaths` ni
  premolares permanentes como sustitutos.
* Conservar `outlinePath`, `shadowPath` y `lineHighlightPath` cuando
  corresponda.
* Etiquetar el dataset como provisional, sin precisión anatómica ni uso
  diagnóstico.

Criterio de aceptación:

* Hay exactamente cinco geometrías horizontales primarias.
* Centrales, laterales, caninos y ambos molares son distinguibles y no se
  solapan en su revisión aislada.
* El archivo no importa Vue.

## FASE 34 — Composición horizontal Primary

Crear una definición de layout pediátrica horizontal independiente de
`primaryArchLayoutDefinition`.

Determinar:

* `viewBox` horizontal y transforms de Q5, Q6, Q8 y Q7.
* Dos filas y sus lados anatómicos, preservando el orden FDI.
* Orientación izquierda/derecha de incisivos y caninos.
* Separación explícita de las cinco posiciones por cuadrante.
* Estrategia responsive a través del SVG, sin CSS que deforme los paths.

Crear:

~~~text
src/utils/primary-horizontal-layout.ts
docs/primary-horizontal-layout.md
~~~

Criterio de aceptación:

* Los cuatro cuadrantes contienen cinco piezas sin solapamiento ni recorte.
* Los transforms no se copian del layout horizontal permanente.
* La composición usa exclusivamente el dataset de la Fase 33.

## FASE 35 — Habilitar Primary horizontal en Odontogram

Extender el selector de `Odontogram.vue` para que:

~~~vue
<Odontogram dentition="primary" layout="horizontal" />
~~~

use el dataset y la composición pediátricos horizontales.

Requisitos:

* Eliminar la alternativa forzada a `arch` solo después de que las Fases
  31–34 estén completas.
* `primary + arch` conserva el comportamiento actual.
* `permanent + arch/horizontal` no cambia.
* Se reutilizan `Tooth.vue`, selección, `v-model`, condiciones, tooltip,
  labels, disabled, accesibilidad y eventos.
* Los IDs siguen siendo FDI `51–55`, `61–65`, `71–75` y `81–85`.

Criterio de aceptación:

* Primary horizontal renderiza exactamente 20 piezas y Primary arch continúa
  renderizando 20.
* No se crea `PrimaryHorizontalOdontogram.vue`.
* Cambiar entre arch y horizontal conserva la selección primaria controlada.

## FASE 36 — Playground horizontal pediátrico

Actualizar el playground para habilitar `Horizontal` cuando
`dentition === 'primary'`.

Incluir:

* Alternancia Primary Arch ↔ Horizontal sin recargar.
* Conservación del ejemplo `["51", "52", "65"]` y de la selección al cambiar
  de layout.
* Condiciones, tooltip, labels y selección simple/múltiple en ambos layouts.
* Aviso visible de que la geometría primaria horizontal es provisional y no
  clínica.

Criterio de aceptación:

* El usuario puede revisar visualmente las cuatro combinaciones soportadas.
* Cambiar Permanent ↔ Primary sigue reiniciando o normalizando IDs inválidos.

## FASE 37 — Pruebas y revisión visual Primary horizontal

Agregar pruebas para:

* Dataset horizontal con cinco posiciones y tipos temporales correctos.
* Aislamiento: Primary horizontal no usa datasets permanentes ni el dataset
  Primary arch.
* `viewBox`, transforms, orden Q5/Q6/Q8/Q7 e IDs FDI de 20 piezas.
* Selección simple, múltiple, `v-model`, eventos, disabled, tooltip,
  condiciones y leyendas.
* Conservación de selección al cambiar Primary Arch ↔ Primary Horizontal.
* Regresión de layouts permanentes.
* Orientación y separación de incisivos y caninos.

Realizar además una revisión visual manual en el playground para escritorio y
pantalla estrecha, registrando cualquier ajuste pendiente.

Criterio de aceptación:

~~~bash
npm run test
npm run build
npm run build:playground
~~~

funcionan correctamente y no hay solapamientos visibles conocidos.

## FASE 38 — Documentación y preparación de publicación

Actualizar README y documentación pediátrica con:

* Ejemplo de `dentition="primary" layout="horizontal"`.
* Tabla de layouts disponibles por dentición.
* Limitaciones de la geometría provisional, origen y licencia de los assets.
* Ejemplos de selección y condiciones FDI temporales.
* Nota de compatibilidad con la futura dentición mixta.

Criterio de aceptación:

* La documentación no anuncia precisión clínica para ningún SVG pediátrico
  provisional.
* La API, los layouts disponibles y sus limitaciones se describen sin
  contradicciones.

## Orden obligatorio de la extensión Primary horizontal

~~~text
31 Auditoría y especificación
      ↓
32 Contrato interno
      ↓
33 Dataset SVG horizontal
      ↓
34 Composición horizontal
      ↓
35 Renderizado en Odontogram
      ↓
36 Playground
      ↓
37 Pruebas y revisión visual
      ↓
38 Documentación
~~~

Restricciones:

* No habilitar `primary + horizontal` antes de completar las Fases 31–34.
* No reutilizar geometría ni transforms permanentes como atajo.
* No generar el layout horizontal transformando automáticamente los paths del
  arco en tiempo de renderizado.
* No declarar los assets pediátricos provisionales como anatómicamente válidos
  ni aptos para diagnóstico.
* No crear componentes duplicados para un layout o dentición.




# Implementación — Integrar vue-odontogram en Laravel + Vue

Sí, el paquete está preparado para consumirse como una dependencia Vue. La
forma recomendada es validarlo primero como dependencia local o archivo
empaquetado y, cuando la API esté estable, publicarlo en un registro privado
npm de la organización.

## Flujo de distribución recomendado

~~~text
vue-odontogram (código fuente)
        ↓ npm run build
dist/ + definiciones TypeScript
        ↓ npm pack o npm publish
dependencia npm
        ↓ npm install en Laravel
componente Vue bajo resources/js/
        ↓ npm run build
assets Vite publicados por Laravel
~~~

## Archivos que se deben distribuir

El consumidor Laravel no debe copiar los SVG ni la carpeta \`src/\` manualmente.
Al construir y empaquetar la librería, el paquete expone:

| Archivo | Uso |
| --- | --- |
| \`dist/vue-odontogram.js\` | Módulo ESM usado por Vite. |
| \`dist/vue-odontogram.umd.cjs\` | Compatibilidad CommonJS/UMD. |
| \`dist/vue-odontogram.css\` | Estilos obligatorios del componente. |
| \`dist/index.d.ts\` | Tipos TypeScript. |
| \`package.json\` | Entradas, exports y dependencia peer de Vue. |

El \`package.json\` ya limita el contenido publicado a \`dist/\`; por tanto,
tests, playground, documentación, fuentes y la referencia React no forman parte
de la dependencia instalada.

## Preparar una entrega de la librería

Desde la raíz de \`vue-odontogram\`:

~~~bash
npm install
npm run test
npm run build
npm pack
~~~

\`npm pack\` genera un archivo \`.tgz\` versionado, por ejemplo
\`vue-odontogram-0.1.0.tgz\`. Es la opción más práctica para entregar una
versión concreta sin publicar todavía en un registro.

Antes de la primera publicación formal conviene añadir un archivo \`LICENSE\`
que corresponda al campo \`license: "MIT"\` del manifiesto y revisar las
licencias de cualquier SVG de terceros incluido en futuras versiones.

## Opción A — Dependencia local durante el desarrollo

Es útil si ambos proyectos viven en carpetas vecinas y se está iterando
rápidamente.

1. Construir la librería con \`npm run build\`.
2. Desde la raíz del proyecto Laravel instalar la carpeta de la librería:

~~~bash
npm install --save file:../vue-odontogram
~~~

También puede quedar declarada de forma explícita en el \`package.json\` de
Laravel:

~~~json
{
  "dependencies": {
    "vue-odontogram": "file:../vue-odontogram"
  }
}
~~~

Tras modificar la librería, ejecutar de nuevo \`npm run build\` dentro de ella
y \`npm install\` en Laravel para refrescar la copia instalada. Esta modalidad
no debe usarse para despliegues reproducibles si la ruta local no existe en el
servidor o CI.

## Opción B — Entregar un tarball versionado

Es la recomendación inicial para integrar la librería en Laravel sin depender
de rutas locales.

1. Ejecutar \`npm pack\` en \`vue-odontogram\`.
2. Copiar el \`.tgz\` generado a una carpeta versionada del proyecto Laravel,
   por ejemplo \`packages/\`.
3. Instalarlo desde la raíz de Laravel:

~~~bash
npm install --save ./packages/vue-odontogram-0.1.0.tgz
~~~

El tarball queda registrado en \`package.json\` y en el archivo de bloqueo
(\`package-lock.json\` o equivalente), de modo que CI y otros entornos reciben
la misma versión.

## Opción C — Publicarlo como dependencia npm

Cuando la API esté estable, publicar en npm o en un registro privado
(GitHub Packages, GitLab, Verdaccio u otro autorizado por el equipo).

~~~bash
npm version patch
npm run test
npm run build
npm publish
~~~

En Laravel se instalaría después con:

~~~bash
npm install vue-odontogram
~~~

Para un paquete privado se debe configurar el registro y autenticación del
equipo antes de \`npm publish\`. Si se adopta un scope interno, por ejemplo
\`@mi-organizacion/vue-odontogram\`, hay que actualizar el campo \`name\` de
esta librería antes de publicar. Nunca versionar tokens de registro en el
repositorio.

## Archivos a crear dentro de Laravel

Crear un componente adaptador en la aplicación, sin duplicar internamente la
librería:

~~~text
resources/
└── js/
    ├── components/
    │   └── odontogram/
    │       └── OdontogramField.vue
    └── pages/
        └── PatientOdontogram.vue
~~~

\`OdontogramField.vue\` concentra la configuración visual y de negocio propia
de Laravel. La página, formulario Livewire/Inertia/Vue o vista que corresponda
solo entrega y persiste los IDs FDI seleccionados.

Ejemplo mínimo de \`resources/js/components/odontogram/OdontogramField.vue\`:

~~~vue
<script setup lang="ts">
import { computed } from 'vue'
import { Odontogram } from 'vue-odontogram'
import 'vue-odontogram/style.css'

const selectedTeeth = defineModel<string[]>({ default: () => [] })

const conditions = computed(() => [
  {
    label: 'Tratamiento pendiente',
    teeth: selectedTeeth.value,
    fillColor: '#fbbf24',
    outlineColor: '#b45309',
  },
])
</script>

<template>
  <Odontogram
    v-model="selectedTeeth"
    dentition="primary"
    layout="horizontal"
    :conditions="conditions"
    show-labels
  />
</template>
~~~

Uso desde una página Vue de Laravel:

~~~vue
<script setup lang="ts">
import { ref } from 'vue'
import OdontogramField from '@/components/odontogram/OdontogramField.vue'

const teeth = ref<string[]>([])
</script>

<template>
  <OdontogramField v-model="teeth" />
</template>
~~~

Para cambiar de modelo se usan las props de la librería:

~~~vue
<Odontogram v-model="teeth" dentition="permanent" layout="horizontal" />
<Odontogram v-model="teeth" dentition="primary" layout="arch" />
~~~

La versión actual soporta \`permanent\` y \`primary\`, con layouts \`arch\` y
\`horizontal\`. La dentición \`mixed\` sigue fuera de alcance. Los SVG
pediátricos son aproximaciones provisionales y no deben presentarse como
geometría clínica o diagnóstica.

## Integración con Vite de Laravel

Si el proyecto Laravel ya utiliza Vue mediante \`@vitejs/plugin-vue\`, no
requiere ajustes especiales en \`vite.config.js\`. Vite resuelve el módulo y
el import de \`vue-odontogram/style.css\` lo incorpora al bundle de la página.

La librería declara Vue como \`peerDependency\`, así que el proyecto Laravel
debe tener Vue 3.5 o compatible instalado. No instalar una segunda copia de
Vue dentro de la librería.

Para el build de producción de Laravel:

~~~bash
npm run build
php artisan optimize
~~~

## Persistencia hacia Laravel

El valor de \`v-model\` es un arreglo de IDs FDI. Enviar \`teeth\` a la ruta o
API de Laravel junto con el resto del formulario; no se envían SVG ni datos de
renderizado.

Ejemplo de payload:

~~~json
{
  "teeth": ["51", "52", "65"]
}
~~~

El backend debe validar un arreglo de strings y restringir los IDs al contexto
clínico permitido. El componente adaptador es el lugar indicado para normalizar
la selección cuando el usuario cambie entre dentición primaria y permanente.

## Checklist de integración

* Instalar la dependencia mediante \`file:\`, \`.tgz\` o registro npm.
* Importar una vez \`vue-odontogram/style.css\` en el componente o entrada
  global de Laravel.
* Probar las cuatro combinaciones: Permanent/Primary × Arch/Horizontal.
* Verificar selección múltiple, condiciones, tooltips y estado disabled.
* Enviar y validar el arreglo FDI en Laravel.
* Ejecutar \`npm run build\` de Laravel y comprobar el manifest de Vite.
* Mantener visible la advertencia de geometría pediátrica provisional donde
  corresponda.

## Decisión sugerida

Durante la integración usar la **Opción B (\`npm pack\` + tarball)**: produce
entregas repetibles y no obliga a montar un registro todavía. Usar la Opción A
solo para desarrollo local activo. Una vez validado el uso en Laravel y fijada
la API, mover la distribución a un registro privado y actualizar versiones con
semver.


---

# Registro de implementación — odontograma pediátrico

## Estado actual

La dentición `primary` está disponible en los layouts `arch` y `horizontal`.
Sus geometrías siguen siendo provisionales y exclusivas para revisión visual;
no deben utilizarse como representación clínica validada.

### Arco pediátrico (`layout="arch"`)

Se revisó la composición de las 20 piezas sin modificar ninguno de los paths
SVG de `src/data/primary.ts`. Los cambios se concentran en transforms de
presentación dentro de `Tooth.vue` y en el espejo de cuadrantes de
`primary-layout.ts`.

* Los cuadrantes inferiores son el reflejo vertical de los superiores y
  preservan sus paths, tamaños y curvaturas.
* Los incisivos laterales temporales se desplazan en X y usan una rotación
  local acumulada de `20°`; la reflexión horizontal deja al lateral superior
  izquierdo en sentido antihorario.
* Los caninos temporales se acercaron a los laterales mediante un ajuste solo
  en X.
* Los primeros molares conservan el ajuste lateral solicitado: `54` y `84`
  se desplazan hacia la izquierda visible; `64` y `74`, hacia la derecha
  visible, gracias a la reflexión horizontal del cuadrante.
* Los primeros molares se aproximaron ligeramente a los caninos sin mover las
  demás categorías de piezas.
* Los segundos molares superiores e inferiores mantienen la misma separación
  relativa que el resto de su arco. Para evitar solapamientos inferiores y
  separarlos más de 30 unidades de los superiores, se desplazó el arco
  inferior completo, en vez de mover solo `75` y `85`.
* El `viewBox` pediátrico de arco es `0 0 409 461`.

### Cobertura de regresión

Las pruebas protegen:

* IDs FDI y las 20 piezas temporales.
* Transformaciones, espaciado y orientación por cuadrante.
* Simetría entre arco superior e inferior.
* Aislamiento de datasets pediátricos para los layouts Arch y Horizontal.
* Selección, eventos, tooltip, condiciones y accesibilidad.

Última verificación local:

```bash
npm run typecheck
npm test
```

Resultado: 25 archivos de prueba y 60 pruebas aprobadas.

## Próximo trabajo recomendado

1. Realizar revisión visual clínica de los assets temporales antes de cambiar
   su estado de `provisional`.
2. Mantener los ajustes de presentación separados de los paths anatómicos.
3. Antes de publicar, seguir el plan de `DoNPM.md`.

