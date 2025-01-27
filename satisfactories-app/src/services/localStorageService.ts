import { 
  World, 
  Factory, 
  User, 
  STORAGE_KEYS, 
  StorageKeys,
  GameDifficulty,
  FactoryCategory,
  FactoryStatus,
  ResourceType,
  TransportMethod
} from '../types/storage';
import { compress, decompress } from 'lz-string';

const COMPRESSION_THRESHOLD = 1024 * 10; // 10KB
const MAX_CHUNK_SIZE = 1024 * 1024 * 4.5; // ~4.5MB to stay under 5MB limit

class LocalStorageService {
  private static instance: LocalStorageService;

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): LocalStorageService {
    if (!LocalStorageService.instance) {
      LocalStorageService.instance = new LocalStorageService();
    }
    return LocalStorageService.instance;
  }

  /**
   * Checks if the browser supports local storage
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Compresses data if it exceeds the threshold
   */
  private maybeCompressData(data: string): { compressed: boolean; data: string } {
    if (data.length > COMPRESSION_THRESHOLD) {
      return {
        compressed: true,
        data: compress(data)
      };
    }
    return {
      compressed: false,
      data
    };
  }

  /**
   * Decompresses data if it was compressed
   */
  private maybeDecompressData(data: string | null, wasCompressed: boolean): string | null {
    if (!data) return null;
    return wasCompressed ? decompress(data) : data;
  }

  /**
   * Splits data into chunks if necessary
   */
  private splitIntoChunks(data: string): string[] {
    const chunks: string[] = [];
    let offset = 0;
    
    while (offset < data.length) {
      chunks.push(data.slice(offset, offset + MAX_CHUNK_SIZE));
      offset += MAX_CHUNK_SIZE;
    }
    
    return chunks;
  }

  /**
   * Generic method to save chunked data
   */
  private saveChunkedData(key: StorageKeys, data: any): void {
    if (!this.isLocalStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      const stringData = JSON.stringify(data);
      const { compressed, data: processedData } = this.maybeCompressData(stringData);

      // Clear existing chunks
      for (let i = 0; ; i++) {
        const chunkKey = `${key}_${i}`;
        if (localStorage.getItem(chunkKey) === null) break;
        localStorage.removeItem(chunkKey);
      }

      // Store compression flag
      localStorage.setItem(`${key}_compressed`, String(compressed));

      // Split and store data
      const chunks = this.splitIntoChunks(processedData);
      chunks.forEach((chunk, index) => {
        localStorage.setItem(`${key}_${index}`, chunk);
      });

      // Store chunk count
      localStorage.setItem(`${key}_chunks`, String(chunks.length));
    } catch (error) {
      console.error(`Failed to save ${key}:`, error);
      throw new Error(`Failed to save ${key} to local storage`);
    }
  }

  /**
   * Generic method to retrieve chunked data
   */
  private getChunkedData<T>(key: StorageKeys): T | null {
    if (!this.isLocalStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      const wasCompressed = localStorage.getItem(`${key}_compressed`) === 'true';
      const chunkCount = Number(localStorage.getItem(`${key}_chunks`));

      if (isNaN(chunkCount)) {
        return null;
      }

      let combinedData = '';
      for (let i = 0; i < chunkCount; i++) {
        const chunk = localStorage.getItem(`${key}_${i}`);
        if (chunk === null) {
          throw new Error(`Missing chunk ${i}`);
        }
        combinedData += chunk;
      }

      const decompressedData = this.maybeDecompressData(combinedData, wasCompressed);
      if (!decompressedData) {
        return null;
      }

      return JSON.parse(decompressedData);
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      throw new Error(`Failed to retrieve ${key} from local storage`);
    }
  }

  /**
   * Creates a default user
   */
  private createDefaultUser(): User {
    return {
      id: crypto.randomUUID(),
      name: 'Default User',
      preferences: {
        theme: 'system',
        defaultGameVersion: 'Update 8',
        defaultDifficulty: GameDifficulty.NORMAL,
      },
      worlds: [],
      lastActive: Date.now(),
      createdAt: Date.now(),
    };
  }

  /**
   * Migrates existing worlds to user structure
   */
  private migrateWorldsToUser(): User {
    const user = this.createDefaultUser();
    try {
      const worlds = this.getWorlds();
      if (worlds.length > 0) {
        // Enhance existing worlds with new properties
        user.worlds = worlds.map(world => ({
          ...world,
          gameVersion: user.preferences.defaultGameVersion,
          difficulty: user.preferences.defaultDifficulty,
          coordinates: { x: 0, y: 0, z: 0 },
          tags: [],
          powerStats: {
            totalProduction: 0,
            totalConsumption: 0,
            maxCapacity: 0,
          },
          startDate: world.lastModified,
          factories: world.factories.map(factory => ({
            ...factory,
            category: FactoryCategory.PROCESSING,
            status: FactoryStatus.OPERATIONAL,
            location: { x: 0, y: 0, z: 0 },
            powerUsage: 0,
            powerProduction: 0,
            efficiency: 100,
            buildingCount: {},
            inputs: factory.inputs.map(input => ({
              ...input,
              resourceType: ResourceType.PART,
              maxRate: input.rate,
              efficiency: 100,
              transportMethod: TransportMethod.BELT,
            })),
            outputs: factory.outputs.map(output => ({
              ...output,
              resourceType: ResourceType.PART,
              maxRate: output.rate,
              efficiency: 100,
              transportMethod: TransportMethod.BELT,
            })),
          })),
        }));
      }
      return user;
    } catch (error) {
      console.error('Migration failed:', error);
      return user; // Return empty user if migration fails
    }
  }

  /**
   * Gets the user, creating if necessary and migrating existing data
   */
  getUser(): User {
    const user = this.getChunkedData<User>(STORAGE_KEYS.USER);
    if (!user) {
      const newUser = this.migrateWorldsToUser();
      this.saveUser(newUser);
      return newUser;
    }
    return user;
  }

  /**
   * Saves the user data
   */
  saveUser(user: User): void {
    this.saveChunkedData(STORAGE_KEYS.USER, user);
  }

  /**
   * Updates user preferences
   */
  updateUserPreferences(preferences: User['preferences']): void {
    const user = this.getUser();
    user.preferences = preferences;
    user.lastActive = Date.now();
    this.saveUser(user);
  }

  // World methods now operate within User context
  getWorlds(): World[] {
    const user = this.getUser();
    return user.worlds;
  }

  updateWorld(world: World): void {
    const user = this.getUser();
    const index = user.worlds.findIndex(w => w.id === world.id);
    
    if (index === -1) {
      user.worlds.push(world);
    } else {
      user.worlds[index] = world;
    }

    user.lastActive = Date.now();
    this.saveUser(user);
  }

  deleteWorld(worldId: string): void {
    const user = this.getUser();
    user.worlds = user.worlds.filter(w => w.id !== worldId);
    user.lastActive = Date.now();
    this.saveUser(user);
  }

  updateFactory(worldId: string, factory: Factory): void {
    const user = this.getUser();
    const worldIndex = user.worlds.findIndex(w => w.id === worldId);
    
    if (worldIndex === -1) {
      throw new Error(`World with ID ${worldId} not found`);
    }

    const factoryIndex = user.worlds[worldIndex].factories.findIndex(f => f.id === factory.id);
    
    if (factoryIndex === -1) {
      user.worlds[worldIndex].factories.push(factory);
    } else {
      user.worlds[worldIndex].factories[factoryIndex] = factory;
    }

    user.worlds[worldIndex].lastModified = Date.now();
    user.lastActive = Date.now();
    this.saveUser(user);
  }

  deleteFactory(worldId: string, factoryId: string): void {
    const user = this.getUser();
    const worldIndex = user.worlds.findIndex(w => w.id === worldId);
    
    if (worldIndex === -1) {
      throw new Error(`World with ID ${worldId} not found`);
    }

    user.worlds[worldIndex].factories = user.worlds[worldIndex].factories.filter(f => f.id !== factoryId);
    user.worlds[worldIndex].lastModified = Date.now();
    user.lastActive = Date.now();
    this.saveUser(user);
  }

  /**
   * Clears all stored data
   */
  clearAll(): void {
    if (!this.isLocalStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      // Clear user data
      for (let i = 0; ; i++) {
        const chunkKey = `${STORAGE_KEYS.USER}_${i}`;
        if (localStorage.getItem(chunkKey) === null) break;
        localStorage.removeItem(chunkKey);
      }
      localStorage.removeItem(`${STORAGE_KEYS.USER}_compressed`);
      localStorage.removeItem(`${STORAGE_KEYS.USER}_chunks`);

      // Clear legacy world data
      for (let i = 0; ; i++) {
        const chunkKey = `${STORAGE_KEYS.WORLDS}_${i}`;
        if (localStorage.getItem(chunkKey) === null) break;
        localStorage.removeItem(chunkKey);
      }
      localStorage.removeItem(`${STORAGE_KEYS.WORLDS}_compressed`);
      localStorage.removeItem(`${STORAGE_KEYS.WORLDS}_chunks`);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error('Failed to clear local storage');
    }
  }
}

export const localStorageService = LocalStorageService.getInstance();
