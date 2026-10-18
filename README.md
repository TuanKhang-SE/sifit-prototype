# React + Vite

## AI Stylist / Virtual Try-On

Open `http://localhost:5173/?view=ai-stylist`. This feature reuses the existing React context, query-string routing, green palette, Tailwind buttons, icons and Vietnamese/English translation boundary. Guests see an introduction; login returns to the fitting room with the product selection preserved.

### Run locally (PowerShell)

```powershell
npm install
python -m pip install -r server/requirements.txt
Copy-Item .env.example .env
# Warm the higher-quality CPU model once (downloads approximately 224 MB).
python -c "from rembg import new_session; new_session('birefnet-general-lite')"
npm run dev:all
```

If Vite is already running, use `npm run dev:api` in a second terminal. Vite proxies `/api` to port 3001. The API binds to localhost. Configure `PYTHON_BIN` with an absolute Python/virtual-environment executable path if necessary. Both `npm run dev` (frontend) and `npm run dev:api` remain available independently.

**Demo mode is honest about its output:** background removal runs on the CPU through rembg/[BiRefNet](https://github.com/ZhengPeng7/BiRefNet) (`birefnet-general-lite`). The portrait compositor removes disconnected background remnants, crops to the subject, centers them horizontally and grounds their feet on a white circular plinth with a soft shadow. It preserves the person's original pose and clothing. This is segmentation/compositing, not a generative pose change. The higher-quality model is slower than the previous U²-Net tiny model (roughly 20–30 seconds on this development machine). Try-on simulates progress/history/quota and returns the saved model with a visible DEMO label; it does not call FASHN. Model creation produces one image; photo preparation and background removal have no credit charge and no daily creation limit. Only one photo/job task per member can run at a time.

Photo preparation offers **Giữ ảnh gốc** (default) or **Xóa phông**. Keeping the original preserves its scene, pose and clothes and skips background-removal inference. Removing the background uses BiRefNet and offers the white studio, four supplied `nenbg` scenes or four `nen-removebg` decoration frames on white. The eight supplied assets are in `src/image/backgroud-aistylist/`; `server/backgrounds.mjs` defines allowed backgrounds and placement. Thumbnails are compressed server-side. The person is centered with feet aligned to each scene's existing platform. Changing the background of a draft reuses a private cached cutout and does not consume another model-processing attempt.

Optional height, weight, bust, waist and hip fields appear in the wardrobe and outfit suggestions, with a separate **Lưu số đo** action. Saved numbers and the explicit Nam/Nữ/Unisex clothing preference survive page reloads. They are stored as a separate account profile and not required for photo preparation. FASHN v1.6 has no measurement input parameters; numbers support profiles/advice, while visual fitting uses the uploaded person image. This does not guarantee physical sizing. Both photo processing and real try-on require explicit consent to AI Stylist terms, enforced in the backend and recorded with the terms version/time. Face hiding is unchecked by default and never required. Photo tips, measurements, credit details and history open on demand; navigation stays compact.

The **AI gợi ý** tab beside **Trong giỏ** uses local CLIP image analysis for garment design/type and palette, multilingual MiniLM for occasion ranking, and explicit outfit rules. Results are complete top/bottom/shoes sets, separated by clothing department and matched colours, with optional height/weight/bust/waist/hips inputs. Add the whole set or select it to try. Product analysis and model weights are cached locally; no generation request is made by opening suggestions. See the current controls section below for details.

Face hiding is optional and reversible for newly saved photos. The local [MediaPipe face detector](https://developers.google.com/edge/mediapipe/solutions/vision/face_detector/web_js) finds the face; upper-body cropping helps full-body photographs. A backend [OpenCV YuNet](https://github.com/opencv/opencv_zoo/tree/main/models/face_detection_yunet) detector supplies a local fallback and re-detects each provider output before the next step. Run `python scripts/setup-server-face.py` after installing `server/requirements.txt`; the small YuNet model and MIT license are included under `server/models/`. `npm install` prepares browser WASM/model assets, or use `npm run setup:vision`.

Face blur uses actual facial pixels instead of an opaque white shape and leaves the body/background unchanged. Detection is automatic; a manual region editor appears only when detection fails. Private originals remain on the owner-only backend so face blur can be toggled without another try-on. Served images, album/download links and provider inputs obey the image's saved privacy setting. Intermediate FASHN inputs are blurred when enabled; generated face pixels may already be blurred by the provider and cannot be reconstructed by toggling visibility. Previously saved white masks cannot be undone without the original photo. Background editing is also available after fitting: open the displayed portrait/result, make a new draft, then confirm or Back. The existing model and history survive until confirmation.

Existing portraits from the old top-strip version require a new upload via **Thay ảnh**. Their original face pixels were deliberately not retained, so they cannot be restored automatically. Old portraits are displayed until replaced; trying them is disabled until upgraded. Quotas remain unchanged.

Each member has one saved primary model. Choosing **Thay ảnh** keeps the current model visible and usable after **Quay lại**; drafts do not replace it. Only **Lưu người mẫu** confirms the replacement and removes the old primary portrait. Try-on results remain in private history across model changes. **Lịch sử / Album ảnh** supports pagination, bookmarking, downloads and viewing earlier model results. Cache/regeneration applies only to the current primary model. Model and individual-result deletion require a confirmation popup. Deletion removes both model/draft images and try-on history without resetting any allowance. Photos are served only through authenticated, owner-checked routes, never from a public static uploads directory. Data is persisted in ignored `server/data/`; do not commit or publish it.

### Enable FASHN v1.6

For repeated local testing, click the visible **Reset credit tài khoản** button beside the credit balance in AI Stylist. It restores the signed-in account's daily/monthly allowance in the current mode, including live mode, while preserving model/history. It does **not** refill/refund purchased FASHN credits. Entries are marked `allowanceResetAt` rather than `refunded`, so the actual paid ledger and global monthly cap remain intact. The owner-only endpoint rejects resets while a task is running. This testing control is disabled in production or with `SIFIT_ACCOUNT_RESET=false`. The legacy demo-only endpoint remains available for isolated demo checks. Photo processing itself is always free and unlimited.

Edit the backend `.env`, then restart the API:

```dotenv
TRYON_MODE=live
FASHN_API_KEY=your_key_here
FASHN_MONTHLY_BUDGET=100
```

Never put the key in a `VITE_` variable. The adapter uses `POST https://api.fashn.ai/v1/run`, `model_name: tryon-v1.6`, `mode: quality`, explicit garment photo type, `segmentation_free: true`, `num_samples: 1`, `return_base64: true`, then polls `GET /v1/status/{id}`. See [FASHN v1.6 documentation](https://docs.fashn.ai/api-reference/tryon-v1-6). Live generation was verified with one output, consuming exactly one API credit (100 → 99), and replaying the same combination reused the saved result without another generation. The check used a separate test account; its receipt and image are in ignored `artifacts/stylist/`. The local `.env` is now in live mode; normal automated tests use demo mode or mocked provider responses.

### Catalog and image sources

The storefront currently seeds products, prices, brands, sizes, shops and reviews from **`src/data/mockData.js`**, not a retailer/supplier API or live scraping. The original illustrative product photos reference **`images.unsplash.com`**; demo avatars reference **`i.pravatar.cc`**. Some photos are illustrative and do not match the named brand or product. FASHN transfers the visible garment in the reference image, not the text title, so curate actual garment photos before pitching accurate product try-ons. Seller Studio currently accepts an image URL and creates/edits an in-memory listing; those listings are not a persistent commercial catalog. SiFit logos/banners and the new fitting-room backgrounds are local supplied files. AI recommendations search this same seeded clothing catalog and do not invent new products.

The catalog now also includes **12 supplied clothing photos** from `src/image/quanao-image` and **170 individual product references** selected from [Humanbased-AI/Fashion-1K](https://huggingface.co/datasets/Humanbased-AI/Fashion-1K). Imported items are defined in `src/data/importedCatalog.json` and normalized by `importedCatalog.js`, shared by React and the backend. Images are stored locally as WebP under `public/images/catalog/`. The dataset consists of outfit boards; curated regions and connected foreground extraction isolate one product and retain its original colours/form. Occluded or inseparable items are rejected rather than inventing hidden details. The catalog includes clothing, skirts/dresses, trousers, outerwear, footwear and bags. Supplied photos are kept as supplied, including on-model shots. Price/size/condition/seller fields for these new references are explicitly demo metadata, not retailer offers or verified brand authenticity. Per-image origins, selection coordinates and declared dataset license are retained; see `public/images/catalog/SOURCES.md`. The dataset card declares OpenRAIL, but does not establish ownership of every underlying retail photograph; confirm the underlying image rights before commercial publication. Regenerate the selected assets with `python scripts/import-catalog.py` (requires Pillow, NumPy and SciPy; originals download to ignored artifacts). FASHN receives local references as data URIs, never localhost URLs.

An additional **101 menswear/footwear products** now use high-resolution, original-background Myntra photos via the Fashion Product Images metadata on Hugging Face. `src/data/mensCatalog.json` records actual source gender, article type, image URL and original title; `scripts/import-mens-catalog.py` reproduces the reviewed selection. These images are resized and encoded to WebP only, with no background removal. Folded garments, outfit boards and underwear references were excluded. Prices/sizes remain demo values. Catalog cards are unique per product ID, not generated colour variants. Supplied local dresses are assigned women; other supplied items remain unisex rather than guessing the user’s identity. See image rights/provenance in `public/images/catalog/SOURCES.md`.

The fitting room expands to 1440–1600px on desktop with 510–580px portraits, and fills the available photo width on phones. Wardrobe and recommendation thumbnails use `contain` to show the whole garment.

Clothes in the demo catalog are supported by v1.6; shoes/bags/accessories are available in the Max mode. The fitting room explains this when those items are in the bag. A clothing detail page's **Thử đồ với AI** adds the item to the bag and opens the fitting room. A second item in the same category is rejected in both UI and API; the user must deselect the previous item. One item per category can be selected, up to three: bottoms → top → outerwear. Multiple items are applied sequentially using each previous output as the next model image. v1.6 accepts a single `garment_image`, not an array of garment images. Standard mode routes clothes through v1.6 and other wearable categories through Max; a top/bottom/shoes set uses 1+1+2; output quality may drift between steps. A dress cannot be combined with another top or bottom. Product reference photos must clearly depict the actual garment: some existing mock Unsplash images are illustrative, so replace them with suitable garment images for a convincing live presentation. Newly created in-memory seller listings are not part of this backend's trusted demo catalog.

**Quality selection:** the default economy option now calls `tryon-v1.6` in `quality` mode at 1 credit/item. The enhanced option calls `tryon-max`, `generation_mode: balanced`, `resolution: 1k`, `num_images: 1` at 2 credits/item. The UI shows the exact total before submission; there is no automatic switch to Max. Max uses `product_image`; v1.6 uses `garment_image`. A short item-selection prompt is used only where an on-model reference contains other garments. Requests do not include long preservation instructions. Cache keys separate model, generation mode, resolution and adapter version; old balanced results are not silently reused as quality results. Native original-photo framing and provider output dimensions are retained. Optional face blur scales to the actual dimensions; each provider output is re-detected locally when hiding is enabled. `submittedCredits` is persisted before HTTP submission so restart recovery preserves uncertain weighted charges. Rejected Max steps refund both reserved credits.

The FASHN Agent can route requests across tools/settings. Since the user's Agent interface does not expose a model name, its exact endpoint is unverified. This API’s previous `tryon-v1.6/balanced` call is not enough evidence of identical conditions. A fair comparison must use the same original person/product photos, model, seed and generation settings. Max is documented for improved fidelity, but no implementation can promise that every output matches an unspecified Agent run. See `docs/ai-tryon-audit.md` for the workflow audit and verification scope.

Credit protections are enforced on the server:

- 5 output credits per member/day and **10 per month**, reset using Vietnam time. Demo and live usage are separate.
- The full outfit cost is reserved before starting. One processing task per member; idempotency prevents repeated submissions from double charging.
- Same model/items/settings reuse an existing successful result for free, including after reload. Regeneration uses a new seed, requires explicit confirmation and consumes credits.
- An additional global monthly cap defaults to 100 credits, configurable with `FASHN_MONTHLY_BUDGET`.
- Rejected provider steps and steps not submitted are refunded. Completed steps and uncertain submissions stay charged to prevent accidental duplicate requests. Poll/download failures never automatically resubmit a paid call. On restart, interrupted jobs stop; unsubmitted steps are refunded and uncertain steps remain charged.
- Results are saved locally rather than depending on an expiring provider URL.

Authentication uses hashed passwords and HttpOnly/SameSite session cookies. Existing demo accounts remain (`buyer@sifit.com`, `buyer2@sifit.com`, `seller@sifit.com`, `admin@sifit.com`, password `123456`); new accounts and sessions survive API restarts. This replaces the original in-memory login solely to provide a reliable account identity for this feature. The rest of the marketplace retains its mock data. The bag is stored per account on the current browser.

This local demo backend uses one Node process and an atomically written JSON store. For public hosting, supply real authentication (including account verification to limit repeat signups), durable database/object storage, HTTPS cookies and a shared transactional quota/job queue before scaling to multiple processes. The existing admin screen's in-memory blocking is not connected to backend authentication. Request/photo history is private to each account.

### Checks

```powershell
npm run build
npm run lint
npm run test:portrait
npm run test:stylist
# Starts its own isolated demo API + frontend; never consumes FASHN credit:
npm run test:stylist-update
# With frontend + API running in demo mode:
npm run test:stylist-ui
```

Portrait tests verify off-center foreground placement, the white stage, preserved clothing pixels, face-coordinate transformation and empty-image rejection. Backend tests use an isolated temporary store and mocked FASHN boundary: login/ownership, real BiRefNet processing, face-blur pixels and reversible owner-only privacy settings, quotas, deduplication, cache, sequential outfits, provider errors and deletion/logout. The isolated update check covers imported assets, same-category rejection, safe model replacement/cancel, private history/album, warning dialogs, whole-garment thumbnails, larger desktop/mobile layout and actual free semantic recommendations. UI tests cover compact navigation, photo tips, automatic/fallback face masks and keyboard adjustment, model save, outfits, free cache, persistence, EN/VI, mobile menus and chat. Screenshots go to ignored `artifacts/stylist/`. Optionally set `SIFIT_TEST_PHOTO` to a local sample photo for visual QA; the default fixture is synthetic.

## Sifit redesign

### Public selling pages

`?view=sell` opens Ways to Sell without authentication; `?view=sell-guide` opens the single-page Clean Out Guide. Its sticky section menu tracks What to Send, Earnings, What to Expect, and FAQs. Footer deep links such as `?view=sell-guide#earnings` scroll into the matching section. The earnings calculator uses the prototype’s existing 7% direct-listing service fee, not ThredUp payout rules.

The centred header logo is `src/image/logo-favicon/Sifit-nobg.png`; the original square JPEG remains the favicon. The selling panels use the supplied `banner (1).png` and `banner (2).png`. The impact section uses original Sifit copy rather than attributing ThredUp’s 20M / 90% statistics to Sifit.

Direct-listing drafts and newsletter interest are stored only on the current device. The footer’s privacy controls can remove the saved email. Email delivery, app releases, official social links, and several company/discover articles are not connected yet; their UI makes that status clear. The QR opens the current website, not an unprovided app download. Set `VITE_PUBLIC_SITE_URL` to a published public origin to make the QR usable on other devices.

Run `npm run test:selling` against the running development server for public access, draft persistence, anchors/scroll tracking, calculator/FAQs, newsletter/privacy, localization and mobile layout checks.

Run `npm install` and `npm run dev` to preview the app. The redesigned storefront uses Sifit’s existing green (`#006c49`) palette, a sticky two-row header, the local logo/favicon and hero image, category navigation, collections, search suggestions, and a two-column auth page.

The language selector supports Vietnamese and English and saves the choice in `localStorage`. New screen copy lives in `src/context/LanguageContext.jsx`; existing marketplace tool copy lives in `src/data/workspaceTranslations.js` and is rendered through `LocalizedContent`. Product descriptions, user messages, and form/select values retain their original data.

Demo roles are hidden until **More options to log in** is expanded. Accounts: `buyer@sifit.com`, `seller@sifit.com`, `admin@sifit.com`; password: `123456`. Email registration and login now use the local AI Stylist backend described above. Google/Facebook/Apple buttons show an explanation until OAuth is connected.

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

### Outfit suggestions and current room controls

Keeping the original photo now uses a single **Lưu ảnh** action: it uploads and confirms the original, without an AI model-generation preview step. Background removal uses **Tạo hình ảnh**, then save/redo. The old primary stays intact until save; Back cancels the pending replacement.

The try-on action stays enabled unless a task is running. On click, missing photo/selection/terms, quota limits or unavailable service get a specific explanation instead of a disabled button with no reason. Explicit consent is still enforced on both client and API.

All active apparel, shoes, bags and accessories have a compact AI button next to bag/negotiation actions. Standard mode uses v1.6 Quality for clothes and Max for footwear/accessories; an ordinary top/bottom/shoes set costs 1+1+2, rather than upgrading all three items to Max. Enhanced mode uses Max for every item. Server reservations, refund/restart logic and cache keys include the per-step models. Each category still permits only one selected item.

Recommendations now analyze actual catalog images using local q8 CLIP (`Xenova/clip-vit-base-patch32`), with a cropped garment region for on-model product shots. This classifies clothing designs, garment kinds and colour families, not the identity/gender of a pictured person or user. Explicit retailer gender metadata is retained; neutral/ambiguous clothing designs remain unisex. Visual annotations are keyed by image hash under ignored `server/data/catalog-vision.json`. Warm them with `node scripts/analyze-catalog.mjs`. Model weights stay in the ignored model cache.

Multilingual MiniLM supplies occasion ranking; outfit assembly then requires a top, separate bottom and shoes, compatible gender/style groups and coherent palette. Dresses are excluded from top/bottom sets. Budget applies to the whole set. Results are grouped into outfits with palette chips, add-whole-set and select-to-try actions. Height/weight/bust/waist/hips are optional and share the account body profile; they do not establish actual garment sizing. Catalog vision is a heuristic and may misclassify ambiguous colours/designs.

Explanatory free/paid-credit copy is removed from room controls. Actual allowance/selection totals remain visible. Add-to-bag messages use an accessible corner toast instead of browser alert(). Tests run against an isolated demo API and never request paid outputs. The current catalog selection is preserved; analysis does not reinsert omitted references.


### Experimental whole outfit in one call

Select **Thử nghiệm (2)** in the room's quality selector, then exactly one top and one pair of trousers/shorts. SiFit composes two full original product photographs into labelled left/right panels, sends that single `product_image` with the saved portrait to Try-On Max (`balanced`, `1k`, `num_images: 1`), and asks for both items. This is an experimental collage input, not a native array of garment images. Dresses, skirts, extra items and same-category pairs are rejected before payment.

The whole outfit reserves **2 credits total** and has **one processing step**. Ordinary and enhanced sequential modes remain selectable. Cache keys separate the collage pipeline/version from sequential outputs, keep selection order deterministic, and include source images and face privacy. Rejections refund both reservations; uncertain submissions remain reserved. Reference preparation failures refund all reservations before provider traffic. There is no automatic retry or extra generation to fix a missing item.

`npm run test:outfit-ui` checks the experimental selector, two-credit total, invalid selections, one processing step, cached results, reload and mobile layout using an isolated demo API. `server/outfit.test.mjs` verifies actual collage bytes and the mocked paid request/refund boundary.

A bounded live test on the public sample photo and `men_15970` + `everyday_27614` completed with both the plaid shirt and beige trousers visible. FASHN balance changed **80 → 78**; cache reuse was verified with no further generation. Receipt and pictures are ignored under `artifacts/stylist/outfit-single-pass-*`. This establishes feasibility for one example, not guaranteed exact garment detail/identity preservation or superiority over a controlled two-pass comparison. The black reference belt was not transferred; garment shape/tucking differs somewhat. No comparable two-pass run on these same inputs was purchased.

### Personalized outfit suggestions with Gemini

Set **GEMINI_API_KEY** from a **Free Tier Google AI Studio project** in the backend `.env`, then restart `npm run dev:api` (or the combined development server). The default is **gemini-3.8-flash**, with fallback to **gemini-3.6-flash**, **gemini-2.5-flash**, and **gemini-2.5-flash-lite** when a model is unavailable or its quota is exhausted. Only these image-capable free-tier models are accepted; Pro and paid image-generation models are blocked. A key attached to a paid project remains subject to paid-project billing even when the model offers a free tier: HTTP 402 requires a Free Tier project key, not another model name. See Google's [pricing](https://ai.google.dev/gemini-api/docs/pricing). Keys never go to Vite or the browser. API quotas depend on the Google project.

Suggestions require a saved full-body portrait and valid height/weight; bust, waist and hip measurements remain optional. The saved portrait is sent only when the user explicitly checks **Đồng ý dùng ảnh và số đo cho Sifit**. If hidden, the face is blurred first. Gemini also receives a labelled contact sheet of real candidate top/bottom/shoe outfits. It selects known complete outfits and explains silhouettes/lengths/palettes; returned IDs are checked against candidates, so it cannot invent unavailable products. Retailer article-type/colour metadata takes priority over uncertain CLIP predictions. Nam/Nữ is the user's explicit clothing preference; image analysis must not infer gender identity, sex, health, ethnicity, age or precise measurements. It does not establish garment fit.

Identical Gemini inputs coalesce and cache per account for one hour (bounded memory cache). Calls time out and are limited to five requests/minute/member. Missing photos or required measurements are rejected before inference; consent is required when Gemini is configured. Missing keys or provider errors fall back to local suggestions with a truthful status. Gemini usage is separate from FASHN's 5/day, 10/month allowance; photo/background/face operations do not debit it.

FASHN uploads compress portraits above 1 MiB to JPEG quality 90 after face masking, while preserving stored originals. Submission timeout is 90 seconds; uncertain submissions are never retried automatically. Provider rejection, quota, authentication and timeout errors have distinct messages. Run `node scripts/verify-fitting-room-controls.mjs` to check photo prerequisites, cart removal, measurement requirements, cart-only try-on controls, the large suggestion button, 90% scale and mobile layout without provider calls.

An additional **200 original retailer photos** are recorded in `src/data/everydayCatalog.json`: 100 T-shirts, 50 shorts, 50 trousers (140 men, 60 women). Images come from original Myntra URLs via [Fashion Product Images metadata](https://huggingface.co/datasets/mecha2019/fashion-product-images-small). Backgrounds are retained; only resize/WebP encoding is used. The importer excludes packs/outfit sets and reviewed underwear/mislabelled items, checks image dimensions and duplicate hashes, and preserves a fixed manifest. `python scripts/import-everyday-catalog.py` reproduces it (`requests`, Pillow and `pyarrow` are needed only for refreshing the source metadata). Prices, sizes, condition and sellers remain demo records. See `public/images/catalog/SOURCES.md` for provenance.

`npm run test:stylist-personalization` exercises a real public sample photo, automatic and reversible face blur before/after demo try-on, explicit measurement save/reload, persistent selections/preferences, existing-result background removal and safe Back, enlarged desktop/mobile layouts, and a mocked multimodal Gemini boundary. It never calls a paid provider. `npm run test:stylist-update` retains the broader existing-flow checks. The backend suite covers provider payloads, refunds, ownership and quotas as well as the new privacy/Gemini routes.

### Catalog variety update

**Latest experimental try-on update:** **Thử nghiệm (2)** now accepts 1–4 selected fashion items, without requiring one shirt plus one pair of trousers. Original photos become numbered category-labelled panels; 3–4 items use a 2×2 grid. Try-On Max identifies and applies all selected items in one call, at two credits total. Each category permits one item; a dress cannot combine with another top/bottom. Sequential engines retain their three-item limit. `outfit-collage-v2` cache keys prevent reuse of previous pair-specific results. The mock-provider and isolated desktop/mobile checks pass; no paid generation was requested for this expansion. Restart the user-managed backend to load updated routes.

The current retailer selection removes 88 redundant T-shirt cards (130 → 42: 30 men, 12 women) and adds 120 different references under `src/data/varietyCatalog.json`: shirts/blouses, sweaters, sweatshirts/hoodies, jackets, jeans, dresses, skirts and handbags, with 60 men / 60 women. Existing owner photos are preserved. The collection is interleaved by article type and appears first in newest-arrival sorting; source gender/type/colour metadata is used for recommendation matching. All new photos retain their original backgrounds and have recorded original URLs.

Reproduce the selection with `python scripts/import-variety-catalog.py`. `node scripts/verify-catalog-variety.mjs` verifies asset availability, unique cards, balanced first arrivals, category/gender filters and desktop/mobile presentation using a temporary frontend with API traffic blocked. Catalog/vision preparation does not call paid AI providers. Restart the user-managed backend after changes to source manifests to reload its shared product catalog; frontend updates on reload/HMR.
