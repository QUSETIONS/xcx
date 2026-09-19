import { readFile } from 'node:fs/promises'

const baseUrl = String(process.env.AGENT_EVAL_BASE_URL || 'http://localhost:3101/api').replace(/\/+$/, '')
const cases = JSON.parse(await readFile(new URL('../eval/agent-cases.json', import.meta.url), 'utf8'))

function argValue(name, fallback) {
  const value = process.argv.find(item => item.startsWith(`${name}=`))
  return value ? value.slice(name.length + 1) : fallback
}

const limit = Math.max(1, Math.min(cases.length, Number(argValue('--limit', cases.length)) || cases.length))
const delayMs = Math.max(0, Number(argValue('--delay-ms', 250)) || 0)
const concurrency = Math.max(1, Math.min(4, Number(argValue('--concurrency', 2)) || 2))
const requestedIds = String(argValue('--ids', '')).split(',').map(item => item.trim()).filter(Boolean)

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function containsAny(value, candidates = []) {
  const text = normalize(value)
  return candidates.some(candidate => text.includes(normalize(candidate)))
}

function validateResult(result, expected = {}) {
  const checks = []
  const arrays = ['tags', 'missing', 'questions', 'keywords']
  const required = ['schema_version', 'source', 'summary', 'intent', 'category', 'category_id', 'region', 'budget', 'start_time', 'confidence']

  checks.push({ name: 'schema', pass: required.every(key => Object.prototype.hasOwnProperty.call(result || {}, key)) && result?.schema_version === 1 })
  checks.push({
    name: 'shape',
    pass: arrays.every(key => Array.isArray(result?.[key]) && result[key].every(item => typeof item === 'string'))
      && result?.tags.length <= 5
      && result?.missing.length <= 4
      && result?.questions.length <= 3
      && result?.keywords.length <= 8
  })
  checks.push({ name: 'confidence', pass: Number.isFinite(result?.confidence) && result.confidence >= 0 && result.confidence <= 1 })

  if (expected.category_any) checks.push({ name: 'category', pass: containsAny(result?.category, expected.category_any) })
  if (expected.region) checks.push({ name: 'region', pass: normalize(result?.region) === normalize(expected.region) })
  if (expected.budget_any) checks.push({ name: 'budget', pass: containsAny(result?.budget, expected.budget_any) })
  if (expected.start_any) checks.push({ name: 'start_time', pass: containsAny(result?.start_time, expected.start_any) })
  if (expected.keywords_any) {
    const keywordText = [...(result?.tags || []), ...(result?.keywords || []), result?.summary].join(' ')
    checks.push({ name: 'keywords', pass: containsAny(keywordText, expected.keywords_any) })
  }
  if (expected.missing_any) {
    const missingText = [...(result?.missing || []), ...(result?.questions || [])].join(' ')
    checks.push({ name: 'missing', pass: containsAny(missingText, expected.missing_any) })
  }
  if (Number.isFinite(expected.confidence_max)) {
    checks.push({ name: 'confidence_max', pass: Number.isFinite(result?.confidence) && result.confidence <= expected.confidence_max })
  }

  return checks
}

async function post(path, body, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(65000)
  })
  return { response, body: await response.json() }
}

const login = await post('/auth/demo-login', { role: 'user' })
const token = login.body?.data?.token
if (!token) {
  console.error(`[agent-eval] login failed: ${login.body?.message || login.response.status}`)
  process.exit(1)
}

const selected = requestedIds.length ? cases.filter(item => requestedIds.includes(item.id)) : cases.slice(0, limit)
async function evaluate(item) {
  try {
    const { response, body } = await post('/agent/organize', { text: item.text }, token)
    const checks = body?.code === 0 ? validateResult(body.data, item.expect) : [{ name: 'http', pass: false }]
    const passed = checks.every(check => check.pass)
    const score = `${checks.filter(check => check.pass).length}/${checks.length}`
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${item.id} ${score} http=${response.status} confidence=${body?.data?.confidence ?? '-'} ${body?.data?.category || body?.message || ''}`)
    if (!passed) {
      console.log(`       failed=${checks.filter(check => !check.pass).map(check => check.name).join(',')}`)
      console.log(`       result=${JSON.stringify({ category: body?.data?.category, region: body?.data?.region, budget: body?.data?.budget, start_time: body?.data?.start_time, tags: body?.data?.tags, keywords: body?.data?.keywords })}`)
      console.log(`       text=${item.text}`)
    }
    return { id: item.id, passed, checks, result: body?.data || null }
  } catch (error) {
    console.log(`[FAIL] ${item.id} request=${error.message}`)
    return { id: item.id, passed: false, checks: [{ name: 'request', pass: false }], error: error.message }
  }
}

const results = []
for (let index = 0; index < selected.length; index += concurrency) {
  const batch = selected.slice(index, index + concurrency)
  results.push(...await Promise.all(batch.map(evaluate)))
  if (delayMs && index + concurrency < selected.length) {
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
}

const passed = results.filter(item => item.passed).length
const summary = { total: results.length, passed, failed: results.length - passed, pass_rate: results.length ? passed / results.length : 0 }
console.log(`[agent-eval] ${passed}/${results.length} cases passed (${Math.round(summary.pass_rate * 100)}%)`)
if (summary.failed > 0) process.exitCode = 1
