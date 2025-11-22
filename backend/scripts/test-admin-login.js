import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin.js';
import validator from 'validator';

dotenv.config();

const testAdminLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'pavankumarkunukuntla@gmail.com';
    const password = 'PAVANkumar@0074';
    const normalizedEmail = validator.normalizeEmail(email);

    console.log('\n🔍 Testing Admin Login...');
    console.log('Email:', normalizedEmail);

    // Find admin
    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Admin found');
    console.log('  Name:', admin.name);
    console.log('  Email:', admin.email);
    console.log('  Active:', admin.is_active);
    console.log('  Verified:', admin.is_verified);

    // Test password match
    const isMatch = await admin.matchPassword(password);
    console.log('\n🔐 Password Match Test:');
    console.log('  Password provided:', password);
    console.log('  Match result:', isMatch ? '✅ CORRECT' : '❌ INCORRECT');

    if (isMatch) {
      console.log('\n✅ Login test PASSED - Admin can login successfully!');
    } else {
      console.log('\n❌ Login test FAILED - Password does not match');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
};

testAdminLogin();
