import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configuration
const ROOT_DIR = process.env.WORKSPACE_ROOT ? path.resolve(process.env.WORKSPACE_ROOT) : path.resolve(__dirname, '../../../');

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
    if (['node_modules', '.git', 'dist', '.next', '.gemini', '.env'].includes(file)) return;

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

router.get('/files', (req: Request, res: Response) => {
  try {
    const tree = getFileTree(ROOT_DIR);
    res.json({ tree });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

router.get('/file', (req: Request, res: Response) => {
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

router.post('/file', (req: Request, res: Response) => {
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

export default router;
