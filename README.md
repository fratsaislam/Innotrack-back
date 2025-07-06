# Innotrack Backend

> This is the backend API for **Innotrack**, ESTIN College’s startup incubator platform. It handles project management, user authentication, and admin operations using Express.js, MongoDB, and Cloudinary.

## Table of Contents

* [About the Backend](#about-the-backend)
* [Tech Stack](#tech-stack)
* [API Endpoints](#api-endpoints)
* [Setup Instructions](#setup-instructions)
* [Folder Structure](#folder-structure)
* [Contact](#contact)

---

## About the Backend

The backend powers the logic behind Innotrack: project creation, user roles, file uploads (via Cloudinary), and all data persistence. It exposes a RESTful API consumed by the Next.js frontend.

---

## Tech Stack

| Layer        | Technology             | Description                                 |
| ------------ | ---------------------- | ------------------------------------------- |
| Framework    | **Express.js**         | Lightweight web server and routing          |
| Database     | **MongoDB + Mongoose** | NoSQL document storage with schema modeling |
| Cloud Upload | **Cloudinary**         | Handles profile pictures & project images   |
| Auth         | **JWT**                | Secure, stateless authentication            |

---

## API Endpoints

### 📁 Project Management

| Method | Route             | Middleware   | Description                    |
| ------ | ----------------- | ------------ | ------------------------------ |
| GET    | `/all-projects`   | `adminCheck` | List all projects (admin only) |
| GET    | `/single-project` | `identifier` | Get one project by query/id    |
| GET    | `/user-projects`  | `identifier` | Get current user's projects    |
| POST   | `/create-project` | `identifier` | Create a new project           |
| PATCH  | `/accept-project` | `adminCheck` | Admin accepts a project        |
| PATCH  | `/update-project` | `identifier` | Update a user's own project    |
| DELETE | `/delete-project` | `adminCheck` | Admin deletes a project        |

### 👤 User Authentication

| Method | Route                          | Middleware                                  | Description                      |
| ------ | ------------------------------ | ------------------------------------------- | -------------------------------- |
| POST   | `/signup`                      | —                                           | Register a new user              |
| POST   | `/signin`                      | —                                           | Log in and receive JWT           |
| POST   | `/signout`                     | `identifier`                                | Invalidate token/session         |
| PATCH  | `/send-verification-code`      | —                                           | Send code for email verification |
| PATCH  | `/verify-verification-code`    | —                                           | Verify the email code            |
| PATCH  | `/send-forgot-password-code`   | —                                           | Forgot password flow: step 1     |
| PATCH  | `/verify-forgot-password-code` | —                                           | Forgot password flow: step 2     |
| PATCH  | `/change-password`             | `identifier`                                | Change password (after login)    |
| PATCH  | `/change-information`          | `identifier`, `upload.single('profilePic')` | Update profile info and picture  |
| GET    | `/check`                       | `identifier`                                | Check if user is logged in       |
| GET    | `/all-users`                   | `adminCheck`                                | Admin fetches all users          |
| PATCH  | `/update-user-role`            | `adminCheck`                                | Admin updates a user's role      |

---

## Setup Instructions

### Prerequisites

* **Node.js ≥ 20**
* **MongoDB running locally or Atlas cluster**
* **Cloudinary account & credentials**

### Installation

```bash
# 1. Clone the repo
$ git clonehttps://github.com/fratsaislam/Innotrack-back
$ cd innotrack-backend

# 2. Create environment config
$ cp .env.example .env
# Fill in: MONGO_URI, JWT_SECRET, CLOUDINARY_* keys

# 3. Install dependencies
$ npm install

# 4. Start development server
$ npm run dev
```

---

## Folder Structure

```
backend/
├── controllers/       # All route logic (auth, projects)
├── middleware/        # Identifier, adminCheck, upload middleware
├── models/            # Mongoose models (User, Project)
├── routes/            # Express routers (auth, project)
├── utils/             # Cloudinary setup, helpers
├── .env               # Environment variables
└── server.js          # Entry point
```

---

## Contact

* **Backend Developer** – [i_fratsa@estin.dz](mailto:i_fratsa@estin.dz)

Built with 🛠️ by islam
