import { chromium, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import http from 'node:http';
import fs from 'node:fs/promises';
import { createServer } from 'vite';

// Real Express routes + MongoDB replica set. Only external image storage is
// replaced; no browser route interception or fake API responses are used.
const backend = process.env.SIFIT_BACKEND_DIR || 'C:/Sifit-backend';
const requireBackend = createRequire(pathToFileURL(path.join(backend, 'package.json')));
Object.assign(process.env, {
  NODE_ENV: 'test', FRONTEND_URL: 'http://localhost:5187', SOCKET_CORS_ORIGIN: 'http://localhost:5187',
  SOCKET_IO_ENABLED: 'true', JWT_ACCESS_SECRET: 'integration-access-secret-32-characters',
  JWT_REFRESH_SECRET: 'integration-refresh-secret-32-characters', PAYMENT_WEBHOOK_SECRET: 'integration-payment-secret-32-characters',
  SHIPPING_WEBHOOK_SECRET: 'integration-shipping-secret-32-characters', COMMISSION_RATE: '10',
  MONGOMS_DOWNLOAD_DIR: path.join(backend, 'node_modules/.cache/mongodb-memory-server'),
});
const { MongoMemoryReplSet } = requireBackend('mongodb-memory-server');
const mongoose = requireBackend('mongoose');
const argon2 = requireBackend('argon2');
const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
process.env.MONGODB_URI = mongo.getUri();
let server, vite, browser;
const errors = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/XioAAAAASUVORK5CYII=', 'base64');
const imageUrl = `data:image/png;base64,${png.toString('base64')}`;
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const cloudinary = requireBackend('./src/config/cloudinary');
  let asset = 0;
  let failNextReviewImage = false;
  cloudinary.uploadBuffer = async (_buffer, options) => {
    if (failNextReviewImage && options.folder === 'sifit/reviews') {
      failNextReviewImage = false;
      throw new Error('Test image storage unavailable');
    }
    return { secure_url: imageUrl, public_id: `${options.folder}/integration-image-${++asset}` };
  };
  cloudinary.deleteAsset = async () => ({ result: 'ok' });
  const app = requireBackend('./src/app');
  const { apiLimiter } = requireBackend('./src/middlewares/rateLimit.middleware');
  // Separate browser scenarios share one loopback IP; give each a fresh rate
  // budget without changing the production middleware or its configuration.
  const resetRateBudget = () => apiLimiter.resetKey('127.0.0.1');
  const socket = requireBackend('./src/socket');
  const User = requireBackend('./src/models/user.model');
  const Product = requireBackend('./src/models/product.model');
  const Category = requireBackend('./src/models/category.model');
  const SellerProfile = requireBackend('./src/models/sellerProfile.model');
  const Order = requireBackend('./src/models/order.model');
  const Payment = requireBackend('./src/models/payment.model');
  const Message = requireBackend('./src/models/message.model');
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const password = 'Integration123!';
  const passwordHash = await argon2.hash(password);
  const [seller, buyer, admin, other] = await User.create([
    { fullName: 'Seller Integration', email: 'seller@integration.test', role: 'SELLER', passwordHash },
    { fullName: 'Buyer Integration', email: 'buyer@integration.test', role: 'BUYER', passwordHash },
    { fullName: 'Admin Integration', email: 'admin@integration.test', role: 'ADMIN', passwordHash },
    { fullName: 'Other Seller', email: 'other@integration.test', role: 'SELLER', passwordHash },
  ]);
  const category = await Category.create({ name: 'Áo', slug: 'ao' });
  await SellerProfile.create({ userId: other._id, shopName: 'Other Shop', shopSlug: 'other-shop' });
  const products = await Product.create([seller, other].map((user, index) => ({
    sellerId: user._id, title: `Integration Jacket ${index + 1}`, description: 'Cotton jacket for integration tests',
    price: 100000 + index * 50000, categoryId: category._id, size: 'M', condition: 'GOOD', status: 'ACTIVE',
    images: [{ url: imageUrl, publicId: `fixture/${index}` }],
  })));
  server = http.createServer(app); socket.initSocket(server);
  await new Promise(resolve => server.listen(5017, '127.0.0.1', resolve));
  vite = await createServer({ configFile: path.resolve('vite.config.js'),
    server: { host: 'localhost', port: 5187, strictPort: true },
    define: { 'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:5017/api/v1'), 'import.meta.env.VITE_SOCKET_URL': JSON.stringify('http://localhost:5017') },
  });
  await vite.listen();
  browser = await chromium.launch({ channel: process.env.SIFIT_BROWSER_CHANNEL || 'chrome', headless: true });
  const base = 'http://localhost:5187';
  const pages = {};
  const login = async (name, email) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(); pages[name] = page;
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(15000);
    await page.goto(`${base}/?view=auth`);
    await page.locator('input[type=email]').fill(email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill('WrongPassword123!');
    await expect(page.locator('.auth-submit')).toBeEnabled();
    await page.locator('.auth-submit').click();
    await expect(page.locator('.auth-error')).toContainText('Email hoặc mật khẩu không đúng.');
    await expect(page.locator('input[type=email]')).toHaveValue(email);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await expect(page.locator('.auth-submit')).toBeEnabled();
    await page.locator('.auth-submit').click();
    await expect(page.locator('.account-button')).toBeVisible();
    return page;
  };
  const sell = await login('seller', seller.email);
  await expect(sell.getByRole('heading', { name: 'Kênh người bán', exact: true })).toBeVisible();
  await expect(sell.locator('.store-header')).toHaveCount(0);
  await expect(sell.getByRole('button', { name: 'Yêu thích', exact: true })).toHaveCount(0);
  await sell.goto(`${base}/?view=checkout`);
  await expect(sell).toHaveURL(/view=seller/);
  await sell.reload();
  await expect(sell.getByRole('heading', { name: 'Kênh người bán', exact: true })).toBeVisible();
  await expect(sell.getByRole('navigation', { name: 'Quản lý cửa hàng', exact: true })).toBeVisible();
  await expect(sell.getByRole('button', { name: 'Tổng quan', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(sell.getByRole('button', { name: 'Sản phẩm', exact: true }).locator('svg')).toHaveCount(1);
  await sell.getByRole('button', { name: 'Thu gọn thanh bên', exact: true }).click();
  await expect(sell.getByRole('button', { name: 'Mở rộng thanh bên', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(async () => (await sell.locator('.seller-sidebar').boundingBox()).width).toBe(80);
  await sell.reload();
  await expect(sell.locator('.seller-shell')).toHaveClass(/sidebar-collapsed/);
  await expect(sell.locator('.account-button')).toBeVisible();
  await expect.poll(() => sell.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await fs.mkdir('artifacts/integration', { recursive: true });
  await sell.screenshot({ path: 'artifacts/integration/seller-sidebar-collapsed.png', fullPage: true });
  await sell.getByRole('button', { name: 'Sản phẩm', exact: true }).click();
  await expect(sell.getByRole('heading', { name: 'Quản lý sản phẩm', exact: true })).toBeVisible();
  await sell.getByRole('button', { name: 'Mở rộng thanh bên', exact: true }).click();
  await expect.poll(async () => (await sell.locator('.seller-sidebar').boundingBox()).width).toBe(248);
  await sell.getByRole('button', { name: 'Tổng quan', exact: true }).click();
  await expect(sell.locator('.seller-stat-card')).toHaveCount(4);
  await expect(sell.getByRole('heading', { name: 'Tủ đồ của shop', exact: true })).toBeVisible();
  await sell.screenshot({ path: 'artifacts/integration/seller-overview-expanded.png', fullPage: true });
  console.log('PASS seller vertical navigation, SVG icons, collapse/expand, persistence and overview');
  await sell.getByRole('button', { name: 'Kênh bán', exact: true }).click();
  await sell.getByRole('button', { name: 'Hồ sơ shop', exact: true }).click();
  await sell.getByLabel('Tên shop', { exact: true }).fill('Integration Shop');
  await sell.getByRole('button', { name: 'Lưu hồ sơ shop', exact: true }).click();
  await expect.poll(async () => SellerProfile.countDocuments({ userId: seller._id })).toBe(1);
  await sell.getByRole('button', { name: 'Đăng sản phẩm', exact: true }).click();
  await sell.getByLabel('Tên sản phẩm', { exact: true }).fill('Integration Published Jacket');
  await sell.getByRole('button', { name: 'Thu gọn thanh bên', exact: true }).click();
  await expect(sell.getByLabel('Tên sản phẩm', { exact: true })).toHaveValue('Integration Published Jacket');
  await sell.getByRole('button', { name: 'Mở rộng thanh bên', exact: true }).click();
  await sell.getByLabel('Mô tả, chất liệu và lỗi sản phẩm').fill('Cotton jacket without defects');
  await sell.getByLabel('Giá bán (VND)').fill('250000');
  await sell.getByLabel('Danh mục', { exact: true }).selectOption(category.id);
  await sell.locator('input[type=file]').setInputFiles([
    { name: 'jacket.png', mimeType: 'image/png', buffer: png }, { name: 'extra.png', mimeType: 'image/png', buffer: png },
  ]);
  await sell.getByRole('button', { name: 'Lưu bản nháp và tải ảnh' }).click();
  await expect(sell.getByRole('button', { name: 'Gửi bản đã lưu để duyệt' })).toBeEnabled();
  await expect.poll(async () => (await Product.findOne({ title: 'Integration Published Jacket' }))?.images.length).toBe(2);
  await sell.getByRole('button', { name: 'Xóa ảnh', exact: true }).first().click();
  await expect.poll(async () => {
    const alert = await sell.getByRole('alert').allTextContents();
    if (alert.length) throw new Error(alert.join('\n'));
    return (await Product.findOne({ title: 'Integration Published Jacket' }))?.images.length;
  }).toBe(1);
  await sell.getByRole('button', { name: 'Gửi bản đã lưu để duyệt' }).click();
  await expect.poll(async () => (await Product.findOne({ title: 'Integration Published Jacket' }))?.status).toBe('PENDING');
  console.log('PASS seller profile, draft, multipart upload, encoded image deletion, submission');

  const adminPage = await login('admin', admin.email);
  await adminPage.getByRole('button', { name: 'Kiểm duyệt sản phẩm', exact: true }).click();
  const pendingPanel = adminPage.locator('section').filter({ has: adminPage.getByRole('heading', { name: 'Integration Published Jacket', exact: true }) });
  await pendingPanel.getByRole('button', { name: 'Duyệt', exact: true }).click();
  await expect.poll(async () => (await Product.findOne({ title: 'Integration Published Jacket' }))?.status).toBe('ACTIVE');
  console.log('PASS admin moderation');
  resetRateBudget();

  const buy = await login('buyer', buyer.email);
  await expect(buy.getByRole('button', { name: 'Kênh bán', exact: true })).toHaveCount(0);
  await buy.goto(`${base}/?view=seller`);
  await expect(buy).toHaveURL(/view=homepage/);
  await expect(buy.getByRole('heading', { name: 'Kênh người bán', exact: true })).toHaveCount(0);
  console.log('PASS role-specific landing, navigation, refresh and protected UI');
  await buy.goto(`${base}/?view=catalog`);
  await expect(buy.locator('.product-card')).toHaveCount(3);
  const card = buy.locator('.product-card').filter({ hasText: 'Integration Jacket 1' });
  await card.getByRole('button', { name: '♡ Yêu thích', exact: true }).click();
  await expect(card.getByRole('button', { name: '♥ Đã yêu thích', exact: true })).toBeVisible();
  await buy.reload();
  await expect(buy.locator('.product-card').filter({ hasText: 'Integration Jacket 1' }).getByRole('button', { name: '♥ Đã yêu thích', exact: true })).toBeVisible();
  await buy.getByRole('button', { name: 'Integration Jacket 1', exact: true }).click();
  await buy.getByRole('button', { name: 'Xem Shop', exact: true }).click();
  await expect(buy.getByRole('heading', { name: 'Integration Shop', exact: true })).toBeVisible();
  await buy.goto(`${base}/?view=catalog`);
  await buy.getByRole('button', { name: 'Integration Jacket 1', exact: true }).click();
  await buy.getByRole('button', { name: 'Mặc Cả', exact: true }).click();
  await buy.getByPlaceholder('Nhập tin nhắn...').fill('Real API buyer message');
  await buy.getByPlaceholder('Nhập tin nhắn...').press('Enter');
  await expect(buy.getByText('Real API buyer message', { exact: true }).last()).toBeVisible();
  await sell.getByRole('button', { name: 'Chat', exact: true }).click();
  await sell.getByRole('button', { name: /Buyer Integration/ }).click();
  await expect(sell.getByText('Real API buyer message', { exact: true }).last()).toBeVisible();
  await sell.getByPlaceholder('Nhập tin nhắn...').fill('Real API seller response');
  await sell.getByPlaceholder('Nhập tin nhắn...').press('Enter');
  await expect(buy.getByText('Real API seller response', { exact: true }).last()).toBeVisible();
  await expect.poll(async () => Message.countDocuments()).toBe(2);
  console.log('PASS persisted wishlist, public shop, REST history and realtime messages');
  resetRateBudget();

  await buy.goto(`${base}/?view=catalog`);
  for (const title of ['Integration Jacket 1', 'Integration Jacket 2']) {
    await buy.locator('.product-card').filter({ hasText: title }).locator('.product-quick-add').click();
  }
  await buy.getByRole('button', { name: 'Giỏ hàng', exact: true }).click();
  for (const [label, value] of [['Người nhận', 'Buyer Integration'], ['Số điện thoại', '0901234567'], ['Số nhà, tên đường', '123 Test Street'], ['Phường/Xã', 'Test Ward'], ['Quận/Huyện', 'Test District'], ['Tỉnh/Thành phố', 'Ho Chi Minh']]) {
    await buy.getByLabel(label, { exact: true }).fill(value);
  }
  await buy.getByRole('button', { name: 'Đặt hàng (2 sản phẩm)', exact: true }).click();
  await expect.poll(async () => Order.countDocuments({ buyerId: buyer._id })).toBe(2);
  await expect(buy.locator('article')).toHaveCount(2);
  const pendingDetails = buy.locator('article').first();
  await expect(pendingDetails.getByRole('heading', { name: 'Địa chỉ nhận hàng', exact: true })).toBeVisible();
  await expect(pendingDetails.getByText('Buyer Integration · 0901234567', { exact: true })).toBeVisible();
  await expect(pendingDetails.getByText('123 Test Street, Test Ward, Test District, Ho Chi Minh', { exact: true })).toBeVisible();
  await expect(pendingDetails.getByText('Hạn giữ chỗ / thanh toán:', { exact: false })).toBeVisible();
  await expect(buy.getByText('Tổng thanh toán: 100.000', { exact: false })).toBeVisible();
  await buy.getByRole('button', { name: 'Thanh toán', exact: true }).first().click();
  await expect(buy.getByText('Yêu cầu thanh toán:', { exact: false })).toBeVisible();
  expect(await Payment.countDocuments({ status: 'PENDING' })).toBe(1);
  expect(await Order.countDocuments({ orderStatus: 'PENDING_PAYMENT' })).toBe(2);
  await buy.reload();
  await expect(buy.locator('article')).toHaveCount(2);
  expect(await Product.countDocuments({ _id: { $in: products.map(item => item._id) }, status: 'RESERVED' })).toBe(2);
  const createdOrders = await Order.find({ buyerId: buyer._id });
  expect(createdOrders.reduce((sum, item) => sum + item.buyerTotal, 0)).toBe(250000);
  expect(createdOrders.reduce((sum, item) => sum + item.commissionAmount, 0)).toBe(25000);
  console.log('PASS multi-seller checkout, order mapping, server totals, payment attempt and reload');
  resetRateBudget();

  await buy.getByRole('button', { name: 'Địa chỉ', exact: true }).click();
  for (const [label, value] of [['Nhãn địa chỉ', 'Home'], ['Người nhận', 'Buyer Integration'], ['Số điện thoại', '0901234567'], ['Số nhà, tên đường', '123 Test Street'], ['Phường/Xã', 'Test Ward'], ['Quận/Huyện', 'Test District'], ['Tỉnh/Thành phố', 'Ho Chi Minh']]) {
    await buy.getByLabel(label, { exact: true }).fill(value);
  }
  await buy.getByRole('button', { name: 'Thêm địa chỉ', exact: true }).click();
  await expect(buy.getByText('123 Test Street, Test Ward, Test District, Ho Chi Minh', { exact: true })).toBeVisible();
  await buy.getByRole('button', { name: 'Thông báo', exact: true }).click();
  await expect(buy.getByRole('heading', { name: 'Tùy chọn thông báo' })).toBeVisible();
  const messagesPreference = buy.getByLabel('Tin nhắn', { exact: true });
  await messagesPreference.uncheck();
  await expect(messagesPreference).toBeEnabled();
  await buy.reload();
  await expect(buy.getByLabel('Tin nhắn', { exact: true })).not.toBeChecked();
  console.log('PASS address persistence and notification preferences');
  resetRateBudget();

  const refreshRequests = [];
  buy.on('request', request => { if (request.url().endsWith('/auth/refresh-token')) refreshRequests.push(request); });
  const refreshed = await buy.evaluate(async () => {
    const { default: api, setAccessToken } = await import('/src/services/apiClient.js');
    setAccessToken('expired-access-token');
    return Promise.all(['/auth/me', '/cart', '/wishlist'].map(async url => (await api.get(url)).status));
  });
  expect(refreshed).toEqual([200, 200, 200]);
  expect(refreshRequests.length).toBe(1);
  console.log('PASS concurrent 401 requests share a single refresh-token rotation');

  // Advance providers through their real, signed webhooks, never by a frontend
  // mark-paid or mark-delivered call.
  const postWebhook = async (route, payload, signature) => {
    const response = await fetch(`http://127.0.0.1:5017/api/v1${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-sifit-signature': signature }, body: JSON.stringify(payload) });
    expect(response.status, await response.text()).toBe(200);
  };
  const payment = await Payment.findOne();
  const paymentPayload = { eventId: `integration_${payment.id}`, eventType: 'payment.succeeded',
    providerPaymentId: payment.providerPaymentId, merchantReference: payment.merchantReference,
    amount: payment.amount, currency: 'VND', status: 'SUCCEEDED' };
  const PaymentProvider = requireBackend('./src/services/paymentProviders/simulator.provider');
  await postWebhook('/webhooks/payments/simulator', paymentPayload, new PaymentProvider().createSignature(paymentPayload));
  const sellerOrder = await Order.findOne({ sellerId: seller._id, buyerId: buyer._id });
  const Dispute = requireBackend('./src/models/dispute.model');
  await buy.getByRole('button', { name: 'Giỏ hàng', exact: true }).click();
  await buy.getByRole('button', { name: 'Đơn mua', exact: true }).click();
  await buy.getByRole('button', { name: 'Làm mới đơn mua', exact: true }).click();
  const beforeDeliveryCard = buy.locator('article').filter({ hasText: `Đơn #${sellerOrder.id.slice(-8)}` });
  await beforeDeliveryCard.getByRole('button', { name: 'Mở khiếu nại', exact: true }).click();
  await expect(beforeDeliveryCard.getByLabel('Lý do khiếu nại', { exact: true }).locator('option')).toHaveCount(1);
  await beforeDeliveryCard.getByPlaceholder('Mô tả khiếu nại').fill('Not received before delivery');
  await beforeDeliveryCard.getByRole('button', { name: 'Gửi khiếu nại', exact: true }).click();
  await expect.poll(async () => Dispute.countDocuments({ reason: 'ITEM_NOT_RECEIVED', status: 'OPEN' })).toBe(1);
  await expect(beforeDeliveryCard.getByRole('button', { name: 'Mở khiếu nại', exact: true })).toHaveCount(0);
  expect((await Order.findById(sellerOrder.id)).paymentStatus).toBe('PAID');
  // Close this first case through the actual admin endpoint before continuing
  // the post-delivery case below.
  const earlyCase = await Dispute.findOne({ reason: 'ITEM_NOT_RECEIVED' });
  await adminPage.evaluate(async id => {
    const service = await import('/src/services/adminService.js');
    await service.resolveDispute(id, 'CLOSED', 'Seller confirmed the package is being prepared');
  }, earlyCase.id);
  console.log('PASS non-delivery complaint before shipment, duplicate guard and unchanged payment');
  resetRateBudget();
  const Address = requireBackend('./src/models/address.model');
  const pickup = await Address.create({ userId: seller._id, label: 'Pickup', recipientName: 'Seller Integration', phone: '0901234567', addressLine: '456 Pickup Street', ward: 'Ward', district: 'District', province: 'Ho Chi Minh', addressType: 'BOTH' });
  await sell.getByRole('button', { name: 'Kênh bán', exact: true }).click();
  await sell.getByRole('button', { name: 'Đơn bán', exact: true }).click();
  const sellerCard = sell.locator('article').filter({ hasText: `Đơn #${sellerOrder.id.slice(-8)}` });
  await sellerCard.getByRole('button', { name: 'Tạo vận đơn', exact: true }).click();
  await sellerCard.getByLabel('Địa chỉ lấy hàng', { exact: true }).selectOption(pickup.id);
  for (const [label, value] of [['Khối lượng (gram)', '500'], ['Dài (cm)', '25'], ['Rộng (cm)', '20'], ['Cao (cm)', '10']]) await sellerCard.getByLabel(label, { exact: true }).fill(value);
  await sellerCard.getByRole('button', { name: 'Báo giá giao hàng', exact: true }).click();
  await expect(sellerCard.getByText('Phí:', { exact: false })).toBeVisible();
  await sellerCard.getByRole('button', { name: 'Tạo vận đơn', exact: true }).last().click();
  const Shipment = requireBackend('./src/models/shipment.model');
  await expect.poll(async () => Shipment.countDocuments({ orderId: sellerOrder._id })).toBe(1);
  const shipment = await Shipment.findOne({ orderId: sellerOrder._id });
  const shippingPayload = { eventId: 'integration-delivery', eventType: 'shipment.delivered', providerShipmentId: shipment.providerShipmentId,
    trackingNumber: shipment.trackingNumber, status: 'DELIVERED', occurredAt: new Date().toISOString() };
  const ShippingProvider = requireBackend('./src/services/shippingProviders/simulator.provider');
  await postWebhook('/webhooks/shipping/simulator', shippingPayload, new ShippingProvider().sign(shippingPayload));
  await buy.getByRole('button', { name: 'Giỏ hàng', exact: true }).click();
  await buy.getByRole('button', { name: 'Đơn mua', exact: true }).click();
  await buy.getByRole('button', { name: 'Làm mới đơn mua', exact: true }).click();
  const buyerCard = buy.locator('article').filter({ hasText: `Đơn #${sellerOrder.id.slice(-8)}` });
  await buyerCard.getByRole('button', { name: 'Xem vận đơn', exact: true }).click();
  await expect(buyerCard.getByText(`Vận đơn: ${shipment.trackingNumber}`, { exact: true })).toBeVisible();
  await expect(buyerCard.getByText('Hạn bảo vệ người mua:', { exact: false })).toBeVisible();
  await buyerCard.getByRole('button', { name: 'Xác nhận đã nhận hàng', exact: true }).click();
  await expect.poll(async () => Boolean((await Order.findById(sellerOrder._id)).buyerConfirmedAt)).toBe(true);
  console.log('PASS signed payment, seller shipping quote/creation, tracking and verified receipt confirmation');
  resetRateBudget();

  await buyerCard.getByRole('button', { name: 'Mở khiếu nại', exact: true }).click();
  await buyerCard.getByPlaceholder('Mô tả khiếu nại').fill('Integration dispute description');
  await buyerCard.getByRole('button', { name: 'Gửi khiếu nại', exact: true }).click();
  await expect.poll(async () => Dispute.countDocuments({ status: 'OPEN' })).toBe(1);
  await adminPage.getByRole('button', { name: 'Khiếu nại', exact: true }).click();
  const disputePanel = adminPage.locator('section').filter({ hasText: 'Integration dispute description' });
  await disputePanel.getByPlaceholder('Lý do / ghi chú xử lý').fill('Integration resolution');
  await disputePanel.getByRole('button', { name: 'Tiếp nhận xem xét', exact: true }).click();
  await expect.poll(async () => (await Dispute.findOne({ description: 'Integration dispute description' })).status).toBe('UNDER_REVIEW');
  await disputePanel.getByRole('button', { name: 'Chấp nhận bên bán', exact: true }).click();
  await expect.poll(async () => (await Dispute.findOne({ description: 'Integration dispute description' })).status).toBe('RESOLVED_SELLER');
  const delivery = requireBackend('./src/services/delivery.service');
  await delivery.completeEligibleOrders({ now: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) });
  await buy.getByRole('button', { name: 'Làm mới đơn mua', exact: true }).click();
  await buyerCard.getByRole('button', { name: 'Đánh giá', exact: true }).click();
  await buyerCard.getByPlaceholder('Nhận xét').fill('Integration verified review');
  await buyerCard.locator('input[type=file]').setInputFiles({ name: 'review.png', mimeType: 'image/png', buffer: png });
  failNextReviewImage = true;
  await buyerCard.getByRole('button', { name: 'Gửi đánh giá', exact: true }).click();
  const ProductReview = requireBackend('./src/models/productReview.model');
  await expect.poll(async () => ProductReview.countDocuments()).toBe(1);
  await expect(buyerCard.getByRole('alert')).toBeVisible();
  await expect(buyerCard.getByPlaceholder('Nhận xét')).toHaveValue('Integration verified review');
  await buyerCard.getByRole('button', { name: 'Lưu đánh giá', exact: true }).click();
  await expect.poll(async () => (await ProductReview.findOne()).images.length).toBe(1);
  await buyerCard.getByRole('button', { name: 'Sửa đánh giá', exact: true }).click();
  await buyerCard.getByLabel('Số sao', { exact: true }).fill('4');
  await buyerCard.getByPlaceholder('Nhận xét').fill('Edited review persisted');
  await buyerCard.getByRole('button', { name: 'Lưu đánh giá', exact: true }).click();
  await expect.poll(async () => (await ProductReview.findOne()).rating).toBe(4);
  await expect(buyerCard.getByText('Edited review persisted', { exact: true })).toBeVisible();
  await buyerCard.getByRole('button', { name: 'Xóa ảnh đánh giá', exact: true }).click();
  await expect.poll(async () => (await ProductReview.findOne()).images.length).toBe(0);
  await buyerCard.getByRole('button', { name: 'Đánh giá shop', exact: true }).click();
  await buyerCard.getByLabel('Số sao cho shop', { exact: true }).fill('4');
  await buyerCard.getByLabel('Nhận xét về shop', { exact: true }).fill('Good seller communication');
  await buyerCard.getByRole('button', { name: 'Gửi đánh giá shop', exact: true }).click();
  const SellerRating = requireBackend('./src/models/sellerRating.model');
  await expect.poll(async () => SellerRating.countDocuments({ orderId: sellerOrder._id })).toBe(1);
  await buy.reload();
  const persistedCard = buy.locator('article').filter({ hasText: `Đơn #${sellerOrder.id.slice(-8)}` });
  await expect(persistedCard.getByText('Edited review persisted', { exact: true })).toBeVisible();
  await expect(persistedCard.getByText('Bạn đã đánh giá shop: 4/5', { exact: true })).toBeVisible();
  await expect(persistedCard.getByRole('button', { name: 'Đánh giá', exact: true })).toHaveCount(0);
  await persistedCard.getByRole('button', { name: 'Xóa đánh giá', exact: true }).click();
  await persistedCard.getByRole('button', { name: 'Xác nhận xóa đánh giá', exact: true }).click();
  await expect.poll(async () => (await ProductReview.findOne()).status).toBe('REMOVED');
  await expect(persistedCard.getByText('Bạn đã xóa đánh giá này.', { exact: false })).toBeVisible();
  expect(await ProductReview.countDocuments()).toBe(1);
  console.log('PASS post-delivery dispute, address/deadlines, review images/edit/delete and persisted shop rating');
  resetRateBudget();
  // A fresh unpaid checkout tests expiry without touching the already-delivered order.
  const newCheckout = await buy.evaluate(async () => {
    const products = await import('/src/services/productService.js');
    const cart = await import('/src/services/cartService.js');
    const orders = await import('/src/services/orderService.js');
    const active = (await products.listProducts()).items[0];
    await cart.addItem(active._id);
    return orders.createOrder({ shippingAddress: { recipientName: 'Expiry Buyer', phone: '0901234567', addressLine: 'Expiry Street', ward: 'Ward', district: 'District', city: 'Ho Chi Minh' }, idempotencyKey: crypto.randomUUID() });
  });
  await Order.updateMany({ checkoutGroupId: newCheckout.id }, { reservationExpiresAt: new Date(Date.now() - 1000) });
  await buy.reload();
  const expiredCard = buy.locator('article').filter({ hasText: 'Expiry Street' });
  await expect(expiredCard.getByText('Đã hết hạn thanh toán.', { exact: false })).toBeVisible();
  await expect(expiredCard.getByRole('button', { name: 'Thanh toán', exact: true })).toBeDisabled();
  console.log('PASS expired reservation shows deadline and disables payment');
  for (const role of ['buyer', 'seller']) {
    resetRateBudget();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/?view=auth`);
    await page.locator('.auth-header-switch').click();
    await page.getByRole('button', { name: 'Đăng ký bằng email', exact: true }).click();
    await page.getByLabel('Họ và tên', { exact: true }).fill(`New ${role}`);
    await page.getByLabel('Email', { exact: true }).fill(`new-${role}@integration.test`);
    await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await page.getByLabel('Tôi muốn', { exact: true }).selectOption(role);
    await page.locator('.auth-submit').click();
    await expect(page).toHaveURL(new RegExp(`view=${role === 'seller' ? 'seller' : 'homepage'}`));
    await expect.poll(async () => (await User.findOne({ email: `new-${role}@integration.test` }))?.role).toBe(role.toUpperCase());
    if (role === 'seller') await expect(page.getByRole('heading', { name: 'Kênh người bán', exact: true })).toBeVisible();
    else await expect(page.getByRole('navigation', { name: 'Tài khoản người mua', exact: true })).toBeVisible();
    await context.close();
  }
  console.log('PASS buyer and seller registration persists selected roles and opens the correct interface');
  await fs.mkdir('artifacts/integration', { recursive: true });
  for (const [name, page] of Object.entries(pages)) await page.screenshot({ path: `artifacts/integration/${name}.png`, fullPage: true });
  expect(errors).toEqual([]);
  console.log('PASS no browser runtime errors');
} catch (error) {
  console.error('INTEGRATION FAILURE', error);
  if (browser) {
    await fs.mkdir('artifacts/integration', { recursive: true });
    for (const context of browser.contexts()) for (const [index, page] of context.pages().entries()) {
      await page.screenshot({ path: `artifacts/integration/failure-${browser.contexts().indexOf(context)}-${index}.png`, fullPage: true }).catch(() => {});
    }
  }
  process.exitCode = 1;
} finally {
  await browser?.close();
  await vite?.close();
  if (server) {
    await requireBackend('./src/socket').closeSocket();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  await mongoose.disconnect();
  await mongo.stop();
}
