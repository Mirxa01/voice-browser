import { StorageEnum } from '../base/enums';
import { createStorage } from '../base/base';
import type { BaseStorage } from '../base/types';

// Stored credential for a website
// Note: In production, passwords should be encrypted. This implementation stores passwords
// in Chrome's extension storage which provides some level of protection.
export interface StoredCredential {
  id: string;
  site: string; // Website domain or service name
  username: string;
  password: string; // Stored in Chrome's secure extension storage
  createdAt: number;
  lastUsed?: number;
}

// Interface for user profile configuration with auto-fill data
export interface UserProfile {
  userId: string;

  // Personal information for form filling
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;

  // Address information
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  // Stored credentials
  credentials?: StoredCredential[];
}

export type UserStorage = BaseStorage<UserProfile> & {
  createProfile: (profile: Partial<UserProfile>) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  getProfile: () => Promise<UserProfile>;
  getUserId: () => Promise<string>;
  // Credential management
  addCredential: (credential: Omit<StoredCredential, 'id' | 'createdAt'>) => Promise<void>;
  updateCredential: (id: string, credential: Partial<StoredCredential>) => Promise<void>;
  removeCredential: (id: string) => Promise<void>;
  getCredentials: () => Promise<StoredCredential[]>;
  getCredentialForSite: (site: string) => Promise<StoredCredential | undefined>;
  // Form data helpers
  getFormData: () => Promise<Partial<UserProfile>>;
};

// Default profile
export const DEFAULT_USER_PROFILE: UserProfile = {
  userId: 'unknown',
  credentials: [],
};

const storage = createStorage<UserProfile>('user-profile', DEFAULT_USER_PROFILE, {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const userStore: UserStorage = {
  ...storage,

  async createProfile(profile: Partial<UserProfile>) {
    const fullProfile = {
      ...DEFAULT_USER_PROFILE,
      ...profile,
    };
    await storage.set(fullProfile);
  },

  async updateProfile(profile: Partial<UserProfile>) {
    const currentProfile = (await storage.get()) || DEFAULT_USER_PROFILE;
    await storage.set({
      ...currentProfile,
      ...profile,
    });
  },

  async getProfile() {
    const profile = await storage.get();
    return profile || DEFAULT_USER_PROFILE;
  },

  async getUserId() {
    const profile = await this.getProfile();
    if (!profile.userId || profile.userId === 'unknown') {
      const newUserId = crypto.randomUUID();
      await this.updateProfile({ userId: newUserId });
      return newUserId;
    }
    return profile.userId;
  },

  async addCredential(credential: Omit<StoredCredential, 'id' | 'createdAt'>) {
    const profile = await this.getProfile();
    const newCredential: StoredCredential = {
      ...credential,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    const credentials = profile.credentials || [];
    await this.updateProfile({
      credentials: [...credentials, newCredential],
    });
  },

  async updateCredential(id: string, updates: Partial<StoredCredential>) {
    const profile = await this.getProfile();
    const credentials = (profile.credentials || []).map(cred => (cred.id === id ? { ...cred, ...updates } : cred));
    await this.updateProfile({ credentials });
  },

  async removeCredential(id: string) {
    const profile = await this.getProfile();
    const credentials = (profile.credentials || []).filter(cred => cred.id !== id);
    await this.updateProfile({ credentials });
  },

  async getCredentials() {
    const profile = await this.getProfile();
    return profile.credentials || [];
  },

  async getCredentialForSite(site: string) {
    const credentials = await this.getCredentials();
    // Find credential that matches the site (case insensitive, partial match)
    const siteLower = site.toLowerCase();
    return credentials.find(
      cred => cred.site.toLowerCase().includes(siteLower) || siteLower.includes(cred.site.toLowerCase()),
    );
  },

  async getFormData() {
    const profile = await this.getProfile();
    // Return only the form-fillable fields
    return {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      street: profile.street,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zipCode,
      country: profile.country,
    };
  },
};
