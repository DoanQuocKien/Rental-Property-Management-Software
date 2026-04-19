const db = require('../database');

function validateMonthYear(month, year) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }

  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    return false;
  }

  return true;
}

function resolveTargetDate(month, year) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

async function getPreviousMeterReading(roomID, month, year) {
  if (!Number.isInteger(roomID) || roomID <= 0) {
    throw new Error('Invalid roomID.');
  }

  if (!validateMonthYear(month, year)) {
    throw new Error('Invalid month/year.');
  }

  const targetDate = resolveTargetDate(month, year);

  const previousReading = await db.getAsync(
    `SELECT
      mr.id,
      mr.room_id as roomID,
      mr.electricity_index as electricityIndex,
      mr.water_index as waterIndex,
      mr.recorded_date as recordedDate,
      i.month,
      i.year
     FROM meter_readings mr
     LEFT JOIN invoices i ON i.id = mr.invoice_id
     WHERE mr.room_id = ?
       AND date(mr.recorded_date) < date(?)
     ORDER BY date(mr.recorded_date) DESC, mr.id DESC
     LIMIT 1`,
    [roomID, targetDate]
  );

  return previousReading || null;
}

module.exports = {
  getPreviousMeterReading,
};