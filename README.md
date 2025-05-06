# AEGIS

A powerful, lightweight password manager you will actually *want* to use.

![Aegis Logo](aegis-frontend/public/white1.png)

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Security Overview](#security-overview)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [License](#license)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## Introduction

Welcome to **Aegis**: your trusted companion in securing your digital life. **Aegis** offers a seamless, secure, and user-friendly solution to store, generate, and manage your passwords with ease. Electron coming soon!

---

## Features

- **User Authentication:** Secure registration and login system with hashed passwords using `bcryptjs`.
- **Secure Password Storage:** Store, retrieve, update, and delete credentials securely. All passwords are encrypted using AES-256 and decrypted client-side with a master password.
- **Password Generator:** Generate strong, random passwords with customizable options like length and character types.
- **Beautiful UI:** Modern, sleek, and responsive glassmorphic interface designed with Tailwind CSS and enhanced with Framer Motion animations. Inspired by shadcn components.
- **Dashboard:** Manage all your credentials in one place with features to hide/show passwords for added security.
- **Encryption & Security:** Client-side encryption ensures that your sensitive data remains confidential and secure.

---

## Security Overview

At **Aegis**, security is top priority. I have implemented a robust security pipeline to ensure that your data remains safe and private.

### **1. Authentication: Verifying Who You Are**

- **Registration:** Users register with a username, email, and password. Passwords are hashed using `bcryptjs` before being stored in the database, ensuring that plaintext passwords are never exposed.
- **Login:** Upon login, the entered password is hashed and compared with the stored hash. Successful authentication issues a JSON Web Token (JWT) for session management.

### **2. Authorization: Determining Access Rights**

- **Protected Routes:** Express.js middleware protects sensitive API endpoints. Only authenticated users with valid JWTs can access or modify their credentials.
- **User Isolation:** Each user's data is scoped uniquely, preventing access to other users' credentials.

### **3. Encryption: Safeguarding Your Passwords**

- **Client-Side Encryption:** Before storing, passwords are encrypted on the client side using AES-256 via the `crypto-js` library. The master password derives the encryption key using SHA-256, ensuring only you can decrypt your data.
- **Secure Storage:** Encrypted passwords are stored in a Railway-hosted PostgreSQL database. Since decryption happens only on the client side, even if the database is compromised, the data remains unreadable.

### **4. JWT Security**

- **Token Integrity:** JWTs are signed using a secret key, ensuring they cannot be tampered with.
- **Expiration:** Tokens have a set expiration time, reducing the window for potential misuse.
- **Secure Transmission:** All communication will occur over HTTPS, protecting tokens during transit.

---

## Technologies Used

### **Frontend**

- **React.js**
- **Vite**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion**
- **Crypto-JS**

### **Backend**

- **Node.js**
- **Express.js**
- **Railway-hosted PostgreSQL**
- **SQLite Backup**
- **bcryptjs**
- **jsonwebtoken**
- **dotenv**
- **Cors**

---

## Architecture


1. **Frontend (React + Vite):**
   - Handles user interactions, form submissions, and communicates with the backend via APIs.
   - Encrypts/decrypts passwords on the client side using the master password.

2. **Backend (Node.js + Express):**
   - Manages authentication, authorization, and API endpoints for CRUD operations on credentials.
   - Stores hashed passwords and encrypted credentials in SQLite.

3. **Database (PostgreSQL):**
   - Stores user information and encrypted credentials.
   - Ensures data integrity and isolation between users.

4. **Security Pipeline:**
   - **Authentication**: Users verify their identity through secure login.
   - **Authorization**: Users can only access their own data.
   - **Encryption**: All sensitive data is encrypted on the client side before storage.

---

## Getting Started

Follow these instructions to set up **Aegis** on your local machine for development and testing purposes.

### Prerequisites

- **Node.js** (v14 or later)
- **npm** (v6 or later) or **yarn**
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/infinimineralex/Project-AEGIS.git
cd Project-AEGIS
```

#### 2. Set Up the Backend

```bash
# Install dependencies
npm install

# Create a .env file in the backend directory and add the following:
# PORT=5000
# JWT_SECRET=your_jwt_secret_key

# Start the backend server
npm run dev
```

> **Note:** Replace `your_jwt_secret_key` with a strong, unpredictable secret key.

#### 3. Set Up the Frontend

Open a new terminal window/tab and navigate to the frontend directory:

```bash
# Navigate to the frontend directory
cd aegis-frontend

# Install dependencies
npm install

# Create a .env file in the frontend directory and add the following:
# VITE_API_BASE_URL=http://localhost:5173

# Start the frontend development server
npm run dev
```

> **Note:** Ensure that both backend and frontend servers are running simultaneously on ports `5000` and `5173` respectively.

---

## Usage

1. **Access the Homepage:**
   - Open your browser and navigate to [http://localhost:5173](http://localhost:5173).
   - Explore the features and understand how **Aegis** can secure your passwords.

2. **Register a New Account:**
   - Click on the **"Get Started"** button on the homepage.
   - Fill out the registration form with your username, email, password, and set a master password.
   - Submit the form to create your account.

3. **Login:**
   - Navigate to [http://localhost:5173/login](http://localhost:5173/login).
   - Enter your credentials along with the master password to access your dashboard.

4. **Manage Credentials:**
   - **Add Credentials:** Use the form to store new website credentials. Utilize the password generator for creating strong passwords.
   - **View Credentials:** Your stored credentials will appear in a list. Passwords are hidden by default for security.
   - **Reveal Passwords:** Click on the **"Show"** button next to a password to reveal it. Click again to hide.
   - **Edit/Delete:** Modify or remove credentials as needed using the respective buttons.

---


## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/)
- [Railway](https://railway.com)
- [SQLite](https://www.sqlite.org/index.html)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [crypto-js](https://github.com/brix/crypto-js)
- [Framer Motion](https://www.framer.com/motion/)

---

## Contact

For any inquiries, feedback, or support, please reach out:

- **Email:** [alexalot7@gmail.com](mailto:alexalot7@gmail.com)
- **GitHub:** [@infinimineralex](https://github.com/infinimineralex)
- **LinkedIn:** [Alexander Haga](https://www.linkedin.com/in/alexander-haga-5b09b020b/)

---

## Tutorials & Resources

### **1. Setting Up Development Environment**

- **Frontend Setup:**
  - Install [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/).
  - Clone the repository and follow the installation steps in the [Getting Started](#getting-started) section.

- **Backend Setup:**
  - Ensure that the `.env` file contains the necessary environment variables.
  - Start the backend server as described in the [Getting Started](#getting-started) section.

### **2. Understanding the Security Pipeline**

For a deeper understanding of **Aegis**'s security mechanisms, refer to the [Security Overview](#security-overview) section in this README, which explains how authentication, authorization, and encryption work together to protect your data.


---

Happy Securing!
