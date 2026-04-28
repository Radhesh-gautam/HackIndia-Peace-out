import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  const floatingTags = [
    { text: "Face Recognition", icon: "👤", top: "15%", left: "5%" },
    { text: "Medicine Detection", icon: "💊", top: "30%", right: "2%" },
    { text: "Real-time Alerts", icon: "🔔", bottom: "25%", left: "10%" },
    { text: "Voice Assistance", icon: "🎙️", bottom: "40%", right: "15%" }
  ];

  const webFeatures = [
    { title: "Book Appointment", icon: "📅", desc: "Schedule visits with specialists." },
    { title: "View Reports", icon: "📄", desc: "Access medical history and results." },
    { title: "Track Progress", icon: "📈", desc: "Monitor recovery and vital stats." },
    { title: "Raise Complaint", icon: "🚨", desc: "Quick support for any concerns." }
  ];

  const faqs = [
    { q: "Is data secure?", a: "Yes, we use enterprise-grade encryption for all patient data and communication." },
    { q: "How does AR/VR help?", a: "It provides hands-free monitoring and real-time AI assistance for healthcare providers." },
    { q: "Is it real-time?", a: "Absolutely. Our system operates with sub-100ms latency for critical alerts." },
    { q: "Can family access data?", a: "Yes, family members can be granted secure access via our patient portal." }
  ];

  return (
    <div className="landing-page">
      <nav className="navbar">
        <h2>HealthCare AR</h2>
        <div className="nav-links">
          <button className="btn-secondary" style={{ marginRight: '1rem' }} onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/login')}>Get Started</button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>Your Smart Healthcare Journey Begins Here</h1>
          <p>AI-powered AR/VR system for real-time patient monitoring and assistance. Experience the future of care today.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-accent" onClick={() => navigate('/login')}>Explore System</button>
            <button className="btn-secondary" onClick={() => navigate('/login')}>Login Portal</button>
          </div>
        </div>
        <div className="hero-image-container">
          <img src="/ar_vr_healthcare_hero_1777277704200.png" alt="AR Healthcare" className="hero-main-img" />
          {floatingTags.map((tag, i) => (
            <div key={i} className="floating-tag" style={{ top: tag.top, left: tag.left, right: tag.right, bottom: tag.bottom }}>
              <span>{tag.icon}</span> {tag.text}
            </div>
          ))}
        </div>
      </section>

      {/* AR/VR FEATURES SECTION (DARK) */}
      <section className="dark-section" id="features">
        <div className="features-split">
          <div className="features-left">
            <span className="features-tag">Smart System</span>
            <h2>The Future of Smart Patient Care</h2>
            <p>Our AR/VR system provides real-time monitoring and AI-powered assistance, ensuring clinical excellence and patient safety.</p>
          </div>
          
          <div className="features-right">
            <div className="features-grid">
              {[
                { 
                  title: "Person Detection", 
                  desc: "Identify patients and caregivers using secure face recognition.",
                  icon: <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                },
                { 
                  title: "Voice Assistance", 
                  desc: "Instant voice interaction for immediate patient support.",
                  icon: <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                },
                { 
                  title: "Medicine Verification", 
                  desc: "AI detection for medication safety and accuracy.",
                  icon: <svg viewBox="0 0 24 24"><path d="M4.22 18.36c-1.91-1.91-1.91-5.01 0-6.92l6.92-6.92c1.91-1.91 5.01-1.91 6.92 0l2.12 2.12c1.91 1.91 1.91 5.01 0 6.92l-6.92 6.92c-1.91 1.91-5.01 1.91-6.92 0l-2.12-2.12z"/><path d="M10.5 7.5l6 6"/></svg>
                },
                { 
                  title: "Real-time Alerts", 
                  desc: "Immediate notifications for critical patient events.",
                  icon: <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                }
              ].map((f, i) => (
                <div key={i} className="feature-card-dark">
                  <div className="card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  </div>
                  <div className="feature-icon-wrapper">
                    {f.icon}
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT SECTION */}
      <section className="product-section">
        <div className="product-overlay"></div>
        <div className="product-content">
          <h2>Smart AR/VR Healthcare System</h2>
          <p>Real-time monitoring and assistance through intelligent wearable technology. Designed for clinical precision and patient safety.</p>
          <button className="btn-product">Explore Device</button>
        </div>
      </section>

      {/* WEBSITE FEATURES SECTION */}
      <section className="web-features">
        <h2 style={{ textAlign: 'center', marginBottom: '4rem', fontSize: '2.5rem' }}>Comprehensive Digital Platform</h2>
        <div className="web-grid">
          {webFeatures.map((f, i) => (
            <div key={i} className="web-card" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>{f.icon}</span>
              <h3 style={{ marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '900px' }}>
          <h2 style={{ fontSize: '3rem', marginBottom: '2rem' }}>Hardware Meets Software</h2>
          <p style={{ fontSize: '1.25rem', color: '#666' }}>
            Our platform seamlessly integrates high-performance AR/VR hardware with a robust web ecosystem. 
            By combining real-time edge computing on our glasses with secure cloud-based data management, 
            we provide a 360-degree monitoring solution that ensures patient safety and provider efficiency.
          </p>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="faq-section">
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Frequently Asked Questions</h2>
        {faqs.map((f, i) => (
          <div key={i} className="faq-item">
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-content">
          <h2>HealthCare AR</h2>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact Us</a>
          </div>
        </div>
        <div className="copyright">
          <p>© 2026 HealthCare AR Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

