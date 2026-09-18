export function createPlayer(name) {
  return {
    name,

    points: 0,

    tokens: {
      white: 0,
      blue: 0,
      green: 0,
      red: 0,
      black: 0,
      gold: 0,
    },

    purchasedCards: [],

    reservedCards: [],

    nobles: [],

    personality: null,
  };
}
