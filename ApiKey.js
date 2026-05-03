const mongoose = require('mongoose')

const apiKeySchema = new mongoose.Schema({
  api: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  keyHash: {
    type: String,
    required: true,
  },
  
  keyPrefix: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'rotated'],
    default: 'active',
  },
  revokedAt: Date,
}, { timestamps: true })

module.exports = mongoose.model('ApiKey', apiKeySchema)
