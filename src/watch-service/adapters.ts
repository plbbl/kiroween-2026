// Stores and mailers that run anywhere. Host-specific ones (Netlify Blobs)
// live next to their host in netlify/functions.

import type { Mail, Mailer, WatchRecord, WatchStore } from './service.ts';

export class MemoryStore implements WatchStore {
  private records = new Map<string, string>();
  async get(id: string) {
    const r = this.records.get(id);
    return r ? (JSON.parse(r) as WatchRecord) : null;
  }
  async put(record: WatchRecord) {
    this.records.set(record.id, JSON.stringify(record));
  }
  async delete(id: string) {
    this.records.delete(id);
  }
  async ids() {
    return [...this.records.keys()];
  }
}

/** Collects mail in memory: for tests, and for the local outbox. */
export class OutboxMailer implements Mailer {
  readonly sent: Mail[] = [];
  async send(mail: Mail) {
    this.sent.push(mail);
  }
}

/** Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email). */
export class ResendMailer implements Mailer {
  private apiKey: string;
  private from: string;
  constructor(apiKey: string, from: string) {
    this.apiKey = apiKey;
    this.from = from;
  }
  async send(mail: Mail) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from, to: [mail.to], subject: mail.subject, text: mail.text }),
    });
    if (!res.ok) throw new Error(`Email could not be sent (${res.status}).`);
  }
}
