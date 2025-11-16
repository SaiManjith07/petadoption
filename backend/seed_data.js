/**
 * Seed Data Script for Pet Adoption Platform
 * 
 * This script creates 3 users with different roles and multiple pet reports
 * Run this in MongoDB shell or using a script runner
 * 
 * Usage:
 * 1. Connect to your MongoDB database
 * 2. Copy and paste this script into MongoDB shell
 * OR
 * 3. Run: node seed_data.js (after connecting to MongoDB)
 */

// Note: You'll need to hash passwords using bcrypt
// For MongoDB shell, use: db.users.insertMany([...])
// For Node.js, use mongoose to create documents

const bcrypt = require('bcryptjs');

// Function to hash password (for Node.js usage)
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// Sample data - Replace ObjectIds with actual MongoDB ObjectIds when inserting
const seedData = {
  users: [
    {
      _id: ObjectId(), // Will be generated automatically if not provided
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      password: "$2a$10$rK9V8X5Z3mN2pQ7wY6tB0eF4gH5jK8lM9nO0pQ1rS2tU3vW4xY5z", // "password123" hashed
      role: "user",
      phone: "+91 98765 43210",
      address: {
        city: "Mumbai",
        state: "Maharashtra",
        country: "India"
      },
      is_verified: true,
      is_active: true,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:00Z")
    },
    {
      _id: ObjectId(),
      name: "Rajesh Kumar",
      email: "rajesh.kumar@example.com",
      password: "$2a$10$rK9V8X5Z3mN2pQ7wY6tB0eF4gH5jK8lM9nO0pQ1rS2tU3vW4xY5z", // "password123" hashed
      role: "rescuer",
      phone: "+91 91234 56789",
      address: {
        city: "Delhi",
        state: "Delhi",
        country: "India"
      },
      bio: "Animal rescuer with 5 years of experience. Passionate about helping lost and found pets.",
      is_verified: true,
      is_active: true,
      createdAt: new Date("2024-01-10T08:30:00Z"),
      updatedAt: new Date("2024-01-10T08:30:00Z")
    },
    {
      _id: ObjectId(),
      name: "Anita Patel",
      email: "anita.patel@example.com",
      password: "$2a$10$rK9V8X5Z3mN2pQ7wY6tB0eF4gH5jK8lM9nO0pQ1rS2tU3vW4xY5z", // "password123" hashed
      role: "user",
      phone: "+91 99887 66554",
      address: {
        city: "Bangalore",
        state: "Karnataka",
        country: "India"
      },
      is_verified: true,
      is_active: true,
      createdAt: new Date("2024-01-20T14:20:00Z"),
      updatedAt: new Date("2024-01-20T14:20:00Z")
    }
  ],
  
  pets: [
    // User 1 (Priya Sharma) - Found Pets
    {
      report_type: "found",
      status: "Listed Found",
      species: "Dog",
      breed: "Golden Retriever",
      sex: "Male",
      estimated_age: "adult",
      size: "Large",
      color_primary: "Golden",
      color_secondary: "White",
      coat_type: "Hairy",
      distinguishing_marks: "Friendly golden retriever found near Marine Drive. Has a blue collar with name tag 'Max'. Very friendly and well-groomed. Responds to basic commands. Appears to be well-cared for.",
      microchip_id: "CHIP123456789",
      collar_tag: "Blue collar with 'Max' tag",
      behavior_notes: "Very friendly, loves treats, good with children",
      medical_notes: "Appears healthy, no visible injuries",
      last_seen_or_found_date: new Date("2024-01-25T09:00:00Z"),
      last_seen_or_found_location_text: "Marine Drive, Mumbai",
      last_seen_or_found_pincode: "400020",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800",
          original_filename: "golden_retriever_1.jpg",
          uploaded_at: new Date("2024-01-25T09:15:00Z")
        },
        {
          url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
          original_filename: "golden_retriever_2.jpg",
          uploaded_at: new Date("2024-01-25T09:16:00Z")
        }
      ],
      submitted_by: null, // Replace with User 1 ObjectId
      contact_preference: "Phone",
      allow_public_listing: true,
      additional_tags: ["friendly", "well-groomed", "collar"],
      date_submitted: new Date("2024-01-25T09:20:00Z"),
      is_active: true,
      createdAt: new Date("2024-01-25T09:20:00Z"),
      updatedAt: new Date("2024-01-25T09:20:00Z")
    },
    {
      report_type: "found",
      status: "Listed Found",
      species: "Cat",
      breed: "Persian",
      sex: "Female",
      estimated_age: "young",
      size: "Small",
      color_primary: "White",
      color_secondary: "Gray",
      coat_type: "Hairy",
      distinguishing_marks: "Beautiful white Persian cat with gray patches. Found near Juhu Beach. Very calm and gentle. Has a distinctive gray patch on left ear. Appears to be a house cat.",
      behavior_notes: "Calm, gentle, may be shy initially",
      last_seen_or_found_date: new Date("2024-01-28T16:30:00Z"),
      last_seen_or_found_location_text: "Juhu Beach area, Mumbai",
      last_seen_or_found_pincode: "400049",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800",
          original_filename: "persian_cat_1.jpg",
          uploaded_at: new Date("2024-01-28T16:35:00Z")
        }
      ],
      submitted_by: null, // Replace with User 1 ObjectId
      contact_preference: "Email",
      allow_public_listing: true,
      additional_tags: ["persian", "white", "gentle"],
      date_submitted: new Date("2024-01-28T16:40:00Z"),
      is_active: true,
      createdAt: new Date("2024-01-28T16:40:00Z"),
      updatedAt: new Date("2024-01-28T16:40:00Z")
    },
    
    // User 2 (Rajesh Kumar) - Lost Pet and Found Pet
    {
      report_type: "lost",
      status: "Listed Lost",
      species: "Dog",
      breed: "Labrador",
      sex: "Male",
      estimated_age: "adult",
      size: "Large",
      color_primary: "Black",
      color_secondary: null,
      coat_type: "Short",
      distinguishing_marks: "Black Labrador named 'Rocky'. Lost from Connaught Place area. Has a red collar with contact number. Very friendly and energetic. Last seen wearing a red harness. Microchipped.",
      microchip_id: "CHIP987654321",
      collar_tag: "Red collar with phone number",
      behavior_notes: "Very friendly, loves playing fetch, responds to name 'Rocky'",
      medical_notes: "No medical issues, up to date on vaccinations",
      last_seen_or_found_date: new Date("2024-01-22T11:00:00Z"),
      last_seen_or_found_location_text: "Connaught Place, New Delhi",
      last_seen_or_found_pincode: "110001",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800",
          original_filename: "black_labrador_1.jpg",
          uploaded_at: new Date("2024-01-22T11:10:00Z")
        },
        {
          url: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800",
          original_filename: "black_labrador_2.jpg",
          uploaded_at: new Date("2024-01-22T11:11:00Z")
        }
      ],
      submitted_by: null, // Replace with User 2 ObjectId
      contact_preference: "Phone",
      allow_public_listing: true,
      additional_tags: ["labrador", "black", "microchipped", "red-collar"],
      date_submitted: new Date("2024-01-22T11:15:00Z"),
      is_active: true,
      createdAt: new Date("2024-01-22T11:15:00Z"),
      updatedAt: new Date("2024-01-22T11:15:00Z")
    },
    {
      report_type: "found",
      status: "Listed Found",
      species: "Dog",
      breed: "Street Dog",
      sex: "Unknown",
      estimated_age: "puppy/kitten",
      size: "Small",
      color_primary: "Brown",
      color_secondary: "White",
      coat_type: "Short",
      distinguishing_marks: "Small brown and white puppy found near India Gate. Appears to be 2-3 months old. Very playful and friendly. No collar or microchip. Looking for a loving home.",
      behavior_notes: "Playful, friendly, good with people",
      medical_notes: "Appears healthy, needs vaccination",
      last_seen_or_found_date: new Date("2024-01-30T10:00:00Z"),
      last_seen_or_found_location_text: "India Gate area, New Delhi",
      last_seen_or_found_pincode: "110003",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800",
          original_filename: "puppy_1.jpg",
          uploaded_at: new Date("2024-01-30T10:05:00Z")
        },
        {
          url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800",
          original_filename: "puppy_2.jpg",
          uploaded_at: new Date("2024-01-30T10:06:00Z")
        }
      ],
      submitted_by: null, // Replace with User 2 ObjectId
      contact_preference: "In-app message",
      allow_public_listing: true,
      additional_tags: ["puppy", "street-dog", "needs-home"],
      date_submitted: new Date("2024-01-30T10:10:00Z"),
      is_active: true,
      createdAt: new Date("2024-01-30T10:10:00Z"),
      updatedAt: new Date("2024-01-30T10:10:00Z")
    },
    
    // User 3 (Anita Patel) - Lost Pet and Adoption Pet
    {
      report_type: "lost",
      status: "Listed Lost",
      species: "Cat",
      breed: "Siamese",
      sex: "Female",
      estimated_age: "adult",
      size: "Medium",
      color_primary: "Cream",
      color_secondary: "Brown",
      coat_type: "Short",
      distinguishing_marks: "Siamese cat named 'Luna'. Lost from Koramangala area. Has distinctive blue eyes and brown points on ears, face, paws, and tail. Very vocal and affectionate. Wearing a pink collar with bell.",
      collar_tag: "Pink collar with bell",
      behavior_notes: "Very vocal, affectionate, may be scared if approached",
      medical_notes: "No medical issues, spayed",
      last_seen_or_found_date: new Date("2024-01-24T14:00:00Z"),
      last_seen_or_found_location_text: "Koramangala, Bangalore",
      last_seen_or_found_pincode: "560095",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800",
          original_filename: "siamese_cat_1.jpg",
          uploaded_at: new Date("2024-01-24T14:05:00Z")
        },
        {
          url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
          original_filename: "siamese_cat_2.jpg",
          uploaded_at: new Date("2024-01-24T14:06:00Z")
        }
      ],
      submitted_by: null, // Replace with User 3 ObjectId
      contact_preference: "SMS",
      allow_public_listing: true,
      additional_tags: ["siamese", "blue-eyes", "pink-collar"],
      date_submitted: new Date("2024-01-24T14:10:00Z"),
      is_active: true,
      createdAt: new Date("2024-01-24T14:10:00Z"),
      updatedAt: new Date("2024-01-24T14:10:00Z")
    },
    {
      report_type: "found",
      status: "Available for Adoption",
      species: "Dog",
      breed: "Beagle",
      sex: "Male",
      estimated_age: "young",
      size: "Medium",
      color_primary: "Tri-color",
      color_secondary: "White, Black, Brown",
      coat_type: "Short",
      distinguishing_marks: "Friendly Beagle found near Cubbon Park. Approximately 1 year old. Very energetic and playful. Great with kids. House-trained. Looking for a permanent loving home.",
      behavior_notes: "Energetic, playful, great with children, house-trained",
      medical_notes: "Healthy, vaccinated, neutered",
      last_seen_or_found_date: new Date("2024-01-15T12:00:00Z"),
      last_seen_or_found_location_text: "Cubbon Park area, Bangalore",
      last_seen_or_found_pincode: "560001",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800",
          original_filename: "beagle_1.jpg",
          uploaded_at: new Date("2024-01-15T12:05:00Z")
        },
        {
          url: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800",
          original_filename: "beagle_2.jpg",
          uploaded_at: new Date("2024-01-15T12:06:00Z")
        },
        {
          url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800",
          original_filename: "beagle_3.jpg",
          uploaded_at: new Date("2024-01-15T12:07:00Z")
        }
      ],
      submitted_by: null, // Replace with User 3 ObjectId
      contact_preference: "Email",
      allow_public_listing: true,
      additional_tags: ["beagle", "adoption", "house-trained", "good-with-kids"],
      date_submitted: new Date("2024-01-15T12:10:00Z"),
      is_active: true,
      createdAt: new Date("2024-01-15T12:10:00Z"),
      updatedAt: new Date("2024-01-15T12:10:00Z")
    }
  ]
};

// MongoDB Shell Insert Commands (Copy and paste these into MongoDB shell)
const mongoShellCommands = `
// First, insert users and get their IDs
var user1 = db.users.insertOne({
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  password: "$2a$10$rK9V8X5Z3mN2pQ7wY6tB0eF4gH5jK8lM9nO0pQ1rS2tU3vW4xY5z",
  role: "user",
  phone: "+91 98765 43210",
  address: { city: "Mumbai", state: "Maharashtra", country: "India" },
  is_verified: true,
  is_active: true,
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:00:00Z")
});

var user2 = db.users.insertOne({
  name: "Rajesh Kumar",
  email: "rajesh.kumar@example.com",
  password: "$2a$10$rK9V8X5Z3mN2pQ7wY6tB0eF4gH5jK8lM9nO0pQ1rS2tU3vW4xY5z",
  role: "rescuer",
  phone: "+91 91234 56789",
  address: { city: "Delhi", state: "Delhi", country: "India" },
  bio: "Animal rescuer with 5 years of experience. Passionate about helping lost and found pets.",
  is_verified: true,
  is_active: true,
  createdAt: new Date("2024-01-10T08:30:00Z"),
  updatedAt: new Date("2024-01-10T08:30:00Z")
});

var user3 = db.users.insertOne({
  name: "Anita Patel",
  email: "anita.patel@example.com",
  password: "$2a$10$rK9V8X5Z3mN2pQ7wY6tB0eF4gH5jK8lM9nO0pQ1rS2tU3vW4xY5z",
  role: "user",
  phone: "+91 99887 66554",
  address: { city: "Bangalore", state: "Karnataka", country: "India" },
  is_verified: true,
  is_active: true,
  createdAt: new Date("2024-01-20T14:20:00Z"),
  updatedAt: new Date("2024-01-20T14:20:00Z")
});

// Now insert pets with user IDs
// User 1 - Found Pets
db.pets.insertOne({
  report_type: "found",
  status: "Listed Found",
  species: "Dog",
  breed: "Golden Retriever",
  sex: "Male",
  estimated_age: "adult",
  size: "Large",
  color_primary: "Golden",
  color_secondary: "White",
  coat_type: "Hairy",
  distinguishing_marks: "Friendly golden retriever found near Marine Drive. Has a blue collar with name tag 'Max'. Very friendly and well-groomed. Responds to basic commands. Appears to be well-cared for.",
  microchip_id: "CHIP123456789",
  collar_tag: "Blue collar with 'Max' tag",
  behavior_notes: "Very friendly, loves treats, good with children",
  medical_notes: "Appears healthy, no visible injuries",
  last_seen_or_found_date: new Date("2024-01-25T09:00:00Z"),
  last_seen_or_found_location_text: "Marine Drive, Mumbai",
  last_seen_or_found_pincode: "400020",
  photos: [
    { url: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800", original_filename: "golden_retriever_1.jpg", uploaded_at: new Date("2024-01-25T09:15:00Z") },
    { url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800", original_filename: "golden_retriever_2.jpg", uploaded_at: new Date("2024-01-25T09:16:00Z") }
  ],
  submitted_by: user1.insertedId,
  contact_preference: "Phone",
  allow_public_listing: true,
  additional_tags: ["friendly", "well-groomed", "collar"],
  date_submitted: new Date("2024-01-25T09:20:00Z"),
  is_active: true,
  createdAt: new Date("2024-01-25T09:20:00Z"),
  updatedAt: new Date("2024-01-25T09:20:00Z")
});

db.pets.insertOne({
  report_type: "found",
  status: "Listed Found",
  species: "Cat",
  breed: "Persian",
  sex: "Female",
  estimated_age: "young",
  size: "Small",
  color_primary: "White",
  color_secondary: "Gray",
  coat_type: "Hairy",
  distinguishing_marks: "Beautiful white Persian cat with gray patches. Found near Juhu Beach. Very calm and gentle. Has a distinctive gray patch on left ear. Appears to be a house cat.",
  behavior_notes: "Calm, gentle, may be shy initially",
  last_seen_or_found_date: new Date("2024-01-28T16:30:00Z"),
  last_seen_or_found_location_text: "Juhu Beach area, Mumbai",
  last_seen_or_found_pincode: "400049",
  photos: [
    { url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800", original_filename: "persian_cat_1.jpg", uploaded_at: new Date("2024-01-28T16:35:00Z") }
  ],
  submitted_by: user1.insertedId,
  contact_preference: "Email",
  allow_public_listing: true,
  additional_tags: ["persian", "white", "gentle"],
  date_submitted: new Date("2024-01-28T16:40:00Z"),
  is_active: true,
  createdAt: new Date("2024-01-28T16:40:00Z"),
  updatedAt: new Date("2024-01-28T16:40:00Z")
});

// User 2 - Lost and Found Pets
db.pets.insertOne({
  report_type: "lost",
  status: "Listed Lost",
  species: "Dog",
  breed: "Labrador",
  sex: "Male",
  estimated_age: "adult",
  size: "Large",
  color_primary: "Black",
  coat_type: "Short",
  distinguishing_marks: "Black Labrador named 'Rocky'. Lost from Connaught Place area. Has a red collar with contact number. Very friendly and energetic. Last seen wearing a red harness. Microchipped.",
  microchip_id: "CHIP987654321",
  collar_tag: "Red collar with phone number",
  behavior_notes: "Very friendly, loves playing fetch, responds to name 'Rocky'",
  medical_notes: "No medical issues, up to date on vaccinations",
  last_seen_or_found_date: new Date("2024-01-22T11:00:00Z"),
  last_seen_or_found_location_text: "Connaught Place, New Delhi",
  last_seen_or_found_pincode: "110001",
  photos: [
    { url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800", original_filename: "black_labrador_1.jpg", uploaded_at: new Date("2024-01-22T11:10:00Z") },
    { url: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800", original_filename: "black_labrador_2.jpg", uploaded_at: new Date("2024-01-22T11:11:00Z") }
  ],
  submitted_by: user2.insertedId,
  contact_preference: "Phone",
  allow_public_listing: true,
  additional_tags: ["labrador", "black", "microchipped", "red-collar"],
  date_submitted: new Date("2024-01-22T11:15:00Z"),
  is_active: true,
  createdAt: new Date("2024-01-22T11:15:00Z"),
  updatedAt: new Date("2024-01-22T11:15:00Z")
});

db.pets.insertOne({
  report_type: "found",
  status: "Listed Found",
  species: "Dog",
  breed: "Street Dog",
  sex: "Unknown",
  estimated_age: "puppy/kitten",
  size: "Small",
  color_primary: "Brown",
  color_secondary: "White",
  coat_type: "Short",
  distinguishing_marks: "Small brown and white puppy found near India Gate. Appears to be 2-3 months old. Very playful and friendly. No collar or microchip. Looking for a loving home.",
  behavior_notes: "Playful, friendly, good with people",
  medical_notes: "Appears healthy, needs vaccination",
  last_seen_or_found_date: new Date("2024-01-30T10:00:00Z"),
  last_seen_or_found_location_text: "India Gate area, New Delhi",
  last_seen_or_found_pincode: "110003",
  photos: [
    { url: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800", original_filename: "puppy_1.jpg", uploaded_at: new Date("2024-01-30T10:05:00Z") },
    { url: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800", original_filename: "puppy_2.jpg", uploaded_at: new Date("2024-01-30T10:06:00Z") }
  ],
  submitted_by: user2.insertedId,
  contact_preference: "In-app message",
  allow_public_listing: true,
  additional_tags: ["puppy", "street-dog", "needs-home"],
  date_submitted: new Date("2024-01-30T10:10:00Z"),
  is_active: true,
  createdAt: new Date("2024-01-30T10:10:00Z"),
  updatedAt: new Date("2024-01-30T10:10:00Z")
});

// User 3 - Lost and Adoption Pets
db.pets.insertOne({
  report_type: "lost",
  status: "Listed Lost",
  species: "Cat",
  breed: "Siamese",
  sex: "Female",
  estimated_age: "adult",
  size: "Medium",
  color_primary: "Cream",
  color_secondary: "Brown",
  coat_type: "Short",
  distinguishing_marks: "Siamese cat named 'Luna'. Lost from Koramangala area. Has distinctive blue eyes and brown points on ears, face, paws, and tail. Very vocal and affectionate. Wearing a pink collar with bell.",
  collar_tag: "Pink collar with bell",
  behavior_notes: "Very vocal, affectionate, may be scared if approached",
  medical_notes: "No medical issues, spayed",
  last_seen_or_found_date: new Date("2024-01-24T14:00:00Z"),
  last_seen_or_found_location_text: "Koramangala, Bangalore",
  last_seen_or_found_pincode: "560095",
  photos: [
    { url: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800", original_filename: "siamese_cat_1.jpg", uploaded_at: new Date("2024-01-24T14:05:00Z") },
    { url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800", original_filename: "siamese_cat_2.jpg", uploaded_at: new Date("2024-01-24T14:06:00Z") }
  ],
  submitted_by: user3.insertedId,
  contact_preference: "SMS",
  allow_public_listing: true,
  additional_tags: ["siamese", "blue-eyes", "pink-collar"],
  date_submitted: new Date("2024-01-24T14:10:00Z"),
  is_active: true,
  createdAt: new Date("2024-01-24T14:10:00Z"),
  updatedAt: new Date("2024-01-24T14:10:00Z")
});

db.pets.insertOne({
  report_type: "found",
  status: "Available for Adoption",
  species: "Dog",
  breed: "Beagle",
  sex: "Male",
  estimated_age: "young",
  size: "Medium",
  color_primary: "Tri-color",
  color_secondary: "White, Black, Brown",
  coat_type: "Short",
  distinguishing_marks: "Friendly Beagle found near Cubbon Park. Approximately 1 year old. Very energetic and playful. Great with kids. House-trained. Looking for a permanent loving home.",
  behavior_notes: "Energetic, playful, great with children, house-trained",
  medical_notes: "Healthy, vaccinated, neutered",
  last_seen_or_found_date: new Date("2024-01-15T12:00:00Z"),
  last_seen_or_found_location_text: "Cubbon Park area, Bangalore",
  last_seen_or_found_pincode: "560001",
  photos: [
    { url: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800", original_filename: "beagle_1.jpg", uploaded_at: new Date("2024-01-15T12:05:00Z") },
    { url: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800", original_filename: "beagle_2.jpg", uploaded_at: new Date("2024-01-15T12:06:00Z") },
    { url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800", original_filename: "beagle_3.jpg", uploaded_at: new Date("2024-01-15T12:07:00Z") }
  ],
  submitted_by: user3.insertedId,
  contact_preference: "Email",
  allow_public_listing: true,
  additional_tags: ["beagle", "adoption", "house-trained", "good-with-kids"],
  date_submitted: new Date("2024-01-15T12:10:00Z"),
  is_active: true,
  createdAt: new Date("2024-01-15T12:10:00Z"),
  updatedAt: new Date("2024-01-15T12:10:00Z")
});
`;

console.log("MongoDB Shell Commands:");
console.log("======================");
console.log(mongoShellCommands);

// Export for Node.js usage
module.exports = { seedData, mongoShellCommands };

