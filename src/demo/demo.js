import data from './demo.json';
export const DEMO_JAR = data.jar;
export const DEMO_CARDS = data.cards;
export function isDemo(jar) {
    return jar.jarId === DEMO_JAR.jarId;
}
