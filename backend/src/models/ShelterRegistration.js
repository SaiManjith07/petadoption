import mongoose from 'mongoose';

const shelterRegistrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shelter_name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    area_sqft: {
      type: Number,
      required: [true, 'Area is required'],
      min: [0, 'Area cannot be negative'],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [0, 'Capacity cannot be negative'],
    },
    current_occupancy: {
      type: Number,
      default: 0,
      min: [0, 'Occupancy cannot be negative'],
    },
    facilities: [{
      type: String,
    }],
    contact_info: {
      phone: String,
      email: String,
      alternate_phone: String,
    },
    documents: [{
      type: {
        type: String,
        enum: ['license', 'registration', 'other'],
      },
      url: String,
      description: String,
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    admin_notes: {
      type: String,
      default: null,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verified_at: {
      type: Date,
      default: null,
    },
    accepts_feeding_data: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ShelterRegistration', shelterRegistrationSchema);

