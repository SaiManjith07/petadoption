import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin.js';
import validator from 'validator';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const email = 'pavankumarkunukuntla@gmail.com';
    const password = 'PAVANkumar@0074';
    const name = 'Pavan Kumar';

    // Normalize email
    const normalizedEmail = validator.normalizeEmail(email);
    console.log('📧 Normalized email:', normalizedEmail);

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin with this email already exists');
      console.log('Updating admin details...');
      existingAdmin.password = password; // Will be hashed by pre-save hook
      existingAdmin.name = name;
      existingAdmin.is_active = true;
      existingAdmin.is_verified = true;
      await existingAdmin.save();
      console.log('✅ Admin updated successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Admin Account Details:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.name}`);
      console.log(`  ID: ${existingAdmin._id}`);
      console.log(`  Active: ${existingAdmin.is_active}`);
      console.log(`  Verified: ${existingAdmin.is_verified}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await mongoose.disconnect();
      return;
    }

    // Create new admin
    const admin = await Admin.create({
      name: name,
      email: normalizedEmail,
      password: password, // Will be hashed by pre-save hook
      is_active: true,
      is_verified: true,
    });

    console.log('✅ Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Admin Account Details:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Name: ${admin.name}`);
    console.log(`  ID: ${admin._id}`);
    console.log(`  Active: ${admin.is_active}`);
    console.log(`  Verified: ${admin.is_verified}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Keep the credentials secure!');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    if (error.code === 11000) {
      console.error('   Duplicate email - admin may already exist');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
createAdmin();

