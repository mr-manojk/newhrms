
# 🔒 MyHR Modular Backend Setup Guide

MyHR now uses a clean **MVC (Model-View-Controller)** architecture to ensure scalability, maintainability, and security.

### 📁 Directory Structure
```text
server/
├── server.js              # Entry point: Starts the HTTP server
├── app.js                 # App configuration: Middleware & Route mounting
├── config/
│   └── db.js              # MySQL connection pool configuration
├── routes/
│   └── apiRoutes.js       # Route definitions for all HR modules
├── controllers/
│   └── hrController.js    # Business logic & Request handling
├── models/
│   └── hrModel.js         # Database abstraction & Bulk Upsert logic
├── middleware/
│   └── errorHandler.js    # Global error handling middleware
└── .env                   # Environment variables (DO NOT COMMIT)
```

### 🚀 Getting Started

1.  **Database Setup**:
    - Ensure MySQL is running on your system.
    - Create a database named `myhr_db`.
    - Run the provided `database.sql` script to create all tables and initial seed data:
      ```bash
      mysql -u root -p myhr_db < database.sql
      ```

2.  **Environment Setup**:
    Create a `.env` file in the `server/` directory:
    ```env
    PORT=5000
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=your_password
    DB_NAME=myhr_db
    ```

3.  **Install Dependencies**:
    ```bash
    cd server
    npm install express mysql2 dotenv multer cors
    ```

4.  **Run the Server**:
    ```bash
    node server.js
    ```

### 🛡️ Security Features
- **Environment Isolation**: Sensitive data is kept out of the code.
- **Bulk Upsert Logic**: Handles large data syncs efficiently with transactional integrity.
- **Sanitized Outputs**: Ensures null-safe handling of database responses.
- **Centralized Error Handling**: Prevents leaking stack traces to the frontend in production.
