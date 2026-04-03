let editor;
let currentFilePath = null;

// RequireJS config for Monaco Editor
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.38.0/min/vs' } });

require(['vs/editor/editor.main'], function () {
    // Initialize Monaco Editor
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '// Select a file to start editing...',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true
    });

    // Handle Ctrl+S inside editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
        saveFile();
    });

    // Detect changes to enable save button
    editor.onDidChangeModelContent(() => {
        if (currentFilePath) {
            document.getElementById('save-btn').disabled = false;
        }
    });

    // Initial load
    loadFiles();
});

const fileListEl = document.getElementById('file-list');
const refreshBtn = document.getElementById('refresh-btn');
const saveBtn = document.getElementById('save-btn');
const currentFileNameEl = document.getElementById('current-file-name');

refreshBtn.addEventListener('click', loadFiles);
saveBtn.addEventListener('click', saveFile);

// Handle global Ctrl+S
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
});

async function loadFiles() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        
        fileListEl.innerHTML = '';
        
        if (data.files) {
            data.files.forEach(filePath => {
                const li = document.createElement('li');
                li.textContent = filePath;
                li.title = filePath; // tooltip
                li.addEventListener('click', () => openFile(filePath, li));
                fileListEl.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

async function openFile(filePath, listElement) {
    try {
        const response = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
        if (!response.ok) throw new Error('Failed to load file content');
        
        const content = await response.text();
        
        // Update Editor
        currentFilePath = filePath;
        
        // Determine language from extension
        const ext = filePath.split('.').pop().toLowerCase();
        let language = 'plaintext';
        const langMap = {
            'js': 'javascript', 'ts': 'typescript', 'json': 'json',
            'html': 'html', 'css': 'css', 'md': 'markdown'
        };
        if (langMap[ext]) language = langMap[ext];

        monaco.editor.setModelLanguage(editor.getModel(), language);
        editor.setValue(content);
        
        // Update UI
        currentFileNameEl.textContent = filePath;
        saveBtn.disabled = true;

        // Update active class on sidebar
        document.querySelectorAll('#file-list li').forEach(li => li.classList.remove('active'));
        if (listElement) listElement.classList.add('active');
        
    } catch (error) {
        console.error('Error opening file:', error);
        alert('Could not open file');
    }
}

async function saveFile() {
    if (!currentFilePath) return;

    try {
        const content = editor.getValue();
        const response = await fetch('/api/file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: currentFilePath, content })
        });

        if (!response.ok) throw new Error('Failed to save');
        
        saveBtn.disabled = true;
        // Optionally show a toast or flash message
    } catch (error) {
        console.error('Error saving file:', error);
        alert('Could not save file');
    }
}
