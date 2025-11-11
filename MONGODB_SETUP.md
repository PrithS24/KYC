## MongoDB Installation Required

To complete the KYC system setup, you need to install MongoDB Community Edition.

### Windows Installation Steps:

1. **Download MongoDB Community Edition**
   - Visit: https://www.mongodb.com/try/download/community
   - Download the latest Windows MSI installer

2. **Install MongoDB**
   - Run the installer
   - Choose "Install MongoDB as a Windows Service"
   - This will automatically start MongoDB on system startup

3. **Verify Installation**
   - Open PowerShell and run: `mongod --version`
   - Should display version information

4. **Start MongoDB (if not running as service)**
   ```powershell
   # Create data directory
   mkdir C:\data\db
   
   # Start MongoDB
   mongod --dbpath "C:\data\db"
   ```

5. **Run the Backend Server**
   ```powershell
   cd c:\Users\ASUS\Documents\KYC\server
   npm start
   ```

### Alternative: Use Docker (Easier)

If you have Docker installed:

```powershell
# Start MongoDB container
docker run -d -p 27017:27017 --name mongodb mongo:latest

# MongoDB will be available at mongodb://localhost:27017/kyc
```

### Once MongoDB is Running:

The backend will automatically connect and you can test the system:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

All customer registrations will be persisted to MongoDB with LLM-generated summaries.
