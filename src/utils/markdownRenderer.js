// Robust, styled Markdown parser for TechTink Blog & Editor
export function renderMarkdownToHtml(markdown) {
  if (!markdown) return '';

  let html = String(markdown);

  // Normalize newlines
  html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Code blocks (protect them first)
  const codeBlocks = [];
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gim, (_, lang, code) => {
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
    codeBlocks.push(`
      <pre style="background: rgba(15, 23, 42, 0.9); border: 1px solid var(--border-glass); border-radius: 10px; padding: 18px; overflow-x: auto; font-family: var(--font-code); font-size: 0.875rem; color: #38bdf8; margin: 24px 0; direction: ltr; text-align: left;"><code>${escapeHtml(code.trim())}</code></pre>
    `);
    return placeholder;
  });

  // Callout boxes: > [!NOTE], > [!TIP], > [!WARNING], > [!IMPORTANT]
  html = html.replace(
    /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*?)(?=\n\n|\n(?!>)|$)/gim,
    (_, type, content) => {
      const cleanContent = content.replace(/^>\s?/gm, '').trim();
      const colors = {
        NOTE: { bg: 'rgba(56, 189, 248, 0.1)', border: '#38bdf8', icon: 'ℹ️', title: 'یادداشت' },
        TIP: { bg: 'rgba(34, 197, 94, 0.1)', border: '#22c55e', icon: '💡', title: 'نکته کاربردی' },
        IMPORTANT: { bg: 'rgba(168, 85, 247, 0.1)', border: '#a855f7', icon: '⭐', title: 'نکته مهم' },
        WARNING: { bg: 'rgba(234, 179, 8, 0.1)', border: '#eab308', icon: '⚠️', title: 'هشدار' },
        CAUTION: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '🚨', title: 'توجه ویژه' },
      };
      const c = colors[type.toUpperCase()] || colors.NOTE;
      return `<div style="background: ${c.bg}; border-right: 4px solid ${c.border}; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
        <div style="font-weight: 700; color: ${c.border}; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
          <span>${c.icon}</span> <span>${c.title}</span>
        </div>
        <div style="color: var(--text-primary); font-size: 0.95rem; line-height: 1.8;">${cleanContent}</div>
      </div>`;
    }
  );

  // Markdown Tables:
  html = html.replace(
    /((\|.+?\|\n)+)/g,
    (tableMatch) => {
      const lines = tableMatch.trim().split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2 && lines[1].includes('---')) {
        const headers = lines[0].split('|').slice(1, -1).map(h => h.trim());
        const rows = lines.slice(2).map(line => line.split('|').slice(1, -1).map(c => c.trim()));
        let tHtml = '<div style="overflow-x: auto; margin: 28px 0;"><table style="width: 100%; border-collapse: collapse; border: 1px solid var(--border-glass); border-radius: 8px; overflow: hidden; font-size: 0.9rem;">';
        tHtml += '<thead><tr style="background: rgba(255,255,255,0.06); border-bottom: 2px solid var(--border-glass);">';
        headers.forEach(h => {
          tHtml += `<th style="padding: 12px 16px; text-align: right; font-weight: 700; color: hsl(var(--accent-cyan));">${h}</th>`;
        });
        tHtml += '</tr></thead><tbody>';
        rows.forEach((r, idx) => {
          tHtml += `<tr style="border-bottom: 1px solid var(--border-glass); background: ${idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'};">`;
          r.forEach(cell => {
            tHtml += `<td style="padding: 12px 16px; color: var(--text-secondary);">${cell}</td>`;
          });
          tHtml += '</tr>';
        });
        tHtml += '</tbody></table></div>';
        return tHtml;
      }
      return tableMatch;
    }
  );

  // Videos: Aparat and YouTube
  // Syntax 1: !video[عنوان ویدیو](https://www.aparat.com/v/XXXX یا https://youtu.be/XXXX)
  // Syntax 2: @[aparat](url_or_hash) or @[youtube](url_or_id)
  html = html.replace(/!video\[(.*?)\]\((.*?)\)/gim, (_, title, url) => getVideoEmbedHtml(url, title));
  html = html.replace(/@\[(aparat|youtube)\]\((.*?)\)/gim, (_, platform, url) => getVideoEmbedHtml(url, ''));

  // Standalone Aparat or YouTube links on their own line
  html = html.replace(/^(https?:\/\/(?:www\.)?(?:aparat\.com\/(?:v\/|video\/video\/embed\/videohash\/)[a-zA-Z0-9_-]+|youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}|youtu\.be\/[a-zA-Z0-9_-]{11}))$/gim, (url) => getVideoEmbedHtml(url, ''));

  // Images in the middle of article: ![alt](url)
  html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, (_, alt, url) => {
    // If user typed !video or passed a video link in standard image syntax by accident, convert to video
    if (alt.toLowerCase().includes('video') || url.includes('aparat.com') || url.includes('youtube.com') || url.includes('youtu.be')) {
      return getVideoEmbedHtml(url, alt);
    }
    return `<figure style="margin: 32px 0; text-align: center;">
      <img src="${url.trim()}" alt="${alt.trim()}" style="max-width: 100%; height: auto; max-height: 520px; border-radius: 14px; object-fit: cover; box-shadow: 0 12px 32px rgba(0,0,0,0.2); border: 1px solid var(--border-glass); display: block; margin: 0 auto;" loading="lazy" />
      ${alt.trim() ? `<figcaption style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">📷 ${alt.trim()}</figcaption>` : ''}
    </figure>`;
  });

  // Standard Blockquotes: > quote
  html = html.replace(/^>\s?(.*)$/gim, '<blockquote style="border-right: 4px solid hsl(var(--accent-purple)); background: rgba(168, 85, 247, 0.05); padding: 16px 20px; margin: 24px 0; border-radius: 6px; color: var(--text-primary); font-size: 1.05rem; line-height: 1.8;">$1</blockquote>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.35rem; margin: 28px 0 14px; color: var(--text-primary); font-weight: 700;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.75rem; margin: 36px 0 18px; color: hsl(var(--accent-cyan)); font-weight: 800; border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="font-size: 2.2rem; margin: 40px 0 20px; color: var(--text-primary); font-weight: 900;">$1</h1>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid var(--border-glass); margin: 36px 0;" />');

  // Inline formatting
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong style="color: var(--text-primary); font-weight: 700;">$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong style="color: var(--text-primary); font-weight: 700;">$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em style="color: var(--text-primary);">$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em style="color: var(--text-primary);">$1</em>');
  html = html.replace(/~~(.*?)~~/gim, '<del style="color: var(--text-secondary);">$1</del>');
  html = html.replace(/`([^`]+)`/gim, '<code style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: var(--font-code); font-size: 0.85em; color: hsl(var(--accent-cyan)); direction: ltr; display: inline-block;">$1</code>');

  // Links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: hsl(var(--accent-cyan)); text-decoration: underline; text-underline-offset: 4px;">$1</a>');

  // Unordered list
  html = html.replace(/(?:^\s*[-*]\s+(.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => l.replace(/^\s*[-*]\s+/, '').trim());
    return `<ul style="padding-right: 24px; margin: 20px 0; color: var(--text-secondary); line-height: 1.9; list-style-type: disc;">${items.map(it => `<li style="margin-bottom: 6px;">${it}</li>`).join('')}</ul>`;
  });

  // Ordered list
  html = html.replace(/(?:^\s*\d+\.\s+(.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => l.replace(/^\s*\d+\.\s+/, '').trim());
    return `<ol style="padding-right: 24px; margin: 20px 0; color: var(--text-secondary); line-height: 1.9; list-style-type: decimal;">${items.map(it => `<li style="margin-bottom: 6px;">${it}</li>`).join('')}</ol>`;
  });

  // Paragraphs
  const blocks = html.split(/\n{2,}/);
  html = blocks.map(b => {
    b = b.trim();
    if (!b) return '';
    if (b.startsWith('<h1') || b.startsWith('<h2') || b.startsWith('<h3') ||
        b.startsWith('<ul') || b.startsWith('<ol') || b.startsWith('<blockquote') ||
        b.startsWith('<figure') || b.startsWith('<div') || b.startsWith('<hr') ||
        b.startsWith('<table') || b.startsWith('__CODE_BLOCK_')) {
      return b;
    }
    return `<p style="margin-bottom: 20px; color: var(--text-secondary); line-height: 1.9; font-size: 1.05rem;">${b.replace(/\n/g, '<br />')}</p>`;
  }).join('\n\n');

  // Restore code blocks
  codeBlocks.forEach((code, i) => {
    html = html.replace(`__CODE_BLOCK_${i}__`, code);
  });

  return html;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getVideoEmbedHtml(url, title = '') {
  const cleanUrl = String(url || '').trim();
  if (!cleanUrl) return '';

  // Aparat detection
  // Format: aparat.com/v/XXXX or aparat.com/video/video/embed/videohash/XXXX/vt/frame or just hash
  const aparatMatch = cleanUrl.match(/aparat\.com\/(?:v\/|video\/video\/embed\/videohash\/)?([a-zA-Z0-9_-]+)/i);
  if (aparatMatch || cleanUrl.startsWith('aparat:')) {
    const hash = cleanUrl.startsWith('aparat:') ? cleanUrl.replace('aparat:', '').trim() : aparatMatch[1];
    return `
      <div class="video-embed-wrapper" style="margin: 32px 0; text-align: center;">
        <div style="position: relative; width: 100%; max-width: 860px; margin: 0 auto; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.3); border: 1px solid var(--border-glass); background: #000;">
          <iframe 
            src="https://www.aparat.com/video/video/embed/videohash/${hash}/vt/frame" 
            title="${escapeHtml(title || 'ویدیو آپارات')}"
            allowFullScreen="true" 
            webkitallowfullscreen="true" 
            mozallowfullscreen="true" 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
          ></iframe>
        </div>
        ${title ? `<div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 6px;"><span>▶️</span> <span>${escapeHtml(title)}</span> <span class="badge" style="background: #ea1d5d; color: white; font-size: 0.7rem; padding: 2px 6px;">آپارات</span></div>` : ''}
      </div>
    `;
  }

  // YouTube detection
  // Format: youtube.com/watch?v=XXXX or youtu.be/XXXX or youtube.com/embed/XXXX
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (ytMatch || cleanUrl.startsWith('youtube:')) {
    const ytId = cleanUrl.startsWith('youtube:') ? cleanUrl.replace('youtube:', '').trim() : ytMatch[1];
    return `
      <div class="video-embed-wrapper" style="margin: 32px 0; text-align: center;">
        <div style="position: relative; width: 100%; max-width: 860px; margin: 0 auto; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 14px; box-shadow: 0 12px 36px rgba(0,0,0,0.3); border: 1px solid var(--border-glass); background: #000;">
          <iframe 
            src="https://www.youtube-nocookie.com/embed/${ytId}" 
            title="${escapeHtml(title || 'ویدیوی یوتیوب')}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen="true"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
          ></iframe>
        </div>
        ${title ? `<div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 6px;"><span>▶️</span> <span>${escapeHtml(title)}</span> <span class="badge" style="background: #ff0000; color: white; font-size: 0.7rem; padding: 2px 6px;">YouTube</span></div>` : ''}
      </div>
    `;
  }

  return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" style="color: hsl(var(--accent-cyan));">${title || cleanUrl}</a>`;
}

