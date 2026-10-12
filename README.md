# React + Vite

## Sifit redesign

### Public selling pages

`?view=sell` opens Ways to Sell without authentication; `?view=sell-guide` opens the single-page Clean Out Guide. Its sticky section menu tracks What to Send, Earnings, What to Expect, and FAQs. Footer deep links such as `?view=sell-guide#earnings` scroll into the matching section. The earnings calculator uses the prototype’s existing 7% direct-listing service fee, not ThredUp payout rules.

The centred header logo is `src/image/logo-favicon/Sifit-nobg.png`; the original square JPEG remains the favicon. The selling panels use the supplied `banner (1).png` and `banner (2).png`. The impact section uses original Sifit copy rather than attributing ThredUp’s 20M / 90% statistics to Sifit.

Direct-listing drafts and newsletter interest are stored only on the current device. The footer’s privacy controls can remove the saved email. Email delivery, app releases, official social links, and several company/discover articles are not connected yet; their UI makes that status clear. The QR opens the current website, not an unprovided app download. Set `VITE_PUBLIC_SITE_URL` to a published public origin to make the QR usable on other devices.

Run `npm run test:selling` against the running development server for public access, draft persistence, anchors/scroll tracking, calculator/FAQs, newsletter/privacy, localization and mobile layout checks.

Run `npm install` and `npm run dev` to preview the app. The redesigned storefront uses Sifit’s existing green (`#006c49`) palette, a sticky two-row header, the local logo/favicon and hero image, category navigation, collections, search suggestions, and a two-column auth page.

The language selector supports Vietnamese and English and saves the choice in `localStorage`. New screen copy lives in `src/context/LanguageContext.jsx`; existing marketplace tool copy lives in `src/data/workspaceTranslations.js` and is rendered through `LocalizedContent`. Product descriptions, user messages, and form/select values retain their original data.

Demo roles are hidden until **More options to log in** is expanded. Accounts: `buyer@sifit.com`, `seller@sifit.com`, `admin@sifit.com`; password: `123456`. Email registration and login use the existing in-memory prototype. Google/Facebook/Apple buttons show an explanation until OAuth is connected.

The Figma connector did not return the linked node, so auth styling follows the screenshot supplied with the request, using Sifit fashion imagery. The four collection photos reuse the project’s Unsplash sources. Last chance currently selects pieces priced up to 500,000 VND; the mock dataset has no original/discount price fields.

Validation: `npm run build`, `npm run lint`, and `npm run test:ui`. For UI checks, start Vite on port 5174, or set `SIFIT_TEST_URL` to its URL. The test uses installed Chrome by default; set `SIFIT_BROWSER_CHANNEL` to `msedge` or another installed supported browser if needed. Screenshots are saved to ignored `artifacts/redesign/`.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
