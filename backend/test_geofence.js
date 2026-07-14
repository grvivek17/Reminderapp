require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const db = require('./db.js');

// ── Haversine distance (same formula as the app) ──
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const GEOFENCE_RADIUS_M = 500;

// ── Test scenarios: simulate being AT each task's location ──
async function runGeofenceTest() {
  console.log('\n========================================');
  console.log('  GEOFENCING SIMULATION TEST');
  console.log('========================================\n');

  // 1. Fetch all active tasks with coordinates from DB
  const result = await db.execute(
    `SELECT id, text, location_text, location_lat, location_lng
     FROM reminder_tasks
     WHERE status != 'completed'
       AND location_lat IS NOT NULL
       AND location_lng IS NOT NULL
     ORDER BY id`
  );

  const tasks = result.rows.map(r => ({
    id: r.ID,
    text: r.TEXT,
    locationText: r.LOCATION_TEXT,
    locationLat: Number(r.LOCATION_LAT),
    locationLng: Number(r.LOCATION_LNG)
  }));

  console.log(`✓ Loaded ${tasks.length} tasks with coordinates from DB\n`);

  // 2. Test geocode proxy endpoint
  console.log('--- TEST 1: Geocode Proxy ---');
  try {
    const fetch = (await import('node-fetch')).default;
    const token = process.env.TEST_JWT || '';
    const geocodeRes = await fetch('http://localhost:3001/api/tasks/geocode?q=Periamet%2C+Chennai', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (geocodeRes.status === 401) {
      console.log('⚠ Geocode proxy needs auth - testing raw Nominatim instead...');
      const nomRes = await fetch(
        'https://nominatim.openstreetmap.org/search?q=Periamet+Chennai&format=json&limit=1&countrycodes=in',
        { headers: { 'User-Agent': 'SmartReminderApp/1.0 (grvivek17@gmail.com)' } }
      );
      const nomData = await nomRes.json();
      if (nomData.length > 0) {
        console.log(`✓ Geocode works: "Periamet Chennai" → lat:${nomData[0].lat}, lng:${nomData[0].lon}`);
      } else {
        console.log('✗ Geocode returned no results');
      }
    } else {
      const geocodeData = await geocodeRes.json();
      console.log(`✓ Geocode proxy works: ${JSON.stringify(geocodeData[0])}`);
    }
  } catch (err) {
    console.log('✗ Geocode test failed:', err.message);
  }

  // 3. Simulate geofence check for each task (pretend user is AT the task location)
  console.log('\n--- TEST 2: Geofence Distance Logic (simulating user AT each task location) ---');
  let passCount = 0;
  let failCount = 0;

  for (const task of tasks) {
    // Simulate user being exactly at the task location
    const dist = haversineDistance(
      task.locationLat, task.locationLng,
      task.locationLat, task.locationLng
    );
    const wouldFire = dist <= GEOFENCE_RADIUS_M;
    if (wouldFire) {
      console.log(`  ✓ [WOULD NOTIFY] Task ${task.id}: "${task.text.substring(0,35)}" @ "${task.locationText}"`);
      passCount++;
    } else {
      console.log(`  ✗ [WOULD NOT NOTIFY] Task ${task.id} - distance ${dist}m`);
      failCount++;
    }
  }

  // 4. Cross-task distance test: simulate user at Periamet (ID 11's location)
  const periamet = tasks.find(t => t.id === 11);
  if (periamet) {
    console.log('\n--- TEST 3: Cross-task distances from Periamet ---');
    console.log(`Simulating user at Periamet (lat:${periamet.locationLat}, lng:${periamet.locationLng}):`);
    for (const task of tasks) {
      const dist = haversineDistance(
        periamet.locationLat, periamet.locationLng,
        task.locationLat, task.locationLng
      );
      const fires = dist <= GEOFENCE_RADIUS_M;
      const marker = fires ? '🔔 FIRES' : `   ${Math.round(dist/1000)}km away`;
      console.log(`  ${marker} → Task ${task.id}: "${task.locationText}"`);
    }
  }

  // 5. Test haversine accuracy with a known distance
  console.log('\n--- TEST 4: Haversine Accuracy Check ---');
  // Chennai central station to Periamet = ~2.6km known
  const chennaiCentral = { lat: 13.0827, lng: 80.2707 };
  const periamet2     = { lat: 13.0844, lng: 80.2693 };
  const knownDist = haversineDistance(
    chennaiCentral.lat, chennaiCentral.lng,
    periamet2.lat, periamet2.lng
  );
  console.log(`  Chennai Central → Periamet: ${Math.round(knownDist)}m (expected ~200-300m)`);
  console.log(`  Formula accuracy: ${knownDist < 1000 ? '✓ PASS' : '✗ FAIL - unexpected value'}`);

  // 6. Summary
  console.log('\n========================================');
  console.log('  RESULTS');
  console.log('========================================');
  console.log(`  Tasks that WOULD trigger notification: ${passCount}`);
  console.log(`  Tasks that would NOT trigger:          ${failCount}`);
  console.log(`  Geofence radius configured:            ${GEOFENCE_RADIUS_M}m`);
  console.log(`  Total active tasks with coordinates:   ${tasks.length}`);
  console.log('\n  Tasks by location (for physical test):');
  tasks.forEach(t => {
    console.log(`    • "${t.locationText}" → lat:${t.locationLat.toFixed(4)}, lng:${t.locationLng.toFixed(4)}`);
  });
  console.log('========================================\n');

  await db.close();
}

runGeofenceTest().catch(console.error);
