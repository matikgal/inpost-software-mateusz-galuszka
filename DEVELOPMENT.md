# Development Guide — InPost project context

## Project status

**Recruitment project** for InPost Software Development Internship 2026. Deadline: 6 May 2026.

**Active build: Plan B — Network Intelligence Dashboard** (fully implemented, `npm run build` passes). Plan A (Locker Finder) is preserved in git history (`294da80`).

---

## Plan A — InPost Smart Locker Finder (BUILT, committed)

Full SPA is implemented and builds cleanly (`npm run build`). Two git commits on `master`.

### What works
- Address search via Nominatim geocoding with debounced autocomplete
- Browser geolocation ("Moja lokalizacja" button)
- `findNearest` calls `relative_point=LAT,LON&sort_by=distance` — server returns up to 50 nearest with `distance` in meters, no client-side haversine needed for sort
- Interactive Leaflet map with `react-leaflet-markercluster` and custom InPost yellow/black markers
- FilterPanel: radius (1/5/10/25 km), 24/7 toggle, operating-only toggle, point type (parcel_locker/POP), function checkboxes
- LockerCard shows distance, address, hours, compartment availability (A/B/C sizes), image thumbnail
- Mobile-first layout with map/list tabs; desktop shows sidebar + map split

### Key files
- [src/api/inpostApi.ts](src/api/inpostApi.ts) — fetch wrapper, retry/backoff, `findNearest`, `fetchPage`
- [src/api/geocodingApi.ts](src/api/geocodingApi.ts) — Nominatim, 1 req/s throttle, in-memory cache
- [src/hooks/useLockers.ts](src/hooks/useLockers.ts) — `useReducer` state, abort on re-fetch, client-side filter
- [src/types/inpost.ts](src/types/inpost.ts) — full API response types, `Filters`, `DEFAULT_FILTERS`
- [src/utils/distance.ts](src/utils/distance.ts) — haversine, `metersToKm`, `formatDistance`
- [src/components/Map/LockerMap.tsx](src/components/Map/LockerMap.tsx) — map container, MapController (recenter on origin/selection)

### Known quirks
- `react-leaflet-markercluster` CSS imported as `// @ts-ignore import 'react-leaflet-markercluster/styles'` — package exports `.styles` but TS doesn't recognize the subpath without the ignore
- `erasableSyntaxOnly: true` in tsconfig — no TS parameter properties (`public readonly x`) allowed in class constructors; use separate `readonly x` field declaration instead
- Vite proxy `/api` → `https://api-global-points.easypack24.net` works in dev only; production deploy needs Netlify redirect or serverless proxy

---

## Plan B — InPost Network Intelligence Dashboard (nowyplan.md)

Analytics dashboard targeting an internal InPost analyst persona. Shows network health, coverage gaps, provincial rankings, agency breakdown. Requires downloading **all ~34k Polish lockers** with pagination.

### New vs Plan A
| | Plan A | Plan B |
|---|---|---|
| Data fetch | `relative_point` nearest 50 | All 34k, paginated, batch parallel, sessionStorage cache |
| Purpose | End-user finds nearest locker | Analyst sees network state |
| UI style | Light, mobile-first | Dark theme, dashboard |
| Charts | None | Recharts (bar, pie, horizontal bar) |
| Map layers | Markers + cluster | Heatmap (leaflet.heat) + cluster + coverage gap grid |

### Plan B — fully implemented + bug-fixed

All components built and `npm run build` + `npm run lint` pass clean.

#### Key files
- [src/api/inpostApi.ts](src/api/inpostApi.ts) — `fetchAllPages` batch parallel (5 at a time), progress callback
- [src/api/geocodingApi.ts](src/api/geocodingApi.ts) — Nominatim, 1 req/s throttle, in-memory cache (used by MapSearch)
- [src/hooks/useNetworkData.ts](src/hooks/useNetworkData.ts) — `useReducer`, AbortController cleanup
- [src/hooks/useNetworkStats.ts](src/hooks/useNetworkStats.ts) — `useMemo` wrapper around `computeNetworkStats`
- [src/utils/statistics.ts](src/utils/statistics.ts) — `computeNetworkStats`, `isExpress` helper
- [src/utils/coverage.ts](src/utils/coverage.ts) — `buildCoverageGrid` with neighbor-aware `maskOutside`
- [src/utils/constants.ts](src/utils/constants.ts) — `PROVINCE_POPULATION`, `normalizeProvince`, `CHART_COLORS`, `POLAND_BBOX`
- [src/components/Map/NetworkMap.tsx](src/components/Map/NetworkMap.tsx) — heatmap/cluster/gaps, filter, zoom limits, MapSearch
- [src/components/Map/MapSearch.tsx](src/components/Map/MapSearch.tsx) — address search → `map.flyTo`
- [src/components/Map/HeatmapLayer.tsx](src/components/Map/HeatmapLayer.tsx) — `leaflet.heat` wrapper
- [src/components/Map/CoverageGapLayer.tsx](src/components/Map/CoverageGapLayer.tsx) — rectangles for empty/sparse cells
- [src/components/Charts/ProvinceRankingChart.tsx](src/components/Charts/ProvinceRankingChart.tsx) — 3-mode toggle (count/perCapita/nextPercent)
- [src/components/Charts/TypeDistributionChart.tsx](src/components/Charts/TypeDistributionChart.tsx) — donut pie
- [src/components/Charts/FunctionsChart.tsx](src/components/Charts/FunctionsChart.tsx) — top differentiating functions, axis = %
- [src/components/AgencyTable/AgencyTable.tsx](src/components/AgencyTable/AgencyTable.tsx) — sortable, paginated 15/page
- [src/components/KPIBar/KPIBar.tsx](src/components/KPIBar/KPIBar.tsx) — 6 KPI cards
- [src/components/LoadingOverlay/LoadingOverlay.tsx](src/components/LoadingOverlay/LoadingOverlay.tsx) — progress bar + shimmer

#### Known bugs fixed (2026-05-03)
- **"Białe plamy" bbox bug** — `maskOutside()` w `coverage.ts`: empty cell renderowana tylko gdy ≥2 sąsiadów ma `count > 0`; Bałtyk i zagranica nie świecą się na czerwono
- **Express 0%** — `isExpress(p)` sprawdza też `p.functions.some(f => f.includes('express'))` poza polami boolean
- **22 województwa → 16** — `normalizeProvince()` normalizuje diakrytyki + trim; punkty spoza 16 znanych są odrzucane
- **Top 10 usług płaski** — filtruje funkcje obecne na >90% punktów (parcel/parcel_collect/parcel_send); oś = %
- **CoverageGapLayer podwójna przezroczystość** — solid hex `fillColor` + `fillOpacity`, bez rgba w stringu

#### Known quirks
- `react-leaflet-markercluster` CSS import wymaga `// @ts-expect-error` — brak deklaracji subpath w TS
- `erasableSyntaxOnly: true` — brak TS parameter properties w konstruktorach klas
- Vite proxy `/api` → `https://api-global-points.easypack24.net` działa tylko w dev; produkcja wymaga Netlify redirect
- Bundle ~780 kB — Leaflet + Recharts; code splitting (`dynamic import`) zmniejszyłby do ~300 kB initial

### Population constants (hardcoded, GUS 2023)
```ts
export const PROVINCE_POPULATION: Record<string, number> = {
  mazowieckie: 5423000, śląskie: 4570000, wielkopolskie: 3475000,
  małopolskie: 3425000, dolnośląskie: 2904000, łódzkie: 2467000,
  pomorskie: 2369000, lubelskie: 2139000, podkarpackie: 2127000,
  'kujawsko-pomorskie': 2086000, zachodniopomorskie: 1710000,
  'warmińsko-mazurskie': 1429000, lubuskie: 1011000, świętokrzyskie: 1233000,
  podlaskie: 1178000, opolskie: 992000,
}
```

---

## API facts (verified by direct probe)

Base URL (via Vite proxy): `/api/v1/points`

- `?country=PL&per_page=1000&page=N` — up to 1000 items/page, ~2 MB per page, 34 pages total
- `?relative_point=LAT,LON&sort_by=distance` — returns ~25 nearest by default with `distance` (meters) field
- Pagination fields: `count`, `page`, `per_page`, `total_pages` (NOT `total_count`)
- Key discriminating fields: `location_247` (bool, not parsed from string), `physical_type` (`"next"` = new model), `is_next` (bool), `locker_availability.details.{A,B,C}`, `agency` code, `delivery_area_id`

---

## Dev commands

```bash
npm run dev      # start dev server on :5173
npm run build    # tsc + vite build (must pass before commit)
npm run lint     # eslint check
```

## Conventions
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- TypeScript strict mode + `erasableSyntaxOnly` — no TS-only class syntax, no `any`
- No Redux, no axios, no MUI/Ant Design
- Tailwind only for styles; no CSS modules
