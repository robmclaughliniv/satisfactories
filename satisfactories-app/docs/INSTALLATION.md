# Installation Guide

This guide covers installation and deployment of Satisfactories for different environments and use cases.

## Table of Contents

1. [Local Development](#local-development)
2. [Production Deployment](#production-deployment)
3. [Environment Configuration](#environment-configuration)
4. [PWA Setup](#pwa-setup)
5. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- Git ([Download](https://git-scm.com/))
- VS Code (recommended) ([Download](https://code.visualstudio.com/))

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/satisfactories.git
   cd satisfactories/satisfactories-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **View the App**
   - Open [http://localhost:3000](http://localhost:3000)
   - Changes will hot-reload automatically

### VS Code Configuration

1. **Recommended Extensions**
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - TypeScript and JavaScript Language Features

2. **Workspace Settings**
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "typescript.tsdk": "node_modules/typescript/lib"
   }
   ```

## Production Deployment

### Building for Production

1. **Create Production Build**
   ```bash
   npm run build
   ```

2. **Test Production Build**
   ```bash
   npm run start
   ```

### Deployment Options

#### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

#### Manual Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy the `.next` Directory**
   - Copy the following to your hosting provider:
     - `.next/` directory
     - `public/` directory
     - `package.json`
     - `next.config.js`

3. **Install Production Dependencies**
   ```bash
   npm install --production
   ```

4. **Start the Server**
   ```bash
   npm run start
   ```

### Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t satisfactories .
   ```

2. **Run Container**
   ```bash
   docker run -p 3000:3000 satisfactories
   ```

## Environment Configuration

### Environment Variables

Create `.env.local` for local development:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=true

# PWA Configuration
NEXT_PUBLIC_PWA_APP_NAME=Satisfactories
NEXT_PUBLIC_PWA_APP_SHORT_NAME=Satisfactories
NEXT_PUBLIC_PWA_APP_DESCRIPTION=Satisfactory Factory Manager
```

### Production Environment

Set these variables in your hosting platform:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PWA=true
```

## PWA Setup

### Development

1. **Enable PWA in Development**
   ```env
   NEXT_PUBLIC_ENABLE_PWA=true
   ```

2. **Generate Icons**
   ```bash
   npm run generate-icons
   ```

### Production

1. **Configure manifest.json**
   ```json
   {
     "name": "Satisfactories",
     "short_name": "Satisfactories",
     "description": "Satisfactory Factory Manager",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#ffffff",
     "theme_color": "#000000",
     "icons": [
       {
         "src": "/icons/icon-72x72.png",
         "sizes": "72x72",
         "type": "image/png"
       },
       // ... other icon sizes
     ]
   }
   ```

2. **Update next.config.js**
   ```javascript
   const withPWA = require('next-pwa')({
     dest: 'public',
     disable: process.env.NODE_ENV === 'development',
   });

   module.exports = withPWA({
     // other Next.js config
   });
   ```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Clear `.next` directory
   - Delete `node_modules` and reinstall
   - Check Node.js version

2. **PWA Not Working**
   - Verify SSL in production
   - Check manifest.json
   - Validate service worker

3. **Performance Issues**
   - Enable compression
   - Configure caching
   - Optimize images

### Debug Mode

Enable debug logging:

```env
DEBUG=satisfactories:*
```

### Support

If you encounter issues:

1. Check the [troubleshooting guide](USER_GUIDE.md#troubleshooting)
2. Search [existing issues](https://github.com/yourusername/satisfactories/issues)
3. Create a new issue with:
   - Environment details
   - Steps to reproduce
   - Error messages
   - Logs

## Updating

1. **Update Dependencies**
   ```bash
   npm update
   ```

2. **Check for Breaking Changes**
   ```bash
   npm outdated
   ```

3. **Update Next.js**
   ```bash
   npm install next@latest react@latest react-dom@latest
   ```

## Security

- Keep dependencies updated
- Use environment variables for secrets
- Enable security headers
- Implement CSP
- Regular security audits

---

For more information, see:
- [Contributing Guidelines](CONTRIBUTING.md)
- [Architecture Overview](ARCHITECTURE.md)
