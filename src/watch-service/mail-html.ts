// The HTML part of an email, made from its plain text. The text stays the
// source: it reads the same in any mail app, and the HTML adds only a clear
// button for the one thing the email asks, and links you can tap. No images,
// no tracking, no remote styles.

import type { Mail } from './service.ts';

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const URL_RE = /https?:\/\/[^\s<>"]+/g;

/** Long one-time links read better as what they do; the plain text keeps the address. */
const NAMED: Record<string, string> = { manage: 'Manage my watch', optout: 'Take me off this watch' };

function linkText(url: string): string {
  const action = /#\/watch\?(\w+)=/.exec(url)?.[1];
  return (action && NAMED[action]) || url;
}

/** Escapes a line of text and makes its web addresses into links. */
function inline(line: string, plain = false): string {
  let out = '';
  let last = 0;
  for (const m of line.matchAll(URL_RE)) {
    // A full stop or comma after an address ends the sentence, not the address.
    const url = m[0].replace(/[.,;:!?)]+$/, '');
    out += escape(line.slice(last, m.index));
    out += `<a href="${escape(url)}" style="color:#6a2ee0;word-break:break-all">${escape(plain ? url : linkText(url))}</a>`;
    last = m.index + url.length;
  }
  return out + escape(line.slice(last));
}

function button(label: string, url: string): string {
  return (
    `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 20px"><tr>` +
    `<td style="border-radius:999px;background:#6a2ee0">` +
    `<a href="${escape(url)}" style="display:inline-block;padding:14px 28px;border-radius:999px;color:#ffffff;font-weight:700;font-size:16px;text-decoration:none">${escape(label)}</a>` +
    `</td></tr></table>`
  );
}

export function mailHtml(mail: Mail): string {
  const blocks = mail.text.trim().split(/\n{2,}/);
  const body = blocks
    .map((block) => {
      const lines = block.split('\n');
      const at = mail.action ? lines.findIndex((l) => l.trim() === mail.action!.url) : -1;
      if (at === -1) return `<p style="margin:0 0 16px">${lines.map((l) => inline(l)).join('<br>')}</p>`;
      const before = lines.slice(0, at);
      const after = lines.slice(at + 1);
      return (
        (before.length ? `<p style="margin:0 0 12px">${before.map((l) => inline(l)).join('<br>')}</p>` : '') +
        button(mail.action!.label, mail.action!.url) +
        (after.length ? `<p style="margin:0 0 16px">${after.map((l) => inline(l)).join('<br>')}</p>` : '')
      );
    })
    .join('\n');
  // If the button's address is long and the mail app hides the button, the
  // address still sits below it, in small print.
  const fallback = mail.action
    ? `<p style="margin:0 0 16px;font-size:13px;color:#6b6475">Button not working? Copy this address into your browser:<br>${inline(mail.action.url, true)}</p>`
    : '';
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light"><title>${escape(mail.subject)}</title></head>` +
    `<body style="margin:0;padding:0;background:#f4effb">` +
    `<div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#1a1420">` +
    `<div style="background:#ffffff;border-radius:16px;padding:28px 24px">${body}${fallback}</div>` +
    `</div></body></html>`
  );
}
