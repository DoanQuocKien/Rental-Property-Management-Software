import { useState, useEffect, useCallback } from 'react';
import api from '../api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtMoney = (n) => Number(n || 0).toLocaleString('vi-VN') + 'đ';
const curMonth = new Date().getMonth() + 1;
const curYear  = new Date().getFullYear();

// ── Mini Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: '18px 22px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${color}`,
    }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a202c', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: '#718096', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Reading Row Input ─────────────────────────────────────────────────────────
function ReadingRow({ room, prev, month, year, onSaved }) {
  const [elec, setElec] = useState('');
  const [water, setWater] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [err, setErr] = useState('');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({
    elecPrice: '3500',
    waterPrice: '15000',
    wifiFee: '0',
    trashFee: '0',
    dueDate: (() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().slice(0, 10); })(),
  });
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceCreated, setInvoiceCreated] = useState(false);

  const elecUsage  = elec && prev ? Math.max(0, Number(elec) - (prev.electricityIndex || 0)) : null;
  const waterUsage = water && prev ? Math.max(0, Number(water) - (prev.waterIndex || 0)) : null;

  const handleSave = async () => {
    if (!elec || !water) { setErr('Vui lòng nhập đủ cả 2 chỉ số'); return; }
    if (Number(elec) < (prev?.electricityIndex || 0)) { setErr('Chỉ số điện không được nhỏ hơn kỳ trước'); return; }
    if (Number(water) < (prev?.waterIndex || 0)) { setErr('Chỉ số nước không được nhỏ hơn kỳ trước'); return; }
    setSaving(true); setErr('');
    try {
      // Lưu meter reading thật vào DB
      const mrRes = await api.post('/meter-readings', {
        roomID: room.roomID || room.id,
        electricityIndex: Number(elec),
        waterIndex: Number(water),
        recordedDate: new Date().toISOString().slice(0, 10),
      });
      setSaved(true);
      setSavedData(mrRes.data?.data);
      setShowInvoiceForm(true);
      if (onSaved) onSaved();
    } catch (e) {
      setErr(e.response?.data?.message || 'Lưu thất bại');
    } finally { setSaving(false); }
  };

  const handleCreateInvoice = async () => {
    if (!savedData) return;
    setCreatingInvoice(true);
    setErr('');
    try {
      // Tính toán hóa đơn
      const calcRes = await api.post('/landlord/invoices/calculate', {
        roomID: room.roomID || room.id,
        month, year,
        roomPrice: room.price,
        prevElectricityIndex: savedData.prevElectricityIndex || prev?.electricityIndex || 0,
        currentElectricityIndex: Number(elec),
        prevWaterIndex: savedData.prevWaterIndex || prev?.waterIndex || 0,
        currentWaterIndex: Number(water),
        serviceUnitPrices: {
          electricityUnitPrice: Number(invoiceSettings.elecPrice),
          waterUnitPrice: Number(invoiceSettings.waterPrice),
        },
        serviceFees: {
          wifiFee: Number(invoiceSettings.wifiFee),
          trashFee: Number(invoiceSettings.trashFee),
        },
      });

      const bd = calcRes.data.data.breakdown;
      const total = calcRes.data.data.totalAmount;

      // Lấy contractID của phòng
      const contractsRes = await api.get(`/contracts?status=active`).catch(() => ({ data: { data: [] } }));
      const contracts = contractsRes.data.data || [];
      const matchedContract = contracts.find(c => String(c.roomID) === String(room.roomID || room.id));

      // Tạo hóa đơn
      await api.post('/invoices', {
        roomID: room.roomID || room.id,
        contractID: matchedContract?.contractID || null,
        readingID: savedData.id || null,
        month,
        year,
        rentAmount: bd.roomPrice,
        electricityAmount: bd.electricityAmount,
        waterAmount: bd.waterAmount,
        serviceAmount: bd.serviceAmount,
        totalAmount: total,
        dueDate: invoiceSettings.dueDate,
      });

      setInvoiceCreated(true);
      setShowInvoiceForm(false);
    } catch (e) {
      setErr(e.response?.data?.message || 'Tạo hóa đơn thất bại');
    } finally { setCreatingInvoice(false); }
  };

  const inp = (val) => ({
    width: '100%', padding: '8px 10px',
    border: `1.5px solid ${val ? '#667eea' : '#e2e8f0'}`,
    borderRadius: 8, fontSize: '0.88rem', outline: 'none',
    background: val ? 'white' : '#f7fafc', color: '#2d3748',
    transition: 'all 0.2s', textAlign: 'center',
  });

  return (
    <>
      <tr style={{
        background: invoiceCreated ? '#f0fff4' : saved ? '#f0f8ff' : 'white',
        transition: 'background 0.4s',
      }}>
        {/* Phòng */}
        <td style={{ padding: '12px 16px' }}>
          <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '0.92rem' }}>
            🏠 {room.name}
          </div>
          {room.tenantName && (
            <div style={{ fontSize: '0.76rem', color: '#a0aec0', marginTop: 2 }}>{room.tenantName}</div>
          )}
        </td>

        {/* Chỉ số kỳ trước */}
        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: '#4a5568' }}>
            ⚡ {prev?.electricityIndex ?? '—'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#4a5568', marginTop: 2 }}>
            💧 {prev?.waterIndex ?? '—'}
          </div>
        </td>

        {/* Input điện */}
        <td style={{ padding: '12px 16px', minWidth: 120 }}>
          {saved ? (
            <div style={{ textAlign: 'center', fontWeight: 700, color: '#667eea', fontFamily: 'monospace' }}>{elec}</div>
          ) : (
            <>
              <input
                type="number" min={prev?.electricityIndex || 0}
                value={elec} onChange={e => { setElec(e.target.value); setErr(''); }}
                placeholder={`> ${prev?.electricityIndex ?? 0}`}
                style={inp(elec)}
              />
              {elecUsage !== null && (
                <div style={{ fontSize: '0.72rem', color: '#667eea', marginTop: 3, textAlign: 'center' }}>
                  Dùng: {elecUsage} kWh
                </div>
              )}
            </>
          )}
        </td>

        {/* Input nước */}
        <td style={{ padding: '12px 16px', minWidth: 120 }}>
          {saved ? (
            <div style={{ textAlign: 'center', fontWeight: 700, color: '#38b2ac', fontFamily: 'monospace' }}>{water}</div>
          ) : (
            <>
              <input
                type="number" min={prev?.waterIndex || 0}
                value={water} onChange={e => { setWater(e.target.value); setErr(''); }}
                placeholder={`> ${prev?.waterIndex ?? 0}`}
                style={inp(water)}
              />
              {waterUsage !== null && (
                <div style={{ fontSize: '0.72rem', color: '#38b2ac', marginTop: 3, textAlign: 'center' }}>
                  Dùng: {waterUsage} m³
                </div>
              )}
            </>
          )}
        </td>

        {/* Action */}
        <td style={{ padding: '12px 16px', textAlign: 'center', minWidth: 160 }}>
          {err && (
            <div style={{ fontSize: '0.72rem', color: '#e53e3e', marginBottom: 4 }}>{err}</div>
          )}
          {invoiceCreated ? (
            <span style={{
              background: '#e6fffa', color: '#38b2ac',
              padding: '6px 14px', borderRadius: 20,
              fontSize: '0.8rem', fontWeight: 700, display: 'block',
            }}>✅ Đã tạo HĐ</span>
          ) : saved ? (
            <button
              onClick={() => setShowInvoiceForm(v => !v)}
              style={{
                background: 'linear-gradient(135deg, #38b2ac, #2c7a7b)',
                color: 'white', border: 'none', borderRadius: 8,
                padding: '7px 12px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.78rem',
              }}
            >
              {showInvoiceForm ? '▲ Ẩn' : '📄 Tạo hóa đơn'}
            </button>
          ) : (
            <button
              onClick={handleSave} disabled={saving || !elec || !water}
              style={{
                background: (!elec || !water) ? '#e2e8f0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: (!elec || !water) ? '#a0aec0' : 'white',
                border: 'none', borderRadius: 8,
                padding: '7px 16px', cursor: (!elec || !water) ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? '...' : '💾 Lưu chỉ số'}
            </button>
          )}
        </td>
      </tr>

      {/* Row mở rộng: tạo hóa đơn */}
      {showInvoiceForm && !invoiceCreated && (
        <tr>
          <td colSpan={5} style={{ padding: '0 16px 16px', background: '#f8faff' }}>
            <div style={{
              border: '1.5px solid #c3dafe', borderRadius: 12, padding: 16,
              background: 'white', marginTop: 4,
            }}>
              <div style={{ fontWeight: 700, color: '#667eea', marginBottom: 12, fontSize: '0.88rem' }}>
                📄 Tạo hóa đơn tháng {month}/{year} — Phòng {room.name}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', marginBottom: 4, fontWeight: 600 }}>Giá điện (đ/kWh)</div>
                  <input type="number" value={invoiceSettings.elecPrice}
                    onChange={e => setInvoiceSettings(s => ({ ...s, elecPrice: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', marginBottom: 4, fontWeight: 600 }}>Giá nước (đ/m³)</div>
                  <input type="number" value={invoiceSettings.waterPrice}
                    onChange={e => setInvoiceSettings(s => ({ ...s, waterPrice: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', marginBottom: 4, fontWeight: 600 }}>Phí Wifi (đ)</div>
                  <input type="number" value={invoiceSettings.wifiFee}
                    onChange={e => setInvoiceSettings(s => ({ ...s, wifiFee: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', marginBottom: 4, fontWeight: 600 }}>Phí rác (đ)</div>
                  <input type="number" value={invoiceSettings.trashFee}
                    onChange={e => setInvoiceSettings(s => ({ ...s, trashFee: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#718096', marginBottom: 4, fontWeight: 600 }}>Hạn thanh toán</div>
                  <input type="date" value={invoiceSettings.dueDate}
                    onChange={e => setInvoiceSettings(s => ({ ...s, dueDate: e.target.value }))}
                    style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: '0.85rem', outline: 'none' }}
                  />
                </div>
              </div>
              {/* Preview nhanh */}
              {elecUsage !== null && waterUsage !== null && (
                <div style={{
                  background: '#f0f4ff', borderRadius: 8, padding: '8px 12px',
                  fontSize: '0.8rem', color: '#4a5568', marginBottom: 12,
                  display: 'flex', gap: 16, flexWrap: 'wrap',
                }}>
                  <span>🏠 Phòng: <strong>{fmtMoney(room.price)}</strong></span>
                  <span>⚡ {elecUsage} kWh × {fmtMoney(invoiceSettings.elecPrice)} = <strong>{fmtMoney(elecUsage * Number(invoiceSettings.elecPrice))}</strong></span>
                  <span>💧 {waterUsage} m³ × {fmtMoney(invoiceSettings.waterPrice)} = <strong>{fmtMoney(waterUsage * Number(invoiceSettings.waterPrice))}</strong></span>
                  <span style={{ fontWeight: 700, color: '#667eea' }}>
                    Tổng ≈ {fmtMoney(
                      Number(room.price) +
                      elecUsage * Number(invoiceSettings.elecPrice) +
                      waterUsage * Number(invoiceSettings.waterPrice) +
                      Number(invoiceSettings.wifiFee) +
                      Number(invoiceSettings.trashFee)
                    )}
                  </span>
                </div>
              )}
              {err && (
                <div style={{ color: '#e53e3e', fontSize: '0.82rem', marginBottom: 8 }}>⚠️ {err}</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setShowInvoiceForm(false)}
                  style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: 'white', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', color: '#718096' }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={creatingInvoice}
                  style={{
                    padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: creatingInvoice ? '#a0aec0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                    color: 'white', fontWeight: 700, fontSize: '0.85rem',
                  }}
                >
                  {creatingInvoice ? 'Đang tạo...' : '✅ Xác nhận tạo hóa đơn'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManagerMeterReading() {
  const [rooms, setRooms]       = useState([]);
  const [prevMap, setPrevMap]   = useState({});
  const [loading, setLoading]   = useState(true);
  const [month, setMonth]       = useState(curMonth);
  const [year, setYear]         = useState(curYear);
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(''), 3000);
  };

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/rooms?status=occupied');
      const list = res.data.rooms || [];
      setRooms(list);

      // Fetch previous readings for each room in parallel
      const entries = await Promise.allSettled(
        list.map(r =>
          api.get(`/landlord/rooms/${r.roomID || r.id}/previous-reading?month=${month}&year=${year}`)
            .then(r2 => ({ id: r.roomID || r.id, data: r2.data.data?.previousReading || null }))
        )
      );
      const map = {};
      entries.forEach(e => { if (e.status === 'fulfilled') map[e.value.id] = e.value.data; });
      setPrevMap(map);
    } catch {
      showToast('Lỗi tải dữ liệu phòng', false);
    } finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchRooms(); }, [fetchRooms, refreshKey]);

  const handleSaved = () => {
    showToast('✅ Đã lưu chỉ số điện nước thành công!');
  };

  const filtered = rooms.filter(r => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.tenantName].some(v => v?.toLowerCase().includes(q));
  });

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years  = [curYear - 1, curYear, curYear + 1];

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: toast.ok ? '#e6fffa' : '#fff5f5',
          border: `1px solid ${toast.ok ? '#81e6d9' : '#feb2b2'}`,
          color: toast.ok ? '#276749' : '#742a2a',
          padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: '0.9rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.6rem', color: '#2d3748', marginBottom: 4 }}>
          ⚡ Ghi chỉ số điện nước
        </h2>
        <p style={{ color: '#718096' }}>
          Nhập chỉ số công tơ điện và đồng hồ nước — sau đó tạo hóa đơn ngay tại đây
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon="🏠" label="Phòng đang thuê" value={rooms.length} color="#667eea" />
        <StatCard icon="📅" label="Kỳ ghi hiện tại" value={`T${month}/${year}`} color="#38b2ac" />
        <StatCard icon="✅" label="Đã có chỉ số kỳ trước" value={Object.values(prevMap).filter(Boolean).length} color="#d69e2e" />
      </div>

      {/* Controls */}
      <div style={{
        background: 'white', borderRadius: 14, padding: '16px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        marginBottom: 20,
      }}>
        <span style={{ fontWeight: 700, color: '#4a5568', fontSize: '0.88rem' }}>📅 Kỳ ghi:</span>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}>
          {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.88rem', outline: 'none' }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0' }}>🔍</span>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm phòng, khách thuê..."
            style={{
              width: '100%', padding: '8px 10px 8px 32px',
              border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.88rem', outline: 'none',
            }}
          />
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)}
          style={{ padding: '8px 16px', background: '#f0f4ff', color: '#667eea', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          🔄 Tải lại
        </button>
      </div>

      {/* Info banner */}
      <div style={{
        background: '#fffbeb', border: '1px solid #f6e05e',
        borderRadius: 10, padding: '10px 16px', marginBottom: 20,
        fontSize: '0.83rem', color: '#744210', display: 'flex', gap: 8, alignItems: 'center',
      }}>
        💡 <strong>Hướng dẫn:</strong> Nhập chỉ số → Nhấn <strong>Lưu chỉ số</strong> → Nhấn <strong>Tạo hóa đơn</strong> để hoàn tất quy trình ghi điện nước hàng tháng.
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⏳</div>
            <p>Đang tải danh sách phòng...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#a0aec0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏠</div>
            <p style={{ fontWeight: 600 }}>Không có phòng nào đang thuê</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  {['Phòng / Khách thuê', 'Chỉ số kỳ trước', 'Điện kỳ này (kWh) ⚡', 'Nước kỳ này (m³) 💧', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.3px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((room) => (
                  <ReadingRow
                    key={room.roomID || room.id}
                    room={room}
                    prev={prevMap[room.roomID || room.id]}
                    month={month}
                    year={year}
                    onSaved={handleSaved}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f2f5', color: '#a0aec0', fontSize: '0.8rem' }}>
            Hiển thị {filtered.length} / {rooms.length} phòng đang có khách thuê
          </div>
        )}
      </div>
    </div>
  );
}
