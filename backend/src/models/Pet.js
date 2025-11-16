import mongoose from 'mongoose';

const petSchema = new mongoose.Schema(
  {
    // Report type
    report_type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Report type must be "lost" or "found"'],
    },

    // Status workflow
    status: {
      type: String,
      enum: ['Pending Verification', 'Listed Found', 'Listed Lost', 'Matched', 'Reunited', 'Pending Adoption', 'Available for Adoption', 'Adopted', 'Rejected'],
      default: 'Pending Verification',
    },

    // Core pet information
    species: {
      type: String,
      enum: ['Dog', 'Cat', 'Cow', 'Buffalo', 'Goat', 'Sheep', 'Camel', 'Horse', 'Bird', 'Rabbit', 'Reptile', 'Other'],
      required: [true, 'Species is required'],
    },
    breed: {
      type: String,
      trim: true,
      maxlength: [100, 'Breed cannot exceed 100 characters'],
      default: null,
    },
    sex: {
      type: String,
      enum: ['Male', 'Female', 'Unknown'],
      required: [true, 'Sex is required'],
    },
    estimated_age: {
      type: String,
      enum: ['puppy/kitten', 'young', 'adult', 'senior', 'unknown'],
      default: 'unknown',
    },
    size: {
      type: String,
      enum: ['Small', 'Medium', 'Large', 'Extra Large', 'Unknown'],
      default: 'Unknown',
    },

    // Physical characteristics
    color_primary: {
      type: String,
      required: [true, 'Primary color is required'],
      trim: true,
      maxlength: [50, 'Primary color cannot exceed 50 characters'],
    },
    color_secondary: {
      type: String,
      trim: true,
      maxlength: [50, 'Secondary color cannot exceed 50 characters'],
      default: null,
    },
    coat_type: {
      type: String,
      enum: ['Short', 'Hairy', 'Curly', 'Feathered', 'Woolly', 'Bald', 'Unknown'],
      default: 'Unknown',
    },
    distinguishing_marks: {
      type: String,
      required: [true, 'Distinguishing marks are required'],
      minlength: [5, 'Distinguishing marks must be at least 5 characters'],
      maxlength: [1000, 'Distinguishing marks cannot exceed 1000 characters'],
      trim: true,
    },

    // Identification
    microchip_id: {
      type: String,
      sparse: true,
      unique: true,
      uppercase: true,
      match: [/^[A-Z0-9]{0,50}$/, 'Microchip ID must be alphanumeric'],
      default: null,
    },
    collar_tag: {
      type: String,
      trim: true,
      maxlength: [100, 'Collar tag info cannot exceed 100 characters'],
      default: null,
    },

    // Health & behavior
    behavior_notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Behavior notes cannot exceed 500 characters'],
      default: null,
    },
    medical_notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Medical notes cannot exceed 500 characters'],
      default: null,
    },

    // Location & timing
    last_seen_or_found_date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    last_seen_or_found_location_text: {
      type: String,
      required: [true, 'Location description is required'],
      trim: true,
      maxlength: [500, 'Location cannot exceed 500 characters'],
    },
    last_seen_or_found_pincode: {
      type: String,
      trim: true,
      maxlength: [10, 'Pincode cannot exceed 10 characters'],
      default: null,
    },
    last_seen_or_found_coords: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        validate: {
          validator: function(val) {
            return !val || (val.length === 2 && val[0] >= -180 && val[0] <= 180 && val[1] >= -90 && val[1] <= 90);
          },
          message: 'Invalid coordinates. Longitude must be -180 to 180, latitude must be -90 to 90',
        },
      },
    },

    // Photos & media
    photos: [
      {
        url: String,
        original_filename: String,
        uploaded_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Additional metadata
    additional_tags: {
      type: [String],
      validate: {
        validator: function(val) {
          return !val || val.length <= 10;
        },
        message: 'Cannot have more than 10 tags',
      },
      default: [],
    },

    // Reporter & privacy
    submitted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contact_preference: {
      type: String,
      enum: ['Phone', 'SMS', 'Email', 'In-app message'],
      required: [true, 'Contact preference is required'],
    },
    allow_public_listing: {
      type: Boolean,
      default: true,
    },

    // Legacy fields (for backward compatibility)
    color: {
      type: String,
      default: null, // Will be deprecated; use color_primary
    },
    age: {
      type: Number,
      default: null,
    },
    location: {
      type: String,
      default: null, // Will be deprecated; use last_seen_or_found_location_text
    },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    date_found_or_lost: {
      type: Date,
      default: null, // Will be deprecated; use last_seen_or_found_date
    },
    description: {
      type: String,
      default: null,
    },
    contact_info: {
      phone: String,
      email: String,
    },

    // Verification & admin
    date_submitted: {
      type: Date,
      default: Date.now,
    },
    verified_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verification_date: {
      type: Date,
      default: null,
    },
    verification_notes: {
      type: String,
      default: null,
    },

    // Soft delete
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Create indices for search and geospatial queries
petSchema.index({ breed: 'text', color_primary: 'text', color_secondary: 'text', distinguishing_marks: 'text', location: 'text' });
petSchema.index({ species: 1, status: 1 });
petSchema.index({ submitted_by: 1, date_submitted: -1 });
petSchema.index({ 'last_seen_or_found_coords': '2dsphere' }); // For geospatial queries
petSchema.index({ microchip_id: 1 }); // For microchip lookup
petSchema.index({ 'additional_tags': 1 }); // For tag filtering
petSchema.index({ is_active: 1 }); // For active records

export default mongoose.model('Pet', petSchema);
