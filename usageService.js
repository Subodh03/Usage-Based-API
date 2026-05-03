const UsageLog = require('../models/UsageLog')
const Invoice  = require('../models/Invoice')
const Api      = require('../models/Api')
const { PLANS } = require('./keyService')

// Log every request — fire and forget, never blocks the response
async function logRequest({ apiId, keyId, keyPrefix, endpoint, statusCode, latencyMs }) {
  UsageLog.create({ api: apiId, apiKey: keyId, keyPrefix, endpoint, statusCode, latencyMs })
    .catch(console.error)
}


async function getUsageSummary(apiId, startDate, endDate) {
  const api  = await Api.findById(apiId)
  const logs = await UsageLog.find({
    api: apiId,
    timestamp: { $gte: startDate, $lte: endDate },
    statusCode: { $lt: 400 },   
  })

  const allLogs  = await UsageLog.find({ api: apiId, timestamp: { $gte: startDate, $lte: endDate } })
  const total    = allLogs.length                                   
  const consumed = logs.length                                        
  const errors   = allLogs.filter(l => l.statusCode >= 400).length
  const latencies = allLogs.map(l => l.latencyMs).filter(Boolean)
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0

  const rateLimit  = api?.rateLimit ?? 1000
  const remaining  = Math.max(0, rateLimit - consumed)
  const usedPct    = rateLimit > 0 ? Math.min(100, Math.round((consumed / rateLimit) * 100)) : 0

  return { total, consumed, errors, avgLatency, rateLimit, remaining, usedPct }
}

async function getPerKeyUsage(apiId, startDate, endDate) {
  const logs = await UsageLog.aggregate([
    { $match: { api: apiId, timestamp: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: '$apiKey',
      requests:   { $sum: 1 },
      successful: { $sum: { $cond: [{ $lt: ['$statusCode', 400] }, 1, 0] } },
      errors:     { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
      avgLatency: { $avg: '$latencyMs' },
      keyPrefix:  { $first: '$keyPrefix' },
      lastUsed:   { $max: '$timestamp' },
    }},
  ])
  return logs
}

async function getDailyUsage(apiId, days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const logs = await UsageLog.aggregate([
    { $match: { api: apiId, timestamp: { $gte: since } } },
    { $group: {
      _id:   { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      count: { $sum: 1 },
    }},
    { $sort: { _id: 1 } },
  ])
  return logs
}

async function generateInvoice(apiId, ownerId) {
  const api  = await Api.findById(apiId)
  const plan = PLANS[api.plan] || PLANS.free

  const now         = new Date()
  const start       = new Date(now.getFullYear(), now.getMonth(), 1)
  const end         = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const period      = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const periodLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  const existing = await Invoice.findOne({ api: apiId, period })
  if (existing) return existing

  const { consumed } = await getUsageSummary(apiId, start, end)
  const billable = Math.max(0, consumed - plan.included)
  const amount   = parseFloat((billable * plan.ratePerReq).toFixed(4))

  return Invoice.create({
    api: apiId, owner: ownerId, period, periodLabel,
    plan: api.plan,
    totalRequests:    consumed,
    includedRequests: plan.included,
    billableRequests: billable,
    ratePerRequest:   plan.ratePerReq,
    amount,
    status: 'pending',
  })
}

module.exports = { logRequest, getUsageSummary, getPerKeyUsage, getDailyUsage, generateInvoice }
