# KavaChat

A frontend-only chat application built with TypeScript that uses the OpenRouter API. Features secure PKCE OAuth authentication, retrofuture 80s aesthetic, and supports multiple AI models.

**Live Demo:** https://j-east.github.io/KavaChat/

## Features

- Secure PKCE OAuth authentication with OpenRouter
- Model selector with popular AI models (GPT-4, Claude, Gemini, Llama, etc.)
- Real-time streaming chat interface
- Fully client-side - no backend required
- Deployable to GitHub Pages

## Getting Started

### Development

1. Install dependencies:
```bash
cd KavaChat
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment to GitHub Pages

1. Push this repository to GitHub
2. Go to Settings > Pages
3. Under "Build and deployment", select "GitHub Actions" as the source
4. Push to the master branch to trigger deployment

The GitHub Action will automatically build and deploy the application.

## Usage

1. Click "Login with OpenRouter" to authenticate
2. You'll be redirected to OpenRouter for authorization
3. After authentication, you'll return to KavaChat
4. Select a model from the dropdown
5. Start chatting!

## Technical Details

- **Framework**: Vite + TypeScript
- **Authentication**: OAuth 2.0 PKCE flow
- **API**: OpenRouter REST API with streaming support
- **Storage**: LocalStorage for API key persistence

## Security

- Uses PKCE (Proof Key for Code Exchange) for secure OAuth authentication
- API keys are stored only in the browser's LocalStorage
- No backend server - all API calls go directly to OpenRouter
- Fully client-side application

## License

MIT
