jest.mock('../database', () => ({
  allAsync: jest.fn(),
  getAsync: jest.fn(),
  runAsync: jest.fn(),
}));

const db = require('../database');
const {
  BillingValidationError,
  ServicePricingConfigError,
  calculateInvoiceTotal,
} = require('../services/invoiceCalculator');
const { getPreviousMeterReading } = require('../services/meterReadingService');
const {
  getActionTypes,
  getAuditLogs,
  getEntityTypes,
  logAuditEvent,
} = require('../services/auditLog');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('invoiceCalculator service', () => {
  it('calculates rent, utilities, service fees, and total amount', () => {
    const result = calculateInvoiceTotal({
      roomPrice: '2500000',
      prevElectricityIndex: '120',
      currentElectricityIndex: 150,
      prevWaterIndex: 40,
      currentWaterIndex: '48',
      serviceFees: {
        wifiFee: '100000',
        trashFee: 50000,
      },
      serviceUnitPrices: {
        electricityUnitPrice: '4000',
        waterUnitPrice: '15000',
      },
    });

    expect(result.breakdown).toMatchObject({
      roomPrice: 2500000,
      electricityUsage: 30,
      electricityAmount: 120000,
      waterUsage: 8,
      waterAmount: 120000,
      serviceAmount: 150000,
    });
    expect(result.totalAmount).toBe(2890000);
  });

  it('defaults missing service fees to zero', () => {
    const result = calculateInvoiceTotal({
      roomPrice: 1000000,
      prevElectricityIndex: 10,
      currentElectricityIndex: 10,
      prevWaterIndex: 5,
      currentWaterIndex: 5,
      serviceUnitPrices: {
        electricityUnitPrice: 4000,
        waterUnitPrice: 15000,
      },
    });

    expect(result.breakdown.serviceAmount).toBe(0);
    expect(result.totalAmount).toBe(1000000);
  });

  it('throws validation errors for invalid numeric billing input', () => {
    expect(() => calculateInvoiceTotal({
      roomPrice: -1,
      prevElectricityIndex: 0,
      currentElectricityIndex: 1,
      prevWaterIndex: 'not-a-number',
      currentWaterIndex: 1,
      serviceUnitPrices: {
        electricityUnitPrice: 4000,
        waterUnitPrice: 15000,
      },
    })).toThrow(BillingValidationError);
  });

  it('throws when utility indexes decrease', () => {
    expect(() => calculateInvoiceTotal({
      roomPrice: 1000000,
      prevElectricityIndex: 20,
      currentElectricityIndex: 19,
      prevWaterIndex: 5,
      currentWaterIndex: 5,
      serviceUnitPrices: {
        electricityUnitPrice: 4000,
        waterUnitPrice: 15000,
      },
    })).toThrow('Electricity index cannot decrease.');
  });

  it('reports missing service unit prices separately from billing validation errors', () => {
    try {
      calculateInvoiceTotal({
        roomPrice: 1000000,
        prevElectricityIndex: 0,
        currentElectricityIndex: 1,
        prevWaterIndex: 0,
        currentWaterIndex: 1,
        serviceUnitPrices: {
          electricityUnitPrice: 4000,
        },
      });
      throw new Error('Expected calculateInvoiceTotal to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ServicePricingConfigError);
      expect(error.code).toBe('SERVICE_PRICE_CONFIG_MISSING');
      expect(error.missingFields).toEqual(['waterUnitPrice']);
    }
  });
});

describe('meterReadingService', () => {
  it('loads the latest reading before the requested billing month', async () => {
    const previousReading = {
      id: 9,
      roomID: 3,
      electricityIndex: 120,
      waterIndex: 60,
      recordedDate: '2026-04-30',
    };
    db.getAsync.mockResolvedValue(previousReading);

    await expect(getPreviousMeterReading(3, 5, 2026)).resolves.toBe(previousReading);

    expect(db.getAsync).toHaveBeenCalledWith(expect.stringContaining('ORDER BY date(mr.recorded_date) DESC'), [
      3,
      '2026-05-01',
    ]);
  });

  it('returns null when there is no previous reading', async () => {
    db.getAsync.mockResolvedValue(undefined);

    await expect(getPreviousMeterReading(3, 5, 2026)).resolves.toBeNull();
  });

  it('rejects invalid room and billing period input', async () => {
    await expect(getPreviousMeterReading(0, 5, 2026)).rejects.toThrow('Invalid roomID.');
    await expect(getPreviousMeterReading(3, 13, 2026)).rejects.toThrow('Invalid month/year.');
    expect(db.getAsync).not.toHaveBeenCalled();
  });
});

describe('auditLog service', () => {
  it('serializes audit values when writing audit events', async () => {
    db.runAsync.mockResolvedValue({ lastID: 1, changes: 1 });

    await logAuditEvent({
      userId: 4,
      landlordId: 2,
      action: 'CREATE_ROOM',
      entityType: 'room',
      entityId: 17,
      description: 'Created room 101',
      oldValues: { status: 'draft' },
      newValues: { status: 'available' },
    });

    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO audit_logs'), [
      4,
      2,
      'CREATE_ROOM',
      'room',
      17,
      'Created room 101',
      JSON.stringify({ status: 'draft' }),
      JSON.stringify({ status: 'available' }),
      'success',
    ]);
  });

  it('does not throw when audit insert fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    db.runAsync.mockRejectedValue(new Error('database unavailable'));

    await expect(logAuditEvent({
      userId: 4,
      landlordId: 2,
      action: 'UPDATE_ROOM',
      entityType: 'room',
    })).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('applies filters and parses JSON values when reading audit logs', async () => {
    db.allAsync.mockResolvedValue([
      {
        id: 1,
        action: 'UPDATE_ROOM',
        entity_type: 'room',
        old_values: '{"price":1000}',
        new_values: '{"price":1200}',
      },
    ]);

    const logs = await getAuditLogs(2, {
      action: 'UPDATE_ROOM',
      entityType: 'room',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      limit: 10,
      offset: 5,
    });

    expect(db.allAsync).toHaveBeenCalledWith(expect.stringContaining('AND al.action = ?'), [
      2,
      'UPDATE_ROOM',
      'room',
      '2026-05-01',
      '2026-05-31',
      10,
      5,
    ]);
    expect(logs[0].old_values).toEqual({ price: 1000 });
    expect(logs[0].new_values).toEqual({ price: 1200 });
  });

  it('returns distinct action and entity filter options', async () => {
    db.allAsync
      .mockResolvedValueOnce([{ action: 'CREATE_ROOM' }, { action: 'UPDATE_ROOM' }])
      .mockResolvedValueOnce([{ entity_type: 'room' }, { entity_type: 'invoice' }]);

    await expect(getActionTypes(2)).resolves.toEqual(['CREATE_ROOM', 'UPDATE_ROOM']);
    await expect(getEntityTypes(2)).resolves.toEqual(['room', 'invoice']);
  });
});
