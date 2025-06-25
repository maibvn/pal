# Pal Setup Guide

## Quick Start for Windows

1. **Double-click `start-pal.bat`** in the project root

   - This will automatically set up and start both backend and frontend
   - Two command windows will open (one for backend, one for frontend)
   - Wait for both services to start

2. **Open your browser** and go to `http://localhost:3000`

3. **Configure API keys** (optional but recommended):
   - Edit `backend\.env` file
   - Add your OpenAI API key: `OPENAI_API_KEY=your_key_here`
   - Add other API keys as needed

## Manual Setup

### Prerequisites

- **Node.js 16+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js)

### Backend Setup

```cmd
cd backend
npm install
copy .env.example .env
REM Edit .env file with your API keys
npm start
```

### Frontend Setup

```cmd
cd frontend
npm install
npm start
```

## Configuration

### Backend Environment Variables

Edit `backend\.env`:

```env
# Required for AI features
OPENAI_API_KEY=your_openai_api_key_here

# Optional but recommended for web search
SERPAPI_KEY=your_serpapi_key_here

# Server settings (defaults are fine for development)
PORT=8000
NODE_ENV=development
```

### Frontend Environment Variables

Edit `frontend\.env` (usually no changes needed):

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_NAME=Pal
```

## Usage

1. **Upload Documents**: Go to Documents page, upload PDF/HTML/TXT files
2. **Start Chatting**: Use the Chat page to ask questions about your documents
3. **View History**: Check Sessions page for conversation history

## Troubleshooting

### Backend won't start

- Check if Node.js is installed: `node --version`
- Install dependencies: `cd backend && npm install`
- Check console for error messages

### Frontend won't start

- Check if Node.js is installed: `node --version`
- Install dependencies: `cd frontend && npm install`
- Clear npm cache: `npm cache clean --force`

### Can't access the app

- Make sure both backend (port 8000) and frontend (port 3000) are running
- Check if ports are already in use
- Try restarting both services

### No AI responses

- Add your OpenAI API key to `backend\.env`
- Restart the backend server
- Check backend console for API errors

## Features

✅ **Document Upload & Processing**

- PDF, HTML, TXT, DOC, DOCX support
- Automatic text extraction and chunking
- Vector embeddings for semantic search

✅ **AI Chat Interface**

- Context-aware responses
- Conversation history
- Web search fallback

✅ **Session Management**

- Save and load conversations
- Edit session titles
- Delete old sessions

✅ **Modern UI**

- Responsive design
- Dark/light themes
- Mobile-friendly

## API Keys Setup

### OpenAI (Recommended)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and get API key
3. Add to `backend\.env`: `OPENAI_API_KEY=your_key_here`

### SerpAPI (Optional - for web search)

1. Go to [serpapi.com](https://serpapi.com)
2. Sign up for free account
3. Add to `backend\.env`: `SERPAPI_KEY=your_key_here`

## Development

### Adding New Features

1. **Backend**: Add routes in `backend\src\routes\`
2. **Frontend**: Add components in `frontend\src\components\`
3. **Database**: Modify models in `backend\src\config\database.js`

### Project Structure

```
Pal/
├── backend/           # Node.js + Express API
├── frontend/          # React TypeScript app
├── start-pal.bat     # Windows startup script
├── start-pal.sh      # Unix/Linux startup script
└── README.md         # This file
```

## Support

If you need help:

1. Check the console logs for error messages
2. Make sure all dependencies are installed
3. Verify API keys are correctly configured
4. Restart both backend and frontend services
