import React from 'react';
import { Editor } from '@monaco-editor/react';
import { Save, RefreshCw, FileCode, LogOut, Activity } from 'lucide-react';
import { FileTree } from './FileTree';
import type { FileItem } from '../types';
import { 
  compilerOptions, 
  defineThemes, 
  updateDiagnosticsOptions, 
  defaultEditorOptions 
} from '../config/monacoConfig';


interface EditorViewProps {
  fileTree: FileItem[];
  activeFile: string | null;
  content: string;
  isSaving: boolean;
  isDirty: boolean;
  semanticValidation: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onFileSelect: (path: string) => void;
  onContentChange: (value: string) => void;
  onSave: () => void;
  setSemanticValidation: (val: boolean) => void;
  editorRef: React.MutableRefObject<any>;
  monacoRef: React.MutableRefObject<any>;
}

export const EditorView: React.FC<EditorViewProps> = ({
  fileTree,
  activeFile,
  content,
  isSaving,
  isDirty,
  semanticValidation,
  onRefresh,
  onLogout,
  onFileSelect,
  onContentChange,
  onSave,
  setSemanticValidation,
  editorRef,
  monacoRef,
}) => {
  const getLanguage = (path: string | null) => {
    if (!path) return 'javascript';
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'json': return 'json';
      case 'css': return 'css';
      case 'html': return 'html';
      default: return 'javascript';
    }
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compilerOptions);
    updateDiagnosticsOptions(monaco, semanticValidation);
    defineThemes(monaco);
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

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
              onClick={onRefresh}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button 
              onClick={onLogout}
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
            onFileSelect={onFileSelect} 
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
              onClick={() => setSemanticValidation(!semanticValidation)}
              className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-all border ${
                semanticValidation
                  ? 'bg-blue-600/20 text-blue-400 border-blue-600/50 hover:bg-blue-600/30'
                  : 'bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700 hover:text-gray-400'
              }`}
              title={semanticValidation ? "Disable Semantic Validation" : "Enable Semantic Validation"}
            >
              <Activity size={14} className={semanticValidation ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">
                {semanticValidation ? 'Validation ON' : 'Validation OFF'}
              </span>
            </button>
            <button
              onClick={onSave}
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
              theme="vs-dark-plus"
              path={activeFile}
              language={getLanguage(activeFile)}
              value={content}
              onChange={(value) => onContentChange(value || '')}
              beforeMount={handleEditorWillMount}
              onMount={handleEditorDidMount}
              options={defaultEditorOptions}
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
};
