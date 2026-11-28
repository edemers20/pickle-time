/** Copy for the "How it works" info sheet (the "i" button in the header). Edit any text here. */
export const HOW_IT_WORKS = {
  buttonLabel: "How it works",
  title: "How it works",
  intro: "Looking for info on Tony and Emma's really fun and exciting pickleball tournament? Well, look no further.",

  roles: [
    { who: "Playing?", text: "Log in to edit your player profile." },
    { who: "Watching?", text: "Peruse the website at your leisure." },
  ],

  teams: {
    heading: "Your team",
    body: "Teams will go on the Players tab once teams are set. It will look like this.",
    caption: "Examples names!! We don't know these people.",
    samples: [
      { color: "#f43f5e", players: [{ name: "Alex Kim", nickname: "Kitchen Queen" }, { name: "Jordan Lee", nickname: "" }] },
      { color: "#2dd4bf", players: [{ name: "Sam Patel", nickname: "" }, { name: "Riley Chen", nickname: "Big Dinker" }] },
      { color: "#e879f9", players: [{ name: "Casey Wu", nickname: "Lob City" }, { name: "Morgan Diaz", nickname: "" }] },
    ],
  },

  faq: {
    heading: "General FAQ",
    items: [
      {
        q: "How many games will I play?",
        a: "We'll definitely start with a round robin, so everyone plays at least 4 games.",
      },
      {
        q: "Will there be a prize?",
        a: "Yes! Not to mention the bragging rights.",
      },
      {
        q: "Should I bring anything?",
        a: "The normal tournament stuff: things to heckle with, a fiery competitive spirit, water, etc. Paddles and such are provided.",
      },
    ],
  },
} as const;
