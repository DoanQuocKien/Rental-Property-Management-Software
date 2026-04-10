import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout({ children, title }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar />
        <main className="dashboard-body">
          <header className="page-header">
            <div className="welcome-text">
              <h2>{title}</h2>
              <p>Hệ thống quản lý thời gian thực</p>
            </div>
          </header>
          {children} {/* Nội dung riêng của từng trang sẽ chui vào đây */}
        </main>
      </div>
    </div>
  );
}