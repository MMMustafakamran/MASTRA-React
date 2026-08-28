/**
 * Voiceover muxing — the only implementation.
 *
 * Muxing happens once, in the process that produced the video. It used to be
 * possible for a shard and the workflow's consolidate job to both mux, which
 * layers a second audio track onto an already-muxed file; keeping it here makes
 * that unrepresentable. The workflow just installs ffmpeg and lets this run.
 *
 * WebM cannot carry AAC — the audio is re-encoded to libopus. Missing ffmpeg
 * is a skip, not a failure: a silent demo still beats no demo.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { AUDIO_DIR, VIDEOS_DIR } from './config.mjs';

/**
 * Which audio track belongs to which video, matched on the video filename —
 * which carries the demo name (e.g. `MASTRA-react-14-Frontend-Tools.webm`).
 *
 * To add a voiceover: drop the file in `autorecorder/audio/` and add one row
 * here. The mapping is explicit rather than inferred from filenames so a
 * renamed demo fails visibly instead of quietly muxing audio onto the wrong
 * clip -- `videoMatch` is matched against the video filename, and a demo whose
 * `videoName` changes drops its voiceover visibly.
 */
const AUDIO_TRACKS = [
  {
    audioFile: 'background-tasks-error.m4a',
    videoMatch: 'BackgroundTasks',
  },
];

function hasFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function muxAudioFiles() {
  if (AUDIO_TRACKS.length === 0) return;
  if (!fs.existsSync(AUDIO_DIR)) return;

  const tracks = AUDIO_TRACKS.filter((t) => fs.existsSync(path.join(AUDIO_DIR, t.audioFile)));
  if (tracks.length === 0) return;
  if (!fs.existsSync(VIDEOS_DIR)) return;

  if (!hasFfmpeg()) {
    console.log('ℹ️ [Audio Mux] ffmpeg not found in PATH; skipping (videos stay silent).');
    return;
  }

  const files = fs.readdirSync(VIDEOS_DIR);

  for (const track of tracks) {
    const audioPath = path.join(AUDIO_DIR, track.audioFile);
    const video = files.find(
      (f) => f.includes(track.videoMatch) && f.endsWith('.webm') && !f.startsWith('temp_'),
    );

    if (!video) {
      console.log(
        `ℹ️ [Audio Mux] No ${track.videoMatch} video in this run; skipping ${track.audioFile}.`,
      );
      continue;
    }

    const inputPath = path.join(VIDEOS_DIR, video);
    const tempPath = path.join(VIDEOS_DIR, `temp_${video}`);
    console.log(`\n🎵 [Audio Mux] Adding ${track.audioFile} to ${video}...`);

    try {
      execSync(
        // `-af apad` before `-shortest` is load-bearing: voiceovers are
        // shorter than the clips they narrate (37s of audio over a 121s
        // Background Tasks demo), and without padding `-shortest` truncates
        // the VIDEO down to the audio's length. Padding makes the audio
        // effectively endless so `-shortest` cuts on the video instead.
        `ffmpeg -y -i "${inputPath}" -i "${audioPath}" -c:v copy -c:a libopus -af apad -map 0:v:0 -map 1:a:0 -shortest "${tempPath}"`,
        { stdio: 'ignore' },
      );
      fs.copyFileSync(tempPath, inputPath);
      fs.unlinkSync(tempPath);
      console.log(`✅ [Audio Mux] Added audio to ${video}`);
    } catch (err) {
      console.warn(`⚠️ [Audio Mux] Could not mux ${track.audioFile}:`, err.message || err);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }
}
