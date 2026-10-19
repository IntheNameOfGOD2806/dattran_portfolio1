# Trần Thành Đạt — Portfolio

Portfolio cá nhân tiếng Việt dựa trên CV được cung cấp. Tên Trần Thành Đạt, dấu nhận diện TĐ và câu chuyện từ phát triển phần mềm đến DevOps dẫn dắt trải nghiệm. Mô hình cụm máy chủ Three.js là điểm nhấn hỗ trợ cho hồ sơ, hành trình BKAV → ETC và dự án Kubernetes trên AWS.

## Cấu trúc

- `dist/index.html`: Nội dung và semantic HTML.
- `dist/styles.css`: Responsive layout và animation.
- `dist/identity.css`: Bố cục nhận diện cá nhân, hồ sơ, nội dung dự án và responsive của portfolio.
- `dist/dark.css`: Theme tối gradient xanh đêm, xám tím và điểm nhấn cam.
- `dist/app.js`: Điều hướng, project tabs, chuyển động và sao chép email.
- `dist/scene.js`: Mô hình Three.js, xoay bằng chuột/bàn phím, tách lớp và xử lý WebGL fallback.
- `dist/assets`: Font tự lưu trữ, favicon và CV gốc.
- `dist/vendor`: Three.js 0.180.0, RoundedBoxGeometry và giấy phép MIT.

Website là static HTML/JS, không cần bước build. Các thư viện, font và tài nguyên được phục vụ cùng website. Mô hình 3D và sơ đồ dự án chỉ mang tính minh họa, không kết nối tới hệ thống thật.

## Chạy trên máy

Giải nén ZIP, mở terminal trong thư mục `dat-devops-portfolio`, rồi chạy:

```bash
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist
```

Mở http://localhost:8080 trong trình duyệt. Không cần cài dependency hay build để xem trang; thư viện Three.js và font đã nằm trong `dist`. Dùng HTTP server thay vì mở `index.html` trực tiếp để các ES module hoạt động. Nhấn Ctrl+C để dừng.

Muốn chỉnh giao diện: sửa `dist/index.html`, `dist/styles.css`, `dist/identity.css`, `dist/dark.css`. Tương tác nằm trong `dist/app.js`; mô hình 3D nằm trong `dist/scene.js`.

## Tự triển khai

Phục vụ toàn bộ nội dung thư mục `dist/` bằng Nginx, Apache hoặc dịch vụ static hosting. Không cần backend, API key hay bước build. Cập nhật `og:url` trong `dist/index.html` theo tên miền mới của bạn.

Bản xuất là theme dark gradient, với câu chào “Rất vui được gặp bạn.”. Giữ nguyên các file giấy phép của Three.js và font khi phân phối lại. Không kèm `node_modules`, lịch sử Git hay cấu hình hosting riêng.

## Kiểm tra

```bash
pnpm install --frozen-lockfile
node scripts/check.mjs
```

Kiểm tra bao gồm tài nguyên nội bộ, cú pháp, CSS và các hành vi tương tác qua DOM mô phỏng. Không thay thế kiểm tra hiển thị hoặc WebGL trong trình duyệt.

## Khả năng tiếp cận và hiệu năng

- Tôn trọng `prefers-reduced-motion`, cung cấp nút tạm dừng và nhớ lựa chọn trên thiết bị.
- Hỗ trợ keyboard cho menu, tabs và mô hình 3D.
- Dừng render 3D khi ngoài viewport hoặc tab trình duyệt bị ẩn.
- Giới hạn pixel ratio; dùng bóng đổ cho các vật thể chính.
- Có minh họa SVG khi WebGL không khả dụng, giữ nội dung đọc được khi JS không tải.

Nguồn nội dung: CV Trần Thành Đạt do người dùng cung cấp. Không thêm số liệu hiệu quả, bằng cấp hoàn thành hoặc chứng chỉ không có trong CV.
