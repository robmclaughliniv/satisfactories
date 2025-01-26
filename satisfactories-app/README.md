# Satisfactory Factory Manager

A local-first web application for managing Satisfactory game worlds and factories.

## Features

- Create and manage multiple game worlds
- Track factories with inputs, outputs, and production rates
- Rich Markdown notes support for factory documentation
- Efficient local storage with compression
- Fully accessible UI following WCAG guidelines

## Technical Implementation

### Data Storage

The application uses a sophisticated local storage approach to handle large datasets efficiently:

1. **Compression Strategy**:
   - Data is automatically compressed using `lz-string` when it exceeds 10KB
   - Compressed data is split into chunks of 4.5MB to stay under the 5MB localStorage limit
   - Compression metadata is stored separately to optimize read/write operations

2. **Performance Optimizations**:
   - Lazy loading of factory details
   - Automatic chunking for large datasets
   - Efficient updates that only modify changed data

### Accessibility Features

The application follows WCAG 2.1 guidelines:

1. **Semantic HTML Structure**:
   - Proper heading hierarchy
   - ARIA landmarks and labels
   - Form input associations

2. **Keyboard Navigation**:
   - All interactive elements are focusable
   - Logical tab order
   - Clear focus indicators

3. **Screen Reader Support**:
   - Descriptive ARIA labels
   - Status announcements
   - Error messaging

4. **Form Accessibility**:
   - Clear error states
   - Required field indicators
   - Input validation feedback

### Component Structure

1. **WorldForm**:
   - Creates/edits world entries
   - Basic validation
   - Error handling

2. **FactoryForm**:
   - Manages factory details
   - Resource input/output tracking
   - Markdown notes editor

3. **ResourceInput**:
   - Reusable component for inputs/outputs
   - Dynamic resource addition/removal
   - Validation

### Local Storage Service

The `LocalStorageService` provides:

1. **Core Operations**:
   - CRUD operations for worlds and factories
   - Automatic compression
   - Data chunking

2. **Error Handling**:
   - Storage availability checks
   - Data integrity validation
   - Graceful fallbacks

3. **Performance Features**:
   - Efficient updates
   - Minimal data duplication
   - Optimized read/write operations

## Usage Example

```typescript
// Create a new world
const world = {
  id: crypto.randomUUID(),
  name: "Desert Base",
  factories: [],
  lastModified: Date.now()
};

// Save to storage
localStorageService.updateWorld(world);

// Add a factory
const factory = {
  id: crypto.randomUUID(),
  name: "Steel Production",
  description: "Basic steel manufacturing",
  inputs: [
    { itemId: "iron-ore", amount: 60, rate: 60 },
    { itemId: "coal", amount: 60, rate: 60 }
  ],
  outputs: [
    { itemId: "steel-ingot", amount: 60, rate: 60 }
  ],
  notes: "# Steel Production\n\n- 2 smelters\n- 100% efficiency",
  lastModified: Date.now()
};

localStorageService.updateFactory(world.id, factory);
```

## Mobile Performance

The application is optimized for low-end mobile devices:

1. **Data Management**:
   - Incremental updates
   - Compressed storage
   - Chunked data handling

2. **UI Performance**:
   - Minimal re-renders
   - Efficient form handling
   - Optimized markdown editor

3. **Memory Usage**:
   - Lazy loading of factory details
   - Cleanup of unused data
   - Efficient resource management
