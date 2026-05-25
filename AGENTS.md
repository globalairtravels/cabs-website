<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Global Air Travels: Cab Booking Website

## Tech Stack & Architecture
- **Framework**: Next.js 16.2.6 (App Router, Turbopack, Static Export)
- **UI & Styling**: React 19, custom CSS system in `src/app/globals.css` integrated with Tailwind CSS v4 / PostCSS.
- **Routing**: Static routing with `src/app/page.js` as the main entry point.
- **Output**: Static export (`out/` directory generated via `npm run build`).

## Key Guidelines & Conventions
1. **Dynamic Configuration (`src/config/site.js`)**:
   - All critical metadata, route packages, cab vehicle types, per-km pricing, driver allowance, UPI payee IDs, and company phone numbers (`+919844082581`) are maintained in `src/config/site.js`.
   - **Never** hardcode pricing, route descriptions, vehicle capacities, or contact details in pages or components. Always reference them from `siteConfig`.
2. **Brand & Design Style**:
   - The design is modeled after a premium travel agency (e.g. Cleartrip-like layout) optimized for mobile responsiveness.
   - Core colors are defined in `:root` CSS variables in `globals.css`:
     - Primary Orange: `--primary-orange` (`#F26B1F`) for CTA buttons and highlights.
     - Primary Navy: `--primary-navy` (`#0B3D91`) for header headers, structural highlights, and active states.
3. **React 19 & Next.js 16 Code Patterns**:
   - Dynamic route params are Promises: `params: Promise<{ slug: string }>`. You must handle them accordingly (e.g. using `await` or `.then()`).
   - For caching, use the `'use cache'` directive where appropriate.
   - For instant navigations, use `<Suspense>` boundaries and export `unstable_instant = { prefetch: 'static' }` on page routes where validation is needed.
4. **Common Pitfalls & ESLint Rule Warnings**:
   - **Do not** call `setState` synchronously within the top level of a `useEffect` hook. Doing so will trigger the `react-hooks/set-state-in-effect` linting error. Initialize values outside the effect, or set them conditionally/asynchronously.
