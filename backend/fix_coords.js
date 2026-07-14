require('dotenv').config();
const db = require('./db.js');

// Chennai center coordinates for biasing geocode searches
const CHENNAI_LAT = 13.0827;
const CHENNAI_LNG = 80.2707;
const DELTA = 0.5; // ~55km box around Chennai

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const SKIP_GENERIC = ['online', 'online or call', 'call', 'home'];

async function regeocodeWrongCoords() {
  try {
    const result = await db.execute(
      `SELECT id, text, location_text, location_lat, location_lng FROM reminder_tasks WHERE location_text IS NOT NULL`
    );

    console.log(`\n=== Checking ${result.rows.length} tasks for wrong coordinates ===\n`);

    for (const row of result.rows) {
      const taskId = row.ID;
      const locationText = row.LOCATION_TEXT;
      const lat = row.LOCATION_LAT != null ? Number(row.LOCATION_LAT) : null;
      const lng = row.LOCATION_LNG != null ? Number(row.LOCATION_LNG) : null;

      if (SKIP_GENERIC.includes(locationText.toLowerCase().trim())) {
        console.log(`[SKIP] ID:${taskId} "${locationText}" - generic location`);
        continue;
      }

      if (lat == null || lng == null) {
        console.log(`[NO COORDS] ID:${taskId} "${locationText}" - still null`);
        continue;
      }

      // Check if the current coords are far from Chennai (> 1000km away)
      const distFromChennai = haversineDistance(CHENNAI_LAT, CHENNAI_LNG, lat, lng);

      if (distFromChennai < 200000) { // within 200km of Chennai
        console.log(`[OK] ID:${taskId} "${locationText}" - lat:${lat.toFixed(4)}, lng:${lng.toFixed(4)} (${(distFromChennai/1000).toFixed(1)}km from Chennai)`);
        continue;
      }

      console.log(`[WRONG] ID:${taskId} "${locationText}" - currently at lat:${lat.toFixed(4)}, lng:${lng.toFixed(4)} = ${(distFromChennai/1000).toFixed(0)}km from Chennai - RE-GEOCODING...`);

      // Re-geocode with strong Chennai bias
      const viewbox = `&viewbox=${CHENNAI_LNG - DELTA},${CHENNAI_LAT + DELTA},${CHENNAI_LNG + DELTA},${CHENNAI_LAT - DELTA}&bounded=0`;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=3${viewbox}&countrycodes=in`;

      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SmartReminderApp/1.0 (grvivek17@gmail.com)'
          }
        });

        if (!response.ok) {
          console.log(`  -> Nominatim error ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (data && data.length > 0) {
          // Pick the closest result to Chennai
          let best = data[0];
          let bestDist = haversineDistance(CHENNAI_LAT, CHENNAI_LNG, parseFloat(data[0].lat), parseFloat(data[0].lon));
          for (let i = 1; i < data.length; i++) {
            const d = haversineDistance(CHENNAI_LAT, CHENNAI_LNG, parseFloat(data[i].lat), parseFloat(data[i].lon));
            if (d < bestDist) { bestDist = d; best = data[i]; }
          }
          const newLat = parseFloat(best.lat);
          const newLng = parseFloat(best.lon);
          console.log(`  -> New coords: lat:${newLat.toFixed(4)}, lng:${newLng.toFixed(4)} (${(bestDist/1000).toFixed(1)}km from Chennai) - "${best.display_name}"`);
          await db.execute(
            `UPDATE reminder_tasks SET location_lat = :lat, location_lng = :lng WHERE id = :id`,
            { lat: newLat, lng: newLng, id: taskId }
          );
          console.log(`  -> Updated DB for task ID ${taskId}`);
        } else {
          console.log(`  -> No results, clearing bad coords`);
          await db.execute(
            `UPDATE reminder_tasks SET location_lat = NULL, location_lng = NULL WHERE id = :id`,
            { id: taskId }
          );
        }
      } catch (err) {
        console.error(`  -> Error: ${err.message}`);
      }

      // Nominatim rate limit: 1 req/sec
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    console.log('\n=== Done ===');
    await db.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

regeocodeWrongCoords();
