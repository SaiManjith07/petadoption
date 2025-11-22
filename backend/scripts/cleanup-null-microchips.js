import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pet from '../src/models/Pet.js';

dotenv.config();

async function cleanupNullMicrochips() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'pawsunite',
    });
    console.log('✅ Connected to MongoDB');

    // Remove microchip_id field from documents where it's null or empty
    const result = await Pet.updateMany(
      { 
        $or: [
          { microchip_id: null },
          { microchip_id: '' },
          { microchip_id: { $exists: false } }
        ]
      },
      { 
        $unset: { microchip_id: '' } 
      }
    );

    console.log(`✅ Removed microchip_id field from ${result.modifiedCount} documents`);
    console.log('✅ Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up microchip_id:', error);
    process.exit(1);
  }
}

cleanupNullMicrochips();













