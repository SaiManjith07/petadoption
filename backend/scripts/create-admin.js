// Usage: node -r dotenv/config backend/scripts/create-admin.js
// This script creates an admin user in the Admin collection

import mongoose from 'mongoose';
import Admin from '../src/models/Admin.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const email = 'pavankumar@gmail.com';
const password = '1234567890';
const name = 'Admin';

async function createAdmin() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI not set in environment.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  let admin = await Admin.findOne({ email });
  if (admin) {
    console.log('Admin already exists.');
  } else {
    admin = new Admin({ name, email, password });
    await admin.save();
    console.log('Admin created successfully.');
  }
  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
