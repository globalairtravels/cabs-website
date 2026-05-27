# Global Air Travels — Logo Assets

Generated assets for Next.js. Drop the contents of `public/` into your project's `/public/` folder.

## Files

### `logo/` — source logos for `<img>` / `<Image>` references
- `logo.svg` — vector, transparent background (use this everywhere if you can)
- `logo-on-black.svg` — vector, matches the original (black backdrop baked in)
- `logo-full.png` — 1600 px PNG, transparent
- `logo-on-black.png` — 1600 px PNG, with black backdrop
- `logo-{32,40,48,64}h.png` and `@2x` / `@3x` — nav-bar PNGs at common heights with retina variants

### `public/` — drop into Next.js `/public/`
- `favicon.ico` — multi-resolution (16, 32, 48)
- `favicon-{16,32,48,64}x{...}.png`
- `apple-touch-icon.png` — 180×180
- `android-chrome-192x192.png`, `android-chrome-512x512.png`
- `icon-maskable-512x512.png` — for Android adaptive icons (extra safe-area padding)
- `og-image.png` — 1200×630 social share card
- `site.webmanifest` — PWA manifest with all icons wired up

## Next.js wiring (App Router — `app/layout.tsx`)

```tsx
export const metadata = {
  title: "Global Air Travels",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};
```

## Nav-bar usage (preferred: SVG)

```tsx
import Image from "next/image";
import logo from "@/public/logo/logo.svg";

export function NavLogo() {
  return <Image src={logo} alt="Global Air Travels" height={48} priority />;
}
```

For a dark nav-bar, the transparent SVG looks identical to the source. For a light nav-bar, the blue logo sits on whatever background you provide.

## Brand colour
`#0A76C1` — matches the blue sampled from the source (RGB 10, 118, 193).
