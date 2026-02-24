# Quick Test Script

## 🚀 Fast Testing Commands

### 1. Start Backend Server
```bash
cd backend
npm start
```
Keep this terminal open!

### 2. Test Health Check (New Terminal)
```bash
curl http://localhost:3000/health
```

### 3. Test Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"test123456\"}"
```

**Save the token from response!**

### 4. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123456\"}"
```

**Save the token!**

### 5. Create Vault (Replace YOUR_TOKEN)
```bash
curl -X POST http://localhost:3000/api/vaults \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"name\":\"Test Vault\",\"course_name\":\"Test Course\"}"
```

**Save the vault ID!**

### 6. Upload PDF (Replace YOUR_TOKEN and VAULT_ID)
```bash
curl -X POST http://localhost:3000/api/uploads/vaults/VAULT_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/document.pdf"
```

### 7. Check Document Status (Replace YOUR_TOKEN and DOCUMENT_ID)
```bash
curl -X GET http://localhost:3000/api/uploads/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Wait for `processing_status` to be `"completed"` (may take 30-60 seconds)

### 8. Test Chat/RAG (Replace YOUR_TOKEN and VAULT_ID)
```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"vaultId\":\"VAULT_ID\",\"message\":\"What is this document about?\"}"
```

---

## 🌐 Frontend Testing

1. **Open Frontend**
   - Open `Web/index.html` in browser
   - Or: `python -m http.server 8000` then go to `http://localhost:8000`

2. **Sign Up**
   - Go to signup page
   - Create account
   - Complete persona quiz

3. **Create Vault**
   - Dashboard → Create Vault

4. **Upload Document**
   - Open vault → Add Documents
   - Select PDF → Wait for processing

5. **Chat**
   - Type question → Submit
   - Verify AI response with sources

---

## ✅ Quick Verification

Check these in Supabase Dashboard:
- Users table → Your test user exists
- Vaults table → Vault created
- Documents table → Document uploaded
- Document_chunks table → Has chunks (after processing)
- Conversations table → Conversation created
- Messages table → Messages stored

---

## 🐛 If Something Fails

1. **Check Backend Logs** - Look at terminal where `npm start` is running
2. **Check Browser Console** - F12 → Console tab
3. **Check Network Tab** - F12 → Network → See API requests
4. **Verify .env** - Check all variables are set
5. **Check Database** - Verify schema is deployed in Supabase

