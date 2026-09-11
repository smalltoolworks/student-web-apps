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
  --model="gemini-2.5-flash"

==============================================================
`);
  process.exit(1);
}

const OUTPUT_DIR = path.resolve(__dirname, "../settlement-game/audio");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Core narration texts matching the game screens
const AUDIO_TRACKS = [
  {
    id: "intro",
    text: "The Sunrise Islands. Where would you live? Four imaginary islands, four different climates. Nobody lives on them yet. You are the scout for 20 settlers. Settle at least two islands, then decide where you would live. Every place gives you two things to weigh up. People: how many can live there. And Room: how much space you have to live and play. A crowded place has small blocks and busy streets. An open place has lots of room to play. You cannot have both! Climate is the weather a place usually gets. Watch three things: how hot it is, how humid it is, and what plants grow."
  },
  {
    id: "arch_start",
    text: "Pick an island. Settle any two islands. Do more if you want to. Tap any island card to travel there."
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

  const outPath = path.join(OUTPUT_DIR, `${track.id}.wav`);
  fs.writeFileSync(outPath, buffer);
  console.log(`   ✓ Saved: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

async function run() {
  console.log(`Starting audio generation for ${AUDIO_TRACKS.length} tracks...`);
  for (const track of AUDIO_TRACKS) {
    try {
      await synthesize(track);
      await new Promise(r => setTimeout(r, 1200));
    } catch (e) {
      console.error(`   ✕ Failed for [${track.id}]:`, e.message);
    }
  }
  console.log("\nDone! Audio files are in settlement-game/audio/\n");
}

run();
