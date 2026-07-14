require('dotenv').config();
const db = require('./db.js');

async function geocodeExisting() {
  try {
    // Select all tasks that have a location text but no coordinates
    const result = await db.execute(
      `SELECT id, text, location_text FROM reminder_tasks WHERE location_text IS NOT NULL AND location_lat IS NULL`
    );

    console.log(`Found ${result.rows.length} tasks needing geocoding.`);
    if (result.rows.length === 0) {
      await db.close();
      return;
    }

    for (const row of result.rows) {
      const taskId = row.ID;
      const locationText = row.LOCATION_TEXT;
      console.log(`Geocoding task ID ${taskId}: "${row.TEXT}" at location "${locationText}"...`);

      // Skip generic 'online' or 'online or call' strings
      if (['online', 'online or call', 'call'].includes(locationText.toLowerCase().trim())) {
        console.log(`- Skipping generic location: ${locationText}`);
        continue;
      }

      // Query Nominatim with local bias for Chennai, India (since the user is located in Chennai)
      // Chennai bounding box / viewbox
      const viewbox = '&viewbox=80.1,13.2,80.3,12.9&bounded=0';
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1${viewbox}`;

      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SmartReminderApp/1.0 (grvivek17@gmail.com)'
          }
        });

        if (!response.ok) {
          console.warn(`- Failed to fetch geocode for "${locationText}" (status: ${response.status})`);
          continue;
        }

        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          console.log(`- Successfully geocoded to lat: ${lat}, lng: ${lng} (${data[0].display_name})`);

          // Update the DB
          await db.execute(
            `UPDATE reminder_tasks SET location_lat = :lat, location_lng = :lng WHERE id = :id`,
            { lat, lng, id: taskId }
          );
          console.log(`- Updated DB for task ID ${taskId}`);
        } else {
          console.log(`- Nominatim returned no results for "${locationText}"`);
        }
      } catch (err) {
        console.error(`- Error geocoding "${locationText}":`, err.message);
      }

      // Respect Nominatim rate limit policy of 1 request per second
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    console.log('Geocoding migration finished.');
    await db.close();
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

geocodeExisting();
