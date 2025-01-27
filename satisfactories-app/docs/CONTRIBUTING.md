# Contributing to Satisfactories

First off, thank you for considering contributing to Satisfactories! It's people like you that make Satisfactories such a great tool for the Satisfactory gaming community.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Making Changes](#making-changes)
5. [Submitting Changes](#submitting-changes)
6. [Code Style Guide](#code-style-guide)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [project@satisfactories.app](mailto:project@satisfactories.app).

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- A code editor (we recommend VS Code)

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/satisfactories.git
   cd satisfactories/satisfactories-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Development Scripts

- `npm run dev` - Start development server
- `npm test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run e2e` - Run end-to-end tests
- `npm run e2e:ui` - Run E2E tests with UI
- `npm run lint` - Lint code
- `npm run type-check` - Check TypeScript types
- `npm run validate` - Run all checks (lint, type-check, test)

## Project Structure

```
satisfactories-app/
├── docs/               # Documentation
├── public/            # Static assets
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── services/     # Business logic
│   ├── types/        # TypeScript types
│   └── e2e/         # End-to-end tests
├── scripts/          # Build and utility scripts
└── cline_docs/       # Internal documentation
```

## Making Changes

1. Make sure you're working on the latest code:
   ```bash
   git remote add upstream https://github.com/original/satisfactories.git
   git fetch upstream
   git merge upstream/main
   ```

2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes:
   - Write meaningful commit messages
   - Follow the code style guide
   - Add tests for new features
   - Update documentation as needed

4. Validate your changes:
   ```bash
   npm run validate
   ```

## Submitting Changes

1. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Submit a pull request:
   - Use the PR template
   - Link any related issues
   - Provide a clear description of changes
   - Include screenshots for UI changes

## Code Style Guide

We use ESLint and Prettier to maintain code quality. Our style guide is based on:

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Define explicit return types for functions
- Use interfaces over types when possible

### React

- Use functional components
- Implement proper prop types
- Use hooks according to [React Hooks guidelines](https://reactjs.org/docs/hooks-rules.html)
- Follow component naming conventions:
  ```typescript
  // Component files are PascalCase
  // components/MyComponent.tsx
  export function MyComponent({ prop1, prop2 }: MyComponentProps) {
    // ...
  }
  ```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow mobile-first approach
- Use semantic class names
- Maintain dark mode support

## Testing Guidelines

### Unit Tests

- Write tests for all new features
- Follow the AAA pattern (Arrange, Act, Assert)
- Use meaningful test descriptions
- Mock external dependencies

Example:
```typescript
describe('WorldForm', () => {
  it('should validate required fields', () => {
    // Arrange
    render(<WorldForm />);
    
    // Act
    fireEvent.click(screen.getByText('Create World'));
    
    // Assert
    expect(screen.getByText('World name is required')).toBeInTheDocument();
  });
});
```

### E2E Tests

- Cover critical user flows
- Test on multiple viewport sizes
- Include accessibility checks

## Documentation

- Update README.md for significant changes
- Document new features in USER_GUIDE.md
- Update API documentation
- Include JSDoc comments for public functions
- Add inline comments for complex logic

### Documentation Style

```typescript
/**
 * Updates a factory within a world
 * @param worldId - The ID of the world containing the factory
 * @param factory - The factory data to update
 * @throws {Error} If world is not found
 */
function updateFactory(worldId: string, factory: Factory): void {
  // Implementation
}
```

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in our Discord channel
- Check existing documentation

Thank you for contributing to Satisfactories! 🎮🏭
