import { describe, it, expect } from 'vitest'
import { normalizeProvince, PROVINCE_POPULATION } from '../constants'

describe('normalizeProvince', () => {
  it('returns key as-is for exact match', () => {
    expect(normalizeProvince('mazowieckie')).toBe('mazowieckie')
  })

  it('normalizes diacritics (NFD-decomposable)', () => {
    // ś/ą/ę/ó strip cleanly — ł does NOT decompose in NFD (stays as ł)
    expect(normalizeProvince('slaskie')).toBe('śląskie')
    expect(normalizeProvince('swietokrzyskie')).toBe('świętokrzyskie')
    expect(normalizeProvince('podkarpackie')).toBe('podkarpackie')
  })

  it('returns null for partially stripped names where ł remains', () => {
    // malopolskie ≠ małopolskie (ł not stripped), so no match
    expect(normalizeProvince('malopolskie')).toBeNull()
    expect(normalizeProvince('lodzkie')).toBeNull()
  })

  it('trims whitespace', () => {
    expect(normalizeProvince('  mazowieckie  ')).toBe('mazowieckie')
  })

  it('lowercases input', () => {
    expect(normalizeProvince('MAZOWIECKIE')).toBe('mazowieckie')
    expect(normalizeProvince('Pomorskie')).toBe('pomorskie')
  })

  it('returns null for unknown province', () => {
    expect(normalizeProvince('nieistniejące')).toBeNull()
    expect(normalizeProvince('')).toBeNull()
    expect(normalizeProvince('Germany')).toBeNull()
  })

  it('covers all 16 known provinces', () => {
    const known = Object.keys(PROVINCE_POPULATION)
    for (const p of known) {
      expect(normalizeProvince(p)).toBe(p)
    }
    expect(known).toHaveLength(16)
  })
})
