# System Architecture Patterns

## Data Hierarchy

### 1. Core Data Model
The application now relies on a PostgreSQL database. The core entities and their relationships are defined as follows:

```
User
  ├── preferences
  │   ├── theme
  │   ├── defaultGameVersion
  │   └── defaultDifficulty
  │
  └── worlds[] (Associated via PostgreSQL)
      ├── id (Primary Key)
      ├── name
      ├── metadata (e.g., biome, coordinates)
      ├── gameVersion
      ├── difficulty
      ├── tags
      ├── powerStats
      │   ├── totalProduction
      │   ├── totalConsumption
      │   └── maxCapacity
      ├── startDate
      ├── lastModified
      └── factories[] (Foreign key relationship)
          ├── id (Primary Key)
          ├── name
          ├── created_at
          └── (Additional attributes managed by migrations)
```

Additionally, a separate **resources** table exists for linking resource information to worlds.

### 2. Storage Pattern
- The previous local storage solution has been completely replaced.
- Data is now stored in PostgreSQL.
- Database schema changes are managed via migration scripts (`scripts/migrate.sql` and `scripts/migrate.js`).
- API endpoints (e.g., factories API route) interact with the database through the node-postgres library.

## Application Architecture

### 1. Next.js App Router Structure
- Uses Next.js with the App Router.
- Client components are marked with `'use client'`; server components handle layout and metadata.
- Hybrid rendering strategy to optimize both static and dynamic content.

### 2. Component Organization
```
satisfactories-app/
├── app/           # Next.js pages, layouts, and API routes
├── components/    # Reusable React components
├── services/      # Business logic and database interactions (e.g., db.ts)
├── memory-bank/   # Documentation files and memory bank context
├── scripts/       # Database migration and utility scripts
├── types/         # TypeScript type definitions
└── e2e/           # End-to-end tests with Playwright
```

### 3. State & Data Flow Patterns

#### Data Flow
```
PostgreSQL Database <--> Server-side API Routes (Next.js) <--> React Components (Client)
```
- CRUD operations are performed via the API routes.
- The server interacts with PostgreSQL using the node-postgres library.
- Client components fetch data from these API endpoints.

#### API Structure
- API routes (e.g., `/api/factories`) handle database queries and return JSON responses.
- Server components manage secure data access and input validation.

## Technical Patterns

### 1. Type Safety & Code Organization
- Use of TypeScript for static type-checking.
- Strict typing with interfaces and enums for core data models.
- Organized import structure for maintainability.

### 2. Component & Data Management Patterns
- Form components integrate with API endpoints for real-time data updates.
- Local state (via React Hooks) is used for UI responsiveness.
- Server-side API routes mediate all interactions with the PostgreSQL database.

### 3. Database Migration Pattern
- Migrations are triggered via scripts:
  - `scripts/migrate.sql` defines schema changes.
  - `scripts/migrate.js` executes these migrations using node-postgres.
- This ensures data integrity and systematic schema evolution.

## Best Practices

### 1. Data Management
- Perform data migrations with rollback support.
- Validate data changes through comprehensive testing.
- Maintain clear separation between database schema and application logic.

### 2. Performance
- Employ lazy loading and code-splitting for UI components.
- Optimize API endpoints for quick database queries.
- Use caching mechanisms where appropriate.

### 3. Security & Error Handling
- Sanitize API inputs to prevent SQL injection.
- Use environment variables for secure database connection management.
- Implement robust error handling both at the API and UI levels.
