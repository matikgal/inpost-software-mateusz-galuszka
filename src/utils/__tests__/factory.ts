import type { InPostPoint, PhysicalType, PointStatus } from '../../types/inpost'

export function makePoint(overrides: Partial<InPostPoint> = {}): InPostPoint {
  return {
    href: '',
    country: 'PL',
    name: 'TEST01',
    type: ['parcel_locker'],
    status: 'Operating' as PointStatus,
    location: { latitude: 52.2, longitude: 21.0 },
    location_type: null,
    location_247: false,
    opening_hours: '',
    address: { line1: 'ul. Testowa 1', line2: '00-001 Warszawa' },
    address_details: {
      city: 'Warszawa',
      province: 'mazowieckie',
      post_code: '00-001',
      street: 'Testowa',
      building_number: '1',
      flat_number: null,
    },
    functions: ['parcel', 'parcel_collect', 'parcel_send'],
    is_next: false,
    easy_access_zone: false,
    physical_type: 'classic' as PhysicalType,
    express_delivery_send: false,
    express_delivery_collect: false,
    agency: 'WAW',
    agency_code: 'WAW',
    delivery_area_id: 'WAW-01',
    locker_availability: {
      status: 'AVAILABLE',
      details: { A: 'AVAILABLE', B: 'AVAILABLE', C: 'AVAILABLE' },
    },
    image_url: '',
    distance: null,
    ...overrides,
  }
}
