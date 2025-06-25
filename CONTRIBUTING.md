# Contributing to Pal2

Thank you for your interest in contributing to Pal2! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Follow the setup instructions in README.md

## Development Setup

### Backend Development
```bash
cd backend
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm install
npm start  # React development server
```

## Code Style

- Use ESLint and Prettier for code formatting
- Follow existing code conventions
- Write clear, descriptive commit messages
- Add comments for complex logic

## Testing

Before submitting a PR:

1. Test document upload functionality
2. Test chat functionality with various questions
3. Test error handling
4. Check browser console for errors
5. Test on different browsers

## Submitting Changes

1. Ensure your code follows the style guidelines
2. Test your changes thoroughly
3. Update documentation if needed
4. Create a pull request with:
   - Clear description of changes
   - Screenshots if UI changes
   - Test instructions

## Reporting Issues

When reporting bugs:

1. Use the issue template
2. Include steps to reproduce
3. Provide error messages/logs
4. Specify your environment (OS, Node version, browser)

## Feature Requests

- Check existing issues first
- Clearly describe the feature and its benefits
- Provide use cases
- Consider implementation complexity

## Project Structure

```
Pal2/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── config/   # Database and environment config
│   │   ├── middleware/ # CORS, error handling, etc.
│   │   ├── routes/   # API endpoints
│   │   ├── services/ # Business logic
│   │   └── utils/    # Helper functions
│   └── server.js     # Main server file
├── frontend/         # React application
│   ├── src/
│   │   ├── components/ # React components
│   │   └── services/   # API client
│   └── public/       # Static files
└── test-documentation/ # Sample files and docs
```

## API Guidelines

- Use RESTful conventions
- Return consistent JSON responses
- Include proper error handling
- Add request/response logging
- Validate input data

## UI/UX Guidelines

- Follow existing design patterns
- Ensure responsive design
- Add loading states
- Provide clear error messages
- Test accessibility

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
