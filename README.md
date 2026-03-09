# Dự án Quản lý nhà trọ (Boarding House Management System)

## 1. Tổng quan dự án (Project Overview)
[cite_start]Dự án tập trung vào việc xây dựng một ứng dụng quản lý nhà trọ hiện đại, giải quyết các vấn đề về quản lý thông tin khách thuê, hợp đồng và tính toán hóa đơn tự động[cite: 111, 118, 123]. [cite_start]Dự án đóng vai trò như một Startup App với mục tiêu cung cấp giá trị nhanh chóng thông qua phiên bản MVP (Minimum Viable Product)[cite: 15].

## 2. Quy trình phát triển (Software Development Process)
* [cite_start]**Mô hình:** Agile / Scrum[cite: 11].
* **Lý do lựa chọn:**
    * [cite_start]Thích ứng nhanh với sự bất định của người dùng (High Uncertainty)[cite: 13].
    * [cite_start]Tập trung vào các User Stories quan trọng nhất để tạo ra giá trị ngay lập tức[cite: 15].
    * [cite_start]Cho phép lấy phản hồi liên tục để trình diễn và lấy ý kiến điều chỉnh[cite: 16].

## 3. Quy trình CI/CD (DevOps Pipeline)
Hệ thống được thiết lập quy trình tự động hóa từ khâu viết code đến khi triển khai:
1.  [cite_start]**Source Control:** Code được push lên Git repository (GitHub/GitLab)[cite: 98].
2.  [cite_start]**Build:** Sử dụng Server CI/CD (GitHub Actions/Jenkins) để compile dự án và tạo container image[cite: 100, 101].
3.  [cite_start]**Test:** Chạy Automated Tests (Unit Test, Integration Test)[cite: 83, 84, 103]. [cite_start]Nếu fail thì tạm ngưng, nếu pass thì tiếp tục Deploy[cite: 104, 105].
4.  [cite_start]**Deploy:** Tự động triển khai lên Cloud/Server (Docker, K8s) sau khi test thành công[cite: 107, 108].

## 4. Kế hoạch Sprint (Sprint Schedule)
* [cite_start]**Độ dài mỗi Sprint:** 2 tuần[cite: 53].
* [cite_start]**Vận tốc nhóm (Velocity):** Tầm 15 Story Points[cite: 54].

### [cite_start]Sprint 1 Backlog (Tổng: 14 Story Points) [cite: 66]
| ID | Chức năng | User Story tóm tắt | Story Point |
| :--- | :--- | :--- | :--- |
| US1 | Đăng ký | [cite_start]Là người thuê, tôi muốn đăng ký tài khoản[cite: 39, 57]. | [cite_start]3 [cite: 60] |
| US2 | Đăng nhập | [cite_start]Là người thuê, tôi muốn đăng nhập[cite: 40, 61]. | [cite_start]3 [cite: 62] |
| US3 | Quản lý phòng | [cite_start]Là chủ trọ, tôi muốn quản lý thông tin phòng[cite: 41, 63]. | [cite_start]5 [cite: 64] |
| US4 | Xem phòng trống | [cite_start]Là chủ trọ, tôi muốn xem danh sách phòng trống[cite: 42, 65]. | [cite_start]3 [cite: 65] |

## 5. Các tính năng cốt lõi (Core Features)
Hệ thống được chia thành các Epic lớn để quản lý:
* [cite_start]**Epic 1 - Quản lý phòng:** Thiết lập dãy trọ và bảng giá dịch vụ (điện, nước, wifi)[cite: 112, 114, 115].
* [cite_start]**Epic 2 - Quản lý hợp đồng:** Tạo hợp đồng thuê, lưu trữ CCCD và tự động cảnh báo sắp hết hạn[cite: 117, 118, 121].
* [cite_start]**Epic 3 - Thu chi & Báo cáo:** Tự động tính hóa đơn dựa trên chỉ số điện nước mới và xem biểu đồ doanh thu[cite: 122, 123, 126].
* [cite_start]**Epic 4 - Quản lý sự cố:** Người thuê gửi phiếu báo hỏng (bóng đèn, ống nước) và chủ trọ cập nhật trạng thái sửa chữa[cite: 127, 128, 130].

## 6. Chất lượng phần mềm (Quality Assurance)
[cite_start]Dự án áp dụng các kịch bản kiểm thử (Test Cases) để đảm bảo tính chính xác[cite: 131]:
* [cite_start]Kiểm tra tính logic hóa đơn (cảnh báo lỗi khi chỉ số mới nhỏ hơn chỉ số cũ)[cite: 133].
* [cite_start]Kiểm tra tính pháp lý hợp đồng (tải ảnh CCCD, lỗi khi ngày kết thúc nhỏ hơn ngày bắt đầu)[cite: 138, 139].

---
[cite_start]*Dự án được thực hiện với sự hỗ trợ của AI để tự động hóa việc sinh Test case và phân tích yêu cầu chuyên sâu, giúp nâng cao chất lượng đồ án[cite: 143, 146].*
