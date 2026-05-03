# Projekt: InPost Network Intelligence Dashboard

## Cel i koncepcja
Buduję analityczny dashboard sieci paczkomatów InPost na rekrutację stażową.
Chcę czegoś NIEOCZYWISTEGO — nie kolejny "znajdź najbliższy paczkomat".

Pomysł: **Dashboard analizy pokrycia i kondycji sieci InPost w Polsce**
— narzędzie które odpowiada na pytanie: "Jak wygląda sieć InPost? Gdzie są luki? 
Które regiony są dobrze pokryte, a które nie?"

Perspektywa użytkownika: analityk/menedżer w InPost, który chce zobaczyć 
stan sieci i wyciągnąć wnioski operacyjne.

## API
GET https://api-global-points.easypack24.net/v1/points
Parametry: ?country=PL&per_page=500&page=N

Kluczowe pola z API (zweryfikowane):
- location: { latitude, longitude }
- status: "Operating" | inne
- physical_type: "next" (nowy model) | "newfm" | inne (stary model)  
- locker_availability: { status: "NO_DATA"|"AVAILABLE"|..., details: { A, B, C } }
- functions: string[] — lista obsługiwanych usług
- agency: string — kod agencji/regionu
- delivery_area_id: string — kod obszaru dostawy
- easy_access_zone: boolean
- express_delivery_send / express_delivery_collect: boolean
- location_type: "Outdoor" | "Indoor"
- location_247: boolean
- address_details: { city, province, post_code, ... }
- is_next: boolean

## Stack technologiczny

**TypeScript + React 18 + Vite** (strict TS)
**Tailwind CSS v3** — dark theme, dashboard look
**Recharts** — wykresy (słupkowe, kołowe, bar chart)
**Leaflet + react-leaflet** — mapa z heatmapą i klasteringiem
**leaflet.heat** — heatmapa gęstości
**date-fns** — jeśli potrzeba formatowania
**ESLint + Prettier**

NIE używaj: Redux, axios, create-react-app, MUI/Ant Design (za ciężkie)

## Co dashboard pokazuje — 5 widoków/sekcji

### 1. OVERVIEW — Statystyki ogólne (top bar z kartami KPI)
- Łączna liczba paczkomatów w Polsce
- % aktywnych (status = "Operating")  
- % nowych modeli (physical_type = "next" lub is_next = true)
- % z express delivery
- % z easy_access_zone
- Liczba unikalnych województw z pokryciem

### 2. MAPA GĘSTOŚCI (główny element strony)
Interaktywna mapa Polski z przełącznikami warstw:
- **Tryb Heatmap**: heatmapa gęstości (leaflet.heat) — gdzie jest dużo/mało paczkomatów
- **Tryb Klaster**: markery z klasteringiem (leaflet.markercluster)
- **Tryb "Białe plamy"**: siatka hexagonalna lub kwadratowa nałożona na mapę Polski — komórki z ZEROWĄ lub małą liczbą paczkomatów podświetlone na czerwono (coverage gap analysis)

Filtr na mapie: pokaż tylko "next" modele / tylko z express / tylko 24h

### 3. RANKINGI WOJEWÓDZTW
Poziomy bar chart (Recharts) — województwa posortowane po:
- Liczbie paczkomatów (domyślnie)
- Liczbie na 100k mieszkańców (hardcode dane GUS o populacji województw — to tylko 16 wartości)
- % nowych modeli "next"

To jest WOW factor — gęstość na mieszkańca pokazuje REALNĄ dostępność, nie surowe liczby.
Dane populacji województw (2023, GUS) — hardcode w pliku constants.ts:
mazowieckie: 5423000, śląskie: 4570000, małopolskie: 3425000, 
wielkopolskie: 3475000, dolnośląskie: 2904000, łódzkie: 2467000,
pomorskie: 2369000, lubelskie: 2139000, podkarpackie: 2127000,
kujawsko-pomorskie: 2086000, zachodniopomorskie: 1710000, 
warmińsko-mazurskie: 1429000, lubuskie: 1011000, świętokrzyskie: 1233000,
podlaskie: 1178000, opolskie: 992000

### 4. ANALIZA TYPÓW I FUNKCJI
Dwa wykresy obok siebie:
- Pie chart: rozkład physical_type (next vs stary model vs inne)
- Bar chart: top 10 najczęstszych funkcji z functions[] (ile paczkomatów ma daną funkcję)

### 5. TABELA AGENCJI (agency breakdown)
Tabela z sortowaniem:
- Kod agencji | Liczba paczkomatów | % aktywnych | % nowych modeli | % express

## Architektura kodu
src/
├── api/
│   └── inpostApi.ts       # fetch z paginacją, cache w sessionStorage
├── components/
│   ├── KPIBar/
│   │   └── KPIBar.tsx     # top bar z kartami metryk
│   ├── Map/
│   │   ├── NetworkMap.tsx         # główna mapa
│   │   ├── HeatmapLayer.tsx       # leaflet.heat warstwa
│   │   └── CoverageGapLayer.tsx   # "białe plamy" - siatka
│   ├── Charts/
│   │   ├── ProvinceRankingChart.tsx
│   │   ├── TypeDistributionChart.tsx
│   │   └── FunctionsChart.tsx
│   ├── AgencyTable/
│   │   └── AgencyTable.tsx
│   └── LoadingOverlay/
│       └── LoadingOverlay.tsx     # progress bar ładowania stron API
├── hooks/
│   ├── useNetworkData.ts   # główny hook: pobiera WSZYSTKIE dane z paginacją
│   └── useNetworkStats.ts  # hook liczący wszystkie statystyki z danych
├── utils/
│   ├── statistics.ts       # funkcje agregujące dane
│   ├── coverage.ts         # logika "białych plam" - grid coverage analysis
│   └── constants.ts        # populacje województw, kolory, konfiguracja
├── types/
│   └── inpost.ts
├── App.tsx                 # layout: sidebar nawigacja + main content
└── main.tsx

## Kluczowe detale implementacyjne

### Pobieranie danych (useNetworkData.ts)
- Pobieraj WSZYSTKIE strony z ?country=PL
- Pokaż progress bar "Ładowanie danych: X / 33961 paczkomatów"
- Cache wyniki w sessionStorage (żeby przy odświeżeniu nie ładować od nowa)
- Równoległe fetche — pobieraj np. 10 stron jednocześnie (Promise.all w batchach)
- Po załadowaniu wszystkich danych — przelicz statystyki

### Coverage Gap Analysis (utils/coverage.ts)
Podziel Polskę na siatkę komórek ~20x20km:
- Boundingbox Polski: lat 49.0 - 54.9, lon 14.1 - 24.2
- Dla każdej komórki policz liczbę paczkomatów które w niej leżą
- Komórki z 0 paczkomatów = "biała plama"
- Komórki z < 2 = słabo pokryte
- Wyświetl to na mapie jako prostokąty z opacity zależną od gęstości

### Dark theme dashboard
Tailwind dark theme — tło bg-gray-950, karty bg-gray-900, 
akcenty w żółtym InPost (#FFD100) i pomarańczowym
Recharts — customColorScheme pasujący do dark theme

## README.md — napisz go jak professional case study:
1. **Problem statement**: "Mając 34k paczkomatów, trudno ocenić czy sieć jest równomiernie rozłożona i gdzie warto stawiać nowe punkty"
2. **Solution**: opis dashboardu
3. **Key insights** (wpisz po uruchomieniu — 3 ciekawe fakty które dashboard ujawnia o sieci InPost)
4. **Technical decisions** z uzasadnieniem każdego
5. **Assumptions & limitations**
6. **How to run**
7. **What I'd build next**: np. porównanie z konkurencją, alerting na status, predykcja gdzie postawić nowy paczkomat
8. Screenshoty każdej sekcji

## Kolejność implementacji
1. Vite + React + TS setup, Tailwind dark theme, ESLint
2. types/inpost.ts — zdefiniuj typy na podstawie realnego API response
3. inpostApi.ts — paginated fetch z batch parallel requests + sessionStorage cache
4. useNetworkData.ts — progress loading
5. useNetworkStats.ts — wszystkie obliczenia statystyk
6. constants.ts — populacje województw, kolory
7. KPIBar — karty z kluczowymi metrykami
8. ProvinceRankingChart — to jest najważniejszy wykres
9. NetworkMap z heatmapą
10. TypeDistributionChart + FunctionsChart
11. AgencyTable
12. CoverageGapLayer (białe plamy) — to jest WOW factor
13. README.md z key insights z realnych danych
14. Testy dla statistics.ts i coverage.ts (Vitest)

## Ważne
- CORS: skonfiguruj vite proxy dla /api → https://api-global-points.easypack24.net
- Conventional commits podczas pracy