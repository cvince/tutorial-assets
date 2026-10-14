# Tutorial assets

Capy video title cards, animated intros, and existing 4K exports.

## Assets

All original assets are preserved in `capy-video-intros/`:

- `index.html`: interactive preview with six current designs.
- `build-intros.cjs`: source for rendering the six current MP4s.
- `Michroma-Regular.woff2` and `Michroma-OFL.txt`: font and its license.
- `logo-frames/`: 45 frames of the cube-to-Y logo animation.
- PNG title layers and previews, including earlier design iterations.
- Seven H.264 MP4 exports, each six seconds at 30 fps.

| Current title | Format | Export |
| --- | --- | --- |
| Onboarding | Landscape 3840 × 2160 | `onboarding-landscape-4k.mp4` |
| Capy Transport / Technical Deep Dive | Landscape 3840 × 2160 | `capy-transport-technical-deep-dive-landscape-4k.mp4` |
| Capy User Management / Technical Deep Dive | Landscape 3840 × 2160 | `capy-user-management-technical-deep-dive-landscape-4k.mp4` |
| What Makes Capy "Unhackable" / Technical Deep Dive | Landscape 3840 × 2160 | `what-makes-capy-unhackable-landscape-4k.mp4` |
| ELI5, What Is Encryption? | Portrait 2160 × 3840 | `eli5-what-is-encryption-portrait-4k.mp4` |
| COMING NOVEMBER 2026 / GET AN INVITE AT CAPY.SC | Portrait 2160 × 3840 | `capy-v1-coming-november-2026-portrait-4k.mp4` |

The earlier portrait Unhackable export is retained. Some preview PNGs represent earlier wording or layouts; use the current HTML and build definitions as the baseline.

## Design baseline

Black background, white basic Capy logo without a logotype. The logo turns from an isometric cube into the upside-down Y. Titles are centered, with explicit line breaks and no automatic wrapping. The Capy V1 card uses Michroma, all caps, wider tracking, and sequential slow fades.

## Preview

Run `npm run preview`, then open <http://localhost:8000>. Choose a design using the preview navigation.

## Rebuild

Install Node.js, npm, and FFmpeg; `ffmpeg` must be on your PATH. Then run:

```sh
npm ci
npx playwright install chromium
npm run build
```

The renderer uses the project Playwright dependency instead of the original temporary machine-specific path. Rebuilding replaces the six current videos and their generated title/logo PNG assets in `capy-video-intros/`; it does not regenerate the older preview images or portrait Unhackable variant. The Onboarding export was rendered from this source. All seven videos have been verified to decode successfully; the earlier exports are preserved.

Run `npm run build:onboarding` to render just Onboarding using the existing logo frames. Its full-frame 4K title-card still is `capy-video-intros/onboarding-landscape-4k-preview.png`.

If Google Chrome is already installed, use `CAPY_BROWSER_CHANNEL=chrome npm run build:onboarding` to render with it instead of downloading Playwright Chromium.
