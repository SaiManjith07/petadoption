import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin.js';
import validator from 'validator';

// Load environment variables
dotenv.config({ path: '../.env' });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/petadoption';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const email = 'pavankumarkunukuntla@gmail.com';
    const password = 'PAVANkumar@0074';
    const name = 'Pavan Kumar';

    // Normalize email
    const normalizedEmail = validator.normalizeEmail(email);

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: normalizedEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin with this email already exists');
      console.log('Updating password...');
      existingAdmin.password = password; // Will be hashed by pre-save hook
      existingAdmin.name = name;
      existingAdmin.is_active = true;
      existingAdmin.is_verified = true;
      await existingAdmin.save();
      console.log('✅ Admin password updated successfully');
      console.log('Email:', normalizedEmail);
      console.log('Name:', name);
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
    console.log('Email:', admin.email);
    console.log('Name:', admin.name);
    console.log('ID:', admin._id);
    console.log('Active:', admin.is_active);
    console.log('Verified:', admin.is_verified);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the script
createAdmin();
