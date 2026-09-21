# Contrato de datos para dentición primaria

## Tipos centrales

La geometría se declara en `src/types/geometry.ts`:

- `PermanentToothType`: ocho tipos permanentes.
- `PrimaryToothType`: incisivo central, incisivo lateral, canino y los dos
  molares temporales.
- `ToothType`: unión de ambos conjuntos.
- `ToothShape`: posición, tipo y paths SVG, sin Vue ni reglas clínicas.

`ToothDefinition` continúa agregando `id`, `quadrant` y `dentition` a
una forma. Por lo tanto, una geometría no decide por sí misma si pertenece a
un cuadrante ni genera FDI.

## Posiciones

| Dentición | Posiciones válidas |
| --- | --- |
| Permanente | 1–8 |
| Temporal | 1–5 |

La validación de FDI ya aplica estos límites. El dataset temporal seguirá vacío
hasta que se autoricen cinco SVG pediátricos; el contrato admite esas formas,
pero no convierte los datos pendientes en geometría renderizable.

