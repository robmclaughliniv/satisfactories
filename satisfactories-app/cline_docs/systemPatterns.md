# System Architecture Patterns

## Data Hierarchy

### 1. Core Data Model
```
User
  ├── preferences
  │   ├── theme
  │   ├── defaultGameVersion
  │   └── defaultDifficulty
  │
  └── worlds[]
      ├── metadata (name, biome, etc.)
      ├── gameVersion
      ├── difficulty
      ├── coordinates
      ├── tags
      ├── powerStats
      │   ├── totalProduction
      │   ├── totalConsumption
      │   └── maxCapacity
      │
      └── factories[]
          ├── metadata
          ├── category
          ├── status
          ├── location
          ├── power
          ├── efficiency
          ├── buildingCount
          ├── inputs[]
          │   ├── resourceType
          │   ├── purity
          │   ├── rates
          │   └── transport
          │
          └── outputs[]
              ├── resourceType
              ├── rates
              └── transport
```

### 2. Storage Pattern
```
LocalStorage
  ├── satisfactory-user
  │   └── Compressed & Chunked JSON
  │
  └── satisfactory-worlds (legacy)
      └── Compressed & Chunked JSON
```

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
└── e2e/          # End-to-end tests
```

### 3. State Management
- Local React state for UI components
- Local Storage for persistent data
- Context providers for theme/dark mode
- User preferences in local storage

## Data Flow Patterns

### 1. User & World Data
```
LocalStorage <-> LocalStorageService <-> React Components
```
- User data as top-level storage
- Worlds nested under user
- CRUD operations through service layer
- Automatic data migration support

### 2. Factory Management
```
World -> Factory -> Resources
```
- Factories scoped to worlds
- Resource flows tracked at factory level
- Power management at both factory and world level
- Building counts for resource calculations

### 3. Resource Flow
```
Input -> Factory -> Output
```
- Resource type validation
- Rate calculations
- Transport method tracking
- Efficiency monitoring

## Technical Patterns

### 1. Type Safety
- TypeScript for static typing
- Enum-based categorization
- Interface-based type definitions
- Global type declarations

### 2. Component Patterns
- Form components with validation
- Resource management components
- Coordinate system components
- Power tracking components

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
import type { User, World, Factory } from '@/types'
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

### 1. Data Management
- Chunked storage for large datasets
- Compression for efficiency
- Migration paths for updates
- Type-safe operations

### 2. Performance
- Lazy loading for modals
- Optimized form rendering
- Efficient data updates
- Resource calculation caching

### 3. Error Handling
- Type validation
- Data integrity checks
- Migration error handling
- User feedback

## Development Workflow

### 1. Code Quality
- ESLint for code linting
- Prettier for formatting
- TypeScript for type checking

### 2. Testing Requirements
- Unit tests for data operations
- Component testing with RTL
- E2E coverage with Playwright

### 3. Build Process
- Next.js build optimization
- PWA asset generation
- Environment-based configuration
