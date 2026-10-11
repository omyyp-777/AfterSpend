# Performance and accessibility verification

## Current performance priorities

The production build previously reported a large initial JavaScript bundle. Do not assume a change improved performance based on bundle size alone; verify with a production build and real browser measurements.

1. Keep PDF generation behind the existing dynamic `import('jspdf')` so the PDF library is downloaded only when a report is requested.
2. Consider lazy-loading secondary screens after verifying loading states and preserving navigation behavior.
3. Profile the geometric canvas and animation components on a mid-range mobile device. Respect reduced-motion preferences and stop animation loops on unmount.
4. Avoid broad memoization without profiling; prioritize expensive repeated calculations and unnecessary renders demonstrated by React Profiler.
5. Check Core Web Vitals (LCP, INP, CLS) on the deployed site and compare against a recorded baseline.

## Release verification

Run from the project root:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

`npm ci` requires a committed lockfile compatible with `package-lock.json`. If this project is managed with `bun.lock` only, use the repository's chosen package manager consistently and commit its matching lockfile instead of generating multiple competing lockfiles.

## Accessibility checklist

- Navigate all controls using only Tab, Shift+Tab, Enter, Space, and Escape where appropriate.
- Confirm visible focus indicators in light and dark themes.
- Verify dialog focus entry, focus containment, Escape handling, and focus restoration.
- Ensure each input has an accessible name and validation messages are associated with their fields.
- Check text and control contrast and test with a screen reader.
- Verify reduced-motion preferences disable nonessential movement.

## Measurement note

These are verification instructions, not a claim that a Lighthouse or Core Web Vitals audit has already passed. Record before/after measurements from the same device, browser, network conditions, and route.
