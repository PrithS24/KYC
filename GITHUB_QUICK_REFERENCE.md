# 🚀 GitHub Push - Quick Reference Card

## 📋 Pre-requisites Checklist

- [ ] Git installed on Windows: https://git-scm.com/download/win
- [ ] GitHub account created: https://github.com/signup
- [ ] GitHub repository created: https://github.com/new
- [ ] Repository URL copied (e.g., `https://github.com/YourUsername/KYC.git`)

---

## 🎯 Quick Start (5 Commands)

```powershell
# 1. Go to your project folder
cd c:\Users\ASUS\Documents\KYC

# 2. Initialize git
git init

# 3. Add your GitHub repository URL (replace with yours!)
git remote add origin https://github.com/PrithS24/KYC.git

# 4. Stage and commit all files
git add .
git commit -m "Initial commit: Full-stack KYC system with React, Express, MongoDB Atlas"

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

When prompted for credentials:
- **Username**: `PrithS24`
- **Password**: Use Personal Access Token (get from https://github.com/settings/tokens)

---

## ✅ That's it!

Your code is now on GitHub! 🎉

Visit: `https://github.com/PrithS24/KYC`

---

## 📝 Future Pushes

After the first push, updating is simple:

```powershell
git add .
git commit -m "Your change description"
git push
```

---

## 🆘 Need Help?

See **GITHUB_SETUP.md** in your project for detailed instructions.

---

## 🔐 Security Note

⚠️ **NEVER push these files** (protected by .gitignore):
- `server/.env` (contains MongoDB credentials)
- `node_modules/` (too large, re-installed from package.json)
- Any other credentials or secrets

✅ **Safe to push**:
- All source code
- Configuration examples
- Documentation
- package.json (dependencies list)

---

**All set? Run the 5 commands above!** 🚀
