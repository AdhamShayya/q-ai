# Q-Ai Development To-Do List

Based on Description and Structure.txt requirements, this document outlines the files and directories needed to build the full functionality.

## Project Structure Overview

```
Q-Ai/
├── Web/                          # Current frontend (static)
│   ├── components/               # HTML components
│   ├── index.html
│   └── ...
├── backend/                      # NEW: Backend API (Node.js/Express or Next.js API routes)
├── database/                     # NEW: Database schema and migrations
├── ai-services/                  # NEW: AI/ML services (RAG, Gemini integration)
├── storage/                      # NEW: File storage handling (Supabase Storage)
└── docs/                         # NEW: API documentation
```

---

## Phase 1: Core Infrastructure Setup

### 1.1 Backend API Structure
- [ ] **backend/api/**
  - [ ] `auth.js` - Authentication endpoints (signup, login, logout)
  - [ ] `users.js` - User management endpoints
  - [ ] `vaults.js` - Knowledge Vault CRUD operations
  - [ ] `uploads.js` - File upload handling (PDF, video, documents)
  - [ ] `chat.js` - Chat/conversation endpoints
  - [ ] `persona.js` - Learning persona/profile endpoints
  - [ ] `subscriptions.js` - Premium subscription management

### 1.2 Database Schema
- [ ] **database/schema.sql**
  - [ ] Users table (id, email, name, password_hash, subscription_tier, created_at)
  - [ ] Learning_Personas table (id, user_id, learning_style, preferences_json)
  - [ ] Vaults table (id, user_id, name, course_name, created_at, updated_at)
  - [ ] Documents table (id, vault_id, filename, file_type, file_path, file_size, upload_date, processing_status)
  - [ ] Document_Chunks table (id, document_id, chunk_text, chunk_index, embeddings_vector)
  - [ ] Conversations table (id, user_id, vault_id, title, created_at, updated_at)
  - [ ] Messages table (id, conversation_id, role, content, created_at)
  - [ ] Subscriptions table (id, user_id, tier, start_date, end_date, status)

### 1.3 Configuration Files
- [ ] **config/**
  - [ ] `database.js` - Database connection (Supabase)
  - [ ] `storage.js` - File storage configuration (Supabase Storage)
  - [ ] `ai.js` - Gemini API configuration
  - [ ] `env.example` - Environment variables template

---

## Phase 2: AI Services & RAG Implementation

### 2.1 RAG System
- [ ] **ai-services/rag/**
  - [ ] `document-processor.js` - Process PDFs, extract text, chunk documents
  - [ ] `embeddings.js` - Generate embeddings using Gemini
  - [ ] `vector-store.js` - Vector database operations (Supabase Vector/PostgreSQL)
  - [ ] `retriever.js` - Retrieve relevant chunks based on query
  - [ ] `rag-pipeline.js` - Main RAG pipeline (retrieve + generate)

### 2.2 AI Integration
- [ ] **ai-services/gemini/**
  - [ ] `client.js` - Gemini API client wrapper
  - [ ] `prompt-builder.js` - Build system prompts based on learning persona
  - [ ] `response-generator.js` - Generate AI responses using RAG context

### 2.3 Video Processing
- [ ] **ai-services/video/**
  - [ ] `transcription.js` - Video to text transcription (Whisper API)
  - [ ] `video-processor.js` - Handle video uploads and processing

---

## Phase 3: Frontend Functionality

### 3.1 Authentication Pages
- [ ] **Web/components/** (already created, need functionality)
  - [ ] `login.html` - ✅ Created (needs JS integration)
  - [ ] `signup.html` - ✅ Created (needs JS integration)
  - [ ] `login.js` - Handle login form submission
  - [ ] `signup.js` - Handle signup form submission, validation

### 3.2 Core Application Pages
- [ ] **Web/pages/** (NEW directory)
  - [ ] `dashboard.html` - Main dashboard (Vault list, upload area)
  - [ ] `vault.html` - Individual vault view (documents, chat interface)
  - [ ] `chat.html` - Chat interface component
  - [ ] `persona-quiz.html` - Learning persona quiz (30-second assessment)
  - [ ] `settings.html` - User settings, subscription management

### 3.3 JavaScript Modules
- [ ] **Web/js/** (NEW directory)
  - [ ] `api.js` - API client (fetch wrapper for backend)
  - [ ] `auth.js` - Authentication state management
  - [ ] `vault.js` - Vault operations (create, list, delete)
  - [ ] `upload.js` - File upload handling with progress
  - [ ] `chat.js` - Chat functionality (send messages, receive responses)
  - [ ] `persona.js` - Learning persona management
  - [ ] `rag-chat.js` - RAG-powered chat integration
  - [ ] `voice-mode.js` - Voice Study mode (Web Speech API)
  - [ ] `subscription.js` - Subscription management

### 3.4 Components
- [ ] **Web/components/js/** (NEW directory)
  - [ ] `vault-card.js` - Vault card component (display, progress glow)
  - [ ] `document-list.js` - Document list component
  - [ ] `chat-message.js` - Chat message bubble component
  - [ ] `upload-dropzone.js` - Enhanced dropzone with file validation
  - [ ] `progress-bar.js` - Upload/processing progress component

---

## Phase 4: Key Features Implementation

### 4.1 Knowledge Vault System
- [ ] **Backend:**
  - [ ] Create vault endpoint
  - [ ] List user vaults (respect free tier limit: 2 vaults)
  - [ ] Delete vault endpoint
  - [ ] Vault document listing

- [ ] **Frontend:**
  - [ ] Vault creation UI
  - [ ] Vault list display with progress glow
  - [ ] Vault selection/navigation

### 4.2 File Upload System
- [ ] **Backend:**
  - [ ] File upload endpoint (handle PDF, DOCX, video)
  - [ ] File size validation (50MB free tier limit)
  - [ ] File storage (Supabase Storage)
  - [ ] Processing queue for document chunking

- [ ] **Frontend:**
  - [ ] Multi-file upload with drag & drop
  - [ ] Upload progress tracking
  - [ ] File validation (type, size)
  - [ ] Upload status display

### 4.3 Learning Persona Profile
- [ ] **Backend:**
  - [ ] Quiz submission endpoint
  - [ ] Persona preference storage
  - [ ] Persona retrieval for prompt building

- [ ] **Frontend:**
  - [ ] 30-second quiz UI (analogies, logic, visual)
  - [ ] Persona selection/editing
  - [ ] Integration with chat prompts

### 4.4 RAG-Powered Chat
- [ ] **Backend:**
  - [ ] Chat endpoint (receive query, retrieve context, generate response)
  - [ ] Conversation history storage
  - [ ] Context window management

- [ ] **Frontend:**
  - [ ] Chat interface (message bubbles, input)
  - [ ] Typewriter effect for AI responses
  - [ ] Conversation history display
  - [ ] Loading states

### 4.5 Voice Study Mode
- [ ] **Backend:**
  - [ ] Voice input endpoint (receive audio, transcribe, process)
  - [ ] Audio transcription (Web Speech API or backend)

- [ ] **Frontend:**
  - [ ] Voice recording UI
  - [ ] Audio playback
  - [ ] Voice-to-text integration
  - [ ] Mobile optimization

---

## Phase 5: Premium Features

### 5.1 Subscription System
- [ ] **Backend:**
  - [ ] Subscription tier management
  - [ ] Payment processing integration (Stripe/PayPal)
  - [ ] Feature gating logic

- [ ] **Frontend:**
  - [ ] Subscription page
  - [ ] Upgrade prompts
  - [ ] Feature badges (Premium only)

### 5.2 Premium Features Implementation
- [ ] **Video Processing:**
  - [ ] Video upload (premium only)
  - [ ] Video transcription
  - [ ] Video-to-text search

- [ ] **Unlimited Vaults:**
  - [ ] Vault limit checking (2 for free, unlimited for premium)
  - [ ] Upgrade prompts when limit reached

- [ ] **Exam Predictor:**
  - [ ] `exam-predictor.js` - Generate practice tests from vault content
  - [ ] Exam generation UI
  - [ ] Question/answer display

---

## Phase 6: Utilities & Helpers

### 6.1 Utility Functions
- [ ] **Web/js/utils/**
  - [ ] `format.js` - Date/time formatting
  - [ ] `validation.js` - Form validation helpers
  - [ ] `storage.js` - Local storage helpers (tokens, preferences)
  - [ ] `errors.js` - Error handling utilities

### 6.2 Constants
- [ ] **Web/js/constants.js**
  - [ ] API endpoints
  - [ ] File size limits
  - [ ] Subscription tiers
  - [ ] Feature flags

---

## Phase 7: Testing & Documentation

### 7.1 Testing
- [ ] **tests/** (NEW directory)
  - [ ] `api.test.js` - API endpoint tests
  - [ ] `rag.test.js` - RAG pipeline tests
  - [ ] `integration.test.js` - Integration tests

### 7.2 Documentation
- [ ] **docs/** (NEW directory)
  - [ ] `API.md` - API documentation
  - [ ] `SETUP.md` - Development setup guide
  - [ ] `DEPLOYMENT.md` - Deployment instructions

---

## Priority Order (MVP First)

### MVP Features (Must Have):
1. ✅ Authentication (Login/Signup)
2. ✅ Database schema setup
3. ✅ Basic vault creation/listing
4. ✅ PDF upload and processing
5. ✅ RAG implementation (basic)
6. ✅ Chat interface with RAG
7. ✅ Learning persona quiz

### Phase 2 (Important):
8. Document chunking and embeddings
9. Vector store integration
10. Conversation history
11. File upload limits (50MB free tier)

### Phase 3 (Premium Features):
12. Video processing
13. Voice Study mode
14. Subscription system
15. Exam Predictor
16. Unlimited vaults for premium

---

## Technology Stack Reminders

- **Frontend:** HTML, CSS, JavaScript (current static files)
- **Backend:** Node.js/Express OR Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **AI:** Google Gemini 1.5 Pro/Flash
- **Vector DB:** Supabase Vector (PostgreSQL pgvector) OR separate vector DB
- **Transcription:** OpenAI Whisper API (for video)
- **Payments:** Stripe or PayPal (for subscriptions)

---

## Next Steps

1. Set up backend API structure (Phase 1)
2. Create database schema and migrations (Phase 1)
3. Implement authentication (Phase 3.1)
4. Build basic vault system (Phase 4.1)
5. Implement file upload (Phase 4.2)
6. Set up RAG pipeline (Phase 2)
7. Build chat interface (Phase 4.4)

