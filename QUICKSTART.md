# Quick Start Guide

## Step 1: Install MongoDB ⚙️

Choose ONE option:

### Option A: Windows Installer (Recommended)
```powershell
# 1. Download from: https://www.mongodb.com/try/download/community
# 2. Run the MSI installer
# 3. Choose "Install MongoDB as a Windows Service"
# 4. Create data directory
mkdir C:\data\db

# 5. Start MongoDB (or it starts automatically as a service)
mongod --dbpath "C:\data\db"
```

### Option B: Docker (Easiest)
```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option C: Cloud (MongoDB Atlas)
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Update `server/.env` with connection string

---

## Step 2: Configure LLM (Optional) 🤖

Edit `server/.env`:

### A. Hugging Face (Recommended for beginners)
```bash
SUMMARY_PROVIDER=hf
HF_API_KEY=hf_YOUR_API_KEY_HERE
```

Get free API key: https://huggingface.co/settings/tokens

### B. Ollama (Recommended for privacy)
```bash
SUMMARY_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
```

Install from: https://ollama.ai

### C. Use Fallback (No API needed)
Just leave it as is - system will generate simple summaries

---

## Step 3: Start Services 🚀

### Terminal 1: Start MongoDB
```powershell
# If using option A or B above, MongoDB should already be running
# To verify:
mongod --version
```

### Terminal 2: Start Backend
```powershell
cd c:\Users\ASUS\Documents\KYC\server
npm start
```

You should see:
```
🔧 Booting server...
✅ MongoDB connected
🚀 API http://localhost:5000
```

### Terminal 3: Start Frontend
```powershell
cd c:\Users\ASUS\Documents\KYC
npm run dev
```

You should see:
```
VITE v7.2.2  ready in 123 ms

➜  Local:   http://localhost:5173/
```

---

## Step 4: Test It! 🧪

1. Open http://localhost:5173 in your browser
2. Fill in the registration form:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - (Fill optional fields if you want)
3. Click "✅ Submit Registration"
4. Verify:
   - ✅ Form clears
   - ✅ Counter updates (e.g., "Available: 999 / 1000")
   - ✅ Success message shows with count
   - ✅ No error in console

---

## What's Working Now ✅

- Customer registration form with validation
- Real-time registration counter (1000 limit)
- LLM-generated customer summaries
- MongoDB persistence
- Full-stack API integration
- Responsive mobile design

---

## What's Not Yet Implemented ⏳

- Admin dashboard
- Authentication / JWT
- Edit/delete customers
- Email notifications
- PDF generation

---

## Troubleshooting 🔧

**Problem**: "MongoDB connection refused"
```
→ Make sure MongoDB is running (see Step 1)
→ Check mongod.exe is running in Task Manager
```

**Problem**: "Cannot connect to Ollama"
```
→ Ollama must be running: ollama serve
→ Or set SUMMARY_PROVIDER=hf instead
```

**Problem**: "HF API key invalid"
```
→ Get new key from: https://huggingface.co/settings/tokens
→ Update server/.env
```

**Problem**: Backend won't start after MongoDB crashes
```
→ Kill any stuck mongod processes
→ Delete C:\data\db (optional)
→ Restart MongoDB: mongod --dbpath "C:\data\db"
```

---

## Need Help? 💬

- Check `IMPLEMENTATION_SUMMARY.md` for detailed docs
- Check `MONGODB_SETUP.md` for database setup
- Open browser console (F12) for frontend errors
- Check terminal for backend errors

---

**You're all set! Start with Step 1 and follow through. It should take ~5 minutes.** ⏱️
