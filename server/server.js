import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.TWILIO_SID || !process.env.TWILIO_SID.startsWith("AC")) {
  console.warn("Twilio credentials not configured properly. Calls may fail.");
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ... existing code ...
// Read patient data
const dataPath = path.join(__dirname, 'data', 'patient.json');
let patientData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Endpoint to get patient data
app.get('/api/patient-data', (req, res) => {
  res.json(patientData);
});

// Endpoint to update patient data (e.g. from frontend form)
app.post('/api/patient-data', (req, res) => {
  patientData.profile = { ...patientData.profile, ...req.body };
  fs.writeFileSync(dataPath, JSON.stringify(patientData, null, 2));
  res.json({ success: true, profile: patientData.profile });
});

// Endpoint to get nearby doctors via Overpass API
app.get('/api/doctors', async (req, res) => {
  console.log('GET /api/doctors - req.query:', req.query);
  let { lat, lng } = req.query;
  
  lat = Number(lat);
  lng = Number(lng);
  
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'Invalid or missing lat/lng parameters' });
  }

  const query = `
[out:json][timeout:15];
node["amenity"="doctors"](around:2000,${lat},${lng});
out;
  `.trim();

  const fallbackData = [
    {
      id: 'mock-1',
      name: 'Nearby Clinic',
      address: 'Fallback data',
      lat: lat,
      lng: lng,
      rating: '4.8'
    }
  ];

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 
        'Content-Type': 'text/plain',
        'User-Agent': 'HealthcareDashboard/1.0 (hackathon-demo)'
      },
      body: query
    });

    if (!response.ok) {
      console.error('Overpass API returned non-OK status:', response.status);
      return res.json(fallbackData);
    }

    const data = await response.json();
    
    let doctors = (data.elements || [])
      .map((el, idx) => {
        const tags = el.tags || {};
        let name = tags.name || "Nearby Doctor";
        let address = tags['addr:street'] 
          ? `${tags['addr:housenumber'] ? tags['addr:housenumber'] + ' ' : ''}${tags['addr:street']}`
          : "Address not available";

        return {
          id: el.id || idx,
          name,
          address,
          lat: el.lat,
          lng: el.lon,
          rating: (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1)
        };
      })
      .filter(doc => doc.lat && doc.lng);

    if (doctors.length === 0) {
      doctors = fallbackData;
    } else {
      doctors = doctors.slice(0, 5);
    }

    res.json(doctors);
  } catch (err) {
    console.error('Overpass API Exception Error:', err);
    res.json(fallbackData);
  }
});

// Endpoint to initiate emergency call
app.post('/call', async (req, res) => {
  const { phone } = req.body;
  const targetPhone = phone || '+918295444111';

  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM;

  let client;
  try {
    client = twilio(sid, token);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to initialize Twilio client', details: err.message });
  }

  try {
    const call = await client.calls.create({
      to: targetPhone || "+919870202446",
      from: fromNumber || "+19785414346",
      twiml: `
    <Response>
      <Play>https://api.twilio.com/cowbell.mp3</Play>
      <Say voice="Polly.Aditi" language="en-IN">
        Emergency alert. The patient has moved outside the safe zone. Please check immediately.
      </Say>
    </Response>
  `
    });
    console.log(`Call initiated to ${targetPhone}, SID: ${call.sid}`);
    res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error('Twilio Call Error:', err);
    res.status(500).json({ error: 'Failed to initiate call', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
