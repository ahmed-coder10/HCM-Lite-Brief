import { evaluateCheckInStatus, calculateHaversineDistance } from '../services/attendanceService.js';
import { calculateAnnualTax } from '../services/payrollService.js';
import { calculateWorkingDays, doDatesOverlap } from '../services/leaveService.js';
console.log('🧪 Starting HCM Lite Pure Domain Rule Verification Suite...\n');
let passed = 0;
let failed = 0;
function assert(description, condition) {
    if (condition) {
        console.log(`  ✅ PASS: ${description}`);
        passed++;
    }
    else {
        console.error(`  ❌ FAIL: ${description}`);
        failed++;
    }
}
// 1. Attendance Tests
console.log('--- Suite 1: Attendance Rules ---');
// 09:15 check-in on time
const dateOnTime = new Date('2026-10-25T09:15:00');
assert('09:15 arrival is evaluated as PRESENT', evaluateCheckInStatus(dateOnTime, '09:00', 15) === 'PRESENT');
// 09:16 check-in late
const dateLate = new Date('2026-10-25T09:16:00');
assert('09:16 arrival is evaluated as LATE', evaluateCheckInStatus(dateLate, '09:00', 15) === 'LATE');
// Haversine geofence distance
const officeLat = 24.8607;
const officeLng = 67.0011;
// Same coordinates = 0 meters
assert('Haversine distance at origin is 0m', calculateHaversineDistance(officeLat, officeLng, officeLat, officeLng) === 0);
// 100 meters away
const distFar = calculateHaversineDistance(officeLat, officeLng, 24.8700, 67.0100);
assert('Haversine calculates non-zero distance for distinct coordinates (>1000m)', distFar > 1000);
// 2. Leave Tests
console.log('\n--- Suite 2: Leave & Working Days Rules ---');
// Overlap checks
assert('Detects overlapping date ranges (identical)', doDatesOverlap('2026-10-10', '2026-10-15', '2026-10-10', '2026-10-15'));
assert('Detects partial overlap', doDatesOverlap('2026-10-10', '2026-10-15', '2026-10-14', '2026-10-20'));
assert('Does not flag disjoint date ranges', !doDatesOverlap('2026-10-10', '2026-10-15', '2026-10-16', '2026-10-20'));
// Working days in Mon-Fri
const monToFriDays = calculateWorkingDays('2026-10-19', '2026-10-23'); // Mon to Fri
assert('Monday to Friday counts as 5 working days', monToFriDays === 5);
// 3. Payroll & Tax Calculations
console.log('\n--- Suite 3: Payroll Progressive Tax Slabs ---');
// 0 - 600,000 -> 0%
assert('Annual 500,000 has 0 tax', calculateAnnualTax(500000) === 0);
assert('Annual 600,000 has 0 tax', calculateAnnualTax(600000) === 0);
// 600,000 - 1,200,000 -> 5% of amount above 600k
// 800,000 => (800k - 600k) * 5% = 200,000 * 0.05 = 10,000
assert('Annual 800,000 tax is 10,000 (5% above 600k)', calculateAnnualTax(800000) === 10000);
// 1,200,000 - 2,400,000 -> 30,000 + 15% above 1.2M
// 1,500,000 => 30,000 + (300,000 * 0.15) = 30,000 + 45,000 = 75,000
assert('Annual 1,500,000 tax is 75,000 (30k + 15% above 1.2M)', calculateAnnualTax(1500000) === 75000);
// 2,400,000 - 3,600,000 -> 210,000 + 25% above 2.4M
// 3,000,000 => 210,000 + (600,000 * 0.25) = 210,000 + 150,000 = 360,000
assert('Annual 3,000,000 tax is 360,000 (210k + 25% above 2.4M)', calculateAnnualTax(3000000) === 360000);
// > 3,600,000 -> 510,000 + 35% above 3.6M
// 4,000,000 => 510,000 + (400,000 * 0.35) = 510,000 + 140,000 = 650,000
assert('Annual 4,000,000 tax is 650,000 (510k + 35% above 3.6M)', calculateAnnualTax(4000000) === 650000);
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
    process.exit(1);
}
else {
    console.log('🎉 All business logic tests passed with 100% precision!\n');
}
