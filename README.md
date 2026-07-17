# Personal Expense Tracker

An enterprise-grade, premium SaaS web application designed to track, categorize, and manage personal expenses. It features detailed spending analytics, dynamic charts, multi-tenant authentication, and a full administrative dashboard for managing users and expense categories.

---

## 🚀 Key Features & Redesign Highlights

### 1. Unified Branding & Navigation UX
* **Auth Page Navigation**: Redesigned the authentication flow so that the professional sticky header/navbar remains fully visible on `Login`, `Register`, and `Forgot/Reset Password` pages, matching the landing page branding.
* **Mobile Responsiveness**: Upgraded headers with an interactive slide-out mobile drawer menu for smaller screens.

### 2. Premium SaaS Layouts (User & Admin Portals)
* **Collapsible Sidebars**: Interactive, collapsible sidebar navigation equipped with premium SVG icons, active menu state indicators, and state persistence in `localStorage`.
* **SaaS Utility Headers**: Embedded global search bars, system notification logs/alerts drawers, and user profile dropdown menus.
* **Dynamic Theme Switcher**: Full Light/Dark mode toggling with `localStorage` persistence. The application automatically detects theme changes and redraws all Chart.js graphics with corresponding text, grid, and borders colors.
* **Visual Polish**: Replaced flat blocks with rich gradients, modern typography (Inter), glassmorphism styles, and micro-animations.

### 3. Database Initialization & Seeding Security
* **No Default User Seeds**: Removed dummy normal user seeds to prevent credential bloating. The system starts completely clean. Normal users can register safely via the Register portal.
* **Administrator-Only Seed**: Checks on startup and seeds exactly one administrator account (if not already existing).
* **Automated `.env` Synchronization**: If administrator credentials in the `.env` file are modified, the backend automatically detects the changes and synchronizes the email, name, or hashed password in the MongoDB record on the next startup.
* **Clean 5 Category Seeds**: Seeds only the five essential starting categories:
  * `Food`
  * `Transport`
  * `Shopping`
  * `Bills`
  * `Entertainment`

---

## 🛠️ Technologies Used

* **Frontend**:
  * Semantic HTML5 Markup
  * Modern CSS3 (Variables, HSL Palettes, Flexbox/Grid, Keyframe Animations)
  * Modular Vanilla JavaScript (Async/Await Fetch APIs, JWT token interceptors)
  * Chart.js (Doughnut and Bar charts)
* **Backend**:
  * Node.js & Express.js REST API
  * Mongoose ODM
  * JWT (JSON Web Token) Security & Cookie-Parser
  * BcryptJS Password Hashing
  * Express Rate-Limiter & CORS Protection
* **Database**:
  * MongoDB (NoSQL)

---

## 📂 Directory Structure

```text
├── /backend
│   ├── /controllers  # Express API endpoint controllers
│   ├── /middleware   # JWT verification and route protection
│   ├── /models       # Mongoose Schemas (User, Category, Transaction)
│   ├── /routes       # REST API route configurations
│   ├── /scripts      # resetDb.js database maintenance script
│   ├── /seed         # seeder.js backend initialization and seeding
│   ├── /utils        # helper utilities
│   ├── .env.example  # Reference env configuration
│   └── server.js     # Express App entrypoint
└── /frontend
    ├── /admin        # Administrator views (Overview, User CRUD, Categories CRUD, Logs)
    ├── /user         # User views (Dashboard, Transactions, Add/Edit, Reports, Profile)
    ├── /public       # Landing pages (Home, About, Contact)
    ├── /css          # style.css stylesheets
    └── /js           # Client modules (api.js API wrappers, script.js, admin.js)
```

---

## ⚙️ Running Locally

### 1. Prerequisites
* **Node.js** (v16+)
* **MongoDB** instance running locally (`mongodb://127.0.0.1:27017`)

### 2. Backend Setup
1. Open a terminal and navigate to the `/backend` folder.
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
3. Configure the env variables inside `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
   JWT_SECRET=your_jwt_secret_key_here
   
   # Admin Default Credentials
   ADMIN_NAME="System Administrator"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="Admin@123"
   ```
4. Install npm dependencies:
   ```bash
   npm install
   ```
5. Reset and seed the database:
   ```bash
   node scripts/resetDb.js
   ```
6. Start the server:
   * Production mode: `npm start`
   * Development live reload: `npm run dev`

### 3. Frontend Setup
1. The frontend consists of static client files.
2. Bypassing CORS constraints is fully handled by the backend CORS configuration. Open the app by running a local static server inside `/frontend` (e.g. using VS Code's **Live Server** extension, or running `python -m http.server` in the terminal).
3. Access the landing page:
   ```text
   http://localhost:5500/public/index.html
   ```

---

## 🔑 Test Credentials

### 1. Administrator Portal (`/frontend/admin/index.html`)
To access admin analytics, user management, and custom categories configuration:
* **Email**: `admin@example.com` *(or values set in `.env`)*
* **Password**: `Admin@123` *(or values set in `.env`)*

### 2. User Portal (`/frontend/user/dashboard.html`)
For individual financial recording, budgeting, and dashboard charts:
* **Registration**: Register a new user account on the signup page (`/frontend/user/signup.html`).
* **Security & Isolation**: For maximum security and clean states, no default user account credentials are pre-seeded. Registering an account yields a fresh portal instance.
