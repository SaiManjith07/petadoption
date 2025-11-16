// Usage: node scripts/set-admin-password.js
// This script sets or resets the password for an admin user in MongoDB

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const email = 'pavankumar@gmail.com';
const newPassword = '1234567890';

async function setAdminPassword() {
  await mongoose.connect(MONGODB_URI);
  const user = await User.findOne({ email });
  if (!user) {
    // Create admin user if not exists
    const hashed = await bcryptjs.hash(newPassword, 10);
    await User.create({
      name: 'Admin',
      email,
      password: newPassword,
      role: 'admin',
      is_verified: true,
      is_active: true,
    });
    console.log('Admin user created and password set.');
  } else {
    // Update password for existing admin
    user.password = newPassword;
    await user.save();
    console.log('Admin password updated.');
  }
  await mongoose.disconnect();
}

setAdminPassword().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
