import React, { useState, useEffect } from 'react';

export default function ComplaintAlerts() {
  // 1. Medication Tracking Logic (Simulating history where medication was missed)
  const [medLogs, setMedLogs] = useState([
    { date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], taken: true },
    { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], taken: true },
    { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], taken: false },
    { date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], taken: false }
  ]);

  // 3. Caretaker Monitoring
  const [caretaker, setCaretaker] = useState({
    lastSeen: "4 hours ago",
    status: "Inactive"
  });

  // 4. Complaint System (Stores family & auto-generated complaints)
  const [complaintText, setComplaintText] = useState('');
  const [complaints, setComplaints] = useState([
    { id: 1, text: "Patient mentioned dizziness yesterday.", timestamp: new Date(Date.now() - 86400000).toLocaleString() }
  ]);

  // Alert & Warning State
  const [alert, setAlert] = useState(null);
  const [warnings, setWarnings] = useState([]);
  
  // Simulated AR Processing State
  const [arStatus, setArStatus] = useState('Scanning room environment...');

  // 5. Auto Alert & Complaint Generation
  useEffect(() => {
    let missedDays = 0;
    for (let i = medLogs.length - 1; i >= 0; i--) {
      if (!medLogs[i].taken) missedDays++;
      else break;
    }

    const newWarnings = [];
    let criticalAlert = null;
    const isCaretakerInactive = caretaker.status === "Inactive";

    if (missedDays === 1) {
      newWarnings.push("⚠ Medication missed today.");
    }

    if (isCaretakerInactive) {
      newWarnings.push("⚠ Caretaker inactive.");
    }

    if (missedDays > 1) {
      if (isCaretakerInactive) {
        criticalAlert = `🚨 Critical: No medication + no caretaker activity.`;
      } else {
        criticalAlert = `🚨 Patient missed medication for ${missedDays}+ days.`;
      }
    }

    setWarnings(newWarnings);
    setAlert(criticalAlert);

    // 6. AUTO COMPLAINT GENERATION
    let newAutoComplaints = [];
    if (criticalAlert && !complaints.some(c => c.text === `[SYSTEM AUTO-LOG] ${criticalAlert}`)) {
      newAutoComplaints.push({ id: Date.now() + '-' + Math.random().toString(36).substr(2, 6), text: `[SYSTEM AUTO-LOG] ${criticalAlert}`, timestamp: new Date().toLocaleString() });
    }
    newWarnings.forEach((warn, index) => {
      if (!complaints.some(c => c.text === `[SYSTEM AUTO-LOG] ${warn}`)) {
        newAutoComplaints.push({ id: Date.now() + '-' + index + '-' + Math.random().toString(36).substr(2, 6), text: `[SYSTEM AUTO-LOG] ${warn}`, timestamp: new Date().toLocaleString() });
      }
    });

    if (newAutoComplaints.length > 0) {
      setComplaints(prev => [...newAutoComplaints, ...prev]);
    }

  }, [medLogs, caretaker]); // Intentionally omitting complaints & alert from dependency to avoid infinite loop

  // Simulate real-time AR updates
  useEffect(() => {
    const timer = setInterval(() => {
      const statuses = [
        "Scanning pill dispenser...",
        "No movement detected in room.",
        "Analyzing patient vitals...",
        "Awaiting caretaker presence..."
      ];
      setArStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmitComplaint = () => {
    if (!complaintText.trim()) return;
    setComplaints([
      { id: Date.now() + '-' + Math.random().toString(36).substr(2, 6), text: complaintText, timestamp: new Date().toLocaleString() },
      ...complaints
    ]);
    setComplaintText('');
  };

  return (
    <div className="fade-in" style={{ padding: '10px 20px 40px', fontFamily: '"Inter", "Segoe UI", sans-serif', color: '#333' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>Complaints & Alerts</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Monitor medication adherence and caretaker activity.</p>
        </div>
        {/* 8. STATUS LABEL */}
        <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '10px 20px', borderRadius: '30px', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 10px rgba(29, 78, 216, 0.1)' }}>
          <span>🧠</span> Fully Automated Monitoring Enabled
        </div>
      </div>

      {/* 6. ALERT DISPLAY (CRITICAL) */}
      {alert && (
        <div style={{ backgroundColor: '#fef2f2', borderLeft: '6px solid #ef4444', padding: '20px', borderRadius: '12px', marginBottom: '30px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)', animation: 'pulse 2s infinite' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#b91c1c', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg style={{width:'24px', height:'24px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            CRITICAL SYSTEM ALERT
          </h3>
          <p style={{ margin: 0, color: '#991b1b', fontSize: '1.05rem', fontWeight: 600 }}>{alert}</p>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && !alert && (
        <div style={{ backgroundColor: '#fffbeb', borderLeft: '6px solid #f59e0b', padding: '16px', borderRadius: '12px', marginBottom: '30px' }}>
          {warnings.map((warn, idx) => (
            <p key={idx} style={{ margin: idx > 0 ? '8px 0 0 0' : 0, color: '#b45309', fontSize: '1rem', fontWeight: 600 }}>{warn}</p>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
        
        {/* Medication & Caretaker Status */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b' }}>AR Medication Log</h3>
            <span style={{ fontSize: '0.8rem', color: '#8b5cf6', backgroundColor: '#ede9fe', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="spinner" style={{ width: '8px', height: '8px', border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              {arStatus}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {medLogs.map((log, idx) => (
              <div key={idx} style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRadius: '8px', backgroundColor: log.taken ? '#dcfce3' : '#fef2f2', border: `1px solid ${log.taken ? '#bbf7d0' : '#fecaca'}` }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: log.taken ? '#166534' : '#991b1b', marginBottom: '4px', fontWeight: 600 }}>{log.date.slice(5)}</span>
                <span style={{ fontSize: '1.2rem' }}>{log.taken ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#475569', fontSize: '1rem' }}>Caretaker Presence (Camera Detected)</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <strong style={{ display: 'block', color: '#1e293b', fontSize: '1.1rem', marginBottom: '4px' }}>{caretaker.status}</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Last seen: {caretaker.lastSeen}</span>
              </div>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: caretaker.status === 'Active' ? '#22c55e' : '#ef4444', boxShadow: `0 0 10px ${caretaker.status === 'Active' ? '#22c55e' : '#ef4444'}` }}></div>
            </div>
          </div>
        </div>

        {/* Complaint System */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', color: '#1e293b' }}>File a Complaint (Optional)</h3>
          
          <textarea 
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Family members can optionally add notes here..."
            style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', resize: 'none', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', transition: 'border 0.2s' }}
            onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          ></textarea>
          
          <button 
            onClick={handleSubmitComplaint}
            style={{ padding: '10px 24px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', width: '100%', fontSize: '1rem' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e2e8f0'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f1f5f9'}
          >
            Submit Manual Complaint
          </button>

          <div style={{ marginTop: '30px' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#475569', fontSize: '1rem' }}>Recent Logs & Complaints</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '250px', overflowY: 'auto' }}>
              {complaints.length === 0 && <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No records found.</p>}
              {complaints.map(comp => (
                <div key={comp.id} style={{ 
                  padding: '16px', 
                  backgroundColor: comp.text.includes('[SYSTEM AUTO-LOG]') ? '#fef2f2' : '#f8fafc', 
                  borderRadius: '12px', 
                  border: `1px solid ${comp.text.includes('[SYSTEM AUTO-LOG]') ? '#fecaca' : '#e2e8f0'}` 
                }}>
                  <p style={{ margin: '0 0 8px 0', color: comp.text.includes('[SYSTEM AUTO-LOG]') ? '#b91c1c' : '#334155', fontSize: '0.95rem', lineHeight: '1.4', fontWeight: comp.text.includes('[SYSTEM AUTO-LOG]') ? 600 : 400 }}>{comp.text}</p>
                  <span style={{ fontSize: '0.8rem', color: comp.text.includes('[SYSTEM AUTO-LOG]') ? '#ef4444' : '#94a3b8', fontWeight: 500 }}>{comp.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
