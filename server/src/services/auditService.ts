import crypto from 'crypto';
import { db, AuditLog } from '../db/store.js';

export function recordAudit(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details: string;
  diff?: { before: any; after: any };
  ip?: string;
}): AuditLog {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    details: params.details,
    diff: params.diff,
    ip: params.ip,
  };

  db.update((data) => {
    data.auditLogs.unshift(log);
  });

  return log;
}
