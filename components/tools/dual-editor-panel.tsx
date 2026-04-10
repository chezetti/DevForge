'use client'

import { EditorPanel } from './editor-panel'

interface DualEditorPanelProps {
  leftValue: string
  rightValue: string
  onLeftChange: (value: string) => void
  onRightChange: (value: string) => void
  leftTitle?: string
  rightTitle?: string
  leftLanguage?: string
  rightLanguage?: string
  leftPlaceholder?: string
  rightPlaceholder?: string
  className?: string
}

export function DualEditorPanel({
  leftValue,
  rightValue,
  onLeftChange,
  onRightChange,
  leftTitle = 'Input A',
  rightTitle = 'Input B',
  leftLanguage = 'json',
  rightLanguage = 'json',
  leftPlaceholder = 'Paste first input here...',
  rightPlaceholder = 'Paste second input here...',
  className = '',
}: DualEditorPanelProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      <EditorPanel
        value={leftValue}
        onChange={onLeftChange}
        language={leftLanguage}
        title={leftTitle}
        placeholder={leftPlaceholder}
      />
      <EditorPanel
        value={rightValue}
        onChange={onRightChange}
        language={rightLanguage}
        title={rightTitle}
        placeholder={rightPlaceholder}
      />
    </div>
  )
}
