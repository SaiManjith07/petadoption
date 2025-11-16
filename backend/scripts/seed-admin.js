import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'pawsunite',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'pavankumar@gmail.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('Admin Details:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.name}`);
      console.log(`  Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('1234567890', salt);

    // Create admin user
    const adminUser = await User.create({
      name: 'Pavan Kumar',
      email: 'pavankumar@gmail.com',
      password: hashedPassword,
      role: 'admin',
      phone: '+91-XXXXXXXXXX',
      is_verified: true,
      is_active: true,
      address: {
        city: 'Your City',
        state: 'Your State',
        country: 'India',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Account Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Password: 1234567890`);
    console.log(`  Name: ${adminUser.name}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log(`  ID: ${adminUser._id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Keep the credentials secure!');
    console.log('   Share admin credentials only with authorized personnel.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
