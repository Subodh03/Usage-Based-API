const express = require('express')
const auth    = require('../middleware/auth')
const { getUsageSummary, getPerKeyUsage, getDailyUsage } = require('../services/usageService')
const router  = express.Router()


router.get('/:apiId', auth(), async (req, res) => {
  try {
    const now   = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end   = new Date()

    const [summary, perKey, daily] = await Promise.all([
      getUsageSummary(req.params.apiId, start, end),
      getPerKeyUsage(req.params.apiId, start, end),
      getDailyUsage(req.params.apiId, 7),
    ])

    res.json({ summary, perKey, daily })
  } catch (err) {
    console.error('Usage route error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
