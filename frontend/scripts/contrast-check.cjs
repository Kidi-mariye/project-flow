const fs = require('fs')
const path = require('path')

function hexToRgb(hex) {
  if (!hex) return null
  let h = hex.replace('#','').trim()
  if (h.length===3) h = h.split('').map(c=>c+c).join('')
  const int = parseInt(h,16)
  return [ (int>>16)&255, (int>>8)&255, int&255 ]
}

function srgb2lin(c){ c = c/255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4) }
function luminance(rgb){ return 0.2126*srgb2lin(rgb[0]) + 0.7152*srgb2lin(rgb[1]) + 0.0722*srgb2lin(rgb[2]) }
function contrastRatio(a,b){ const L1 = Math.max(a,b); const L2 = Math.min(a,b); return (L1+0.05)/(L2+0.05) }

const cssPath = path.join(__dirname,'..','src','index.css')
if(!fs.existsSync(cssPath)){ console.error('index.css not found at', cssPath); process.exit(2) }
const css = fs.readFileSync(cssPath,'utf8')
const lineRe = /--([a-z0-9-]+):\s*([^;]+);/g
let m; const tokens = {}
while((m=lineRe.exec(css))){
  const name = m[1]
  const raw = m[2].trim()
  tokens[name] = raw
}

// resolve var() references to hex where possible
function resolveToken(name, seen=new Set()){
  if(!tokens[name]) return null
  const v = tokens[name]
  const hexMatch = v.match(/^#([0-9A-Fa-f]{3,6})$/)
  if(hexMatch) return '#'+hexMatch[1]
  const varMatch = v.match(/^var\(--([a-z0-9-]+)\)$/)
  if(varMatch){
    const other = varMatch[1]
    if(seen.has(other)) return null
    seen.add(other)
    return resolveToken(other, seen)
  }
  return null
}

const checks = [
  { a: '--text-900', b: '--bg-page', name: 'Body text on page background', min: 4.5 },
  { a: '--text-on-dark', b: '--bg-dark', name: 'Text on dark background', min: 4.5 },
  { a: '--status-blocked', b: '--bg-surface', name: 'Blocked status on surface', min: 3 },
  { a: '--status-done', b: '--bg-surface', name: 'Done status on surface', min: 3 },
  { a: '--primary-500', b: '--bg-page', name: 'Primary on page', min: 3 },
  { a: '--primary-600', b: '--bg-page', name: 'Primary-600 on page', min: 3 },
]

console.log('Loaded tokens:', Object.keys(tokens).length)

const results = []
for(const c of checks){
  const aKey = c.a.replace(/^--/,'')
  const bKey = c.b.replace(/^--/,'')
  const ha = resolveToken(aKey)
  const hb = resolveToken(bKey)
  if(!ha || !hb){ results.push({name:c.name, ok:false, reason:'missing token', a:ha, b:hb}); continue }
  const ra = luminance(hexToRgb(ha))
  const rb = luminance(hexToRgb(hb))
  const cr = contrastRatio(ra,rb)
  results.push({ name: c.name, ratio: Number(cr.toFixed(2)), ok: cr>=c.min, a:ha, b:hb, min:c.min })
}

console.log('\nContrast Report:\n')
for(const r of results){
  if(r.ok) console.log(`✅ ${r.name}: ${r.ratio} >= ${r.min} ( ${r.a} on ${r.b} )`)
  else console.log(`❌ ${r.name}: ${r.ratio||'N/A'} < ${r.min} ( ${r.a||'?'} on ${r.b||'?'} )`) 
}

console.log('\nTokens found:')
for(const k of Object.keys(tokens).sort()) console.log(`--${k}: ${tokens[k]}`)
