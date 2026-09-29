# TalkSpace: Real-Time Chat Application

TalkSpace is a real-time chat app built with the MERN stack, Socket.io, Tailwind CSS, and React. It supports secure auth, live messaging, online status, and profile management.

## Features

- Real-time messaging with Socket.io
- JWT-based authentication
- Online/offline user status
- Sidebar conversations and search
- User profile page for updating credentials
- Responsive dark UI

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB
- Real-time layer: Socket.io

## Project Structure

- frontend/ — Vite React app
- backend/ — Express API and Socket server
- .env — local environment variables (ignored by Git)

## Local Setup

1. Install root dependencies:
   ```bash
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Create a local environment file in the backend folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/talkspace
   JWT_SECRET=your_super_secret_key
   NODE_ENV=development
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_API_SECRET=your_api_key_secret
   TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

5. Before starting the upgraded app, migrate existing usernames and conversations:
   ```bash
   cd backend
   npm run migrate:usernames
   ```
   Run this once against the same MongoDB database used by the backend. It assigns collision-free usernames, converts existing conversations to accepted friendships, and creates the required unique/query indexes.

6. Start backend:
   ```bash
   cd backend
   npm run start
   ```

7. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Profile Photo Storage

Profile photos are uploaded directly to Cloudinary and the resulting secure URL is stored in MongoDB. Create a free Cloudinary account, find the **Cloud name**, **API Key**, and **API Secret** in the Cloudinary Console, and add them to `backend/.env` as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Restart the backend after adding the values. Keep the API secret private and configure the same variables in your production backend environment.

## Usernames and Friendships

New accounts must choose an available username before opening chats. User search uses a lowercase username prefix; the sidebar lists accepted conversations only. Before deploying this version, back up MongoDB and run `npm run migrate:usernames` from `backend/` once.

### Manual Verification

1. Create accounts A and B. Each first login should require a username. Try `ab`, a value with a hyphen, and a taken username; they must not save. A valid 3-20 character lowercase username should show availability after a short pause and save successfully.
2. Open two browsers/accounts and enter the same available username at nearly the same time. Exactly one save should succeed; the other should receive “Username taken” and remain on onboarding.
3. Search for the first two or more characters of B's username as A. Confirm results are username-prefix matches, the exact username is first, and searching punctuation does not broaden the match.
4. From A, add B. Confirm B receives a realtime request and sees it in **Requests**. Test **Requested** cancellation, **Accept**, and **Decline**. Accepting should create one conversation and notify A; if B instead sends a request while A's request is pending, the relationship should auto-accept.
5. Confirm **Chats** contains only accepted friends, shows latest-message preview/time, has the empty state when appropriate, and loads more than 50 chats when scrolled.
6. Before accepting a request, call `POST /api/messages/send/<other-user-id>` with a valid authenticated session, and emit the Socket.IO `sendMessage` event with that recipient. Both paths must reject the message. After accepting, both paths should succeed.
7. While A and B are friends and online, confirm they see each other's online status. A third unrelated online account must not appear. Unfriend or block A/B and confirm search, requests, messages, and friend presence are no longer available between them.

## Twilio Verify Setup

The backend uses Twilio Verify for OTP delivery and code checking when `TWILIO_VERIFY_SERVICE_SID` is set. The Verify Service creates and validates the code; the app does not send a custom SMS body or select the Marketing Promotions template from the Twilio message tester.

1. Sign in to the [Twilio Console](https://console.twilio.com/).
2. In the Console navigation, open **Develop > Verify > Services**. You can also open the [Verify Services page](https://www.twilio.com/console/verify/services).
3. Choose **Create new Service**. Give it a friendly name such as `TalkSpace OTP` and create it.
4. Open the service you created and copy its **Service SID**. It begins with `VA`. Set this as `TWILIO_VERIFY_SERVICE_SID` in `backend/.env`. Do not use the Account SID (`AC...`) or an API Key SID (`SK...`) here.
5. In the Verify Service settings, set the code length to **6** to match the app's six-digit OTP input.
6. In **Develop > API keys & tokens > API keys**, create or use a **Main** API key belonging to the same Twilio account as the Verify Service. Put its key SID (`SK...`) in `TWILIO_API_KEY` and its matching secret in `TWILIO_API_SECRET`. Keep the secret private.
7. Set `TWILIO_ACCOUNT_SID` to the account SID (`AC...`) that owns the API key and Verify Service. The required backend settings are:

   ```env
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_API_KEY=SK...
   TWILIO_API_SECRET=...
   TWILIO_VERIFY_SERVICE_SID=VA...
   ```

   `TWILIO_PHONE_NUMBER` is not needed when using Verify. It is only used by the legacy direct-SMS fallback when no Verify Service SID is configured.

8. If the Twilio account is still a trial account, add and verify the recipient phone number in the Console's **Verified Caller IDs** area. Trial accounts can send Verify SMS only to verified recipients. Enter the recipient in international E.164 format, for example `+1...` or `+91...`.
9. Restart the backend after saving `backend/.env`, then use **Login** or **Sign up** in TalkSpace, request an OTP, and enter the received six-digit code. For trial accounts, test with a number verified in Twilio first.
10. If delivery or checking fails, inspect **Monitor > Logs > Verify** in the Twilio Console. Never paste API secrets or OTP codes into chat or commit them to Git.

For Render, add the same four required variables (`TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET`, and `TWILIO_VERIFY_SERVICE_SID`) in the backend service's **Environment** settings, then redeploy. Keep the secrets out of the repository.

## Production Deployment

### Backend (Render)

- Root directory: backend
- Build command: npm install
- Start command: npm start
- Environment variables:
  - PORT
  - MONGO_URI
  - JWT_SECRET
  - NODE_ENV
   - TWILIO_ACCOUNT_SID
   - TWILIO_API_KEY
   - TWILIO_API_SECRET
   - TWILIO_VERIFY_SERVICE_SID

### Frontend (Vercel)

- Root directory: frontend
- Build command: npm install && npm run build
- Output directory: dist
- Add environment variable if needed:
  - VITE_SOCKET_URL=https://your-backend-url.onrender.com

## Notes

- Local environment files are intentionally ignored by Git.
- Do not commit your real .env values.

## Acknowledgements

Special thanks to MongoDB, Express, React, Node.js, and Socket.io for making this project possible.
