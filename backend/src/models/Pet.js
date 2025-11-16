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
      sparse: true, // Only index documents that have this field
      unique: true, // Unique only for non-null values
      uppercase: true,
      match: [/^[A-Z0-9]{0,50}$/, 'Microchip ID must be alphanumeric'],
      // No default - field will be undefined if not provided
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
        required: false,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false,
        validate: {
          validator: function(val) {
            // If coordinates are provided, they must be valid
            if (!val || val.length === 0) return true; // Allow null/undefined/empty
            if (val.length !== 2) return false;
            return !isNaN(val[0]) && !isNaN(val[1]) &&
                   val[0] >= -180 && val[0] <= 180 && 
                   val[1] >= -90 && val[1] <= 90;
          },
          message: 'Invalid coordinates. Longitude must be -180 to 180, latitude must be -90 to 90',
        },
      },
      _id: false,
      // Don't set default - Mongoose will handle null/undefined automatically
    },

    // Photos & media
    photos: [
      {
        url: {
          type: String,
          required: true,
        }, // Can be data URL (base64) or file URL
        file_url: {
          type: String,
          default: null,
        }, // Optional file URL as backup
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

    // Adoption tracking
    adopted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    adoption_date: {
      type: Date,
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

// Pre-save hook: Remove microchip_id if it's null or empty
// This ensures the field is omitted from the document (not set to null)
// which is required for sparse unique indexes
petSchema.pre('save', function(next) {
  const microchipValue = this.microchip_id;
  if (!microchipValue || microchipValue === null || microchipValue === '' || 
      (typeof microchipValue === 'string' && microchipValue.trim() === '')) {
    // Remove the field completely by deleting it from the document
    // This ensures it's not saved to MongoDB at all
    delete this._doc.microchip_id;
    // Also remove from the Mongoose document
    this.microchip_id = undefined;
  } else if (typeof microchipValue === 'string') {
    // Ensure it's uppercase and trimmed
    this.microchip_id = microchipValue.trim().toUpperCase();
  }
  next();
});

// Create indices for search and geospatial queries
petSchema.index({ breed: 'text', color_primary: 'text', color_secondary: 'text', distinguishing_marks: 'text', location: 'text' });
petSchema.index({ species: 1, status: 1 });
petSchema.index({ submitted_by: 1, date_submitted: -1 });
// Sparse index - only index documents that have valid coordinates
petSchema.index({ 'last_seen_or_found_coords': '2dsphere' }, { sparse: true }); // For geospatial queries
// Note: microchip_id index is automatically created by Mongoose from field definition (sparse + unique)
petSchema.index({ 'additional_tags': 1 }); // For tag filtering
petSchema.index({ is_active: 1 }); // For active records

export default mongoose.model('Pet', petSchema);
