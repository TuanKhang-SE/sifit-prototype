# Sifit frontend

React 19 + Vite + Tailwind frontend for the Sifit second-hand fashion marketplace.
It uses the Express/MongoDB backend in `C:\Sifit-backend`.

## Local development

1. Configure and start the backend as described in its README. MongoDB must support transactions (replica set or Atlas).
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to your backend API URL (default: `http://localhost:5000/api/v1`).
3. Backend `FRONTEND_URL` and `SOCKET_CORS_ORIGIN` must match the exact frontend origin, including port. Use the same hostname (`localhost` or `127.0.0.1`) for both apps so refresh cookies work.
4. Run `npm install` and `npm run dev`.

Optional `VITE_SOCKET_URL` overrides the Socket.IO origin. Otherwise it uses the API origin.
`VITE_PUBLIC_SITE_URL` configures the public site URL encoded in the footer QR.

## API integration

- `src/services/apiClient.js`: Axios, bearer token kept in memory, shared refresh-token request, HttpOnly refresh cookie and session expiration.
- `src/services/*`: backend API contracts; `src/utils/normalizers.js` and `orderService.js` adapt server documents to views.
- `AppContext`: public catalogue, authentication, buyer orders/cart/wishlist, conversations and realtime messages.
- Seller Studio: own drafts (including rejected/pending), multipart image upload/removal, submit for admin moderation, seller orders, shipping quotes/shipments, shop profile, verification requests, earnings and payout history.
- Checkout: the backend checks out the whole cart and splits it by seller. Remove unwanted items explicitly; checkout never silently removes unselected items. Totals, commissions and payment status come from the server. Idempotency keys survive retries in the current mounted form.
- Buyer account: persistent address book, payment attempts, cancellation, shipment tracking, verified-delivery receipt confirmation, reviews per order item, disputes and password changes.
- Admin: live dashboard, user suspension/reactivation, product moderation, orders, message report resolution, shop verification and dispute review/resolution.
- Wishlist and notification screens use persistent server data; notification preferences and read/archive actions use REST.
- Chat uses REST history and persistence plus Socket.IO events. Reconnect reloads history, older messages use cursor pagination, and failed sends retain the input/idempotency key. Message reports use the message-report API.

Accounts have a distinct `BUYER`, `SELLER`, or `ADMIN` role. Signup persists the buyer/seller selection; login and session restoration open the matching interface. The API enforces role and resource ownership. Public signup cannot create admins.

Catalogue filters currently work over all public API pages. Shops display the backend's latest 20 products. Unsupported product fields such as material are not sent as if the backend persisted them; material keywords search descriptions instead.

## Current backend limitations

Payment, shipping and seller verification providers are simulators. The frontend creates real backend records but cannot confirm payments or delivery itself. Only verified backend events advance those states. There is no COD/VNPAY/Momo integration in the current backend.

The backend has no general user-profile update, AI stylist, shop-following, product-report or advertising-package API. Profile details are read-only, AI and product reports clearly show unavailable status, and fake package/follow actions have been removed. Public guide copy does not assume a fixed commission rate. Newsletter interest and language preferences remain explicitly local browser preferences.

Seller images require configured Cloudinary credentials during normal development. A failed upload retains the already-created draft so it can be retried without creating another product.

Buyer orders show the saved recipient/address, the reservation/payment deadline and the post-delivery protection deadline in Vietnam time (UTC+7). Expired reservations disable payment in the UI; the server/expiry worker remains responsible for cancelling and releasing inventory.

Paid orders in PAID/PROCESSING/SHIPPED state can open an ITEM_NOT_RECEIVED case before verified delivery. Other reasons require an active post-delivery protection window. Unpaid, cancelled, refunded and expired post-delivery cases are rejected, and an active case disables a duplicate submission. Opening a case only requests admin review; it never automatically refunds payment.

Completed verified purchases support per-product review creation/editing/removal, up to five JPEG/PNG/WebP images (5 MB each), and one shop rating per order. Edit deadlines come from backend REVIEW_EDIT_WINDOW_DAYS. Deleted reviews cannot be edited or recreated. Image uploads require Cloudinary; a failed image upload preserves the saved review text for retry. Buyer-order responses batch their review/case metadata so each order card does not fetch the entire review history separately.

## Verification

```text
npm run build
npm run lint
npm run test:integration
```

`test:integration` (also `test:ui`) starts the actual backend on port 5017, Vite on 5187 and a disposable MongoDB replica set. It uses the installed backend dependencies and Chrome by default. Set `SIFIT_BACKEND_DIR` or `SIFIT_BROWSER_CHANNEL` when needed. No browser API routes are mocked; only external Cloudinary storage is replaced inside this test process. It does not use the configured development database. Screenshots go into ignored `artifacts/integration/`.

Run `npm test` in the backend directory for its Jest/Supertest suite.
# Vai trò và giao diện tài khoản

- `BUYER`: giao diện mua sắm, giỏ hàng, đơn mua, yêu thích, chat và thông báo.
- `SELLER`: trung tâm người bán riêng, quản lý shop, sản phẩm, đơn bán, giao hàng, doanh thu, chat và thông báo; không hiển thị thanh mua sắm và giỏ hàng.
- `ADMIN`: trung tâm quản trị riêng. Không có lựa chọn đăng ký admin công khai.

Đăng ký gửi vai trò đã chọn tới backend. Đăng nhập, khôi phục phiên và truy cập URL trực tiếp đều dựa trên vai trò thực tế từ backend. Người bán đã từng mua hàng trước khi chuyển vai trò có mục “Đơn mua trước đây” để tiếp tục xử lý các đơn cũ. Backend cần chạy migration theo hướng dẫn trong `C:/Sifit-backend/README.md` trước khi dùng với dữ liệu `USER` cũ.
