import mongoose from 'mongoose';

const neighborhoodAlertSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    alert_type: {
      type: String,
      enum: ['lost', 'found', 'adoption', 'emergency'],
      required: [true, 'Alert type is required'],
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    location: {
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'resolved', 'expired'],
      default: 'pending',
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    verified_at: {
      type: Date,
      default: null,
    },
    expires_at: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
neighborhoodAlertSchema.index({ pincode: 1, status: 1 });
neighborhoodAlertSchema.index({ alert_type: 1, status: 1 });
neighborhoodAlertSchema.index({ created_at: -1 });
neighborhoodAlertSchema.index({ expires_at: 1 });

// Auto-expire alerts
neighborhoodAlertSchema.pre('save', function(next) {
  if (this.expires_at && new Date() > this.expires_at && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

export default mongoose.model('NeighborhoodAlert', neighborhoodAlertSchema);

