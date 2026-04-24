import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Image as ImageIcon, Smile, MessageCircle, Heart, Share2, Trash2 } from 'lucide-react';
import { API_URL } from '../config';
import { formatText } from '../utils/formatText';
import UserAvatar from '../components/UserAvatar';
import EmojiPickerPopup from '../components/EmojiPickerPopup';
import { EmojiClickData } from 'emoji-picker-react';
import ConfirmModal from '../components/ConfirmModal';

const parseJwt = (t: string) => {
  try { return JSON.parse(atob(t.split('.')[1])); } catch (e) { return null; }
};

const PostDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [commentContent, setCommentContent] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [commentGif, setCommentGif] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, type: 'post' | 'comment', id: number | null }>({ isOpen: false, type: 'post', id: null });
  
  const token = localStorage.getItem('token');
  const currentUserId = token ? parseJwt(token)?.userId : null;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const fetchPost = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/posts/${id}`);
      setPost(res.data);
    } catch (err) {
      alert('Post not found');
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleConfirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      if (deleteModal.type === 'post') {
        await axios.delete(`${API_URL}/api/posts/${deleteModal.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/');
      } else {
        await axios.delete(`${API_URL}/api/comments/${deleteModal.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchPost();
      }
      setDeleteModal({ isOpen: false, type: 'post', id: null });
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert('Please login to comment');
    setLoading(true);
    
    const formData = new FormData();
    formData.append('content', commentContent);
    if (commentImage) formData.append('image', commentImage);
    if (commentGif) formData.append('gifUrl', commentGif);

    try {
      await axios.post(`${API_URL}/api/posts/${id}/comments`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      setCommentContent('');
      setCommentImage(null);
      setCommentGif('');
      setShowEmojiPicker(false);
      fetchPost();
    } catch (err) {
      alert('Comment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!token) return alert('Please login to like posts');
    try {
      await axios.post(`${API_URL}/api/posts/${id}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPost();
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleShare = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link)
      .then(() => alert('Post link copied to clipboard!'))
      .catch(() => alert('Failed to copy link.'));
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const { selectionStart, selectionEnd } = textAreaRef.current!;
    setCommentContent(commentContent.slice(0, selectionStart) + emojiData.emoji + commentContent.slice(selectionEnd));
  };
  
  const handleGifSubmit = (url: string) => {
    setCommentGif(url);
    setShowEmojiPicker(false);
  };

  if (!post) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading post...</div>;

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '2rem', position: 'sticky', top: 0, backgroundColor: 'rgba(var(--bg-rgb), 0.8)', backdropFilter: 'blur(16px)', zIndex: 10, borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost">
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)' }}>Post</h2>
      </div>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <Link to={`/profile/${post.author.username}`} style={{ flexShrink: 0 }}>
            <UserAvatar url={post.author.avatarUrl} size={56} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <Link to={`/profile/${post.author.username}`} style={{ fontWeight: 700, display: 'block', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1.1rem' }}>@{post.author.username}</Link>
            <span style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ fontSize: '1.5rem', lineHeight: '1.4', margin: '1.5rem 0', wordWrap: 'break-word', color: 'var(--text)' }}>{formatText(post.content)}</div>
        
        {post.mediaUrl && (
          <img 
            src={post.mediaUrl.startsWith('http') ? post.mediaUrl : `${API_URL}${post.mediaUrl}`} 
            alt="media" 
            style={{ width: '100%', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'block' }} 
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '0.75rem 0', margin: '1.5rem 0', color: 'var(--text-light)' }}>
          <button className="btn-ghost" style={{ gap: '0.5rem', fontSize: '1rem' }}>
            <MessageCircle size={22} />
            <span>{post.comments.length}</span>
          </button>
          <button className="btn-ghost" onClick={handleLike}>
            <Heart size={22} />
          </button>
          <button className="btn-ghost" onClick={handleShare}>
            <Share2 size={22} />
          </button>
          {currentUserId === post.authorId && (
            <button className="btn-ghost" onClick={() => setDeleteModal({ isOpen: true, type: 'post', id: post.id })} style={{ color: '#ba1a1a' }}>
              <Trash2 size={22} />
            </button>
          )}
        </div>

        {token && (
          <form onSubmit={handleComment} style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <UserAvatar size={40} />
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea 
                  ref={textAreaRef}
                  placeholder="Post your reply" 
                  value={commentContent} 
                  onChange={(e) => setCommentContent(e.target.value)} 
                  required 
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1.25rem', resize: 'none', minHeight: '80px', backgroundColor: 'transparent', color: 'var(--text)', lineHeight: '1.4' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" className="btn-ghost" onClick={() => (textAreaRef.current?.nextSibling as any)?.firstChild?.click()} style={{ padding: '0.5rem', color: 'var(--primary)' }}>
                      <ImageIcon size={20} />
                      <input type="file" onChange={(e) => setCommentImage(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ padding: '0.5rem', color: 'var(--primary)' }}>
                      <Smile size={20} />
                    </button>
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading || !commentContent.trim()}>
                    Reply
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
        )}

        <div style={{ borderTop: '1px solid var(--border)' }}>
          {post.comments.map((comment: any) => (
            <div key={comment.id} className="card glass" style={{ margin: '1rem 0', padding: '1.25rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to={`/profile/${comment.author.username}`} style={{ flexShrink: 0 }}>
                  <UserAvatar url={comment.author.avatarUrl} size={40} />
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: 0 }}>
                      <Link to={`/profile/${comment.author.username}`} style={{ fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{comment.author.username}</Link>
                      <span style={{ color: 'var(--text-light)', fontSize: '0.85rem', flexShrink: 0 }}>· {new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    {currentUserId === comment.authorId && (
                      <button className="btn-ghost" onClick={() => setDeleteModal({ isOpen: true, type: 'comment', id: comment.id })} style={{ color: 'var(--text-light)', opacity: 0.7, padding: '0.4rem' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ margin: '0.5rem 0', color: 'var(--text)', lineHeight: '1.5', wordWrap: 'break-word', fontSize: '1.05rem' }}>{formatText(comment.content)}</div>
                    {comment.mediaUrl && (
                    <img 
                      src={comment.mediaUrl.startsWith('http') ? comment.mediaUrl : `${API_URL}${comment.mediaUrl}`} 
                      alt="media" 
                      style={{ width: '100%', borderRadius: '16px', marginTop: '0.75rem', display: 'block', border: '1px solid var(--border)' }} 
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title={deleteModal.type === 'post' ? 'Delete Post?' : 'Delete Comment?'}
        message="This action cannot be undone. It will be permanently removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />
    </div>
  );
};

export default PostDetails;