# Data Integration Guide: Settings → Contracts → Invoices

## Overview

This guide shows how to integrate data from Account Settings and Service Configuration to automatically populate Contract and Invoice forms, ensuring data consistency across modules.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Settings Module                          │
├─────────────────────────────────────────────────────────────┤
│ Account (users table)        │ Service Config (landlord_     │
│ ✓ name, email, phone         │ settings table)              │
│ ✓ citizen_id, address        │ ✓ electricity_price         │
│ ✓ full_name, phoneNumber     │ ✓ water_price               │
│                              │ ✓ wifi_price                │
│                              │ ✓ garbage_price             │
│                              │ ✓ parking_price             │
└────────────────┬─────────────────────────────────────────┬──┘
                 │                                          │
                 │ API: GET /landlord/me (with settings)   │
                 │ API: GET /landlord/settings             │
                 ↓                                          ↓
        ┌─────────────────────────────────────┐
        │    Contract Creation Module         │
        ├─────────────────────────────────────┤
        │ Pre-fill (from Settings):           │
        │ • Landlord info (name, ID, phone)  │
        │ • Default electricity_price        │
        │ • Default water_price              │
        │ • Default service fees             │
        │                                     │
        │ User selects:                       │
        │ • Tenant & Room                     │
        │ • Contract dates                    │
        └─────────────────┬───────────────────┘
                          │
                          │ API: POST /contracts
                          │ (sends all pricing)
                          ↓
        ┌─────────────────────────────────────┐
        │  Invoice Generation Module          │
        ├─────────────────────────────────────┤
        │ Auto-fetch (from Contract):         │
        │ • electricity_price from contract   │
        │ • water_price from contract         │
        │ • rental_price                      │
        │ • Apply meter readings              │
        │ • Calculate totals                  │
        │                                     │
        │ Pre-fill service fees from:         │
        │ • Contract service amounts, OR      │
        │ • Landlord settings                 │
        └─────────────────┬───────────────────┘
                          │
                          │ API: POST /invoices
                          │ (with all calculated amounts)
                          ↓
        ┌─────────────────────────────────────┐
        │  Invoice Record (Database)          │
        ├─────────────────────────────────────┤
        │ • room_id, contract_id              │
        │ • rent_amount, electricity_amount   │
        │ • water_amount, service_amount      │
        │ • total_amount, due_date            │
        └─────────────────────────────────────┘
```

---

## 1. Data Models Mapping

### Account Data (from users table + landlord_settings)

```javascript
// Account data structure returned by API
{
  // From users table
  id: number,
  name: string,
  full_name: string,
  email: string,
  phone_number: string,
  citizen_id: string,
  permanent_address: string,
  
  // From landlord_settings table
  settings: {
    electricity_price: number,      // VNĐ/kWh - Default for new contracts
    water_price: number,            // VNĐ/m³ - Default for new contracts
    wifi_price: number,             // VNĐ/phòng
    garbage_price: number,          // VNĐ/phòng
    parking_price: number,          // VNĐ/xe
    property_name: string,
    address: string,
    total_floors: number,
    total_rooms: number,
    deposit_months: number,
    notice_days: number
  }
}
```

### Contract Data

```javascript
{
  id: number,
  tenant_id: number,
  room_id: number,
  start_date: string,              // ISO: "2024-01-15"
  end_date: string,                // ISO: "2025-01-14"
  deposit: number,
  rental_price: number,
  electricity_price: number,       // VNĐ/kWh - from settings or custom
  water_price: number,             // VNĐ/m³ - from settings or custom
  status: string,                  // "active" | "expired" | "terminated"
  
  // Tenant details (from JOIN)
  tenant: {
    id: number,
    fullName: string,
    email: string,
    phoneNumber: string,
    citizenID: string,
    permanentAddress: string
  },
  
  // Room details (from JOIN)
  room: {
    id: number,
    name: string,
    price: number,
    area: number,
    status: string
  }
}
```

### Invoice Data

```javascript
{
  id: number,
  room_id: number,
  contract_id: number,
  reading_id: number,
  month: number,
  year: number,
  
  // Amount breakdown
  rent_amount: number,             // From contract.rental_price
  electricity_amount: number,      // usage * contract.electricity_price
  water_amount: number,            // usage * contract.water_price
  service_amount: number,          // wifi + garbage + parking (if applicable)
  total_amount: number,            // SUM of above
  
  paid_amount: number,
  payment_status: string,          // "Paid" | "Unpaid" | "Partial"
  due_date: string,                // ISO: "2024-02-15"
  
  // Related data
  room: {
    name: string,
    rentPrice: number
  },
  contract: {
    start_date: string,
    end_date: string,
    electricity_price: number,
    water_price: number
  },
  meterReading: {
    electricity_index: number,
    water_index: number,
    prev_electricity_index: number,
    prev_water_index: number
  }
}
```

---

## 2. API Endpoint Design

### 2.1 Enhanced Landlord Profile Endpoint

**Current:** `GET /api/auth/me` - Only returns user basic info

**Enhanced:** `GET /api/landlord/profile` (NEW)

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "name": "Nguyễn Văn A",
      "full_name": "Nguyễn Văn A",
      "email": "landlord@example.com",
      "phone_number": "0912345678",
      "citizen_id": "123456789",
      "permanent_address": "123 Đường ABC, Q.1, TP.HCM",
      "role": "landlord"
    },
    "settings": {
      "electricity_price": 3500,
      "water_price": 20000,
      "wifi_price": 100000,
      "garbage_price": 30000,
      "parking_price": 120000,
      "property_name": "Khu trọ Nguyễn Huệ",
      "address": "123 Đường ABC, Q.1, TP.HCM",
      "total_floors": 3,
      "total_rooms": 20,
      "deposit_months": 2,
      "notice_days": 30
    }
  }
}
```

### 2.2 Contract Detail with Pricing

**Current:** `GET /api/contracts/:id` - Returns basic contract info

**Enhanced Response:**
```json
{
  "status": "success",
  "data": {
    "id": 5,
    "contractID": 5,
    "tenantID": 8,
    "roomID": 3,
    "startDate": "2024-01-15",
    "endDate": "2025-01-14",
    "deposit": 2000000,
    "rentalPrice": 2000000,
    "electricityPrice": 3500,
    "waterPrice": 20000,
    "status": "active",
    "createdAt": "2024-01-10",
    
    "tenant": {
      "id": 8,
      "fullName": "Trần Thị B",
      "email": "tenant@example.com",
      "phoneNumber": "0987654321",
      "citizenID": "987654321",
      "permanentAddress": "456 Đường XYZ"
    },
    "room": {
      "id": 3,
      "name": "A1",
      "price": 2000000,
      "area": 20,
      "status": "occupied"
    }
  }
}
```

### 2.3 Get Contract for Invoice Creation (NEW)

**Endpoint:** `GET /api/contracts/room/:roomId`

**Purpose:** Fetch current contract for a room to pre-fill invoice pricing

**Response:**
```json
{
  "status": "success",
  "data": {
    "contractID": 5,
    "tenantID": 8,
    "roomID": 3,
    "rentalPrice": 2000000,
    "electricityPrice": 3500,
    "waterPrice": 20000,
    "startDate": "2024-01-15",
    "endDate": "2025-01-14",
    "status": "active"
  }
}
```

---

## 3. Frontend State Management Pattern

### 3.1 Create Context for Landlord Data

**File: `frontend/src/context/LandlordContext.jsx`**

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';

const LandlordContext = createContext();

export function LandlordProvider({ children }) {
  const { user, token } = useAuth();
  const [landlordData, setLandlordData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch landlord profile + settings
  useEffect(() => {
    if (!user || user.role !== 'landlord' || !token) {
      setLoading(false);
      return;
    }

    const fetchLandlordData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/landlord/profile');
        
        if (res.data?.data) {
          setLandlordData(res.data.data.user);
          setSettings(res.data.data.settings);
        }
      } catch (err) {
        console.error('Failed to fetch landlord data:', err);
        setError(err.response?.data?.message || 'Failed to load landlord data');
      } finally {
        setLoading(false);
      }
    };

    fetchLandlordData();
  }, [user, token]);

  // Refresh settings after update
  const refreshSettings = async () => {
    try {
      const res = await api.get('/landlord/settings');
      if (res.data?.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh settings:', err);
    }
  };

  const value = {
    landlordData,
    settings,
    loading,
    error,
    refreshSettings,
  };

  return (
    <LandlordContext.Provider value={value}>
      {children}
    </LandlordContext.Provider>
  );
}

export function useLandlordData() {
  const context = useContext(LandlordContext);
  if (!context) {
    throw new Error('useLandlordData must be used within LandlordProvider');
  }
  return context;
}
```

### 3.2 Wrap App with Context

**File: `frontend/src/main.jsx` (or `App.jsx`)**

```javascript
import { LandlordProvider } from './context/LandlordContext';

function App() {
  return (
    <AuthProvider>
      <LandlordProvider>
        <SearchProvider>
          {/* Your routes */}
        </SearchProvider>
      </LandlordProvider>
    </AuthProvider>
  );
}
```

---

## 4. Contract Form Auto-Fill Implementation

### 4.1 Updated Contract Form Component

**File: `frontend/src/pages/Contract.jsx`**

```javascript
import { useEffect, useState, useMemo } from 'react';
import { useLandlordData } from '../context/LandlordContext';
import api from '../api';

function ContractForm() {
  const { landlordData, settings, loading } = useLandlordData();
  
  const [form, setForm] = useState({
    landlord_name: '',
    landlord_id: '',
    landlord_phone: '',
    landlord_address: '',
    room_id: '',
    tenant_id: '',
    rental_price: '',
    deposit: '',
    electricity_price: '',
    water_price: '',
    start_date: '',
    end_date: '',
    payment_day: 1,
  });

  const [rooms, setRooms] = useState([]);
  const [tenants, setTenants] = useState([]);

  // ✅ Step 1: Auto-fill landlord info from Settings
  useEffect(() => {
    if (landlordData && settings) {
      setForm((prev) => ({
        ...prev,
        landlord_name: landlordData.name || landlordData.full_name,
        landlord_id: landlordData.citizen_id,
        landlord_phone: landlordData.phone_number,
        landlord_address: landlordData.permanent_address,
        // Default pricing from settings
        electricity_price: settings.electricity_price || 0,
        water_price: settings.water_price || 0,
        deposit: settings.deposit_months || 2, // in months
      }));
    }
  }, [landlordData, settings]);

  // ✅ Step 2: Auto-fill rental price when room is selected
  const handleRoomChange = (e) => {
    const roomId = e.target.value;
    setForm((prev) => ({ ...prev, room_id: roomId }));

    const selectedRoom = rooms.find((r) => String(r.id) === roomId);
    if (selectedRoom) {
      setForm((prev) => ({
        ...prev,
        rental_price: selectedRoom.price,
      }));
    }
  };

  // Fetch available rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get('/rooms');
        setRooms(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      }
    };
    fetchRooms();
  }, []);

  // Fetch tenants
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await api.get('/landlord/all');
        setTenants(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      }
    };
    fetchTenants();
  }, []);

  // ✅ Step 3: Submit with all pricing data
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const contractData = {
        roomID: Number(form.room_id),
        tenantID: Number(form.tenant_id),
        startDate: form.start_date,
        endDate: form.end_date,
        deposit: Number(form.deposit) * (rooms.find(r => r.id == form.room_id)?.price || 0),
        rentalPrice: Number(form.rental_price),
        electricity_price: Number(form.electricity_price),  // ✅ NEW
        water_price: Number(form.water_price),              // ✅ NEW
      };

      await api.post('/contracts', contractData);
      alert('Hợp đồng được tạo thành công!');
      // Reset form or redirect
    } catch (err) {
      console.error('Failed to create contract:', err);
      alert('Lỗi: ' + (err.response?.data?.error || 'Không thể tạo hợp đồng'));
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <form onSubmit={handleSubmit}>
      {/* Landlord Info Section - Auto-filled from Settings */}
      <fieldset>
        <legend>Thông tin Chủ trọ</legend>
        <input
          type="text"
          value={form.landlord_name}
          disabled
          placeholder="Họ và tên (tự động)"
        />
        <input
          type="text"
          value={form.landlord_id}
          disabled
          placeholder="ID thẻ (tự động)"
        />
        <input
          type="tel"
          value={form.landlord_phone}
          disabled
          placeholder="Điện thoại (tự động)"
        />
        <input
          type="text"
          value={form.landlord_address}
          disabled
          placeholder="Địa chỉ (tự động)"
        />
      </fieldset>

      {/* Room & Tenant Selection */}
      <fieldset>
        <legend>Chọn Phòng & Khách Thuê</legend>
        <select
          value={form.room_id}
          onChange={handleRoomChange}
          required
        >
          <option value="">-- Chọn phòng --</option>
          {rooms.filter(r => r.status === 'available').map((room) => (
            <option key={room.id} value={room.id}>
              {room.name} - {room.price?.toLocaleString()} VNĐ
            </option>
          ))}
        </select>

        <select
          value={form.tenant_id}
          onChange={(e) => setForm({ ...form, tenant_id: e.target.value })}
          required
        >
          <option value="">-- Chọn khách thuê --</option>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.fullName} ({tenant.email})
            </option>
          ))}
        </select>
      </fieldset>

      {/* Pricing Section - Pre-filled from Settings */}
      <fieldset>
        <legend>Giá Dịch Vụ & Tiền Thuê</legend>
        <input
          type="number"
          value={form.rental_price}
          disabled
          placeholder="Tiền thuê (tự động từ phòng)"
        />
        <input
          type="number"
          label="Giá Điện (VNĐ/kWh)"
          value={form.electricity_price}
          onChange={(e) =>
            setForm({ ...form, electricity_price: e.target.value })
          }
          placeholder="VD: 3500"
        />
        <input
          type="number"
          label="Giá Nước (VNĐ/m³)"
          value={form.water_price}
          onChange={(e) => setForm({ ...form, water_price: e.target.value })}
          placeholder="VD: 20000"
        />
      </fieldset>

      {/* Contract Period */}
      <fieldset>
        <legend>Kỳ Hợp Đồng</legend>
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          required
        />
        <input
          type="date"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          required
        />
      </fieldset>

      <button type="submit">Tạo Hợp Đồng</button>
    </form>
  );
}

export default ContractForm;
```

---

## 5. Invoice Form Auto-Fill Implementation

### 5.1 Enhanced Invoice Creation Form

**File: `frontend/src/pages/Invoices.jsx` - Updated CreateForm**

```javascript
import { useEffect, useState } from 'react';
import { useLandlordData } from '../context/LandlordContext';
import api from '../api';

function CreateForm({ contracts, onSuccess }) {
  const { settings } = useLandlordData();

  const [form, setForm] = useState({
    room_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    prev_elec: '',
    curr_elec: '',
    prev_water: '',
    curr_water: '',
    wifi_fee: '',
    trash_fee: '',
    parking_fee: '',
  });

  // ✅ Auto-fill contract pricing when room changes
  const [contractPricing, setContractPricing] = useState(null);
  const [lastMeterReading, setLastMeterReading] = useState(null);

  const handleRoomChange = async (e) => {
    const roomId = e.target.value;
    setForm((prev) => ({ ...prev, room_id: roomId }));

    try {
      // ✅ Fetch contract pricing for this room
      const contractRes = await api.get(`/contracts/room/${roomId}`);
      if (contractRes.data?.data) {
        setContractPricing(contractRes.data.data);
      }

      // ✅ Fetch last meter reading
      const readingRes = await api.get(`/meter-readings/room/${roomId}/latest`);
      if (readingRes.data?.data) {
        const reading = readingRes.data.data;
        setLastMeterReading(reading);
        setForm((prev) => ({
          ...prev,
          prev_elec: reading.electricity_index,
          prev_water: reading.water_index,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch contract/meter data:', err);
    }
  };

  // ✅ Auto-fill service fees from settings
  useEffect(() => {
    if (settings) {
      setForm((prev) => ({
        ...prev,
        wifi_fee: settings.wifi_price || 0,
        trash_fee: settings.garbage_price || 0,
        parking_fee: settings.parking_price || 0,
      }));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Step 1: Calculate invoice
      const calcRes = await api.post('/landlord/invoices/calculate', {
        roomID: Number(form.room_id),
        month: Number(form.month),
        year: Number(form.year),
        roomPrice: contractPricing?.rentalPrice || 0,
        prevElectricityIndex: Number(form.prev_elec),
        currentElectricityIndex: Number(form.curr_elec),
        prevWaterIndex: Number(form.prev_water),
        currentWaterIndex: Number(form.curr_water),
        serviceFees: {
          wifiFee: Number(form.wifi_fee),
          trashFee: Number(form.trash_fee),
          parkingFee: Number(form.parking_fee),
        },
        serviceUnitPrices: {
          // ✅ Use pricing from contract
          electricityUnitPrice: contractPricing?.electricityPrice || settings?.electricity_price || 0,
          waterUnitPrice: contractPricing?.waterPrice || settings?.water_price || 0,
        },
      });

      // Step 2: Save meter reading
      const readingRes = await api.post('/meter-readings', {
        roomID: Number(form.room_id),
        electricityIndex: Number(form.curr_elec),
        waterIndex: Number(form.curr_water),
        recordedDate: new Date().toISOString().slice(0, 10),
      });

      // Step 3: Create invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 10);

      await api.post('/invoices', {
        roomID: Number(form.room_id),
        contractID: contractPricing?.contractID,
        readingID: readingRes.data?.data?.id,
        month: Number(form.month),
        year: Number(form.year),
        rentAmount: calcRes.data.breakdown.roomPrice,
        electricityAmount: calcRes.data.breakdown.electricityAmount,
        waterAmount: calcRes.data.breakdown.waterAmount,
        serviceAmount: calcRes.data.breakdown.serviceAmount,
        totalAmount: calcRes.data.totalAmount,
        dueDate: dueDate.toISOString().slice(0, 10),
      });

      alert('Hóa đơn được tạo thành công!');
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert('Lỗi: ' + (err.response?.data?.message || 'Không thể tạo hóa đơn'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Room & Period Selection */}
      <select value={form.room_id} onChange={handleRoomChange} required>
        <option value="">-- Chọn phòng --</option>
        {contracts.map((contract) => (
          <option key={contract.roomID} value={contract.roomID}>
            {contract.roomName}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={form.month}
        onChange={(e) => setForm({ ...form, month: e.target.value })}
        min="1"
        max="12"
        required
      />
      <input
        type="number"
        value={form.year}
        onChange={(e) => setForm({ ...form, year: e.target.value })}
        required
      />

      {/* Meter Readings - Previous auto-filled */}
      <input
        type="number"
        value={form.prev_elec}
        disabled
        placeholder="Chỉ số điện trước (tự động)"
      />
      <input
        type="number"
        value={form.curr_elec}
        onChange={(e) => setForm({ ...form, curr_elec: e.target.value })}
        placeholder="Chỉ số điện hiện tại"
        required
      />

      <input
        type="number"
        value={form.prev_water}
        disabled
        placeholder="Chỉ số nước trước (tự động)"
      />
      <input
        type="number"
        value={form.curr_water}
        onChange={(e) => setForm({ ...form, curr_water: e.target.value })}
        placeholder="Chỉ số nước hiện tại"
        required
      />

      {/* Service Fees - Auto-filled from Settings */}
      <input
        type="number"
        value={form.wifi_fee}
        disabled
        placeholder="Phí WiFi (tự động từ cài đặt)"
      />
      <input
        type="number"
        value={form.trash_fee}
        disabled
        placeholder="Phí rác (tự động từ cài đặt)"
      />
      <input
        type="number"
        value={form.parking_fee}
        disabled
        placeholder="Phí giữ xe (tự động từ cài đặt)"
      />

      <button type="submit">Tạo Hóa Đơn</button>
    </form>
  );
}

export default CreateForm;
```

---

## 6. Backend Endpoint Updates

### 6.1 Add Missing Contract Endpoint

**File: `backend/routes/contracts.js` - Add:**

```javascript
// GET /api/contracts/room/:roomId — Fetch current contract for a room
router.get('/room/:roomId', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const { roomId } = req.params;

    const contract = await db.getAsync(
      `SELECT
        lc.id as contractID,
        lc.tenant_id as tenantID,
        lc.room_id as roomID,
        lc.rental_price as rentalPrice,
        lc.electricity_price as electricityPrice,
        lc.water_price as waterPrice,
        lc.start_date as startDate,
        lc.end_date as endDate,
        lc.status
       FROM lease_contracts lc
       JOIN rooms r ON lc.room_id = r.id
       WHERE r.id = ? AND r.landlord_id = ? AND lc.status = 'active'
       ORDER BY lc.created_at DESC
       LIMIT 1`,
      [roomId, req.user.id]
    );

    if (!contract) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy hợp đồng kích hoạt cho phòng này',
      });
    }

    res.json({
      status: 'success',
      data: contract,
    });
  } catch (err) {
    console.error('Get contract by room error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy hợp đồng',
    });
  }
});
```

### 6.2 Create Landlord Profile Endpoint

**File: `backend/routes/landlord.js` - Add:**

```javascript
// GET /api/landlord/profile — Fetch landlord user data + settings
router.get('/profile', authenticateToken, requireRole('landlord'), async (req, res) => {
  try {
    const user = await db.getAsync(
      `SELECT id, name, full_name, email, phone_number, citizen_id, permanent_address, role
       FROM users WHERE id = ? AND role = 'landlord'`,
      [req.user.id]
    );

    const settings = await db.getAsync(
      `SELECT * FROM landlord_settings WHERE landlord_id = ?`,
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: {
        user,
        settings: settings || {
          electricity_price: 0,
          water_price: 0,
          wifi_price: 0,
          garbage_price: 0,
          parking_price: 0,
        },
      },
    });
  } catch (err) {
    console.error('Get landlord profile error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thông tin chủ trọ',
    });
  }
});
```

### 6.3 Add Latest Meter Reading Endpoint

**File: `backend/routes/meter-readings.js` - Add:**

```javascript
// GET /api/meter-readings/room/:roomId/latest — Get latest meter reading for a room
router.get('/room/:roomId/latest', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const reading = await db.getAsync(
      `SELECT
        id,
        room_id as roomID,
        electricity_index as electricityIndex,
        water_index as waterIndex,
        recorded_date as recordedDate,
        created_at as createdAt
       FROM meter_readings
       WHERE room_id = ?
       ORDER BY recorded_date DESC, created_at DESC
       LIMIT 1`,
      [roomId]
    );

    res.json({
      status: 'success',
      data: reading || {
        electricityIndex: 0,
        waterIndex: 0,
      },
    });
  } catch (err) {
    console.error('Get latest meter reading error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy chỉ số',
    });
  }
});
```

---

## 7. Data Flow Summary

### Contract Creation Flow

```
1. User opens Contract form
   ↓
2. LandlordContext fetches: user data + settings
   ↓
3. Form auto-fills: landlord name, ID, phone, address
   ↓
4. Form auto-fills: default electricity_price, water_price from settings
   ↓
5. User selects Room → rental_price auto-fills from room data
   ↓
6. User selects Tenant (from pending or available list)
   ↓
7. User enters: start_date, end_date, can override prices
   ↓
8. Submit: POST /contracts with ALL pricing data
   ↓
9. Contract created in DB with pricing locked in
```

### Invoice Creation Flow

```
1. User opens Invoice form
   ↓
2. User selects Room
   ↓
3. Frontend calls: GET /contracts/room/:roomId
   → Returns electricityPrice, waterPrice, rentalPrice from contract
   ↓
4. Frontend calls: GET /meter-readings/room/:roomId/latest
   → Returns previous electricity_index, water_index
   ↓
5. Form auto-fills: prev_elec, prev_water, electricity price, water price
   ↓
6. Settings auto-fills: wifi_fee, trash_fee, parking_fee
   ↓
7. User enters: current meter readings
   ↓
8. Submit: Calculate → Save reading → Create invoice
   ↓
9. Invoice uses contract's locked pricing for calculation
```

---

## 8. Testing Checklist

- [ ] Landlord profile endpoint returns user + settings
- [ ] Contract form pre-fills landlord info from settings
- [ ] Contract form pre-fills default pricing from settings
- [ ] Room selection auto-fills rental price
- [ ] Contract creation sends electricity_price and water_price
- [ ] Get contract by room ID returns pricing data
- [ ] Invoice form auto-fills previous meter readings
- [ ] Invoice form auto-fills service fees from settings
- [ ] Invoice calculation uses contract's pricing
- [ ] Multiple contracts don't conflict (latest one used)

---

## 9. Future Enhancements

1. **Bulk Invoice Generation** - Auto-create invoices for all rooms monthly
2. **Price History** - Track pricing changes over time
3. **Smart Defaults** - Remember user's preferred pricing patterns
4. **Template Contracts** - Save contract templates with common pricing
5. **Real-time Sync** - Update invoice calculations as settings change
6. **Audit Trail** - Log all pricing changes for compliance
