import mongoose from 'mongoose';

const feedingPointSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Feeding point name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true,
      },
      coordinates: {
        lat: {
          type: Number,
          required: [true, 'Latitude is required'],
        },
        lng: {
          type: Number,
          required: [true, 'Longitude is required'],
        },
      },
    },
    type: {
      type: String,
      enum: ['water', 'food', 'both'],
      default: 'both',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    maintained_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    added_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'inactive'],
      default: 'pending',
    },
    photos: [{
      url: String,
      description: String,
    }],
    last_maintained: {
      type: Date,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
feedingPointSchema.index({ 'location.coordinates': '2dsphere' });
feedingPointSchema.index({ 'location.pincode': 1 });
feedingPointSchema.index({ status: 1, is_active: 1 });
feedingPointSchema.index({ type: 1, is_active: 1 });

export default mongoose.model('FeedingPoint', feedingPointSchema);

