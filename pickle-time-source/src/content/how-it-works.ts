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
  intro: "15 teams of two, 3 courts, one champion. Every team plays 4 games, and the top 6 go to the playoffs.",

  teams: {
    heading: "Your team",
    body: "Pairs go up on the Players tab once teams are set. It will look like this. Tap anyone to see their card.",
    caption: "Sample names. Your real teams show up here.",
    samples: [
      { color: "#f43f5e", players: [{ name: "Alex Kim", nickname: "Kitchen Queen" }, { name: "Jordan Lee", nickname: "" }] },
      { color: "#38bdf8", players: [{ name: "Sam Patel", nickname: "" }, { name: "Riley Chen", nickname: "Big Dinker" }] },
      { color: "#a3e635", players: [{ name: "Casey Wu", nickname: "Lob City" }, { name: "Morgan Diaz", nickname: "" }] },
    ],
  },

  games: {
    heading: "How many games",
    rows: [
      { value: "4", label: "Every team", note: "Group games, guaranteed" },
      { value: "6", label: "Seeds 1 and 2", note: "Most you can play, with a bye to the semis" },
      { value: "7", label: "Seeds 3 to 6", note: "Most you can play, starting in the quarters" },
    ],
  },

  groups: {
    heading: "Group play",
    body: "You're in a group of 5 and play every other team in your group once. Each group stays on its own court. A new round starts every 10 minutes from {groupStart}, and you never play two rounds in a row.",
    courtLabel: "Court",
    rules: "To 11, win by 1, 8 minute cap.",
  },

  seeding: {
    heading: "How seeds work",
    body: "When group play ends at {groupEnd}, all 15 teams go on one table, no matter which group you were in. Teams are ranked by:",
    order: [
      "Wins",
      "Point difference, counting at most 7 points per game",
      "Fewest points given up",
      "Head to head, if the tied teams played",
    ],
  },

  playoffs: {
    heading: "Playoffs",
    body: "The top 6 seeds make it. Seeds 1 and 2 get a bye to the semis. Seeds 3 to 6 play a quarterfinal.",
    rounds: [
      { title: "Quarterfinals", time: "{quarters}", games: ["3 vs 6", "4 vs 5"] },
      { title: "Semifinals", time: "{semis}", games: ["1 vs winner of 4 and 5", "2 vs winner of 3 and 6"] },
      { title: "Final", time: "{final}", games: ["Semifinal winners"] },
    ],
    rules: [
      "Quarters and semis: to 11, win by 2, 11 minute cap.",
      "Final: to 11, win by 2, no cap. Everyone watches on Court 1.",
      "Both semifinal losers tie for 3rd. There's no 3rd place game.",
      "Seeds 7 to 15 are done for the day. Court 3 is open play during the semis.",
    ],
  },

  schedule: {
    heading: "The day",
    rows: [
      { time: "{checkIn}", label: "Check in and warm up" },
      { time: "{groupStart}", label: "Group play starts" },
      { time: "{quarters}", label: "Quarterfinals" },
      { time: "{semis}", label: "Semifinals" },
      { time: "{final}", label: "Final" },
      { time: "{awards}", label: "Awards" },
    ],
  },
} as const;
