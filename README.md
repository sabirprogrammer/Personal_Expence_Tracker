# Expense Tracker Application

A clean, modern, scalable, and production-ready enterprise-level expense tracker application featuring personal dashboards, admin dashboards, user management, and transactional reports.

## Architecture

This application consists of two main parts:
- **Backend**: Express API server connected to MongoDB database using Mongoose ODM, protected with JWT-based authentication.
- **Frontend**: Vanilla CSS and vanilla JS modules built over standard premium semantic HTML templates. Charts are rendered using Chart.js.

## Directory Structure

- `/backend` — Express API codebase
  - `/controllers` — API business logic
  - `/middleware` — Authentication and authorization middleware
  - `/models` — Mongoose DB schemas (User, Category, Transaction)
  - `/routes` — REST endpoint declarations
  - `/scripts` — resetDb maintenance utility
  - `/seed` — database seeding modules and transactions data
  - `/utils` — formatting helper utilities
- `/frontend` — Browser semantic templates, CSS, and JS logic
  - `/admin` — Admin-scope views
  - `/css` — Global stylesheets
  - `/js` — Client applications scripts
  - `/public` — Public marketing/landing pages
  - `/user` — User-scope views
- `README.md` — Setup instructions
- `.gitignore` — Ignore standard temporary files

## Setup & Running

### 1. Prerequisites
- Node.js (v16+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 2. Backend Installation
1. Navigate to `/backend` directory.
2. Create your `.env` file based on `.env.example`:
   ```bash
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
   JWT_SECRET=expense_tracker_secret_key_12345
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Reset and seed database (optional, deletes all existing entries):
   ```bash
   npm run reset-db
   ```
5. Start development backend server:
   ```bash
   npm run dev
   ```

### 3. Frontend Running
Simply open `frontend/public/index.html` in your favorite web browser or host the `frontend` folder using any static web server (like VS Code's Live Server or Python's `http.server`).

## Seeding Credentials

The default seed database includes:
- **Administrator**:
  - Email: `admin@example.com`
  - Password: `Admin@123`
- **Default User**:
  - Email: `user@example.com`
  - Password: `User@123`
