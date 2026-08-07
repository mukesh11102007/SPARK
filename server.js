import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Strict Environment Variable Verification
let isConfigured = true;
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error('[FATAL] Missing required environment variables: MONGO_URI and/or JWT_SECRET.');
  isConfigured = false;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-for-build-only';

const app = express();

if (!isConfigured) {
  app.use('/api', (req, res) => {
    res.status(500).json({ error: 'Server Configuration Error: Missing MONGO_URI or JWT_SECRET in Vercel Environment Variables.' });
  });
}

// Enterprise Security Middlewares
app.use(helmet()); // Secure HTTP headers

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Global API Rate Limiting (200 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', globalLimiter);

// Strict Auth Rate Limiting (10 requests per 15 minutes to prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth', authLimiter);

// Database connection
if (isConfigured) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('[Backend] Connected to MongoDB'))
    .catch(err => console.error('[Backend] MongoDB connection error:', err));
}

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
  title: { type: String, default: 'spark-app' },
  files: { type: Object, default: {} },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' }
  }],
  updatedAt: { type: Date, default: Date.now },
});
const Workspace = mongoose.model('Workspace', workspaceSchema);

const activityLogSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);


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
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
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
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, developerType: user.developerType, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/profile', auth, async (req, res) => {
  try {
    const { name, bio, avatarUrl, developerType } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (name) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (developerType !== undefined) user.developerType = developerType;
    
    await user.save();
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, developerType: user.developerType, avatarUrl: user.avatarUrl } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workspaces', auth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({ 'members.userId': req.user.id })
      .select('workspaceId title updatedAt ownerId')
      .sort({ updatedAt: -1 });
    res.json(workspaces);
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
    const { files, title } = req.body;
    let workspace = await Workspace.findOne({ workspaceId: req.params.id });
    if (!workspace) {
      workspace = new Workspace({ workspaceId: req.params.id, ownerId: req.user.id, members: [{ userId: req.user.id, role: 'owner' }] });
    }
    // Overwrite files completely to allow deletions
    if (files !== undefined) {
      workspace.files = files;
    }
    if (title !== undefined) {
      workspace.title = title;
    }
    workspace.updatedAt = Date.now();
    await workspace.save();
    res.json({ success: true, workspace });
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

app.delete('/api/workspace/:id', auth, async (req, res) => {
  try {
    let workspace = await Workspace.findOne({ workspaceId: req.params.id });
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    
    const isOwner = workspace.members.some(m => m.userId.toString() === req.user.id && m.role === 'owner');
    if (!isOwner) return res.status(403).json({ error: 'Only owners can delete the workspace' });

    await Workspace.deleteOne({ _id: workspace._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/workspace/:id/commit', auth, async (req, res) => {
  try {
    const { action, details } = req.body;
    const log = new ActivityLog({
      workspaceId: req.params.id,
      userId: req.user.id,
      action: action || 'commit',
      details: details || 'Committed changes'
    });
    await log.save();
    
    // Fire instant webhook if configured
    const webhookUrl = process.env.INSTANT_WEBHOOK_URL;
    if (webhookUrl) {
      const user = await User.findById(req.user.id);
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: req.params.id,
          user: user.name,
          email: user.email,
          action: log.action,
          details: log.details,
          timestamp: log.timestamp
        })
      }).catch(err => console.error('[Webhook] Failed to send instant webhook', err));
    }
    
    res.json({ success: true, log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Setup Daily Digest Cron Job (runs at 9:00 AM every day)
cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Running daily digest job at 9:00 AM');
  const digestWebhookUrl = process.env.DIGEST_WEBHOOK_URL;
  if (!digestWebhookUrl) {
    console.log('[Cron] DIGEST_WEBHOOK_URL not set, skipping');
    return;
  }
  
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const logs = await ActivityLog.find({ timestamp: { $gte: yesterday } }).populate('userId', 'name email');
    if (logs.length === 0) return;
    
    // Group logs by workspace
    const grouped = logs.reduce((acc, log) => {
      if (!acc[log.workspaceId]) acc[log.workspaceId] = [];
      acc[log.workspaceId].push({
        user: log.userId.name,
        email: log.userId.email,
        action: log.action,
        details: log.details,
        time: log.timestamp
      });
      return acc;
    }, {});
    
    // Send to webhook
    await fetch(digestWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportType: 'daily_digest',
        date: new Date().toISOString(),
        workspaces: grouped
      })
    }).catch(err => console.error('[Webhook] Error fetching digest webhook', err));
    console.log('[Cron] Daily digest sent to webhook successfully');
  } catch (err) {
    console.error('[Cron] Error running daily digest', err);
  }
});

const PORT = process.env.PORT || 3001;

// Start the server for Render or Local Development
app.listen(PORT, () => console.log(`[Backend] Server running on port ${PORT}`));

// Export for testing
export default app;
