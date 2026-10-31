// Small helpers for friendly English.

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export function capitalised(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "1 account", "2 accounts"; pass the plural when it isn't just an added s. */
export function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
