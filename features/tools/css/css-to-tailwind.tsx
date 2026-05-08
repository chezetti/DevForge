'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Copy, Check } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Button } from '@/components/ui/button'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'

const EXAMPLE = `.hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 720px;
  min-height: 200px;
  margin: 24px auto;
  padding: 16px 24px;
  font-size: 18px;
  line-height: 1.5;
  text-align: center;
  color: #1e293b;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  position: relative;
}`

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function parseDeclarations(css: string): { prop: string; value: string }[] {
  const cleaned = stripComments(css)
  const out: { prop: string; value: string }[] = []
  const re = /([a-zA-Z-]+)\s*:\s*([^;]+?)(?:;|$)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(cleaned)) !== null) {
    const prop = m[1].trim().toLowerCase()
    const value = m[2].trim().replace(/\s+/g, ' ')
    if (prop.startsWith('@')) continue
    out.push({ prop, value })
  }
  return out
}

function pxFromAny(
  n: number,
  unit: string,
  base: number
): number | null {
  switch (unit) {
    case 'px':
      return n
    case 'rem':
    case 'em':
      return n * base
    case 'pt':
      return n * (96 / 72)
    default:
      return null
  }
}

function tailwindSpacing(prefix: string, pxVal: number): string {
  const scale: [number, string][] = [
    [0, '0'],
    [4, '1'],
    [8, '2'],
    [12, '3'],
    [16, '4'],
    [20, '5'],
    [24, '6'],
    [28, '7'],
    [32, '8'],
    [36, '9'],
    [40, '10'],
    [44, '11'],
    [48, '12'],
    [56, '14'],
    [64, '16'],
    [80, '20'],
    [96, '24'],
  ]
  for (const [px, t] of scale) {
    if (Math.abs(pxVal - px) < 0.5) return `${prefix}-${t}`
  }
  return `${prefix}-[${Math.round(pxVal * 100) / 100}px]`
}

function convertDeclaration(prop: string, value: string): string | null {
  const v = value.trim().toLowerCase()

  const displayMap: Record<string, string> = {
    flex: 'flex',
    grid: 'grid',
    block: 'block',
    inline: 'inline',
    'inline-block': 'inline-block',
    none: 'hidden',
    'inline-flex': 'inline-flex',
    contents: 'contents',
  }
  if (prop === 'display') return displayMap[v] ?? null

  if (prop === 'flex-direction') {
    const m: Record<string, string> = { row: 'flex-row', column: 'flex-col', 'row-reverse': 'flex-row-reverse', 'column-reverse': 'flex-col-reverse' }
    return m[v] ?? null
  }
  if (prop === 'flex-wrap') {
    const m: Record<string, string> = { wrap: 'flex-wrap', nowrap: 'flex-nowrap', 'wrap-reverse': 'flex-wrap-reverse' }
    return m[v] ?? null
  }
  if (prop === 'justify-content') {
    const m: Record<string, string> = {
      'flex-start': 'justify-start',
      start: 'justify-start',
      center: 'justify-center',
      'flex-end': 'justify-end',
      end: 'justify-end',
      'space-between': 'justify-between',
      'space-around': 'justify-around',
      'space-evenly': 'justify-evenly',
    }
    return m[v] ?? null
  }
  if (prop === 'align-items') {
    const m: Record<string, string> = {
      stretch: 'items-stretch',
      'flex-start': 'items-start',
      start: 'items-start',
      center: 'items-center',
      'flex-end': 'items-end',
      end: 'items-end',
      baseline: 'items-baseline',
    }
    return m[v] ?? null
  }
  if (prop === 'align-self') {
    const m: Record<string, string> = {
      auto: 'self-auto',
      stretch: 'self-stretch',
      'flex-start': 'self-start',
      center: 'self-center',
      'flex-end': 'self-end',
    }
    return m[v] ?? null
  }
  if (prop === 'text-align') {
    const m: Record<string, string> = { left: 'text-left', center: 'text-center', right: 'text-right', justify: 'text-justify', end: 'text-end', start: 'text-start' }
    return m[v] ?? null
  }
  if (prop === 'position') {
    const m: Record<string, string> = { static: 'static', relative: 'relative', absolute: 'absolute', fixed: 'fixed', sticky: 'sticky' }
    return m[v] ?? null
  }
  if (prop === 'overflow') {
    const m: Record<string, string> = { auto: 'overflow-auto', hidden: 'overflow-hidden', visible: 'overflow-visible', scroll: 'overflow-scroll' }
    return m[v] ?? null
  }
  if (prop === 'overflow-x') {
    const m: Record<string, string> = { auto: 'overflow-x-auto', hidden: 'overflow-x-hidden', visible: 'overflow-x-visible', scroll: 'overflow-x-scroll' }
    return m[v] ?? null
  }
  if (prop === 'overflow-y') {
    const m: Record<string, string> = { auto: 'overflow-y-auto', hidden: 'overflow-y-hidden', visible: 'overflow-y-visible', scroll: 'overflow-y-scroll' }
    return m[v] ?? null
  }
  if (prop === 'font-weight') {
    const m: Record<string, string> = {
      '100': 'font-thin',
      '200': 'font-extralight',
      '300': 'font-light',
      '400': 'font-normal',
      '500': 'font-medium',
      '600': 'font-semibold',
      '700': 'font-bold',
      '800': 'font-extrabold',
      '900': 'font-black',
    }
    if (m[v]) return m[v]
    if (v === 'normal') return 'font-normal'
    if (v === 'bold') return 'font-bold'
    return null
  }

  if (prop === 'gap' || prop === 'row-gap' || prop === 'column-gap') {
    const prefix = prop === 'gap' ? 'gap' : prop === 'row-gap' ? 'gap-y' : 'gap-x'
    const num = parseFloat(value)
    const u = value.replace(/[\d.]+/, '').trim() || 'px'
    const px = u === 'px' ? num : pxFromAny(num, u, 16)
    if (px == null) return null
    return tailwindSpacing(prefix, px)
  }

  const spacingProps: Record<string, string> = {
    margin: 'm',
    'margin-top': 'mt',
    'margin-right': 'mr',
    'margin-bottom': 'mb',
    'margin-left': 'ml',
    'margin-inline': 'mx',
    'margin-block': 'my',
    padding: 'p',
    'padding-top': 'pt',
    'padding-right': 'pr',
    'padding-bottom': 'pb',
    'padding-left': 'pl',
    'padding-inline': 'px',
    'padding-block': 'py',
  }
  if (spacingProps[prop]) {
    const prefix = spacingProps[prop]
    const parts = value.split(/\s+/).filter(Boolean)

    if (prop === 'margin' && parts.length === 2 && parts[1].toLowerCase() === 'auto') {
      const num = parseFloat(parts[0])
      const u = parts[0].replace(/[\d.]+/, '').trim() || 'px'
      const px = pxFromAny(num, u, 16)
      const my = px != null ? tailwindSpacing('my', px) : ''
      return [my, 'mx-auto'].filter(Boolean).join(' ')
    }

    if (prop === 'margin' && parts.length === 1 && parts[0].toLowerCase() === 'auto') {
      return 'mx-auto'
    }

    if (parts.length === 2 && (prop === 'padding' || prop === 'margin')) {
      const parseOne = (s: string) => {
        const num = parseFloat(s)
        const u = s.replace(/[\d.]+/, '').trim() || 'px'
        return pxFromAny(num, u, 16)
      }
      const a = parseOne(parts[0])
      const b = parseOne(parts[1])
      if (a != null && b != null) {
        if (prop === 'padding') {
          return `${tailwindSpacing('py', a)} ${tailwindSpacing('px', b)}`
        }
        return `${tailwindSpacing('my', a)} ${tailwindSpacing('mx', b)}`
      }
    }

    if (parts.length === 1) {
      const num = parseFloat(parts[0])
      const u = parts[0].replace(/[\d.-]+/, '').trim() || 'px'
      if (parts[0] === '0' || parts[0] === '0px') return `${prefix}-0`
      const px = pxFromAny(num, u, 16)
      if (px != null) return tailwindSpacing(prefix, px)
    }
    return null
  }

  if (prop === 'width') {
    if (v === '100%') return 'w-full'
    if (v === '50%') return 'w-1/2'
    if (v === '33.333333%' || v === '33.3333%' || v === '33%') return 'w-1/3'
    if (v === '66.666667%' || v === '66.6667%' || v === '66%') return 'w-2/3'
    if (v === '25%') return 'w-1/4'
    if (v === '75%') return 'w-3/4'
    if (v === 'auto') return 'w-auto'
    const num = parseFloat(value)
    const u = value.replace(/[\d.]+/, '').trim()
    const px = pxFromAny(num, u, 16)
    if (px != null) {
      const t = tailwindSpacing('w', px)
      return t.startsWith('w-') ? t : `w-[${value}]`
    }
    return `w-[${value}]`
  }

  if (prop === 'max-width') {
    if (v === 'none') return 'max-w-none'
    if (v === '100%') return 'max-w-full'
    const num = parseFloat(value)
    const u = value.replace(/[\d.]+/, '').trim() || 'px'
    const px = pxFromAny(num, u, 16)
    if (px != null) {
      const sz = [640, 768, 1024, 1280, 1536]
      const names = ['sm', 'md', 'lg', 'xl', '2xl']
      for (let i = 0; i < sz.length; i++) {
        if (Math.abs(px - sz[i]) < 4) return `max-w-${names[i]}`
      }
      return `max-w-[${value}]`
    }
    return `max-w-[${value}]`
  }

  if (prop === 'min-height') {
    if (v === '100%' || v === '100vh') return 'min-h-screen'
    if (v === '0' || v === '0px') return 'min-h-0'
    return `min-h-[${value}]`
  }

  if (prop === 'height') {
    if (v === '100%') return 'h-full'
    if (v === '100vh') return 'h-screen'
    if (v === 'auto') return 'h-auto'
    const num = parseFloat(value)
    const u = value.replace(/[\d.]+/, '').trim()
    const px = pxFromAny(num, u, 16)
    if (px != null) return tailwindSpacing('h', px)
    return `h-[${value}]`
  }

  if (prop === 'font-size') {
    const num = parseFloat(value)
    const u = value.replace(/[\d.]+/, '').trim() || 'px'
    const px = pxFromAny(num, u, 16) ?? (u === 'px' ? num : null)
    if (px != null) {
      const sizes: [number, string][] = [
        [12, 'text-xs'],
        [14, 'text-sm'],
        [16, 'text-base'],
        [18, 'text-lg'],
        [20, 'text-xl'],
        [24, 'text-2xl'],
        [30, 'text-3xl'],
        [36, 'text-4xl'],
      ]
      for (const [p, c] of sizes) {
        if (Math.abs(px - p) < 1) return c
      }
      return `text-[${value}]`
    }
    return `text-[${value}]`
  }

  if (prop === 'line-height') {
    if (v === '1' || v === '1.0') return 'leading-none'
    if (v === '1.25') return 'leading-tight'
    if (v === '1.375') return 'leading-snug'
    if (v === '1.5') return 'leading-normal'
    if (v === '1.625') return 'leading-relaxed'
    if (v === '2') return 'leading-loose'
    return `leading-[${value}]`
  }

  if (prop === 'color' || prop === 'background-color') {
    const prefix = prop === 'color' ? 'text' : 'bg'
    if (v.startsWith('#')) {
      const hex = value.trim()
      if (/^#fff(fff)?$/i.test(hex)) return `${prefix}-white`
      if (/^#000(000)?$/i.test(hex)) return `${prefix}-black`
      return `${prefix}-[${hex}]`
    }
    if (v.startsWith('rgb')) return `${prefix}-[${value.trim()}]`
    const named: Record<string, string> = { transparent: `${prefix}-transparent`, inherit: `${prefix}-inherit`, currentcolor: `${prefix}-current` }
    if (named[v]) return named[v]
    const tw: Record<string, string> = {
      white: `${prefix}-white`,
      black: `${prefix}-black`,
      'slate-900': `${prefix}-slate-900`,
      'slate-800': `${prefix}-slate-800`,
      'slate-700': `${prefix}-slate-700`,
      'slate-600': `${prefix}-slate-600`,
      'slate-500': `${prefix}-slate-500`,
      'slate-400': `${prefix}-slate-400`,
      'slate-300': `${prefix}-slate-300`,
      'slate-200': `${prefix}-slate-200`,
      'slate-100': `${prefix}-slate-100`,
      'slate-50': `${prefix}-slate-50`,
    }
    if (tw[value.trim()]) return tw[value.trim()]
    return `${prefix}-[${value.trim()}]`
  }

  if (prop === 'border' || prop === 'border-width') {
    if (v === '0' || v === '0px' || v === 'none') return prop === 'border' ? 'border-0' : null
    if (value.includes('solid') && /\b1px\b/.test(value)) return 'border'
    return `border-[${value}]`
  }

  if (prop === 'border-radius') {
    if (v === '9999px' || v === '50%' || v === '100%') return 'rounded-full'
    if (v === '0' || v === '0px') return 'rounded-none'
    const num = parseFloat(value)
    const u = value.replace(/[\d.]+/, '').trim() || 'px'
    const px = pxFromAny(num, u, 16) ?? num
    const rounded: [number, string][] = [
      [2, 'rounded-sm'],
      [4, 'rounded'],
      [6, 'rounded-md'],
      [8, 'rounded-lg'],
      [12, 'rounded-xl'],
      [16, 'rounded-2xl'],
      [24, 'rounded-3xl'],
    ]
    for (const [p, c] of rounded) {
      if (Math.abs(px - p) < 1) return c
    }
    return `rounded-[${value}]`
  }

  if (prop === 'box-shadow') {
    if (v === 'none') return 'shadow-none'
    return `shadow-[${value.replace(/\\/g, '')}]`
  }

  if (prop === 'cursor') {
    const m: Record<string, string> = {
      pointer: 'cursor-pointer',
      default: 'cursor-default',
      'not-allowed': 'cursor-not-allowed',
      wait: 'cursor-wait',
      text: 'cursor-text',
      move: 'cursor-move',
      grab: 'cursor-grab',
    }
    return m[v] ?? null
  }

  if (prop === 'flex') {
    if (v === '1' || v === '1 1 0%' || v === '1 1 0') return 'flex-1'
    if (v === 'none') return 'flex-none'
    if (v === 'auto') return 'flex-auto'
    return null
  }

  if (prop === 'flex-grow') {
    if (value === '1') return 'grow'
    if (value === '0') return 'grow-0'
    return null
  }

  if (prop === 'flex-shrink') {
    if (value === '0') return 'shrink-0'
    if (value === '1') return 'shrink'
    return null
  }

  if (prop === 'object-fit') {
    const m: Record<string, string> = { contain: 'object-contain', cover: 'object-cover', fill: 'object-fill', none: 'object-none' }
    return m[v] ?? null
  }

  return null
}

function cssToTailwind(css: string): { classes: string[]; unmapped: string[] } {
  const decls = parseDeclarations(css)
  const classes: string[] = []
  const unmapped: string[] = []
  for (const { prop, value } of decls) {
    const c = convertDeclaration(prop, value)
    if (c) {
      for (const cl of c.split(/\s+/).filter(Boolean)) {
        if (!classes.includes(cl)) classes.push(cl)
      }
    } else {
      unmapped.push(`${prop}: ${value}`)
    }
  }
  return { classes, unmapped }
}

export function CssToTailwind() {
  const tool = getToolById('css-to-tailwind')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [classOnly, setClassOnly] = useState('')
  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const process = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setClassOnly('')
        setStatus('idle')
        setErrorMessage('')
        return
      }
      try {
        const { classes, unmapped } = cssToTailwind(value)
        const joined = classes.join(' ')
        const unmappedBlock =
          unmapped.length > 0
            ? `\n\n/* No direct Tailwind mapping — keep as custom CSS or arbitrary values:\n${unmapped.map((u) => ` * ${u}`).join('\n')}\n */`
            : ''
        const result = [
          '/* CSS input — see left panel for full source */',
          '',
          '/* Mapped Tailwind utility classes */',
          `className="${joined}"`,
          '',
          '/* Plain class string (Tailwind / cn usage) */',
          joined || '(no utilities mapped)',
          unmappedBlock,
        ].join('\n')
        setClassOnly(joined)
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        addToolHistory({ toolId: tool.id, input: value, output: result }, { source })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
        setClassOnly('')
      }
    },
    [addToolHistory, tool.id]
  )

  useEffect(() => {
    const draft = getToolDraft(tool.id)
    const initial = draft ?? EXAMPLE
    setInput(initial)
    if (autoRun) process(initial, 'example')
  }, [getToolDraft, tool.id, autoRun, process])

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value)
      setToolDraft(tool.id, value)
      if (autoRun) process(value)
    },
    [setToolDraft, tool.id, autoRun, process]
  )

  const handleHistorySelect = useCallback(
    (historicalInput: string) => {
      setInput(historicalInput)
      setToolDraft(tool.id, historicalInput)
      process(historicalInput)
    },
    [setToolDraft, tool.id, process]
  )

  const copyClasses = useCallback(async () => {
    if (!classOnly) {
      toast.error('Nothing to copy yet')
      return
    }
    await navigator.clipboard.writeText(classOnly)
    setCopied(true)
    toast.success('Tailwind classes copied')
    setTimeout(() => setCopied(false), 1500)
  }, [classOnly])

  return (
    <ToolShell
      tool={tool}
      onHistorySelect={handleHistorySelect}
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={copyClasses}
          disabled={!classOnly}
          aria-label="Copy Tailwind class string"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success-foreground" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          Copy classes
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="css"
          title="CSS input"
          placeholder="Paste CSS declarations…"
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="css"
          title="Tailwind mapping"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
