import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { Calendar, MapPin, Link as LinkIcon, ArrowLeft, Image as ImageIcon, MessageSquare, Trash2, MessageCircle, Heart, Share2 } from 'lucide-react';
import { formatText } from '../utils/formatText';
import UserAvatar from '../components/UserAvatar';
import ConfirmModal from '../components/ConfirmModal';

interface UserProfile {
  id: number;
  username: string;
  bio?: string;
  avatarUrl?: string;
  createdAt: string;
  isFollowing: boolean;
  _count: { followers: number; following: number };
  posts: any[];
}

const parseJwt = (t: string) => {
  try { return JSON.parse(atob(t.split('.')[1])); } catch (e) { return null; }
};

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, postId: number | null }>({ isOpen: false, postId: null });
  
  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('username');
  const currentUserId = token ? parseJwt(token)?.userId : null;

  const fetchProfile = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/api/users/${username}`, { headers });
      setProfile(res.data);
      setEditBio(res.data.bio || '');
    } catch (err) {
      alert('User not found');
    }
  };

  useEffect(() => {
    fetchProfile();
    setIsEditing(false);
  }, [username, token]);

  const handleFollow = async () => {
    if (!token) return alert('Please login to follow');
    try {
      await axios.post(`${API_URL}/api/users/${username}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProfile();
    } catch (err) {
      alert('Follow failed');
    }
  };

  const handleDeletePost = async () => {
    if (!deleteModal.postId) return;
    try {
      await axios.delete(`${API_URL}/api/posts/${deleteModal.postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModal({ isOpen: false, postId: null });
      fetchProfile();
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('bio', editBio);
    if (editAvatar) formData.append('avatar', editAvatar);

    try {
      await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      alert('Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '2rem', position: 'sticky', top: 0, backgroundColor: 'rgba(var(--bg-rgb), 0.8)', backdropFilter: 'blur(16px)', zIndex: 10 }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: '0.6rem' }}>
          <ArrowLeft size={22} color="var(--text)" />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>{profile.username}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{profile.posts.length} Posts</span>
        </div>
      </div>

      {/* Banner */}
      <div style={{ height: '200px', backgroundColor: 'var(--surface-variant)' }}></div>
      
      {/* Profile Info */}
      <div style={{ padding: '1rem', position: 'relative', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', top: '-75px', left: '1rem', border: '4px solid var(--bg)', borderRadius: '50%', backgroundColor: 'var(--bg)', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <UserAvatar url={profile.avatarUrl} size={140} />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          {currentUser === username ? (
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              style={{ 
                borderRadius: '999px', 
                padding: '0.5rem 1.25rem', 
                border: '1px solid var(--outline)',
                background: 'var(--bg)',
                color: 'var(--text)',
                fontWeight: 600
              }}
            >
              {isEditing ? 'Cancel' : 'Edit profile'}
            </button>
          ) : token && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-chat', { detail: { userId: profile.id } }));
                }}
                style={{ 
                  borderRadius: '999px', 
                  padding: '0.5rem', 
                  border: '1px solid var(--outline)',
                  background: 'var(--bg)',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text)'
                }}
                title="Message"
              >
                <MessageSquare size={20} />
              </button>
              <button 
                onClick={handleFollow} 
                className={profile.isFollowing ? "btn-tonal" : "btn-primary"}
                style={{ minWidth: '100px' }}
              >
                {profile.isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} style={{ marginTop: '3.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-variant)', padding: '1.25rem', borderRadius: '16px' }}>
              <ImageIcon size={22} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-light)', marginBottom: '0.4rem', fontWeight: 600 }}>Change Avatar</label>
                <input type="file" onChange={(e) => setEditAvatar(e.target.files?.[0] || null)} style={{ fontSize: '0.85rem', color: 'var(--text)' }} />
              </div>
            </div>
            <div style={{ background: 'var(--surface-variant)', padding: '1.25rem', borderRadius: '16px' }}>
              <label style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-light)', marginBottom: '0.5rem', fontWeight: 600 }}>Bio</label>
              <textarea 
                value={editBio} 
                onChange={(e) => setEditBio(e.target.value)} 
                style={{ width: '100%', minHeight: '120px', border: 'none', background: 'transparent', outline: 'none', resize: 'none', color: 'var(--text)', fontSize: '1rem', lineHeight: '1.5' }}
                placeholder="Tell us about yourself..."
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <div style={{ marginTop: '3.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>@{profile.username}</h2>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.5', margin: '0.75rem 0', color: 'var(--text)' }}>{profile.bio || 'No bio yet'}</p>
            
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={18} />
                Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem' }}>
              <span><strong style={{ color: 'var(--text)' }}>{profile._count.following}</strong> <span style={{ color: 'var(--text-light)' }}>Following</span></span>
              <span><strong style={{ color: 'var(--text)' }}>{profile._count.followers}</strong> <span style={{ color: 'var(--text-light)' }}>Followers</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Profile Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(var(--bg-rgb), 0.5)', backdropFilter: 'blur(8px)' }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '1rem', fontWeight: 700, borderBottom: '4px solid var(--primary)', color: 'var(--text)' }}>Posts</div>
        <div style={{ flex: 1, textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontWeight: 500 }}>Replies</div>
        <div style={{ flex: 1, textAlign: 'center', padding: '1rem', color: 'var(--text-light)', fontWeight: 500 }}>Media</div>
      </div>

      {/* Posts List */}
      <div style={{ padding: '0 0.5rem' }}>
        {profile.posts.map((post: any) => (
          <div key={post.id} className="card glass" style={{ margin: '0.75rem 0', padding: '1.25rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <UserAvatar url={profile.avatarUrl} size={48} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1.05rem' }}>@{profile.username} <span style={{ fontWeight: 400, color: 'var(--text-light)', fontSize: '0.85rem' }}>· {new Date(post.createdAt).toLocaleDateString()}</span></div>
                  {currentUserId === post.authorId && (
                    <button onClick={() => setDeleteModal({ isOpen: true, postId: post.id })} className="btn-ghost" style={{ color: 'var(--text-light)', opacity: 0.7, padding: '0.4rem' }}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div style={{ margin: '0.5rem 0', lineHeight: '1.5', color: 'var(--text)', fontSize: '1.1rem' }}>{formatText(post.content)}</div>
                {post.mediaUrl && (
                  <img 
                    src={post.mediaUrl.startsWith('http') ? post.mediaUrl : `${API_URL}${post.mediaUrl}`} 
                    alt="post media" 
                    style={{ width: '100%', borderRadius: '20px', border: '1px solid var(--border)', marginTop: '0.75rem', display: 'block' }} 
                  />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '400px', marginTop: '1rem', color: 'var(--text-light)' }}>
                  <Link to={`/posts/${post.id}`} className="btn-ghost" style={{ fontSize: '0.9rem', gap: '0.5rem' }}>
                    <MessageCircle size={20} />
                    <span>{post._count?.comments || 0}</span>
                  </Link>
                  <button className="btn-ghost" style={{ gap: '0.5rem' }}>
                    <Heart size={20} />
                    <span>{post._count?.likes || 0}</span>
                  </button>
                  <button className="btn-ghost" onClick={() => {
                    const link = `${window.location.origin}/posts/${post.id}`;
                    navigator.clipboard.writeText(link).then(() => alert('Copied!')).catch(() => alert('Failed'));
                  }}>
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title="Delete Post?"
        message="This action cannot be undone. It will be permanently removed from your profile."
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteModal({ isOpen: false, postId: null })}
      />
    </div>
  );
};

export default Profile;