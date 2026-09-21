# Fuentes SVG para dentición primaria

## Estado de los assets actuales

Las Fases 25 y 33 introdujeron dos datasets de cinco paths SVG simplificados propios: `src/data/primary.ts` para Arch y `src/data/primary-horizontal.ts` para Horizontal. Ambos están etiquetados como `provisional`, no tienen validación clínica y no proceden de una fuente pediátrica externa aprobada.

La referencia técnica de posición y escala es el dataset permanente del proyecto, conservado bajo licencia MIT. Las siluetas primarias Arch y Horizontal no son copias de premolares permanentes: incluyen incisivo central, lateral, canino, primer molar temporal y segundo molar temporal diferenciados. El dataset Horizontal se documenta además en `docs/primary-horizontal-svg-approximation.md`.

## Anatomía objetivo para el dataset definitivo

| Posición FDI | Tipo requerido |
| --- | --- |
| 1 | Primary Central Incisor |
| 2 | Primary Lateral Incisor |
| 3 | Primary Canine |
| 4 | Primary First Molar |
| 5 | Primary Second Molar |

La designación FDI 51–55, 61–65, 71–75 y 81–85 se contrastó con la tabla de dentición decidua del estándar DICOM/ISO 3950. Fuente: [DICOM Supplement 53, sección de dentición decidua](https://dicom.nema.org/dicom/supps/sup53_15.pdf).

## Candidatas externas evaluadas

| Fuente | Licencia declarada | Estado | Motivo |
| --- | --- | --- | --- |
| [Openclipart — Primary Dental Chart](https://openclipart.org/detail/258931/primary-dental-chart) | Pendiente de verificar en el archivo descargable | No incorporada | Falta comprobar piezas separadas, licencia y revisión odontológica. |
| [SVG Repo — Child Teeth](https://www.svgrepo.com/svg/254927/child-teeth) | CC0 declarada por el sitio | Rechazada | Es un icono único; no ofrece las cinco formas separadas. |

## Requisitos antes de reemplazar los assets provisionales

1. Conservar SVG original, autor, URL, fecha de acceso, licencia y atribución.
2. Confirmar licencia de modificación y redistribución compatible con el paquete MIT.
3. Verificar cinco formas independientes y que las posiciones 4 y 5 sean molares temporales.
4. Obtener revisión odontológica de anatomía, escala y orientación.
5. Registrar los cambios aplicados y mantener los paths independientes de Vue.



