import React, { useState } from 'react';

export default function Appointments() {
  const [searchState, setSearchState] = useState('idle'); // idle, searching, results, booking_success, finding_others
  const [errorMsg, setErrorMsg] = useState(null);
  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('healthcare_appointments');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 1, doctor: 'Dr. Mehta', spec: 'Neurologist', date: 'Friday', time: '5:00 PM' }
    ];
  });
  const [displayedDoctors, setDisplayedDoctors] = useState([]);

  const [locationQuery, setLocationQuery] = useState('');

  const fetchDoctorsFromBackend = async (latitude, longitude) => {
    try {
      const response = await fetch(`http://localhost:5000/api/doctors?lat=${latitude}&lng=${longitude}`);
      
      if (!response.ok) {
        console.log("Backend failed to respond correctly, falling back...");
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const sorted = data.sort((a, b) => {
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        });
        
        sorted[0].recommended = true;
        
        const finalizedDoctors = sorted.map(d => ({
          ...d, 
          spec: 'Neurologist', 
          avail: 'Open Now',
          dist: 'Nearby'
        }));
        
        setTimeout(() => {
          setDisplayedDoctors(finalizedDoctors);
          setSearchState('results');
        }, 1500);
      } else {
        setDisplayedDoctors([{
          id: 'mock-local',
          name: 'Nearby Clinic',
          spec: 'Neurologist',
          address: 'Fallback data',
          avail: 'Open Now',
          dist: 'Nearby',
          rating: '4.8',
          recommended: true
        }]);
        setSearchState('results');
      }
    } catch (err) {
      console.error(err);
      console.log("Backend failed");
      setErrorMsg("Using fallback doctor data");
      setDisplayedDoctors([{
        id: 'mock-local',
        name: 'Nearby Clinic',
        spec: 'Neurologist',
        address: 'Fallback data',
        avail: 'Open Now',
        dist: 'Nearby',
        rating: '4.8',
        recommended: true
      }]);
      setSearchState('results');
    }
  };

  const handleStartSearch = async () => {
    setSearchState('searching');
    setErrorMsg(null);
    
    if (locationQuery.trim() !== '') {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}`, {
          headers: { 'User-Agent': 'HealthcareDashboard/1.0' }
        });
        const geoData = await geoRes.json();
        
        if (geoData && geoData.length > 0) {
          const { lat, lon } = geoData[0];
          await fetchDoctorsFromBackend(lat, lon);
        } else {
          setErrorMsg('Location not found. Please try a different city or address.');
          setSearchState('idle');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Failed to find location coordinates.');
        setSearchState('idle');
      }
    } else {
      if (!navigator.geolocation) {
        setErrorMsg('Geolocation is not supported. Please enter a location manually.');
        setSearchState('idle');
        return;
      }

      navigator.geolocation.getCurrentPosition((position) => {
        fetchDoctorsFromBackend(position.coords.latitude, position.coords.longitude);
      }, (err) => {
        console.error(err);
        setErrorMsg('Location access denied. Please enter a location manually.');
        setSearchState('idle');
      });
    }
  };

  const handleNo = () => {
    setSearchState('finding_others');
    setTimeout(() => {
      const remaining = displayedDoctors.slice(1);
      if (remaining.length > 0) remaining[0].recommended = true;
      setDisplayedDoctors(remaining);
      setSearchState('results');
    }, 1500);
  };

  const handleYes = (doc) => {
    const newAppointments = [
      { id: Date.now(), doctor: doc.name, spec: doc.spec, date: 'Tomorrow', time: '10:30 AM' },
      ...appointments
    ];
    setAppointments(newAppointments);
    localStorage.setItem('healthcare_appointments', JSON.stringify(newAppointments));
    setSearchState('booking_success');
  };

  const DoctorCard = ({ doc }) => (
    <div style={{
      padding: '24px 20px',
      backgroundColor: 'white',
      borderRadius: '16px',
      border: doc.recommended ? '2px solid #8b5cf6' : '1px solid #f1f5f9',
      boxShadow: doc.recommended ? '0 8px 24px rgba(139, 92, 246, 0.12)' : '0 2px 8px rgba(0,0,0,0.02)',
      marginBottom: '20px',
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      {doc.recommended && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          backgroundColor: '#8b5cf6',
          color: 'white',
          padding: '4px 16px',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
        }}>
          ✨ Recommended by AI based on patient condition
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: doc.recommended ? '12px' : '0' }}>
        <div>
          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#1e293b' }}>{doc.name}</h4>
          <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#64748b' }}>{doc.spec}</p>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#94a3b8' }}>{doc.address}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'inline-block', backgroundColor: '#f0fdf4', color: '#166534', padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #bbf7d0' }}>
            {doc.avail}
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: '#475569', marginTop: '5px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg style={{width:'16px', height:'16px', color:'#94a3b8'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          {doc.dist}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg style={{width:'16px', height:'16px', color:'#fbbf24', fill:'#fbbf24'}} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          {doc.rating} Rating
        </span>
      </div>

      {doc.recommended && searchState === 'results' && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', animation: 'fadeIn 0.5s ease' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#334155', fontWeight: 500 }}>Do you want to book an appointment with {doc.name}?</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => handleYes(doc)}
              style={{ padding: '10px 24px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.2)' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#7c3aed'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#8b5cf6'}
            >
              Yes, Book
            </button>
            <button 
              onClick={handleNo}
              style={{ padding: '10px 24px', backgroundColor: 'white', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f8fafc'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              No, Show Others
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fade-in" style={{ padding: '10px 20px 40px', fontFamily: '"Inter", "Segoe UI", sans-serif', color: '#333' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>AI Appointment Assistant</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Intelligent booking based on patient context.</p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '8px', marginBottom: '24px', color: '#991b1b', fontSize: '0.95rem' }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      )}

      {/* AI Search Section */}
      <div style={{ backgroundColor: '#f8fafc', padding: '30px', borderRadius: '20px', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
        
        {searchState === 'idle' && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '10px 20px', borderRadius: '30px', marginBottom: '24px', fontSize: '0.95rem', fontWeight: 500 }}>
              <svg style={{width:'18px', height:'18px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Patient Condition: Alzheimer's
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="Enter city or area (e.g. London)" 
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                style={{ padding: '14px 20px', width: '100%', maxWidth: '350px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', outline: 'none', transition: 'border 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '8px 0 0 0' }}>Leave blank to use your current GPS location</p>
            </div>

            <button 
              onClick={handleStartSearch}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 32px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <svg style={{width:'20px', height:'20px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Ask AI to Find Doctors
            </button>
          </div>
        )}

        {(searchState === 'searching' || searchState === 'finding_others') && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div className="spinner" style={{ 
              width: '44px', height: '44px', border: '4px solid #e2e8f0', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px'
            }}></div>
            <p style={{ color: '#475569', fontSize: '1.15rem', margin: 0, fontWeight: 500, animation: 'pulse 1.5s infinite' }}>
              {searchState === 'searching' ? 'AI Agent is searching nearby neurologists...' : 'Finding more options...'}
            </p>
          </div>
        )}

        {searchState === 'results' && (
          <div className="fade-in">
            <h3 style={{ margin: '0 0 24px 0', fontSize: '1.25rem', color: '#1e293b', fontWeight: 600 }}>Found {displayedDoctors.length} Specialists</h3>
            <div>
              {displayedDoctors.length > 0 ? displayedDoctors.map(doc => <DoctorCard key={doc.id} doc={doc} />) : <p>No doctors found.</p>}
            </div>
          </div>
        )}

        {searchState === 'booking_success' && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '40px 0', color: '#166534' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#dcfce3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#166534' }}>
              <svg style={{width:'32px', height:'32px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: 700 }}>Appointment Confirmed!</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '1.1rem' }}>Your session has been successfully scheduled.</p>
            <button 
              onClick={() => { setSearchState('idle'); setDisplayedDoctors([]); }}
              style={{ marginTop: '30px', padding: '10px 24px', backgroundColor: 'white', color: '#8b5cf6', border: '2px solid #8b5cf6', borderRadius: '10px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.target.style.backgroundColor = '#8b5cf6'; e.target.style.color = 'white'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.color = '#8b5cf6'; }}
            >
              Book Another
            </button>
          </div>
        )}
      </div>

      {/* Upcoming Appointments List */}
      <div>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#1e293b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg style={{width:'20px', height:'20px', color:'#64748b'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          Upcoming Appointments
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {appointments.map(app => (
            <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', minWidth: '90px', border: '1px solid #e2e8f0' }}>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '1.2rem', marginBottom: '4px' }}>{app.date === 'Tomorrow' ? 'TMR' : app.date.slice(0, 3).toUpperCase()}</strong>
                <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>{app.time}</span>
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '1.15rem' }}>{app.doctor}</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{app.spec}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
}
