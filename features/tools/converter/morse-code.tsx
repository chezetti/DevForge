'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'
import { ToolShell } from '@/components/tools/tool-shell'
import { EditorPanel } from '@/components/tools/editor-panel'
import { OutputPanel } from '@/components/tools/output-panel'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const EXAMPLE_PLAIN = 'HELLO WORLD'
const EXAMPLE_MORSE =
  '.... . .-.. .-.. --- / .-- --- .-. .-.. -..'

const LETTER_TO_MORSE: Record<string, string> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
}

const MORSE_TO_LETTER: Map<string, string> = new Map(
  Object.entries(LETTER_TO_MORSE).map(([k, v]) => [v, k])
)

type Mode = 'to-morse' | 'from-morse'

function textToMorse(text: string): string {
  return text
    .trim()
    .toUpperCase()
    .split(/\s+/)
    .map((word) =>
      [...word]
        .map((ch) => {
          if (ch === ' ') return ''
          const code = LETTER_TO_MORSE[ch]
          if (!code) throw new Error(`Unsupported character for Morse: "${ch}"`)
          return code
        })
        .filter(Boolean)
        .join(' ')
    )
    .filter(Boolean)
    .join(' / ')
}

function morseToText(morse: string): string {
  const normalized = morse.trim().replace(/\s+/g, ' ')
  if (!normalized) return ''
  const words = normalized.split(' / ')
  const out: string[] = []
  for (const w of words) {
    const letters = w.split(' ').filter(Boolean)
    const chars = letters.map((seq) => {
      const letter = MORSE_TO_LETTER.get(seq)
      if (!letter) throw new Error(`Unknown Morse pattern: "${seq}"`)
      return letter
    })
    out.push(chars.join(''))
  }
  return out.join(' ')
}

export function MorseCode() {
  const [mode, setMode] = useState<Mode>('to-morse')
  const [input, setInput] = useState(EXAMPLE_PLAIN)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const playingRef = useRef(false)

  const handleModeChange = (v: string) => {
    const next = v as Mode
    setMode(next)
    setInput(next === 'to-morse' ? EXAMPLE_PLAIN : EXAMPLE_MORSE)
  }

  const { output, error } = useMemo(() => {
    if (!input.trim()) return { output: '', error: null as string | null }
    try {
      if (mode === 'to-morse') return { output: textToMorse(input), error: null }
      return { output: morseToText(input), error: null }
    } catch (e) {
      return { output: '', error: (e as Error).message }
    }
  }, [input, mode])

  const playMorse = useCallback(async () => {
    const morse = mode === 'to-morse' ? output : input
    if (!morse.trim() || playingRef.current) return
    playingRef.current = true
    try {
      const ctx = audioCtxRef.current ?? new AudioContext()
      audioCtxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()

      const dot = 0.08
      const freq = 600
      let t = ctx.currentTime + 0.05

      const beep = (start: number, duration: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(0.15, start + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration - 0.02)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + duration)
      }

      for (const ch of morse) {
        if (ch === '.') {
          beep(t, dot)
          t += dot + dot
        } else if (ch === '-') {
          beep(t, dot * 3)
          t += dot * 3 + dot
        } else if (ch === ' ') {
          t += dot * 2
        } else if (ch === '/') {
          t += dot * 4
        }
      }
    } finally {
      setTimeout(() => {
        playingRef.current = false
      }, 4000)
    }
  }, [input, output, mode])

  return (
    <ToolShell
      toolId="morse-code"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={handleModeChange}>
            <TabsList className="h-8 bg-background">
              <TabsTrigger value="to-morse" className="text-xs h-6 px-2.5">
                Text → Morse
              </TabsTrigger>
              <TabsTrigger value="from-morse" className="text-xs h-6 px-2.5">
                Morse → Text
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => void playMorse()}
            disabled={!input.trim() && !output.trim()}
            title="Play Morse (Web Audio)"
          >
            <Volume2 className="h-3.5 w-3.5" />
            Play
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-0">
        <EditorPanel
          value={input}
          onChange={setInput}
          language="plaintext"
          title={mode === 'to-morse' ? 'Plain text' : 'Morse'}
          placeholder={
            mode === 'to-morse'
              ? 'Letters, numbers, common punctuation…'
              : 'Use . and - ; separate letters with space, words with /'
          }
          minHeight="360px"
        />
        <OutputPanel
          value={output}
          language="plaintext"
          title={mode === 'to-morse' ? 'Morse' : 'Plain text'}
          status={error ? 'error' : output ? 'success' : 'idle'}
          errorMessage={error || undefined}
          emptyHint={mode === 'from-morse' ? 'Enter Morse on the left' : 'Enter text on the left'}
          minHeight="360px"
        />
      </div>
    </ToolShell>
  )
}
