import type { Monaco } from '@monaco-editor/react'

export function registerDevforgeTheme(monaco: Monaco) {
  monaco.editor.defineTheme('devforge-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6B7280' },
      { token: 'keyword', foreground: 'FFFFFF' },
      { token: 'string', foreground: 'A1A1AA' },
      { token: 'number', foreground: 'FFFFFF' },
    ],
    colors: {
      'editor.background': '#0D0D0D',
      'editor.foreground': '#FFFFFF',
      'editor.lineHighlightBackground': '#1A1A1A',
      'editor.selectionBackground': '#2A2A2A',
      'editorLineNumber.foreground': '#3F3F46',
      'editorLineNumber.activeForeground': '#A1A1AA',
      'editorCursor.foreground': '#FFFFFF',
      'editor.inactiveSelectionBackground': '#1F1F1F',
    },
  })
}
