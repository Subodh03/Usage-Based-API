const bcrypt   = require('bcryptjs')
const ApiKey   = require('../models/ApiKey')
const Api      = require('../models/Api')
const UsageLog = require('../models/UsageLog')
const redis    = require('../config/redis')

module.exports = async (req, res, next) => {
  const rawKey = req.headers['x-api-key']
  if (!rawKey) return res.status(401).json({ error: 'API key required. Pass x-api-key header.' })

  try {
    const activeKeys = await ApiKey.find({ status: 'active' })
    let matchedKey = null
    for (const k of activeKeys) {
      const match = await bcrypt.compare(rawKey, k.keyHash)
      if (match) { matchedKey = k; break }
    }
    if (!matchedKey) return res.status(401).json({ error: 'Invalid API key' })

    const api = await Api.findById(matchedKey.api)
    if (!api) return res.status(401).json({ error: 'API not found' })

    
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const usedThisMonth = await UsageLog.countDocuments({ api: api._id, timestamp: { $gte: startOfMonth } })

    if (usedThisMonth >= api.rateLimit) {
      return res.status(429).json({
        error: 'Free request limit reached',
        limitReached: true,               
        used: usedThisMonth,
        limit: api.rateLimit,
        plan: api.plan,
        upgradeUrl: '/?upgrade=1',
        message: `You have used ${usedThisMonth} of ${api.rateLimit} free requests. Upgrade to Pro for $0.0001/req with 100,000 included.`,
      })
    }

    req.apiContext = { apiId: api._id, keyId: matchedKey._id, keyPrefix: matchedKey.keyPrefix, rateLimit: api.rateLimit, usedThisMonth }
    next()
  } catch (err) {
    console.error('apiKeyAuth error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
