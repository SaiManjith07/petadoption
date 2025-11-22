import mongoose from 'mongoose';

const homeCheckSchema = new mongoose.Schema(
  {
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: [true, 'Pet is required'],
    },
    adopter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Adopter is required'],
    },
    check_type: {
      type: String,
      enum: ['pre_adoption', 'post_adoption'],
      required: [true, 'Check type is required'],
    },
    scheduled_date: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    completed_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
      default: 'scheduled',
    },
    conducted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    ngo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    findings: {
      living_space: {
        type: String,
        enum: ['adequate', 'inadequate', 'excellent'],
        default: null,
      },
      safety_measures: {
        type: String,
        enum: ['adequate', 'inadequate', 'excellent'],
        default: null,
      },
      family_readiness: {
        type: String,
        enum: ['ready', 'not_ready', 'excellent'],
        default: null,
      },
      overall_assessment: {
        type: String,
        enum: ['approved', 'rejected', 'conditional'],
        default: null,
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
      },
    },
    photos: [{
      url: String,
      description: String,
    }],
    next_followup_date: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
homeCheckSchema.index({ pet: 1, check_type: 1 });
homeCheckSchema.index({ adopter: 1, status: 1 });
homeCheckSchema.index({ scheduled_date: 1 });
homeCheckSchema.index({ ngo_id: 1, status: 1 });

export default mongoose.model('HomeCheck', homeCheckSchema);

