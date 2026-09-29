# Composición provisional de dentición primaria en arco

## Alcance

La composición primaria en arco usa exclusivamente `primaryTeethPaths` y está
marcada como provisional, al igual que sus cinco geometrías. El layout
horizontal pediátrico tiene su propio dataset y composición; consulta
[primary-horizontal-layout.md](primary-horizontal-layout.md).

## Espacio SVG

```text
viewBox: 0 0 409 461
```

Las aproximaciones del arco superior llegan aproximadamente a `y=209`. El
alto de 461 unidades permite reflejar el arco inferior conservando todos sus
espaciados y deja más de 30 unidades entre los segundos molares superiores e
inferiores.

## Cuadrantes y orientación

| Orden de renderizado | FDI | Posición | Transform |
| --- | --- | --- | --- |
| 1 | Q5 | superior derecha | `""` |
| 2 | Q6 | superior izquierda | `scale(-1, 1) translate(-409, 0)` |
| 3 | Q8 | inferior derecha | `scale(1, -1) translate(0, -461)` |
| 4 | Q7 | inferior izquierda | `scale(-1, -1) translate(-409, -461)` |

Los transforms se declaran en `src/utils/primary-layout.ts` como una
configuración específica; los inferiores se generan con
`mirrorPrimaryQuadrant`. Comparten la anchura de 409 unidades de las
coordenadas usadas por las formas provisionales, pero no derivan
automáticamente del layout permanente.

Además de los transforms de cuadrante, `primaryArchLayoutDefinition` declara
`toothTransforms`: ajustes locales por tipo de pieza (separación de incisivos,
caninos y molares temporales) que solo existen en esta composición. El
composable `useOdontogram` los entrega a `Tooth.vue` mediante la prop
`layoutTransform`; `Tooth.vue` no conoce el layout. No modifican los paths SVG.

## Limitaciones

- La composición y las formas requieren revisión visual en el componente.
- El resultado sigue sin validación odontológica.
