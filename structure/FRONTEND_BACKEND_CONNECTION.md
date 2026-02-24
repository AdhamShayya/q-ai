# Frontend-Backend Connection Guide

## ✅ What Has Been Connected

### 1. Authentication Pages
- **login.html** → Connected to backend API
- **signup.html** → Connected to backend API
- Added error message displays
- Added JavaScript module loading
- Integrated with authManager and apiClient

### 2. API Configuration
- **constants.js** → Updated API_BASE_URL to use localhost:3000 in development
- **api.js** → Ready to connect to backend (already configured)

### 3. Authentication Flow
- Login form submits to `/api/auth/login`
- Signup form submits to `/api/auth/signup`
- JWT tokens are stored in localStorage
- User data is stored in localStorage
- Automatic redirect after successful auth

## 📋 Script Loading Order

The following scripts are now loaded in the correct order:

```html
<!-- In login.html and signup.html -->
<script src="../js/constants.js"></script>      <!-- Configuration -->
<script src="../js/utils/storage.js"></script>  <!-- Storage utilities -->
<script src="../js/utils/errors.js"></script>   <!-- Error handling -->
<script src="../js/api.js"></script>            <!-- API client -->
<script src="../js/auth.js"></script>           <!-- Auth manager -->
<script src="login.js"></script>                <!-- Page-specific logic -->
```

## 🔧 How It Works

### Login Flow
1. User fills in email and password
2. Form validates input
3. Calls `authManager.signIn()` or `apiClient.post('/auth/login')`
4. Backend validates credentials
5. Returns JWT token and user data
6. Token stored in localStorage
7. Redirects to dashboard

### Signup Flow
1. User fills in name, email, password, confirm password
2. Form validates input (email format, password match, terms)
3. Calls `authManager.signUp()` or `apiClient.post('/auth/signup')`
4. Backend creates user account
5. Returns JWT token and user data
6. Token stored in localStorage
7. Redirects to persona quiz

## 🚀 Testing the Connection

### Prerequisites
1. Backend server must be running on `http://localhost:3000`
2. Supabase must be configured (for backend to work)
3. Database schema must be deployed

### Test Steps

1. **Open login page:**
   ```
   Open: Web/components/login.html in browser
   ```

2. **Try to login:**
   - Enter email and password
   - Click "Sign In"
   - Check browser console for any errors
   - Check Network tab to see API request

3. **Test signup:**
   ```
   Open: Web/components/signup.html in browser
   ```
   - Fill in all fields
   - Click "Create Account"
   - Should redirect to persona-quiz.html on success

## 🔍 Debugging

### Check Browser Console
- Open Developer Tools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API requests

### Common Issues

1. **CORS Errors:**
   - Backend CORS is configured for localhost:3000 and localhost:5173
   - If using different port, update `backend/server.js` CORS settings

2. **API Connection Failed:**
   - Verify backend is running: `http://localhost:3000/health`
   - Check API_BASE_URL in constants.js
   - Check browser console for connection errors

3. **Authentication Not Working:**
   - Check if token is being stored: `localStorage.getItem('qai_auth_token')`
   - Verify backend is returning token in response
   - Check Network tab for API response

4. **Script Loading Errors:**
   - Verify all script paths are correct
   - Check browser console for "Cannot find module" errors
   - Ensure scripts are loaded in correct order

## 📝 Next Steps

### Still Need to Connect:
- [ ] Dashboard page → Load vaults from backend
- [ ] Vault creation → Connect to backend API
- [ ] File upload → Connect to backend upload endpoint
- [ ] Chat interface → Connect to backend chat API
- [ ] Persona quiz → Save results to backend
- [ ] Settings page → Load/update user data from backend

### Protected Routes
Pages that require authentication should check auth status:
- dashboard.html
- vault.html
- chat.html
- settings.html
- persona-quiz.html

Add this to protected pages:
```javascript
// At the top of the page script
if (typeof window.authManager !== 'undefined') {
    if (!window.authManager.getIsAuthenticated()) {
        window.location.href = '../components/login.html';
    }
}
```

## 🔐 Security Notes

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- Passwords are sent over HTTPS (ensure backend uses HTTPS in production)
- CORS is configured but should be restricted in production
- API keys should never be exposed in frontend code

## 📚 Related Files

- `Web/js/api.js` - API client implementation
- `Web/js/auth.js` - Authentication state management
- `Web/components/login.js` - Login page handler
- `Web/components/signup.js` - Signup page handler
- `backend/server.js` - Backend API server
- `backend/api/auth.js` - Authentication endpoints

