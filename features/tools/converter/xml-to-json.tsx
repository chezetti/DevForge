'use client'

import { useMemo, useState } from 'react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'

const EXAMPLE = `<root>
  <users>
    <user id="1">
      <name>Alice</name>
      <role>admin</role>
    </user>
    <user id="2">
      <name>Bob</name>
      <role>editor</role>
    </user>
  </users>
  <note><![CDATA[Raw <xml> & special chars]]></note>
</root>`

function mergeChild(target: Record<string, unknown>, key: string, value: unknown): void {
  if (!(key in target)) {
    target[key] = value
    return
  }
  const existing = target[key]
  if (Array.isArray(existing)) {
    existing.push(value)
  } else {
    target[key] = [existing, value]
  }
}

function elementToJson(el: Element): unknown {
  const attrs: Record<string, string> = {}
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes.item(i)!
    attrs[`@${a.name}`] = a.value
  }

  const hasElementChildren = el.children.length > 0
  let textAccum = ''
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE || n.nodeType === Node.CDATA_SECTION_NODE) {
      const data = (n as Text).data
      if (!hasElementChildren) textAccum += data
      else if (data.trim()) textAccum += data
    }
  }
  const textTrimmed = textAccum.trim()

  if (!hasElementChildren) {
    if (Object.keys(attrs).length === 0) return textTrimmed
    const o: Record<string, unknown> = { ...attrs }
    if (textTrimmed) o['#text'] = textTrimmed
    return o
  }

  const obj: Record<string, unknown> = { ...attrs }
  if (textTrimmed) obj['#text'] = textTrimmed

  for (const child of Array.from(el.children)) {
    mergeChild(obj, child.tagName, elementToJson(child))
  }
  return obj
}

function xmlStringToJsonObject(xml: string): Record<string, unknown> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const parseErr = doc.querySelector('parsererror')
  if (parseErr) {
    throw new Error(parseErr.textContent?.trim() || 'Invalid XML')
  }
  const root = doc.documentElement
  if (!root) throw new Error('Empty XML document')
  return { [root.tagName]: elementToJson(root) }
}

export function XmlToJson() {
  const [input, setInput] = useState(EXAMPLE)
  const { output, error } = useMemo(() => {
    const t = input.trim()
    if (!t) return { output: '', error: null as string | null }
    try {
      const obj = xmlStringToJsonObject(input)
      return { output: JSON.stringify(obj, null, 2), error: null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input])

  return (
    <ToolShell toolId="xml-to-json">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="xml"
          title="XML"
          minHeight="360px"
        />
        <OutputPanel
          value={output}
          language="json"
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
          minHeight="360px"
        />
      </div>
    </ToolShell>
  )
}
