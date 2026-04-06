export const compilerOptions = {
  target: 1, // ESNext (In Monaco's enum)
  allowNonTsExtensions: true,
  moduleResolution: 2, // NodeJs
  module: 1, // CommonJS
  noEmit: true,
  jsx: 2, // React
  allowJs: true,
  typeRoots: ['node_modules/@types'],
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  lib: ['esnext', 'dom', 'dom.iterable'],
};

export const defineThemes = (monaco: any) => {
  monaco.editor.defineTheme('vs-dark-plus', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'cccccc' },
      { token: 'keyword', foreground: '569cd6' },
      { token: 'keyword.control', foreground: 'c586c0' },
      { token: 'type', foreground: '4ec9b0' },
      { token: 'class', foreground: '4ec9b0' },
      { token: 'function', foreground: 'dcdcaa' },
      { token: 'method', foreground: 'dcdcaa' },
      { token: 'identifier', foreground: '9cdcfe' },
      { token: 'variable', foreground: '9cdcfe' },
      { token: 'variable.readonly', foreground: '4fc1ff' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'comment', foreground: '6a9955' },
      { token: 'operator', foreground: 'd4d4d4' },
    ],
    colors: {
      'editor.background': '#1f1f1f',
      'editor.foreground': '#cccccc',
      'editorCursor.foreground': '#aeafad',
      'editor.lineHighlightBackground': '#2b2b2b',
      'editorLineNumber.foreground': '#858585',
      'editor.selectionBackground': '#264f78',
    }
  });
};

export const updateDiagnosticsOptions = (monaco: any, semanticValidation: boolean) => {
  if (!monaco) return;
  const options = {
    noSemanticValidation: !semanticValidation,
    noSyntaxValidation: false,
  };
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(options);
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(options);
};

export const defaultEditorOptions: any = {
  fontSize: 14,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  padding: { top: 10 },
  'semanticHighlighting.enabled': true
};
