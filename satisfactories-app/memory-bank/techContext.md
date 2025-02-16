# Technical Context

## Development Environment

### Core Technologies
- **Node.js**: Latest LTS version
- **TypeScript**: v5.x
- **Next.js**: v14.1.0
- **React**: v18.x

### Framework & Libraries
1. **UI Components**
   - Flowbite React v0.4.3
   - Tailwind CSS v3.3.0
   - @uiw/react-md-editor v4.0.5

2. **State Management**
   - React Hooks
   - Local Storage
   - Context API

3. **Data Compression**
   - lz-string v1.5.0 (for storage optimization)

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
- ESLint with Next.js config
- Prettier v3.2.4
- TypeScript strict mode
- JSX a11y plugin

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

# E2E tests
npm run e2e
npm run e2e:ui
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
- Next.js types included

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
- Coverage reporting

### PWA Configuration
- Service worker generation
- App manifest
- Icons for various sizes

## Technical Constraints

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- PWA support required
- Mobile-first responsive design

### Performance Requirements
- Lighthouse score targets:
  - Performance: 90+
  - Accessibility: 90+
  - Best Practices: 90+
  - SEO: 90+

### Storage Limitations
- Local Storage size limits
- Data compression required for large datasets
- Offline functionality support

### Security Considerations
- CSP compliance
- Local data encryption (if needed)
- Input sanitization

## Development Practices

### Git Workflow
- Feature branches
- Pull request reviews
- Automated CI checks

### Code Style
- Prettier formatting
- TypeScript strict mode
- Component organization patterns

### Documentation
- Code comments
- Type definitions
- README maintenance

## Deployment

### Build Process
- Next.js static optimization
- PWA asset generation
- Environment variable handling

### Infrastructure
- Static hosting capability
- CDN support
- PWA requirements

### Monitoring
- Error tracking setup
- Performance monitoring
- Usage analytics (if implemented)
