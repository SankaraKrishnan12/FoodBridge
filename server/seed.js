const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const FoodPost = require('./models/FoodPost');
const { users, foodPosts } = require('./sampleData');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await FoodPost.deleteMany({});

    // Insert users with hashed passwords
    const userDocs = [];
    for (const user of users) {
      // Passwords in sampleData are already hashed; if you want plain text, hash here instead
      const userDoc = new User(user);
      userDocs.push(userDoc);
    }
    const savedUsers = await User.insertMany(userDocs);
    console.log('Users seeded');

    // Map usernames to ObjectIds for linking foodPosts donor field
    const userMap = {};
    savedUsers.forEach(u => { userMap[u.username] = u._id; });

    // Prepare food posts with donor ObjectId replaced
    const foodPostDocs = foodPosts.map(fp => {
      // Replace placeholder donor with actual ObjectId
      const donorId = userMap['john_doe'] || null; // Default donor user here or adapt logic as needed
      return {
        ...fp,
        donor: donorId
      };
    });

    await FoodPost.insertMany(foodPostDocs);
    console.log('Food posts seeded');

    mongoose.connection.close();
    console.log('Seeding complete and MongoDB connection closed');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seed();

