const db = require('../database');

function normalizeTargetTable(targetTable) {
  if (targetTable === 'rooms' || targetTable === 'lease_contracts') {
    return targetTable;
  }

  return null;
}

function buildPayload(req) {
  const payload = {};

  if (req.body && Object.keys(req.body).length > 0) {
    payload.body = req.body;
  }

  if (req.params && Object.keys(req.params).length > 0) {
    payload.params = req.params;
  }

  if (req.query && Object.keys(req.query).length > 0) {
    payload.query = req.query;
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

function getUserId(req) {
  if (!req.user) {
    return null;
  }

  return req.user.id ?? req.user.user_id ?? req.user.userId ?? null;
}

function auditMutations(targetTable) {
  const normalizedTargetTable = normalizeTargetTable(targetTable);

  if (!normalizedTargetTable) {
    throw new Error(`Unsupported audit target table: ${targetTable}`);
  }

  return (req, res, next) => {
    const method = String(req.method || '').toUpperCase();

    if (method !== 'PUT' && method !== 'DELETE') {
      return next();
    }

    const auditEntry = {
      userId: getUserId(req),
      landlordId: getUserId(req),
      action: method === 'PUT' ? 'UPDATE' : 'DELETE',
      entityType: normalizedTargetTable,
      targetTable: normalizedTargetTable,
      targetId: req.params?.id ?? req.body?.id ?? null,
      path: req.originalUrl,
      method,
      payload: buildPayload(req),
      createdAt: new Date().toISOString(),
    };

    res.on('finish', () => {
      auditEntry.statusCode = res.statusCode;

      db.insertAuditLogAsync(auditEntry).catch((error) => {
        console.error('Failed to write audit log:', error);
      });
    });

    return next();
  };
}

module.exports = { auditMutations };