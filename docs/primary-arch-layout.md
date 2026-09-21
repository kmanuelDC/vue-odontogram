# Composición provisional de dentición primaria en arco

## Alcance

La composición primaria usa exclusivamente `primaryTeethPaths` y está marcada
como provisional, al igual que sus cinco geometrías. No habilita un layout
horizontal pediátrico.

## Espacio SVG

```text
viewBox: 0 0 409 500
```

Las aproximaciones del arco superior llegan aproximadamente a `y=209`. El
alto de 500 unidades permite reflejar el arco inferior y deja un espacio visual
central aproximado de 82 unidades. Este valor debe revisarse visualmente en el
playground durante la Fase 27.

## Cuadrantes y orientación

| Orden de renderizado | FDI | Posición | Transform |
| --- | --- | --- | --- |
| 1 | Q5 | superior derecha | `""` |
| 2 | Q6 | superior izquierda | `scale(-1, 1) translate(-409, 0)` |
| 3 | Q8 | inferior derecha | `scale(1, -1) translate(0, -500)` |
| 4 | Q7 | inferior izquierda | `scale(-1, -1) translate(-409, -500)` |

Los transforms se declaran en `primary-layout.ts` como una configuración
específica. Comparten la anchura de 409 unidades de las coordenadas usadas por
las formas provisionales, pero no derivan automáticamente del layout
permanente.

## Limitaciones

- La composición y las formas requieren revisión visual en el componente.
- No se debe ofrecer `layout="horizontal"` para primaria: falta un segundo
  dataset pediátrico y su propia composición.
- El resultado sigue sin validación odontológica.
