const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const failures = []

function read(relative) {
  const absolute = path.join(root, relative)
  if (!fs.existsSync(absolute)) {
    failures.push(`ausente: ${relative}`)
    return ''
  }
  return fs.readFileSync(absolute, 'utf8')
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.next', '.git', 'playwright-report', 'test-results'].includes(entry.name)) continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(absolute, files)
    else files.push(absolute)
  }
  return files
}

const nextConfig = read('next.config.js')
for (const header of ['X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy', 'X-Frame-Options', 'Content-Security-Policy-Report-Only']) {
  if (!nextConfig.includes(header)) failures.push(`header ausente: ${header}`)
}
if (!nextConfig.includes('Strict-Transport-Security') || !nextConfig.includes("VERCEL_ENV === 'production'")) {
  failures.push('HSTS precisa existir e ficar restrito a VERCEL_ENV=production')
}

read('.github/workflows/ci.yml')
read('docs/RELEASE_POLICY.md')
read('docs/ROTAS.md')

const pkg = read('package.json')
for (const script of ['"lint"', '"typecheck"', '"build"', '"test"', '"test:unit"', '"test:bdd"', '"test:smoke"', '"verify"', '"hardening:check"']) {
  if (!pkg.includes(script)) failures.push(`script ausente: ${script}`)
}
if (pkg.includes('cucumber-js')) failures.push('script legado cucumber-js ainda está na raiz')

const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean)
for (const relative of tracked) {
  if (relative.endsWith('.stackdump') || relative === 'bash.exe.stackdump') failures.push(`dump versionado: ${relative}`)
  if (/(^|\/)(playwright-report|test-results)\//.test(relative)) failures.push(`artefato versionado: ${relative}`)
}

for (const file of walk(root)) {
  const relative = path.relative(root, file)
  if (!relative.startsWith('automação/')) continue
  const source = fs.readFileSync(file, 'utf8')
  if (!source.includes('waitForTimeout(')) continue
  const unjustified = source.split('\n').some((line) => line.includes('waitForTimeout(') && !line.includes('justificado:'))
  if (unjustified) failures.push(`waitForTimeout artificial: ${relative}`)
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}

console.log('hardening-check: ok')
