require('dotenv').config()
const express   = require('express')
const helmet    = require('helmet')
const cors      = require('cors')
const path      = require('path')
const connectDB = require('./config/db')
const apiKeyAuth = require('./middleware/apiKeyAuth')
const { logRequest } = require('./services/usageService')

const app = express()
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

app.use('/auth',    require('./routes/auth'))
app.use('/apis',    require('./routes/apis'))
app.use('/usage',   require('./routes/usage'))
app.use('/billing', require('./routes/billing'))
app.use('/admin',   require('./routes/admin'))
app.use('/upgrade', require('./routes/upgrade'))


app.all('/v1/:endpoint(*)', apiKeyAuth, async (req, res) => {
  const start = Date.now()
  res.json({
    success: true,
    endpoint: req.params.endpoint,
    message: `Response from ${req.params.endpoint}`,
    timestamp: new Date().toISOString(),
    usage: { used: req.apiContext.usedThisMonth + 1, limit: req.apiContext.rateLimit }
  })
  logRequest({
    apiId: req.apiContext.apiId, keyId: req.apiContext.keyId,
    keyPrefix: req.apiContext.keyPrefix, endpoint: '/v1/' + req.params.endpoint,
    statusCode: 200, latencyMs: Date.now() - start,
  })
})

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }))
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')))

const PORT = process.env.PORT || 3000
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(` KeyForge running at http://localhost:${PORT}`)
    console.log(` Dashboard:  http://localhost:${PORT}`)
    console.log(`  Health:     http://localhost:${PORT}/health\n`)
  })
})
