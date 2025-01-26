import { World, Factory, STORAGE_KEYS } from '../types/storage';
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
   * Saves worlds data to local storage with chunking and compression
   */
  saveWorlds(worlds: World[]): void {
    if (!this.isLocalStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      const data = JSON.stringify(worlds);
      const { compressed, data: processedData } = this.maybeCompressData(data);

      // Clear any existing chunks
      for (let i = 0; ; i++) {
        const chunkKey = `${STORAGE_KEYS.WORLDS}_${i}`;
        if (localStorage.getItem(chunkKey) === null) break;
        localStorage.removeItem(chunkKey);
      }

      // Store compression flag
      localStorage.setItem(`${STORAGE_KEYS.WORLDS}_compressed`, String(compressed));

      // Split and store data in chunks if necessary
      const chunks = this.splitIntoChunks(processedData);
      chunks.forEach((chunk, index) => {
        localStorage.setItem(`${STORAGE_KEYS.WORLDS}_${index}`, chunk);
      });

      // Store chunk count
      localStorage.setItem(`${STORAGE_KEYS.WORLDS}_chunks`, String(chunks.length));
    } catch (error) {
      console.error('Failed to save worlds:', error);
      throw new Error('Failed to save worlds to local storage');
    }
  }

  /**
   * Retrieves worlds data from local storage, handling chunks and decompression
   */
  getWorlds(): World[] {
    if (!this.isLocalStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
      // Get compression flag and chunk count
      const wasCompressed = localStorage.getItem(`${STORAGE_KEYS.WORLDS}_compressed`) === 'true';
      const chunkCount = Number(localStorage.getItem(`${STORAGE_KEYS.WORLDS}_chunks`));

      if (isNaN(chunkCount)) {
        return []; // No data stored yet
      }

      // Retrieve and combine chunks
      let combinedData = '';
      for (let i = 0; i < chunkCount; i++) {
        const chunk = localStorage.getItem(`${STORAGE_KEYS.WORLDS}_${i}`);
        if (chunk === null) {
          throw new Error(`Missing chunk ${i}`);
        }
        combinedData += chunk;
      }

      // Decompress if necessary
      const decompressedData = this.maybeDecompressData(combinedData, wasCompressed);
      if (!decompressedData) {
        return [];
      }

      return JSON.parse(decompressedData);
    } catch (error) {
      console.error('Failed to retrieve worlds:', error);
      throw new Error('Failed to retrieve worlds from local storage');
    }
  }

  /**
   * Updates a specific world in storage
   */
  updateWorld(world: World): void {
    const worlds = this.getWorlds();
    const index = worlds.findIndex(w => w.id === world.id);
    
    if (index === -1) {
      worlds.push(world);
    } else {
      worlds[index] = world;
    }

    this.saveWorlds(worlds);
  }

  /**
   * Deletes a world from storage
   */
  deleteWorld(worldId: string): void {
    const worlds = this.getWorlds();
    const filteredWorlds = worlds.filter(w => w.id !== worldId);
    this.saveWorlds(filteredWorlds);
  }

  /**
   * Updates a factory within a world
   */
  updateFactory(worldId: string, factory: Factory): void {
    const worlds = this.getWorlds();
    const worldIndex = worlds.findIndex(w => w.id === worldId);
    
    if (worldIndex === -1) {
      throw new Error(`World with ID ${worldId} not found`);
    }

    const factoryIndex = worlds[worldIndex].factories.findIndex(f => f.id === factory.id);
    
    if (factoryIndex === -1) {
      worlds[worldIndex].factories.push(factory);
    } else {
      worlds[worldIndex].factories[factoryIndex] = factory;
    }

    worlds[worldIndex].lastModified = Date.now();
    this.saveWorlds(worlds);
  }

  /**
   * Deletes a factory from a world
   */
  deleteFactory(worldId: string, factoryId: string): void {
    const worlds = this.getWorlds();
    const worldIndex = worlds.findIndex(w => w.id === worldId);
    
    if (worldIndex === -1) {
      throw new Error(`World with ID ${worldId} not found`);
    }

    worlds[worldIndex].factories = worlds[worldIndex].factories.filter(f => f.id !== factoryId);
    worlds[worldIndex].lastModified = Date.now();
    this.saveWorlds(worlds);
  }

  /**
   * Clears all stored data
   */
  clearAll(): void {
    if (!this.isLocalStorageAvailable()) {
      throw new Error('Local storage is not available');
    }

    try {
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
