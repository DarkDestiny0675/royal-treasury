const GEM_COLORS = ["white", "blue", "green", "red", "black"];

// Names and portraits remain permanently paired.
// Requirements and the order in which nobles appear remain procedural.
const NOBLE_DEFINITIONS = [
  { name: "Lady Isabella", imageKey: "noble-3" },
  { name: "Lady Seraphina", imageKey: "noble-9" },
  { name: "Princess Celeste", imageKey: "noble-2" },
  { name: "Countess Aurelia", imageKey: "noble-4" },
  { name: "Queen Elena", imageKey: "noble-1" },

  { name: "Prince Leopold", imageKey: "noble-10" },
  { name: "King Alaric", imageKey: "noble-8" },
  { name: "Emperor Cassian", imageKey: "noble-6" },
  { name: "Duke Ferdinand", imageKey: "noble-5" },
  { name: "Lord Percival", imageKey: "noble-7" },
];

const REQUIREMENT_PATTERNS = [
  { weight: 50, values: [3, 3, 3] },
  { weight: 35, values: [4, 4] },
  { weight: 15, values: [4, 3, 3] },
];

function shuffleValues(values) {
  const shuffledValues = [...values];

  for (let index = shuffledValues.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporaryValue = shuffledValues[index];
    shuffledValues[index] = shuffledValues[randomIndex];
    shuffledValues[randomIndex] = temporaryValue;
  }

  return shuffledValues;
}

function chooseWeightedPattern() {
  const totalWeight = REQUIREMENT_PATTERNS.reduce(
    (total, pattern) => total + pattern.weight,
    0,
  );

  let randomWeight = Math.random() * totalWeight;

  for (const pattern of REQUIREMENT_PATTERNS) {
    randomWeight -= pattern.weight;

    if (randomWeight <= 0) {
      return [...pattern.values];
    }
  }

  return [...REQUIREMENT_PATTERNS[REQUIREMENT_PATTERNS.length - 1].values];
}

function createRequirements() {
  const requirementValues = chooseWeightedPattern();
  const selectedColors = shuffleValues(GEM_COLORS).slice(
    0,
    requirementValues.length,
  );
  const shuffledValues = shuffleValues(requirementValues);
  const requirements = {};

  selectedColors.forEach((color, index) => {
    requirements[color] = shuffledValues[index];
  });

  return requirements;
}

function createNoble(definition) {
  return {
    id: definition.imageKey,
    name: definition.name,
    points: 3,
    requirements: createRequirements(),
    imageKey: definition.imageKey,
  };
}

export function generateNoblePool() {
  return shuffleValues(NOBLE_DEFINITIONS).map(createNoble);
}
