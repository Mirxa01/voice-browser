import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

// A learned pattern from successful task execution
export interface LearnedPattern {
  id: string;
  // The task type or category
  taskType: string;
  // The site or domain where this pattern was learned
  domain: string;
  // Description of the pattern
  description: string;
  // Selector patterns that worked
  selectors?: string[];
  // Sequence of actions that succeeded
  actionSequence?: string[];
  // Number of times this pattern was successfully used
  successCount: number;
  // Last time this pattern was used
  lastUsed: number;
  // When this pattern was first learned
  createdAt: number;
}

// User preferences learned from behavior
export interface UserPreference {
  key: string;
  value: string;
  learnedFrom: string; // Context where this was learned
  confidence: number; // 0-1 confidence score
  lastUpdated: number;
}

// Memory settings
export interface MemorySettings {
  enabled: boolean;
  maxPatterns: number;
  maxPreferences: number;
}

// The complete memory storage structure
export interface AgentMemory {
  settings: MemorySettings;
  patterns: LearnedPattern[];
  preferences: UserPreference[];
}

export const DEFAULT_MEMORY_SETTINGS: MemorySettings = {
  enabled: true,
  maxPatterns: 100,
  maxPreferences: 50,
};

export const DEFAULT_AGENT_MEMORY: AgentMemory = {
  settings: DEFAULT_MEMORY_SETTINGS,
  patterns: [],
  preferences: [],
};

export type MemoryStorage = BaseStorage<AgentMemory> & {
  // Settings
  getSettings: () => Promise<MemorySettings>;
  updateSettings: (settings: Partial<MemorySettings>) => Promise<void>;
  isEnabled: () => Promise<boolean>;

  // Patterns
  addPattern: (pattern: Omit<LearnedPattern, 'id' | 'createdAt' | 'successCount'>) => Promise<void>;
  updatePatternSuccess: (id: string) => Promise<void>;
  getPatterns: () => Promise<LearnedPattern[]>;
  getPatternsForDomain: (domain: string) => Promise<LearnedPattern[]>;
  getPatternsForTaskType: (taskType: string) => Promise<LearnedPattern[]>;
  removePattern: (id: string) => Promise<void>;

  // Preferences
  setPreference: (preference: Omit<UserPreference, 'lastUpdated'>) => Promise<void>;
  getPreference: (key: string) => Promise<UserPreference | undefined>;
  getAllPreferences: () => Promise<UserPreference[]>;
  removePreference: (key: string) => Promise<void>;

  // Clear all
  clearMemory: () => Promise<void>;
  getMemoryStats: () => Promise<{ patternCount: number; preferenceCount: number }>;
};

const storage = createStorage<AgentMemory>('agent-memory', DEFAULT_AGENT_MEMORY, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const memoryStore: MemoryStorage = {
  ...storage,

  async getSettings() {
    const memory = await storage.get();
    return memory.settings || DEFAULT_MEMORY_SETTINGS;
  },

  async updateSettings(settings: Partial<MemorySettings>) {
    const memory = await storage.get();
    await storage.set({
      ...memory,
      settings: {
        ...DEFAULT_MEMORY_SETTINGS,
        ...memory.settings,
        ...settings,
      },
    });
  },

  async isEnabled() {
    const settings = await this.getSettings();
    return settings.enabled;
  },

  async addPattern(pattern: Omit<LearnedPattern, 'id' | 'createdAt' | 'successCount'>) {
    const memory = await storage.get();
    const settings = memory.settings || DEFAULT_MEMORY_SETTINGS;

    // Check if a similar pattern already exists
    const existingIndex = memory.patterns.findIndex(
      p => p.domain === pattern.domain && p.taskType === pattern.taskType && p.description === pattern.description,
    );

    if (existingIndex >= 0) {
      // Update existing pattern
      memory.patterns[existingIndex].successCount++;
      memory.patterns[existingIndex].lastUsed = Date.now();
      await storage.set(memory);
      return;
    }

    const newPattern: LearnedPattern = {
      ...pattern,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      lastUsed: Date.now(),
      successCount: 1,
    };

    let patterns = [...memory.patterns, newPattern];

    // Enforce max patterns limit by removing oldest
    if (patterns.length > settings.maxPatterns) {
      patterns = patterns.sort((a, b) => b.lastUsed - a.lastUsed).slice(0, settings.maxPatterns);
    }

    await storage.set({ ...memory, patterns });
  },

  async updatePatternSuccess(id: string) {
    const memory = await storage.get();
    const patternIndex = memory.patterns.findIndex(p => p.id === id);
    if (patternIndex >= 0) {
      memory.patterns[patternIndex].successCount++;
      memory.patterns[patternIndex].lastUsed = Date.now();
      await storage.set(memory);
    }
  },

  async getPatterns() {
    const memory = await storage.get();
    return memory.patterns || [];
  },

  async getPatternsForDomain(domain: string) {
    const patterns = await this.getPatterns();
    const domainLower = domain.toLowerCase();
    return patterns.filter(p => p.domain.toLowerCase().includes(domainLower));
  },

  async getPatternsForTaskType(taskType: string) {
    const patterns = await this.getPatterns();
    const typeLower = taskType.toLowerCase();
    return patterns.filter(p => p.taskType.toLowerCase().includes(typeLower));
  },

  async removePattern(id: string) {
    const memory = await storage.get();
    const patterns = memory.patterns.filter(p => p.id !== id);
    await storage.set({ ...memory, patterns });
  },

  async setPreference(preference: Omit<UserPreference, 'lastUpdated'>) {
    const memory = await storage.get();
    const settings = memory.settings || DEFAULT_MEMORY_SETTINGS;
    const existingIndex = memory.preferences.findIndex(p => p.key === preference.key);

    const newPref: UserPreference = {
      ...preference,
      lastUpdated: Date.now(),
    };

    let preferences: UserPreference[];
    if (existingIndex >= 0) {
      preferences = [...memory.preferences];
      preferences[existingIndex] = newPref;
    } else {
      preferences = [...memory.preferences, newPref];
    }

    // Enforce max preferences limit
    if (preferences.length > settings.maxPreferences) {
      preferences = preferences.sort((a, b) => b.lastUpdated - a.lastUpdated).slice(0, settings.maxPreferences);
    }

    await storage.set({ ...memory, preferences });
  },

  async getPreference(key: string) {
    const memory = await storage.get();
    return memory.preferences.find(p => p.key === key);
  },

  async getAllPreferences() {
    const memory = await storage.get();
    return memory.preferences || [];
  },

  async removePreference(key: string) {
    const memory = await storage.get();
    const preferences = memory.preferences.filter(p => p.key !== key);
    await storage.set({ ...memory, preferences });
  },

  async clearMemory() {
    const memory = await storage.get();
    await storage.set({
      settings: memory.settings,
      patterns: [],
      preferences: [],
    });
  },

  async getMemoryStats() {
    const memory = await storage.get();
    return {
      patternCount: memory.patterns?.length || 0,
      preferenceCount: memory.preferences?.length || 0,
    };
  },
};
