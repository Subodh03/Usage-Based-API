const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const ApiKey = require('../models/ApiKey')

const PLANS = {
  free:       { included: 1000,    ratePerReq: 0 },
  pro:        { included: 100000,  ratePerReq: 0.0001 },
  enterprise: { included: 1000000, ratePerReq: 0.00005 },
}

async function generateKey(apiId, ownerId) {
  const raw    = 'sk_live_' + crypto.randomBytes(32).toString('base64url').slice(0, 40)
  const hash   = await bcrypt.hash(raw, 10)
  const prefix = raw.slice(0, 16) + '...'

  const key = await ApiKey.create({
    api: apiId,
    owner: ownerId,
    keyHash: hash,
    keyPrefix: prefix,
    status: 'active',
  })

  return { key, raw } 
}

async function revokeKey(keyId) {
  return ApiKey.findByIdAndUpdate(keyId, {
    status: 'revoked',
    revokedAt: new Date(),
  }, { new: true })
}

async function rotateKey(keyId, apiId, ownerId) {
  
  setTimeout(async () => {
    await ApiKey.findByIdAndUpdate(keyId, { status: 'rotated', revokedAt: new Date() })
  }, 5 * 60 * 1000)

  
  return generateKey(apiId, ownerId)
}

module.exports = { generateKey, revokeKey, rotateKey, PLANS }
