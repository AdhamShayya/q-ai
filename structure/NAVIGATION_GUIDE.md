# Q-Ai Navigation Guide

## 🧭 User Flow After Login

### Authentication Flow

1. **Login/Signup** → User authenticates
2. **Redirect** → After login: **Dashboard** | After signup: **Persona Quiz** → **Dashboard**
3. **Navbar Updates** → Shows user menu with avatar and name

---

## 📍 Page Structure & Navigation

### Public Pages (Before Login)
- **Home** (`index.html`) - Landing page
- **Features** (`components/features.html`) - Feature showcase
- **About** (`components/about.html`) - About page
- **Contact** (`components/contact.html`) - Contact page
- **Login** (`components/login.html`) - Sign in
- **Signup** (`components/signup.html`) - Create account

### Protected Pages (After Login)
- **Dashboard** (`pages/dashboard.html`) - Main hub, vault management
- **Persona Quiz** (`pages/persona-quiz.html`) - Learning style assessment
- **Vault** (`pages/vault.html`) - Individual vault view with documents and chat
- **Chat** (`pages/chat.html`) - General chat interface
- **Settings** (`pages/settings.html`) - Account settings and subscription

---

## 🎯 Navigation Paths

### After Login Success
1. User logs in → Redirects to **Dashboard**
2. User signs up → Redirects to **Persona Quiz** → After quiz → **Dashboard**

### Dashboard Features
- View all your vaults
- Create new vaults
- Click on vault card → Opens **Vault page**

### Vault Page Features
- View documents in the vault
- Chat with AI about vault content
- Add new documents
- Back to dashboard

### Settings Page Features
- Update profile (name, email)
- View/update learning preferences
- Manage subscription
- Account management

---

## 👤 User Menu (Navbar)

After login, the navbar shows:
- **User Avatar** (initials circle)
- **User Name** (desktop only)
- **Dropdown Menu** with:
  - Dashboard
  - Settings
  - Sign Out

### Accessing Your Account

**Method 1: Navbar User Menu**
- Click on your avatar/name in navbar
- Select "Dashboard" or "Settings"

**Method 2: Direct Navigation**
- Type URL: `/pages/dashboard.html`
- Type URL: `/pages/settings.html`

**Method 3: Bookmark**
- After logging in, bookmark the dashboard page

---

## 🔄 Authentication-Aware Navigation

The navbar automatically:
- ✅ Shows "Sign In" / "Get Started" when logged out
- ✅ Shows user menu (avatar + dropdown) when logged in
- ✅ Adds "Dashboard" link to navigation when logged in
- ✅ Updates when auth state changes
- ✅ Handles logout with redirect to home

---

## 📱 Responsive Navigation

- **Desktop**: Full navigation with user name visible
- **Mobile**: User avatar only, menu icon for mobile menu (if implemented)

---

## 🚀 Quick Access Guide

### I want to...
- **See my vaults** → Dashboard (`pages/dashboard.html`)
- **Change my settings** → Settings (`pages/settings.html`)
- **Update learning style** → Settings → Retake Quiz, or Persona Quiz
- **Sign out** → Click avatar → Sign Out
- **Go back to home** → Click logo in navbar
- **Create a new vault** → Dashboard → "Create New Vault" button
- **Chat with AI** → Open a vault → Use chat interface

---

## 🔐 Protected Routes

These pages check authentication and redirect to login if not authenticated:
- Dashboard
- Vault
- Chat
- Settings
- Persona Quiz

If you try to access them without logging in, you'll be redirected to the login page.

---

## 💡 Tips

1. **After Login**: You'll be taken to the Dashboard automatically
2. **User Menu**: Click your avatar in the navbar to access account options
3. **Dashboard is Your Hub**: All your vaults are here
4. **Settings**: Access account and preferences from navbar user menu
5. **Logout**: Available in user menu dropdown

---

## 🎨 UI Updates Made

✅ Navbar now shows user menu when authenticated
✅ User avatar with initials
✅ Dropdown menu with Dashboard, Settings, Logout
✅ Automatic auth state detection
✅ Login redirects to Dashboard
✅ Signup redirects to Persona Quiz → Dashboard
✅ Dashboard link appears in nav when authenticated
✅ Logout functionality with redirect

