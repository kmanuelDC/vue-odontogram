# Auditoría y especificación del layout horizontal Primary

**Fase:** 31  
**Estado:** especificación para desarrollo; sin dataset ni renderizado horizontal  
**Fecha:** 2026-09-20

## Conclusión

La dentición primaria necesita un segundo dataset SVG para su presentación
horizontal. Los cinco paths de `src/data/primary.ts` están compuestos para el
arco y dependen de una distribución vertical/curva; no deben escalarse,
reordenarse o transformarse automáticamente durante el renderizado para simular
un layout horizontal.

`permanentHorizontalTeethPaths` y sus transforms solo se revisaron como
referencia de interacción (dos filas, selección y FDI estable). No son una
fuente geométrica ni de transforms para Primary.

El futuro dataset será provisional para desarrollo visual, igual que el dataset
Primary arch. Ninguna decisión de esta fase atribuye validez anatómica o uso
clínico a las formas.

## Inventario actual y objetivo

| Posición | Tipo temporal | Estado en arco | Decisión para horizontal |
| --- | --- | --- | --- |
| 1 | Primary Central Incisor | Provisional; reflejo local y separación central | Redibujar/derivar explícitamente una forma horizontal propia. |
| 2 | Primary Lateral Incisor | Provisional; separación lateral | Redibujar/derivar explícitamente una forma horizontal propia. |
| 3 | Primary Canine | Provisional; reflejo y separación local | Redibujar/derivar explícitamente una forma horizontal propia. |
| 4 | Primary First Molar | Provisional | Crear forma horizontal propia, distinta de un premolar. |
| 5 | Primary Second Molar | Provisional | Crear forma horizontal propia, distinguible del primer molar. |

El segundo dataset se ubicará en:

~~~text
src/data/primary-horizontal.ts
~~~

Debe incluir exactamente cinco `ToothShape` libres de Vue, con posiciones
`1–5`, los mismos tipos temporales y metadatos explícitos de estado
provisional.

## Composición objetivo

La presentación debe mostrar dos filas horizontales:

~~~text
primera fila: Q8 | línea media | Q7
segunda fila: Q5 | línea media | Q6
~~~

Cada cuadrante contiene cinco piezas. La posición 1 queda próxima a la línea
media y la posición 5 queda hacia el extremo posterior. La lectura FDI se
mantiene sin cambios:

| Cuadrante | IDs | Arcada / lado |
| --- | --- | --- |
| Q5 | 51–55 | superior derecha |
| Q6 | 61–65 | superior izquierda |
| Q8 | 81–85 | inferior derecha |
| Q7 | 71–75 | inferior izquierda |

El orden de grupos propuesto para el SVG completo es Q5, Q6, Q8, Q7, igual que
el arco Primary actual. No implica reutilizar sus transforms.

## Área de trabajo tentativa

Esta fase reserva una envolvente de diseño, no un `viewBox` definitivo:

~~~text
ancho: 520 unidades
alto:  180 unidades
fila superior: y = 0–75
fila inferior: y = 105–180
línea media: x ≈ 260
~~~

Cada mitad dispone de aproximadamente 220 unidades útiles y un margen para la
línea media y los extremos posteriores. La Fase 33 debe diseñar paths dentro de
esa envolvente; la Fase 34 confirmará el `viewBox`, transforms y márgenes
finales a partir de los límites reales de las cinco formas.

No se deben copiar los valores `900 × 150`, `translate(840, ...)` ni los
transforms de la composición horizontal permanente.

## Orientación y separación

La geometría horizontal debe expresar explícitamente la orientación lateral de
las piezas. Como criterio de composición:

* Q8 y Q5 conservan la orientación base de un lado anatómico en sus filas respectivas.
* Q7 y Q6 usan la orientación lateral opuesta.
* Los incisivos centrales no se solapan en la línea media.
* Los laterales se separan hacia fuera respecto de los centrales.
* Los caninos conservan una separación visible respecto de los laterales y se
  orientan de forma opuesta entre lados.
* Ambos molares temporales se distinguen entre sí y no derivan de premolares
  permanentes.

Los ajustes locales del arco (central, lateral y canino) sirven como evidencia
de problemas visuales a evitar, pero no deben trasladarse como transforms de
runtime al nuevo layout. La separación debe quedar incorporada en las nuevas
coordenadas o en la composición horizontal explícita.

## Origen, licencia y trazabilidad

Los SVG actuales de Primary son aproximaciones propias provisionales. Un path
horizontal puede derivarse explícitamente de esas aproximaciones como trabajo
propio, siempre que:

1. se registre el cambio en `docs/primary-horizontal-layout.md` y en la nota
   de aproximaciones;
2. se conserve el aviso de uso exclusivo para desarrollo visual;
3. no se incorpore geometría de `permanentTeethPaths` ni
   `permanentHorizontalTeethPaths`;
4. no se use una fuente externa sin registrar autor, URL, licencia, fecha de
   acceso y condiciones de redistribución.

El dataset permanente de referencia se conserva bajo MIT, pero esa referencia
no convierte una geometría pediátrica en clínicamente validada.

## Criterios de revisión visual

Antes de habilitar Primary horizontal se comprobará manualmente en el
playground:

- 20 piezas visibles, sin recortes ni solapamientos.
- Simetría lateral entre Q5/Q6 y Q8/Q7.
- Separación clara entre central/lateral y lateral/canino.
- Caninos con dirección lateral correcta en ambos lados.
- Primer y segundo molar temporal distinguibles.
- Lectura FDI correcta en las cuatro filas/mitades.
- Selección, condición coloreada, tooltip, etiquetas, teclado y estado
  disabled sobre la geometría ya transformada.
- Visualización legible en escritorio y en un viewport estrecho.

Cualquier ajuste de path, espacio u orientación encontrado en esa revisión se
registrará como parte de las Fases 33–37.

## Salida de la Fase 31

La Fase 32 puede definir el contrato interno de resolución
`dentition + layout`. No se debe habilitar `dentition="primary"
layout="horizontal"` ni crear `primary-horizontal.ts` hasta completar el
contrato y el dataset de las fases posteriores.



