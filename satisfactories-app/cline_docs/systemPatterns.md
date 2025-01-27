# System Architecture Patterns

## Application Architecture

### 1. Next.js App Router Structure
- Uses Next.js 14 with App Router
- Client components marked with 'use client'
- Server-side components for layout and metadata
- Hybrid rendering strategy

### 2. Component Organization
```
src/
├── app/           # Next.js app router pages and layouts
├── components/    # Reusable React components
├── services/      # Business logic and data services
├── types/         # TypeScript type definitions
└── e2e/           # End-to-end tests
```

### 3. State Management
- Local React state for UI components
- Local Storage for persistent data
- Context providers for theme/dark mode

## Data Flow Patterns

### 1. World & Factory Data
```
LocalStorage <-> LocalStorageService <-> React Components
```
- Worlds stored in 'satisfactory-worlds' key
- CRUD operations handled by localStorageService
- State updates trigger UI re-renders

### 2. Form Handling
- Modal-based forms for World/Factory creation
- Controlled components for input management
- Validation before storage updates

### 3. Theme Management
```
localStorage -> ThemeProvider -> React Components
```
- System preference detection
- Manual toggle support
- Persistent theme selection

## Technical Patterns

### 1. Type Safety
- TypeScript for static typing
- Interface-based type definitions
- Global type declarations

### 2. Component Patterns
- Functional components with hooks
- Props interface definitions
- Children prop typing

### 3. Testing Strategy
```
Unit Tests (Jest) -> Integration Tests -> E2E Tests (Playwright)
```
- Jest for component/service testing
- React Testing Library for integration
- Playwright for end-to-end flows

## Code Organization

### 1. File Naming
- PascalCase for components
- camelCase for utilities/services
- kebab-case for configuration files

### 2. Import Structure
```typescript
// External imports
import { useState } from 'react'
import { Button } from 'flowbite-react'

// Internal imports
import { localStorageService } from '@/services'
import type { World } from '@/types'
```

### 3. Component Structure
```typescript
// Types
interface Props {
  // ...
}

// Component
export function Component({ prop1, prop2 }: Props) {
  // State hooks
  // Effect hooks
  // Helper functions
  // Render
}
```

## Best Practices

### 1. Performance
- Image optimization with next/image
- Component code splitting
- Lazy loading for modals

### 2. Accessibility
- ARIA attributes
- Keyboard navigation
- Screen reader support

### 3. Error Handling
- Try-catch blocks for storage operations
- Error state management
- Loading state indicators

## Development Workflow

### 1. Code Quality
- ESLint for code linting
- Prettier for formatting
- TypeScript for type checking

### 2. Testing Requirements
- Jest for unit tests
- Component testing with RTL
- E2E coverage with Playwright

### 3. Build Process
- Next.js build optimization
- PWA asset generation
- Environment-based configuration
