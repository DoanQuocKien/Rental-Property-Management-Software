class BillingValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'BillingValidationError';
    this.code = 'BILLING_VALIDATION_ERROR';
    this.details = details;
  }
}

class ServicePricingConfigError extends Error {
  constructor(message, missingFields = []) {
    super(message);
    this.name = 'ServicePricingConfigError';
    this.code = 'SERVICE_PRICE_CONFIG_MISSING';
    this.missingFields = missingFields;
  }
}

function toNumber(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }

  return Number.NaN;
}

function validateNonNegativeNumber(name, value, errors) {
  if (!Number.isFinite(value)) {
    errors.push(`${name} must be a valid number`);
    return;
  }

  if (value < 0) {
    errors.push(`${name} must be >= 0`);
  }
}

function calculateInvoiceTotal(input) {
  const payload = input || {};
  const errors = [];

  const roomPrice = toNumber(payload.roomPrice);
  const prevElectricityIndex = toNumber(payload.prevElectricityIndex);
  const currentElectricityIndex = toNumber(payload.currentElectricityIndex);
  const prevWaterIndex = toNumber(payload.prevWaterIndex);
  const currentWaterIndex = toNumber(payload.currentWaterIndex);

  const serviceFees = payload.serviceFees || {};
  const wifiFee = toNumber(serviceFees.wifiFee ?? 0);
  const trashFee = toNumber(serviceFees.trashFee ?? 0);

  const serviceUnitPrices = payload.serviceUnitPrices || {};
  const electricityUnitPrice = toNumber(serviceUnitPrices.electricityUnitPrice);
  const waterUnitPrice = toNumber(serviceUnitPrices.waterUnitPrice);

  validateNonNegativeNumber('roomPrice', roomPrice, errors);
  validateNonNegativeNumber('prevElectricityIndex', prevElectricityIndex, errors);
  validateNonNegativeNumber('currentElectricityIndex', currentElectricityIndex, errors);
  validateNonNegativeNumber('prevWaterIndex', prevWaterIndex, errors);
  validateNonNegativeNumber('currentWaterIndex', currentWaterIndex, errors);
  validateNonNegativeNumber('wifiFee', wifiFee, errors);
  validateNonNegativeNumber('trashFee', trashFee, errors);

  if (errors.length > 0) {
    throw new BillingValidationError('Invalid billing payload.', errors);
  }

  const missingServicePricing = [];
  if (!Number.isFinite(electricityUnitPrice) || electricityUnitPrice < 0) {
    missingServicePricing.push('electricityUnitPrice');
  }
  if (!Number.isFinite(waterUnitPrice) || waterUnitPrice < 0) {
    missingServicePricing.push('waterUnitPrice');
  }

  if (missingServicePricing.length > 0) {
    throw new ServicePricingConfigError(
      'Missing or invalid service unit prices. Please check service pricing configuration.',
      missingServicePricing
    );
  }

  if (currentElectricityIndex < prevElectricityIndex) {
    throw new BillingValidationError('Electricity index cannot decrease.', [
      'currentElectricityIndex must be >= prevElectricityIndex',
    ]);
  }

  if (currentWaterIndex < prevWaterIndex) {
    throw new BillingValidationError('Water index cannot decrease.', [
      'currentWaterIndex must be >= prevWaterIndex',
    ]);
  }

  const electricityUsage = currentElectricityIndex - prevElectricityIndex;
  const waterUsage = currentWaterIndex - prevWaterIndex;

  const electricityAmount = electricityUsage * electricityUnitPrice;
  const waterAmount = waterUsage * waterUnitPrice;
  const serviceAmount = wifiFee + trashFee;
  const totalAmount = roomPrice + electricityAmount + waterAmount + serviceAmount;

  return {
    breakdown: {
      roomPrice,
      electricityUsage,
      electricityUnitPrice,
      electricityAmount,
      waterUsage,
      waterUnitPrice,
      waterAmount,
      wifiFee,
      trashFee,
      serviceAmount,
    },
    totalAmount,
  };
}

module.exports = {
  calculateInvoiceTotal,
  BillingValidationError,
  ServicePricingConfigError,
};