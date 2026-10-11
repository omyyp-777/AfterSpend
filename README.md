# AFTERSPEND — Financial Decision Simulator

A React, TypeScript, and Vite personal-finance simulator for planning a ₹10,000 budget over 30 days.

## Requirements
- Node.js 20.19+ (or a version supported by the installed Vite release)
- npm

## Run locally
```bash
npm install
npm run dev
```

## Quality checks
```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev
```

The TypeScript compiler is configured in strict mode. ESLint fails on unused TypeScript/TSX variables and imports. `npm test` runs calculation and persisted-data validation tests; `npm run check` runs type checking, linting, tests, and a production build. Review dependency audit results before release.

## Architecture and performance

See [ARCHITECTURE.md](./ARCHITECTURE.md) for module boundaries and refactoring guidance, and [PERFORMANCE.md](./PERFORMANCE.md) for performance, accessibility, and release verification checklists. These documents describe recommended checks; they do not claim a Lighthouse audit has already passed.

## Deployment
Deploy the repository to a static hosting provider such as Cloudflare Pages, Netlify, or Vercel with build command `npm run build` and output directory `dist`. Configure the hosting provider to serve `index.html` for application routes if client-side routing is added. Verify the resulting URL is publicly accessible over HTTPS.

## Financial model notes
- Buying now affects today's balance; postponing preserves current cash but reserves the amount and deducts it on the forecast date.
- Planned transactions reduce safe-to-spend and appear in the forecast without being treated as confirmed cash outflows.
- A planned purchase matching the active simulator scenario is counted only once.
- Overdue unpaid commitments are surfaced as due today in the forecast rather than hidden in historical days.
- Forecast values retain negative balances so projected shortfalls are visible.
- Browser storage is treated as untrusted input and validated before use.

This is a planning simulator, not a bank account or financial-advice service. Data is stored locally in the user's browser.

## Theme and financial reports

- Use the moon/sun control in the navigation bar to switch between light and dark themes. The preference is saved in browser storage and restored on the next visit.
- From the Overview tab, select **Download Financial Report** to export a PDF containing the financial snapshot, financial-health score and breakdown, 30-day forecast, savings allocation, and upcoming commitments.
- PDF generation is performed in the browser using `jspdf`; no financial data is sent to a server.

Install dependencies with `npm install`, then run `npm run typecheck`, `npm run lint`, and `npm run build` before deployment.
