# Deployment Guide for Pal

This guide covers different deployment options for the Pal AI chatbot.

## Environment Variables

### Required

- `OPENAI_API_KEY` or `GEMINI_API_KEY` - At least one AI provider
- `LLM_PROVIDER` - Set to "openai" or "gemini"
- `EMBEDDINGS_PROVIDER` - Set to "openai" or "gemini"

### Optional

- `SERPAPI_KEY` - For web search functionality
- `PORT` - Backend server port (default: 8000)
- `NODE_ENV` - Set to "production" for deployment

## Local Development

1. Follow README.md setup instructions
2. Use `npm run dev` for auto-restart during development
3. Frontend runs on port 3000, backend on port 8000

## Production Deployment Options

### Option 1: Traditional VPS/Server

1. **Server Setup**

   ```bash
   # Install Node.js 16+
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Deploy Application**

   ```bash
   git clone <your-repo>
   cd Pal

   # Backend
   cd backend
   npm install --production
   cp .env.example .env
   # Edit .env with production values

   # Frontend
   cd ../frontend
   npm install
   npm run build
   ```

3. **Start with PM2**

   ```bash
   # Backend
   cd backend
   pm2 start server.js --name "pal-backend"

   # Serve frontend (optional - use nginx instead)
   cd ../frontend
   pm2 serve build 3000 --name "pal-frontend"

   pm2 startup
   pm2 save
   ```

### Option 2: Docker Deployment

Create `docker-compose.yml`:

```yaml
version: "3.8"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - ./backend/data:/app/data
      - ./backend/uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

### Option 3: Cloud Platforms

#### Vercel (Frontend) + Railway/Render (Backend)

**Frontend (Vercel):**

1. Connect GitHub repo to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set environment variables:
   - `REACT_APP_API_URL=https://your-backend-url.com`

**Backend (Railway/Render):**

1. Connect GitHub repo
2. Set start command: `cd backend && npm start`
3. Set environment variables (all .env values)

#### Heroku

```bash
# Backend
heroku create pal-backend
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=your_key
git subtree push --prefix backend heroku master

# Frontend
heroku create pal-frontend
heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git
heroku config:set REACT_APP_API_URL=https://pal-backend.herokuapp.com
git subtree push --prefix frontend heroku master
```

#### DigitalOcean App Platform

Create `app.yaml`:

```yaml
name: pal
services:
  - name: backend
    source_dir: backend
    github:
      repo: your-username/pal
      branch: main
    run_command: npm start
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    routes:
      - path: /api
    envs:
      - key: NODE_ENV
        value: production

  - name: frontend
    source_dir: frontend
    github:
      repo: your-username/pal
      branch: main
    build_command: npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
```

## Nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/pal/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Considerations

### SQLite (Default)

- Good for small to medium deployments
- Single file database
- Ensure data directory is persistent in containerized deployments

### PostgreSQL (Scalable Alternative)

If you need to scale beyond SQLite:

1. Install `pg` package: `npm install pg`
2. Update database.js to use PostgreSQL
3. Set `DATABASE_URL` environment variable

## Security Checklist

- [ ] Set strong API keys
- [ ] Configure CORS for production domains
- [ ] Enable HTTPS (SSL/TLS)
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup database regularly

## Monitoring

### Basic Monitoring

```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs pal-backend
```

### Advanced Monitoring

- Use tools like New Relic, DataDog, or LogRocket
- Set up error tracking (Sentry)
- Monitor API usage and costs
- Set up uptime monitoring

## Backup Strategy

```bash
# Backup SQLite database
cp backend/data/pal.db backups/pal-$(date +%Y%m%d).db

# Backup uploaded files
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz backend/uploads/
```

## Performance Optimization

1. **Frontend**

   - Use `npm run build` for production
   - Enable gzip compression
   - Use CDN for static assets

2. **Backend**

   - Set `NODE_ENV=production`
   - Use clustering for multiple cores
   - Implement caching for frequent queries
   - Optimize database queries

3. **General**
   - Use HTTP/2
   - Implement proper caching headers
   - Optimize images and assets
   - Monitor and optimize API response times

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change PORT in .env
2. **CORS errors**: Update ALLOWED_ORIGINS
3. **API key errors**: Check environment variables
4. **File upload issues**: Check upload directory permissions
5. **Database errors**: Ensure data directory exists and is writable

### Logs Location

- Backend logs: Check console output or configure winston logger
- Frontend logs: Browser developer console
- Server logs: `/var/log/` or PM2 logs
