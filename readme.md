# Pal2 – AI-Powered FAQ Chatbot

**Pal2** is an AI assistant that reads and understands FAQ documents (PDF, HTML, TXT). It answers user questions based on your company's data, remembers conversations, and can search the web when it doesn't know the answer. Ideal for customer support, onboarding, or product help desks.al – AI-Powered FAQ Chatbot

**Pal** is an AI assistant that reads and understands FAQ documents (PDF or HTML). It answers user questions based on your company’s data, remembers conversations, and can search the web when it doesn’t know the answer. Ideal for customer support, onboarding, or product help desks.

---

## 💡 Key Features

- Load and parse FAQ from PDF, HTML, and TXT files
- Answer questions using AI + semantic vector search
- Store and recall chat sessions using SQLite database
- Search the web for answers if local data is insufficient
- REST API backend with Express.js
- React frontend with TypeScript
- Support for OpenAI GPT and Google Gemini models
- Secure file upload and processing
- Rate limiting and CORS protection

---

## 🧱 Tech Stack

- **Language**: JavaScript/TypeScript
- **Backend**: Node.js with Express
- **Frontend**: React with TypeScript
- **LLM**: OpenAI GPT or Google Gemini via API
- **Embeddings**: OpenAI Embeddings or Google Gemini
- **Vector DB**: In-memory vector store
- **Search fallback**: SerpAPI or Bing Search API
- **Storage**: SQLite with better-sqlite3
- **UI**: Tailwind CSS with Heroicons

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- OpenAI API key OR Google Gemini API key
- (Optional) SerpAPI key for web search

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd Pal2
   ```

2. **Backend Setup**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env file with your API keys
   npm start
   ```

3. **Frontend Setup** (in a new terminal)

   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Open your browser** to `http://localhost:3000`

### Quick Start (Windows)

- Double-click `start-pal.bat` for automated setup

---

## 📁 Folder Structure

```
Pal/
├── README.md
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        # Database configuration
│   │   │   └── environment.js     # Environment variables
│   │   ├── controllers/
│   │   │   ├── chatController.js  # Chat endpoints
│   │   │   └── documentController.js # Document endpoints
│   │   ├── middleware/
│   │   │   ├── cors.js           # CORS configuration
│   │   │   └── errorHandler.js   # Error handling
│   │   ├── models/
│   │   │   ├── Document.js       # Document model
│   │   │   └── ChatSession.js    # Chat session model
│   │   ├── routes/
│   │   │   ├── chat.js          # Chat routes
│   │   │   └── documents.js     # Document routes
│   │   ├── services/
│   │   │   ├── documentProcessor.js  # PDF/HTML parsing
│   │   │   ├── vectorStore.js        # Vector embeddings
│   │   │   ├── llmService.js         # AI response generation
│   │   │   └── searchService.js      # Web search fallback
│   │   └── utils/
│   │       ├── fileUpload.js     # File handling
│   │       └── logger.js         # Logging utility
│   ├── data/                     # SQLite DB & file storage
│   ├── uploads/                  # Temporary file uploads
│   ├── server.js                 # Express application
│   ├── package.json             # Node.js dependencies
│   ├── .env.example             # Environment variables template
│   ├── start.bat                # Windows startup script
│   └── start.sh                 # Unix startup script
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatPage.tsx      # Main chat interface
│   │   │   ├── DocumentsPage.tsx # Document management
│   │   │   └── SessionsPage.tsx  # Chat history
│   │   ├── services/
│   │   │   └── api.ts           # API client
│   │   ├── App.tsx              # Main React component
│   │   └── index.tsx            # React entry point
│   ├── package.json
│   ├── tailwind.config.js       # Tailwind CSS config
│   └── .env                     # Frontend environment variables
```

---

## 🚀 Quick Start

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **For Windows users, run:**

   ```cmd
   start.bat
   ```

3. **For Unix/Linux/Mac users, run:**

   ```bash
   chmod +x start.sh
   ./start.sh
   ```

4. **Manual setup (alternative):**

   ```bash
   # Install dependencies
   npm install

   # Copy environment file and configure
   copy .env.example .env
   # Edit .env with your API keys

   # Start server
   npm start
   ```

The backend will start on `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**

   ```bash
   cd frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

The frontend will start on `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

```env
# AI Service API Keys (at least one recommended)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
SERPAPI_KEY=your_serpapi_key_here
BING_SEARCH_KEY=your_bing_search_key_here

# Database Configuration
DATABASE_PATH=./data/pal.db

# Vector Database
VECTOR_STORE_TYPE=memory
EMBEDDINGS_PROVIDER=openai

# LLM Configuration
LLM_PROVIDER=openai  # or gemini
OPENAI_MODEL=gpt-3.5-turbo
GEMINI_MODEL=gemini-pro

# Server Configuration
PORT=8000
NODE_ENV=development

# CORS (Frontend URL)
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./uploads
```

---

## 📋 Usage

1. **Upload Documents**: Go to the Documents page and upload PDF, HTML, or TXT files containing your FAQ content.

2. **Start Chatting**: Use the Chat page to ask questions. Pal will search your uploaded documents first, then fall back to web search if needed.

3. **View History**: Check the Sessions page to review past conversations.

---

## 🔧 API Endpoints

### Documents

- `POST /api/v1/documents/upload` - Upload a document
- `GET /api/v1/documents` - List all documents
- `DELETE /api/v1/documents/{id}` - Delete a document

### Chat

- `POST /api/v1/chat` - Ask a question
- `GET /api/v1/chat/sessions` - List chat sessions
- `GET /api/v1/chat/sessions/{session_id}` - Get session details
- `DELETE /api/v1/chat/sessions/{session_id}` - Delete a session

### Health

- `GET /` - Welcome message
- `GET /health` - Health check

---

## 🧪 Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Adding New Features

1. **Backend**: Add new endpoints in `src/routes/`
2. **Frontend**: Create new components in `src/components/`
3. **Database**: Modify models in `src/models/`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Troubleshooting

### Common Issues

1. **Backend won't start**: Check if Node.js 16+ is installed and all dependencies are properly installed
2. **Frontend errors**: Try `npm install` and ensure Node.js 14+ is installed
3. **Can't upload documents**: Check file types (PDF, HTML, TXT only) and file size limits
4. **No AI responses**: Verify API keys in `.env` file

### Getting Help

- Check the console logs for detailed error messages
- Ensure both backend (port 8000) and frontend (port 3000) are running
- Verify CORS settings if experiencing connection issues
