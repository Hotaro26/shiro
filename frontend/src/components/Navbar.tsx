import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, Moon, Sun, Bird, Settings, X } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { API_URL } from '../config';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showSettings, setShowSettings] = useState(false);
  const [freeform, setFreeform] = useState(localStorage.getItem('freeform') === 'true');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('freeform', String(freeform));
    window.dispatchEvent(new CustomEvent('freeform-toggle', { detail: { enabled: freeform } }));
  }, [freeform]);

  useEffect(() => {
    if (token && username) {
      axios.get(`${API_URL}/api/users/${username}`)
        .then(res => setAvatarUrl(res.data.avatarUrl))
        .catch(() => {});
    }
  }, [token, username]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setAvatarUrl(undefined);
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav style={{ 
      padding: '0.75rem 1rem', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      position: 'sticky', 
      top: 0, 
      backgroundColor: 'rgba(var(--bg-rgb), 0.7)', 
      backdropFilter: 'blur(20px)', 
      WebkitBackdropFilter: 'blur(20px)',
      zIndex: 100,
      transition: 'background-color 0.2s',
      borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ maxWidth: '1200px', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ 
            fontSize: '1.6rem', 
            fontWeight: '900', 
            color: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem',
            textDecoration: 'none'
          }}>
            <div style={{ backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)', padding: '0.5rem', borderRadius: '14px', display: 'flex' }}>
              <Bird size={28} strokeWidth={2.5} />
            </div>
            <span style={{ letterSpacing: '-1.5px', textTransform: 'uppercase', fontStyle: 'italic' }}>SHIRO</span>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            {token && (
              <button onClick={() => setShowSettings(!showSettings)} className="btn-ghost" title="Settings" style={{ borderRadius: '12px', padding: '0.6rem' }}>
                <Settings size={22} color="var(--text)" />
              </button>
            )}

            {showSettings && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setShowSettings(false)} />
                <div className="glass" style={{ 
                  position: 'absolute', 
                  top: 'calc(100% + 12px)', 
                  right: 0, 
                  width: '280px', 
                  padding: '1.25rem', 
                  borderRadius: '24px', 
                  zIndex: 1000,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  animation: 'modalScale 0.2s cubic-bezier(0, 0, 0.2, 1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Settings</h3>
                    <button onClick={toggleTheme} className="btn-ghost" title="Toggle Theme" style={{ padding: '0.5rem' }}>
                      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--surface-variant)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Freeform Mode</div>
                    <div 
                      onClick={() => setFreeform(!freeform)}
                      style={{ 
                        width: '44px', 
                        height: '24px', 
                        backgroundColor: freeform ? 'var(--primary)' : 'var(--outline)', 
                        borderRadius: '12px', 
                        position: 'relative', 
                        cursor: 'pointer',
                        transition: 'background 0.3s'
                      }}
                    >
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        backgroundColor: 'white', 
                        borderRadius: '50%', 
                        position: 'absolute', 
                        top: '3px', 
                        left: freeform ? '23px' : '3px',
                        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to={`/profile/${username}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '0.4rem', 
                borderRadius: '50%',
                transition: 'background 0.2s',
                color: 'var(--text)',
                textDecoration: 'none'
              }}>
                <UserAvatar url={avatarUrl} size={36} />
              </Link>
              <button onClick={handleLogout} className="btn-ghost" title="Logout" style={{ padding: '0.6rem', color: 'var(--text-light)', borderRadius: '12px' }}>
                <LogOut size={22} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/login" style={{ fontWeight: 600, color: 'var(--text-light)', padding: '0 0.5rem', textDecoration: 'none' }}>Login</Link>
              <Link to="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Join Shiro</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
