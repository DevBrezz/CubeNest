/** Client-only stores (work without backend). */

export type DownloadRecord = {
  id: string;
  title: string;
  url: string;
  platform?: string;
  at: string;
};

export type WhitelistItem = {
  id: string;
  title: string;
  url?: string;
  note?: string;
  at: string;
};

const DL_KEY = 'cubenest-downloads';
const WL_KEY = 'cubenest-whitelist';

export function getDownloads(): DownloadRecord[] {
  try {
    return JSON.parse(localStorage.getItem(DL_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addDownload(rec: Omit<DownloadRecord, 'at' | 'id'> & { id?: string }) {
  const list = getDownloads().filter((d) => d.url !== rec.url);
  list.unshift({
    id: rec.id || `dl-${Date.now()}`,
    title: rec.title,
    url: rec.url,
    platform: rec.platform,
    at: new Date().toISOString(),
  });
  localStorage.setItem(DL_KEY, JSON.stringify(list.slice(0, 100)));
}

export function clearDownloads() {
  localStorage.removeItem(DL_KEY);
}

export function getWhitelist(): WhitelistItem[] {
  try {
    return JSON.parse(localStorage.getItem(WL_KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleWhitelist(item: Omit<WhitelistItem, 'at'>) {
  const list = getWhitelist();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    localStorage.setItem(WL_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...item, at: new Date().toISOString() });
  localStorage.setItem(WL_KEY, JSON.stringify(list.slice(0, 200)));
  return true;
}

export function isWhitelisted(id: string) {
  return getWhitelist().some((x) => x.id === id);
}
