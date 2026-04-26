import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#4f46e5', '#7c3aed', '#059669', '#d97706', '#dc2626'];

// Utility functions
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtCurrency = (n) => {
  const amount = Number(n || 0);
  return amount.toLocaleString('vi-VN', { minimumFractionDigits: 0 });
};

// Injected CSS
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&display=swap');

  .dashboard-root {
    font-family: 'Be Vietnam Pro', sans-serif;
    color: #1a1f2e;
    background: #f4f6fb;
    padding: 28px;
    min-height: 100vh;
  }

  .dashboard-header {
    margin-bottom: 32px;
  }

  .dashboard-header h1 {
    font-size: 2rem;
    font-weight: 800;
    margin: 0 0 8px;
    color: #fff;
  }

  .dashboard-header p {
    font-size: 0.9rem;
    color: #fff;
    margin: 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: white;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e8eaf2;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .stat-content h3 {
    font-size: 0.8rem;
    color: #64748b;
    margin: 0 0 6px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-value {
    font-size: 1.6rem;
    font-weight: 800;
    color: #1a1f2e;
    margin: 0;
  }

  .stat-change {
    font-size: 0.75rem;
    margin-top: 4px;
    font-weight: 600;
  }

  .stat-change.positive {
    color: #059669;
  }

  .stat-change.negative {
    color: #dc2626;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 20px;
    margin-bottom: 28px;
  }

  .chart-card {
    background: white;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e8eaf2;
  }

  .chart-card h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1f2e;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bad-debt-card {
    background: white;
    border-radius: 14px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border: 1px solid #e8eaf2;
  }

  .bad-debt-card h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1f2e;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .debt-table {
    width: 100%;
    border-collapse: collapse;
  }

  .debt-table th {
    padding: 12px 14px;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: #f8f9ff;
    border-bottom: 2px solid #e8eaf2;
  }

  .debt-table td {
    padding: 13px 14px;
    font-size: 0.87rem;
    border-bottom: 1px solid #e8eaf2;
  }

  .debt-table tr:hover {
    background: #f8f9ff;
  }

  .tenant-name {
    font-weight: 600;
    color: #1a1f2e;
  }

  .overdue-amount {
    font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
    color: #dc2626;
  }

  .days-late {
    font-weight: 600;
    color: #d97706;
  }

  .empty-message {
    padding: 40px 20px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .loading-message {
    padding: 40px 20px;
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2.5px solid rgba(79,70,229,0.3);
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
  }

  .status-critical {
    background: #fff5f5;
    color: #742a2a;
  }

  .status-warning {
    background: #fffbeb;
    color: #78350f;
  }

  @media (max-width: 768px) {
    .charts-grid {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-header h1 {
      font-size: 1.5rem;
    }
  }
`;

// Statistics Cards Component
function StatsCards({ stats }) {
  const statItems = [
    {
      label: 'Doanh thu tháng này',
      value: fmt(stats.monthlyRevenue),
      icon: '💰',
      bg: '#fef9c3',
      color: '#ca8a04',
      change: `+${fmt(stats.monthlyRevenue - stats.lastMonthRevenue)}đ so với tháng trước`,
      positive: stats.monthlyRevenue >= stats.lastMonthRevenue,
    },
    {
      label: 'Tổng doanh thu năm',
      value: fmt(stats.yearlyRevenue),
      icon: '📊',
      bg: '#ecfdf5',
      color: '#059669',
    },
    {
      label: 'Phòng cho thuê',
      value: `${stats.occupiedRooms}/${stats.totalRooms}`,
      icon: '🏠',
      bg: '#dbeafe',
      color: '#0369a1',
      change: `Tỷ lệ chiếm: ${((stats.occupiedRooms / (stats.totalRooms || 1)) * 100).toFixed(1)}%`,
    },
    {
      label: 'Nợ xấu chưa thu',
      value: fmt(stats.badDebt),
      icon: '⚠️',
      bg: '#fecaca',
      color: '#dc2626',
      change: `Từ ${stats.badDebtCount} khách hàng`,
    },
  ];

  return (
    <div className="stats-grid">
      {statItems.map((stat, idx) => (
        <div key={idx} className="stat-card">
          <div className="stat-icon" style={{ background: stat.bg, color: stat.color }}>
            {stat.icon}
          </div>
          <div className="stat-content">
            <h3>{stat.label}</h3>
            <p className="stat-value">{stat.value}</p>
            {stat.change && (
              <p className={`stat-change ${stat.positive !== false ? 'positive' : 'negative'}`}>
                {stat.change}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Revenue Chart Component
function RevenueChart({ data }) {
  return (
    <div className="chart-card">
      <h3>📈 Doanh thu theo tháng</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf2" />
          <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '0.8rem' }} />
          <YAxis stroke="#64748b" style={{ fontSize: '0.8rem' }} />
          <Tooltip
            contentStyle={{
              background: 'white',
              border: '1px solid #e8eaf2',
              borderRadius: '8px',
              padding: '10px',
            }}
            formatter={(value) => `${fmt(value)}đ`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#4f46e5"
            strokeWidth={3}
            dot={{ fill: '#4f46e5', r: 5 }}
            activeDot={{ r: 7 }}
            name="Doanh thu (đ)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Occupancy Chart Component
function OccupancyChart({ occupiedRooms, vacantRooms }) {
  const data = [
    { name: 'Cho thuê', value: occupiedRooms, color: '#059669' },
    { name: 'Trống', value: vacantRooms, color: '#e5e7eb' },
  ];

  const total = occupiedRooms + vacantRooms;
  const occupancyRate = total > 0 ? ((occupiedRooms / total) * 100).toFixed(1) : 0;

  return (
    <div className="chart-card">
      <h3>🏢 Tỷ lệ chiếm dụng phòng</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <ResponsiveContainer width="40%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} phòng`} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
              Tỷ lệ chiếm dụng
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#059669' }}>
              {occupancyRate}%
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: item.color,
                  }}
                />
                <span>{item.name}: {item.value} phòng</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bad Debt Table Component
function BadDebtTable({ debts, loading }) {
  if (loading) {
    return (
      <div className="bad-debt-card">
        <h3>⚠️ Danh sách nợ xấu</h3>
        <div className="loading-message">
          <span className="spinner"></span>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className="bad-debt-card">
      <h3>⚠️ Danh sách nợ xấu ({debts.length})</h3>
      {debts.length === 0 ? (
        <div className="empty-message">✅ Không có nợ xấu. Tuyệt vời!</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="debt-table">
            <thead>
              <tr>
                <th>Tên khách hàng</th>
                <th>Phòng</th>
                <th>Số tiền nợ</th>
                <th>Quá hạn (ngày)</th>
                <th>Trạng thái</th>
                <th>Ngày hóa đơn</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((debt, idx) => {
                const daysLate = Math.floor(
                  (new Date() - new Date(debt.due_date)) / (1000 * 60 * 60 * 24)
                );
                const status = daysLate > 30 ? 'critical' : 'warning';

                return (
                  <tr key={idx}>
                    <td className="tenant-name">{debt.tenant_name}</td>
                    <td>{debt.room_name || `Phòng ${debt.room_id}`}</td>
                    <td className="overdue-amount">{fmt(debt.total_amount)}đ</td>
                    <td className="days-late">{daysLate} ngày</td>
                    <td>
                      <span className={`status-badge status-${status}`}>
                        {status === 'critical' ? '🔴 Nguy cấp' : '🟡 Cảnh báo'}
                      </span>
                    </td>
                    <td>{fmtDate(debt.due_date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Main Financial Dashboard Component
export default function FinancialDashboard() {
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    lastMonthRevenue: 0,
    yearlyRevenue: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    badDebt: 0,
    badDebtCount: 0,
  });

  const [revenueData, setRevenueData] = useState([]);
  const [badDebts, setBadDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch invoices
      const invoicesRes = await api.get('/invoices');
      const invoices = invoicesRes.data.data || [];

      // Fetch rooms
      const roomsRes = await api.get('/rooms');
      const rooms = roomsRes.data.rooms || [];

      // Calculate statistics
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const currentMonthInvoices = invoices.filter(
        (inv) => inv.month === currentMonth && inv.year === currentYear && inv.status === 'paid'
      );
      const lastMonthStart = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const lastMonthInvoices = invoices.filter(
        (inv) => inv.month === lastMonthStart && inv.year === lastMonthYear && inv.status === 'paid'
      );

      const monthlyRevenue = currentMonthInvoices.reduce(
        (sum, inv) => sum + (Number(inv.total_amount) || 0),
        0
      );
      const lastMonthRevenue = lastMonthInvoices.reduce(
        (sum, inv) => sum + (Number(inv.total_amount) || 0),
        0
      );

      // Yearly revenue
      const yearlyInvoices = invoices.filter(
        (inv) => inv.year === currentYear && inv.status === 'paid'
      );
      const yearlyRevenue = yearlyInvoices.reduce(
        (sum, inv) => sum + (Number(inv.total_amount) || 0),
        0
      );

      // Occupancy
      const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
      const totalRooms = rooms.length;

      // Bad debts - unpaid and overdue
      const unpaidInvoices = invoices.filter((inv) => inv.status === 'unpaid');
      const badDebtInvoices = unpaidInvoices.filter((inv) => new Date(inv.due_date) < new Date());
      const badDebt = badDebtInvoices.reduce(
        (sum, inv) => sum + (Number(inv.total_amount) || 0),
        0
      );

      // Revenue by month
      const monthlyRevenues = {};
      invoices
        .filter((inv) => inv.year === currentYear && inv.status === 'paid')
        .forEach((inv) => {
          const month = inv.month;
          monthlyRevenues[month] = (monthlyRevenues[month] || 0) + (Number(inv.total_amount) || 0);
        });

      const revenueChartData = Array.from({ length: 12 }, (_, i) => ({
        month: `T${i + 1}`,
        revenue: monthlyRevenues[i + 1] || 0,
      }));

      setStats({
        monthlyRevenue,
        lastMonthRevenue,
        yearlyRevenue,
        occupiedRooms,
        totalRooms,
        badDebt,
        badDebtCount: new Set(badDebtInvoices.map((inv) => inv.room_id)).size,
      });

      setRevenueData(revenueChartData);
      setBadDebts(badDebtInvoices);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const vacantRooms = stats.totalRooms - stats.occupiedRooms;

  return (
    <div className="dashboard-root">
      <style>{STYLES}</style>

      <div className="dashboard-header">
        <h1>💰 Bảng điều khiển tài chính</h1>
        <p>Tổng quan về doanh thu, tỷ lệ chiếm dụng và nợ xấu của khu trọ</p>
      </div>

      {loading ? (
        <div className="loading-message">
          <span className="spinner"></span>
          Đang tải dữ liệu...
        </div>
      ) : (
        <>
          <StatsCards stats={stats} />

          <div className="charts-grid">
            <RevenueChart data={revenueData} />
            <OccupancyChart occupiedRooms={stats.occupiedRooms} vacantRooms={vacantRooms} />
          </div>

          <BadDebtTable debts={badDebts} loading={false} />
        </>
      )}
    </div>
  );
}
