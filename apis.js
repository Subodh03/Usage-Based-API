const express = require('express')
const auth    = require('../middleware/auth')
const Api     = require('../models/Api')
const ApiKey  = require('../models/ApiKey')
const { generateKey, revokeKey, rotateKey } = require('../services/keyService')
const router  = express.Router()


router.get('/', auth(), async (req, res) => {
  try {
    const query = req.user.role === 'ADMIN' ? {} : { owner: req.user.userId }
    const apis  = await Api.find(query).populate('owner', 'name email plan')
    res.json(apis)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})


router.post('/', auth(), async (req, res) => {
  try {
    const { name, plan = 'free', rateLimit = 1000 } = req.body
    const api = await Api.create({ name, owner: req.user.userId, plan, rateLimit })
    res.status(201).json(api)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})


router.get('/:apiId/keys', auth(), async (req, res) => {
  try {
    const keys = await ApiKey.find({ api: req.params.apiId })
      .select('-keyHash')
      .sort({ createdAt: -1 })
    res.json(keys)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})


router.post('/:apiId/keys', auth(), async (req, res) => {
  try {
    const { key, raw } = await generateKey(req.params.apiId, req.user.userId)
    
    res.status(201).json({
      id: key._id,
      keyPrefix: key.keyPrefix,
      status: key.status,
      createdAt: key.createdAt,
      api: key.api,
      key: raw, // raw shown once only
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})


router.delete('/:apiId/keys/:keyId', auth(), async (req, res) => {
  try {
    await revokeKey(req.params.keyId)
    res.json({ success: true, message: 'Key revoked immediately' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/:apiId/keys/:keyId/rotate', auth(), async (req, res) => {
  try {
    const { key, raw } = await rotateKey(req.params.keyId, req.params.apiId, req.user.userId)
    res.json({
      id: key._id,
      keyPrefix: key.keyPrefix,
      status: key.status,
      createdAt: key.createdAt,
      key: raw,
      grace: '5 minutes — old key still valid during grace period',
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
