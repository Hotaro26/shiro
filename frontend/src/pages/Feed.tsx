import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Image as ImageIcon, Smile, MessageCircle, Share2, Heart, Trash2 } from 'lucide-react';
import { API_URL } from '../config';
import { formatText } from '../utils/formatText';
import UserAvatar from '../components/UserAvatar';
import EmojiPickerPopup from '../components/EmojiPickerPopup';
import { EmojiClickData } from 'emoji-picker-react';
import ConfirmModal from '../components/ConfirmModal';

interface Post {
  id: number;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt: string;
  authorId: number;
  author: { username: string, avatarUrl?: string };
  _count: { comments: number, likes: number };
}

const parseJwt = (t: string) => {
  try { return JSON.parse(atob(t.split('.')[1])); } catch (e) { return null; }
};

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, postId: number | null }>({ isOpen: false, postId: null });
  
  const token = localStorage.getItem('token');
  const currentUserId = token ? parseJwt(token)?.userId : null;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPosts = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/api/feed`, { headers });
      setPosts(res.data);
    } catch (err) {
      console.error('Could not fetch feed');
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Please login to post');
    setLoading(true);

    const formData = new FormData();
    formData.append('content', content);
    if (image) formData.append('image', image);
    if (gifUrl) formData.append('gifUrl', gifUrl);

    try {
      await axios.post(`${API_URL}/api/posts`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      setContent('');
      setImage(null);
      setGifUrl('');
      setShowEmojiPicker(false);
      fetchPosts();
    } catch (err) {
      alert('Could not create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (!token) return alert('Please login to like posts');
    try {
      await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPosts();
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleShare = (postId: number) => {
    const link = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(link)
      .then(() => alert('Post link copied to clipboard!'))
      .catch(() => alert('Failed to copy link.'));
  };

  const handleDeletePost = async () => {
    if (!deleteModal.postId) return;
    try {
      await axios.delete(`${API_URL}/api/posts/${deleteModal.postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteModal({ isOpen: false, postId: null });
      fetchPosts();
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const { selectionStart, selectionEnd } = textAreaRef.current!;
    setContent(content.slice(0, selectionStart) + emojiData.emoji + content.slice(selectionEnd));
  };
  
  const handleGifSubmit = (url: string) => {
    setGifUrl(url);
    setShowEmojiPicker(false);
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, backgroundColor: 'rgba(var(--bg-rgb), 0.8)', backdropFilter: 'blur(16px)', zIndex: 10 }}>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>Home</h2>
      </div>

      {token && (
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <form onSubmit={handlePost}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <UserAvatar size={48} />
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea 
                  ref={textAreaRef}
                  placeholder="What's on your mind?" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  required 
                  style={{ 
                    width: '100%', 
                    border: 'none', 
                    outline: 'none', 
                    resize: 'none', 
                    fontSize: '1.25rem', 
                    minHeight: '100px',
                    padding: '0.5rem 0',
                    backgroundColor: 'transparent',
                    color: 'var(--text)',
                    lineHeight: '1.5'
                  }}
                />
                
                {image && (
                  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <img src={URL.createObjectURL(image)} alt="preview" style={{ width: '100%', borderRadius: '24px', maxHeight: '400px', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setImage(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                )}

                {gifUrl && (
                  <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <img src={gifUrl} alt="preview" style={{ width: '100%', borderRadius: '24px', maxHeight: '400px', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setGifUrl('')} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn-ghost" onClick={() => (textAreaRef.current?.nextSibling as any)?.click()} style={{ color: 'var(--primary)' }}>
                      <ImageIcon size={22} />
                      <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Add emoji or GIF" style={{ color: 'var(--primary)' }}>
                      <Smile size={22} />
                    </button>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading || !content.trim()}>
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
                {showEmojiPicker && (
                  <EmojiPickerPopup
                    onEmojiClick={handleEmojiClick}
                    onGifUrlSubmit={handleGifSubmit}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                )}
              </div>
            </div>
          </form>
        </div>
      )}

      <div style={{ padding: '0 0.5rem' }}>
        {posts.map(post => (
          <div key={post.id} className="card glass" style={{ margin: '0.75rem 0', padding: '1.25rem', border: '1px solid var(--border)', boxShadow: 'none' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to={`/profile/${post.author.username}`} style={{ flexShrink: 0 }}>
                <UserAvatar url={post.author.avatarUrl} size={48} />
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', minWidth: 0 }}>
                    <Link to={`/profile/${post.author.username}`} style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)', fontSize: '1.05rem' }}>@{post.author.username}</Link>
                    <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', flexShrink: 0 }}>· {new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  {currentUserId === post.authorId && (
                    <button className="btn-ghost" onClick={() => setDeleteModal({ isOpen: true, postId: post.id })} style={{ color: 'var(--text-light)', opacity: 0.7, padding: '0.4rem' }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '1.1rem', lineHeight: '1.5', marginBottom: '1rem', wordWrap: 'break-word', color: 'var(--text)' }}>{formatText(post.content)}</div>
                
                {post.mediaUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <img 
                      src={post.mediaUrl.startsWith('http') ? post.mediaUrl : `${API_URL}${post.mediaUrl}`} 
                      alt="post media" 
                      style={{ width: '100%', borderRadius: '20px', border: '1px solid var(--border)', display: 'block' }} 
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '450px', color: 'var(--text-light)' }}>
                  <Link to={`/posts/${post.id}`} className="btn-ghost" style={{ fontSize: '0.9rem', gap: '0.5rem' }}>
                    <MessageCircle size={20} />
                    <span>{post._count.comments}</span>
                  </Link>
                  <button className="btn-ghost" onClick={() => handleLike(post.id)} style={{ gap: '0.5rem' }}>
                    <Heart size={20} />
                    <span>{post._count.likes}</span>
                  </button>
                  <button className="btn-ghost" onClick={() => handleShare(post.id)}>
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
        message="This can’t be undone and it will be removed from your profile, the timeline of any accounts that follow you, and from search results."
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteModal({ isOpen: false, postId: null })}
      />
    </div>
  );
};

export default Feed;
