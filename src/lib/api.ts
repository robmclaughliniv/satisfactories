// API client functions for making requests to our API endpoints

// Types
export type User = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  updatedAt: string;
  worlds?: World[];
};

export type World = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: User;
  factories?: Factory[];
  resources?: Resource[];
};

export type Factory = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  worldId: string;
  world?: World;
  buildings?: Building[];
};

export type Building = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  clockSpeed: number;
  createdAt: string;
  updatedAt: string;
  factoryId: string;
  recipeId: string | null;
  gameClassName: string | null;
};

export type Resource = {
  id: string;
  type: string;
  purity: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  worldId: string;
};

// API Error
export type ApiError = {
  error: string;
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.error || 'An error occurred');
  }
  return response.json() as Promise<T>;
}

// User API
export const userApi = {
  // Get all users
  getUsers: async (): Promise<User[]> => {
    const response = await fetch('/api/users');
    return handleResponse<User[]>(response);
  },
  
  // Get a specific user
  getUser: async (userId: string): Promise<User> => {
    const response = await fetch(`/api/users/${userId}`);
    return handleResponse<User>(response);
  },
  
  // Create a new user
  createUser: async (userData: { name?: string; email: string }): Promise<User> => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse<User>(response);
  },
  
  // Update a user
  updateUser: async (userId: string, userData: { name?: string; email?: string }): Promise<User> => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return handleResponse<User>(response);
  },
  
  // Delete a user
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  },
};

// World API
export const worldApi = {
  // Get all worlds
  getWorlds: async (userId?: string): Promise<World[]> => {
    const url = userId ? `/api/worlds?userId=${userId}` : '/api/worlds';
    const response = await fetch(url);
    return handleResponse<World[]>(response);
  },
  
  // Get a specific world
  getWorld: async (worldId: string): Promise<World> => {
    const response = await fetch(`/api/worlds/${worldId}`);
    return handleResponse<World>(response);
  },
  
  // Create a new world
  createWorld: async (worldData: { name: string; description?: string; userId: string }): Promise<World> => {
    const response = await fetch('/api/worlds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(worldData),
    });
    return handleResponse<World>(response);
  },
  
  // Update a world
  updateWorld: async (worldId: string, worldData: { name?: string; description?: string }): Promise<World> => {
    const response = await fetch(`/api/worlds/${worldId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(worldData),
    });
    return handleResponse<World>(response);
  },
  
  // Delete a world
  deleteWorld: async (worldId: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/worlds/${worldId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  },
}; 