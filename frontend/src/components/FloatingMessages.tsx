import React, { useState, useEffect, useRef } from 'react';
import ConversationsList from './ConversationsList';
import ChatWidget from './ChatWidget';
import { Maximize2, Minimize2, X, GripHorizontal } from 'lucide-react';

interface Props {
  initialUserId?: number | null;
  onClose: () => void;
}

const FloatingMessages = ({ initialUserId, onClose }: Props) => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialUserId || null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [freeform, setFreeform] = useState(localStorage.getItem('freeform') === 'true');
  const [position, setPosition] = useState({ x: 24, y: 90 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = (e: any) => setFreeform(e.detail.enabled);
    window.addEventListener('freeform-toggle', handleToggle);
    return () => window.removeEventListener('freeform-toggle', handleToggle);
  }, []);

  useEffect(() => {
    if (initialUserId) setSelectedUserId(initialUserId);
  }, [initialUserId]);

  useEffect(() => {
    if (!isDragging || isFullScreen) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ 
        x: window.innerWidth - e.clientX - 200, // Roughly center the mouse on the widget header
        y: window.innerHeight - e.clientY + 20
      });
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
  }, [isDragging, isFullScreen]);

  return (
    <div style={{
      position: 'fixed',
      bottom: isFullScreen ? '0' : `${position.y}px`,
      right: isFullScreen ? '0' : `${position.x}px`,
      width: isFullScreen ? '100vw' : '400px',
      height: isFullScreen ? '100vh' : '550px',
      backgroundColor: 'rgba(var(--bg-rgb), 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: isFullScreen ? '0' : '28px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      overflow: 'hidden',
      transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {freeform && !isFullScreen && (
            <div 
              onMouseDown={() => setIsDragging(true)}
              style={{ cursor: 'grab', color: 'var(--text-light)', display: 'flex' }}
            >
              <GripHorizontal size={20} />
            </div>
          )}
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>Messages</h3>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="btn-ghost" style={{ padding: '0.6rem', borderRadius: '12px' }}>
            {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button onClick={onClose} className="btn-ghost" style={{ padding: '0.6rem', borderRadius: '12px' }}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {selectedUserId ? (
          <ChatWidget userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
        ) : (
          <ConversationsList onSelectChat={setSelectedUserId} />
        )}
      </div>
    </div>
  );
};

export default FloatingMessages;