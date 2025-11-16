import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    room_id: {
      type: String,
      required: true,
      unique: true,
    },
    pet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    messages: [
      {
        sender_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        is_read: {
          type: Boolean,
          default: false,
        },
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
    closed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Chat', chatSchema);
