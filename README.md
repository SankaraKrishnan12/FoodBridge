# 🍽️ FoodBridge

<p align="center">

**Connecting Surplus Food with People in Need**

Reduce food waste • Support communities • Build a sustainable future

</p>

---

## 📖 Overview

FoodBridge is a MERN-stack web application that connects individuals, restaurants, hotels, and organizations with surplus food to people who need it.

The platform allows donors to post available food, recipients to request it, and administrators to monitor and manage the entire system.

The primary objective is to reduce food wastage while ensuring edible food reaches people instead of ending up in landfills.

---

## ✨ Features

### 👤 User Authentication

- Secure Signup/Login
- JWT Authentication
- Password hashing using bcrypt
- Protected routes

### 🍛 Food Donation

- Create food donation posts
- Add:
  - Food name
  - Description
  - Quantity
  - Category
  - Expiry date
  - Availability window
- Automatic location detection using browser geolocation

### 🤝 Food Claiming

Recipients can

- Browse available food
- Request food
- Track requested donations
- Prevent duplicate requests

### 👨‍💼 Admin Dashboard

- Manage users
- Monitor food posts
- View claims
- Administrative controls

### 📍 Location Support

- Browser Geolocation API
- Latitude & Longitude storage
- Pickup location tracking

---

# 🛠 Tech Stack

## Frontend

- React 19
- Vite
- React Router DOM
- Tailwind CSS

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT
- bcrypt.js

## Other Libraries

- CORS
- dotenv
- multer

---

# 📂 Project Structure

```
FoodBridge
│
├── client
│   ├── src
│   │   ├── components
│   │   │   ├── Home
│   │   │   ├── Login
│   │   │   ├── Signup
│   │   │   ├── PostFood
│   │   │   ├── AdminDashboard
│   │   │   └── Header
│   │   │
│   │   ├── contexts
│   │   ├── utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server
│   ├── models
│   │   ├── User
│   │   ├── FoodPost
│   │   └── Claim
│   │
│   ├── routes
│   │   ├── UserRoutes
│   │   ├── FoodRoutes
│   │   ├── ClaimRoutes
│   │   └── AdminRoutes
│   │
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js
- MongoDB
- Git

---

## Clone Repository

```bash
git clone https://github.com/SankaraKrishnan12/FoodBridge.git

cd FoodBridge
```

---

## Backend Setup

```bash
cd server

npm install
```

Create a `.env` file

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key
```

Run the backend

```bash
node server.js
```

---

## Frontend Setup

```bash
cd client

npm install

npm run dev
```

Frontend runs on

```
http://localhost:8888
```

Backend runs on

```
http://localhost:5000
```

---

# 👥 User Roles

## Donor

- Register/Login
- Create food posts
- Share surplus food
- Manage donations

---

## Recipient

- Browse available food
- Request food
- View requested items

---

## Administrator

- Manage users
- Monitor food listings
- Manage claims
- Oversee platform activities

---

# 🗄 Database Models

### User

- Name
- Email
- Password
- Role

---

### FoodPost

- Food Name
- Description
- Quantity
- Category
- Expiry Date
- Availability Window
- Pickup Location
- Donor

---

### Claim

- Recipient
- Food Post
- Status
- Request Time

---

# 🔐 Security Features

- JWT Authentication
- Password Hashing (bcrypt)
- Protected API Routes
- Role-based Authorization
- Environment Variables

---

# 🌍 Workflow

```
Donor
   │
   ▼
Post Food
   │
   ▼
FoodBridge Database
   │
   ▼
Recipients Browse
   │
   ▼
Request Food
   │
   ▼
Admin Monitoring
```
---

# 🚀 Future Enhancements

- Google Maps integration
- Live donation tracking
- Email notifications
- Push notifications
- QR-code verification
- AI-based food recommendation
- NGO integration
- Donation analytics dashboard
- Mobile application
- Real-time chat between donor and recipient

---

## 🌱 Vision

> "Every meal shared is a step toward a world with less waste and fewer hungry people."

FoodBridge aims to bridge the gap between food surplus and food scarcity by creating an accessible, transparent, and community-driven food donation platform.
