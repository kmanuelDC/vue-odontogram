# Auditoría de `react-odontogram`

Fecha de auditoría: 2026-09-20  
Fuente auditada: `../react-odontogram-main` (versión `0.5.8`)

## Resultado ejecutivo

La biblioteca original es un componente React web, con una variante React Native separada. Renderiza un único dataset de ocho dientes permanentes por cuadrante y lo refleja mediante transformaciones SVG para formar 32 piezas FDI. La separación entre datos, dominio, presentación y estado no está completa: el componente principal construye IDs, resuelve la notación, obtiene el tipo anatómico, administra selección, condiciones y tooltip.

La migración debe conservar literalmente las geometrías permanentes, pero no la estructura de responsabilidades. En particular, `maxTeeth=5` no es un modelo de dentición temporal: muestra incisivos, canino y premolares permanentes. No debe migrarse como soporte pediátrico.

## Arquitectura observada

```text
data.ts (SVG: teethPaths / NewTeethPaths)
  -> Odontogram.tsx (IDs, cuadrantes, selección, condiciones, tooltip)
       -> Teeth.tsx (un grupo SVG interactivo)
       -> Tooltip.tsx (posición fija en viewport)
       -> Labels.tsx (leyenda de condiciones)
  -> utils.ts (notación, viewBox, transforms y variables CSS)
  -> styles.css
```

La dependencia publica `Odontogram` como exportación por defecto y nombrada; la hoja de estilos se publica como `react-odontogram/style.css`.

## Inventario y decisión de migración

| Origen | Responsabilidad actual | Decisión | Destino Vue propuesto |
| --- | --- | --- | --- |
| `src/data.ts` / `teethPaths` | Ocho geometrías permanentes curvas | **REUTILIZAR** | `src/data/permanent.ts`, sin imports de Vue y con `name` normalizado a `position` |
| `src/data.ts` / `NewTeethPaths` | Segunda geometría para layout cuadrado | **ADAPTAR** | Evaluar como variante de layout; no mezclar con el dataset anatómico base |
| `src/type.ts` / tipos de dominio | Contratos de dominio mezclados con tipos React | **ADAPTAR** | `src/types/odontogram.ts`; retirar `ReactNode`, eventos y `CSSProperties` |
| `src/utils.ts` / `convertFDIToNotation` | Convierte solo IDs permanentes y tolera prefijo `teeth-` | **REDISEÑAR** | `utils/notation.ts`; entrada tipada por dentición, cuadrante y posición |
| `src/utils.ts` / cuadrantes | Metadatos y transforms SVG por cuadrante | **ADAPTAR** | `utils/quadrants.ts`; cuadrante numérico y orientación separados |
| `src/utils.ts` / viewBox y CSS | Geometría de layout y tematización | **ADAPTAR** | Utilidades de presentación, fuera de la lógica FDI |
| `src/Odontogram.tsx` | Orquestación, estado interno y render de toda la boca | **REDISEÑAR** | `Odontogram.vue` + `useOdontogram.ts` + `useToothSelection.ts` |
| `src/Teeth.tsx` | Render e interacción de una pieza SVG | **ADAPTAR** | `components/Tooth.vue`, props y emits Vue |
| `src/Tooltip.tsx` | Posicionamiento de tooltip y contenido por defecto | **ADAPTAR** | `components/OdontogramTooltip.vue`; slots en vez de `ReactNode` |
| `src/Labels.tsx` | Leyenda de condiciones | **ADAPTAR** | `components/ConditionLabels.vue` |
| `src/styles.css` | Estados visuales, color y tooltip | **ADAPTAR** | `src/styles/odontogram.css`, preservando variables CSS públicas |
| `src/index.ts` | Exportaciones | **REDISEÑAR** | API nombrada mínima de `src/index.ts` |
| Storybook, ejemplo y pruebas React | Referencia de comportamiento | **DESCARTAR** como código; **REUTILIZAR** como especificación de pruebas/playground |
| `packages/react-native-odontogram` | Implementación para React Native | **DESCARTAR** del alcance de Vue web |

## API pública actual

| Prop | Valor por defecto | Decisión de migración |
| --- | --- | --- |
| `defaultSelected: string[]` | `[]` | Sustituir por `modelValue?: string[]`; una prop inicial es opcional. |
| `singleSelect: boolean` | `false` | Conservar. |
| `onChange(selected: ToothDetail[])` | — | Sustituir por `change` y `update:modelValue`; documentar ambos payloads. |
| `name` | `"teeth"` | No esencial en la primera API; el input oculto debe ser opcional. |
| `className`, `styles` | — | Sustituir por atributos Vue `class` y `style`. |
| `theme`, `colors` | `light`, `{}` | Conservar como tema/variables CSS, no como lógica clínica. |
| `notation` | `FDI` | Conservar; FDI se implementa primero. |
| `tooltip`, `showTooltip` | activo | Conservar concepto; usar slot para contenido personalizado. |
| `showHalf` | `full` | Posponer o exponer después del núcleo permanente. |
| `maxTeeth` | `8` | **No migrar** como representación de dentición temporal. |
| `teethConditions` | — | Adaptar a un tipo de condición genérico, indexado por ID FDI sin prefijo. |
| `readOnly` | `false` | Renombrar a `disabled` o documentar una semántica común. |
| `showLabels` | `false` | Conservar. |
| `layout` | `circle` | Posponer como extensión; el ToDo solo exige transforms necesarios. |

- Los IDs internos son `teeth-11` a `teeth-48`, no FDI puros.
- `onChange` entrega objetos `{ id, notations, type }`; la selección es no controlada.
- Teclado: Enter y espacio alternan una pieza.
- Accesibilidad: contenedor `listbox`; dientes interactivos `option` y `aria-selected`.

La nueva API debe usar IDs FDI puros (`"11"`, `"48"`) en `v-model`. El evento `tooth-click` puede incluir `ToothDefinition` y la selección resultante.

## Dataset, IDs y cuadrantes

`teethPaths` contiene exactamente ocho posiciones: Central Incisor, Lateral Incisor, Canine, First Premolar, Second Premolar, First Molar, Second Molar y Third Molar.

El componente concatena `teeth-`, el prefijo de cuadrante y la posición del path:

```text
Q1: 11–18  superior derecha
Q2: 21–28  superior izquierda
Q4: 41–48  inferior derecha
Q3: 31–38  inferior izquierda
```

El orden de renderizado es Q1, Q2, Q4, Q3. La nueva implementación debe representar explícitamente `arch`, `side`, `quadrant`, `position` y `dentition`.

### Transformaciones SVG existentes

Para el layout curvo, los grupos usan:

| Cuadrante | Transform |
| --- | --- |
| Q1 superior derecha | `""` |
| Q2 superior izquierda | `scale(-1, 1) translate(-409, 0)` |
| Q4 inferior derecha | `scale(1, -1) translate(0, -694)` |
| Q3 inferior izquierda | `scale(-1, -1) translate(-409, -694)` |

El layout cuadrado utiliza `NewTeethPaths`, otros transforms y `viewBox="0 0 900 150"`. Como no es el mismo conjunto geométrico, no se debe mezclar con el dataset anatómico base.

## Selección, condiciones, tooltip y etiquetas

La selección usa un `Set<string>` local. En modo múltiple alterna el ID; en modo único lo sustituye o lo vacía si se repite. Debe trasladarse a `useToothSelection.ts` y sincronizarse con `v-model`.

Las condiciones son grupos con etiqueta, IDs y colores. Si un ID aparece en varios grupos, el último gana al insertarse en un `Map`; esta regla debe declararse o validarse.

El tooltip se activa por hover o foco, calcula el `DOMRect` del primer path y se fija respecto al viewport, con límites y cambio de lado cuando falta espacio. La posición es adaptable; su `ReactNode`/render function debe transformarse en slot Vue. Las etiquetas son independientes del SVG y se pueden portar casi sin cambios visuales.

## Dependencias específicas de React

| React | Vue |
| --- | --- |
| `FC`, JSX y `ReactNode` | SFC con `<script setup>` y slots |
| `useState` | `ref` / `computed` |
| `useMemo` | `computed` |
| `useCallback` | funciones locales y valores derivados |
| `useRef` | `ref<SVGSVGElement | null>` |
| `useEffect` | `watch` / ciclo de vida |
| callbacks `onChange` | `defineEmits` |
| `CSSProperties`, `className` | atributos `style` y `class` |

React, React DOM, PropTypes, Testing Library React, Storybook React y tsup con `external: ["react"]` no pertenecen a la dependencia Vue.

## Riesgos y desviaciones necesarias

1. **Pediatría:** `maxTeeth=5` reutiliza First/Second Premolar y es anatómicamente incorrecto. Se descarta como estrategia pediátrica.
2. **Notación:** Universal y Palmer solo cubren 32 permanentes mediante tabla fija. FDI debe nacer de dentición, cuadrante y posición; las demás quedan preparadas, no fingidamente completas.
3. **Modelo:** los paths usan `name: string`. La nueva forma debe usar `position: number` y `ToothType` cerrado.
4. **Selección:** el prefijo técnico `teeth-` no debe exponerse a consumidores.
5. **Estado externo:** Vue debe reaccionar a cambios posteriores de `modelValue`, a diferencia de `defaultSelected`.

## Cobertura existente aprovechable

Las pruebas React verifican 32 piezas, mitades, `maxTeeth`, selección múltiple/única, teclado, tooltip deshabilitado, transforms, notación permanente y variables CSS. Deben traducirse a Vitest y Vue Test Utils en las tareas 05, 07, 08 y 14. No deben conservar la expectativa de que `maxTeeth=5` son dientes temporales.

## Conclusión

La Tarea 02 puede crear una librería Vue limpia sin copiar componentes React. Para la Tarea 03 se reutilizará literalmente el contenido SVG de `teethPaths`, no su acoplamiento React. Mantener `react-odontogram-main` hasta confirmar esa extracción y preservar la licencia MIT; después podrá retirarse para dejar el repositorio Vue limpio.


> Nota histórica: `react-odontogram-main` fue retirado del workspace después de
> portar los datasets necesarios. Esta auditoría y los avisos de licencia
> conservan su procedencia; el build, las pruebas y la publicación de
> `@kmdk/vue-odontogram` no dependen de esa carpeta.
