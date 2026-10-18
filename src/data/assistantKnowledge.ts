export type AssistantEntry = {
  id: string;
  category: string;
  question: string;
  answer: string;
  action?: { label: string; to: string };
};

/** @deprecated alias for older imports */
export type AssistantItem = AssistantEntry;

/** CubeNest help — how to use the platform. No portfolio / author identity. */
export const ASSISTANT_KNOWLEDGE: AssistantEntry[] = [
  {
    id: 'search-mods',
    category: 'Download',
    question: 'How do I search for mods?',
    answer: 'Open Mods, choose Java or Bedrock, then pick a category. Use the search box. Open a project for versions and download links from Modrinth or MCPEDL.',
    action: { label: 'Open Mods', to: '/mods' },
  },
  {
    id: 'download-mod',
    category: 'Download',
    question: 'How do I download a mod or pack?',
    answer: 'Open the project page, check Versions, and use Download. Files are hosted by Modrinth or MCPEDL — CubeNest does not re-host files. Match loader and game version.',
  },
  {
    id: 'java-vs-bedrock',
    category: 'Platform',
    question: 'What do the Java and Bedrock badges mean?',
    answer: 'Java is for Minecraft Java Edition content (often Fabric/Forge/NeoForge/Quilt). Bedrock opens the MCPEDL path for Bedrock Edition content. Always verify compatibility on the project page.',
    action: { label: 'Browse by platform', to: '/mods' },
  },
  {
    id: 'bedrock-mcpedl',
    category: 'Download',
    question: 'How do I get Bedrock content from MCPEDL?',
    answer: 'Go to Mods → Bedrock (or /bedrock). Search or open a category. Downloads open on MCPEDL because they have no public API for embedding files on CubeNest.',
    action: { label: 'Bedrock hub', to: '/bedrock' },
  },
  {
    id: 'plugins',
    category: 'Download',
    question: 'How do I find server plugins?',
    answer: 'Open Plugins. Default is Global (SpigotMC + Modrinth). Filter by source if needed, then open a card for the official download page.',
    action: { label: 'Open Plugins', to: '/plugins' },
  },
  {
    id: 'install-plugin',
    category: 'Install',
    question: 'How do I install a plugin on my server?',
    answer: 'Download the jar from SpigotMC or Modrinth. Stop the server, put the file in the plugins folder, start the server. Check dependencies on the project page. Back up first.',
  },
  {
    id: 'install-mod',
    category: 'Install',
    question: 'How do I install a Java mod?',
    answer: 'Install a matching mod loader (Fabric, Forge, NeoForge, or Quilt). Download the correct game version, put the file in the mods folder, then launch.',
  },
  {
    id: 'skins',
    category: 'Download',
    question: 'How do I download a skin?',
    answer: 'Open Skins, enter a Minecraft username, then Download PNG. You can also browse NameMC, Laby, or create a skin on Nova Skin.',
    action: { label: 'Open Skins', to: '/skins' },
  },
  {
    id: 'servers',
    category: 'Servers',
    question: 'How do I join a server from the list?',
    answer: 'Open Servers, find a listing, click Copy IP, paste it in Minecraft multiplayer. You can react with emoji or open the vote link on external server lists.',
    action: { label: 'Server list', to: '/servers' },
  },
  {
    id: 'upload',
    category: 'Publish',
    question: 'How do I upload or publish my own content?',
    answer: 'CubeNest does not host uploads. Publish on Modrinth, SpigotMC, or MCPEDL following their rules. Public projects can then appear in searches that use those platforms.',
  },
  {
    id: 'report-bug',
    category: 'Help',
    question: 'How do I report a bug on CubeNest?',
    answer: 'Open Report center, choose the issue type, describe steps to reproduce, and submit. Do not include passwords or private tokens.',
    action: { label: 'Report center', to: '/report' },
  },
  {
    id: 'contact-team',
    category: 'Help',
    question: 'How do I contact the CubeNest team?',
    answer: 'Open Contact team for general questions. Use Report center for bugs so the team gets structured details.',
    action: { label: 'Contact team', to: '/contact' },
  },
  {
    id: 'empty-plugins',
    category: 'Troubleshooting',
    question: 'Why is the Plugins page empty?',
    answer: 'The catalogue loads from /data/resources.json. If deploy only uploaded source files instead of the Vite build, that file is missing. Redeploy with GitHub Actions build.',
    action: { label: 'Contact team', to: '/contact' },
  },
  {
    id: 'download-fail',
    category: 'Troubleshooting',
    question: 'Download button does not work',
    answer: 'Downloads point to Modrinth, SpigotMC, or MCPEDL. If a link fails, open the project on the original site. Report broken links via Report center.',
    action: { label: 'Report issue', to: '/report' },
  },
];

/** Alias used by the assistant UI */
export const assistantKnowledge: AssistantEntry[] = ASSISTANT_KNOWLEDGE;

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
