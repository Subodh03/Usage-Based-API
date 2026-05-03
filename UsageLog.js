const mongoose = require('mongoose')

const usageLogSchema = new mongoose.Schema({
  api: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Api',
    required: true,
  },
  apiKey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey',
    required: true,
  },
  keyPrefix: String,
  endpoint: String,
  statusCode: Number,
  latencyMs: Number,
  timestamp: {
    type: Date,
    default: Date.now,
  },
})


usageLogSchema.index({ api: 1, timestamp: -1 })
usageLogSchema.index({ apiKey: 1, timestamp: -1 })

module.exports = mongoose.model('UsageLog', usageLogSchema)
