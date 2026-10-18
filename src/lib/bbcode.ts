/** Minimal safe BBCode → HTML (no scripts). */
export function bbcodeToHtml(input: string): string {
  let s = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const rules: [RegExp, string][] = [
    [/\[b\]([\s\S]*?)\[\/b\]/gi, '<strong>$1</strong>'],
    [/\[i\]([\s\S]*?)\[\/i\]/gi, '<em>$1</em>'],
    [/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>'],
    [/\[s\]([\s\S]*?)\[\/s\]/gi, '<s>$1</s>'],
    [/\[code\]([\s\S]*?)\[\/code\]/gi, '<code class="bb-code">$1</code>'],
    [/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="bb-quote">$1</blockquote>'],
    [/\[url=(https?:\/\/[^\]]+)\]([\s\S]*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>'],
    [/\[url\](https?:\/\/[^\[]+)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'],
    [/\[img\](https?:\/\/[^\[]+)\[\/img\]/gi, '<img src="$1" alt="" class="bb-img" loading="lazy" />'],
    [/\[color=([a-zA-Z]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color:$1">$2</span>'],
    [/\[list\]([\s\S]*?)\[\/list\]/gi, '<ul class="bb-list">$1</ul>'],
    [/\[\*\]([^\[]*)/gi, '<li>$1</li>'],
  ];
  for (const [re, rep] of rules) s = s.replace(re, rep);
  s = s.replace(/\n/g, '<br/>');
  return s;
}
