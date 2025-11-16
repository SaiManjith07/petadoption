import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testUserRegistration = async () => {
  try {
    console.log('\n🧪 MONGODB USER REGISTRATION TEST\n');
    console.log('='.repeat(50));

    // Step 1: Check environment variables
    console.log('\n📋 Step 1: Checking Environment Variables...');
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'pawsunite';
    const jwtSecret = process.env.JWT_SECRET;

    if (!mongoUri) {
      throw new Error('❌ MONGODB_URI not found in .env');
    }
    if (!jwtSecret) {
      throw new Error('❌ JWT_SECRET not found in .env');
    }

    console.log('✅ MONGODB_URI found');
    console.log(`✅ Database Name: ${dbName}`);
    console.log('✅ JWT_SECRET found');

    // Step 2: Connect to MongoDB
    console.log('\n📊 Step 2: Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(mongoUri, {
      dbName: dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.db.databaseName}`);

    // Step 3: Check User Collection
    console.log('\n👥 Step 3: Checking Users Collection...');
    const collections = await conn.connection.db.listCollections().toArray();
    const hasUsersCollection = collections.some(c => c.name === 'users');
    
    if (hasUsersCollection) {
      console.log('✅ Users collection exists');
      
      // Count existing users
      const userCount = await conn.connection.db.collection('users').countDocuments();
      console.log(`📈 Current user count: ${userCount}`);

      // Show sample user if exists
      if (userCount > 0) {
        const sampleUser = await conn.connection.db.collection('users').findOne();
        console.log('\n📄 Sample user document:');
        console.log('   ID:', sampleUser._id);
        console.log('   Name:', sampleUser.name);
        console.log('   Email:', sampleUser.email);
        console.log('   Role:', sampleUser.role);
        console.log('   Created:', sampleUser.createdAt);
        console.log('   Password hashed:', sampleUser.password.substring(0, 10) + '...');
      }
    } else {
      console.log('⚠️  Users collection does not exist yet (will be created on first user)');
    }

    // Step 4: Check Database Size
    console.log('\n💾 Step 4: Checking Database Stats...');
    const stats = await conn.connection.db.stats();
    console.log(`✅ Total collections: ${stats.collections}`);
    console.log(`✅ Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);

    // Step 5: Create Test User (Optional)
    console.log('\n🧪 Step 5: Ready to Test Registration...');
    console.log('✅ All checks passed!');
    console.log('✅ MongoDB is properly configured');
    console.log('✅ Ready for user registration');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE VERIFICATION COMPLETE\n');
    console.log('Next steps:');
    console.log('1. Start the backend: npm start');
    console.log('2. Start the frontend: npm run dev');
    console.log('3. Register a new user through the UI');
    console.log('4. Check MongoDB Atlas to verify data is saved');
    console.log('\nIf registration data is not saving:');
    console.log('1. Check backend console for errors');
    console.log('2. Verify MONGODB_URI is correct');
    console.log('3. Check MongoDB Atlas Network Access (IP whitelist)');
    console.log('4. Run this test again to verify connection\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ TEST FAILED:\n');
    console.error('Error:', error.message);
    console.error('\nPossible causes:');
    console.error('1. MongoDB Atlas connection string is invalid');
    console.error('2. MongoDB Atlas cluster is not accessible');
    console.error('3. IP address is not whitelisted in MongoDB Atlas');
    console.error('4. .env file is missing MONGODB_URI');
    console.error('\nSolution:');
    console.error('- Go to MongoDB Atlas Network Access');
    console.error('- Add your IP address (or 0.0.0.0/0 for all IPs)');
    console.error('- Wait a few minutes for changes to take effect');
    console.error('- Run this test again\n');
    process.exit(1);
  }
};

testUserRegistration();
