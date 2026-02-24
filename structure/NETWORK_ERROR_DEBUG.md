# Network Error Debugging Guide

## Issue
Frontend shows "Network error. Please check your connection" even though internet connection is fine.

## Common Causes

### 1. Backend Server Not Running
The frontend is trying to connect to `http://localhost:3000` but the backend server isn't running.

**Solution:**
```powershell
cd backend
npm start
```

### 2. Backend Server Crashed
The server might have stopped due to an error.

**Check:**
- Look at the terminal where `npm start` was running
- Check for error messages
- Restart the server

### 3. Wrong API URL
The frontend might be configured with the wrong API URL.

**Check:** `Web/js/constants.js`
- Should be: `API_BASE_URL: 'http://localhost:3000/api'`

### 4. CORS Issues
Browser might be blocking the request due to CORS.

**Check backend/server.js:**
- Should have CORS configured for the frontend origin

### 5. Firewall/Antivirus
Firewall or antivirus might be blocking localhost connections.

## Quick Checks

1. **Is backend running?**
   ```powershell
   # Check if port 3000 is open
   Test-NetConnection -ComputerName localhost -Port 3000
   ```

2. **Can you access the health endpoint?**
   Open browser: `http://localhost:3000/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

3. **Check browser console (F12)**
   - Look for the actual error message
   - Check Network tab to see the failed request
   - Look for CORS errors

4. **Check backend console**
   - Look for error messages
   - Check if server started successfully

## Steps to Fix

1. **Start the backend server:**
   ```powershell
   cd backend
   npm start
   ```

2. **Verify it's running:**
   - Open `http://localhost:3000/health` in browser
   - Should see: `{"status":"ok"}`

3. **Try signup again**

4. **If still failing:**
   - Check browser console (F12) for specific error
   - Check Network tab to see request details
   - Check backend console for errors

## Browser Console Check

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Go to Network tab
5. Try signup again
6. Find the `/api/auth/signup` request
7. Click on it and check:
   - Status code
   - Response
   - Error message

