const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const ROOT_DIR = process.cwd();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to get all files recursively
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (file === 'node_modules' || file === '.git') return; // Ignore some folders
    
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Store relative path for the frontend
      arrayOfFiles.push(path.relative(ROOT_DIR, fullPath));
    }
  });

  return arrayOfFiles;
}

// Get file list
app.get('/api/files', (req, res) => {
  try {
    const files = getAllFiles(ROOT_DIR);
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Get file content
app.get('/api/file', (req, res) => {
  const filePath = req.query.path;
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
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.listen(PORT, () => {
  console.log(`Editor server is running at http://localhost:${PORT}`);
});
