import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export interface ToothSelectionOptions {
  modelValue: MaybeRefOrGetter<readonly string[] | undefined>
  singleSelect: MaybeRefOrGetter<boolean>
}

/** Selection state derived from, and written back to, an Odontogram v-model. */
export function useToothSelection(options: ToothSelectionOptions) {
  const selectedTeeth = computed(() => [...new Set(toValue(options.modelValue) ?? [])])

  function isSelected(id: string): boolean {
    return selectedTeeth.value.includes(id)
  }

  function toggle(id: string): string[] {
    const current = selectedTeeth.value

    if (toValue(options.singleSelect)) {
      return current.includes(id) ? [] : [id]
    }

    return current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]
  }

  return { isSelected, selectedTeeth, toggle }
}
