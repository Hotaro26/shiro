import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Home, Mail, GripHorizontal } from 'lucide-react';
import FloatingMessages from './FloatingMessages';

const BottomNav = () => {
  const token = localStorage.getItem('token');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [initialUserId, setInitialUserId] = useState<number | null>(null);
  const [freeform, setFreeform] = useState(localStorage.getItem('freeform') === 'true');
  const [position, setPosition] = useState({ x: 50, y: 24, isPercentage: true });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = (e: any) => setFreeform(e.detail.enabled);
    window.addEventListener('freeform-toggle', handleToggle);
    return () => window.removeEventListener('freeform-toggle', handleToggle);
  }, []);

  useEffect(() => {
    const handleOpenChat = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.userId) {
        setInitialUserId(customEvent.detail.userId);
      }
      setIsMessagesOpen(true);
    };
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: window.innerHeight - e.clientY, isPercentage: false });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!token) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    bottom: position.isPercentage ? `${position.y}px` : `${position.y}px`,
    left: position.isPercentage ? `${position.x}%` : `${position.x}px`,
    transform: position.isPercentage ? 'translateX(-50%)' : 'translate(-50%, 50%)',
    backgroundColor: 'rgba(var(--bg-rgb), 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
    padding: '0.8rem 1.6rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: 1000,
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
    transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    cursor: freeform ? 'default' : 'pointer'
  };

  return (
    <>
      <div 
        ref={dragRef}
        onMouseEnter={() => !freeform && setIsExpanded(true)}
        onMouseLeave={() => !freeform && setIsExpanded(false)}
        style={style}
      >
        {freeform && (
          <div 
            onMouseDown={() => setIsDragging(true)}
            style={{ cursor: 'grab', padding: '0.2rem', color: 'var(--text-light)', display: 'flex' }}
          >
            <GripHorizontal size={20} />
          </div>
        )}
        <Link to="/" style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, textDecoration: 'none' }}>
          <div style={{ padding: '0.4rem', borderRadius: '12px', background: isExpanded || freeform ? 'var(--primary-container)' : 'transparent', color: isExpanded || freeform ? 'var(--on-primary-container)' : 'var(--text)', transition: 'all 0.3s' }}>
            <Home size={22} strokeWidth={2.5} />
          </div>
          <span style={{ 
            maxWidth: (isExpanded || freeform) ? '100px' : '0', 
            opacity: (isExpanded || freeform) ? 1 : 0, 
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>Home</span>
        </Link>
        <div onClick={() => setIsMessagesOpen(!isMessagesOpen)} style={{ color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, cursor: 'pointer' }}>
          <div style={{ padding: '0.4rem', borderRadius: '12px', background: isExpanded || freeform ? 'var(--secondary-container)' : 'transparent', color: isExpanded || freeform ? 'var(--on-secondary-container)' : 'var(--text)', transition: 'all 0.3s' }}>
            <Mail size={22} strokeWidth={2.5} />
          </div>
          <span style={{ 
            maxWidth: (isExpanded || freeform) ? '100px' : '0', 
            opacity: (isExpanded || freeform) ? 1 : 0, 
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            overflow: 'hidden'
          }}>Messages</span>
        </div>
      </div>

      {isMessagesOpen && (
        <FloatingMessages 
          initialUserId={initialUserId} 
          onClose={() => {
            setIsMessagesOpen(false);
            setInitialUserId(null);
          }} 
        />
      )}
    </>
  );
};

export default BottomNav;
