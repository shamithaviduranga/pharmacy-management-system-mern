# Pharmacy Management System — MERN Stack

A beginner-friendly full-stack starter project built with MongoDB, Express, React, and Node.js.

## Features
- Dashboard with inventory and low-stock overview
- Medicine inventory: add, list, search, edit, delete
- Sales: record a sale and automatically reduce stock
- Sales history
- JWT-based login and registration
- Responsive layout

> This is an educational starter project, not a certified pharmacy or clinical system. Do not use it for real dispensing, patient care, or regulatory recordkeeping without proper review and testing.

## Requirements
- Node.js 18+
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- npm

## Setup

### 1. Start local MongoDB on Windows
MongoDB Community Server normally installs a Windows service named `MongoDB`. Check that it is running from PowerShell:
```powershell
Get-Service MongoDB
```
If it is stopped, start PowerShell as Administrator and run:
```powershell
Start-Service MongoDB
```
If MongoDB Shell (`mongosh`) is installed, verify that the server accepts connections:
```powershell
mongosh "mongodb://127.0.0.1:27017/pharmacy_management" --eval "db.runCommand({ ping: 1 })"
```
The response should contain `ok: 1`. If `mongosh` is unavailable, continue with the app setup; the backend connects to MongoDB before it starts listening. The database is created automatically when the application first writes data.

### 2. Configure the backend
```bash
cd server
copy .env.example .env
npm install
npm run dev
```
On macOS/Linux use `cp .env.example .env` instead of `copy`.

Edit `server/.env` and set `MONGO_URI` if you use MongoDB Atlas. The default is `mongodb://127.0.0.1:27017/pharmacy_management`. `CLIENT_ORIGIN` allows both `http://localhost:5173` and `http://127.0.0.1:5173` by default; for a different frontend URL, set it in `server/.env`. Multiple allowed origins can be comma-separated.

Backend runs at `http://localhost:5000`.
After it starts, `http://localhost:5000/api/health` should return a JSON status response.

### 3. Configure the frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

### 4. Create an account
Use the Register link in the app. You can then log in.

### 5. Add products
The database starts empty; products are not seeded automatically. After signing in, open **Medicine inventory → Add medicine** to enter your own inventory. Expired products remain visible for stock management but are blocked at checkout.

## Deployment
The GitHub repository contains source code; it is not itself a live website. To deploy the frontend and API together on Render:

1. Create a MongoDB Atlas database, add a database user, and allow connections from your Render service. Copy the Atlas connection string, replacing its placeholders with your database username and password.
2. In Render, choose **New → Blueprint**, connect this GitHub repository, and select `render.yaml`. Set `MONGO_URI` to the Atlas connection string when prompted. Render generates `JWT_SECRET` automatically.
3. Wait for the service health check to pass, then open its `onrender.com` URL. The frontend and API share the same origin; the production frontend calls `/api`.
4. Register an account on the deployed site and add products to that database. Local products do not automatically appear in the hosted database.

Never commit `.env` files or share database connection strings or JWT secrets. Keep this educational project separate from real patient care and regulated pharmacy workflows.

## Project structure
```text
pharmacy-management-mern/
  client/       React + Vite frontend
  server/       Express REST API + Mongoose models
```

## API overview
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/medicines`
- `POST /api/medicines`
- `PUT /api/medicines/:id`
- `DELETE /api/medicines/:id`
- `GET /api/sales`
- `POST /api/sales`
- `GET /api/dashboard`

Medicine and sales routes require a bearer token. Authentication is intentionally simple for learning purposes; production deployment needs stronger validation, rate limiting, audit logging, secure cookie/token handling, and role-based access control.

## Troubleshooting
- `ECONNREFUSED` from MongoDB: start MongoDB or update `MONGO_URI`.
- Port 5000 is busy: change `PORT` in `server/.env`.
- Frontend cannot reach backend: confirm server is running and `VITE_API_URL` in `client/.env` is correct.
