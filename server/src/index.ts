import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001; // New port to avoid conflict with default client dev port

// Default workspace is the parent directory
const ROOT_DIR = path.resolve(__dirname, '../../../');

// Ensure the directory exists
if (!fs.existsSync(ROOT_DIR)) {
  console.log(`Creating workspace directory: ${ROOT_DIR}`);
  fs.mkdirSync(ROOT_DIR, { recursive: true });
}

console.log(`Workspace: ${ROOT_DIR}`);

app.use(cors());
app.use(express.json());

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileItem[];
}

// Helper function to get directory tree
function getFileTree(dirPath: string, relativePath: string = ''): FileItem[] {
  const files = fs.readdirSync(dirPath);
  const items: FileItem[] = [];

  files.forEach((file) => {
    if (file === 'node_modules' || file === '.git' || file === 'dist') return;

    const fullPath = path.join(dirPath, file);
    const relPath = path.join(relativePath, file);
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
  });

  // Sort: directories first, then files alphabetically
  return items.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === 'directory' ? -1 : 1;
  });
}

// Get file list as a tree
app.get('/api/files', (req, res) => {
  try {
    const tree = getFileTree(ROOT_DIR);
    res.json({ tree });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file content
app.get('/api/file', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });

  const fullPath = path.join(ROOT_DIR, filePath);
  
  // Basic security check to prevent directory traversal
  if (!fullPath.startsWith(ROOT_DIR)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    res.send(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Save file content
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
    console.error(err);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.listen(PORT, () => {
  console.log(`Editor server is running at http://localhost:${PORT}`);
});
