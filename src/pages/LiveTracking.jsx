import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet Marker Icon Issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map center
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// Component to handle map clicks to update safe zone
function MapClickHandler({ setSafeZone }) {
  useMapEvents({
    click(e) {
      setSafeZone({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function LiveTracking() {
  // CONFIG & STATE
  const [safeZone, setSafeZone] = useState({ lat: 28.61, lng: 77.23 });
  const [safeRadius, setSafeRadius] = useState(200); // Meters
  const [caretakerPhone, setCaretakerPhone] = useState("+91 9870202446");

  const [position, setPosition] = useState([28.61, 77.23]);
  const [distance, setDistance] = useState(0);
  const [isOutside, setIsOutside] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState(null);

  // Haversine Distance Logic
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // meters
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(p1) * Math.cos(p2) *
      Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const makeEmergencyCall = async (phone) => {
    const targetPhone = phone || "+919870202446";
    console.log("Triggering emergency call via backend for", targetPhone);
    try {
      const response = await fetch('http://localhost:5000/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone })
      });
      const data = await response.json();
      if (data.success) {
        console.log("Call successfully triggered, SID:", data.callSid);
      } else {
        console.error("Backend failed to initiate call:", data.error);
      }
    } catch (err) {
      console.error("Failed to reach backend for emergency call:", err);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    // Using watchPosition for live tracking
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const currentPos = [latitude, longitude];
        setPosition(currentPos);
      },
      (err) => {
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Re-calculate distance whenever position, safeZone, or safeRadius changes
  useEffect(() => {
    const dist = calculateDistance(position[0], position[1], safeZone.lat, safeZone.lng);
    setDistance(dist);

    if (dist > safeRadius) {
      setIsOutside(true);
      if (!isCalling) {
        setIsCalling(true);
        makeEmergencyCall(caretakerPhone);
      }
    } else {
      setIsOutside(false);
      setIsCalling(false); // Stop calling if back in safe zone
    }
  }, [position, safeZone, safeRadius, caretakerPhone, isCalling]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Live Patient Tracking</h1>
            <p style={{ margin: '5px 0', color: '#666' }}>Smart Wandering Prevention System</p>
          </div>
          <div style={{
            padding: '8px 16px',
            borderRadius: '20px',
            backgroundColor: isOutside ? '#ffebee' : '#e8f5e9',
            color: isOutside ? '#c62828' : '#2e7d32',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isOutside ? '#c62828' : '#2e7d32',
              animation: isOutside ? 'blink 1s infinite' : 'none'
            }}></div>
            {isOutside ? 'STATUS: MISSING' : 'STATUS: PRESENT'}
          </div>
        </div>

        {/* Alert Banner */}
        {isOutside && (
          <div style={{
            backgroundColor: '#c62828',
            color: 'white',
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            boxShadow: '0 4px 12px rgba(198, 40, 40, 0.2)'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block' }}>Patient moved outside safe zone</strong>
              <span>Patient has moved {Math.round(distance - safeRadius)}m outside the safe zone.</span>
            </div>
          </div>
        )}

        {error && <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '8px' }}>Error: {error}</div>}

        {/* Controls Section */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          marginBottom: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {/* Radius Slider */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>
              Safe Zone Radius: {safeRadius}m
            </label>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={safeRadius}
              onChange={(e) => setSafeRadius(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <small style={{ color: '#888' }}>Drag to adjust safe radius</small>
          </div>

          {/* Caretaker Phone Input */}
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#555' }}>
              Caretaker Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. +91XXXXXXXXXX"
              value={caretakerPhone}
              onChange={(e) => setCaretakerPhone(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Map Container */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '15px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ height: '500px', width: '100%', borderRadius: '18px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', left: '50px', zIndex: 1000, backgroundColor: 'white', padding: '5px 10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontSize: '0.8rem', fontWeight: 'bold', opacity: 0.9 }}>
              ℹ️ Click anywhere on the map to set a new Safe Zone center
            </div>
            <MapContainer
              center={position}
              zoom={16}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <ChangeView center={position} />
              <MapClickHandler setSafeZone={setSafeZone} />

              {/* Satellite Map Layer (Esri) */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              />

              {/* Labels Layer for better visibility */}
              <TileLayer
                url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="http://stamen.com">Stamen Design</a>'
              />

              {/* Safe Zone Circle */}
              <Circle
                center={[safeZone.lat, safeZone.lng]}
                radius={safeRadius}
                pathOptions={{
                  color: '#4caf50',
                  fillColor: '#4caf50',
                  fillOpacity: 0.2,
                  dashArray: '10, 10'
                }}
              />

              {/* Patient Marker */}
              <Marker position={position}>
                <Tooltip permanent direction="top">Patient Location</Tooltip>
              </Marker>
            </MapContainer>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 10px', color: '#666', fontSize: '0.9rem', flexWrap: 'wrap', gap: '10px' }}>
            <div>Current Lat: {position[0].toFixed(5)}</div>
            <div>Current Lng: {position[1].toFixed(5)}</div>
            <div>Distance from Safe Zone: {Math.round(distance)}m</div>
          </div>
        </div>
      </div>

      {/* Simulated Call Popup */}
      {isCalling && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          zIndex: 1000,
          animation: 'slideUp 0.5s ease-out'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            backgroundColor: '#f44336',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            animation: 'pulseRed 2s infinite'
          }}>🚨</div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {caretakerPhone ? `Sending SOS to ${caretakerPhone}` : 'Alert Triggered!'}
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>Emergency Protocol Active</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
        @keyframes pulseRed { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); } 70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(244, 67, 54, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); } }
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
