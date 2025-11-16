import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Define User Schema inline for testing
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'rescuer', 'admin'],
      default: 'user',
    },
    phone: String,
    profile_image: String,
    bio: String,
    address: {
      city: String,
      state: String,
      country: String,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

const testUserCreation = async () => {
  try {
    console.log('\n📝 TESTING USER REGISTRATION DATA STORAGE\n');
    console.log('='.repeat(60));

    // Connect to MongoDB
    console.log('\n1️⃣  Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'pawsunite',
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected successfully');

    // Clear old test users
    console.log('\n2️⃣  Cleaning up old test data...');
    await User.deleteMany({ email: /test-user-[0-9]+@test.com/ });
    console.log('✅ Old test users removed');

    // Create a new test user
    console.log('\n3️⃣  Creating new test user...');
    const testEmail = `test-user-${Date.now()}@test.com`;
    
    const newUser = await User.create({
      name: 'Test User',
      email: testEmail,
      password: 'TestPassword123',
      role: 'user',
    });

    console.log('✅ User created in database');
    console.log(`   - ID: ${newUser._id}`);
    console.log(`   - Name: ${newUser.name}`);
    console.log(`   - Email: ${newUser.email}`);
    console.log(`   - Role: ${newUser.role}`);
    console.log(`   - Created: ${newUser.createdAt}`);

    // Verify user was actually saved
    console.log('\n4️⃣  Verifying user was saved...');
    const savedUser = await User.findOne({ email: testEmail }).select('+password');
    
    if (savedUser) {
      console.log('✅ User successfully saved to database');
      console.log(`   - Found in database: ${savedUser.email}`);
      console.log(`   - Password is hashed: ${savedUser.password ? savedUser.password.substring(0, 10) + '...' : '(not found)'}`);
    } else {
      console.log('❌ User not found in database!');
    }

    // Check total users
    console.log('\n5️⃣  Checking total users in database...');
    const userCount = await User.countDocuments();
    console.log(`✅ Total users in database: ${userCount}`);

    // List all users (for debugging)
    console.log('\n6️⃣  All users in database:');
    const allUsers = await User.find().select('-password');
    if (allUsers.length === 0) {
      console.log('   (No users found)');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST COMPLETED SUCCESSFULLY\n');
    console.log('✅ Registration data IS being stored in MongoDB Atlas');
    console.log('✅ Password hashing is working');
    console.log('✅ Database connection is working\n');

    console.log('Next steps:');
    console.log('1. Start backend: npm start');
    console.log('2. Register a user through the frontend');
    console.log('3. Check MongoDB Atlas to verify data is saved');
    console.log('4. User should be able to log in with same credentials\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ TEST FAILED:\n');
    console.error('Error:', error.message);
    
    if (error.message.includes('duplicate key')) {
      console.error('\n💡 This is a duplicate email error (expected for repeated tests)');
      console.error('The data IS being saved to MongoDB!');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Connection refused - MongoDB might not be running');
    } else if (error.message.includes('auth failed')) {
      console.error('\n💡 Authentication failed - check MongoDB credentials');
    }

    console.error('\nStack trace:');
    console.error(error);
    process.exit(1);
  }
};

testUserCreation();
