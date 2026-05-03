export const PROVINCE_POPULATION: Record<string, number> = {
  mazowieckie: 5423000,
  śląskie: 4570000,
  wielkopolskie: 3475000,
  małopolskie: 3425000,
  dolnośląskie: 2904000,
  łódzkie: 2467000,
  pomorskie: 2369000,
  lubelskie: 2139000,
  podkarpackie: 2127000,
  'kujawsko-pomorskie': 2086000,
  zachodniopomorskie: 1710000,
  'warmińsko-mazurskie': 1429000,
  świętokrzyskie: 1233000,
  podlaskie: 1178000,
  lubuskie: 1011000,
  opolskie: 992000,
}

export const POLAND_BBOX = {
  latMin: 49.0,
  latMax: 54.9,
  lonMin: 14.1,
  lonMax: 24.2,
}

export const CHART_COLORS = {
  yellow: '#FFD100',
  orange: '#FF6B00',
  blue: '#4F8EF7',
  green: '#34D399',
  red: '#F87171',
  purple: '#A78BFA',
  gray: '#6B7280',
}

const STRIPPED_PROVINCE: Record<string, string> = Object.fromEntries(
  Object.keys(PROVINCE_POPULATION).map((k) => [
    k.normalize('NFD').replace(/\p{Diacritic}/gu, ''),
    k,
  ])
)

export function normalizeProvince(raw: string): string | null {
  const lower = raw.trim().toLowerCase()
  if (lower in PROVINCE_POPULATION) return lower
  const stripped = lower.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return STRIPPED_PROVINCE[stripped] ?? null
}

export const UNKNOWN_VALUE = 'UNKNOWN'

export const PHYSICAL_TYPE_LABELS: Record<import('../types/inpost').PhysicalType, string> = {
  next: 'Next',
  newfm: 'NewFM',
  fm: 'FM',
  classic: 'Classic',
  screenless: 'Screenless',
  modular: 'Modular',
}
