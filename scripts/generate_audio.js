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

for (const arg of args) {
  if (arg.startsWith("--key=")) apiKey = arg.slice(6).trim();
  if (arg.startsWith("--voice=")) voice = arg.slice(8).trim();
  if (arg.startsWith("--model=")) model = arg.slice(8).trim();
}

apiKey = apiKey.replace(/^["']+|["']+$/g, "").trim();
voice = voice.replace(/^["']+|["']+$/g, "").trim();
model = model.replace(/^["']+|["']+$/g, "").trim();

if (!apiKey) {
  console.log(`
==============================================================
🎙️  The Sunrise Islands: Gemini Audio Pre-Generator
==============================================================

Pre-render high-definition Gemini AI voice files for all
game screens so students can listen with 0 latency, 0 quota,
and 100% offline capability on classroom iPads.

Usage:
  export GEMINI_API_KEY="AIzaSy..."
  node scripts/generate_audio.js

Options:
  --key="AIzaSy..."     Provide API key as an argument
  --voice="Aoede"       Voice name (Aoede, Puck, Kore, Charon, Fenrir)
  --model="gemini-2.5-flash-preview-tts"
  --force               Re-generate files even if they already exist

==============================================================
`);
  process.exit(1);
}

const OUTPUT_DIR = path.resolve(__dirname, "../settlement-game/audio");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Complete narration texts covering all game screens, places, and decisions
const AUDIO_TRACKS = [
  // 1. Core Narrative Screens
  {
    id: "intro",
    text: "The Sunrise Islands. Where would you live? Four imaginary islands, four different climates. Nobody lives on them yet. You are the scout for twenty settlers."
  },
  {
    id: "arch_start",
    text: "Pick an island. Climate is the weather a place usually gets. Look at how hot it is, how humid it is, that is how wet the air is, and what plants grow. Settle any two islands. Do more if you want to. Tap any island card to travel there."
  },
  {
    id: "arch_done1",
    text: "One island done! Settle one more, then you can go and think about Australia. Tap any island card to travel there."
  },
  {
    id: "arch_done2",
    text: "Two islands settled! Settle more if you want to, or tap I am ready to think about Australia."
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
    text: "What do you think? Write in your own words. Tap any word in the word bank to add it. Question 1: Most Australians live near the coast. Why? Question 2: Some Australians live far inland. Why did people move inland in the past, or live there today? Question 3: Where would you live, and why?"
  },

  // 2. Predict Screen
  {
    id: "predict_prompt",
    text: "Guess first! 20 settlers are moving to your settlement. How many people do you think will live here in 3 years? There is no wrong guess. About 5, about 20, about 40, or about 60?"
  },

  // 3. Island Scouting (General & 3 Places Each)
  // Palm Island (Tropical)
  {
    id: "palm_scout_general",
    text: "Palm Island. Tropical climate, like Darwin. Two seasons: The Wet and The Dry. Cyclones. Heavy rain, about 1,730 millimetres. Tap a letter on the map to scout a place for your settlers."
  },
  {
    id: "palm_site_a",
    text: "Place A: Breezy Hill. High clearing. Sea breeze. Water: River 2 tiles away. Heat: Hot, but breezy. Humidity: Wet, sticky air. Plants: Rainforest all round. Shelter: Rock and trees."
  },
  {
    id: "palm_site_b",
    text: "Place B: Deep Rainforest. Under tall trees, by the river. Water: River right here. Heat: Hot. No breeze. Humidity: Dripping wet. Plants: Big trees. Poor soil. Shelter: Trees block the wind."
  },
  {
    id: "palm_site_c",
    text: "Place C: Mangrove Shore. Muddy flats by the sea. Water: River 2 tiles away. Heat: Hot and steamy. Humidity: Wettest spot. Mosquitoes. Plants: Fish and crabs. No farms. Shelter: Low and open. Tide comes in."
  },

  // Red Island (Desert)
  {
    id: "red_scout_general",
    text: "Red Island. Desert climate, like Alice Springs. Almost no rain. Hot days, cold nights. Very little rain, about 280 millimetres. Tap a letter on the map to scout a place for your settlers."
  },
  {
    id: "red_site_a",
    text: "Place A: Spring Camp. Red rock by the waterhole. Water: Waterhole here. Never dries up. Heat: 42 degrees by day. Frost at night. Humidity: So dry you get thirsty. Plants: Only spinifex. Shelter: Rock gives shade."
  },
  {
    id: "red_site_b",
    text: "Place B: Salt Flat. Flat white salt crust. Water: Waterhole 3 tiles away. Heat: White ground throws heat back. Humidity: Bone dry. Plants: Salty. Only saltbush. Shelter: Rocks break the wind."
  },
  {
    id: "red_site_c",
    text: "Place C: Dune Field. Red sand hills that move. Water: No water. 5 tiles away. Heat: Sand burns feet, then freezes. Humidity: The driest spot. Plants: Bare sand. Shelter: Dunes move in the wind."
  },

  // Gold Island (Grassland)
  {
    id: "gold_scout_general",
    text: "Gold Island. Grassland climate, like Dubbo. Warm summers, cool winters. Summer storms. Low rain, about 580 millimetres. Tap a letter on the map to scout a place for your settlers."
  },
  {
    id: "gold_site_a",
    text: "Place A: Creek Bend. Deep grass by the creek. Water: Creek right here. Dries in drought. Heat: Pleasant. Cold winter nights. Humidity: Pleasant air. Plants: Thick grass. Good soil. Shelter: Few trees."
  },
  {
    id: "gold_site_b",
    text: "Place B: Stony Rise. Rocky rise over the plains. Water: Creek 2 tiles away. Heat: Warm, windy. Humidity: Dry breeze. Plants: Scattered gum trees. Shelter: Rocks and trees."
  },
  {
    id: "gold_site_c",
    text: "Place C: Open Plain. Flat grass to the horizon. Water: Creek 4 tiles away. Heat: Hot sun, cold wind. Humidity: Pleasant air. Plants: Endless grass. Shelter: No trees at all."
  },

  // Green Island (Temperate)
  {
    id: "green_scout_general",
    text: "Green Island. Temperate climate, like Sydney. Four mild seasons. Rain spread across the year. Rain all year, about 1,220 millimetres. Tap a letter on the map to scout a place for your settlers."
  },
  {
    id: "green_site_a",
    text: "Place A: River Flats. Flat green land by the river. Water: River right here. Floods in big rain. Heat: Pleasant. Cool winter. Humidity: Pleasant air. Plants: Tall trees. Rich farm soil. Shelter: Trees near the river."
  },
  {
    id: "green_site_b",
    text: "Place B: Woodland Hill. Clearing in the gum trees. Water: River 2 tiles away. Heat: Gentle sun and shade. Humidity: Pleasant air. Plants: Gum trees and ferns. Shelter: Trees block the wind."
  },
  {
    id: "green_site_c",
    text: "Place C: Windy Point. Bare headland in the sea. Water: River 4 tiles away. Salty sea water. Heat: Cool sea breeze all day. Humidity: Salty air. Plants: Short scrub only. Shelter: Bare rock. Very windy."
  },

  // 4. Island Year Decision Cards
  // Palm Island Cards
  {
    id: "palm_y1",
    text: "Palm Island. Year 1 of 3. Settling In. The settlers land and start building. How should we build our houses? Think about the climate here. Choice 1: Thick mud walls. Choice 2: On stilts, off the wet ground. Choice 3: Low on the ground."
  },
  {
    id: "palm_y2",
    text: "Palm Island. Year 2 of 3. The Big Wet. Rain for weeks. Six weeks of rain. The food is going mouldy. Think about the climate here. Choice 1: Cover it with palm leaves. Choice 2: Bury it to keep it cool. Choice 3: Lift the store up and dry food by the fire."
  },
  {
    id: "palm_y3",
    text: "Palm Island. Year 3 of 3. Cyclone! A cyclone is coming! Think about the climate here. Choice 1: Shelter in the rock cave. Choice 2: Tie the roofs down and stay. Choice 3: Go to the beach and watch."
  },

  // Red Island Cards
  {
    id: "red_y1",
    text: "Red Island. Year 1 of 3. Settling In. The settlers arrive, looking for shade. Where do we build to escape the heat? Think about the climate here. Choice 1: Flat tin roof in the sun. Choice 2: Dig down into the cool ground or rock shade. Choice 3: Big glass windows."
  },
  {
    id: "red_y2",
    text: "Red Island. Year 2 of 3. Heatwave. Two weeks over 45 degrees. Summer heat is here. Water dries up fast. Think about the climate here. Choice 1: Dig for water in the dry creek. Choice 2: Drink less and wait. Choice 3: Leave water in open buckets."
  },
  {
    id: "red_y3",
    text: "Red Island. Year 3 of 3. The Long Dry. A whole year with no rain. No rain for a year. Crops dry up and die. Think about the climate here. Choice 1: Try to plant tomatoes. Choice 2: Eat desert bush food and seeds. Choice 3: Wait for a cloud."
  },

  // Gold Island Cards
  {
    id: "gold_y1",
    text: "Gold Island. Year 1 of 3. Settling In. The settlers arrive, grass up to their knees. How should we feed our 20 settlers? Think about the climate here. Choice 1: Grow rainforest fruit. Choice 2: Plant wheat and keep sheep. Choice 3: Dig for fish in the dry dirt."
  },
  {
    id: "gold_y2",
    text: "Gold Island. Year 2 of 3. Bushfire Season. Hot summer, dry grass. Lightning starts a grass fire! Think about the climate here. Choice 1: Burn small patches early, caring for Country. Choice 2: Let the dry grass grow right up to the huts. Choice 3: Hide in the tall dry grass."
  },
  {
    id: "gold_y3",
    text: "Gold Island. Year 3 of 3. Drought. The creek stops running. Deep water wells keep inland towns alive. Drought! The creek has dried up. Think about the climate here. Choice 1: Move everyone away immediately. Choice 2: Drill a deep well down into ground water. Choice 3: Wash all clothes in the drinking water."
  },

  // Green Island Cards
  {
    id: "green_y1",
    text: "Green Island. Year 1 of 3. Settling In. The settlers arrive in spring. Where do the houses go? Think about the climate here. Choice 1: High on the windy hill. Choice 2: Right on the riverbank. Choice 3: Near the river, above the flood line."
  },
  {
    id: "green_y2",
    text: "Green Island. Year 2 of 3. First Harvest. A mild summer with steady rain. What is the best farm crop here? Think about the climate here. Choice 1: Desert spinifex. Choice 2: Vegetables, fruit and orchard trees. Choice 3: Mangrove crabs."
  },
  {
    id: "green_y3",
    text: "Green Island. Year 3 of 3. Flooding Rain. Three days of torrential rain. The river is rising fast! Think about the climate here. Choice 1: Move food and animals to high ground. Choice 2: Go swimming in the flood. Choice 3: Build a fence across the river."
  },

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

async function synthesize(track) {
  const outPath = path.join(OUTPUT_DIR, `${track.id}.wav`);
  if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
    console.log(`   ⏩ [${track.id}] already exists, skipping.`);
    return;
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
    throw new Error(`HTTP ${res.status}: ${err}`);
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
  console.log(`   ✓ Saved: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function run() {
  console.log(`Starting audio generation for ${AUDIO_TRACKS.length} tracks...`);
  let count = 0;
  for (const track of AUDIO_TRACKS) {
    try {
      await synthesize(track);
      count++;
      // Brief pause between requests to respect rate limits
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(`   ✕ Failed for [${track.id}]:`, e.message);
    }
  }
  console.log(`\nDone! Processed ${count} of ${AUDIO_TRACKS.length} tracks in settlement-game/audio/\n`);
}

run();
