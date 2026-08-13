# Developer Guide for Global Air Travels Cabs Website

@AGENTS.md

## Commands

- **Start Dev Server**: `npm run dev`
- **Build Static Site**: `npm run build`
- **Lint Codebase**: `npm run lint`
- **Test**: (None configured)

## Coding Conventions

- **Next.js & React**: This project uses Next.js 16 (React 19). Dynamic route params are Promises.
- **State in Effects**: Avoid calling `setState` synchronously at the root of `useEffect` to prevent `react-hooks/set-state-in-effect` lint errors.
- **Styling**: Uses custom CSS classes and design system variables defined in `src/app/globals.css` with Tailwind v4. Use existing CSS variables and styles where possible to maintain the Cleartrip layout aesthetic.
- **Central Configuration**: Do not hardcode routes, prices, contact numbers, or payment options. Use `siteConfig` (`src/config/site.js`), `bookingConfig` (`src/lib/booking-config.js`), and `checkoutConfig` (`src/lib/checkout-config.js`).
