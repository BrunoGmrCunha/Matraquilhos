// =====================
// Áudio, ecrã ligado e efeitos
// =====================
function createSilentWavUrl() {
    const sampleRate = 8000;
    const samples = sampleRate; // 1 second
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    const writeText = (offset, text) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
    writeText(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeText(8, 'WAVE');
    writeText(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, 'data');
    view.setUint32(40, samples * 2, true);
    return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

function initAudioContext() {
    try {
        // Makes iOS use the "playback" audio session, so the ringer switch does not mute Web Audio
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) { /* not supported */ }

    if (!silentAudio) {
        silentAudio = new Audio(createSilentWavUrl());
        silentAudio.loop = true;
        silentAudio.setAttribute('playsinline', '');
    }
    silentAudio.play().catch(() => { });

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    resumeAudioContext();
}

function resumeAudioContext() {
    if (audioContext && audioContext.state !== 'running') {
        // iOS may report 'suspended' or 'interrupted'
        audioContext.resume().catch(() => { });
    }
}

function enableKeepAwake() {
    if (typeof NoSleep === 'undefined') return;
    if (!noSleep) noSleep = new NoSleep();
    if (!noSleep.isEnabled) noSleep.enable().catch(() => { });
}

// Unlock audio on any user gesture and recover it when the page comes back to the foreground
['touchstart', 'touchend', 'click'].forEach(evt =>
    document.addEventListener(evt, () => { if (audioContext) resumeAudioContext(); }, { passive: true }));
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        resumeAudioContext();
        if (silentAudio && silentAudio.paused) silentAudio.play().catch(() => { });
        if (noSleep && !noSleep.isEnabled) noSleep.enable().catch(() => { });
    }
});

/** Plays one tone; `offset` is the delay in seconds, `slideTo` glides the pitch. */
function playTone(frequency, offset, durationSecs, { type = 'sine', volume = 0.6, slideTo = null } = {}) {
    if (!audioContext || !soundOn) return;
    resumeAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Short fade in/out avoids clicks and keeps the sound audible on iOS
    const start = audioContext.currentTime + offset;
    const end = start + durationSecs;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) oscillator.frequency.linearRampToValueAtTime(slideTo, end);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gainNode.gain.setValueAtTime(volume, Math.max(start + 0.01, end - 0.03));
    gainNode.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.start(start);
    oscillator.stop(end + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); gainNode.disconnect(); };
}

function beep(frequency = 1000, duration = 200) {
    playTone(frequency, 0, duration / 1000, { volume: 1 });
}

function playGoalSound() {
    [523, 659, 784, 1047].forEach((f, i) => playTone(f, i * 0.09, 0.18, { type: 'triangle' }));
}

function playOwnGoalSound() {
    playTone(380, 0, 0.35, { type: 'sawtooth', volume: 0.35, slideTo: 260 });
    playTone(300, 0.38, 0.5, { type: 'sawtooth', volume: 0.35, slideTo: 160 });
}

function playFanfare() {
    const notes = [[523, 0], [523, 0.15], [523, 0.3], [659, 0.45], [784, 0.7], [659, 0.95], [784, 1.15], [1047, 1.4]];
    notes.forEach(([f, t]) => playTone(f, t, t === 1.4 ? 0.7 : 0.2, { type: 'square', volume: 0.3 }));
}

function playWhistle() {
    if (!audioContext || !soundOn) return;
    resumeAudioContext();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const vibrato = audioContext.createOscillator();
    const vibratoGain = audioContext.createGain();
    const gainNode = audioContext.createGain();

    oscillator.frequency.value = 2600;
    vibrato.frequency.value = 35;
    vibratoGain.gain.value = 160;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(oscillator.frequency);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.5, now + 0.02);
    gainNode.gain.setValueAtTime(0.5, now + 0.4);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    oscillator.start(now);
    vibrato.start(now);
    oscillator.stop(now + 0.55);
    vibrato.stop(now + 0.55);
}

function speak(text) {
    if (!voiceOn || !soundOn || !('speechSynthesis' in window)) return;
    try {
        if (window.speechSynthesis.pending) window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT';
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
    } catch (e) { /* speech not available */ }
}

function celebrateGoal(team, player, isOwnGoal) {
    if (isOwnGoal) {
        playOwnGoalSound();
        speak(`Autogolo de ${player.name}`);
        vibrate([80, 40, 80]);
    } else {
        playGoalSound();
        speak(`Golo! ${player.name}`);
        vibrate(40);
    }
    const result = document.getElementById('result');
    result.classList.remove('goal-flash');
    void result.offsetWidth; // restarts the animation
    result.classList.add('goal-flash');
}

function celebrateWinner(team) {
    playFanfare();
    launchConfetti();
    vibrate([100, 50, 100, 50, 200]);
    speak(`Vitória da equipa ${team === 'red' ? 'vermelha' : 'branca'}!`);
}

function launchConfetti(duration = 2800) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = ['#a40000', '#0061A8', '#f5c400', '#2ecc71', '#ff7ab2', '#8e44ad'];
    const pieces = Array.from({ length: 140 }, () => ({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.5,
        size: 6 + Math.random() * 8,
        speedY: 2 + Math.random() * 4,
        speedX: -2 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        spin: -0.2 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)]
    }));
    const startedAt = performance.now();

    function frame(now) {
        const elapsed = now - startedAt;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pieces.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.angle += p.spin;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            ctx.restore();
        });
        if (elapsed < duration) {
            requestAnimationFrame(frame);
        } else {
            canvas.remove();
        }
    }
    requestAnimationFrame(frame);
}

// =====================
// Definições (som / voz)
// =====================
function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        if (typeof saved.soundOn === 'boolean') soundOn = saved.soundOn;
        if (typeof saved.voiceOn === 'boolean') voiceOn = saved.voiceOn;
    } catch (e) { /* storage not available */ }
    updateToggleLabels();
}

function saveSettings() {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ soundOn, voiceOn }));
    } catch (e) { /* storage not available */ }
}

function toggleSound() {
    soundOn = !soundOn;
    saveSettings();
    updateToggleLabels();
}

function toggleVoice() {
    voiceOn = !voiceOn;
    saveSettings();
    updateToggleLabels();
}

function updateToggleLabels() {
    const soundButton = document.getElementById('toggle-sound');
    const voiceButton = document.getElementById('toggle-voice');
    if (soundButton) {
        soundButton.textContent = soundOn ? '🔊 Som: ligado' : '🔇 Som: desligado';
        soundButton.setAttribute('aria-pressed', String(soundOn));
    }
    if (voiceButton) {
        voiceButton.textContent = voiceOn ? '📣 Voz: ligada' : '🤐 Voz: desligada';
        voiceButton.setAttribute('aria-pressed', String(voiceOn));
    }
}
