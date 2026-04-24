import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ArrowLeft, Send } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { API_URL } from '../config';

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: string;
  sender: { username: string, avatarUrl?: string };
}

interface Props {
  userId: number;
  onBack: () => void;
}

const ChatWidget = ({ userId, onBack }: Props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const token = localStorage.getItem('token');
  const currentUsername = localStorage.getItem('username');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await axios.post(`${API_URL}/api/messages`, {
        receiverId: userId,
        content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent('');
      fetchMessages();
    } catch (err) {
      alert('Failed to send message');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'transparent' }}>
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={onBack} className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '12px' }}>
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>Chat</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map(msg => {
          const isMine = msg.sender.username === currentUsername;
          return (
            <div key={msg.id} style={{ 
              alignSelf: isMine ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              flexDirection: isMine ? 'row-reverse' : 'row',
              gap: '0.6rem',
              alignItems: 'flex-end'
            }}>
              {!isMine && <UserAvatar url={msg.sender.avatarUrl} size={28} />}
              <div style={{ 
                padding: '0.75rem 1.1rem', 
                borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                backgroundColor: isMine ? 'var(--primary)' : 'var(--secondary-container)',
                color: isMine ? 'var(--on-primary)' : 'var(--on-secondary-container)',
                fontSize: '0.95rem',
                lineHeight: '1.4',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Start a new message" 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          style={{ 
            flex: 1, 
            padding: '0.8rem 1.25rem', 
            borderRadius: '24px', 
            border: 'none', 
            backgroundColor: 'var(--input-bg)', 
            color: 'var(--text)', 
            outline: 'none',
            fontSize: '0.95rem'
          }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '0', width: '44px', height: '44px', borderRadius: '16px', flexShrink: 0 }}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;