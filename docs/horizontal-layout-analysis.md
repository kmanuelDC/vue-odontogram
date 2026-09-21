# Auditoría del layout horizontal

Fecha de auditoría: 2026-09-20  
Fuente: `react-odontogram-main/src/data.ts::NewTeethPaths` y
`react-odontogram-main/src/utils.ts::quadrants`

## Conclusión

`NewTeethPaths` es un segundo dataset SVG permanente, no una transformación
matemática de `teethPaths`. Contiene ocho formas que corresponden a las mismas
posiciones anatómicas permanentes, pero con coordenadas y orientación base
distintas para una composición horizontal. Debe portarse como
`permanent-horizontal.ts`, sin sobrescribir `permanent.ts`.

## Correspondencia anatómica

| Posición | Dataset curvo | Dataset horizontal | Decisión |
| --- | --- | --- | --- |
| 1 | Central Incisor | Central Incisor | Reutilizar como posición 1 |
| 2 | Lateral Incisor | Lateral Incisor | Reutilizar como posición 2 |
| 3 | Canine | Canine | Reutilizar como posición 3 |
| 4 | First Premolar | First Premolar | Reutilizar como posición 4 |
| 5 | Second Premolar | Second Premolar | Reutilizar como posición 5 |
| 6 | First Molar | First Molar | Reutilizar como posición 6 |
| 7 | Second Molar | Second Molar | Reutilizar como posición 7 |
| 8 | Third Molar | Third Molar | Reutilizar como posición 8 |

Los dos datasets tienen ocho objetos, con posiciones `1–8` y los mismos tipos
permanentes. Los paths no son idénticos: el curvo ocupa una composición de
`409 × 694`; el horizontal tiene piezas compactas con coordenadas base
aproximadas entre `0–424` en X y `0–55` en Y.

## ViewBox y transforms originales

El layout horizontal completo usa:

```text
viewBox="0 0 900 150"
```

Los grupos SVG se renderizan en el mismo orden FDI visual que el layout curvo:
Q1, Q2, Q4, Q3.

| Cuadrante | Arcada / lado | Transform original |
| --- | --- | --- |
| Q1 | superior derecha | `""` |
| Q2 | superior izquierda | `translate(840, 0) scale(-1, 1) translate(-55,0)` |
| Q4 | inferior derecha | `scale(1, -1) translate(0, -150)` |
| Q3 | inferior izquierda | `translate(840, 0) scale(-1, -1) translate(-55,-150)` |

El viewBox para recortes de arcada, si se reincorpora la funcionalidad futura
`showHalf`, es:

```text
upper: 0 0 900 75
lower: 0 75 900 75
```

No se implementará `showHalf` dentro de la extensión horizontal sin una tarea
específica; el alcance de la Fase 19 es el odontograma completo.

## Implicaciones de diseño

1. **No mezclar datos.** `permanentTeethPaths` y el futuro
   `permanentHorizontalTeethPaths` son alternativas de presentación, no un
   único array con transforms intercambiables.
2. **Conservar dominio.** El layout no altera `ToothDefinition`, FDI, tipo,
   dentición, condiciones ni selección. Ambos datasets producen IDs `11–48`.
3. **Aislar la presentación.** La Fase 17 definirá el viewBox y transforms por
   layout; `Tooth.vue` seguirá recibiendo una sola `ToothDefinition`.
4. **Portado literal.** En la Fase 18 se copiarán los valores SVG de
   `NewTeethPaths` sin redibujar ni normalizar sus coordenadas.
5. **Sin extensión pediátrica.** Este segundo dataset solo cubre ocho formas
   permanentes y no desbloquea dentición temporal u horizontal pediátrica.

## Riesgos a cubrir en fases posteriores

- Las transforms de SVG se deben preservar exactamente; cambios de orden en
  `translate` y `scale` cambian la posición final.
- La selección debe sobrevivir a un cambio de layout, ya que los IDs FDI son
  estables.
- Tooltip y condiciones deben usar el `DOMRect` de la forma ya transformada,
  por lo que no necesitan un cálculo específico de coordenadas horizontales.
- Las pruebas deben comprobar 32 dientes, los cuatro transforms y FDI en ambos
  modos.

## Estado de la fuente auditada

La copia local `react-odontogram-main` fue retirada después de portar los
assets necesarios. Esta documentación conserva la procedencia histórica y la
referencia MIT; el build, las pruebas y el paquete `@kmdk/vue-odontogram` no
dependen de ese directorio.
