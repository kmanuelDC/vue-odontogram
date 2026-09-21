# Diseño para dentición mixta

## Estado actual

`Odontogram` renderiza una dentición por vez: `permanent` (32 piezas) o `primary` (20 piezas provisionales). Ambas denticiones admiten `arch` y `horizontal` con datasets propios. El tipo de dominio también contiene `Dentition = 'mixed'`, pero no existe una interfaz ni layout mixto activo.

La dentición mixta no será una selección parcial de un dataset ni una variante de geometría permanente. Debe coexistir con piezas explícitas de ambos datasets, conservando la identidad FDI de cada una.

## Modelo propuesto

La futura API recibirá una colección explícita de piezas:

```ts
type MixedOdontogramInput = {
  dentition: 'mixed'
  teeth: ToothDefinition[]
}
```

Ejemplo conceptual:

```ts
const teeth: ToothDefinition[] = [
  permanentTooth11,
  permanentTooth12,
  primaryTooth53,
  primaryTooth54,
  primaryTooth55,
  permanentTooth16,
]
```

Cada definición conserva `id`, `dentition`, `quadrant`, `position`, `type` y `shape`. Como un ID FDI es globalmente único, `v-model`, condiciones y eventos pueden seguir usando `string[]`, sin prefijos técnicos ni claves compuestas.

## Reglas para coexistencia

1. La presencia de una pieza se declara explícitamente; un hueco no se rellena con una geometría de otra dentición.
2. La forma se obtiene del dataset correspondiente por dentición y layout (`permanent` o `primary`), nunca por `slice` ni reutilizando premolares como molares temporales.
3. El layout mixto deberá resolver posición, orden y superposición por pieza y cuadrante, sin deducirlos solo de `dentition === 'mixed'`.
4. La selección y las condiciones se indexan por ID FDI, por lo que pueden abarcar ambos conjuntos sin cambiar la API de eventos.
5. Los SVG pediátricos provisionales no habilitan por sí mismos una UI mixta clínica; el diseño definitivo exige validación odontológica y composición visual aprobada.

## Próxima evolución

Antes de aceptar `:teeth="mixedTeeth"` en el componente se necesita definir y probar: composición en arco por etapas de erupción, reglas de reemplazo entre piezas, huecos, escalas, accesibilidad y condiciones clínicas. No se añadirá una rama experimental a `Odontogram` hasta entonces.



