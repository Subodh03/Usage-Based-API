const express = require('express')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const User    = require('../models/User')
const Api     = require('../models/Api')
const router  = express.Router()

const PLAN_LIMITS = { free: 1000, pro: 100000, enterprise: 1000000 }

function signAccess(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '15m' })
}
function signRefresh(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })
}


router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, plan = 'free' } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' })
    }

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, email, passwordHash, plan })

    
    const api = await Api.create({
      name: name + "'s API",
      owner: user._id,
      plan,
      rateLimit: PLAN_LIMITS[plan] || 1000,
    })

    const accessToken  = signAccess(user._id, user.role)
    const refreshToken = signRefresh(user._id)

    
    user.refreshTokens.push(await bcrypt.hash(refreshToken, 8))
    await user.save()

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan },
      apiId: api._id,
    })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await user.comparePassword(password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    
    const api = await Api.findOne({ owner: user._id })

    const accessToken  = signAccess(user._id, user.role)
    const refreshToken = signRefresh(user._id)

    user.refreshTokens.push(await bcrypt.hash(refreshToken, 8))
    
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5)
    await user.save()

    res.json({
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan },
      apiId: api?._id || null,
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})


router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user    = await User.findById(payload.userId)
    if (!user) return res.status(401).json({ error: 'User not found' })

    
    let matched = false
    for (const hash of user.refreshTokens) {
      if (await bcrypt.compare(refreshToken, hash)) { matched = true; break }
    }
    if (!matched) return res.status(401).json({ error: 'Invalid refresh token' })

    const newAccess  = signAccess(user._id, user.role)
    const newRefresh = signRefresh(user._id)

    
    user.refreshTokens.push(await bcrypt.hash(newRefresh, 8))
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5)
    await user.save()

    res.json({ accessToken: newAccess, refreshToken: newRefresh })
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' })
  }
})

module.exports = router
