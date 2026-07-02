/**
 * Short UI sounds synthesized with the Web Audio API — no bundled audio
 * assets, so there's nothing to license or attribute.
 */

let ctx: AudioContext | null = null;
const getContext = () => {
	if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
};

const MUTE_KEY = "shatranj-sound-muted";

export const isSoundMuted = () => localStorage.getItem(MUTE_KEY) === "true";

export const setSoundMuted = (muted: boolean) => {
	localStorage.setItem(MUTE_KEY, String(muted));
};

type Tone = { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number };

const playTones = (tones: Tone[]) => {
	if (isSoundMuted()) return;
	try {
		const audioCtx = getContext();
		const now = audioCtx.currentTime;
		tones.forEach(({ freq, start, duration, type = "sine", gain = 0.15 }) => {
			const osc = audioCtx.createOscillator();
			const gainNode = audioCtx.createGain();
			osc.type = type;
			osc.frequency.value = freq;
			gainNode.gain.setValueAtTime(gain, now + start);
			gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
			osc.connect(gainNode);
			gainNode.connect(audioCtx.destination);
			osc.start(now + start);
			osc.stop(now + start + duration);
		});
	} catch (err) {
		// Audio isn't critical to gameplay — fail silently (e.g. unsupported browser).
	}
};

export const playMoveSound = () => playTones([{ freq: 440, start: 0, duration: 0.08 }]);

export const playCaptureSound = () =>
	playTones([{ freq: 300, start: 0, duration: 0.1, type: "square", gain: 0.1 }]);

export const playCheckSound = () =>
	playTones([
		{ freq: 520, start: 0, duration: 0.09 },
		{ freq: 660, start: 0.08, duration: 0.12 },
	]);

export const playIllegalSound = () =>
	playTones([{ freq: 140, start: 0, duration: 0.15, type: "sawtooth", gain: 0.12 }]);

export const playGameEndSound = (outcome: "win" | "loss" | "draw") => {
	if (outcome === "win") {
		playTones([
			{ freq: 523, start: 0, duration: 0.15 },
			{ freq: 659, start: 0.12, duration: 0.15 },
			{ freq: 784, start: 0.24, duration: 0.3 },
		]);
	} else if (outcome === "loss") {
		playTones([
			{ freq: 392, start: 0, duration: 0.18, type: "triangle" },
			{ freq: 294, start: 0.16, duration: 0.35, type: "triangle" },
		]);
	} else {
		playTones([
			{ freq: 440, start: 0, duration: 0.15, type: "triangle" },
			{ freq: 440, start: 0.18, duration: 0.15, type: "triangle" },
		]);
	}
};

/** Picks a move/capture/check sound from a just-made chess.js position + move. */
export const soundForMove = (chessInCheck: boolean, move: { captured?: string }) => {
	if (chessInCheck) playCheckSound();
	else if (move.captured) playCaptureSound();
	else playMoveSound();
};
