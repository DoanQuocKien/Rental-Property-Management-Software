// assets/js/auth.js

document.addEventListener("DOMContentLoaded", function() {
    const loginForm = document.getElementById('loginForm');

    // Đảm bảo form tồn tại (tránh lỗi khi script chạy ở trang khác)
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Chặn tải lại trang

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            const emailError = document.getElementById('emailError');
            const passwordError = document.getElementById('passwordError');

            let isValid = true;

            // Reset lỗi
            emailError.style.display = 'none';
            passwordError.style.display = 'none';

            // Kiểm tra Email
            const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailPattern.test(email)) {
                emailError.style.display = 'block';
                isValid = false;
            }

            // Kiểm tra Mật khẩu
            if (password === "") {
                passwordError.style.display = 'block';
                isValid = false;
            }

            // Nếu hợp lệ thì mô phỏng gọi API
            if (isValid) {
                const btn = document.getElementById('loginBtn');
                btn.innerText = "Đang xử lý...";
                btn.style.backgroundColor = "var(--text-muted)"; // Màu xám
                btn.disabled = true;

                // Giả lập chờ 1.5 giây
                setTimeout(() => {
                    alert("Đăng nhập thành công! Chuyển hướng sang trang Quản lý phòng...");

                    // Chuyển hướng sang trang index (Layout chính)
                    window.location.href = "index.html";

                }, 1500);
            }
        });
    }
});
