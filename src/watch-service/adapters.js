// Stores and mailers that run anywhere. Host-specific ones (Netlify Blobs)
// live next to their host in netlify/functions.
export class MemoryStore {
    records = new Map();
    async get(id) {
        const r = this.records.get(id);
        return r ? JSON.parse(r) : null;
    }
    async put(record) {
        this.records.set(record.id, JSON.stringify(record));
    }
    async delete(id) {
        this.records.delete(id);
    }
    async ids() {
        return [...this.records.keys()];
    }
}
/** Collects mail in memory: for tests, and for the local outbox. */
export class OutboxMailer {
    sent = [];
    async send(mail) {
        this.sent.push(mail);
    }
}
/** Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email). */
export class ResendMailer {
    apiKey;
    from;
    constructor(apiKey, from) {
        this.apiKey = apiKey;
        this.from = from;
    }
    async send(mail) {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: this.from, to: [mail.to], subject: mail.subject, text: mail.text }),
        });
        if (!res.ok)
            throw new Error(`Email could not be sent (${res.status}).`);
    }
}
