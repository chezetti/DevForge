export interface CurlOptions {
  url: string
  method: string
  headers: Record<string, string>
  data?: string
}

export function parseCurl(curlCommand: string): CurlOptions {
  const result: CurlOptions = {
    url: '',
    method: 'GET',
    headers: {},
  }

  // Clean up the command
  let cmd = curlCommand.trim()
  if (cmd.startsWith('curl')) {
    cmd = cmd.slice(4).trim()
  }

  // Extract URL (first thing that looks like a URL or last argument without -)
  const urlMatch = cmd.match(/(["'])(https?:\/\/[^"']+)\1/) || 
                   cmd.match(/(https?:\/\/[^\s]+)/) ||
                   cmd.match(/['"]([^'"]+)['"]\s*$/)
  if (urlMatch) {
    result.url = urlMatch[2] || urlMatch[1]
  }

  // Extract method
  const methodMatch = cmd.match(/-X\s*['"]?(\w+)['"]?/)
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase()
  } else if (cmd.includes('-d') || cmd.includes('--data')) {
    result.method = 'POST'
  }

  // Extract headers
  const headerRegex = /-H\s*['"]([^'"]+)['"]/g
  let headerMatch
  while ((headerMatch = headerRegex.exec(cmd)) !== null) {
    const [key, ...valueParts] = headerMatch[1].split(':')
    result.headers[key.trim()] = valueParts.join(':').trim()
  }

  // Extract data
  const dataMatch = cmd.match(/(?:-d|--data|--data-raw)\s*['"]([\s\S]*?)['"]/) ||
                    cmd.match(/(?:-d|--data|--data-raw)\s*([^\s]+)/)
  if (dataMatch) {
    result.data = dataMatch[1]
  }

  return result
}

export function curlToFetch(curlCommand: string): string {
  const options = parseCurl(curlCommand)
  
  const lines: string[] = []
  lines.push(`const response = await fetch('${options.url}', {`)
  lines.push(`  method: '${options.method}',`)
  
  if (Object.keys(options.headers).length > 0) {
    lines.push('  headers: {')
    Object.entries(options.headers).forEach(([key, value]) => {
      lines.push(`    '${key}': '${value}',`)
    })
    lines.push('  },')
  }
  
  if (options.data) {
    const isJson = options.headers['Content-Type']?.includes('application/json')
    if (isJson) {
      try {
        const parsed = JSON.parse(options.data)
        lines.push(`  body: JSON.stringify(${JSON.stringify(parsed, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n')}),`)
      } catch {
        lines.push(`  body: '${options.data.replace(/'/g, "\\'")}',`)
      }
    } else {
      lines.push(`  body: '${options.data.replace(/'/g, "\\'")}',`)
    }
  }
  
  lines.push('});')
  lines.push('')
  lines.push('const data = await response.json();')
  
  return lines.join('\n')
}

export function curlToAxios(curlCommand: string): string {
  const options = parseCurl(curlCommand)
  
  const lines: string[] = []
  lines.push("import axios from 'axios';")
  lines.push('')
  lines.push(`const response = await axios({`)
  lines.push(`  method: '${options.method.toLowerCase()}',`)
  lines.push(`  url: '${options.url}',`)
  
  if (Object.keys(options.headers).length > 0) {
    lines.push('  headers: {')
    Object.entries(options.headers).forEach(([key, value]) => {
      lines.push(`    '${key}': '${value}',`)
    })
    lines.push('  },')
  }
  
  if (options.data) {
    try {
      const parsed = JSON.parse(options.data)
      lines.push(`  data: ${JSON.stringify(parsed, null, 4).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n')},`)
    } catch {
      lines.push(`  data: '${options.data.replace(/'/g, "\\'")}',`)
    }
  }
  
  lines.push('});')
  lines.push('')
  lines.push('console.log(response.data);')
  
  return lines.join('\n')
}

export function generateCodeFromCurl(
  parsed: CurlOptions,
  language: "javascript" | "python" | "go" | "php" | "ruby"
): string {
  if (language === "javascript") {
    return curlToFetch(`curl -X ${parsed.method} '${parsed.url}'`)
  }

  const headerLines = Object.entries(parsed.headers)
    .map(([k, v]) => `'${k}': '${v}'`)
    .join(", ")
  const dataLine = parsed.data ? `'${parsed.data.replace(/'/g, "\\'")}'` : "None"

  if (language === "python") {
    return [
      "import requests",
      "",
      `url = "${parsed.url}"`,
      `headers = {${headerLines}}`,
      `data = ${dataLine}`,
      `response = requests.${parsed.method.toLowerCase()}(url, headers=headers, data=data)`,
      "print(response.status_code)",
      "print(response.text)",
    ].join("\n")
  }

  if (language === "go") {
    return [
      "package main",
      "",
      'import ("fmt"; "net/http"; "strings")',
      "",
      "func main() {",
      `  payload := strings.NewReader(${parsed.data ? `"${parsed.data.replace(/"/g, '\\"')}"` : "\"\""})`,
      `  req, _ := http.NewRequest("${parsed.method}", "${parsed.url}", payload)`,
      "  client := &http.Client{}",
      "  res, _ := client.Do(req)",
      "  defer res.Body.Close()",
      "  fmt.Println(res.StatusCode)",
      "}",
    ].join("\n")
  }

  if (language === "php") {
    return [
      "<?php",
      "$ch = curl_init();",
      `curl_setopt($ch, CURLOPT_URL, "${parsed.url}");`,
      `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${parsed.method}");`,
      "curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);",
      parsed.data ? `curl_setopt($ch, CURLOPT_POSTFIELDS, '${parsed.data.replace(/'/g, "\\'")}');` : "",
      "$response = curl_exec($ch);",
      "echo $response;",
      "curl_close($ch);",
    ]
      .filter(Boolean)
      .join("\n")
  }

  return [
    "require 'net/http'",
    `uri = URI("${parsed.url}")`,
    `request = Net::HTTP::${parsed.method.charAt(0)}${parsed.method.slice(1).toLowerCase()}.new(uri)`,
    parsed.data ? `request.body = '${parsed.data.replace(/'/g, "\\'")}'` : "",
    "response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') { |http|",
    "  http.request(request)",
    "}",
    "puts response.body",
  ]
    .filter(Boolean)
    .join("\n")
}

export function parseHeaders(rawHeaders: string): Record<string, string> {
  const result: Record<string, string> = {}
  const lines = rawHeaders.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    const colonIndex = trimmed.indexOf(':')
    if (colonIndex === -1) continue
    
    const key = trimmed.slice(0, colonIndex).trim()
    const value = trimmed.slice(colonIndex + 1).trim()
    result[key] = value
  }
  
  return result
}

export interface QueryParam {
  key: string
  value: string
  enabled: boolean
}

export function buildQueryString(params: QueryParam[], encode: boolean = true): string {
  const enabledParams = params.filter(p => p.enabled && p.key)
  if (enabledParams.length === 0) return ''
  
  const pairs = enabledParams.map(p => {
    const key = encode ? encodeURIComponent(p.key) : p.key
    const value = encode ? encodeURIComponent(p.value) : p.value
    return `${key}=${value}`
  })
  
  return '?' + pairs.join('&')
}

export function parseQueryString(url: string): QueryParam[] {
  const questionIndex = url.indexOf('?')
  if (questionIndex === -1) return []
  
  const queryString = url.slice(questionIndex + 1)
  const pairs = queryString.split('&')
  
  return pairs.map(pair => {
    const [key, ...valueParts] = pair.split('=')
    return {
      key: decodeURIComponent(key || ''),
      value: decodeURIComponent(valueParts.join('=')),
      enabled: true,
    }
  })
}
