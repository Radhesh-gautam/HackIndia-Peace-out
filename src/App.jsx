import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Patient from './pages/Patient';
import LiveTracking from './pages/LiveTracking';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (err) {
        console.error("Supabase session error:", err);
      } finally {
        setLoading(false);
      }
    }

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Initializing Portal...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/patient" />} />
        <Route path="/signup" element={!session ? <Signup /> : <Navigate to="/patient" />} />
        <Route path="/patient" element={session ? <Patient /> : <Navigate to="/login" />} />
        <Route path="/tracking" element={<LiveTracking />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
