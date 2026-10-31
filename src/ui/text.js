// Small helpers for friendly English.
const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
export function numberWord(n) {
    return NUMBER_WORDS[n] ?? String(n);
}
export function capitalised(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
/** "1 account", "2 accounts"; pass the plural when it isn't just an added s. */
export function plural(n, one, many = `${one}s`) {
    return n === 1 ? one : many;
}
export function firstName(name) {
    return name.trim().split(/\s+/)[0] ?? name;
}
