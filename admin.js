const express  = require('express')
const auth     = require('../middleware/auth')
const User     = require('../models/User')
const Api      = require('../models/Api')
const ApiKey   = require('../models/ApiKey')
const Invoice  = require('../models/Invoice')
const UsageLog = require('../models/UsageLog')
const router   = express.Router()

router.use(auth('ADMIN'))


router.get('/stats', async (req, res) => {
  try {
    const [users, keys, totalReqs, pendingAmount] = await Promise.all([
      User.countDocuments({ role: 'API_OWNER' }),
      ApiKey.countDocuments({ status: 'active' }),
      UsageLog.countDocuments({ timestamp: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
      Invoice.aggregate([{ $match: { status: 'pending' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ])
    res.json({ users, activeKeys: keys, requestsToday: totalReqs, pendingRevenue: pendingAmount[0]?.total || 0 })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})


router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'API_OWNER' }).select('-passwordHash -refreshTokens').sort({ createdAt: -1 })
    const result = await Promise.all(users.map(async (u) => {
      const api = await Api.findOne({ owner: u._id })
      const keyCount = api ? await ApiKey.countDocuments({ api: api._id, status: 'active' }) : 0
      const pendingInvoice = api ? await Invoice.findOne({ api: api._id, status: 'pending' }) : null
      return { ...u.toObject(), apiId: api?._id, rateLimit: api?.rateLimit ?? 1000, activeKeys: keyCount, amountDue: pendingInvoice?.amount || 0 }
    }))
    res.json(result)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})


router.delete('/users/:userId', async (req, res) => {
  try {
    const userId = req.params.userId
    const apis = await Api.find({ owner: userId })
    const apiIds = apis.map(a => a._id)
    await UsageLog.deleteMany({ api: { $in: apiIds } })
    await ApiKey.deleteMany({ owner: userId })
    await Invoice.deleteMany({ owner: userId })
    await Api.deleteMany({ owner: userId })
    await User.findByIdAndDelete(userId)
    res.json({ success: true, message: 'User and all data deleted' })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})


router.patch('/users/:userId/limit', async (req, res) => {
  try {
    const { rateLimit } = req.body
    if (!rateLimit || isNaN(rateLimit) || rateLimit < 1) return res.status(400).json({ error: 'rateLimit must be a positive number' })
    const api = await Api.findOneAndUpdate({ owner: req.params.userId }, { rateLimit: parseInt(rateLimit) }, { new: true })
    if (!api) return res.status(404).json({ error: 'API not found' })
    res.json({ success: true, rateLimit: api.rateLimit })
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})


router.get('/keys', async (req, res) => {
  try {
    const keys = await ApiKey.find().select('-keyHash').populate('owner', 'name email').populate('api', 'name plan').sort({ createdAt: -1 })
    res.json(keys)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})


router.get('/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find().populate('owner', 'name email').populate('api', 'name').sort({ createdAt: -1 })
    res.json(invoices)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

module.exports = router
