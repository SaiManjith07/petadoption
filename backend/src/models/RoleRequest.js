import mongoose from 'mongoose';

const roleRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    requested_role: {
      type: String,
      enum: ['rescuer', 'feeder', 'transporter'],
      required: [true, 'Requested role is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    experience: {
      type: String,
      trim: true,
      maxlength: [1000, 'Experience cannot exceed 1000 characters'],
    },
    availability: {
      type: String,
      trim: true,
      maxlength: [500, 'Availability cannot exceed 500 characters'],
    },
    // Resource information based on role
    resources: {
      // For Rescuer
      equipment: {
        type: [String],
        default: [],
      },
      vehicle_type: {
        type: String,
        trim: true,
      },
      certifications: {
        type: String,
        trim: true,
        maxlength: [1000, 'Certifications cannot exceed 1000 characters'],
      },
      emergency_contact: {
        type: String,
        trim: true,
        maxlength: [200, 'Emergency contact cannot exceed 200 characters'],
      },
      // For Feeder
      feeding_locations: {
        type: [String],
        default: [],
      },
      food_storage_capacity: {
        type: String,
        trim: true,
      },
      feeding_schedule: {
        type: String,
        trim: true,
        maxlength: [500, 'Feeding schedule cannot exceed 500 characters'],
      },
      number_of_feeding_points: {
        type: Number,
        default: 0,
      },
      // For Transporter
      vehicle_capacity: {
        type: String,
        trim: true,
      },
      vehicle_registration: {
        type: String,
        trim: true,
      },
      vehicle_insurance: {
        type: String,
        trim: true,
      },
      service_area: {
        type: String,
        trim: true,
        maxlength: [500, 'Service area cannot exceed 500 characters'],
      },
      service_radius: {
        type: Number,
        default: 0,
      },
      // Common fields
      additional_resources: {
        type: String,
        trim: true,
        maxlength: [1000, 'Additional resources cannot exceed 1000 characters'],
      },
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    admin_notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Admin notes cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Index for efficient queries
roleRequestSchema.index({ user: 1, status: 1 });
roleRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('RoleRequest', roleRequestSchema);

