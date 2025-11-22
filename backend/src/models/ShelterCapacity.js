import mongoose from 'mongoose';

const shelterCapacitySchema = new mongoose.Schema(
  {
    shelter_name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
      maxlength: [200, 'Shelter name cannot exceed 200 characters'],
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
        lat: Number,
        lng: Number,
      },
    },
    total_beds: {
      type: Number,
      required: [true, 'Total beds is required'],
      min: [0, 'Total beds cannot be negative'],
    },
    available_beds: {
      type: Number,
      required: [true, 'Available beds is required'],
      min: [0, 'Available beds cannot be negative'],
    },
    occupied_beds: {
      type: Number,
      default: 0,
      min: [0, 'Occupied beds cannot be negative'],
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contact_info: {
      phone: String,
      email: String,
      website: String,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
shelterCapacitySchema.index({ 'location.pincode': 1 });
shelterCapacitySchema.index({ 'location.city': 1 });
shelterCapacitySchema.index({ is_active: 1, available_beds: 1 });

// Virtual to calculate occupancy percentage
shelterCapacitySchema.virtual('occupancy_percentage').get(function() {
  if (this.total_beds === 0) return 0;
  return Math.round((this.occupied_beds / this.total_beds) * 100);
});

export default mongoose.model('ShelterCapacity', shelterCapacitySchema);

