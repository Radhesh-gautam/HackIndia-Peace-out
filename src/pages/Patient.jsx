import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './PatientDashboard.css';
import LiveTracking from './LiveTracking';
import HealthReport from './HealthReport';
import Appointments from './Appointments';
import ComplaintAlerts from './ComplaintAlerts';

// Fix Leaflet Icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

export default function Patient() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [activeView, setActiveView] = useState('profile'); // Added for sub-navigation
  
  // --- 1. PATIENT PROFILE STATE ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profile, setProfile] = useState(null);

  // --- 2. VITALS STATE ---
  const [vitals, setVitals] = useState(null);

  // --- 3. OTHER STATES ---
  const [location, setLocation] = useState([28.61, 77.23]);
  const [isWandering, setIsWandering] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [reportSummary, setReportSummary] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [appointments, setAppointments] = useState([{ id: 1, date: '2026-05-10', time: '10:30', doctor: 'Dr. Sarah Smith' }]);
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState('');

  // Initialization (Load data from backend)
  useEffect(() => {
    fetch('http://localhost:5000/api/patient-data')
      .then(res => res.json())
      .then(data => {
        setProfile(data.profile);
        setVitals(data.vitals);
        setFormData(data.profile);
      })
      .catch(err => console.error("Failed to load patient data:", err));
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      setProfile(formData);
      fetch('http://localhost:5000/api/patient-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).catch(err => console.error("Failed to save patient data:", err));
    } else {
      setFormData(profile);
    }
    setIsEditing(!isEditing);
  };

  const handleLogout = () => navigate('/');

  // --- SUB-COMPONENTS ---

  const Sparkline = ({ data, color, max }) => (
    <div className="sparkline-container">
      {data.map((val, i) => (
        <div key={i} className="sparkline-bar" style={{ height: `${(val / max) * 100}%`, backgroundColor: color, opacity: 0.3 + (i / 10) }}></div>
      ))}
    </div>
  );

  const VitalCard = ({ label, value, unit, history, color, max }) => (
    <div className="vital-card">
      <div className="vital-label">{label}</div>
      <div className="vital-value count-up" key={value}>{value}<span style={{ fontSize: '1rem', marginLeft: '4px', opacity: 0.6 }}>{unit}</span></div>
      <Sparkline data={history} color={color} max={max} />
      <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }}></div></div>
    </div>
  );

  const DashboardOverview = () => {
    if (activeView === 'medical') return <MedicalDetails />;

    return (
      <div className="fade-in">
        <div className="section-header">
          <h1>Health Dashboard</h1>
          <p>Real-time monitoring and profile management.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>Patient Profile</h3>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={handleEditToggle}>
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>
            <div className="profile-avatar-wrapper"><div className="profile-avatar">{profile.name.charAt(0)}</div></div>
            
            <div className="profile-field-row">
              <label htmlFor="profile-name">Name</label>
              {isEditing ? (
                <input 
                  id="profile-name" 
                  name="name"
                  className="inline-edit-input" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              ) : (
                <strong>{profile.name}</strong>
              )}
            </div>
            
            <div className="profile-field-row">
              <label htmlFor="profile-age">Age</label>
              {isEditing ? (
                <input 
                  id="profile-age" 
                  name="age"
                  className="inline-edit-input" 
                  type="number" 
                  value={formData.age || ''} 
                  onChange={e => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })} 
                />
              ) : (
                <strong>{profile.age} Years</strong>
              )}
            </div>
            
            <div className="profile-field-row">
              <label htmlFor="profile-condition">Condition</label>
              {isEditing ? (
                <input 
                  id="profile-condition" 
                  name="condition"
                  className="inline-edit-input" 
                  value={formData.condition || ''} 
                  onChange={e => setFormData({ ...formData, condition: e.target.value })} 
                />
              ) : (
                <strong>{profile.condition}</strong>
              )}
            </div>
          </div>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <VitalCard label="Heart Rate" value={vitals.heartRate.current} unit={vitals.heartRate.unit} history={vitals.heartRate.history} color={vitals.heartRate.color} max={vitals.heartRate.max} />
              <VitalCard label="Blood Oxygen" value={vitals.oxygen.current} unit={vitals.oxygen.unit} history={vitals.oxygen.history} color={vitals.oxygen.color} max={vitals.oxygen.max} />
              <VitalCard label="Temperature" value={vitals.temp.current} unit={vitals.temp.unit} history={vitals.temp.history} color={vitals.temp.color} max={vitals.temp.max} />
              <VitalCard label="Daily Steps" value={vitals.steps.current} unit={vitals.steps.unit} history={vitals.steps.history} color={vitals.steps.color} max={vitals.steps.max} />
            </div>
            <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', borderRadius: '16px' }} onClick={() => setActiveView('medical')}>
              View Medical Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const MedicalDetails = () => (
    <div className="fade-in">
      <div className="section-header">
        <button className="btn-secondary" style={{ marginBottom: '1rem', padding: '0.5rem 1rem' }} onClick={() => setActiveView('profile')}>
          ← Back to Dashboard
        </button>
        <h1>Medical Details</h1>
        <p>Comprehensive history and active prescriptions for {profile.name}.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h3>📜 Patient History</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {profile.history.map((item, i) => (
              <li key={i} style={{ padding: '1rem 0', borderBottom: '1px solid #f0f0f0', color: '#444' }}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3>💊 Active Medications</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {profile.medications.map((med, i) => (
              <div key={i} style={{ padding: '0.75rem 1.25rem', background: '#f0f7f4', color: '#2a5a43', borderRadius: '100px', fontWeight: 600, fontSize: '0.9rem' }}>
                {med}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!profile || !vitals) {
       return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading patient data...</div>;
    }
    switch (activePage) {
      case 'dashboard': return <DashboardOverview />;
      case 'tracking': return <LiveTracking />;
      case 'reports': return <HealthReport />;
      case 'appointments': return <Appointments />;
      case 'alerts': return <ComplaintAlerts />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-logo"><div className="sidebar-logo-dot"></div><span>HealthCare AR</span></div>
        <ul className="sidebar-menu">
          <li className={`sidebar-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => { setActivePage('dashboard'); setActiveView('profile'); }}><span>📊</span> Dashboard</li>
          <li className={`sidebar-item ${activePage === 'tracking' ? 'active' : ''}`} onClick={() => setActivePage('tracking')}><span>📍</span> Live Tracking</li>
          <li className={`sidebar-item ${activePage === 'reports' ? 'active' : ''}`} onClick={() => setActivePage('reports')}><span>📄</span> Health Reports</li>
          <li className={`sidebar-item ${activePage === 'appointments' ? 'active' : ''}`} onClick={() => setActivePage('appointments')}><span>📅</span> Appointments</li>
          <li className={`sidebar-item ${activePage === 'alerts' ? 'active' : ''}`} onClick={() => setActivePage('alerts')}><span>🚨</span> Alerts & Complaints</li>
        </ul>
        <div className="sidebar-footer"><li className="sidebar-item" onClick={handleLogout} style={{ color: '#e53e3e' }}><span>🚪</span> Logout</li></div>
      </aside>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}
