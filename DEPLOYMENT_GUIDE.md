# Deploying the CRM for a New Coaching Center

This guide provides a comprehensive walkthrough for deploying the Bharath Academy CRM application for a completely new client. It is written for a junior developer and assumes minimal prior knowledge of the project's specifics.

## What Changes Per Client vs. What Stays the Same

To ensure consistency and prevent errors, it's crucial to understand what is configurable versus what is part of the core application.

### ✅ What Changes Per Client
- **`.env` file**: ALL client-specific values are stored here. This includes Firebase credentials, center name, contact details, theme colors, and feature flags. This is the primary file you will edit.
- **`public/logo.png`**: The center's logo.
- **Firebase Project**: Each client MUST have their own separate Firebase project to ensure complete data isolation.

### 🚫 What NEVER Changes
- **Source Code**: Do not edit the application's source code in `src/` for client-specific needs. All customization is handled via the `.env` file.
- **Components**: UI components are designed to be generic.
- **Services**: Data services are designed to work with any Firebase project.
- **Routing**: Page routes and application structure are core to the application.

---

## Prerequisites

Before you begin, ensure you have the following installed and set up:
- **Node.js**: Version 18 or higher.
- **Firebase CLI**: The command-line interface for Firebase. If you don't have it, install it globally by running:
  ```bash
  npm install -g firebase-tools
  ```
- **A Google Account**: To create and manage Firebase projects.

---

## Step-by-Step Deployment Guide

Follow these steps carefully to set up and deploy the application for a new client.

### 1. Clone the Repository
Get the latest version of the application source code onto your local machine.
```bash
git clone <your-repository-url>
cd <repository-folder>
```

### 2. Create a New Firebase Project
- Go to the [Firebase Console](https://console.firebase.google.com).
- Click **"Add project"** and give it a unique name (e.g., `new-client-academy-crm`).
- Follow the on-screen steps to create the project. Google Analytics is optional.

### 3. Configure Firebase Services
From your new project's dashboard in the Firebase Console:

- **Enable Firestore Database**:
  - Click on **Build > Firestore Database**.
  - Click **"Create database"**.
  - Select **Production mode**.
  - Choose a region. **`asia-south1` (Mumbai)** is recommended for Indian clients.
  - Click **"Enable"**.

- **Enable Authentication**:
  - Click on **Build > Authentication**.
  - Click **"Get started"**.
  - Select **"Email/Password"** from the list of sign-in providers and enable it.

- **Enable Storage**:
  - Click on **Build > Storage**.
  - Click **"Get started"**.
  - Follow the prompts to enable Cloud Storage.

### 4. Register a Web App & Get Config
- In your Firebase project dashboard, click the **Web icon (`</>`)** to register a new web app.
- Give the app a nickname (e.g., "CRM Web App").
- **Do not** check the box for Firebase Hosting at this stage.
- Click **"Register app"**.
- Firebase will display your `firebaseConfig` object. **Copy this object carefully.** You'll need it in the next step.

### 5. Set Up Environment Variables
- In the project's root directory, copy the example environment file:
  ```bash
  cp .env.example .env
  ```
- Open the new `.env` file and fill in all the values:
  - Paste the Firebase config values you copied in the previous step.
  - Add the new center's name, contact details, and address.
  - Set the theme colors and enable/disable features as required for the new client.

### 6. Replace the Logo
- Replace the `public/logo.png` file with the new client's logo. Ensure the new file is also named `logo.png`.

### 7. Install Dependencies
- Install all the necessary Node.js packages.
  ```bash
  npm install
  ```

### 8. Log In to Firebase
- Authenticate the Firebase CLI with your Google account.
  ```bash
  firebase login
  ```

### 9. Initialize Firebase Hosting
- Link your local project to the new Firebase project.
  ```bash
  firebase init hosting
  ```
- You will be asked a series of questions:
  - **Which project do you want to use?**: Select **"Use an existing project"** and choose the new Firebase project you created.
  - **What do you want to use as your public directory?**: Type **`out`**.
  - **Configure as a single-page app (rewrite all urls to /index.html)?**: Type **`y`** (Yes).
  - **Set up automatic builds and deploys with GitHub?**: Type **`n`** (No) for now.
  - **File out/index.html already exists. Overwrite?**: Type **`N`** (No).

### 10. Build and Deploy the Application
- Now, run the custom deploy script. This will build the Next.js app for production and deploy it to Firebase Hosting.
  ```bash
  npm run deploy
  ```
- After the command finishes, it will output the URL for the deployed site.

### 11. Create the First Admin User
The application is deployed, but no one can log in yet. You must create the first administrative user manually.

- Go to your Firebase Console > **Authentication**.
- Click the **"Add user"** button.
- Enter an email and a secure password for the admin.
- After creating the user, copy the **`User UID`** for that account.

- Now, go to **Firestore Database**.
- Select the `users` collection (or create it if it doesn't exist).
- Click **"Add document"**.
- In the **Document ID** field, **paste the User UID** you just copied.
- Add a field named `role` of type `string` with the value `super_admin`.
- Click **"Save"**.

### 12. Test the Deployed URL
- Open the deployed URL from Step 10.
- Log in with the admin credentials you created.
- Verify that you can access the admin dashboard and that all information is correct.

Congratulations! The deployment is complete.
