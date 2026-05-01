export type PointStatus = 'Operating' | 'Created' | 'Disabled'

export type PhysicalType = 'next' | 'newfm' | 'fm' | 'classic' | 'screenless' | 'modular'

type LockerSlotStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'NO_DATA'

export interface InPostPoint {
  href: string
  country: string
  name: string
  type: string[]
  status: PointStatus
  location: {
    latitude: number
    longitude: number
  }
  location_type: string | null
  location_247: boolean
  opening_hours: string
  address: {
    line1: string
    line2: string
  }
  address_details: {
    city: string
    province: string
    post_code: string
    street: string
    building_number: string
    flat_number: string | null
  }
  functions: string[]
  is_next: boolean
  easy_access_zone: boolean
  physical_type: PhysicalType
  express_delivery_send: boolean
  express_delivery_collect: boolean
  agency: string
  agency_code: string
  delivery_area_id: string
  d2d_courier_micro_area?: string
  locker_availability: {
    status: LockerSlotStatus
    details: {
      A: LockerSlotStatus
      B: LockerSlotStatus
      C: LockerSlotStatus
    }
  }
  image_url: string
  distance: number | null
}

export interface PointsResponse {
  items: InPostPoint[]
  meta: {
    href: string
    count: number
    page: number
    per_page: number
    total_pages: number
  }
}

// --- Aggregated stats types ---

export interface ProvinceStat {
  name: string
  count: number
  perCapita: number
  nextPercent: number
  operatingPercent: number
}

export interface AgencyStat {
  code: string
  count: number
  operatingPercent: number
  nextPercent: number
  expressPercent: number
}

export interface NetworkStats {
  total: number
  operatingCount: number
  operatingPercent: number
  nextCount: number
  nextPercent: number
  expressCount: number
  expressPercent: number
  easyAccessCount: number
  easyAccessPercent: number
  count247: number
  percent247: number
  uniqueProvinces: number
  byProvince: ProvinceStat[]
  byAgency: AgencyStat[]
  physicalTypeBreakdown: { type: PhysicalType; count: number }[]
}

export type MapFilter = 'all' | 'operating' | 'next' | 'express' | 'easy_access' | '247'

export interface AdvancedFilter {
  physicalTypes: PhysicalType[]
  status: '' | 'Operating' | 'non_operating'
  city: string
  province: string
  zone: string
  agency: string
}

export const DEFAULT_ADVANCED_FILTER: AdvancedFilter = {
  physicalTypes: [],
  status: '',
  city: '',
  province: '',
  zone: '',
  agency: '',
}
