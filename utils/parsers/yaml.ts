import YAML from 'yaml'

export function jsonToYaml(jsonString: string): string {
  const parsed = JSON.parse(jsonString)
  return YAML.stringify(parsed, { indent: 2 })
}

export function yamlToJson(yamlString: string, pretty: boolean = true): string {
  const parsed = YAML.parse(yamlString)
  return JSON.stringify(parsed, null, pretty ? 2 : 0)
}

export function detectFormat(input: string): 'json' | 'yaml' | 'unknown' {
  const trimmed = input.trim()
  
  // JSON starts with { or [
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed)
      return 'json'
    } catch {
      // Not valid JSON
    }
  }
  
  // Try YAML
  try {
    const parsed = YAML.parse(trimmed)
    if (typeof parsed === 'object' && parsed !== null) {
      return 'yaml'
    }
  } catch {
    // Not valid YAML
  }
  
  return 'unknown'
}
