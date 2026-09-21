# Composición provisional de dentición primaria horizontal

## Alcance

Esta composición ubica exclusivamente el dataset provisional
`primaryHorizontalTeethPaths`. Es independiente de `primaryArchLayoutDefinition`
y de los layouts permanentes. Todavía no está habilitada en el componente; su
conexión corresponde a la Fase 35.

## Espacio SVG

~~~text
viewBox: 0 0 520 180
~~~

Las cinco formas base se diseñaron en la mitad izquierda superior
(`x≈18–246`, `y≈14–74`). La línea media queda entre los centrales de los
dos lados. La fila FDI Q8/Q7 se refleja sobre `y=37.5` y queda arriba
(aproximadamente `y=1–61`); la fila Q5/Q6 se traslada a la segunda fila
(aproximadamente `y=119–179`). Esto deja un espacio central visual.

## Cuadrantes y transforms

| Orden | Cuadrante | Arcada / lado | Transform |
| --- | --- | --- | --- |
| 1 | Q8 | inferior derecha | `translate(0, 75) scale(1, -1)` |
| 2 | Q7 | inferior izquierda | `translate(520, 75) scale(-1, -1)` |
| 3 | Q5 | superior derecha | `translate(0, 105)` |
| 4 | Q6 | superior izquierda | `translate(520, 105) scale(-1, 1)` |

Los transforms reflejan los lados sobre `x=260`. Q8/Q7 ocupan la primera
fila y Q5/Q6 se trasladan a la segunda; la orientación vertical de cada
arcada se conserva. No son adaptaciones de `primaryArchLayoutDefinition` ni de
los transforms horizontales permanentes.

## Orientación y separación

La forma base presenta las posiciones 1–5 desde la zona media hacia el extremo
posterior. Al reflejar Q6 y Q7, las piezas conservan orientación lateral
opuesta entre ambos lados. Los márgenes entre centrales, laterales y caninos
se incorporan en las coordenadas del dataset horizontal, no mediante los
ajustes locales que usa provisionalmente el arco.

## Limitaciones

La geometría sigue siendo provisional y requiere revisión visual en el
playground antes de considerarla estable. No representa anatomía validada, no
admite uso diagnóstico y no habilita dentición mixta.


