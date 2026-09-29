# Estado de implementación

Las tareas y fases se definen en [ToDo.md](../ToDo.md).

| Tarea / Fase | Estado | Fecha | Evidencia |
| --- | --- | --- | --- |
| 01 — Auditoría de `react-odontogram` | Completada | 2026-09-20 | `docs/react-odontogram-analysis.md` |
| 02 — Estructura base Vue | Completada | 2026-09-20 | Configuración Vite, TypeScript y build de librería verificado |
| 03 — Portar `teethPaths` permanentes | Completada | 2026-09-21 | `src/data/permanent.ts` |
| 04 — Modelo de dominio | Completada | 2026-09-21 | `src/types/odontogram.ts`, `src/types/geometry.ts` |
| 05 — Numeración FDI | Completada | 2026-09-21 | `src/utils/notation.ts`, `src/utils/quadrants.ts`, `tests/notation.test.ts` |
| 06 — `Tooth.vue` | Completada | 2026-09-21 | `src/components/Tooth.vue` |
| 07 — Odontograma permanente | Completada | 2026-09-21 | `src/components/Odontogram.vue`, `tests/Odontogram.test.ts` |
| 08 — Tooltip y labels | Completada | 2026-09-21 | `OdontogramTooltip.vue`, `ConditionLabels.vue` |
| 09 — Dataset pediátrico | Completada (provisional) | 2026-09-21 | `src/data/primary.ts`, `docs/primary-dentition.md` |
| 10 — `dentition="primary"` | Completada (provisional) | 2026-09-21 | `tests/Odontogram-primary.test.ts` |
| 11 — Preparación dentición mixta | Completada (solo diseño) | 2026-09-21 | `docs/mixed-dentition.md` |
| 12 — API pública | Completada | 2026-09-21 | `src/index.ts`, `tests/public-api.test.ts` |
| 13 — Playground | Completada | 2026-09-21 | `playground/` |
| 14 — Tests | Completada | 2026-09-21 | `tests/` |
| 15 — Documentación | Completada | 2026-09-21 | `README.md` |
| 16–22 — Layout horizontal permanente | Completada | 2026-09-21 | `docs/horizontal-layout-analysis.md`, `src/data/permanent-horizontal.ts`, `src/utils/layout.ts` |
| 23 — Fuentes SVG pediátricas | Parcial | 2026-09-21 | `docs/primary-svg-sources.md`; sin fuente externa aprobada ni revisión odontológica |
| 24 — Contrato de datos pediátricos | Completada | 2026-09-21 | `docs/primary-data-contract.md` |
| 25 — SVG pediátricos provisionales | Completada (provisional) | 2026-09-21 | `docs/primary-svg-approximation.md` |
| 26 — Composición primaria en arco | Completada (provisional) | 2026-09-21 | `docs/primary-arch-layout.md`, `src/utils/primary-layout.ts` |
| 27–30 — Primary en componente, playground, pruebas y docs | Completada | 2026-09-21 | `tests/Odontogram-primary*.test.ts` |
| 31–36 — Layout horizontal primario | Completada (provisional) | 2026-09-21 | `docs/primary-horizontal-layout*.md`, `src/data/primary-horizontal.ts` |
| 37 — Revisión visual Primary horizontal | Pruebas automáticas completadas; revisión manual pendiente | 2026-09-21 | `docs/primary-horizontal-visual-review.md` |
| 38 — Documentación y publicación | Completada | 2026-09-21 | `README.md`, versión `0.1.1` |

Las fechas a partir de la Tarea 03 corresponden al primer commit del
repositorio, que agrupa todo ese trabajo.

## Ultimas funcionalidades

| Fase | Estado | Fecha | Evidencia |
| --- | --- | --- | --- |
| A — Base: correcciones de API, `useOdontogram`, composiciones y anchors por pieza | Completada | 2026-09-28 | `src/utils/compositions.ts`, `src/utils/anchors.ts`, `src/utils/svg-geometry.ts`, slot `overlay`; anchors contrastados con `getBBox()` de Chrome en las 104 piezas de las cuatro combinaciones |
| B — Mejoras rápidas: `showNumbers`, `showHalf`, navegación con flechas (tab stop único), slot de tooltip, tooltip con foco, `labels` y tema documentado | Completada | 2026-09-28 | `src/utils/numbers.ts`, `src/utils/navigation.ts`, `tests/Odontogram-quick-wins.test.ts`; revisión visual con capturas del playground en las cuatro combinaciones y en media arcada |
| C — Estado de pieza: prop `toothStates` (`missing`, `extracted`, `implant`, `unerupted`) con marcas visuales, tooltip, nombre accesible y leyenda | Completada | 2026-09-28 | `src/utils/state-marks.ts`, `tests/tooth-states.test.ts`; revisión visual con capturas del playground en las cuatro combinaciones |
| D — Superficies: diagrama de 5 superficies por pieza (`showSurfaces`) con `v-model:surfaces`, `surface-click`, nombres clínicos (incisal/palatino), navegación con teclado y hallazgos desplazados más allá del diagrama | Completada | 2026-09-29 | `src/utils/surfaces.ts`, `src/components/SurfaceDiagrams.vue`, `tests/surfaces.test.ts`; revisión visual con capturas del playground en las cuatro combinaciones |
| E (parcial) — Hallazgos: motor genérico (`findings`, `findingCatalog`), 16 símbolos y catálogo `ntsPeruFindingCatalog` con 31 códigos de pieza completa, siglas, entre dos piezas y de tramo | Completada; pendiente verificar el catálogo contra la NTS oficial | 2026-09-28 | `src/utils/findings.ts`, `src/utils/tooth-frames.ts`, `src/catalogs/nts-peru.ts`, `tests/findings.test.ts`; revisión visual con capturas del playground |
| E — Hallazgos y tratamientos: `surfaces` por hallazgo, `status` de flujo (`existing`, `planned`, `done`), `tone` y `color` propio, símbolos `fill`, `outline` y `cross`, y códigos NTS `caries`, `restoration`, `temporary-restoration` y `extraction` | Completada; pendiente verificar el catálogo contra la NTS oficial, sellantes y siglas de material | 2026-09-29 | `src/types/findings.ts`, `src/utils/findings.ts`, `tests/findings.test.ts`; revisión visual con capturas del playground en `arch` y `horizontal`. El antiguo `status: 'good' \| 'bad'` pasa a llamarse `tone` |
| F — Notaciones: `notation` `Universal` (1–32, primaria A–T) y `Palmer` (esquina de cuadrante, primaria A–E) para ambas denticiones; solo cambia el texto mostrado (números, `<title>`, tooltip, nombres accesibles y slot `number`) y los IDs siguen siendo FDI | Completada | 2026-09-29 | `src/utils/notation.ts`, `src/utils/numbers.ts`, `tests/notation.test.ts`, `tests/Odontogram-notation.test.ts`; revisión visual con capturas del playground. En Palmer, los números del gráfico dibujan la esquina con líneas SVG y los nombres accesibles usan `UR6` |
| G — Dentición mixta: `dentition="mixed"` con prop `teeth` (IDs FDI) y composición aprobada "filas NTS" (cuatro filas en `horizontal`, arcadas temporales dentro de las permanentes en `arch`); filas (`ToothRow`) para frames, números, navegación y tramos | Completada (provisional, como el dataset primario) | 2026-09-29 | `src/utils/mixed-layout.ts`, `src/utils/compositions.ts`, `tests/Odontogram-mixed.test.ts`, `docs/mixed-dentition.md`; revisión visual con capturas del playground. En `arch`, los diagramas y siglas temporales pueden solaparse con los números permanentes |

Última verificación: `npm run typecheck`, `npm test` (35 archivos y 241
pruebas aprobadas), `npm run build` y `npm run build:playground`.
