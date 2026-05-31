// =============================================
// THEMES
// =============================================
const themes = {
  rookie:  { accent1: '#a78bfa', accent2: '#60a5fa' },
  breaker: { accent1: '#34d399', accent2: '#06b6d4' },
  bender:  { accent1: '#f97316', accent2: '#eab308' },
  master:  { accent1: '#f43f5e', accent2: '#ec4899' },
};

// =============================================
// GAME STATE
// =============================================
const state = {
  playerName: '', playerAge: 0,
  level: 1, solved: 0,
  totalAttempts: 0, totalCorrect: 0,
  streak: 0, bestStreak: 0,
  currentSentence: '',
  wrongAttempts: 0, hintUsed: false, hintedWords: [],
  currentRank: 'Rookie Decoder',
  sessionPuzzles: 0,
};

const usedSentences = [];
let bankIndex = 0;

// =============================================
// RANKS
// =============================================
const ranks = [
  { minLevel: 1, emoji: '🔰', title: 'Rookie Decoder', theme: 'rookie'  },
  { minLevel: 3, emoji: '🔍', title: 'Code Breaker',   theme: 'breaker' },
  { minLevel: 5, emoji: '🧠', title: 'Mind Bender',    theme: 'bender'  },
  { minLevel: 7, emoji: '⚡', title: 'Cipher Master',  theme: 'master'  },
];

// =============================================
// TRANSFORMATIONS
// =============================================
const transforms = [
  'rotate(45deg)',   'rotate(90deg)',   'rotate(135deg)',
  'rotate(180deg)',  'rotate(225deg)',  'rotate(270deg)',
  'rotate(315deg)',  'rotate(-45deg)',  'rotate(-90deg)',
  'rotate(-135deg)', 'scaleX(-1)',      'scaleY(-1)',
  'rotate(90deg) scaleX(-1)', 'rotate(180deg) scaleY(-1)',
];

// =============================================
// SENTENCE BANK
// =============================================
const sentenceBank = [
      // === EASY (short, simple) ===
      'Dogs can smell about one hundred thousand times better than humans.',
      'Ice cream was once considered a luxury only for the rich.',
      'The first alarm clock could only ring at four in the morning.',
      'Penguins propose to their mates by giving them a pebble.',
      'A snail can sleep for three years straight without waking up.',
      'Frogs cannot swallow with their eyes open at all.',
      'The average person walks about one hundred thousand miles in a lifetime.',
      'Polar bears have black skin underneath their white fur.',
      'Goldfish have a memory span of at least three months.',
      'Sloths take two weeks to digest a single leaf completely.',

      // === MEDIUM (interesting facts) ===
      'The longest English word without a vowel is rhythms.',
      'A group of owls is called a parliament of owls.',
      'The first computer bug was an actual real moth.',
      'Blue whales can hear each other from one thousand miles away.',
      'There are more possible chess games than atoms in the universe.',
      'The Hawaiian alphabet has only twelve letters in total.',
      'Competitive art used to be an official Olympic sport long ago.',
      'A jiffy is an actual unit of time equal to one hundredth of a second.',
      'The tongue of a blue whale weighs as much as an elephant.',
      'Strawberries are the only fruit with seeds on the outside.',

      // === HARD (longer, complex vocabulary) ===
      'The scientific study of hiccups does not yet have a known cure.',
      'Armadillos almost always give birth to exactly four identical babies.',
      'The longest recorded flight of a chicken was thirteen seconds exactly.',
      'A shrimp has its heart located inside its head not its body.',
      'Humans share approximately fifty percent of their DNA with bananas.',
      'The dot above the letters i and j is officially called a tittle.',
      'Squirrels forget where they buried about half of their stored nuts.',
      'An ostrich eye is bigger than its entire brain in size.',
      'The shortest war in recorded history lasted only thirty eight minutes.',
      'Bubble wrap was originally invented to be used as wallpaper.',
      
      'The quick brown fox jumps over the lazy dog.',
      'Cats sleep for almost sixteen hours every single day.',
      'Learning new skills makes your brain stronger always.',
      'Every morning the birds sing outside my window.',
      'Pizza was invented in the beautiful city of Naples.',
      'Elephants are the largest land animals on earth.',
      'The sun rises in the east and sets in the west.',
      'Reading books every day improves your vocabulary greatly.',
      'Mount Everest is the tallest mountain in the world.',
      'Honey never expires and can last for thousands of years.',
      'Sharks have existed for longer than trees on earth.',
      'The moon controls the tides of our oceans.',
      'Butterflies taste food using sensors on their feet.',
      'Bananas are technically classified as berries by botanists.',
      'Lightning strikes the earth about one hundred times per second.',
      'A group of flamingos is called a flamboyance.',
      'Octopuses have three hearts and blue colored blood.',
      'The smell of rain on dry earth is called petrichor.',
      'Wombats are the only animals that produce cube shaped droppings.',
      'A single cloud can weigh more than one million pounds.',
      'Crows can recognize and remember human faces for years.',
      'The fingerprints of a koala are nearly identical to humans.',
      'Stars that we see at night may no longer exist.',
      'Apples belong to the same family as roses do.',
      'The heart of a blue whale is the size of a car.',
      'A bolt of lightning is five times hotter than the sun.',
      'Dolphins sleep with one eye open at all times.',
      'Cleopatra lived closer in time to the moon landing than pyramids.',
      'A day on Venus is longer than a year on Venus.',
      'The inventor of the frisbee was turned into a frisbee.',
    ];

// =============================================
// HELPER FUNCTIONS for state
// =============================================
function getDifficulty() {
  if (state.level <= 2) return { label: '🔰 Rookie',  angles: [0,1,3,6],              wordCount: '3 to 4', theme: 'rookie'  };
  if (state.level <= 4) return { label: '🔍 Breaker', angles: [0,1,2,3,4,5,6],        wordCount: '4 to 5', theme: 'breaker' };
  if (state.level <= 6) return { label: '🧠 Bender',  angles: transforms.slice(0,10), wordCount: '5 to 7', theme: 'bender'  };
  return                       { label: '⚡ Master',  angles: transforms,              wordCount: '7 to 9', theme: 'master'  };
}

function getRankInfo() {
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (state.level >= ranks[i].minLevel) return ranks[i];
  }
  return ranks[0];
}

function applyTheme(key) {
  const t = themes[key] || themes.rookie;
  document.documentElement.style.setProperty('--accent1', t.accent1);
  document.documentElement.style.setProperty('--accent2', t.accent2);
}

function isTooSimilar(newSentence) {
  const newLower = newSentence.toLowerCase().trim();
  for (const used of usedSentences) {
    if (newLower.substring(0, 20) === used.toLowerCase().trim().substring(0, 20)) return true;
    if (newLower === used.toLowerCase().trim()) return true;
  }
  return false;
}

function getFallbackSentence() {
  if (bankIndex === 0) {
    for (let i = sentenceBank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sentenceBank[i], sentenceBank[j]] = [sentenceBank[j], sentenceBank[i]];
    }
  }
  const sentence = sentenceBank[bankIndex % sentenceBank.length];
  bankIndex++;
  return sentence;
}