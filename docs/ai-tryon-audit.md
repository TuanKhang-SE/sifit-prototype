# SiFit Virtual Try-On workflow audit

Verified on 2026-10-13. This review covers the React fitting room, local Express API, image preparation, FASHN requests, quota ledger, persistent history and catalog references.

## Findings and changes

| Stage | Previous behavior | Current behavior |
| --- | --- | --- |
| Catalog | Many women references; no explicit men filter | All / Women / Men / Unisex tabs, a men navigation link, and gender-filtered AI suggestions. 101 additional men products, one card per ID, all image hashes distinct. |
| Men's product photos | Not available | High-resolution Myntra product photos joined to source metadata. Original background retained; resize/WebP only. Folded shirt, outfit board and underwear references excluded. |
| Photo preparation | Three successful preparations/day; 864×1296 canvas even when retaining the original | Unlimited free preparation/removal/composition. Original-photo ratio retained, EXIF normalized, dimensions capped without enlarging, optional face mask in native coordinates. Background removal remains local BiRefNet. |
| Account reset | Only demo usage could reset | Visible local account reset works for current signed-in account in demo/live; neither provider balance nor paid global ledger is reset. Disabled in production. |
| v1.6 request | Balanced mode, photo type auto | Quality mode, one output, explicit photo type when known, target category and segmentation-free fitting. Same 1-credit output price. |
| Enhanced request | Not available | Explicit user choice: Try-On Max / balanced / 1k / one output, 2 credits/item. Uses product_image. No automatic paid upgrade. |
| Output | Resized to 864×1296 after every step | Native provider dimensions preserved. Face masking, when enabled, uses actual output dimensions. |
| Cache | Model/items, v1.6 balanced | Separates endpoint, quality, resolution and adapter version. Earlier balanced results remain in history; they are not served as quality results. |
| Crash recovery | Single-credit step counter; uncertainty not persisted before submission | submittedCredits persisted before sending HTTP. Weighted Max credits remain reserved for uncertain submissions; rejected/unsubmitted steps refund their actual weight. |
| Saved model | Replacement draft separate from primary | Existing safe replacement retained: Back discards draft, Save confirms replacement. Private result history/album survive replacement. Delete actions require warning dialogs. |

## Current flow

1. Login is required. Cookie authentication provides the backend account identity.
2. Upload a photo, choose original/background removal and optional face hiding, accept photo-processing terms. This never submits a FASHN call or reserves credits.
3. The current saved model stays intact until a new draft is confirmed. Back returns to it. Optional measurements belong to the try-on step, not background removal.
4. Browse gender/category filters or ask AI for gender-filtered catalog suggestions. Add products to the existing cart.
5. Choose v1.6 Quality (1 credit/item) or Max (2 credits/item). UI and API reject duplicate categories and incompatible dress/top/bottom combinations. v1.6 supports clothing; Max also supports footwear/accessories.
6. Accept try-on terms and submit. Reserve the whole cost atomically, enforce one active task, daily/monthly allowance and global budget, and deduplicate request IDs.
7. Multiple selected items use sequential requests. Each request receives the previous result as the person image. Both documented API endpoints accept one reference image, not an array of separate garment images. The image matching a selected item is sent with a short category-selection prompt only when necessary for Max on-model photos.
8. Save output privately, optionally bookmark to album, download or revisit for free. Regeneration uses a new seed and consumes displayed credits. Provider errors do not automatically retry a paid request.

## Why Agent and the old API result can differ

The user confirmed that the Agent interface does not expose a model name. It would be inaccurate to state that their particular Agent run uses Max or v1.6. Agent can use multiple images and choose tools/settings; the former SiFit adapter explicitly used v1.6/balanced. Those are not demonstrated to be equivalent conditions.

Reference photos, framing, processing, endpoint, generation settings and random seed all affect the outcome. The old original-photo path added a fixed canvas and reduced detail; some imported garment references were extracted from outfit boards. New menswear references retain their backgrounds, and the original-person and output paths now retain their framing. No long preservation prompt is added to the request.

Official references:

- [FASHN v1.6 parameters](https://docs.fashn.ai/guides/tryon-parameters-guide): quality mode, explicit garment photo type and category selection.
- [Try-On Max](https://docs.fashn.ai/api-reference/tryon-max): product/model inputs; balanced 1k costs 2 credits/output.
- [FASHN Agent](https://help.fashn.ai/using-fashn/agent/create-and-edit-images): multi-image tasks and concise instructions.
- [Studio Try-On](https://help.fashn.ai/using-fashn/studio/try-on): on-model reference photos and image preparation guidance.

## Verification and limits

19 backend cases pass, including ownership, free preparation beyond three attempts, native original/output dimensions, live allowance reset without global-budget bypass, v1.6 quality inputs, weighted Max charges/refunds, cache, uncertain requests, sequential outfits, history and deletion. The UI check starts its own isolated demo API/Vite server; it covers gender tabs, same-category rejection, Max price switching, native image framing, cancellation/replacement, album, confirmation dialogs, English/Vietnamese, mobile overflow and actual free recommendation inference.

A bounded live comparison used the same public sample person image, original-background men_15970 shirt photo, seed 42 and no face mask, in a separate verification account. Both v1.6 Quality and Max completed; provider balance went from 94 to 91. Reusing each result returned the cache with no extra generation. Receipt: artifacts/stylist/quality-comparison-receipt.json. Outputs: artifacts/stylist/quality-v1-6.png and quality-max.png. No private user portrait or saved model was changed.

In this one comparison, Max produced a more regular untucked hem and natural shirt drape; v1.6 retained a detailed plaid pattern but produced an asymmetric partly tucked hem. These are observations from one example, not a quality guarantee. Max also changed some body/face/pose details slightly, so identity and physical fit should not be treated as exact measurements. This test compares two API endpoints, not the user's unspecified Agent configuration.

Images, optional measurements and the paid ledger remain on the local demo backend. Prices/sizes/conditions and new catalog sellers remain demo metadata. Source availability on a public dataset is not proof of commercial image rights; provenance is recorded in public/images/catalog/SOURCES.md.

## Current controls and visual outfit recommendations

Original mode now saves directly with Lưu ảnh. Removal mode offers Tạo hình ảnh followed by save. The try-on action stays usable and validates missing photo, items, terms or allowance with a clear message. It never silently accepts consent or submits an invalid/over-budget request.

Catalog suggestions now read actual product images with cached local CLIP and assemble top/bottom/shoes outfits with compatible colour families and department filters. Neutral/ambiguous clothing remains unisex; no user identity or gender is inferred from their photo. Optional measurements are shared with the body profile; they do not guarantee physical sizing. The visual classifier can be uncertain, so trusted source metadata and garment-category constraints remain part of selection. Sets can be added to the bag or selected together for fitting.

All active wearable categories appear in the fitting room and have a compact detail action. Standard mode uses v1.6 for apparel and Max for shoes/accessories, with per-item weighted reservations. A three-piece outfit can fit under the existing daily cap. Enhanced mode uses Max for all items. Add-to-bag uses a corner status toast, and explanatory credit paragraphs were removed from the page.

The current backend suite has 21 passing cases. Additional UI checks cover direct photo save, create-image naming, enabled action with consent feedback, optional recommendation measurements, actual visual outfit responses, add-whole-set/selected-set handoff, compact shoes/bag detail actions and toast notifications. These checks use an isolated demo API or mocked provider requests; no new paid output was requested for this update.


## Personalized room / privacy revision

- Added an explicit owner-only `PUT /api/stylist/measurements` action and persisted clothing preference. Photo preparation still ignores measurements; reload restores fields.
- Added `PATCH /api/stylist/images/:id/privacy` for model/draft/completed-result images. New private originals support reversible true blur, not an opaque white ellipse. Automatic MediaPipe detection works on originals/results; local YuNet is the fallback and re-detects intermediate provider images. If detection fails, manual geometry remains available. Old baked white masks cannot be restored without the original upload.
- Returned the public result image ID needed for privacy actions; this fixes controls failing after fitting. Privacy checkboxes provide immediate pending feedback while detection runs. Saved-result background editing creates a draft and keeps the model/history until Save; Back discards it. Selected items now persist per member through a page reload.
- Increased the fitting frame to 650px (730px on large screens), outfit photos to 185–220px, wardrobe photos to 96×128px, quality control to 48px, and added a full-size image viewer.
- Added Gemini multimodal recommendations with explicit photo consent, backend-only key, optional measurements, real candidate outfit contact sheet, strict known-ID validation, bounded per-member cache/coalescing and request throttling. Missing configuration or provider errors use a clearly reported local fallback. Department preference is explicit; no person's gender is inferred from their photo.
- Added 200 distinct original-background retail photos: 100 T-shirts / 50 shorts / 50 trousers; 140 men / 60 women. Source article/colour labels override uncertain visual classifications. Prices/sizes/condition remain demo metadata.
- Verification: 24 backend cases, 2 portrait compositor cases, the existing isolated room check and the new desktop/mobile personalization check pass. Gemini UI/boundary tests use fixtures and no paid provider calls.
- The owner supplied a Gemini key during implementation. Listing available models succeeded; one generation attempt was rejected with HTTP 400 while adapting the schema request, then the valid JSON-schema request was rejected with **HTTP 402: prepayment credits depleted**. No Gemini image analysis completed and no new paid FASHN request was made. Backend uses a clearly reported local recommendation fallback while the Google project has no usable quota. A funded/quota-enabled Google project or replacement key is needed to verify real photo suggestions.


## Single-call top and trousers experiment

Latest expansion: `outfit-collage-v2` accepts 1–4 selected fashion items, without a required top/bottom pair. Shoes/bag/jacket and four-item sets pass mock-provider tests at two credits total, one processing step and one provider submission. Reference images use numbered category labels with a 2×2 grid for three/four items. Existing category/dress guards remain, sequential modes permit at most three items, and stored client selections retain four IDs. Older pair-specific caches are separated. No paid FASHN output was generated for this expansion.

Added an explicit experimental `outfit` engine for exactly one top plus trousers/shorts. Two original product photos become one deterministic labelled collage: top left, trousers right. The request is one Try-On Max balanced/1k output, with a prompt selecting only the intended garment in each panel, even when retailer photos show other clothes. It is not a native multi-image garment API or guaranteed multi-item fidelity.

The backend reserves two credits once and records `totalSteps: 1`, while retaining both product IDs/names in history. Cache keys include a dedicated `outfit-pair-v1` pipeline and remain independent of the sequential modes. Invalid selections are rejected before reservation; collage preparation errors refund all unsubmitted units, provider rejections refund both units, uncertain submissions retain them, and there is no automatic second generation. Model/results privacy still applies before the provider and when serving outputs.

Live test: the public sample person + men_15970 plaid shirt + everyday_27614 beige trousers completed in one processing step. Both items appear in the inspected output. The person's hair/face, stance, original background and white shoes look broadly retained; shirt tucking and trouser fit/details vary. Credit balance 80 → 78 and cached re-open generated no additional paid call. Receipt: artifacts/stylist/outfit-single-pass-receipt.json; reference/output: outfit-single-pass-reference.jpg and outfit-single-pass-result.png. The owner's saved portrait was not replaced. No new two-pass baseline was purchased, so this does not demonstrate comparative superiority.

Validation: 28 backend cases pass, including the new mock-provider whole-outfit contract and refund/cache checks. The experimental room UI check uses an isolated demo API and checks both desktop/mobile layouts.
