# 💬 TalkSpace — Modern Real-Time Chat & Social Platform

<div align="center">

![TalkSpace Banner](https://img.shields.io/badge/TalkSpace-Real--Time%20Chat-6366f1?style=for-the-badge&logo=socketdotio&logoColor=white)

[![React](https://img.shields.io/badge/React-18.x-61dafb?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**TalkSpace** is a full-featured, real-time messaging web application built on the MERN stack. Designed with a sleek dark aesthetic, instant WebSocket synchronization, friendship management system, and secure authentication.

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Environment Setup](#-environment-variables) • [Architecture](#-architecture) • [Author](#-author)

</div>

---

## ✨ Key Features

- ⚡ **Instant Real-Time Messaging**: Bidirectional WebSocket communication powered by **Socket.io** for real-time delivery and instant notifications.
- 👥 **Friendship & Request System**: Send, accept, decline, or cancel friend requests with real-time updates and presence.
- 🏷️ **Unique Username Onboarding**: Real-time debounce availability checking and collision-free unique usernames.
- 🟢 **Live Online/Offline Presence**: See when friends are active in real time.
- 🖼️ **Profile Photo Uploads**: Cloudinary integration for cloud avatar uploads with initials fallback support.
- 🔐 **Dual Auth & Security**:
  - Secure JWT authentication with HTTP-only cookies.
  - Twilio Verify OTP (phone number verification) support.
  - Rate limiting, XSS sanitation, and route protection middleware.
- 🔍 **Real-Time Prefix Search**: Instant user search with prefix matching for quick friend discovery.
- 🎨 **Modern Dark UI**: Fully responsive, glassmorphic dark theme styled with Tailwind CSS and custom DaisyUI components.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS, DaisyUI
- **State Management**: Zustand
- **Icons & Audio**: React Icons, HTML5 Audio notifications
- **Real-Time Client**: Socket.io-client

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **WebSockets**: Socket.io
- **File Storage**: Cloudinary SDK & Multer
- **Auth & Security**: JSON Web Tokens (JWT), BcryptJS, Cookie-Parser, Twilio Verify SDK

---

## 📂 Project Structure

```bash
TalkSpace/
├── backend/
│   ├── config/          # Cloudinary & MongoDB database connections
│   ├── controllers/     # Auth, User, Username, Friendship, Message controllers
│   ├── middleware/      # Auth guard, rate limiters, file upload middleware
│   ├── models/          # User, Friendship, Message, Conversation schemas
│   ├── routes/          # RESTful API route definitions
│   ├── scripts/         # DB migration utilities
│   ├── services/        # Business logic for friendship & messaging
│   ├── socket/          # Socket.io connection & event handlers
│   └── server.js        # Entry point for backend server
├── frontend/
│   ├── public/          # Static assets & logos
│   ├── src/
│   │   ├── assets/      # Audio notification & icons
│   │   ├── components/  # Modals, Chat, Sidebar, Landing, Fallback avatars
│   │   ├── context/     # Auth & Socket providers
│   │   ├── hooks/       # Custom React hooks (auth, messages, conversations)
│   │   ├── pages/       # Home, Login, Signup, Profile, ChooseUsername
│   │   └── zustand/     # Conversation & chat state stores
│   └── index.html
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas)
- Free [Cloudinary](https://cloudinary.com/) account (for photo uploads)

### 1. Clone the repository
```bash
git clone https://github.com/Amankumarjha0/TalkSpace.git
cd TalkSpace
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/talkspace
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development

# Cloudinary (Profile Photos)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Twilio Verify (Optional OTP support)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_twilio_secret
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Run database migration (indexes and username verification):
```bash
npm run migrate:usernames
```

Start the backend server:
```bash
npm run start
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|:---:|
| `PORT` | Backend server port (Default: `5000`) | No |
| `MONGO_URI` | MongoDB connection connection string | **Yes** |
| `JWT_SECRET` | Secret key used to sign session tokens | **Yes** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | **Yes** |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | **Yes** |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | **Yes** |
| `TWILIO_ACCOUNT_SID` | Twilio Master Account SID | Optional |
| `TWILIO_VERIFY_SERVICE_SID`| Twilio Verify Service SID (`VA...`) | Optional |

---

## 🚢 Production Deployment

### Backend (Render / Railway / VPS)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Add all `.env` variables in your platform dashboard.

### Frontend (Vercel / Netlify)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Optional Env**: `VITE_SOCKET_URL=https://your-backend-domain.com`

---

## 👨‍💻 Author

Developed and maintained by **[Aman Kumar Jha](https://github.com/Amankumarjha0)**.

- GitHub: [@Amankumarjha0](https://github.com/Amankumarjha0)
- Repository: [TalkSpace](https://github.com/Amankumarjha0/TalkSpace)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
