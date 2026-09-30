# 💬 TalkSpace — Modern Real-Time Chat & Social Platform

<div align="center">

![TalkSpace Banner](https://img.shields.io/badge/TalkSpace-Real--Time%20Chat-6366f1?style=for-the-badge&logo=socketdotio&logoColor=white)

[![React](https://img.shields.io/badge/React-18.x-61dafb?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Clerk](https://img.shields.io/badge/Clerk-Authentication-6C47FF?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**TalkSpace** is a full-featured, real-time messaging web application built on the MERN stack. Designed with a sleek dark aesthetic, instant WebSocket synchronization, WhatsApp-style delivery receipts, file attachments, friendship management, and secure authentication powered by Clerk & JWT.

[Features](#-key-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Environment Setup](#-environment-variables) • [Architecture](#-project-structure) • [Author](#-author)

</div>

---

## ✨ Key Features

- ⚡ **Instant Real-Time Messaging**: Bidirectional WebSocket communication powered by **Socket.io** with instant audio notifications and live updates.
- ⏱️ **WhatsApp-Style Status Receipts**:
  - **Single Gray Tick (`✓`)**: Message sent to server (receiver offline).
  - **Double Gray Tick (`✓✓`)**: Message delivered to recipient (receiver online).
  - **Double Blue Tick (`✓✓` Blue)**: Message read / seen by recipient.
- 🖼️ **WhatsApp-Style In-Chat Image Reveal**:
  - Blurred thumbnail preview with interactive center loading pill displaying **1% ➔ 100%** progress.
  - Image unblurs in-place on completion.
  - Clean bottom-right download button to save files to disk.
- 📄 **Rich Document Attachments & Icons**: Distinct color-coded file icons for PDF (`.pdf`), Word (`.docx`), PowerPoint (`.pptx`), Excel (`.xlsx`), ZIP archives, and text files.
- 🌌 **Glassmorphic Full-Screen Image Viewer**: High-res preview modal with `backdrop-blur-md` background and click-outside dismissal.
- 👥 **Friendship & Request System**: Send, accept, decline, or cancel friend requests with real-time presence sync.
- 🏷️ **Unique Username Onboarding**: Real-time availability checking with collision-free unique usernames.
- 🟢 **Live Online/Offline Presence**: Instant online status indicators across chats and user list.
- 🛡️ **User-Friendly Error Handling & Clerk Error Boundary**: Catch-all error formatting providing friendly user messages and graceful fallback screens if setup keys are invalid.
- 🎨 **Modern Dark UI**: Fully responsive, glassmorphic dark theme styled with Tailwind CSS and DaisyUI components.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Auth**: Clerk React SDK (`@clerk/clerk-react`)
- **Styling**: Tailwind CSS, DaisyUI
- **State Management**: Zustand
- **Icons & Audio**: React Icons, HTML5 Audio notifications
- **Real-Time Client**: Socket.io-client

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **WebSockets**: Socket.io
- **File Storage**: Cloudinary SDK & Multer
- **Auth & Security**: Clerk SDK / JWT, BcryptJS, Cookie-Parser

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
│   │   ├── utils/       # Error formatting & helper utilities
│   │   └── zustand/     # Conversation & chat state stores
│   └── index.html
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (local instance or MongoDB Atlas)
- Free [Cloudinary](https://cloudinary.com/) account (for file & photo uploads)
- Free [Clerk](https://clerk.com/) account (for authentication)

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

# Cloudinary (Attachments & Profile Photos)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
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
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_APP_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
# App runs on http://localhost:3000
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|:---:|
| `PORT` | Backend server port (Default: `5000`) | No |
| `MONGO_URI` | MongoDB connection string (Atlas for production) | **Yes** |
| `JWT_SECRET` | Secret key used to sign session tokens | **Yes** |
| `NODE_ENV` | `development` or `production` | **Yes** |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | **Yes** |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | **Yes** |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | **Yes** |
| `CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key | Optional / As needed |
| `CLERK_SECRET_KEY` | Clerk Backend Secret Key | Optional / As needed |

### Frontend (`frontend/.env`)

| Variable | Description | Required |
|---|---|:---:|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key for Frontend SDK (`pk_test_...`) | **Yes** |
| `VITE_APP_URL` | Frontend application URL | **Yes** |
| `VITE_SOCKET_URL` | Backend Socket URL | For Production |

---

## 🚢 Production Deployment

### Backend (Render / Railway / VPS)
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**: Set `NODE_ENV=production` and add all database & Cloudinary credentials.

### Frontend (Vercel / Netlify)
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_CLERK_PUBLISHABLE_KEY=pk_test_...`
  - `VITE_SOCKET_URL=https://your-backend-domain.onrender.com`

---

## 👨‍💻 Author

Developed and maintained by **[Aman Kumar Jha](https://github.com/Amankumarjha0)**.

- GitHub: [@Amankumarjha0](https://github.com/Amankumarjha0)
- Repository: [TalkSpace](https://github.com/Amankumarjha0/TalkSpace)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
