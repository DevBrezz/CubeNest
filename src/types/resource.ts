export type Platform = 'modrinth' | 'spigot' | 'custom';

export interface Resource {
  id: string;
  platform: Platform;
  platformId: string;
  slug: string;
  title: string;
  description: string;
  body?: string;
  icon: string | null;
  gallery: string[];
  categories: string[];
  loaders: string[];
  gameVersions: string[];
  version: string;
  downloads: number;
  published: string;
  updated: string;
  url: string;
  downloadUrl: string;
  featured: boolean;
  hidden: boolean;
}

export interface ResourcesData {
  lastSynced: string;
  sources: {
    modrinth: { status: string; count: number; lastSuccess: string };
    spigot: { status: string; count: number; lastSuccess: string; note?: string };
  };
  resources: Resource[];
}

export type SortOption = 'newest' | 'updated' | 'downloads' | 'alphabetical';
export type PlatformFilter = 'all' | Platform;
