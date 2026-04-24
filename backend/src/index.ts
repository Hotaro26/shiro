import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper to parse mentions
const handleMentions = async (content: string, postId?: number, commentId?: number) => {
  const mentions = content.match(/@[\w.-]+/g);
  if (mentions) {
    for (const mention of mentions) {
      const username = mention.substring(1);
      const user = await prisma.user.findUnique({ where: { username } });
      if (user) {
        await prisma.mention.create({
          data: {
            userId: user.id,
            postId,
            commentId,
          },
        });
      }
    }
  }
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, username, password: hashedPassword },
    });
    res.json({ message: 'User created successfully', userId: user.id });
  } catch (error: any) {
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- PROFILE & FOLLOW ROUTES ---

app.put('/api/users/profile', authenticateToken, upload.single('avatar'), async (req: any, res) => {
  const { bio } = req.body;
  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
  const currentUserId = req.user.userId;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: currentUserId },
      data: {
        bio,
        ...(avatarUrl && { avatarUrl }),
      },
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Could not update profile' });
  }
});

app.get('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let requesterId: number | null = null;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      requesterId = decoded.userId;
    } catch (err) {}
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        _count: { select: { followers: true, following: true } },
        posts: {
          include: { author: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
        followers: requesterId ? { where: { id: requesterId }, select: { id: true } } : false,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userData } = user;
    const isFollowing = user.followers && user.followers.length > 0;
    res.json({ ...userData, isFollowing });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch profile' });
  }
});

app.post('/api/users/:username/follow', authenticateToken, async (req: any, res) => {
  const { username } = req.params;
  const currentUserId = req.user.userId;
  try {
    const userToFollow = await prisma.user.findUnique({ where: { username } });
    if (!userToFollow) return res.status(404).json({ error: 'User not found' });
    if (userToFollow.id === currentUserId) return res.status(400).json({ error: 'You cannot follow yourself' });

    const isFollowing = await prisma.user.findFirst({
      where: {
        id: currentUserId,
        following: { some: { id: userToFollow.id } },
      },
    });

    if (isFollowing) {
      await prisma.user.update({
        where: { id: currentUserId },
        data: { following: { disconnect: { id: userToFollow.id } } },
      });
      res.json({ message: 'Unfollowed' });
    } else {
      await prisma.user.update({
        where: { id: currentUserId },
        data: { following: { connect: { id: userToFollow.id } } },
      });
      res.json({ message: 'Followed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Follow operation failed' });
  }
});

// --- FORUM ROUTES ---

app.post('/api/forums', authenticateToken, async (req: any, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Forum name is required' });
  
  try {
    const forum = await prisma.forum.create({
      data: { name, description, creatorId: req.user.userId },
    });
    res.json(forum);
  } catch (error: any) {
    res.status(400).json({ error: 'Could not create forum or it already exists' });
  }
});

app.get('/api/forums', async (req, res) => {
  try {
    const forums = await prisma.forum.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { posts: true } } }
    });
    res.json(forums);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch forums' });
  }
});

app.get('/api/forums/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const forum = await prisma.forum.findUnique({
      where: { name },
      include: {
        posts: {
          include: { 
            author: { select: { username: true, avatarUrl: true } },
            _count: { select: { comments: true, likes: true } }
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!forum) return res.status(404).json({ error: 'Forum not found' });
    res.json(forum);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch forum details' });
  }
});

app.delete('/api/forums/:id', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  try {
    const forum = await prisma.forum.findUnique({ where: { id: parseInt(id) } });
    if (!forum) return res.status(404).json({ error: 'Forum not found' });
    if (forum.creatorId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    
    await prisma.forum.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Forum deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete forum' });
  }
});

// --- POST & FEED ROUTES ---

app.post('/api/posts', authenticateToken, upload.single('image'), async (req: any, res) => {
  const { content, gifUrl, forumId } = req.body;
  const mediaUrl = req.file ? `/uploads/${req.file.filename}` : (gifUrl || null);
  const mediaType = req.file ? 'image' : (gifUrl ? 'gif' : null);

  try {
    const post = await prisma.post.create({
      data: {
        content,
        authorId: req.user.userId,
        mediaUrl,
        mediaType,
        ...(forumId && { forumId: parseInt(forumId) }),
      },
    });
    await handleMentions(content, post.id);
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Could not create post' });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({ where: { id: parseInt(id) } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.authorId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    
    await prisma.post.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

app.post('/api/posts/:id/like', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const currentUserId = req.user.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: { likes: { select: { id: true } } },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const isLiked = post.likes.some(user => user.id === currentUserId);

    if (isLiked) {
      await prisma.post.update({
        where: { id: parseInt(id) },
        data: { likes: { disconnect: { id: currentUserId } } },
      });
      res.json({ message: 'Unliked' });
    } else {
      await prisma.post.update({
        where: { id: parseInt(id) },
        data: { likes: { connect: { id: currentUserId } } },
      });
      res.json({ message: 'Liked' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Like operation failed' });
  }
});

app.get('/api/feed', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let currentUserId: number | null = null;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.userId;
    } catch (err) {}
  }

  try {
    let posts;
    if (currentUserId) {
      // Prioritize followed users
      const following = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { following: { select: { id: true } } },
      });
      const followingIds = following?.following.map(f => f.id) || [];

      posts = await prisma.post.findMany({
        where: { forumId: null }, // Only show general posts in feed
        include: { 
          author: { select: { username: true, avatarUrl: true } },
          _count: { select: { comments: true, likes: true } }
        },
        orderBy: { createdAt: 'desc' },
      });

      // Simple sort: followed users first, then by date (already sorted by date)
      posts.sort((a, b) => {
        const aFollowed = followingIds.includes(a.authorId);
        const bFollowed = followingIds.includes(b.authorId);
        if (aFollowed && !bFollowed) return -1;
        if (!aFollowed && bFollowed) return 1;
        return 0;
      });
    } else {
      posts = await prisma.post.findMany({
        where: { forumId: null },
        include: { 
          author: { select: { username: true, avatarUrl: true } },
          _count: { select: { comments: true, likes: true } }
        },
        orderBy: { createdAt: 'desc' },
      });
    }
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch feed' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        author: { select: { username: true, avatarUrl: true } },
        comments: {
          include: { author: { select: { username: true, avatarUrl: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch post' });
  }
});

// --- COMMENT ROUTES ---

app.post('/api/posts/:id/comments', authenticateToken, upload.single('image'), async (req: any, res) => {
  const { id } = req.params;
  const { content, gifUrl } = req.body;
  const mediaUrl = req.file ? `/uploads/${req.file.filename}` : (gifUrl || null);
  const mediaType = req.file ? 'image' : (gifUrl ? 'gif' : null);

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: req.user.userId,
        postId: parseInt(id),
        mediaUrl,
        mediaType,
      },
    });
    await handleMentions(content, undefined, comment.id);
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: 'Could not create comment' });
  }
});

app.delete('/api/comments/:id', authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  try {
    const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.authorId !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
    
    await prisma.comment.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// --- MESSAGE ROUTES ---

app.post('/api/messages', authenticateToken, async (req: any, res) => {
  const { receiverId, content } = req.body;
  try {
    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.userId,
        receiverId: parseInt(receiverId),
      },
      include: {
        sender: { select: { username: true, avatarUrl: true } },
        receiver: { select: { username: true, avatarUrl: true } },
      },
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Could not send message' });
  }
});

app.get('/api/messages/conversations', authenticateToken, async (req: any, res) => {
  const currentUserId = req.user.userId;
  try {
    // Fetch unique users that the current user has exchanged messages with
    const sent = await prisma.message.findMany({
      where: { senderId: currentUserId },
      select: { receiver: { select: { id: true, username: true, avatarUrl: true } } },
      distinct: ['receiverId'],
    });
    const received = await prisma.message.findMany({
      where: { receiverId: currentUserId },
      select: { sender: { select: { id: true, username: true, avatarUrl: true } } },
      distinct: ['senderId'],
    });

    const conversationsMap = new Map();
    sent.forEach(m => conversationsMap.set(m.receiver.id, m.receiver));
    received.forEach(m => conversationsMap.set(m.sender.id, m.sender));

    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch conversations' });
  }
});

app.get('/api/messages/:userId', authenticateToken, async (req: any, res) => {
  const currentUserId = req.user.userId;
  const otherUserId = parseInt(req.params.userId);
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      include: {
        sender: { select: { username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch messages' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});