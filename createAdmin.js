
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  
  const User = require('../models/User')

  const existing = await User.findOne({ email: 'admin@keyforge.io' })
  if (existing) {
    console.log('Admin already exists:', existing.email)
    process.exit(0)
  }

  const passwordHash = await bcrypt.hash('Admin1234!', 12)
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@keyforge.io',
    passwordHash,
    role: 'ADMIN',
    plan: 'enterprise',
  })

  console.log(' Admin created!')
  console.log('   Email:    admin@keyforge.io')
  console.log('   Password: Admin1234!')
  console.log('   ID:       ' + admin._id)
  process.exit(0)
}

main().catch(err => {
  console.error(' Error:', err.message)
  process.exit(1)
})
