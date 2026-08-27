require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./config/db');
require('./config/passport');

// Connect to MongoDB
connectDB();

const app = express();

// Security middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!process.env.CLIENT_URL || origin === process.env.CLIENT_URL || origin.includes('vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests, please try again later.' });
app.use('/api/', limiter);

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport
const passport = require('./config/passport');
app.use(passport.initialize());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/candidate', require('./routes/candidate'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api', require('./routes/ranking'));
app.use('/api', require('./routes/misc'));

const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static uploads directory for resume PDFs and files
app.use('/uploads', express.static(uploadsDir));

// Fallback handler for resume files uploaded in previous ephemeral sessions
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  const clientUrl = process.env.CLIENT_URL || 'https://hire-smart-sandy.vercel.app';
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Resume Document Preview - HireSmart</title>
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; display: grid; place-items: center; min-height: 100vh; background: #0b0f19; color: #f8fafc; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #1e293b; border: 1px solid #334155; padding: 40px; border-radius: 20px; text-align: center; max-width: 520px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
          .icon { font-size: 56px; margin-bottom: 20px; display: inline-block; filter: drop-shadow(0 0 10px rgba(56, 189, 248, 0.4)); }
          h2 { margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #f8fafc; }
          p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 28px; }
          .filename { background: #0f172a; padding: 4px 8px; border-radius: 6px; color: #38bdf8; font-family: monospace; font-size: 14px; word-break: break-all; }
          .btn { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block; transition: transform 0.2s, box-shadow 0.2s; }
          .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">📄</div>
          <h2>Resume Document Analysis</h2>
          <p>The candidate resume <span class="filename">${req.params.filename}</span> has been parsed and scored by HireSmart AI.</p>
          <p style="font-size: 13px; color: #64748b;">Note: Uploaded PDF binaries on cloud instances reset periodically. Upload a new resume under <strong>Jobs &rarr; Upload Resumes</strong> to view live files.</p>
          <a href="${clientUrl}" class="btn">Return to HireSmart Platform</a>
        </div>
      </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`\n🚀 HireSmart Server running on port ${PORT}\n`));

module.exports = app;