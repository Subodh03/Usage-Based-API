const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({
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
  period: String,       
  periodLabel: String,  
  plan: String,
  totalRequests: Number,
  includedRequests: Number,
  billableRequests: Number,
  ratePerRequest: Number,
  amount: Number,       
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paidAt: Date,
}, { timestamps: true })

module.exports = mongoose.model('Invoice', invoiceSchema)
