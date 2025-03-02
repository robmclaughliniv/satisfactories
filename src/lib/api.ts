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
  world?: World;
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

// Factory API
export const factoryApi = {
  // Get all factories
  getFactories: async (worldId?: string): Promise<Factory[]> => {
    const url = worldId ? `/api/factories?worldId=${worldId}` : '/api/factories';
    const response = await fetch(url);
    return handleResponse<Factory[]>(response);
  },
  
  // Get a specific factory
  getFactory: async (factoryId: string): Promise<Factory> => {
    const response = await fetch(`/api/factories/${factoryId}`);
    return handleResponse<Factory>(response);
  },
  
  // Create a new factory
  createFactory: async (factoryData: { 
    name: string; 
    description?: string; 
    location?: string; 
    worldId: string 
  }): Promise<Factory> => {
    const response = await fetch('/api/factories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factoryData),
    });
    return handleResponse<Factory>(response);
  },
  
  // Update a factory
  updateFactory: async (factoryId: string, factoryData: { 
    name?: string; 
    description?: string; 
    location?: string 
  }): Promise<Factory> => {
    const response = await fetch(`/api/factories/${factoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(factoryData),
    });
    return handleResponse<Factory>(response);
  },
  
  // Delete a factory
  deleteFactory: async (factoryId: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/factories/${factoryId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  },
};

// Resource API
export const resourceApi = {
  // Get all resources
  getResources: async (worldId?: string): Promise<Resource[]> => {
    const url = worldId ? `/api/resources?worldId=${worldId}` : '/api/resources';
    const response = await fetch(url);
    return handleResponse<Resource[]>(response);
  },
  
  // Get a specific resource
  getResource: async (resourceId: string): Promise<Resource> => {
    const response = await fetch(`/api/resources/${resourceId}`);
    return handleResponse<Resource>(response);
  },
  
  // Create a new resource
  createResource: async (resourceData: { 
    type: string; 
    purity: string;
    worldId: string;
    location?: string 
  }): Promise<Resource> => {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData),
    });
    return handleResponse<Resource>(response);
  },
  
  // Update a resource
  updateResource: async (resourceId: string, resourceData: { 
    type?: string; 
    purity?: string;
    worldId?: string;
    location?: string 
  }): Promise<Resource> => {
    const response = await fetch(`/api/resources/${resourceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resourceData),
    });
    return handleResponse<Resource>(response);
  },
  
  // Delete a resource
  deleteResource: async (resourceId: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/resources/${resourceId}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string }>(response);
  },
}; 