import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { API_URL } from '../config';

interface Conversation {
  id: number;
  username: string;
  avatarUrl?: string;
}

interface Props {
  onSelectChat: (userId: number) => void;
}

const ConversationsList = ({ onSelectChat }: Props) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.get(`${API_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setConversations(res.data))
        .catch(err => console.error(err));
    }
  }, [token]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
      {conversations.length === 0 ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-light)' }}>
          <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>No messages yet</p>
          <p style={{ fontSize: '0.85rem' }}>Start a conversation from someone's profile!</p>
        </div>
      ) : (
        conversations.map(conv => (
          <div 
            key={conv.id} 
            onClick={() => onSelectChat(conv.id)}
            style={{ 
              display: 'flex', 
              gap: '1rem', 
              padding: '1rem', 
              cursor: 'pointer',
              borderRadius: '16px',
              transition: 'background 0.2s',
              alignItems: 'center'
            }}
            className="card-hover"
          >
            <UserAvatar url={conv.avatarUrl} size={52} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.05rem' }}>@{conv.username}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Click to open chat</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ConversationsList;