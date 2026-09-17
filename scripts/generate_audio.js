#!/usr/bin/env node
/**
 * Pre-generate Gemini AI Voice audio files for The Sunrise Islands
 * 
 * Usage:
 *   GEMINI_API_KEY="your-api-key" node scripts/generate_audio.js
 *   node scripts/generate_audio.js --key="your-api-key" --voice="Aoede"
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
let apiKey = (process.env.GEMINI_API_KEY || "").trim();
let voice = (process.env.GEMINI_VOICE || "Aoede").trim();
let model = (process.env.GEMINI_MODEL || "gemini-2.5-flash-preview-tts").trim();
let force = args.includes("--force");
// The macOS "say" fallback produces a robotic Karen voice that does not match the
// pre-rendered Gemini Aoede voice used by every shipped track. It is opt-in only,
// so a missing key can never silently ship a mismatched voice again.
let allowSay = args.includes("--allow-say");
let reseed = args.includes("--reseed");
// See what a run WOULD record, and what it would cost in quota, before spending any.
let dry = args.includes("--dry");

for (const arg of args) {
  if (arg.startsWith("--key=")) apiKey = arg.slice(6).trim();
  if (arg.startsWith("--voice=")) voice = arg.slice(8).trim();
  if (arg.startsWith("--model=")) model = arg.slice(8).trim();
}

apiKey = apiKey.replace(/^["']+|["']+$/g, "").trim();
voice = voice.replace(/^["']+|["']+$/g, "").trim();
model = model.replace(/^["']+|["']+$/g, "").trim();

const hasApiKey = Boolean(apiKey);
const isMac = process.platform === "darwin" && allowSay;

if (!hasApiKey && !isMac) {
  console.log(`
==============================================================
🎙️  The Sunrise Islands: Audio Pre-Generator
==============================================================

Pre-render audio files for all game screens so students can listen
with 0 latency, 0 quota, and 100% offline capability on classroom iPads.

Usage:
  export GEMINI_API_KEY="AIzaSy..."
  node scripts/generate_audio.js

Options:
  --key="AIzaSy..."     Provide API key as an argument
  --voice="Aoede"       Voice name (Aoede, Puck, Kore, Charon, Fenrir)
  --model="gemini-2.5-flash-preview-tts"
  --dry                 List what needs recording and exit. Spends no quota.
  --force               Re-generate files even if they already exist
  --reseed              Re-record tracks that exist but have no manifest entry
                        (default: adopt them, to conserve the 100/day quota)
  --allow-say           macOS only: permit the robotic "say" fallback when no
                        key is set. Off by default - the shipped tracks all use
                        the Gemini Aoede voice and must not be mixed.

==============================================================
`);
  process.exit(1);
}

if (!hasApiKey) {
  console.log("⚠️  No GEMINI_API_KEY provided. Falling back to the robotic macOS Karen voice,");
  console.log("   which will NOT match the Gemini Aoede voice used by every other track.");
}

const OUTPUT_DIR = path.resolve(__dirname, "../settlement-game/audio");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Complete narration texts covering all game screens, places, and decisions.
// Result-screen tracks are appended below by resultTracks().
const AUDIO_TRACKS = [
  // 1. Core Narrative Screens
  {
    id: "intro",
    text: "The Sunrise Islands. Where would you live? Four imaginary islands, four different climates. Nobody lives on them yet. You are the scout for twenty settlers."
  },
  {
    id: "arch_start",
    // Read in the order the words appear on screen, so a student can follow along.
    text: "Pick an island. Settle any two islands. Do more if you want to. Tap Listen on an island to hear what it is like, then tap the island to explore it. Climate is the weather a place usually gets. Look at how hot it is, how humid it is (how wet the air is), and what plants grow."
  },
  {
    id: "arch_done1",
    text: "One island done! Settle one more, then you can go and think about Australia. Tap any island card to travel there."
  },
  {
    id: "arch_done2",
    text: "Two islands settled! Settle more if you want to, or tap I am ready to think about Australia."
  },
  // 1b. Immersive Island Stories (Read to me on Island Selection)
  {
    id: "palm_story",
    text: "Welcome to Palm Island! Picture the steamy, tropical north near Darwin. Out here, there are only two wild seasons: The Wet and The Dry! When The Wet arrives, warm tropical rain pours from the sky like a giant waterfall, thunder cracks across the sea, and big storms can roar in! Plants grow crazy fast, and waterfalls tumble down rocky cliffs. It's hot, sticky, and full of adventure—just make sure you build up high on stilts, and keep a lookout for crocodiles in the creeks!"
  },
  {
    id: "red_story",
    text: "Welcome to Red Island! Picture the huge, glowing red outback around Alice Springs. By day, the red sand and giant rocks bake under a blazing sun, reaching over forty degrees! But as soon as the sun dips, the sky lights up with millions of crystal stars, and the temperature drops freezing cold! Lizards run across the sand, tough prickly spinifex grass covers the dunes, and secret rock waterholes hide pure fresh water. Can your settlers survive the big heat?"
  },
  {
    id: "gold_story",
    text: "Welcome to Gold Island! Picture the sweeping golden plains out west near Dubbo. Endless golden grass ripples like ocean waves in the breeze. In summer, the sun beats down and sudden lightning storms bring booming thunder. In winter, mornings are crisp and frosty. It's classic big-sky sheep and wheat country! There's plenty of room to build, grow crops, and run animals—as long as the creek doesn't dry up when summer comes!"
  },
  {
    id: "green_story",
    text: "Welcome to Green Island! Picture the breezy coast and green hills near Sydney. Here, you get four lovely, gentle seasons and steady rain right across the year. Tall eucalyptus trees shade sweet green ferns, fresh water trickles through rich river dirt, and kookaburras laugh from the treetops. It's easy to grow gardens, build cosy huts, and stay comfy—which is why almost every settler wants to live here! But watch out, space fills up fast!"
  },
  {
    id: "australia",
    text: "Now look at Australia. Australia has all four of those climates too. Start with how hot it gets. The north and middle are hot, while the south and Tasmania are much cooler. Coast or inland? Most Australians live on the mild coast. But some choose inland for open space, big backyards, farms and mining jobs."
  },
  {
    id: "pattern",
    text: "The pattern: Rain and people go together. Put the two maps on top of each other and you see it: Where it rains, people live. Where it does not rain, almost nobody does. That is why most Australians live near the coast. The coast gets the rain, and it is not too hot. But look closer! Out in the dry inland, people live in towns with lots of open space, room for big backyards, and jobs in farming and mining. So there is no single right answer. It is a trade-off: crowded and mild, or roomy and hard."
  },
  {
    id: "write",
    text: "What do you think? Write in your own words. Question 1: Most Australians live near the coast. Why? Question 2: Some Australians live far inland. Why did people move inland in the past, or live there today? Question 3: Where would you live in Australia, and what would be the best and hardest things? Question 4, a challenge: look at the guess you made and what you actually got. Why do you think that happened?"
  },
  {
    id: "write_q1",
    text: "Question 1 of 4: Most Australians live near the coast. Why? Start like this: Most Australians live near the coast because... Write in your own words. If you get stuck, tap Need help with words."
  },
  {
    id: "write_q2",
    text: "Question 2 of 4: Some Australians live far inland. Why did people move inland in the past, or live there today? Start like this: People live inland because... Write in your own words. If you get stuck, tap Need help with words."
  },
  {
    id: "write_q3",
    text: "Question 3 of 4: Where would you live in Australia? First, finish this: I would live... Then, finish this: The best thing would be... Then, finish this: The hardest thing would be... Think about the result screens: every place had a best thing and a hardest thing. Write in your own words. If you get stuck, tap Need help with words."
  },
  {
    // The student's own guess and result cannot be pre-rendered, so this stays general.
    id: "write_q4",
    text: "Question 4 of 4. This one is a challenge. Have a go if you can. Look at the guess you made and what you actually got. Why do you think that happened? Start like this: I think that happened because... What did you not know about that place when you made your guess?"
  },

  // 2. Predict Screen
  {
    id: "predict_prompt",
    text: "Guess first! 20 settlers are moving to your settlement. How many people do you think will live here in 3 years? There is no wrong guess. About 5, about 20, about 40, or about 60?"
  },

  // NOTE: the per-island scout, place and year tracks used to be written out by hand
  // here. Eight year tracks and eight place tracks had silently fallen behind the game
  // data - students heard options the screen no longer offered. They are now derived
  // from ISLANDS in islandTracks(), so they cannot drift again.

  // 5. Two Maps Questions
  {
    id: "map_q1",
    text: "Look at both maps. One map shows rain. The other shows where people live. Question 1: Look at the heavy rain along the east and north coasts. What do you notice about where people live? Option 1: People live where it rains the most. Option 2: People live where it is dry."
  },
  {
    id: "map_q2",
    text: "Look at both maps. One map shows rain. The other shows where people live. Question 2: Look at the huge red and orange middle of Australia. Why do almost no people live there? Option 1: It has very little rain and extreme heat. Option 2: It is too cold and wet."
  },
  {
    id: "map_q3",
    text: "Look at both maps. One map shows rain. The other shows where people live. Question 3: But look at the towns out in the dry country, like Alice Springs and Broken Hill. Why do people choose to live there? Option 1: Lots of open space, big backyards, farming and mining jobs. Option 2: Tropical beaches and rainforests."
  }
];

/* ---------------------------------------------------------------------------
   Result-screen tracks (17), derived from the game data in index.html so the
   narration can never drift from ISLANDS / OUTCOMES / ROOMS.

   The exact population is a number the student's own card choices produced, so
   it cannot live in a pre-rendered file. It stays on screen as the big numeral.
   What IS fixed splits cleanly in two:
     - how it went  -> OUTCOMES and ROOMS share thresholds (45/28/15/1/0) = 5 bands
     - why it went that way -> island x site = 12
   The player plays band track, then site track.
--------------------------------------------------------------------------- */
function loadGameData() {
  const vm = require("vm");
  const src = fs.readFileSync(path.resolve(__dirname, "../settlement-game/index.html"), "utf8");
  const grab = (name) => {
    const m = new RegExp("const " + name + "\\s*=\\s*Object\\.freeze\\(").exec(src);
    if (!m) throw new Error("Could not find " + name + " in index.html");
    let i = src.indexOf("(", m.index + m[0].length - 1);
    let depth = 0;
    for (; i < src.length; i++) {
      if (src[i] === "(") depth++;
      else if (src[i] === ")") { depth--; if (!depth) { i++; break; } }
    }
    return src.slice(m.index, i) + ";";
  };
  const names = ["FACTORS", "OUTCOMES", "ROOMS", "ISLANDS"];
  const ctx = { out: null };
  vm.createContext(ctx);
  vm.runInContext(names.map(grab).join("\n") + "\nout={" + names.join(",") + "};", ctx);
  return ctx.out;
}

// Place names the TTS voice gets wrong, respelled phonetically. This affects ONLY the
// narration text - the words on screen are unchanged. "Coober Pedy" came out as
// "Coopy Pedy"; it is COO-ber PEE-dee.
const SAY_AS = [
  [/\bCoober Pedy\b/g, "Cooba Peedy"]
];

// Mirrors cleanSpeechChunk() in index.html, so a pre-rendered track says exactly
// what the live Gemini / browser-voice fallback would say for the same screen.
function cleanForSpeech(str) {
  let out = String(str || "");
  SAY_AS.forEach(([re, to]) => { out = out.replace(re, to); });
  return out
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\uFE0F\uFE0E\u200D]/gu, "")
    .replace(/\bmm\b/g, "millimetres")
    .replace(/°C/g, " degrees")
    .replace(/&amp;/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

// True when the room note just restates the outcome line (e.g. "Only a few people
// stayed." / "Very few people stayed."), so we do not say the same thing twice.
function restates(line, note) {
  const words = t => new Set(String(t).toLowerCase().match(/[a-z]+/g) || []);
  const a = words(line), b = words(note);
  const shared = [...b].filter(w => w.length > 3 && a.has(w));
  return shared.length >= 2;
}

function resultTracks() {
  const { FACTORS, OUTCOMES, ROOMS, ISLANDS } = loadGameData();
  const tracks = [];

  // Part 1: how it went. One per band, shared by every island and site.
  OUTCOMES.forEach((out, i) => {
    const room = ROOMS[i];
    let text;
    if (out.min === 0) {
      text = `${out.label}. ${out.line} ${room.note}`;
    } else {
      text = `Your settlement became a ${out.label}. ${out.line} Room and space: ${room.word}.`;
      if (!restates(out.line, room.note)) text += ` ${room.note}`;
    }
    tracks.push({ id: `result_band${i}`, text: cleanForSpeech(text) });
  });

  // Part 2: why it went that way, plus the Real Australia echo. One per place.
  ISLANDS.forEach(isl => {
    isl.sites.forEach(site => {
      // Same best/worst rule the result screen uses: stable sort, take the first.
      const scored = FACTORS.map(f => ({ f, v: site.scores[f.key] }));
      const worst = scored.slice().sort((a, b) => a.v - b.v)[0].f;
      const best = scored.slice().sort((a, b) => b.v - a.v)[0].f;
      let text = `Here is why. ${site.name} on ${isl.name}: the best thing here was `
        + `${best.label.toLowerCase()}. The hardest thing was ${worst.label.toLowerCase()}.`;
      if (isl.echo) text += ` ${isl.echo.title}. ${isl.echo.text}`;
      tracks.push({ id: `result_${isl.id}_${site.letter.toLowerCase()}`, text: cleanForSpeech(text) });
    });
  });

  // One track per decision a student can make, so the game can explain their own
  // choices back to them. Also fills the year screen, which had no track after a pick.
  ISLANDS.forEach(isl => {
    (isl.cards || []).forEach((card, year) => {
      card.opts.forEach((opt, idx) => {
        tracks.push({
          id: `card_${isl.id}_y${year + 1}_${idx}`,
          // Position-neutral: the year screen replays these in the student's own
          // ranked order, so they cannot say "you chose" or name a position.
          text: cleanForSpeech(`${opt.t}. ${opt.why}`)
        });
      });
    });
  });

  return tracks;
}

// The scout, place and year tracks, built from the same ISLANDS data the screens read.
function islandTracks() {
  const { FACTORS, ISLANDS } = loadGameData();
  const tracks = [];
  const label = {water:"Water", temp:"Heat", humidity:"Humidity", plants:"Plants", shelter:"Shelter"};
  // Notes sometimes already end in punctuation ("Fire runs fast."), so do not double it.
  const sentence = t => /[.!?]$/.test(String(t).trim()) ? String(t).trim() : String(t).trim() + ".";

  ISLANDS.forEach(isl => {
    const c = isl.climate || {};
    tracks.push({
      id: `${isl.id}_scout_general`,
      text: cleanForSpeech(`${isl.name}. ${isl.zone} climate, ${isl.like}. ${c.summary || ""} `
        + `${c.rainWord || "Rain"}, about ${c.rainMm} millimetres. `
        + `Tap a letter on the map to scout a place for your settlers.`)
    });

    isl.sites.forEach(site => {
      const notes = FACTORS.map(f => `${label[f.key]}: ${sentence(site.notes[f.key])}`).join(" ");
      tracks.push({
        id: `${isl.id}_site_${site.letter.toLowerCase()}`,
        text: cleanForSpeech(`Place ${site.letter}: ${site.name}. ${sentence(site.blurb)} ${notes}`)
      });
    });

    (isl.years || []).forEach((yr, i) => {
      const card = isl.cards[i];
      const opts = card.opts.map((o, n) => `Choice ${n + 1}: ${o.t}.`).join(" ");
      tracks.push({
        id: `${isl.id}_y${yr.n}`,
        text: cleanForSpeech(`${isl.name}. Year ${yr.n} of 3. ${yr.title}. ${sentence(yr.headline)} `
          + `${card.q} Put them in order. Tap the best one first. ${opts}`)
      });
    });
  });

  return tracks;
}

AUDIO_TRACKS.push(...islandTracks(), ...resultTracks());

function pcmBase64ToWavBuffer(base64Str, sampleRate = 24000) {
  const pcmBytes = Buffer.from(base64Str, "base64");
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBytes.length;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBytes]);
}

// Records the text each wav was made from. Without this a track whose script changes
// keeps its old audio forever, which is how eight year tracks came to narrate options
// the game no longer offered.
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")); } catch (e) { manifest = {}; }

function textHash(text) {
  return require("crypto").createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

async function synthesize(track) {
  const outPath = path.join(OUTPUT_DIR, `${track.id}.wav`);
  const hash = textHash(track.text);
  const exists = fs.existsSync(outPath) && fs.statSync(outPath).size > 1000;
  if (!force && exists && manifest[track.id] === hash) {
    console.log(`   ⏩ [${track.id}] already exists, skipping.`);
    return false;
  }
  // A file with no manifest entry is adopted as-is rather than re-recorded. The free
  // tier allows 100 TTS requests per day and the library is ~100 tracks, so a blanket
  // re-record burns the whole day's quota and leaves the tail ungenerated. Use --reseed
  // when you genuinely need every track re-cut.
  if (!force && exists && !manifest[track.id] && !reseed) {
    manifest[track.id] = hash;
    console.log(`   📎 [${track.id}] adopted into manifest (not re-recorded).`);
    return false;
  }
  if (!force && exists && manifest[track.id] !== hash) {
    console.log(`   ♻️  [${track.id}] script changed - re-recording.`);
  }

  if (!hasApiKey && isMac) {
    console.log(`🎙️  Generating [${track.id}] with macOS Karen (en_AU)...`);
    const { execSync } = require("child_process");
    const tempAiff = `/tmp/say_${track.id}_${Date.now()}.aiff`;
    const tempTxt = `/tmp/say_${track.id}_${Date.now()}.txt`;
    fs.writeFileSync(tempTxt, track.text, "utf8");
    try {
      execSync(`say -v Karen -f "${tempTxt}" -o "${tempAiff}"`);
      execSync(`afconvert -f WAVE -d LEI16@24000 "${tempAiff}" "${outPath}"`);
      console.log(`   ✓ Saved: ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
      manifest[track.id] = hash;
    } finally {
      if (fs.existsSync(tempAiff)) fs.unlinkSync(tempAiff);
      if (fs.existsSync(tempTxt)) fs.unlinkSync(tempTxt);
    }
    return true;
  }

  const prompt = `Read this clearly, warmly, and at a steady pace for Year 3 Australian primary students (ages 8-9):\n\n${track.text}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice }
        }
      }
    }
  };

  console.log(`🎙️  Generating [${track.id}] with voice "${voice}"...`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    const e = new Error(`HTTP ${res.status}: ${err}`);
    e.status = res.status;
    // Only a per-day violation is worth stopping for; per-minute throttling just needs a wait.
    e.perDay = /PerDay|per_model_per_day|RequestsPerDay/i.test(err);
    const m = err.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/);
    e.retryAfter = m ? Math.ceil(parseFloat(m[1])) : null;
    throw e;
  }

  const data = await res.json();
  const part = data.candidates?.[0]?.content?.parts?.[0];
  if (!part || !part.inlineData || !part.inlineData.data) {
    throw new Error(`No audio data received for ${track.id}`);
  }

  const mime = (part.inlineData.mimeType || "").toLowerCase();
  let rate = 24000;
  const match = mime.match(/rate=(\d+)/);
  if (match && match[1]) rate = parseInt(match[1], 10);

  let buffer;
  if (mime.includes("wav") || mime.includes("mp3")) {
    buffer = Buffer.from(part.inlineData.data, "base64");
  } else {
    buffer = pcmBase64ToWavBuffer(part.inlineData.data, rate);
  }

  fs.writeFileSync(outPath, buffer);
  manifest[track.id] = hash;
  console.log(`   ✓ Saved: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  return true;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Per-minute throttling is normal on a long run; wait it out rather than giving up.
async function synthesizeWithRetry(track, attempts = 4) {
  for (let n = 1; ; n++) {
    try {
      return await synthesize(track);
    } catch (e) {
      if (e.status !== 429 || e.perDay || n >= attempts) throw e;
      const wait = Math.min(e.retryAfter ? e.retryAfter + 1 : 20 * n, 70);
      console.log(`   ⏳ [${track.id}] rate limited - waiting ${wait}s (attempt ${n}/${attempts - 1})`);
      await sleep(wait * 1000);
    }
  }
}

async function run() {
  if (dry) {
    const stale = AUDIO_TRACKS.filter(t => {
      const out = path.join(OUTPUT_DIR, `${t.id}.wav`);
      const exists = fs.existsSync(out) && fs.statSync(out).size > 1000;
      return !exists || manifest[t.id] !== textHash(t.text);
    });
    console.log(`\nDRY RUN - nothing recorded.\n`);
    console.log(`${stale.length} of ${AUDIO_TRACKS.length} tracks would be recorded:`);
    stale.forEach(t => console.log(`   ${t.id}`));
    console.log(`\nThat is ${stale.length} API requests (free tier allows 100/day).\n`);
    return;
  }
  console.log(`Starting audio check/generation for ${AUDIO_TRACKS.length} tracks...`);
  let count = 0;
  for (const track of AUDIO_TRACKS) {
    try {
      const generated = await synthesizeWithRetry(track);
      count++;
      if (generated && hasApiKey) {
        // Brief pause between Gemini API requests to respect rate limits
        await sleep(6000);
      }
    } catch (e) {
      const daily = e.perDay;
      console.error(`   ✕ Failed for [${track.id}]:`, e.message.split("\n")[0]);
      if (daily) {
        const left = AUDIO_TRACKS.length - count;
        console.error(`\n🛑 Daily TTS request quota reached for this project.`);
        console.error(`   ${left} track(s) not generated. Progress is saved - re-run tomorrow`);
        console.error(`   and only the missing tracks will be recorded.\n`);
        break;
      }
    }
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 1));
  console.log(`\nDone! Verified ${count} of ${AUDIO_TRACKS.length} tracks in settlement-game/audio/\n`);
}

run();
