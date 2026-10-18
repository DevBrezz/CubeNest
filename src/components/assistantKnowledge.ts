export type AssistantEntry = {
  id: string;
  category: string;
  question: string;
  answer: string;
  action?: { label: string; to: string };
};

/** CubeNest help — how to use the platform. No portfolio / author identity. */
export const ASSISTANT_KNOWLEDGE: AssistantEntry[] = [
  {
    id: 'search-mods',
    category: 'Download',
    question: 'How do I search for mods?',
    answer: 'Open Mods, choose Java or Bedrock, then pick a category (Mods, Maps, Textures, Shaders, Skins). Use the search box to query Modrinth. Open a project for versions and download links.',
    action: { label: 'Open Mods', to: '/mods' },
  },
  {
    id: 'download-mod',
    category: 'Download',
    question: 'How do I download a mod or pack?',
    answer: 'Open the project page, check the Versions tab, and use Download. Files are hosted by Modrinth — CubeNest does not re-host files. Always match loader and game version to your client or server.',
  },
  {
    id: 'java-vs-bedrock',
    category: 'Platform',
    question: 'What do the Java and Bedrock badges mean?',
    answer: 'Java badge means content aimed at Minecraft Java Edition (often Fabric/Forge/NeoForge/Quilt). Bedrock badge means you are browsing the Bedrock path. Always verify compatibility on the project page before installing.',
    action: { label: 'Browse by platform', to: '/mods' },
  },
  {
    id: 'plugins',
    category: 'Download',
    question: 'How do I find server plugins?',
    answer: 'Go to Plugins. Default filter is Global (SpigotMC + Modrinth). Switch to SpigotMC or Modrinth only if you want one source. Open a card for details and the official download page.',
    action: { label: 'Open Plugins', to: '/plugins' },
  },
  {
    id: 'install-plugin',
    category: 'Install',
    question: 'How do I install a plugin on my server?',
    answer: 'Download the jar from the official SpigotMC or Modrinth page. Stop the server, place the file in the plugins folder, then start the server. Read the project page for dependencies and version requirements. Back up first.',
  },
  {
    id: 'install-mod',
    category: 'Install',
    question: 'How do I install a Java mod?',
    answer: 'Install a mod loader (Fabric, Forge, NeoForge, or Quilt) that matches the mod. Download the correct game version from Modrinth, put the file in the mods folder, then launch the game.',
  },
  {
    id: 'resourcepack',
    category: 'Install',
    question: 'How do I apply a resource pack or shader?',
    answer: 'Download from the project page on Modrinth. For resource packs, use Options → Resource Packs. For shaders you typically need a shader loader compatible with your version. Follow the project instructions.',
  },
  {
    id: 'servers',
    category: 'Servers',
    question: 'How do I join a server from the list?',
    answer: 'Open Servers, find a listing, click Copy IP, then paste it in Minecraft multiplayer. Status and player counts come from public APIs when available and may not always be real-time.',
    action: { label: 'Server list', to: '/servers' },
  },
  {
    id: 'upload',
    category: 'Publish',
    question: 'How do I upload or publish my own mod/plugin?',
    answer: 'CubeNest does not host uploads. Publish on Modrinth or SpigotMC following their guidelines. After your project is public there, it can appear in searches that use those platforms.',
  },
  {
    id: 'report-bug',
    category: 'Help',
    question: 'How do I report a bug on CubeNest?',
    answer: 'Open Report center, choose the issue type, describe steps to reproduce, and submit. Do not include passwords or private tokens.',
    action: { label: 'Report center', to: '/report' },
  },
  {
    id: 'empty-plugins',
    category: 'Troubleshooting',
    question: 'Why is the Plugins page empty?',
    answer: 'The catalogue loads from /data/resources.json on the site. If that file is missing after deploy, the list stays empty. Try refresh, or contact the team if it persists.',
    action: { label: 'Contact team', to: '/contact' },
  },
  {
    id: 'download-fail',
    category: 'Troubleshooting',
    question: 'Download button does not work',
    answer: 'Downloads point to Modrinth or SpigotMC. If a link fails, open the project on the original site from the detail page. Report broken links via Report center.',
    action: { label: 'Report issue', to: '/report' },
  },
];

export function searchAssistant(query: string): AssistantEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return ASSISTANT_KNOWLEDGE.slice(0, 6);
  return ASSISTANT_KNOWLEDGE.filter(
    (e) =>
      e.question.toLowerCase().includes(q) ||
      e.answer.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
  ).slice(0, 8);
}
