const express = require('express')
const auth    = require('../middleware/auth')
const User    = require('../models/User')
const Api     = require('../models/Api')
const router  = express.Router()

const PLAN_LIMITS = { free: 1000, pro: 100000, enterprise: 1000000 }


router.post('/', auth(), async (req, res) => {
  try {
    const { plan } = req.body
    if (!['pro', 'enterprise'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' })

    const user = await User.findByIdAndUpdate(req.user.userId, { plan }, { new: true }).select('-passwordHash -refreshTokens')
    const api  = await Api.findOneAndUpdate(
      { owner: req.user.userId },
      { plan, rateLimit: PLAN_LIMITS[plan] },
      { new: true }
    )

    res.json({ success: true, plan: user.plan, rateLimit: api.rateLimit, user })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
