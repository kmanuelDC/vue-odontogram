# Revisión visual Primary Horizontal

## Estado de la Fase 37

La validación automatizada cubre dataset, FDI, transforms, selección,
`v-model`, eventos, disabled, tooltip, condiciones, leyendas y aislamiento de
los datasets Primary arch y permanentes.

La revisión visual manual debe realizarse con:

~~~bash
npm run dev:playground
~~~

Seleccionar **Primary**, alternar **Arch** y **Horizontal**, y cargar el
ejemplo `["51", "52", "65"]`.

## Lista de comprobación manual

- [ ] Las 20 piezas se ven sin recortes ni solapamientos en Horizontal.
- [ ] Q5/Q6 forman la fila superior y Q8/Q7 la inferior.
- [ ] Centrales, laterales y caninos quedan separados y orientados por lado.
- [ ] Primer y segundo molar temporal se distinguen.
- [ ] La selección se conserva al alternar Arch ↔ Horizontal.
- [ ] Tooltip, condición coloreada y leyenda se muestran en Horizontal.
- [ ] El resultado sigue siendo legible en un viewport estrecho.

## Limitación

Los SVG pediátricos horizontales siguen siendo provisionales para desarrollo
visual. Esta revisión no equivale a validación odontológica ni clínica.
