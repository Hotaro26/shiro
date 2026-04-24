import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Plus, Hash, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { API_URL } from '../config';

interface Forum {
  id: number;
  name: string;
  description: string | null;
  creatorId: number;
  _count: { posts: number };
}

const parseJwt = (t: string) => {
  try { return JSON.parse(atob(t.split('.')[1])); } catch (e) { return null; }
};

const LeftSidebar = () => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newForumName, setNewForumName] = useState('');
  const [newForumDesc, setNewForumDesc] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, forumId: number | null }>({ isOpen: false, forumId: null });
  
  const token = localStorage.getItem('token');
  const currentUserId = token ? parseJwt(token)?.userId : null;

  const fetchForums = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/forums`);
      setForums(res.data);
    } catch (err) {
      console.error('Failed to fetch forums', err);
    }
  };

  useEffect(() => {
    fetchForums();
  }, []);

  const handleCreateForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForumName.trim()) return;

    try {
      await axios.post(`${API_URL}/api/forums`, 
        { name: newForumName.trim(), description: newForumDesc }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewForumName('');
      setNewForumDesc('');
      setIsCreating(false);
      fetchForums();
    } catch (err) {
      alert('Failed to create forum (name might be taken).');
    }
  };

  const handleDeleteForum = async () => {
    if (!deleteModal.forumId) return;
    try {
      await axios.delete(`${API_URL}/api/forums/${deleteModal.forumId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModal({ isOpen: false, forumId: null });
      fetchForums();
    } catch (err) {
      alert('Failed to delete forum');
    }
  };

  return (
    <div style={{ width: '250px', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '70px', height: 'calc(100vh - 70px)', overflowY: 'auto' }} className="hide-mobile">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.25rem', marginBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.02rem' }}>
          FORUMS
        </h3>
        {token && (
          <button onClick={() => setIsCreating(!isCreating)} className="btn-tonal" style={{ padding: '0.4rem', borderRadius: '12px' }} title="Create Forum">
            <Plus size={18} />
          </button>
        )}
      </div>

      {isCreating && token && (
        <form onSubmit={handleCreateForum} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', margin: '0 1rem 1rem', borderRadius: '16px', backgroundColor: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}>
          <input 
            type="text" 
            placeholder="Forum Name" 
            value={newForumName} 
            onChange={(e) => setNewForumName(e.target.value.replace(/\s+/g, '-').toLowerCase())} 
            required 
            style={{ padding: '0.6rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg)', color: 'var(--text)', outline: 'none', fontSize: '0.9rem' }}
          />
          <input 
            type="text" 
            placeholder="Description" 
            value={newForumDesc} 
            onChange={(e) => setNewForumDesc(e.target.value)} 
            style={{ padding: '0.6rem', borderRadius: '8px', border: 'none', backgroundColor: 'var(--bg)', color: 'var(--text)', outline: 'none', fontSize: '0.9rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>Create</button>
            <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '0.5rem', borderRadius: '8px', background: 'transparent', color: 'var(--on-secondary-container)', fontSize: '0.85rem', fontWeight: 600 }}>Cancel</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', padding: '0 0.5rem' }}>
        {forums.map(forum => (
          <div key={forum.id} style={{ display: 'flex', alignItems: 'center', borderRadius: '12px', marginBottom: '2px', transition: 'background 0.2s' }} className="forum-item">
            <Link to={`/f/${forum.name}`} style={{ flex: 1, padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.1rem', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary-container)', color: 'var(--on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
                  {forum.name[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>{forum.name}</span>
              </div>
            </Link>
            {currentUserId === forum.creatorId && (
              <button onClick={() => setDeleteModal({ isOpen: true, forumId: forum.id })} className="btn-ghost" style={{ marginRight: '0.4rem', color: 'var(--text-light)', opacity: 0.6, padding: '0.4rem' }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {forums.length === 0 && <div style={{ padding: '2rem 1rem', color: 'var(--text-light)', fontSize: '0.9rem', textAlign: 'center' }}>No forums found</div>}
      </div>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Delete Forum?"
        message="This will delete the forum and all posts within it. This action cannot be undone."
        onConfirm={handleDeleteForum}
        onCancel={() => setDeleteModal({ isOpen: false, forumId: null })}
      />
    </div>
  );
};

export default LeftSidebar;