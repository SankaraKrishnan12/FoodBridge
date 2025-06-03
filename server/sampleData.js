// Sample data for User and FoodPost models

const users = [
  {
    username: "john_doe",
    password: "$2a$10$Z9mjsV9hgU8DcZ0XuKz5.eCc7wqg8tn9xPBqtvHttUOi3tJZuTZrW", // hashed 'password123'
    role: "Donor",
    email: "john@example.com"
  },
  {
    username: "emma_smith",
    password: "$2a$10$K9l9L9f1oA7vRbPBpS462.kZrMaQZnkq7HNvQv9Edg15PLrOAjs9K", // hashed 'mypassword'
    role: "Recipient",
    email: "emma@example.com"
  },
  {
    username: "admin_user",
    password: "$2a$10$VOT1fRDHsdRALFyM6F2sceT2lzSURXHCM3br03UIcCwR8NmhSSb5K", // hashed 'adminpass'
    role: "Admin",
    email: "admin@foodbridge.com"
  }
];

const foodPosts = [
  {
    foodName: "Leftover Pasta",
    description: "Home-cooked spaghetti with tomato sauce, enough for 3 people.",
    quantity: 3,
    category: "home-cooked",
    expiryDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
    location: {
      type: "Point",
      coordinates: [-73.935242, 40.730610] // Example coordinates (New York)
    },
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGFzdGF8ZW58MHx8MHx8fDA%3D",
    availabilityWindow: "10:00 AM - 5:00 PM",
    donor: "INSERT_DONOR_USER_ID_HERE"
  },
  {
    foodName: "Packaged Sandwiches",
    description: "Pre-packaged sandwiches with ham and cheese, 5 packs.",
    quantity: 5,
    category: "packaged",
    expiryDate: new Date(new Date().getTime() + 8 * 60 * 60 * 1000), // 8 hours from now
    location: {
      type: "Point",
      coordinates: [-73.985130, 40.758896] // Example coordinates (Times Square, NY)
    },
    image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c2FuZHdpY2h8ZW58MHx8MHx8fDA%3D",
    availabilityWindow: "9:00 AM - 12:00 PM",
    donor: "INSERT_DONOR_USER_ID_HERE"
  }
];

module.exports = { users, foodPosts };

