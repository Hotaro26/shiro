import React, { useEffect, useState } from 'react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface Props {
  onEmojiClick: (emoji: EmojiClickData) => void;
  onGifUrlSubmit: (url: string) => void;
  onClose: () => void;
}

const EmojiPickerPopup = ({ onEmojiClick, onGifUrlSubmit, onClose }: Props) => {
  const [gifUrl, setGifUrl] = useState('');
  const [activeTab, setActiveTab] = useState('emoji');
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? Theme.DARK : Theme.LIGHT;
    setTheme(currentTheme);
  }, []);

  const handleGifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gifUrl.trim()) {
      onGifUrlSubmit(gifUrl);
      onClose();
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      marginTop: '8px',
      left: 0,
      zIndex: 1000,
      width: '350px',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      backgroundColor: 'var(--bg)',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', padding: '0.75rem', gap: '0.5rem', backgroundColor: 'var(--bg)' }}>
        <button 
          type="button"
          onClick={() => setActiveTab('gif')} 
          style={{ 
            flex: 1, 
            padding: '0.5rem', 
            borderRadius: '999px',
            background: activeTab === 'gif' ? 'var(--text)' : 'var(--input-bg)',
            fontWeight: 'bold',
            border: 'none',
            color: activeTab === 'gif' ? 'var(--bg)' : 'var(--text-light)'
          }}
        >
          GIFs
        </button>
        <button 
          type="button"
          onClick={() => setActiveTab('emoji')} 
          style={{ 
            flex: 1, 
            padding: '0.5rem', 
            borderRadius: '999px',
            background: activeTab === 'emoji' ? 'var(--text)' : 'var(--input-bg)',
            fontWeight: 'bold',
            border: 'none',
            color: activeTab === 'emoji' ? 'var(--bg)' : 'var(--text-light)'
          }}
        >
          Emoji
        </button>
      </div>

      {activeTab === 'emoji' ? (
        <EmojiPicker 
          onEmojiClick={(emojiData) => onEmojiClick(emojiData)}
          width="100%"
          height={400}
          theme={theme}
        />
      ) : (
        <form onSubmit={handleGifSubmit} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 'bold' }}>Paste GIF URL</label>
          <input 
            type="text" 
            value={gifUrl} 
            onChange={(e) => setGifUrl(e.target.value)} 
            placeholder="https://..."
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg)', color: 'var(--text)' }}
            autoFocus
          />
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Add GIF</button>
        </form>
      )}
    </div>
  );
};

export default EmojiPickerPopup;
