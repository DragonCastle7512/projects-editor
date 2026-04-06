import { useState, useEffect, useCallback, useRef } from 'react';
import { Login } from './components/Login';
import { EditorView } from './components/EditorView';
import { updateDiagnosticsOptions } from './config/monacoConfig';
import type { FileItem } from './types';

// Use relative API base or environment variable
const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

function App() {
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [semanticValidation, setSemanticValidation] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState('');

  const fetchOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  };

  useEffect(() => {
    updateDiagnosticsOptions(monacoRef.current, semanticValidation);
  }, [semanticValidation]);

  const fetchFileTree = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/files`, fetchOptions);
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await response.json();
      setFileTree(data.tree || []);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    // Check initial auth status by trying to fetch file tree
    fetchFileTree();
  }, [fetchFileTree]);

  const handleLogin = async (inputPassword: string) => {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        ...fetchOptions,
        body: JSON.stringify({ password: inputPassword })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setLoginError('');
        fetchFileTree();
      } else {
        setLoginError('Invalid password');
        setIsAuthenticated(false);
      }
    } catch (error) {
      setLoginError('Server connection failed');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        ...fetchOptions
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsAuthenticated(false);
      setFileTree([]);
      setActiveFile(null);
    }
  };

  const openFile = async (path: string) => {
    const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip'];
    if (binaryExtensions.some(ext => path.toLowerCase().endsWith(ext))) {
      alert('열 수 없는 파일입니다.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/file?path=${encodeURIComponent(path)}`, fetchOptions);
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to load file');
      const text = await response.text();
      setActiveFile(path);
      setContent(text);
      setOriginalContent(text);
    } catch (error) {
      console.error('Error opening file:', error);
      alert('열 수 없는 파일입니다.');
    }
  };

  const saveFile = async () => {
    if (!activeFile || isSaving) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/file`, {
        method: 'POST',
        ...fetchOptions,
        body: JSON.stringify({ path: activeFile, content })
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to save');
      setOriginalContent(content);
    } catch (error) {
      console.error('Error saving file:', error);
      alert('Could not save file');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content, activeFile, isAuthenticated]);

  const isDirty = content !== originalContent;

  if (isAuthenticated === null) {
    return <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">Checking access...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <EditorView 
      fileTree={fileTree}
      activeFile={activeFile}
      content={content}
      isSaving={isSaving}
      isDirty={isDirty}
      semanticValidation={semanticValidation}
      onRefresh={fetchFileTree}
      onLogout={handleLogout}
      onFileSelect={openFile}
      onContentChange={setContent}
      onSave={saveFile}
      setSemanticValidation={setSemanticValidation}
      editorRef={editorRef}
      monacoRef={monacoRef}
    />
  );
}

export default App;
