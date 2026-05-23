const db = require('../database');

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {number} params.userId - ID of the user performing the action
 * @param {number} params.landlordId - ID of the landlord (property owner)
 * @param {string} params.action - Action performed (e.g., 'CREATE_INVOICE', 'PAY_INVOICE', 'CREATE_ROOM')
 * @param {string} params.entityType - Type of entity affected (e.g., 'invoice', 'room', 'contract')
 * @param {number} [params.entityId] - ID of the entity affected
 * @param {string} [params.description] - Human-readable description of the action
 * @param {Object} [params.oldValues] - Previous values (for updates)
 * @param {Object} [params.newValues] - New values (for creates/updates)
 * @param {string} [params.status] - Status of the action ('success' or 'failed')
 */
async function logAuditEvent(params) {
  const {
    userId,
    landlordId,
    action,
    entityType,
    entityId,
    description,
    oldValues,
    newValues,
    status = 'success'
  } = params;

  try {
    await db.runAsync(
      `INSERT INTO audit_logs
       (user_id, landlord_id, action, entity_type, entity_id, description, old_values, new_values, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        landlordId,
        action,
        entityType,
        entityId || null,
        description || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        status
      ]
    );
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main operation
  }
}

/**
 * Get audit logs with filtering
 * @param {number} landlordId - Landlord ID to get logs for
 * @param {Object} filters - Filter options
 * @param {string} [filters.action] - Filter by action type
 * @param {string} [filters.entityType] - Filter by entity type
 * @param {string} [filters.startDate] - Filter by start date (YYYY-MM-DD)
 * @param {string} [filters.endDate] - Filter by end date (YYYY-MM-DD)
 * @param {number} [filters.limit] - Limit number of results (default 100)
 * @param {number} [filters.offset] - Offset for pagination (default 0)
 * @returns {Promise<Array>} Array of audit log records
 */
async function getAuditLogs(landlordId, filters = {}) {
  const {
    action,
    entityType,
    startDate,
    endDate,
    limit = 100,
    offset = 0
  } = filters;

  let query = `
    SELECT 
      al.id,
      al.user_id,
      al.landlord_id,
      al.action,
      al.entity_type,
      al.entity_id,
      al.description,
      al.old_values,
      al.new_values,
      al.status,
      al.created_at,
      u.name as user_name,
      u.email as user_email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.landlord_id = ?
  `;

  const params = [landlordId];

  if (action) {
    query += ` AND al.action = ?`;
    params.push(action);
  }

  if (entityType) {
    query += ` AND al.entity_type = ?`;
    params.push(entityType);
  }

  if (startDate) {
    query += ` AND DATE(al.created_at) >= DATE(?)`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND DATE(al.created_at) <= DATE(?)`;
    params.push(endDate);
  }

  query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  try {
    const logs = await db.allAsync(query, params);
    
    // Parse JSON fields
    return logs.map(log => ({
      ...log,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null
    }));
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
}

/**
 * Get distinct action types for filtering
 * @param {number} landlordId - Landlord ID
 * @returns {Promise<Array>} Array of unique action types
 */
async function getActionTypes(landlordId) {
  try {
    const actions = await db.allAsync(
      `SELECT DISTINCT action FROM audit_logs WHERE landlord_id = ? ORDER BY action`,
      [landlordId]
    );
    return actions.map(a => a.action);
  } catch (error) {
    console.error('Failed to get action types:', error);
    throw error;
  }
}

/**
 * Get distinct entity types for filtering
 * @param {number} landlordId - Landlord ID
 * @returns {Promise<Array>} Array of unique entity types
 */
async function getEntityTypes(landlordId) {
  try {
    const types = await db.allAsync(
      `SELECT DISTINCT entity_type FROM audit_logs WHERE landlord_id = ? ORDER BY entity_type`,
      [landlordId]
    );
    return types.map(t => t.entity_type);
  } catch (error) {
    console.error('Failed to get entity types:', error);
    throw error;
  }
}

module.exports = {
  logAuditEvent,
  getAuditLogs,
  getActionTypes,
  getEntityTypes
};
