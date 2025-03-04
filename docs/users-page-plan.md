# Satisfactory Factory Planner - Users Page Implementation Plan

Based on the mockup description for the users page, this plan outlines the implementation approach. The user interface includes a main navigation bar with a users button, a modal for user selection with cards showing user names and world counts, and a search bar for filtering users.

## 1. Project Structure Setup

```
app/
├── (auth)/
│   ├── page.tsx                 # User selection (root)
│   ├── layout.tsx               # Root layout with main navigation
│   └── components/
│       ├── UserSelectionModal.tsx  # Modal containing user cards
│       ├── UserCard.tsx            # Individual user card component
│       ├── SearchBar.tsx           # Search functionality for users
│       └── WorldSelectionModal.tsx # Modal for world selection after user click
├── components/                  # Shared components
    ├── ui/                      # Reusable UI components
    │   ├── Modal.tsx            # Reusable modal component
    │   ├── Card.tsx             # Base card component
    │   ├── Button.tsx           # Button component
    │   └── NavBar.tsx           # Main navigation bar
    ├── forms/                   # Form components
    └── modals/                  # Modal components
```

## 2. Implementation Plan - User Selection Page

### Phase 1: User Selection (1 week)

1. **Main Navigation Bar**
   - Create a responsive navigation component (NavBar.tsx)
   - Implement the users button (initially the only button)
   - Style according to the mockup with responsive design

2. **User Selection Modal**
   - Build a reusable Modal component that can be used across the app
   - Create the UserSelectionModal that displays when the page loads
   - Add a search bar component at the top of the modal
   - Implement search functionality that filters user cards in real-time

3. **User Cards**
   - Design UserCard component matching the mockup
   - Display user name and number of worlds clearly
   - Add appropriate hover/selection states
   - Make cards clickable to trigger the world selection modal

4. **User Creation**
   - Add a "Create New User" card or button
   - Implement a form for creating new users
   - Add validation and error handling

5. **Search Functionality**
   - Create a SearchBar component that filters the user cards
   - Implement client-side filtering as user types
   - Add clear button and visual feedback

6. **World Selection Modal**
   - Create a modal that appears when a user card is clicked
   - List all worlds belonging to the selected user
   - Include world creation functionality
   - Implement navigation to world detail page on selection

### Technical Tasks for User Page

1. **API Integration**
   - Create `/api/users` endpoint with:
     - GET: List all users with world counts
     - POST: Create new user
   - Create `/api/users/[userId]/worlds` endpoint:
     - GET: List all worlds for a specific user
     - POST: Create new world for a user

2. **State Management**
   - Implement user search state
   - Handle modal open/close states
   - Set up selected user state

3. **Data Fetching**
   - Use React Query or SWR for data fetching
   - Implement proper loading states
   - Handle error cases

4. **Styling**
   - Create a consistent theme system (consider Tailwind CSS or styled-components)
   - Ensure responsive design for all viewport sizes
   - Match the visual design of your mockup

## 3. Component Specifications

### NavBar Component

```typescript
type NavBarProps = {
  activeItem?: 'users' | 'worlds' | 'factories';
}
```

### Modal Component

```typescript
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl';
}
```

### UserCard Component

```typescript
type UserCardProps = {
  user: {
    id: string;
    name: string;
    worldCount: number;
    avatarUrl?: string;
  };
  onClick: (userId: string) => void;
}
```

### SearchBar Component

```typescript
type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}
```

### UserSelectionModal Component

```typescript
type UserSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect: (userId: string) => void;
}
```