import { createContext, useContext, useState, useEffect } from 'react';
import { msalInstance, msalReady } from './msal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Retry fetch with exponential backoff (handles cold-start 503s). */
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
  throw new Error('unreachable');
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Parse existing JWT on mount
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.sub, name: payload.name, email: payload.email, role: payload.role });
      } catch {
        setToken(null);
        localStorage.removeItem('token');
      }
    }
  }, [token]);

  // Handle MSAL redirect response (runs on any page after Microsoft redirects back)
  useEffect(() => {
    (async () => {
      try {
        await msalReady;
        const response = await msalInstance.handleRedirectPromise();

        if (response?.idToken) {
          try {
            const res = await fetchWithRetry(`${API_URL}/auth/microsoft/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.idToken }),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              console.error('Login failed:', res.status, body.error);
            } else {
              const data = await res.json();
              setSession(data.token, data.user);
            }
          } catch (err) {
            console.error('Login failed:', err);
          }
        }
      } catch (err) {
        console.error('MSAL initialization failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setSession(newToken, newUser) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin: user?.role === 'admin', setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
