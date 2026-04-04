import { useState, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { Save, RefreshCw, FileCode, Lock, LogOut } from 'lucide-react';
import { FileTree } from './components/FileTree';
import type { FileItem } from './types';

// Use relative API base or environment variable
const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';

function App() {
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState('');

  const fetchOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  };

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

  const handleEditorWillMount = (monaco: any) => {
    const options = {
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      jsx: 4, 
      allowJs: true,
      typeRoots: ['node_modules/@types'],
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
    };
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(options);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(options);

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
    });
  };

  const isDirty = content !== originalContent;

  if (isAuthenticated === null) {
    return <div className="h-screen bg-[#0d1117] flex items-center justify-center text-white">Checking access...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1117] text-white">
        <div className="bg-[#161b22] p-8 rounded-lg shadow-xl border border-gray-800 w-full max-w-md">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="bg-blue-600 p-3 rounded-full">
              <Lock size={32} />
            </div>
            <h1 className="text-2xl font-bold">Protected Area</h1>
            <p className="text-gray-400 text-sm">Enter password to access the editor</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            const val = (e.currentTarget.elements.namedItem('pwd') as HTMLInputElement).value;
            handleLogin(val);
          }}>
            <input
              type="password"
              name="pwd"
              placeholder="Password"
              autoFocus
              className="w-full bg-[#0d1117] border border-gray-700 rounded-md py-2 px-4 mb-4 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {loginError && <p className="text-red-500 text-xs mb-4">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-md font-semibold transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#1e1e1e] text-gray-300 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-white">
            <FileCode className="text-blue-400" size={20} />
            <span>OpenClaw Editor</span>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={fetchFileTree}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={handleLogout}
              className="p-1 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <FileTree 
            items={fileTree} 
            onFileSelect={openFile} 
            activePath={activeFile} 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 bg-[#252526]">
          <div className="text-sm truncate mr-4">
            {activeFile ? activeFile : 'Select a file to start editing'}
            {isDirty && <span className="ml-2 text-yellow-500 font-bold">•</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveFile}
              disabled={!activeFile || !isDirty || isSaving}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                !activeFile || !isDirty || isSaving
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 relative">
          {activeFile ? (
            <Editor
              height="100%"
              theme="vs-dark"
              path={activeFile}
              value={content}
              onChange={(value) => setContent(value || '')}
              beforeMount={handleEditorWillMount}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 10 }
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 flex-col gap-4">
              <FileCode size={64} className="opacity-20" />
              <p>Welcome to OpenClaw Editor</p>
              <p className="text-sm opacity-50">Select a file from the sidebar to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
