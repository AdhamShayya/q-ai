# Q-Ai Testing Guide

## 🚀 Quick Start Testing

### Prerequisites Check

1. **Backend Server Running**
   ```bash
   cd backend
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

2. **Environment Variables Set**
   Verify `backend/.env` has:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   PORT=3000
   ```

3. **Database Schema Deployed**
   - Run `database/schema.sql` in Supabase SQL Editor
   - Verify all tables are created
   - Verify pgvector extension is enabled

---

## 📋 Testing Checklist

### Phase 1: Backend API Testing

#### 1. Health Check
```bash
# Using curl
curl http://localhost:3000/health

# Using browser
# Open: http://localhost:3000/health

# Expected: {"status":"ok","service":"Q-Ai API","timestamp":"..."}
```

#### 2. Sign Up (Create Account)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# Expected: {"success":true,"user":{...},"token":"..."}
```

**Or use Postman/Thunder Client:**
- Method: POST
- URL: `http://localhost:3000/api/auth/signup`
- Headers: `Content-Type: application/json`
- Body:
  ```json
  {
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123"
  }
  ```

#### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'

# Expected: {"success":true,"user":{...},"token":"..."}
# Save the token for next requests!
```

#### 4. Create Vault
```bash
# Replace YOUR_TOKEN with the token from login
curl -X POST http://localhost:3000/api/vaults \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Vault",
    "course_name": "Test Course"
  }'

# Expected: {"success":true,"vault":{...}}
# Save the vault ID!
```

#### 5. Upload Document (PDF)
```bash
# Replace YOUR_TOKEN and VAULT_ID
curl -X POST http://localhost:3000/api/uploads/vaults/VAULT_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/your/test.pdf"

# Expected: {"success":true,"document":{...}}
# Document will be processed asynchronously
```

#### 6. Check Document Processing Status
```bash
# Replace YOUR_TOKEN and DOCUMENT_ID
curl -X GET http://localhost:3000/api/uploads/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check processing_status: "pending" -> "processing" -> "completed"
```

#### 7. Save Learning Persona
```bash
curl -X POST http://localhost:3000/api/persona \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "learning_style": "analogies",
    "problem_solving": "guided",
    "review_style": "summaries"
  }'
```

#### 8. Send Chat Message (Test RAG)
```bash
# Replace YOUR_TOKEN and VAULT_ID
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "vaultId": "VAULT_ID",
    "message": "What is the main topic of the document?"
  }'

# Expected: {"success":true,"response":"...","sources":[...]}
```

---

### Phase 2: Frontend Testing

#### 1. Open Frontend
- Open `Web/index.html` in browser
- Or serve with a local server:
  ```bash
  # Using Python
  cd Web
  python -m http.server 8000
  
  # Using Node.js (http-server)
  npx http-server Web -p 8000
  ```
- Navigate to: `http://localhost:8000`

#### 2. Test Sign Up Flow
1. Click "Get Started" or go to `components/signup.html`
2. Fill in name, email, password
3. Submit form
4. Should redirect to `pages/persona-quiz.html`

#### 3. Test Persona Quiz
1. Complete the learning style quiz
2. Submit
3. Should redirect to `pages/dashboard.html`

#### 4. Test Dashboard
1. Should see empty state or vaults list
2. Click "Create New Vault"
3. Enter vault name and course name
4. Vault should appear in list

#### 5. Test Document Upload
1. Click on a vault to open it
2. Click "Add Documents"
3. Select a PDF file
4. File should upload and show processing status
5. Wait for status to change to "completed"

#### 6. Test Chat (RAG)
1. In vault page, type a question in the chat
2. Submit message
3. Should receive AI response based on uploaded document
4. Response should cite sources

---

## 🔍 Troubleshooting

### Backend Issues

#### Server Won't Start
**Error:** `Cannot find module '@supabase/supabase-js'`
```bash
cd backend
npm install
```

**Error:** `GEMINI_API_KEY is not set`
- Check `backend/.env` file exists
- Verify `GEMINI_API_KEY=your_key` is set

**Error:** `Port 3000 already in use`
```bash
# Change port in backend/.env
PORT=3001
```

#### Authentication Fails
**Error:** `401 Unauthorized`
- Check JWT token is valid
- Verify token is in Authorization header: `Bearer YOUR_TOKEN`
- Token might be expired, try logging in again

**Error:** `Database connection failed`
- Verify Supabase credentials in `.env`
- Check Supabase project is active
- Verify database schema is deployed

#### Document Processing Fails
**Error:** `Processing status stuck at "processing"`
- Check backend console for errors
- Verify Gemini API key is valid
- Check document is valid PDF
- Verify database has `document_chunks` table

**Error:** `pdf-parse error`
- Verify `pdf-parse` is installed: `npm install pdf-parse`
- Check PDF file is not corrupted
- Try a different PDF file

#### RAG Chat Not Working
**Error:** `No relevant context found`
- Verify document processing completed
- Check `document_chunks` table has data
- Verify embeddings were generated
- Check vault ID is correct

**Error:** `Gemini API error`
- Verify Gemini API key is valid
- Check API quota/limits
- Verify API key has correct permissions

### Frontend Issues

#### CORS Error
**Error:** `Access to fetch blocked by CORS policy`
- Verify backend CORS settings in `backend/server.js`
- Add frontend URL to CORS origins
- Check backend server is running

#### API Connection Failed
**Error:** `Network error` or `Failed to fetch`
- Verify backend server is running
- Check API URL in `Web/js/constants.js`
- Try accessing `http://localhost:3000/health` directly

#### Pages Not Loading
- Check browser console for errors
- Verify all script files are loaded
- Check file paths are correct
- Try hard refresh (Ctrl+Shift+R)

---

## 🧪 Manual Testing Steps

### Complete End-to-End Test

1. **Start Backend**
   ```bash
   cd backend
   npm start
   ```

2. **Open Frontend**
   - Open `Web/index.html` in browser
   - Or serve with HTTP server

3. **Sign Up**
   - Go to signup page
   - Create account
   - Complete persona quiz

4. **Create Vault**
   - Dashboard → Create New Vault
   - Name: "Quantum Mechanics"
   - Course: "Physics 101"

5. **Upload Document**
   - Open vault
   - Upload a PDF (e.g., lecture notes, textbook chapter)
   - Wait for processing (check status)

6. **Test Chat**
   - Type question: "What is the main topic?"
   - Submit
   - Verify response mentions content from PDF
   - Check sources are displayed

7. **Test Multiple Questions**
   - Ask follow-up questions
   - Verify context is maintained
   - Test different question types

---

## 📊 Verification Points

### Backend Verification
- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Signup creates user in database
- [ ] Login returns valid JWT token
- [ ] Vault creation works
- [ ] Document upload succeeds
- [ ] Document processing completes
- [ ] Chat returns responses with sources

### Database Verification
Check Supabase dashboard:
- [ ] `users` table has your test user
- [ ] `vaults` table has created vault
- [ ] `documents` table has uploaded document
- [ ] `document_chunks` table has chunks with embeddings
- [ ] `learning_personas` table has persona data
- [ ] `conversations` and `messages` tables have chat data

### Frontend Verification
- [ ] All pages load without errors
- [ ] Navigation works
- [ ] Forms submit successfully
- [ ] Vaults display correctly
- [ ] Documents show processing status
- [ ] Chat interface works
- [ ] Responses display correctly

---

## 🛠️ Testing Tools

### Recommended Tools
1. **Postman** - API testing (https://www.postman.com/)
2. **Thunder Client** - VS Code extension for API testing
3. **Browser DevTools** - Console and Network tabs
4. **Supabase Dashboard** - Database inspection

### Useful Commands
```bash
# Check if server is running
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# View backend logs
# Check terminal where npm start is running
```

---

## 🎯 Success Criteria

Your platform is working correctly if:

✅ **Authentication**
- Users can sign up and log in
- JWT tokens are generated and validated
- Protected routes require authentication

✅ **Vault Management**
- Users can create vaults
- Vault limits are enforced (2 for free tier)
- Vaults are associated with users

✅ **Document Processing**
- PDFs can be uploaded
- Documents are processed (chunked, embedded)
- Processing status updates correctly
- Chunks are stored in database

✅ **RAG Chat**
- Questions retrieve relevant context
- Responses are generated with Gemini
- Responses cite sources from documents
- Learning persona affects response style

✅ **Data Integrity**
- All data is stored in Supabase
- Relationships between tables work
- User data is isolated (RLS policies)

---

## 📝 Test Data

### Sample PDF
For testing, you can use:
- Any textbook chapter PDF
- Lecture notes PDF
- Research paper PDF
- Sample document from internet

### Sample Questions to Test
1. "What is the main topic of this document?"
2. "Summarize the key points"
3. "Explain [specific concept] from the document"
4. "What does the document say about [topic]?"

---

## 🚨 Common Errors & Solutions

| Error | Solution |
|-------|----------|
| `Module not found` | Run `npm install` in backend directory |
| `CORS error` | Check backend CORS configuration |
| `401 Unauthorized` | Verify JWT token is valid and included |
| `Document processing failed` | Check Gemini API key, PDF validity |
| `No chunks found` | Verify document processing completed |
| `Database connection failed` | Check Supabase credentials |

---

## 📞 Next Steps After Testing

If everything works:
1. ✅ Test with multiple users
2. ✅ Test with different file types
3. ✅ Test edge cases (large files, empty documents)
4. ✅ Test subscription tier limits
5. ✅ Deploy to production

If issues found:
1. Check error logs
2. Verify environment variables
3. Check database schema
4. Test API endpoints individually
5. Review implementation code

---

Good luck with testing! 🎉

