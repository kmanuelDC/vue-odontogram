# Aproximaciones SVG pediátricas

## Estado y alcance

Los paths de `src/data/primary.ts` son assets provisionales creados para
prototipado visual. Su estado se expone como:

```ts
primaryGeometryStatus = {
  status: 'provisional',
  clinicallyValidated: false,
  intendedUse: 'development-and-visual-review',
}
```

No representan una fuente anatómica certificada ni deben emplearse con fines
diagnósticos o de tratamiento.

## Referencia de diseño

La ubicación y escala general toman como referencia el dataset SVG permanente
del proyecto, bajo su licencia MIT. Las cinco siluetas pediátricas se han
definido como paths simplificados propios para esta iteración; no son copias de
los premolares permanentes.

| Posición | Tipo | Decisión visual provisional |
| --- | --- | --- |
| 1 | Primary Central Incisor | Corona corta y redondeada, próxima a la línea media. |
| 2 | Primary Lateral Incisor | Más estrecho y corto que el central. |
| 3 | Primary Canine | Contorno de cúspide única. |
| 4 | Primary First Molar | Corona ancha con dos zonas de detalle oclusal. |
| 5 | Primary Second Molar | Corona más grande que la posición 4 y contorno de molar diferenciado. |

## Revisión visual pendiente

La siguiente iteración debe renderizar las formas con la composición pediátrica
en arco, comprobar superposiciones y ajustar proporciones en el playground.
Una revisión odontológica sigue siendo obligatoria antes de declararlas
anatómicamente válidas o distribuirlas como assets clínicos.
