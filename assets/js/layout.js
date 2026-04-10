// xử lý effect

document.addEventListener("DOMContentLoaded", function() {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    // Hàm mở/đóng menu
    function toggleMenu() {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("show");
    }

    // Gắn sự kiện click
    menuToggle.addEventListener("click", toggleMenu);

    // Bấm ra ngoài (vào phần nền đen) để đóng menu
    overlay.addEventListener("click", toggleMenu);
});