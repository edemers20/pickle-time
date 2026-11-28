/**
 * Copy for the "How it works" info sheet (the "i" button in the header).
 *
 * Edit any text here. Words in curly braces, like {groupStart}, are swapped for clock
 * times worked out from the start time on the desk, so keep those as they are:
 * {checkIn} {groupStart} {groupEnd} {quarters} {semis} {final} {awards}
 */
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

  games: {
    heading: "How many games",
    rows: [
      { value: "4", label: "Everyone", note: "In group stage" },
      { value: "6", label: "Seeds 1 and 2", note: "If you win a lot and get a bye to the semis" },
      { value: "7", label: "Seeds 3 to 6", note: "Most you can play incl the final" },
    ],
  },

  groups: {
    heading: "Group stage",
    body: "Every team gets assigned a court and every court plays all teams their court once. A new round starts every 10 minutes (hopefully) from {groupStart}. Tryna run a tight ship because we have a hard stop at 7",
    courtLabel: "Court",
    exampleNote: "Example!",
    vs: "vs",
    // One game per court, in the same order as the groups above (Red, Green, Blue).
    exampleGames: [
      { a: { name: "Alex Kim & Jordan Lee", color: "#f43f5e" }, b: { name: "Taylor Brooks & Drew Hall", color: "#38bdf8" } },
      { a: { name: "Sam Patel & Riley Chen", color: "#2dd4bf" }, b: { name: "Jamie Fox & Avery Moss", color: "#facc15" } },
      { a: { name: "Casey Wu & Morgan Diaz", color: "#e879f9" }, b: { name: "Quinn Ross & Blake Ito", color: "#22d3ee" } },
    ],
  },

  seeding: {
    heading: "How seeds work",
    body: "When group stage ends, teams are ranked by:",
    order: [
      "Wins",
      "Point difference, counting at most 7 points per game",
      "Fewest points given up",
    ],
  },

  playoffs: {
    heading: "Playoffs",
    body: "Top 6 teams play playoffs. We have plenty of courts so everyone else can still play for 7th and below or do whatnot and mingle.",
    rounds: [
      { title: "Quarterfinals", time: "{quarters}", games: ["3 vs 6", "4 vs 5"] },
      { title: "Semifinals", time: "{semis}", games: ["1 vs winner of 4 and 5", "2 vs winner of 3 and 6"] },
      { title: "Final", time: "{final}", games: ["Semifinal winners"] },
    ],
  },
} as const;
