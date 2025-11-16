import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n═══════════════════════════════════════════════════');
console.log('🔍 MongoDB Connection Diagnostic Test');
console.log('═══════════════════════════════════════════════════\n');

// Step 1: Check environment variables
console.log('📋 Step 1: Checking Environment Variables');
console.log('─────────────────────────────────────────────');

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

if (!dbName) {
  console.warn('⚠️  MONGODB_DB_NAME not found, will use: pawsunite');
}

console.log('✅ MONGODB_URI:', mongoUri);
console.log('✅ MONGODB_DB_NAME:', dbName || 'pawsunite (default)');
console.log('✅ NODE_ENV:', process.env.NODE_ENV || 'development');

// Step 2: Parse connection string
console.log('\n📋 Step 2: Parsing Connection String');
console.log('─────────────────────────────────────────────');

try {
  const url = new URL(mongoUri);
  console.log('✅ Connection Protocol:', url.protocol);
  console.log('✅ Username:', url.username);
  console.log('✅ Password:', '***' + url.password.slice(-8)); // Show last 8 chars
  console.log('✅ Hostname:', url.hostname);
  console.log('✅ Query Params:', url.search);
} catch (err) {
  console.error('❌ Invalid connection string:', err.message);
  process.exit(1);
}

// Step 3: Test connection
console.log('\n📋 Step 3: Attempting MongoDB Connection');
console.log('─────────────────────────────────────────────');

const testConnection = async () => {
  try {
    console.log('⏳ Connecting...');
    
    const conn = await mongoose.connect(mongoUri, {
      dbName: dbName || 'pawsunite',
      useNewUrlParser: true,
      useUnifiedTopology: true,
      socketTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    console.log('✅ Connection successful!');
    console.log('✅ Host:', conn.connection.host);
    console.log('✅ Database:', conn.connection.db.databaseName);
    console.log('✅ State:', conn.connection.readyState === 1 ? 'Connected' : 'Not connected');
    
    // Try to ping the database
    try {
      const adminDb = conn.connection.db.admin();
      const result = await adminDb.ping();
      console.log('✅ Database Ping:', result.ok === 1 ? 'Success' : 'Failed');
    } catch (pingErr) {
      console.warn('⚠️  Ping failed:', pingErr.message);
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('✨ SUCCESS: MongoDB connection working!');
    console.log('═══════════════════════════════════════════════════\n');
    
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Connection Failed');
    console.error('─────────────────────────────────────────────');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.message.includes('bad auth')) {
      console.error('\n🔴 DIAGNOSIS: Authentication Failed');
      console.error('Possible causes:');
      console.error('  1. Username or password is incorrect');
      console.error('  2. User does not exist in MongoDB Atlas');
      console.error('  3. User password was changed');
      console.error('  4. Database user permissions are wrong');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔴 DIAGNOSIS: Connection Refused');
      console.error('Possible causes:');
      console.error('  1. IP is not whitelisted');
      console.error('  2. MongoDB service is down');
      console.error('  3. Network firewall is blocking');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('\n🔴 DIAGNOSIS: Host Not Found');
      console.error('Possible causes:');
      console.error('  1. Internet connection issue');
      console.error('  2. DNS resolution problem');
      console.error('  3. Invalid cluster hostname');
    } else if (error.message.includes('timeout')) {
      console.error('\n🔴 DIAGNOSIS: Connection Timeout');
      console.error('Possible causes:');
      console.error('  1. Network connectivity issue');
      console.error('  2. MongoDB Atlas cluster is not responding');
      console.error('  3. Firewall blocking connection');
    }
    
    console.error('\n═══════════════════════════════════════════════════');
    console.error('Full Error:', error);
    console.error('═══════════════════════════════════════════════════\n');
    
    process.exit(1);
  }
};

testConnection();
