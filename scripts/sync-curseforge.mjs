/** Best-effort public CurseForge creator-page sync. No API key required. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'public/data/curseforge.json');
const profile = 'https://www.curseforge.com/members/kingbrezzx/projects';
const previous = (() => { try { return JSON.parse(readFileSync(output, 'utf8')); } catch { return { resources: [] }; } })();
function decode(s) { return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' '); }
function plain(s) { return decode(s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')).trim(); }
function classify(path, title, snippet) {
 const x = `${path} ${title} ${snippet}`.toLowerCase();
 if (/texture|resource-packs/.test(x)) return 'texture';
 if (/shader/.test(x)) return 'shaders';
 if (/skin/.test(x)) return 'skins';
 if (/addon|addons|behavior-packs|mc-addons/.test(x)) return 'addons';
 return 'mods';
}
function edition(title, path, snippet) {
 const x = `${title} ${path} ${snippet}`.toLowerCase();
 const java = /java edition|forge|fabric|neoforge|quilt|optifine/.test(x);
 const bedrock = /bedrock|mcpe|pocket edition|behavior pack|mcaddon/.test(x);
 return java && bedrock ? 'Both' : java ? 'Java' : bedrock ? 'Bedrock' : 'Unknown';
}
async function main() {
 const response = await fetch(profile, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; KingBrezzPortfolio/1.0)', accept: 'text/html' } });
 if (!response.ok) throw new Error(`CurseForge profile returned ${response.status}`);
 const html = await response.text();
 if (/captcha|cloudflare challenge|just a moment/i.test(html) && !html.includes('data-project-id')) throw new Error('CurseForge page may be protected by an anti-bot challenge');
 const found = new Map();
 // The creator page may contain multiple card layouts; support common CurseForge URL patterns.
 const re = /<a\b([^>]*?)href="(\/minecraft\/(?:mc-mods|texture-packs|shaders|customization|mc-addons|skins)\/([^"/?#]+)(?:\/[^"#]*)?)"([^>]*)>([\s\S]*?)<\/a>/gi;
 let m;
 while ((m = re.exec(html))) {
   const attrs = `${m[1]} ${m[4]}`;
   const path = m[2];
   const slug = m[3];
   const title = plain(m[5]);
   if (!title || title.length > 180 || /^(view|download|more)$/i.test(title)) continue;
   const around = html.slice(Math.max(0, m.index - 800), Math.min(html.length, re.lastIndex + 800));
   const image = around.match(/(?:src|data-src)="(https?:[^" ]+\.(?:png|jpe?g|webp)(?:\?[^" ]*)?)"/i)?.[1] || null;
   const desc = plain(around.match(/(?:title|aria-label)="([^"]{15,300})"/i)?.[1] || 'Minecraft resource published by KingBrezzX on CurseForge.');
   const cat = classify(path, title, desc);
   const url = `https://www.curseforge.com${path}`;
   found.set(url, { id: `curseforge-${slug}`, title, description: desc.slice(0, 240), url, icon: image, category: cat, edition: edition(title, path, desc), updated: new Date().toISOString() });
 }
 // Preserve the last known good catalogue when the page layout changes or is blocked.
 if (!found.size && (previous.resources || []).length) throw new Error('No project cards detected; preserving previous CurseForge catalogue');
 const resources = [...found.values()];
 writeFileSync(output, JSON.stringify({ lastSynced: new Date().toISOString(), source: profile, resources }, null, 2));
 console.log(`CurseForge: synced ${resources.length} resource links`);
}
main().catch(error => { console.error('CurseForge sync failed:', error.message); if (!existsSync(output)) writeFileSync(output, JSON.stringify({ lastSynced: null, source: profile, resources: [] }, null, 2)); });
