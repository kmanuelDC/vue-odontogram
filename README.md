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

## Layouts

Los layouts cambian solamente la presentación: nunca modifican IDs FDI, selección, condiciones ni eventos.

| Dentición | Layouts disponibles | Nota |
| --- | --- | --- |
| Permanente | `arch`, `horizontal` | Ambos usan datasets SVG permanentes propios. |
| Primaria | `arch`, `horizontal` | Ambos usan datasets SVG pediátricos propios y **provisionales**. |

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

## Props principales

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `modelValue` | `string[]` | `[]` | IDs FDI seleccionados; se usa con `v-model`. |
| `dentition` | `'permanent' \| 'primary'` | `'permanent'` | Conjunto de piezas que se renderiza. `mixed` aún no es renderizable. |
| `notation` | `ToothNotation` | `'FDI'` | FDI está implementada; Universal y Palmer quedan para una extensión posterior. |
| `layout` | `'arch' \| 'horizontal'` | `'arch'` | Presentación disponible para Permanent y Primary; el dataset Primary sigue siendo provisional. |
| `singleSelect` | `boolean` | `false` | Limita la selección a una pieza. |
| `disabled` | `boolean` | `false` | Deshabilita interacción y selección. |
| `showTooltip` | `boolean` | `true` | Activa el tooltip al pasar el cursor. |
| `showLabels` | `boolean` | `false` | Muestra la leyenda de condiciones. |
| `conditions` | condición[] | `undefined` | Colores y etiqueta por IDs FDI. |

## Eventos

| Evento | Payload |
| --- | --- |
| `update:modelValue` | `string[]` con la nueva selección. |
| `change` | `string[]` con la nueva selección. |
| `tooth-click` | `ToothDefinition`, seguido de `string[]` con la selección. |

## Licencia y procedencia de los SVG

El código propio de `@kmanueldc/vue-odontogram` se distribuye bajo licencia MIT; consulta [LICENSE](LICENSE).

Las geometrías SVG permanentes de `src/data/permanent.ts` y `src/data/permanent-horizontal.ts` se portaron de [biomathcode/react-odontogram](https://github.com/biomathcode/react-odontogram), también bajo MIT © biomathcode. La atribución y la copia de esa licencia se conservan en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Los dos datasets pediátricos de cinco formas, `src/data/primary.ts` (Arch) y `src/data/primary-horizontal.ts` (Horizontal), son paths simplificados propios creados para prototipado. Son **provisionales**, no tienen validación odontológica y no deben emplearse para diagnóstico, tratamiento ni como representación clínica definitiva. Consulta [la nota de aproximación Arch](docs/primary-svg-approximation.md), [la aproximación Horizontal](docs/primary-horizontal-svg-approximation.md), [la composición Horizontal](docs/primary-horizontal-layout.md) y [el registro de fuentes](docs/primary-svg-sources.md) antes de redistribuirlos o considerarlos para uso clínico.

## Dentición mixta

El tipo de dominio contempla `mixed`, pero el componente no lo renderiza aún. La futura API recibirá una colección explícita de piezas permanentes y primarias, conservando IDs FDI y selección en un único `string[]`. Consulta el [diseño de dentición mixta](docs/mixed-dentition.md).

## Playground

Para validar visualmente ambos conjuntos durante el desarrollo:

```bash
npm install
npm run dev:playground
```

El playground permite alternar Permanent/Primary, selección, tooltip, leyendas y los layouts compatibles. Incluye el ejemplo primario `["51", "52", "65"]`.

## Desarrollo

```bash
npm run test
npm run build
npm run build:playground
```






