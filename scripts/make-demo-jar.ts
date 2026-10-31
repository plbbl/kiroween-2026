// Generates the demo vessel and its five cards. The output is committed so
// that printed demo cards keep working: run this only to replace them.
//
//   npm run demo:jar

import { writeFileSync } from 'node:fs';
import { cardToQrText, cardToWords } from '../src/core/cards.ts';
import { sealJar } from '../src/core/jar.ts';

const owner = 'June Alder';

const { jar, cards } = await sealJar({
  owner,
  threshold: 3,
  sealedAt: new Date('2026-10-02T09:30:00Z'),
  content: {
    message:
      "If you are reading this, you found each other. Good. That was the whole idea.\n\n" +
      "I am sorry for the trouble of it, and grateful you came. Please do not spend the next days tidying. " +
      "Eat something warm, open the windows, and let the house be loud for a while.\n\n" +
      "Everything practical is below. None of it is urgent. The only urgent thing is that you look after one another.",
    accounts: [
      {
        service: 'Password manager',
        login: 'june.alder@example.com, master password: harbor-lantern-quietly-71',
        wish: 'hand-over',
        note: 'Everything else is in here. Clara first, please.',
      },
      {
        service: 'Email',
        login: 'june.alder@example.com, in the password manager',
        wish: 'close',
        note: 'Set an auto-reply for a month, then close it.',
      },
      {
        service: 'Photos',
        login: 'Shared library, in the password manager',
        wish: 'hand-over',
        note: 'Download everything for Clara and Mei before anything is closed.',
      },
      {
        service: 'Social media',
        login: 'In the password manager',
        wish: 'memorialize',
        note: 'Keep the pages up. People like to leave notes.',
      },
    ],
    documents: [
      { item: 'Will', location: 'With Okafor & Reyes, solicitors. Copy in the blue folder.' },
      { item: 'Blue folder', location: 'Bottom drawer of the writing desk, under the atlas.' },
      { item: 'Spare key', location: 'Inside the brass owl on the porch.' },
      { item: 'Insurance papers', location: 'Blue folder, second sleeve.' },
    ],
    wishes: {
      farewell:
        'Something short, outdoors if the weather allows. Mei chooses the music. No one has to speak, but anyone may.',
      body: 'I am a registered organ donor. Afterwards, cremation, and scatter me where the river bends below the old mill.',
      dependents: 'Biscuit goes to Ben, who already spoils him. The fig tree goes to whoever will water it.',
      other: 'Return the green umbrella to Dev. I have had it since 2019 and I am not sorry.',
    },
  },
  holders: [
    {
      name: 'Clara Alder',
      letter:
        'Clara,\n\nYou were the first person I chose and the easiest. You will want to be in charge. Let yourself not be, for a day or two.\n\n' +
        'The blue folder has the things you will worry about. The photos are yours to keep. The ones from the summer at Gran’s are in a box marked “do not throw away”, which I suppose you can now throw away if you like. Please don’t.\n\n' +
        'I love you. I always thought you were the brave one.\n\nJune',
    },
    {
      name: 'Ben Okafor',
      letter:
        'Ben,\n\nBiscuit is yours. He eats at seven and at six, and he will lie to you about the seven.\n\n' +
        'Thank you for every Thursday. I never told you how much those walks held my weeks together.\n\nJune',
    },
    { name: 'Dev Raman', letter: '' },
    {
      name: 'Mei Lin',
      letter:
        'Mei,\n\nPlay the song you think I would hate. I will not be in a position to object.\n\n' +
        'There is a notebook in the desk with half-finished recipes. Finish the good ones and tell everyone they were mine.\n\nJune',
    },
    { name: 'Tomás Reyes', letter: '' },
  ],
});

const demo = {
  jar,
  cards: cards.map((c) => ({
    name: c.name,
    hasLetter: c.hasLetter,
    shard: cardToQrText(c.shard),
    shardWords: cardToWords(c.shard).join(' '),
    seal: cardToQrText(c.seal),
    sealWords: cardToWords(c.seal).join(' '),
  })),
};

writeFileSync(new URL('../src/demo/demo.json', import.meta.url), JSON.stringify(demo, null, 2) + '\n');
console.log(`Demo vessel ${jar.jarId} written with ${cards.length} cards.`);
