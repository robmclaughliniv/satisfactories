# Technical Context

## Development Environment

### Core Technologies
- **Node.js**: Latest LTS version
- **TypeScript**: v5.x
- **Next.js**: v14.1.0
- **React**: v18.x
- **PostgreSQL**: Utilized for persistent data storage
- **node-postgres**: For database interactions with PostgreSQL

## Framework & Libraries

1. **UI Components**
   - Flowbite React v0.4.3
   - Tailwind CSS v3.3.0
   - @uiw/react-md-editor v4.0.5

2. **State Management**
   - React Hooks
   - Context API

3. **Data Persistence & Legacy Compression**
   - Transitioned from local storage to PostgreSQL for scalable storage
   - lz-string v1.5.0 (previously used for local storage compression; now deprecated)

## Development Tools

### Testing Suite
```json
{
  "jest": "^29.7.0",
  "@testing-library/react": "^14.1.2",
  "@testing-library/user-event": "^14.5.2",
  "@playwright/test": "^1.41.1"
}
```

### Code Quality
- ESLint with Next.js configuration
- Prettier v3.2.4
- TypeScript strict mode
- JSX a11y plugin for accessibility

### Build Tools
- next-pwa v5.6.0
- autoprefixer
- postcss
- sharp (for image optimization)

## Scripts & Commands

### Development
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Formatting
npm run format
```

### Testing
```bash
# Unit tests
npm test
npm run test:watch
npm run test:coverage

# End-to-end tests
npm run e2e
npm run e2e:ui
```

### Database & Migrations
```bash
# Run migrations
node scripts/migrate.js
```

### Validation
```bash
# Run all checks
npm run validate
```

## Project Configuration

### TypeScript
- Strict mode enabled
- Path aliases configured
- Includes Next.js types

### ESLint Rules
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/anchor-is-valid": "error",
    "jsx-a11y/click-events-have-key-events": "error",
    "jsx-a11y/no-static-element-interactions": "error",
    "jsx-a11y/role-has-required-aria-props": "error"
  }
}
```

### Jest Configuration
- Jest DOM environment
- React Testing Library setup
- Coverage reporting enabled

### PWA Configuration
- Service worker generation
- App manifest setup
- Icons for multiple sizes

## Technical Constraints

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- PWA support maintained
- Optimized primarily for desktop usage

### Performance Targets
- Lighthouse score targets: 
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 90+

### Storage & Data Migration
- Complete migration from local storage to PostgreSQL
- Managed via migration scripts (see scripts/migrate.sql and scripts/migrate.js)
- Ensuring data integrity and scalability

### Security Considerations
- CSP compliance
- Secure database connections via environment variables
- Input sanitization on API endpoints

## Development Practices

### Git Workflow
- Feature branching
- Pull request reviews
- Automated CI checks

### Code Style
- Enforced via Prettier and ESLint
- TypeScript strict mode for reliability
- Organized component structure following Next.js best practices

### Documentation
- Code comments and up-to-date type definitions
- Comprehensive README and memory bank documentation maintained

### Deployment
- Next.js static optimization with serverless functions
- PWA asset generation
- Secure handling of environment variables for database access
