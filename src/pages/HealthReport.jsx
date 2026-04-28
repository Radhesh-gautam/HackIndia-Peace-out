import React, { useState, useRef } from 'react';

export default function HealthReport() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [expandedCard, setExpandedCard] = useState(null);
  const timelineRef = useRef(null);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        date: new Date().toLocaleDateString(),
        url: URL.createObjectURL(file)
      });
      setSummary(`Patient shows mild memory decline consistent with early-stage Alzheimer’s.\nOccasional confusion observed in recent activity patterns.\nDaily routine and medication adherence need supervision.\nContinued monitoring and structured care recommended.`);
    }
  };

  const scrollToTimeline = () => {
    if (timelineRef.current) {
      timelineRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Automatically expand the orientation card related to the wandering alert
      setExpandedCard('orientation');
    }
  };

  const timelineData = {
    memory: [
      { time: 'Today, 9:15 AM', event: 'Missed medication', type: 'warning' },
      { time: 'Yesterday, 8:00 AM', event: 'Took medication', type: 'success' },
      { time: 'Mon, 9:20 AM', event: 'Missed medication', type: 'warning' }
    ],
    orientation: [
      { time: 'Yesterday, 6:40 PM', event: 'Wandered outside safe zone', type: 'critical' },
      { time: 'Yesterday, 10:00 AM', event: 'Completed daily walk in garden', type: 'success' }
    ],
    caretaker: [
      { time: 'Today, 2:00 PM', event: 'No interaction for 3 hours', type: 'warning' },
      { time: 'Today, 10:30 AM', event: 'Caretaker visit logged', type: 'success' }
    ],
    activity: [
      { time: 'Today, 1:30 PM', event: 'Skipped lunch', type: 'warning' },
      { time: 'Today, 8:00 AM', event: 'Ate breakfast completely', type: 'success' }
    ]
  };

  const EventCard = ({ id, title, recentEvent, time, icon, color }) => {
    const isExpanded = expandedCard === id;
    return (
      <div 
        onClick={() => setExpandedCard(isExpanded ? null : id)}
        style={{
          backgroundColor: 'white',
          padding: '24px 20px',
          borderRadius: '16px',
          boxShadow: isExpanded ? '0 12px 28px rgba(0,0,0,0.06)' : '0 4px 12px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          border: '1px solid #f1f5f9',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isExpanded ? 'translateY(-4px)' : 'none'
        }}
        onMouseOver={(e) => { 
          if(!isExpanded) {
            e.currentTarget.style.transform = 'translateY(-2px)'; 
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.04)'; 
          }
        }}
        onMouseOut={(e) => { 
          if(!isExpanded) {
            e.currentTarget.style.transform = 'none'; 
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)'; 
          }
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#94a3b8' }}>{icon}</span>
            {title}
          </h4>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ color: '#1e293b', fontSize: '1.05rem', fontWeight: 600 }}>{recentEvent}</strong>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{time}</span>
        </div>

        {isExpanded && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', animation: 'fadeIn 0.4s ease' }}>
            <h5 style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Timeline</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {timelineData[id].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ 
                    marginTop: '6px',
                    width: '6px', 
                    height: '6px', 
                    borderRadius: '50%', 
                    backgroundColor: item.type === 'critical' ? '#ef4444' : item.type === 'warning' ? '#f59e0b' : '#10b981',
                    boxShadow: `0 0 0 2px ${item.type === 'critical' ? '#fee2e2' : item.type === 'warning' ? '#fef3c7' : '#d1fae5'}`
                  }} />
                  <div>
                    <div style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 500 }}>{item.event}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in" style={{
      padding: '10px 20px 40px',
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      color: '#333'
    }}>
      {/* Header & Upload */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '35px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: '#0f172a', fontWeight: 700 }}>Cognitive Health Monitor</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Last updated: Today, 10:30 AM
          </p>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
            {uploadedFile && (
              <button 
                onClick={() => window.open(uploadedFile.url, '_blank')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#334155',
                  transition: 'all 0.2s ease',
                  gap: '6px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              >
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                View Report
              </button>
            )}
            <input 
              type="file" 
              id="report-upload" 
              style={{ display: 'none' }} 
              accept=".pdf,image/*"
              onChange={handleFileUpload}
            />
            <label htmlFor="report-upload" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: '#475569',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <svg style={{ width: '16px', height: '16px', marginRight: '8px', stroke: 'currentColor', fill: 'none' }} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              {uploadedFile ? 'Update' : 'Upload Report'}
            </label>
          </div>
          
          {uploadedFile && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748b', animation: 'fadeIn 0.3s ease' }}>
              {uploadedFile.name} <span style={{ opacity: 0.7 }}>({uploadedFile.date})</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Banner */}
      <div 
        onClick={scrollToTimeline}
        style={{
          backgroundColor: '#fffaf0',
          border: '1px solid #feebc8',
          borderLeft: '4px solid #f59e0b',
          padding: '16px 20px',
          borderRadius: '10px',
          marginBottom: '25px',
          color: '#b45309',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fff7e6'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.1)'; }}
        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fffaf0'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <strong style={{ fontWeight: 600 }}>Increased confusion detected in recent activity</strong>
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
          Click to view event
          <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </span>
      </div>

      {/* AI Summary */}
      {uploadedFile && summary && (
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        border: '1px solid #f1f5f9',
        marginBottom: '40px',
        animation: 'fadeIn 0.4s ease'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
          <svg style={{ width: '16px', height: '16px', color: '#6366f1' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
          AI Summary
        </h3>
        <div style={{ margin: 0, color: '#475569', lineHeight: '1.7', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {summary.split('\n').map((line, idx) => (
            <span key={idx}>{line}</span>
          ))}
        </div>
      </div>
      )}

      {/* Event-Based Condition Cards */}
      <div ref={timelineRef} style={{ scrollMarginTop: '20px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', color: '#1e293b', fontWeight: 600 }}>Real-Time Activity Monitoring</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px'
        }}>
          <EventCard 
            id="memory"
            title="Memory Status" 
            recentEvent="Missed medication"
            time="Today, 9:15 AM"
            color="#f59e0b" // Yellow
            icon={<svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
          />
          <EventCard 
            id="orientation"
            title="Orientation" 
            recentEvent="Wandered outside safe zone"
            time="Yesterday, 6:40 PM"
            color="#ef4444" // Red
            icon={<svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>}
          />
          <EventCard 
            id="caretaker"
            title="Caretaker Interaction" 
            recentEvent="No interaction for 3 hours"
            time="Today, 2:00 PM"
            color="#f59e0b" // Yellow
            icon={<svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
          />
          <EventCard 
            id="activity"
            title="Daily Activity" 
            recentEvent="Skipped lunch"
            time="Today, 1:30 PM"
            color="#f59e0b" // Yellow
            icon={<svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
