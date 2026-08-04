import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database connection
const MONGO_URI = 'mongodb+srv://Mukesh:mukesh2198@m.i8bh3sm.mongodb.net/spark_ide?retryWrites=true&w=majority';
mongoose.connect(MONGO_URI)
  .then(() => console.log('[Backend] Connected to MongoDB'))
  .catch(err => console.error('[Backend] MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  developerType: { type: String, enum: ['technical', 'non-technical'], required: true },
  avatarUrl: { type: String, default: '' },
});
const User = mongoose.model('User', userSchema);

const workspaceSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true, unique: true },
  files: { type: Object, default: {} },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' }
  }],
});
const Workspace = mongoose.model('Workspace', workspaceSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-spark-key-123';

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, developerType } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({ email, password: hashedPassword, name, developerType });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name, email, developerType, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'User not found' });
    
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ error: 'Invalid password' });
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, developerType: user.developerType, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (name) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    
    await user.save();
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, developerType: user.developerType, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workspace/:id', auth, async (req, res) => {
  try {
    let workspace = await Workspace.findOne({ workspaceId: req.params.id });
    if (!workspace) {
      workspace = new Workspace({ workspaceId: req.params.id, ownerId: req.user.id, members: [{ userId: req.user.id, role: 'owner' }] });
      await workspace.save();
    } else {
      // Add current user to members if not already present
      const isMember = workspace.members.some(m => m.userId.toString() === req.user.id);
      if (!isMember) {
        workspace.members.push({ userId: req.user.id, role: 'member' });
        await workspace.save();
      }
    }
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspace/:id', auth, async (req, res) => {
  try {
    const { files } = req.body;
    let workspace = await Workspace.findOne({ workspaceId: req.params.id });
    if (!workspace) {
      workspace = new Workspace({ workspaceId: req.params.id, ownerId: req.user.id, members: [{ userId: req.user.id, role: 'owner' }] });
    }
    // Update files
    workspace.files = { ...workspace.files, ...files };
    await workspace.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workspace/:id/members', auth, async (req, res) => {
  try {
    let workspace = await Workspace.findOne({ workspaceId: req.params.id }).populate('members.userId', 'name email developerType avatarUrl');
    if (!workspace) return res.json([]);
    res.json(workspace.members.map(m => ({
      id: m.userId._id,
      name: m.userId.name,
      email: m.userId.email,
      developerType: m.userId.developerType,
      avatarUrl: m.userId.avatarUrl,
      role: m.role
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/workspace/:id/member', auth, async (req, res) => {
  try {
    const { targetUserId, role } = req.body;
    let workspace = await Workspace.findOne({ workspaceId: req.params.id });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    
    const isOwner = workspace.members.some(m => m.userId.toString() === req.user.id && m.role === 'owner');
    if (!isOwner) return res.status(403).json({ error: 'Only owners can manage members' });

    let actualTargetId = targetUserId;
    if (targetUserId.includes('@')) {
      const targetUser = await User.findOne({ email: targetUserId });
      if (!targetUser) return res.status(404).json({ error: 'Target user not found' });
      actualTargetId = targetUser._id.toString();
    }

    const memberIndex = workspace.members.findIndex(m => m.userId.toString() === actualTargetId);
    if (memberIndex > -1) {
      workspace.members[memberIndex].role = role;
    } else {
      workspace.members.push({ userId: actualTargetId, role });
    }
    
    await workspace.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[Backend] Server running on port ${PORT}`));
