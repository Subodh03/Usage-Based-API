const express = require('express')
const auth    = require('../middleware/auth')
const Invoice = require('../models/Invoice')
const { generateInvoice } = require('../services/usageService')
const router  = express.Router()


router.get('/:apiId/invoices', auth(), async (req, res) => {
  try {
    const invoices = await Invoice.find({ api: req.params.apiId }).sort({ createdAt: -1 })
    res.json(invoices)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})


router.post('/:apiId/invoices/generate', auth(), async (req, res) => {
  try {
    const invoice = await generateInvoice(req.params.apiId, req.user.userId)
    res.status(201).json(invoice)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/invoices/:invoiceId/pay', auth(), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.invoiceId,
      { status: 'paid', paidAt: new Date() },
      { new: true }
    )
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })
    res.json({ success: true, invoice })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
