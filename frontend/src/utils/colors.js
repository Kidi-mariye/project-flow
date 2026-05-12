export function tokenToHex(varName) {
  if (typeof window === 'undefined' || !document || !document.documentElement) return null
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName)
  if (!v) return null
  return v.trim()
}

function hexToRgb(hex) {
  if (!hex) return null
  let h = hex.replace('#', '').trim()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const int = parseInt(h, 16)
  return [ (int >> 16) & 255, (int >> 8) & 255, int & 255 ]
}

export function tokenToRGBA(varName, alpha = 1) {
  const hex = tokenToHex(varName)
  if (!hex) return null
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

export function tokenRGB(varName) {
  // expects a --token-rgb custom property (comma-separated numbers) to be present
  if (typeof window === 'undefined' || !document || !document.documentElement) return null
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName)
  if (!v) return null
  return v.trim()
}
