# Hoàn thiện giao diện theo API backend

## Người bán

- Thanh bên bổ sung Vận chuyển, Khiếu nại, Đánh giá và Chi trả.
- Hộp đánh giá sản phẩm: phân trang, xem ảnh/nội dung, gửi một phản hồi của shop. Đánh giá shop và tổng điểm được hiển thị riêng.
- Khiếu nại chỉ lấy những đơn bán của shop, có trạng thái, kết quả và lịch sử xử lý.
- Danh sách vận đơn có bộ lọc, địa chỉ, thời gian giao và lịch sử xác minh.
- Chi tiết chi trả hiển thị số tiền, các đơn liên quan, ngày xử lý và lý do thất bại.
- Hồ sơ shop hiển thị yêu cầu xác minh gần nhất, ngày gửi/xét duyệt và lý do từ chối.

## Người mua và chức năng chung

- Catalog tìm kiếm, lọc nhiều danh mục/thương hiệu/kích thước/tình trạng, sắp xếp và phân trang tại backend. Thương hiệu, kích thước và danh mục lấy từ dữ liệu thật.
- Trang chủ chỉ tải trang sản phẩm mới nhất, không gom toàn bộ kho sản phẩm để lọc trên trình duyệt.
- Chat đọc trạng thái chặn đã lưu, hỗ trợ chặn/bỏ chặn và khóa ô soạn khi đang chặn.
- Nút chi tiết thông báo đánh dấu đã đọc rồi mở đúng tài nguyên. URL chứa loại và mã tài nguyên nên tải lại hoặc Back vẫn giữ đúng đích.
- Trang tài nguyên hỗ trợ đơn hàng, vận đơn, khiếu nại, thanh toán, chi trả, sản phẩm, đánh giá, hội thoại và chi tiết tài khoản quản trị. Backend kiểm tra quyền từng tài nguyên.

## Quản trị

- Shop: tìm kiếm theo tên/slug, lọc hoạt động/xác minh, xem chi tiết, tạm khóa/mở lại kèm lý do.
- Danh mục: tạo, sửa, ngừng/khôi phục hiển thị; danh mục đang có sản phẩm được backend bảo vệ.
- Đánh giá: phân loại sản phẩm/shop, xem chi tiết, ẩn/khôi phục. Đánh giá tác giả đã xóa không thể được ẩn rồi khôi phục để vượt quy tắc xóa.
- Vận chuyển: lọc, xem chi tiết, xác minh giao hàng có lý do; lưu lịch sử và chặn đảo trạng thái vận đơn đã giao/hủy/hoàn hàng.
- Tài chính: giao dịch, hoa hồng, chi trả, tổng hợp; xem/duyệt đợt chi trả; yêu cầu hoàn tiền qua hai bước kiểm tra và xác nhận.
- Khiếu nại chấp nhận bên mua có bước chuyển sang giao dịch đúng nhóm thanh toán. Một giao dịch có thể chứa nhiều đơn; giao diện hiển thị giá trị đơn cần xử lý để quản trị kiểm tra số tiền.
- Hoàn tiền hỗ trợ gửi lại cùng khóa idempotency, từ chối thay đổi nội dung với khóa cũ và chống hai yêu cầu đồng thời vượt số tiền còn có thể hoàn.
- Báo cáo doanh thu/đơn/người dùng/sản phẩm/hoa hồng, chọn khoảng ngày và ngày/tuần/tháng; xuất CSV đơn, hoa hồng, người dùng tối đa 5.000 dòng.
- Nhật ký có bộ lọc và xem dữ liệu trước/sau thay đổi.

## Backend bổ sung và sửa

- `GET /admin/categories`: gồm cả danh mục ngừng hiển thị.
- `GET /products/facets`: thương hiệu và kích thước từ sản phẩm đang bán.
- `GET /seller/reviews`, `GET /seller/disputes`: các hộp quản lý có phân trang.
- `GET /seller/products/:id`, `GET /admin/products/:id`: đọc trực tiếp sản phẩm riêng theo quyền, không gom toàn bộ danh sách để tìm một mã.
- `GET /users/:id/block`: trạng thái chặn của chính tài khoản đang đăng nhập.
- `GET /account/reviews/:id`: chi tiết đánh giá sản phẩm hoặc shop, kiểm tra quyền nếu không công khai.
- `GET /admin/payments?checkoutGroupId=...`: giới hạn giao dịch khi xử lý khiếu nại.
- Các validator dùng thuộc tính query riêng của request để Express 5 nhận đúng kết quả Zod: số phân trang, ngày và mảng bộ lọc.
- Giữ nguyên rate limiter hiện có. Kiểm thử đặt lại quota giữa các nhóm trên tiến trình test, không sửa cấu hình bảo vệ API.

## Kiểm chứng

Frontend: `npm run lint`, `npm run build`, `npm run test:integration`.

Backend: `npm run lint`, `npm test -- --silent`.

Kiểm thử tích hợp chạy Express thật, MongoDB replica set tạm, Vite, Chrome và Socket.IO; không giả lập HTTP. Chỉ dịch vụ lưu ảnh Cloudinary được thay thế trong test. Các kịch bản bao gồm luồng cũ và mới, phân quyền, tải lại trang, lưu dữ liệu, phản hồi đánh giá, khóa shop, vận đơn, chi trả, hoàn tiền đồng thời, CSV và nhật ký. Không tạo đơn hoặc hoàn tiền trên database local đang dùng.

## Giới hạn của dịch vụ hiện tại

Backend hiện chỉ triển khai nhà cung cấp thanh toán/vận chuyển mô phỏng, chi trả và xác minh shop mô phỏng. Yêu cầu hoàn tiền được ghi nhận ở trạng thái nhà cung cấp trả về; backend chưa có đối soát hoàn tiền thật. Giao diện không thông báo rằng người mua đã nhận tiền khi mới gửi yêu cầu. Khiếu nại chấp nhận bên mua không tự động hoàn tiền.

Upload ảnh ngoài kiểm thử cần thông tin Cloudinary hợp lệ. Đánh giá shop hiện chưa có API để người bán trả lời; phản hồi được cung cấp cho đánh giá sản phẩm theo đúng API hiện có.
