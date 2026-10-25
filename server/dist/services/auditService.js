import crypto from 'crypto';
import { db } from '../db/store.js';
export function recordAudit(params) {
    const log = {
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
