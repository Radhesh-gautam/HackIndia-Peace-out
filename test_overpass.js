const lat = 40.7128;
const lng = -74.0060;
const query = `
[out:json][timeout:25];
(
  node["amenity"="doctors"](around:3000,${lat},${lng});
  way["amenity"="doctors"](around:3000,${lat},${lng});
  relation["amenity"="doctors"](around:3000,${lat},${lng});
);
out center tags;
`.trim();

async function test() {
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'HealthcareDashboard/1.0 (test@example.com)'
      },
      body: `data=${encodeURIComponent(query)}`
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Overpass API returned non-OK status:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log("Success! Found", data.elements.length, "elements.");
  } catch (err) {
    console.error('Fetch Exception:', err);
  }
}
test();
