-- Put the 30 default players back in the free-agent pool, with the unhinged profile stats.
update players set name = 'Emma Rivera', nickname = 'The Wall', stats = '[
  {"label":"Signature shot","value":"The ball simply stops"},
  {"label":"Years playing","value":"Since the kitchen invented her"},
  {"label":"Chaos rating","value":"Professionally contained"},
  {"label":"Walk-up song","value":"One intimidating clap"}
]'::jsonb, updated_at = now() where id = 1;
update players set name = 'Jordan Lee', nickname = 'J-Dink', stats = '[
  {"label":"Banned move","value":"The apology dink"},
  {"label":"Years playing","value":"Eight years, zero chill"},
  {"label":"Snack of choice","value":"Ice, aggressively"},
  {"label":"Pre-serve ritual","value":"Names the ball"}
]'::jsonb, updated_at = now() where id = 2;
update players set name = 'Casey Morgan', nickname = 'Kitchen Queen', stats = '[
  {"label":"Signature shot","value":"Erne from the parking lot"},
  {"label":"Years playing","value":"Long enough to have a throne"},
  {"label":"Kitchen crime","value":"Living there rent-free"},
  {"label":"Walk-up song","value":"A hummed coronation jingle"}
]'::jsonb, updated_at = now() where id = 3;
update players set name = 'Riley Chen', nickname = 'Topspin', stats = '[
  {"label":"Paddle name","value":"Greg, and Greg is angry"},
  {"label":"Years playing","value":"Four years, one vendetta"},
  {"label":"Excuse ready","value":"The wind was spicy"},
  {"label":"Walk-up song","value":"Don''t Stop Me Now, faster"}
]'::jsonb, updated_at = now() where id = 4;
update players set name = 'Alex Patel', nickname = 'Big Swing', stats = '[
  {"label":"Signature shot","value":"A drop that becomes a threat"},
  {"label":"Years playing","value":"Started yesterday, peaked at lunch"},
  {"label":"Trash talk","value":"Whispered, somehow worse"},
  {"label":"Hydration plan","value":"One sip, then chaos"}
]'::jsonb, updated_at = now() where id = 5;
update players set name = 'Taylor Brooks', nickname = 'Soft Hands', stats = '[
  {"label":"Worst habit","value":"Apologizing to the ball"},
  {"label":"Years playing","value":"Nine years of gentle menace"},
  {"label":"Softness rating","value":"Weaponized"},
  {"label":"Walk-up song","value":"Dancing Queen, whispered"}
]'::jsonb, updated_at = now() where id = 6;
update players set name = 'Morgan Diaz', nickname = 'Llama Drama', stats = '[
  {"label":"Signature shot","value":"A speed-up nobody consented to"},
  {"label":"Years playing","value":"A confusing amount"},
  {"label":"Llama fact","value":"Not a llama. Won''t elaborate."},
  {"label":"Walk-up song","value":"The sound of hooves, somehow"}
]'::jsonb, updated_at = now() where id = 7;
update players set name = 'Jamie Okafor', nickname = 'Spitter', stats = '[
  {"label":"Opponent feared","value":"Anyone holding a napkin"},
  {"label":"Years playing","value":"Five, plus one incident"},
  {"label":"Blood type","value":"Pickle-positive"},
  {"label":"Walk-up song","value":"Mr. Brightside, mid-argument"}
]'::jsonb, updated_at = now() where id = 8;
update players set name = 'Drew Kim', nickname = 'Lobster', stats = '[
  {"label":"Signature shot","value":"A lob that files a complaint"},
  {"label":"Years playing","value":"Three summers and a grudge"},
  {"label":"Court superstition","value":"Must bow to the net"},
  {"label":"Walk-up song","value":"Thunderstruck, from a shell"}
]'::jsonb, updated_at = now() where id = 9;
update players set name = 'Quinn Murphy', nickname = 'Sky Hook', stats = '[
  {"label":"Serve tell","value":"Looks at the sky, aims for ribs"},
  {"label":"Years playing","value":"Negative two, spiritually"},
  {"label":"Body-bag count","value":"We don''t publish that"},
  {"label":"Walk-up song","value":"Pump It, then a silence"}
]'::jsonb, updated_at = now() where id = 10;
update players set name = 'Avery Santos', nickname = 'Third Shot', stats = '[
  {"label":"Signature shot","value":"Third shot, fourth opinion"},
  {"label":"Years playing","value":"Since the number three existed"},
  {"label":"Chaos rating","value":"Calculated, then not"},
  {"label":"Walk-up song","value":"Eye of the Tiger, shot three only"}
]'::jsonb, updated_at = now() where id = 11;
update players set name = 'Parker Nguyen', nickname = 'Lefty', stats = '[
  {"label":"Banned shot","value":"Anything with the right hand"},
  {"label":"Years playing","value":"Unhinged since last Tuesday"},
  {"label":"Excuse ready","value":"That''s how lefties say hello"},
  {"label":"Snack of choice","value":"Whatever is in the other pocket"}
]'::jsonb, updated_at = now() where id = 12;
update players set name = 'Reese Walker', nickname = 'The Crown', stats = '[
  {"label":"Signature shot","value":"Erne, then a small bow"},
  {"label":"Years playing","value":"Born in the non-volley zone"},
  {"label":"Royal decree","value":"No dinks before noon"},
  {"label":"Walk-up song","value":"Seven Nation Army, crowned"}
]'::jsonb, updated_at = now() where id = 13;
update players set name = 'Jesse Romero', nickname = 'Royal Flush', stats = '[
  {"label":"Paddle name","value":"The Flush"},
  {"label":"Years playing","value":"Two years, a full house of ideas"},
  {"label":"Trash talk","value":"Polite. Devastating."},
  {"label":"Walk-up song","value":"Don''t Stop Me Now, whispered"}
]'::jsonb, updated_at = now() where id = 14;
update players set name = 'Hayden Scott', nickname = 'Erne Ernie', stats = '[
  {"label":"Signature shot","value":"Erne with both feet off the ground"},
  {"label":"Years playing","value":"More than the knees signed up for"},
  {"label":"Court superstition","value":"Shakes the net''s hand"},
  {"label":"Fake injury","value":"My aura is sprained"}
]'::jsonb, updated_at = now() where id = 15;
update players set name = 'Rowan Fischer', nickname = 'Sidearm', stats = '[
  {"label":"Worst habit","value":"Sidearm into the conversation"},
  {"label":"Years playing","value":"Seven, all of them sideways"},
  {"label":"Hydration plan","value":"Mystery bottle. Do not ask."},
  {"label":"Walk-up song","value":"Dancing Queen, as a threat"}
]'::jsonb, updated_at = now() where id = 16;
update players set name = 'Skyler Grant', nickname = 'Dr. Spin', stats = '[
  {"label":"Signature shot","value":"Spin that violates physics"},
  {"label":"Years playing","value":"Five, doctorate pending"},
  {"label":"Diagnosis","value":"Chronic speed-up"},
  {"label":"Walk-up song","value":"Uptown Funk, clinical tempo"}
]'::jsonb, updated_at = now() where id = 17;
update players set name = 'Emerson Hale', nickname = 'Nurse Slice', stats = '[
  {"label":"Pre-game ritual","value":"Takes everyone''s pulse"},
  {"label":"Years playing","value":"Three years, one clipboard"},
  {"label":"Snack of choice","value":"Orange slices, prescribed"},
  {"label":"Walk-up song","value":"Mr. Brightside, as a lullaby"}
]'::jsonb, updated_at = now() where id = 18;
update players set name = 'Blake Ito', nickname = 'Brine Time', stats = '[
  {"label":"Signature shot","value":"A reset so soft it apologizes"},
  {"label":"Years playing","value":"One brine, ongoing"},
  {"label":"Chaos rating","value":"Pickled"},
  {"label":"Walk-up song","value":"Thunderstruck, underwater"}
]'::jsonb, updated_at = now() where id = 19;
update players set name = 'Dakota Shah', nickname = 'Danger Zone', stats = '[
  {"label":"Banned move","value":"Playing it safe"},
  {"label":"Years playing","value":"Eight years in the danger zone"},
  {"label":"Excuse ready","value":"The zone required it"},
  {"label":"Walk-up song","value":"The Top Gun riff, poorly"}
]'::jsonb, updated_at = now() where id = 20;
update players set name = 'Charlie Moss', nickname = 'Dill Pickle', stats = '[
  {"label":"Signature shot","value":"A dink with notes of garlic"},
  {"label":"Years playing","value":"Since the jar opened"},
  {"label":"Kitchen crime","value":"Brining the ball"},
  {"label":"Walk-up song","value":"Eye of the Tiger, dill remix"}
]'::jsonb, updated_at = now() where id = 21;
update players set name = 'Finley Ortiz', nickname = 'Relish', stats = '[
  {"label":"Paddle name","value":"Relish"},
  {"label":"Years playing","value":"Four years, extra on the side"},
  {"label":"Trash talk","value":"Condiment-based"},
  {"label":"Walk-up song","value":"Lose Yourself, then the mustard"}
]'::jsonb, updated_at = now() where id = 22;
update players set name = 'Logan Price', nickname = 'Smasher', stats = '[
  {"label":"Signature shot","value":"A smash that needs a permit"},
  {"label":"Years playing","value":"Two years, several noise complaints"},
  {"label":"Volume","value":"Illegal in three counties"},
  {"label":"Walk-up song","value":"The crowd, allegedly"}
]'::jsonb, updated_at = now() where id = 23;
update players set name = 'Sawyer Bell', nickname = 'Mouthpiece', stats = '[
  {"label":"Worst habit","value":"Commentating their own points"},
  {"label":"Years playing","value":"Nine years of play-by-play"},
  {"label":"Excuse ready","value":"I called that"},
  {"label":"Walk-up song","value":"Their own voice, echoing"}
]'::jsonb, updated_at = now() where id = 24;
update players set name = 'Peyton Ward', nickname = 'Hot Hands', stats = '[
  {"label":"Signature shot","value":"A drop that files a burn report"},
  {"label":"Years playing","value":"Seven, all of them spicy"},
  {"label":"Hydration plan","value":"Ice water and denial"},
  {"label":"Walk-up song","value":"Sandstorm, from inside a pepper"}
]'::jsonb, updated_at = now() where id = 25;
update players set name = 'Kendall Cruz', nickname = 'Drop Shot', stats = '[
  {"label":"Serve tell","value":"Looks bored, then drops it"},
  {"label":"Years playing","value":"Five years of fake nonchalance"},
  {"label":"Chaos rating","value":"Quiet until it isn''t"},
  {"label":"Walk-up song","value":"Dancing Queen, one octave down"}
]'::jsonb, updated_at = now() where id = 26;
update players set name = 'River Adams', nickname = 'Big Dill', stats = '[
  {"label":"Signature shot","value":"A speed-up the size of a canoe"},
  {"label":"Years playing","value":"Three years, one very large dill"},
  {"label":"Court superstition","value":"Must be the tallest thing here"},
  {"label":"Walk-up song","value":"Uptown Funk, from a height"}
]'::jsonb, updated_at = now() where id = 27;
update players set name = 'Ellis Novak', nickname = 'Gherkin', stats = '[
  {"label":"Opponent feared","value":"The jar lid"},
  {"label":"Years playing","value":"Started this morning, emotionally"},
  {"label":"Snack of choice","value":"A gherkin, courtside, unblinking"},
  {"label":"Walk-up song","value":"Mr. Brightside, tiny"}
]'::jsonb, updated_at = now() where id = 28;
update players set name = 'Harper Quinn', nickname = 'Zero', stats = '[
  {"label":"Signature shot","value":"A reset to literally zero"},
  {"label":"Years playing","value":"Zero, on purpose"},
  {"label":"Blood type","value":"0, but make it a personality"},
  {"label":"Walk-up song","value":"Silence. That is the song."}
]'::jsonb, updated_at = now() where id = 29;
update players set name = 'Micah Reyes', nickname = 'Double Zero', stats = '[
  {"label":"Banned shot","value":"Scoring first"},
  {"label":"Years playing","value":"Six years of double nothing"},
  {"label":"Excuse ready","value":"We start at zero twice"},
  {"label":"Walk-up song","value":"Pump It, then a dramatic pause"}
]'::jsonb, updated_at = now() where id = 30;
update settings set version = version + 1, updated_at = now() where id = 1;
