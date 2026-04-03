import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
// Set your password here or via environment variable
const ACCESS_PASSWORD = process.env.EDITOR_PASSWORD || 'admin123';
// Default workspace is the parent directory of the project root
const ROOT_DIR = path.resolve(__dirname, '../../');
const CLIENT_BUILD_PATH = path.resolve(__dirname, '../../client/dist');

// Ensure the directory exists
if (!fs.existsSync(ROOT_DIR)) {
  fs.mkdirSync(ROOT_DIR, { recursive: true });
}

console.log(`Workspace: ${ROOT_DIR}`);
console.log(`Static Files: ${CLIENT_BUILD_PATH}`);

app.use(cors());
app.use(express.json());

// --- AUTH MIDDLEWARE ---
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for login and static files
  if (req.path === '/api/login' || !req.path.startsWith('/api')) {
    return next();
  }

  const password = req.headers['x-editor-password'];
    console.log(password)
  if (password === ACCESS_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.use(authMiddleware);

// --- API ENDPOINTS ---

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  console.log(password)
  if (password === ACCESS_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

function getFileTree(dirPath: string, relativePath: string = ''): FileItem[] {
  const files = fs.readdirSync(dirPath);
  const items: FileItem[] = [];

  files.forEach((file) => {
    if (['node_modules', '.git', 'dist', '.next', '.gemini'].includes(file)) return;

    const fullPath = path.join(dirPath, file);
    const relPath = path.join(relativePath, file);
    
    try {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        items.push({
          name: file,
          path: relPath,
          type: 'directory',
          children: getFileTree(fullPath, relPath),
        });
      } else {
        items.push({
          name: file,
          path: relPath,
          type: 'file',
        });
      }
    } catch (e) {
      // Skip files that can't be accessed
    }
  });

  return items.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'directory' ? -1 : 1;
  });
}

app.get('/api/files', (req, res) => {
  try {
    const tree = getFileTree(ROOT_DIR);
    res.json({ tree });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.get('/api/file', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });

  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fullPath.startsWith(ROOT_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    res.send(content);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read file' });
  }
});

app.post('/api/file', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });

  const fullPath = path.join(ROOT_DIR, filePath);
  if (!fullPath.startsWith(ROOT_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    fs.writeFileSync(fullPath, content || '', 'utf8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// --- STATIC FILES & SPA ROUTING ---
if (fs.existsSync(CLIENT_BUILD_PATH)) {
  app.use(express.static(CLIENT_BUILD_PATH));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(CLIENT_BUILD_PATH, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
