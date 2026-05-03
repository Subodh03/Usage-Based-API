const mongoose = require('mongoose')

const apiSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  rateLimit: {
    type: Number,
    default: 1000, 
  },
}, { timestamps: true })

module.exports = mongoose.model('Api', apiSchema)
