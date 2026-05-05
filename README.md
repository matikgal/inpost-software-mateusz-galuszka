# InPost Network Intelligence Dashboard

## Author

- **Name:** Mateusz Gałuszka
- **Email:** [mateusz.galuszka21@gmail.com]

## Overview

The InPost Network Intelligence Dashboard is a high-performance analytical tool designed to visualize and analyze the vast network of over 34,000 InPost parcel lockers across Poland. It solves the challenge of evaluating network coverage and regional investment needs by providing real-time insights into density, service standards, and coverage gaps directly in the browser.

## Demo & Description

This solution is a single-page analytics dashboard that fetches the entire dataset of approximately 34,000 points from the InPost API. It processes this data client-side to calculate key performance indicators and generate interactive visualizations.

**Key Features:**

- **KPI Bar:** Real-time tracking of total points, activity percentage, and adoption of modern standards like "Next" and "Express".
- **Network Heatmap:** A dynamic map using Leaflet to show density clusters and identify "white spots" or coverage gaps.
- **Regional Rankings:** Comparative analysis of voivodeships (provinces) based on absolute numbers, population-adjusted statistics (GUS 2023), and service availability.
- **Advanced Charts:** Visual breakdown of device models, top 10 services, and agency rankings with sorting capabilities.

**Architecture & Technical Choices:**

- **Data Fetching:** Since the dataset exceeds the `sessionStorage` limit (~5MB), the app utilizes a batch parallel fetch strategy (5 concurrent requests) with a progress bar. This ensures a fresh dataset on every load (~10s) without over-engineering with complex state management.
- **Styling:** A premium dark-themed dashboard palette was implemented using Tailwind CSS, paired with CartoDB dark tiles for a cohesive visual experience.
- **State Management:** Used React's `useReducer` and `useMemo` for efficient data processing without the overhead of Redux.

## Technologies

- **React 18 + Vite:** For a modern, fast development environment and optimized production builds.
- **TypeScript:** Strict type safety implemented across all modules, particularly for handling external API responses.
- **Tailwind CSS v3:** Utility-first styling for a responsive and performant UI.
- **Recharts:** Composable and accessible React-based charting library.
- **Leaflet & React-Leaflet:** Open-source mapping solution providing interactive geographic visualizations without API key dependencies.

## How to run

### Prerequisites

- **Node.js:** Latest LTS version (v18+ or v20+ recommended).
- **npm:** Included with Node.js.

### Build & run

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd inpost-master
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

   The dashboard will be available at `http://localhost:5173`.

4. **Production Build:**
   ```bash
   npm run build
   ```

## What I would do with more time

- **Competitor Benchmarking:** Integrate datasets from competitors (Allegro One Box, Orlen Paczka) to perform market share analysis and competitive density mapping.
- **Predictive Location Scoring:** Implement a scoring model to suggest optimal locations for new lockers based on population density and current network gaps.
- **Enhanced Performance:** Implement code-splitting for heavy dependencies like Leaflet and Recharts to reduce the initial bundle size (from ~777kB to ~300kB).
- **Comprehensive Testing:** Expand test coverage with Vitest for core analytical logic (`statistics.ts` and `coverage.ts`).
- **Exporting Tools:** Add functionality to export processed data and charts to CSV or PDF for business reporting.

## AI usage

I utilized AI tools (Claude, Claude Code, Antigravity/Gemini) to assist with architectural planning, refining TypeScript definitions, and optimizing the parallel data fetching logic. The AI-generated suggestions were carefully reviewed, refactored to fit the project's specific requirements, and manually verified for technical accuracy and performance.

## Anything else?

- **CORS Handling:** The application uses Vite's proxy for development. For production deployments, a redirect/rewrite rule (e.g., `_redirects` for Netlify or `vercel.json`) is required to point `/api/*` to the InPost API.
- **Data Stability:** Population data for voivodeships is statically defined based on GUS 2023 records, ensuring consistency without unnecessary API overhead.
- **Granularity:** The coverage gap grid is set to 20×20 km, which offers the optimal balance between meaningful strategic analysis and browser performance for the Polish territory.
