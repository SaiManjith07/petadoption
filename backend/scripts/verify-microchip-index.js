import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pet from '../src/models/Pet.js';

dotenv.config();

async function verifyIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'pawsunite',
    });
    console.log('✅ Connected to MongoDB');

    // Check all indexes
    const indexes = await Pet.collection.indexes();
    console.log('\n📋 All indexes on pets collection:');
    indexes.forEach(idx => {
      console.log(JSON.stringify(idx, null, 2));
    });

    // Check for documents with null microchip_id
    const nullCount = await Pet.countDocuments({ microchip_id: null });
    const undefinedCount = await Pet.countDocuments({ microchip_id: { $exists: false } });
    const totalCount = await Pet.countDocuments({});

    console.log(`\n📊 Document counts:`);
    console.log(`Total documents: ${totalCount}`);
    console.log(`Documents with microchip_id: null: ${nullCount}`);
    console.log(`Documents without microchip_id field: ${undefinedCount}`);

    // Check microchip_id index specifically
    const microchipIndex = indexes.find(idx => 
      idx.key && idx.key.microchip_id !== undefined
    );
    
    if (microchipIndex) {
      console.log(`\n🔍 Microchip index details:`);
      console.log(`Sparse: ${microchipIndex.sparse || false}`);
      console.log(`Unique: ${microchipIndex.unique || false}`);
      console.log(`Name: ${microchipIndex.name}`);
    } else {
      console.log('\n⚠️  No microchip_id index found!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyIndex();













