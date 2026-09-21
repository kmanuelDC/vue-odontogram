# Dataset de dentición temporal

## Estado actual

`src/data/primary.ts` (Arch) y `src/data/primary-horizontal.ts` (Horizontal) contienen dos datasets de cinco geometrías pediátricas **provisionales** para desarrollo y revisión visual. `Odontogram` los renderiza con `dentition="primary"` como composiciones de 20 piezas FDI.

Las formas son aproximaciones SVG simplificadas propias, construidas tomando la composición permanente como referencia espacial. No tienen validación odontológica y no deben presentarse como anatomía clínica ni utilizarse para diagnóstico o tratamiento.

## FDI temporal

| Cuadrante | IDs | Orientación visual |
| --- | --- | --- |
| Q5, superior derecha | 51–55 | base |
| Q6, superior izquierda | 61–65 | reflejo horizontal |
| Q8, inferior derecha | 81–85 | reflejo vertical |
| Q7, inferior izquierda | 71–75 | reflejo horizontal y vertical |

Cada cuadrante tiene cinco posiciones: incisivo central, incisivo lateral, canino, primer molar temporal y segundo molar temporal.

## Layouts disponibles

| Layout | Dataset | ViewBox | Estado |
| --- | --- | --- | --- |
| `arch` | `primaryTeethPaths` | `0 0 409 500` | Provisional |
| `horizontal` | `primaryHorizontalTeethPaths` | `0 0 520 180` | Provisional |

`<Odontogram dentition="primary" layout="horizontal" />` renderiza el
segundo dataset pediátrico y sus transforms independientes para Q5, Q6, Q8 y
Q7. Nunca usa geometría permanente como reemplazo. Ambos layouts son
funcionales para revisión visual, pero no tienen validación odontológica.

## Restricción de seguridad de dominio

Las posiciones 4 y 5 se etiquetan y dibujan como molares temporales. No se usan paths de premolares permanentes como sustitutos silenciosos.

## Revisión pendiente

La siguiente iteración debe mejorar las formas mediante revisión visual y, antes de cualquier publicación clínica, contar con validación odontológica y una fuente/licencia apropiada para las geometrías definitivas.



