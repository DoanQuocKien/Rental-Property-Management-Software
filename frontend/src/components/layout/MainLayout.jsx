import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout({ children, title }) {
  return (
    <div className="dashboard-layout">
      {/* 1. Thanh bên trái */}
      <Sidebar />

      <div className="dashboard-content">
        {/* 2. Thanh ngang trên cùng (Đã sửa logic hiện đúng Người thuê/Chủ trọ) */}
        <Navbar title={title} />

        <main className="dashboard-body">
          {/* ĐÃ XÓA: Phần <header className="page-header"> cũ ở đây.
            Lý do: Nó gây ra lỗi "2 thanh" và làm mất diện tích hiển thị.
          */}

          {children} {/* Nội dung của từng trang (Dashboard, Hợp đồng...) sẽ hiện ở đây */}
        </main>
      </div>
    </div>
  );
}