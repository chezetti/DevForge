'use client'

import { useCallback, useEffect, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { getToolById } from '@/config/tool-registry'
import { useAppStore } from '@/store/app-store'

const EXAMPLE = `<div class="container"><label for="name">Name</label><input type="text" tabindex="1" style="color: red; font-size: 14px" /><button onclick="submit()">Submit</button></div>`

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

const ATTR_RENAME: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  crossorigin: 'crossOrigin',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  autoplay: 'autoPlay',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  frameborder: 'frameBorder',
  novalidate: 'noValidate',
  playsinline: 'playsInline',
  spellcheck: 'spellCheck',
  srcset: 'srcSet',
  usemap: 'useMap',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  formenctype: 'formEncType',
  formmethod: 'formMethod',
  formnovalidate: 'formNoValidate',
  formtarget: 'formTarget',
  inputmode: 'inputMode',
  itemid: 'itemID',
  itemprop: 'itemProp',
  itemref: 'itemRef',
  itemscope: 'itemScope',
  itemtype: 'itemType',
  acceptcharset: 'acceptCharset',
  allowfullscreen: 'allowFullScreen',
  allowtransparency: 'allowTransparency',
  referrerpolicy: 'referrerPolicy',
  imagesizes: 'imageSizes',
  imagesrcset: 'imageSrcSet',
  fetchpriority: 'fetchPriority',
}

const BOOLEAN_ATTR_LOWER = new Set([
  'disabled',
  'checked',
  'selected',
  'required',
  'readonly',
  'multiple',
  'muted',
  'hidden',
  'loop',
  'open',
  'reversed',
  'scoped',
  'defer',
  'async',
  'ismap',
  'novalidate',
  'autoplay',
  'controls',
  'default',
  'reversed',
  'allowfullscreen',
  'playsinline',
])

function kebabToCamel(prop: string): string {
  return prop.replace(/-[a-z]/g, (m) => m[1].toUpperCase())
}

function domAttrToJsxName(name: string): string {
  const lower = name.toLowerCase()
  if (ATTR_RENAME[lower]) return ATTR_RENAME[lower]
  if (lower.startsWith('data-') || lower.startsWith('aria-')) return lower
  if (lower.startsWith('on') && lower.length > 2) {
    const rest = lower.slice(2)
    return `on${rest.charAt(0).toUpperCase()}${rest.slice(1)}`
  }
  if (name.includes('-')) return kebabToCamel(name)
  return name
}

function cssPropertyToCamel(prop: string): string {
  return kebabToCamel(prop.trim().toLowerCase())
}

function styleStringToJsxObject(styleStr: string): string {
  const parts = styleStr
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
  const pairs = parts
    .map((p) => {
      const colon = p.indexOf(':')
      if (colon < 0) return null
      const key = cssPropertyToCamel(p.slice(0, colon).trim())
      const val = p.slice(colon + 1).trim()
      return { key, val }
    })
    .filter(Boolean) as { key: string; val: string }[]

  if (pairs.length === 0) return '{}'

  const inner = pairs
    .map(({ key, val }) => {
      const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      return `    ${key}: '${escaped}'`
    })
    .join(',\n')
  return `{\n${inner}\n  }`
}

function escapeAttrValue(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

function jsxTextChunk(t: string): string {
  const trimmed = t.replace(/^\n+|\n+$/g, '')
  if (!trimmed) return ''
  if (/^[\s\S]*[{<>}&][\s\S]*$/.test(trimmed) || trimmed.includes('\n')) {
    return `{${JSON.stringify(trimmed)}}`
  }
  return trimmed
}

function stringifyStyleFromDom(el: Element): string | null {
  const inline = el.getAttribute('style')
  if (inline?.trim()) return inline
  const { style } = el as HTMLElement
  if (!style?.length) return null
  const parts: string[] = []
  for (let i = 0; i < style.length; i++) {
    const name = style.item(i)
    const val = style.getPropertyValue(name).trim()
    if (val) parts.push(`${name}: ${val}`)
  }
  return parts.length ? parts.join('; ') : null
}

function formatAttr(name: string, value: string, el: Element): string | null {
  const lower = name.toLowerCase()
  const jsxName = domAttrToJsxName(name)

  if (lower === 'style') {
    const s = stringifyStyleFromDom(el) ?? value
    if (!s.trim()) return null
    return `style={${styleStringToJsxObject(s)}}`
  }

  if (BOOLEAN_ATTR_LOWER.has(lower)) {
    const v = value.toLowerCase()
    if (v === 'false' || v === '0') return null
    return jsxName
  }

  if (value === '') {
    return `${jsxName}=""`
  }

  const escaped = escapeAttrValue(value)
  return `${jsxName}="${escaped}"`
}

function serializeNode(node: Node, indent: string): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent ?? ''
    const chunk = jsxTextChunk(t)
    if (!chunk) return ''
    return `${indent}${chunk}`
  }

  if (node.nodeType === Node.COMMENT_NODE) {
    const c = (node as Comment).data.trim()
    return `${indent}{/* ${c.replace(/\*\//g, '* /')} */}`
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const isVoid = VOID_TAGS.has(tag)

  let attrs = ''
  const seen = new Set<string>()
  for (const attr of Array.from(el.attributes)) {
    const n = attr.name
    const key = n.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    let v = attr.value
    if (key === 'style') {
      const s = stringifyStyleFromDom(el)
      if (s) v = s
    }
    const piece = formatAttr(n, v, el)
    if (piece) attrs += ` ${piece}`
  }

  if (isVoid) {
    return `${indent}<${tag}${attrs} />`
  }

  const children = Array.from(el.childNodes)
    .map((ch) => serializeNode(ch, indent))
    .filter(Boolean)
    .join('\n')

  if (!children.trim()) {
    return `${indent}<${tag}${attrs}></${tag}>`
  }

  return `${indent}<${tag}${attrs}>\n${children}\n${indent}</${tag}>`
}

function htmlToJsx(html: string): string {
  const wrapped = `<body>${html}</body>`
  const doc = new DOMParser().parseFromString(wrapped, 'text/html')
  const body = doc.body
  if (!body) throw new Error('Could not parse HTML')

  const parts = Array.from(body.childNodes)
    .map((n) => serializeNode(n, ''))
    .filter(Boolean)

  return parts.join('\n').trim()
}

export function HtmlToJsx() {
  const tool = getToolById('html-to-jsx')!
  const { getToolDraft, setToolDraft, addToolHistory, autoRun } = useAppStore()
  const [input, setInput] = useState(EXAMPLE)
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const process = useCallback(
    (value: string, source: 'user' | 'example' = 'user') => {
      if (!value.trim()) {
        setOutput('')
        setStatus('idle')
        setErrorMessage('')
        return
      }
      try {
        const result = htmlToJsx(value)
        setOutput(result)
        setStatus('success')
        setErrorMessage('')
        addToolHistory({ toolId: tool.id, input: value, output: result }, { source })
      } catch (e) {
        setStatus('error')
        setErrorMessage((e as Error).message)
        setOutput('')
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

  return (
    <ToolShell tool={tool} onHistorySelect={handleHistorySelect}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={handleInputChange}
          language="html"
          title="HTML"
          placeholder="Paste HTML…"
          minHeight="400px"
        />
        <OutputPanel
          value={output}
          language="typescript"
          title="JSX"
          status={status}
          errorMessage={errorMessage}
          minHeight="400px"
        />
      </div>
    </ToolShell>
  )
}
