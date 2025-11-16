import mongoose from 'mongoose';

const chatRequestSchema = new mongoose.Schema(
  {
    pet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
    },
    requester_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['claim', 'adoption'],
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    room_id: {
      type: String,
      default: null,
    },
    admin_notes: {
      type: String,
      default: null,
    },
    responded_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('ChatRequest', chatRequestSchema);

