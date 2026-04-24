import React from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Delete', 
  cancelText = 'Cancel' 
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onCancel}>
      <div className="glass" style={{ 
        maxWidth: '320px', 
        width: '90%', 
        padding: '1.5rem', 
        borderRadius: '28px', 
        backgroundColor: 'var(--surface)',
        animation: 'modalScale 0.2s cubic-bezier(0, 0, 0.2, 1)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
        <p style={{ color: 'var(--text-light)', lineHeight: '1.5', margin: '0.75rem 0 1.5rem', fontSize: '0.95rem' }}>{message}</p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button onClick={onCancel} className="btn-ghost" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            style={{ 
              backgroundColor: '#ba1a1a', 
              color: 'white',
              padding: '0.6rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '999px'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;