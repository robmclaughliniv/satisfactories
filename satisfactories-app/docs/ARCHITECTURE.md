# Architecture Overview

This document provides a detailed overview of Satisfactories' technical architecture, design decisions, and implementation patterns.

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Architecture](#data-architecture)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Storage System](#storage-system)
6. [Performance Optimizations](#performance-optimizations)
7. [Security Considerations](#security-considerations)

## System Overview

### Tech Stack

```
Frontend (Next.js 14)
└── React 18
    ├── TypeScript
    ├── Tailwind CSS
    └── Flowbite UI
```

### Key Design Principles

1. **Local-First Architecture**
   - Data stored locally in browser
   - Offline-first functionality
   - PWA capabilities

2. **Mobile-First Design**
   - Responsive layouts
   - Touch-friendly interfaces
   - Performance optimized

3. **Type Safety**
   - Strict TypeScript configuration
   - Runtime type checking
   - Comprehensive type definitions

## Data Architecture

### Data Hierarchy

```typescript
User
├── preferences
│   ├── theme
│   ├── defaultGameVersion
│   └── defaultDifficulty
│
└── worlds[]
    ├── metadata
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

### Type System

```typescript
// Core Types
interface User {
  id: string;
  preferences: UserPreferences;
  worlds: World[];
  lastActive: number;
  createdAt: number;
}

interface World {
  id: string;
  name: string;
  // ... other properties
}

interface Factory {
  id: string;
  name: string;
  // ... other properties
}

// Enums for Type Safety
enum GameDifficulty {
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  CUSTOM = 'CUSTOM'
}

enum FactoryCategory {
  MINING = 'MINING',
  PROCESSING = 'PROCESSING',
  // ... other categories
}
```

## Component Architecture

### Component Organization

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
│
├── components/         # React components
│   ├── forms/         # Form components
│   ├── ui/            # UI components
│   └── providers/     # Context providers
│
├── services/          # Business logic
│   └── storage/       # Storage services
│
└── types/            # TypeScript types
```

### Component Patterns

1. **Form Components**
   ```typescript
   interface FormProps {
     initialData?: T;
     onSubmit: (data: T) => void;
     onClose: () => void;
   }
   ```

2. **Data Display Components**
   ```typescript
   interface DisplayProps {
     data: T;
     onEdit?: () => void;
     onDelete?: () => void;
   }
   ```

3. **Container Components**
   ```typescript
   function Container() {
     const [data, setData] = useState<T>();
     // Data fetching, state management
     return <Children data={data} />;
   }
   ```

## State Management

### Local Storage Service

```typescript
class LocalStorageService {
  private static instance: LocalStorageService;
  
  // Singleton pattern
  static getInstance(): LocalStorageService {
    if (!instance) instance = new LocalStorageService();
    return instance;
  }

  // CRUD operations
  getUser(): User { /* ... */ }
  updateWorld(world: World): void { /* ... */ }
  // ... other methods
}
```

### Data Flow

```
User Action
    ↓
React Component
    ↓
Local Storage Service
    ↓
Storage Processing
    ↓
Data Update
    ↓
UI Update
```

## Storage System

### Compression Strategy

1. **Threshold-Based Compression**
   ```typescript
   const COMPRESSION_THRESHOLD = 1024 * 10; // 10KB

   function maybeCompress(data: string): string {
     if (data.length > COMPRESSION_THRESHOLD) {
       return compress(data);
     }
     return data;
   }
   ```

2. **Chunking System**
   ```typescript
   const MAX_CHUNK_SIZE = 1024 * 1024 * 4.5; // 4.5MB

   function splitIntoChunks(data: string): string[] {
     const chunks: string[] = [];
     let offset = 0;
     
     while (offset < data.length) {
       chunks.push(data.slice(offset, offset + MAX_CHUNK_SIZE));
       offset += MAX_CHUNK_SIZE;
     }
     
     return chunks;
   }
   ```

### Storage Keys

```typescript
const STORAGE_KEYS = {
  USER: 'satisfactory-user',
  WORLDS: 'satisfactory-worlds',
} as const;
```

## Performance Optimizations

### Code Splitting

1. **Dynamic Imports**
   ```typescript
   const MDEditor = dynamic(
     () => import('@uiw/react-md-editor'),
     { ssr: false }
   );
   ```

2. **Route-Based Splitting**
   ```typescript
   // Next.js handles this automatically
   import { lazy } from 'react';
   ```

### Resource Loading

1. **Image Optimization**
   ```typescript
   import Image from 'next/image';
   
   <Image
     src="/icon.png"
     width={100}
     height={100}
     loading="lazy"
   />
   ```

2. **Font Loading**
   ```typescript
   // next.config.js
   module.exports = {
     optimizeFonts: true,
   };
   ```

### Caching Strategy

1. **Local Storage**
   - Compression for large datasets
   - Chunking for size limits
   - Version tracking

2. **PWA Caching**
   - Static assets
   - API responses
   - Application shell

## Security Considerations

### Data Safety

1. **Input Validation**
   ```typescript
   function validateWorld(world: unknown): world is World {
     // Type checking and validation
   }
   ```

2. **Storage Limits**
   ```typescript
   function checkStorageQuota(): boolean {
     // Check available space
   }
   ```

### Error Handling

```typescript
try {
  // Operation
} catch (error) {
  if (error instanceof StorageError) {
    // Handle storage errors
  } else if (error instanceof ValidationError) {
    // Handle validation errors
  } else {
    // Handle unknown errors
  }
}
```

## Future Considerations

1. **Multi-Device Sync**
   - Data synchronization protocol
   - Conflict resolution
   - Version control

2. **Performance Scaling**
   - Virtual scrolling for large datasets
   - Worker threads for calculations
   - Indexed DB for larger storage

3. **Feature Extensions**
   - Plugin system
   - API integrations
   - Real-time collaboration

---

For implementation details, see:
- [Contributing Guidelines](CONTRIBUTING.md)
- [Installation Guide](INSTALLATION.md)
