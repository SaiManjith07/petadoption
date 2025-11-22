import mongoose from 'mongoose';

const feedingRecordSchema = new mongoose.Schema(
  {
    feeding_point: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedingPoint',
      default: null,
    },
    shelter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShelterRegistration',
      default: null,
    },
    fed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    menu: {
      type: String,
      required: [true, 'Menu description is required'],
      trim: true,
    },
    feeding_date: {
      type: Date,
      required: true,
    },
    photos: [{
      url: String,
      description: String,
      uploaded_at: {
        type: Date,
        default: Date.now,
      },
    }],
    number_of_animals: {
      type: Number,
      default: 1,
      min: [1, 'Must feed at least one animal'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

feedingRecordSchema.index({ feeding_date: -1 });
feedingRecordSchema.index({ fed_by: 1 });
feedingRecordSchema.index({ feeding_point: 1 });
feedingRecordSchema.index({ shelter: 1 });

export default mongoose.model('FeedingRecord', feedingRecordSchema);

