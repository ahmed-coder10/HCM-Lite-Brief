import crypto from 'crypto';
import { db, AttendanceRecord, AttendanceCorrection } from '../db/store.js';

// Haversine distance in meters
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Determines if a check-in is on time or late
// Office start: "09:00", grace 15 min => <= 09:15 is PRESENT, >= 09:16 is LATE
export function evaluateCheckInStatus(
  checkInDate: Date,
  officeStart: string = '09:00',
  graceMinutes: number = 15
): 'PRESENT' | 'LATE' {
  const [startH, startM] = officeStart.split(':').map(Number);
  const cutoffMinutes = startH * 60 + startM + graceMinutes;

  const checkInMinutes = checkInDate.getHours() * 60 + checkInDate.getMinutes();
  return checkInMinutes <= cutoffMinutes ? 'PRESENT' : 'LATE';
}

export function checkIn(params: {
  employeeId: string;
  method?: 'WEB' | 'CAMERA_FACIAL';
  coords?: { lat: number; lng: number };
  faceDetected?: boolean;
}): { success: boolean; message: string; record?: AttendanceRecord; code?: number } {
  const today = new Date().toISOString().split('T')[0];
  const settings = db.get('settings');

  // Check if already checked in today
  const existing = db
    .get('attendance')
    .find((a) => a.employeeId === params.employeeId && a.date === today);

  if (existing) {
    return {
      success: false,
      message: 'Already checked in for today',
      code: 409,
    };
  }

  // Geofence & Facial Validation if camera method
  let locationInfo: AttendanceRecord['location'] | undefined = undefined;
  if (params.method === 'CAMERA_FACIAL') {
    if (params.faceDetected === false) {
      return {
        success: false,
        message: 'Facial detection failed: exactly one face must be visible.',
        code: 422,
      };
    }
    if (params.coords) {
      const dist = calculateHaversineDistance(
        params.coords.lat,
        params.coords.lng,
        settings.officeLat,
        settings.officeLng
      );
      const inside = dist <= settings.officeRadiusMeters;
      locationInfo = {
        lat: params.coords.lat,
        lng: params.coords.lng,
        distanceMeters: dist,
        insideGeofence: inside,
      };
      if (!inside) {
        return {
          success: false,
          message: `Location out of office bounds (${dist}m away, limit is ${settings.officeRadiusMeters}m).`,
          code: 422,
        };
      }
    }
  }

  const now = new Date();
  const initialStatus = evaluateCheckInStatus(
    now,
    settings.officeStart,
    settings.graceMinutes
  );

  const record: AttendanceRecord = {
    id: crypto.randomUUID(),
    employeeId: params.employeeId,
    date: today,
    checkIn: now.toISOString(),
    checkOut: null,
    status: initialStatus,
    method: params.method || 'WEB',
    location: locationInfo,
  };

  db.update((data) => {
    data.attendance.push(record);
  });

  return { success: true, message: `Checked in successfully as ${initialStatus}`, record };
}

export function checkOut(params: {
  employeeId: string;
}): { success: boolean; message: string; record?: AttendanceRecord; code?: number } {
  const today = new Date().toISOString().split('T')[0];
  const settings = db.get('settings');

  const record = db
    .get('attendance')
    .find((a) => a.employeeId === params.employeeId && a.date === today);

  if (!record) {
    return {
      success: false,
      message: 'No check-in record found for today.',
      code: 404,
    };
  }

  if (record.checkOut) {
    return {
      success: false,
      message: 'Already checked out for today.',
      code: 409,
    };
  }

  const now = new Date();
  const checkInTime = new Date(record.checkIn);
  const diffHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  record.checkOut = now.toISOString();
  record.durationHours = parseFloat(diffHours.toFixed(2));

  // If worked less than required halfDayMinHours, mark as HALF_DAY
  if (diffHours < settings.halfDayMinHours) {
    record.status = 'HALF_DAY';
  }

  db.update((data) => {
    const idx = data.attendance.findIndex((a) => a.id === record.id);
    if (idx !== -1) {
      data.attendance[idx] = record;
    }
  });

  return { success: true, message: `Checked out successfully (${diffHours.toFixed(1)} hrs worked)`, record };
}
