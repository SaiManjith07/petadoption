import mongoose from 'mongoose';

const DashboardCacheSchema = new mongoose.Schema({
  cache_key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  expires_at: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Update the updated_at field before saving
DashboardCacheSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const DashboardCache = mongoose.model('DashboardCache', DashboardCacheSchema);

export default DashboardCache;

