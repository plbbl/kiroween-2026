import type { JarFile } from '../core/jar.ts';
import data from './demo.json';

export interface DemoCard {
  name: string;
  hasLetter: boolean;
  shard: string;
  shardWords: string;
  seal: string;
  sealWords: string;
}

export const DEMO_JAR = data.jar as JarFile;
export const DEMO_CARDS = data.cards as DemoCard[];

export function isDemo(jar: JarFile): boolean {
  return jar.jarId === DEMO_JAR.jarId;
}
