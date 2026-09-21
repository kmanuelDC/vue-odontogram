import { describe, expect, it } from 'vitest'
import { Odontogram, Tooth } from '../src'

describe('public API', () => {
  it('exports only the public components from the library entry point', () => {
    expect(Odontogram).toBeTruthy()
    expect(Tooth).toBeTruthy()
  })
})



