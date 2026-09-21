# Aproximaciones SVG pediátricas horizontales

## Estado y origen

`src/data/primary-horizontal.ts` contiene cinco paths simplificados propios
para el prototipo visual del layout horizontal Primary. Son un segundo dataset:
no son transforms en tiempo de renderizado de `primaryTeethPaths`, ni usan
geometría de los datasets permanentes.

El estado de las cinco formas es:

~~~ts
{
  status: 'provisional',
  clinicallyValidated: false,
  intendedUse: 'development-and-visual-review',
  source: 'original-horizontal-prototype',
}
~~~

No representan anatomía clínica validada y no se pueden utilizar para
diagnóstico o tratamiento.

## Decisiones de geometría

| Posición | Tipo | Decisión visual |
| --- | --- | --- |
| 1 | Primary Central Incisor | Corona corta y redondeada, con margen próximo a la línea media. |
| 2 | Primary Lateral Incisor | Corona más estrecha y separada del central. |
| 3 | Primary Canine | Cúspide única con espacio respecto del lateral. |
| 4 | Primary First Molar | Corona amplia y dos detalles oclusales. |
| 5 | Primary Second Molar | Corona mayor que la posición 4 y contorno diferenciado. |

Las formas base ocupan aproximadamente `x=18–246` y `y=14–74` dentro de
la envolvente tentativa `520 × 180` de la Fase 31. La Fase 34 establecerá
el `viewBox`, transforms y orientación final de los cuatro cuadrantes.

## Limitaciones y revisión pendiente

El dataset aún no está conectado a `Odontogram`. Antes de habilitarlo se
debe comprobar composición, orientación por lado, recortes, separación,
interacción y accesibilidad en las Fases 34–37. Cualquier reemplazo por assets
clínicos requiere fuente, licencia y validación odontológica documentadas.
