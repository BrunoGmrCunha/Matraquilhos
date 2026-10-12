// =====================
// Lista de Jogadores
// =====================
const playersList = [
    { id: "44FCF28D-6B18-45B1-AEDF-37D8E2351827", name: "Ricardo Cunha" },
    { id: "79D89805-0B9E-42A2-83FA-3A8BF8FF9273", name: "Rui Oliveira" },
    { id: "03B5261F-8DFB-4A26-963C-3C01074E7321", name: "Jéssica Beatriz" },
    { id: "B3DAA032-8B61-495E-B15C-69AB95CCFB61", name: "David Cunha" },
    { id: "D330F617-1CBF-4E83-AD32-76C596BEEC88", name: "Cátia Oliveira" },
    { id: "6729004F-77AC-4CD7-9135-7C1536A7F44C", name: "Bruno Cunha" },
    { id: "6614396B-804E-4DA1-B548-81F4C922C5E3", name: "Rita Ferreira" },
    { id: "7B726A6F-8821-41E7-95F7-8C70E456E6F4", name: "João Costa" },
    { id: "18BA18FE-51ED-477A-AC53-9AC86F40D93B", name: "Fábio Alexandre" },
    { id: "EA83D6DD-0409-47BF-936B-B58D325599BD", name: "Alexandre Abreu" },
    { id: "0271D9AE-13D1-4607-8F72-B9368BE2CAC2", name: "Diogo Melo" },
    { id: "86CFA583-4F61-47EB-ACB0-CBBADB75A754", name: "Rui Silva" },
    { id: "44D286DF-8714-4AA8-8337-F621F5C21098", name: "Jean-Marc Barbosa" },
    { id: "604702FC-41B0-4672-85E1-F994508227F2", name: "Bernardo Barbosa" },
    { id: "62f3f4e9-2219-47a8-b6fe-06c2b90588b0", name: "Zequinha 1" },
    { id: "1dceb530-8d3f-4b0c-84ce-e220754f3e4f", name: "Zequinha 2" },
    { id: "7c7ec656-3444-455f-8b9f-613dc8257e55", name: "Sara Gomes" }
];

// =====================
// Variáveis Globais
// =====================
let games = [];
let playersScore = [];
let currentGame = null;
let timer = null;
let timeLeft = 0;
let gameTime = 120;
let audioContext = null;
let gridApi;
let isPaused = false;
let confirmCallback = null;
let longPressDuration = 600; // em milissegundos
let longPressFired = false;
let tournamentEnded = false;
let soundOn = true;
let voiceOn = true;
let noSleep = null;
let silentAudio = null;
let lastFocusedElement = null;

const STATE_KEY = 'matraquilhos-state';
const SETTINGS_KEY = 'matraquilhos-settings';
const SELECT_IDS = ['player-red-1', 'player-red-2', 'player-white-1', 'player-white-2', 'next-player-1', 'next-player-2'];

const columnDefs = [
    { headerName: "Nome", field: "name", sortable: true, filter: true },
    { headerName: "Golos", field: "goals", sortable: true, filter: "agNumberColumnFilter", cellStyle: { textAlign: "center" } },
    { headerName: "AutoGolos", field: "ownGoals", sortable: true, filter: "agNumberColumnFilter", cellStyle: { textAlign: "center" } },
    { headerName: "Vitórias", field: "wins", sortable: true, filter: "agNumberColumnFilter", cellStyle: { textAlign: "center" } },
    { headerName: "Derrotas", field: "losses", sortable: true, filter: "agNumberColumnFilter", cellStyle: { textAlign: "center" } },
    { headerName: "Empates", field: "ties", sortable: true, filter: "agNumberColumnFilter", cellStyle: { textAlign: "center" } }
];
const { themeQuartz } = agGrid;

// =====================
// Utilidades
// =====================
function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.body.classList.toggle('in-game', id === 'view-game');
}

function closeModal() {
    document.getElementById("customModal").style.display = "none";
    confirmCallback = null;
    if (lastFocusedElement) lastFocusedElement.focus();
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function vibrate(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

/** Returns the score of a game, own goals counting for the opposing team. */
function getScore(game) {
    const sum = (team, field) => team.reduce((total, p) => total + p[field], 0);
    return {
        red: sum(game.red, 'goals') + sum(game.white, 'ownGoals'),
        white: sum(game.white, 'goals') + sum(game.red, 'ownGoals')
    };
}

// =====================
// Streaks e alcunhas
// =====================
let toastTimer = null;

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/** Consecutive wins of a player over the finished games (a tie or a loss breaks the streak). */
function getWinStreak(name) {
    let streak = 0;
    for (let i = games.length - 1; i >= 0; i--) {
        const game = games[i];
        const team = ['red', 'white'].find(t => game[t].some(p => p.name === name));
        if (!team) continue; // did not play this game
        if (!game.isTie && game.winner === team) streak++;
        else break;
    }
    return streak;
}

/** Nicknames earned so far in the tournament, as a short text. */
function getNicknames(name) {
    const allGames = (currentGame && !games.includes(currentGame)) ? [...games, currentGame] : games;
    let goals = 0;
    let ownGoals = 0;
    let clutch = 0;
    allGames.forEach(game => ['red', 'white'].forEach(team => game[team].forEach(p => {
        if (p.name !== name) return;
        goals += p.goals;
        ownGoals += p.ownGoals;
        clutch += p.clutch || 0;
    })));

    const streak = getWinStreak(name);
    const nicknames = [];
    if (streak >= 5) nicknames.push('Lenda 👑');
    else if (streak >= 3) nicknames.push('Em chamas 🔥');
    if (goals >= 5) nicknames.push('Matador 🎯');
    if (clutch > 0) nicknames.push('Clutch ⏱️');
    if (ownGoals >= 2) nicknames.push('Autogolista 🙈');
    return nicknames.join(' · ');
}

function announceStreaks(winnerTeam) {
    currentGame[winnerTeam].forEach(player => {
        const streak = getWinStreak(player.name);
        if (streak === 3 || streak === 5) {
            const nickname = streak === 3 ? 'em chamas' : 'uma lenda';
            showToast(`${streak === 3 ? '🔥' : '👑'} ${player.name} está ${nickname}! (${streak} vitórias seguidas)`);
            speak(`${player.name} está ${nickname}!`);
        }
    });
}

function teamLabel(team) {
    return team === 'red' ? '🔴 Equipa Vermelha' : '⚪ Equipa Branca';
}

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

// =====================
// Persistência do torneio
// =====================
function collectSelectState() {
    const selects = {};
    SELECT_IDS.forEach(id => {
        const select = document.getElementById(id);
        selects[id] = { value: select.value, disabled: select.disabled };
    });
    return selects;
}

function saveState() {
    try {
        if (!currentGame && games.length === 0) return;
        const activeView = document.querySelector('.view.active');
        localStorage.setItem(STATE_KEY, JSON.stringify({
            savedAt: new Date().toISOString(),
            games,
            playersScore,
            currentGame,
            timeLeft,
            tournamentEnded,
            view: activeView ? activeView.id : 'view-random',
            selects: collectSelectState(),
            winnerTeam: document.getElementById('winner-team').value
        }));
    } catch (e) { /* storage not available */ }
}

function clearState() {
    try {
        localStorage.removeItem(STATE_KEY);
    } catch (e) { /* storage not available */ }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function reviveGame(game) {
    return {
        ...game,
        startTime: new Date(game.startTime),
        endTime: game.endTime ? new Date(game.endTime) : null
    };
}

function checkSavedTournament() {
    const state = loadState();
    if (!state || (!state.currentGame && (!state.games || state.games.length === 0))) return;

    const finished = state.games ? state.games.length : 0;
    const when = new Date(state.savedAt).toLocaleString('pt-PT');
    document.getElementById('resume-info').textContent =
        `Torneio guardado (${when}) com ${finished} jogo(s) terminado(s).`;
    document.getElementById('resume-banner').style.display = 'block';
}

function discardSavedTournament() {
    clearState();
    document.getElementById('resume-banner').style.display = 'none';
}

function resumeTournament() {
    const state = loadState();
    if (!state) return;

    initAudioContext();
    enableKeepAwake();

    games = (state.games || []).map(reviveGame);
    playersScore = state.playersScore || [];
    currentGame = state.currentGame ? reviveGame(state.currentGame) : null;
    timeLeft = state.timeLeft || 0;
    tournamentEnded = !!state.tournamentEnded;

    SELECT_IDS.forEach(id => {
        const saved = state.selects ? state.selects[id] : null;
        populatePlayerSelect(id, saved && saved.value ? saved.value : null);
        document.getElementById(id).disabled = !!(saved && saved.disabled);
    });
    checkPlayers();
    checkNextPlayers(false);
    document.getElementById('winner-team').value = state.winnerTeam || '';
    onChangeSelect('winner-team');

    if (games.length > 0) {
        document.getElementById('back-to-random-button').style.display = 'none';
        document.getElementById('swap-sides-button').style.display = 'block';
    }

    document.getElementById('resume-banner').style.display = 'none';

    if (tournamentEnded) {
        renderWinnerLabel(currentGame);
        renderTournamentSummary();
        showView('view-summary');
    } else if (state.view === 'view-game' && currentGame) {
        document.getElementById('score-board').style.display = 'block';
        document.getElementById('game').style.display = 'block';
        document.getElementById('tie-breaker').style.display = 'none';
        updateScoreBoard();
        updateTimerDisplay();
        showView('view-game');
        if (timeLeft > 0) {
            startTimer();
            isPaused = true; // the game stays paused until the timer is tapped
            updateTimerDisplay();
        } else {
            checkWinner();
        }
    } else if (state.view === 'view-summary' && currentGame) {
        endGame(false);
    } else {
        showView(state.view || 'view-select');
    }
}

// =====================
// Seleção de Jogadores
// =====================
function populatePlayerSelect(selectId, selectedPlayer = null) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "seleciona um jogador";
    defaultOption.disabled = true;
    if (!selectedPlayer) defaultOption.selected = true;
    select.appendChild(defaultOption);

    playersList.sort((a, b) => a.name.localeCompare(b.name));
    playersList.forEach(player => {
        const option = document.createElement("option");
        option.value = player.id;
        option.text = player.name;
        if (player.id === selectedPlayer) option.selected = true;
        select.appendChild(option);
    });
}

function populateRandomPlayerSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "seleciona 4 jogadores";
    defaultOption.disabled = true;
    select.appendChild(defaultOption);

    playersList.sort((a, b) => a.name.localeCompare(b.name));
    playersList.forEach(player => {
        const option = document.createElement("option");
        option.value = player.id;
        option.text = player.name;
        select.appendChild(option);
    });
    select.size = select.options.length;
}

// =====================
// Navegação
// =====================
function backToTeam() { showView("view-select"); }
function backToRandom() { showView("view-random"); }

// =====================
// Lógica do Jogo
// =====================
function random() {
    let randomPlayers = document.getElementById("random-players");
    let selectedPlayers = Array.from(randomPlayers.selectedOptions).map(o => o.value);
    if (selectedPlayers.length !== 4) {
        alert("Selecione exatamente 4 jogadores.");
        return;
    }

    for (let i = selectedPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedPlayers[i], selectedPlayers[j]] = [selectedPlayers[j], selectedPlayers[i]];
    }

    populatePlayerSelect('player-red-1', selectedPlayers[0]);
    populatePlayerSelect('player-red-2', selectedPlayers[1]);
    populatePlayerSelect('player-white-1', selectedPlayers[2]);
    populatePlayerSelect('player-white-2', selectedPlayers[3]);
    populatePlayerSelect('next-player-1');
    populatePlayerSelect('next-player-2');
    document.getElementById("start-button").disabled = false;
    checkPlayers()

    showView('view-select');
}

function jumpRandom() {
    populatePlayerSelect('player-red-1');
    populatePlayerSelect('player-red-2');
    populatePlayerSelect('player-white-1');
    populatePlayerSelect('player-white-2');
    populatePlayerSelect('next-player-1');
    populatePlayerSelect('next-player-2');
    showView('view-select');
}

function startGame() {
    const redPlayers = [...document.getElementById('team-red').querySelectorAll('select')].map(s => playersList.find(p => p.id === s.value));
    const whitePlayers = [...document.getElementById('team-white').querySelectorAll('select')].map(s => playersList.find(p => p.id === s.value));

    currentGame = {
        red: redPlayers.map(p => ({ ...p, goals: 0, ownGoals: 0 })),
        white: whitePlayers.map(p => ({ ...p, goals: 0, ownGoals: 0 })),
        winner: null,
        startTime: new Date(),
        endTime: null,
        isTie: false,
        isGameOfDay: false
    };

    timeLeft = gameTime;
    startTimer();
    updateScoreBoard();
    document.getElementById('score-board').style.display = 'block';
    document.getElementById('tie-breaker').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    populatePlayerSelect('next-player-1');
    populatePlayerSelect('next-player-2');
    document.getElementById('winner-team').value = ""
    onChangeSelect('winner-team');

    showView('view-game');
    document.getElementById('view-game').scrollIntoView({ behavior: "smooth" });
    playWhistle();
    saveState();
}

function renderWinnerLabel(game) {
    const label = document.getElementById('winner-team-label');
    label.textContent = '';
    if (game && game.winner) label.textContent = teamLabel(game.winner);
}

function endGame(celebrate = true) {
    let winnerTeam = currentGame.winner;

    if (winnerTeam === null) {
        currentGame.isTie = true;
        winnerTeam = document.getElementById('winner-team').value;
    }
    document.getElementById('winner-team-label').textContent = winnerTeam ? teamLabel(winnerTeam) : '';

    showView('view-summary');
    if (celebrate) celebrateWinner(winnerTeam);
    saveState();
}

function finalizeGame(isGameOfDay = false) {
    clearInterval(timer);
    if (!currentGame.winner) {
        currentGame.winner = null
    }
    else {
        currentGame.isGameOfDay = isGameOfDay;
    }
    currentGame.endTime = new Date();
    const durationMs = currentGame.endTime - currentGame.startTime;
    const durationSecs = Math.floor(durationMs / 1000);
    const mins = String(Math.floor(durationSecs / 60)).padStart(2, '0');
    const secs = String(durationSecs % 60).padStart(2, '0');
    currentGame.time = `${mins}:${secs}`;
    games.push(currentGame);
    if (!currentGame.winner) {
        currentGame.winner = document.getElementById('winner-team').value;
    }
}

function newGame() {
    document.getElementById('back-to-random-button').style.display = 'none';
    finalizeGame();
    const winningTeam = currentGame[currentGame.winner];
    const winnerIds = winningTeam.map(p => p.id);
    // A next player that belongs to the winning team cannot also replace the losers
    const nextIds = ['next-player-1', 'next-player-2']
        .map(id => document.getElementById(id).value)
        .map(v => winnerIds.includes(v) ? null : v);
    const loserSide = currentGame.winner === 'red' ? 'white' : 'red';

    document.getElementById('team-red').style.display = 'block';
    document.getElementById('team-white').style.display = 'block';
    populatePlayerSelect(`player-${currentGame.winner}-1`, winnerIds[0]);
    populatePlayerSelect(`player-${currentGame.winner}-2`, winnerIds[1]);
    populatePlayerSelect(`player-${loserSide}-1`, nextIds[0]);
    populatePlayerSelect(`player-${loserSide}-2`, nextIds[1]);
    document.getElementById(`player-${currentGame.winner}-1`).disabled = true;
    document.getElementById(`player-${currentGame.winner}-2`).disabled = true;
    document.getElementById(`player-${loserSide}-1`).disabled = false;
    document.getElementById(`player-${loserSide}-2`).disabled = false;
    document.getElementById('swap-sides-button').style.display = 'block';
    checkPlayers();
    showView('view-select');
    saveState();
    if (!currentGame.isTie) announceStreaks(currentGame.winner);
}

// Winners and the next challengers switch fields (red <-> white)
function swapSides() {
    const ids = ['player-red-1', 'player-red-2', 'player-white-1', 'player-white-2'];
    const [r1, r2, w1, w2] = ids.map(id => document.getElementById(id));
    const values = [w1.value, w2.value, r1.value, r2.value];
    const disabled = [w1.disabled, w2.disabled, r1.disabled, r2.disabled];

    ids.forEach((id, i) => {
        populatePlayerSelect(id, values[i] || null);
        document.getElementById(id).disabled = disabled[i];
    });
    checkPlayers();
    saveState();
}

function newTournament() {
    clearState();
    window.location.reload();
}

function reftifyGame() {
    document.getElementById('score-board').style.display = 'block';
    document.getElementById('game').style.display = 'block';
    currentGame.winner = null;
    currentGame.isTie = false;
    const winnerTeamSelect = document.getElementById('winner-team');
    if (winnerTeamSelect.value === "") {
        document.getElementById('tie-breaker').style.display = 'none';
    }
    else {
        document.getElementById('tie-breaker').style.display = 'block';
    }
    showView('view-game');
    saveState();
}

// =====================
// Temporizador
// =====================
function startTimer() {
    clearInterval(timer);
    isPaused = false;
    updateTimerDisplay();
    timer = setInterval(() => {
        if (!isPaused && timeLeft > 0) {
            timeLeft--;

            if (timeLeft <= 5 && timeLeft > 0) {
                beep();
            }
            updateTimerDisplay();
            saveState();
        }
        if (timeLeft === 0) {
            beep(1500, 1000);
            vibrate(300);
            clearInterval(timer);
            checkWinner();
        }
    }, 1000);
}

function pauseResumeTimer() {
    isPaused = !isPaused;
    updateTimerDisplay();
}

function pauseTimer() {
    isPaused = true;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    const display = document.getElementById('game-timer');
    display.textContent = `${mins}:${secs}`;
    display.classList.toggle('paused', isPaused);
    display.setAttribute('aria-label',
        `Tempo restante ${mins} minutos e ${secs} segundos. ${isPaused ? 'Em pausa, toque para retomar' : 'Toque para pausar'}`);
}

// =====================
// Scoreboard
// =====================
function createScoreButton(text, ariaLabel, isOwnGoal, onAdd, onRemove) {
    const button = document.createElement('button');
    let pressTimer = null;
    button.type = 'button';
    button.textContent = text;
    button.setAttribute('aria-label', ariaLabel);
    if (isOwnGoal) button.classList.add('own-goal');

    // Long press removes a goal; the click that follows a long press must not add it back
    button.addEventListener('touchstart', () => {
        longPressFired = false;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
            longPressFired = true;
            vibrate(70);
            onRemove();
        }, longPressDuration);
    }, { passive: true });
    ['touchend', 'touchcancel', 'touchmove'].forEach(evt =>
        button.addEventListener(evt, () => clearTimeout(pressTimer), { passive: true }));
    button.addEventListener('click', () => {
        if (longPressFired) {
            longPressFired = false;
            return;
        }
        onAdd();
    });
    return button;
}

function updateScoreBoard() {
    const board = document.getElementById('score-board');
    const resultGame = document.getElementById('result');
    board.innerHTML = '';
    const score = getScore(currentGame);
    resultGame.textContent = `🔴 ${score.red} - ${score.white} ⚪ `;

    ['red', 'white'].forEach(team => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('team-section')
        wrapper.classList.add(team === 'red' ? 'red' : 'white')

        const title = document.createElement('h3');
        title.textContent = teamLabel(team);
        wrapper.appendChild(title);

        currentGame[team].forEach(player => {
            const div = document.createElement('div');
            div.classList.add('score-controls')

            const text = document.createElement('div');
            text.classList.add('score-text');
            const name = document.createElement('span');
            name.classList.add('player-name');
            name.textContent = player.name;
            const stats = document.createElement('span');
            stats.classList.add('score-stats');
            stats.textContent = `${player.goals} golo(s) · ${player.ownGoals} autogolo(s)`;
            text.appendChild(name);
            text.appendChild(stats);

            const nicknames = getNicknames(player.name);
            if (nicknames) {
                const badge = document.createElement('span');
                badge.classList.add('nicknames');
                badge.textContent = nicknames;
                text.appendChild(badge);
            }
            div.appendChild(text);

            const buttons = document.createElement('div');
            buttons.classList.add('score-controls-buttons');
            buttons.appendChild(createScoreButton('+ Golo', `Golo de ${player.name}`, false,
                () => addGoal(team, player.id), () => removeGoal(team, player.id)));
            buttons.appendChild(createScoreButton('+ Auto', `Autogolo de ${player.name}`, true,
                () => addOwnGoal(team, player.id), () => removeOwnGoal(team, player.id)));
            div.appendChild(buttons);

            wrapper.appendChild(div);
        });

        board.appendChild(wrapper);
    });
}

function getPlayerScore(id) {
    return playersScore.find(player => player.id === id);
}

function addGoal(team, id) {
    const score = getScore(currentGame);

    if (score[team] < 3) {
        const player = currentGame[team].find(p => p.id === id);
        player.goals++;
        const isClutch = timeLeft > 0 && timeLeft <= 3;
        if (isClutch) player.clutch = (player.clutch || 0) + 1;
        const playerScore = getPlayerScore(id);

        if (!playerScore) {
            playersScore.push({
                id: id,
                name: playersList.find(p => p.id === id).name,
                goals: 1,
                ownGoals: 0
            });
        } else {
            playerScore.goals += 1;
        }

        updateScoreBoard();
        celebrateGoal(team, player, false);
        if (isClutch) {
            showToast(`⏱️ CLUTCH! ${player.name} marcou mesmo em cima da hora!`);
            speak('Clutch!');
        }
        saveState();
        checkWinner();
    }
}

function removeGoal(team, id) {
    const player = currentGame[team].find(p => p.id === id);
    if (player.goals > 0) {
        player.goals--;
        if (player.clutch) player.clutch = Math.min(player.clutch, player.goals);
        const playerScore = getPlayerScore(id);
        if (playerScore) playerScore.goals -= 1;
        updateScoreBoard();
        saveState();
        checkWinner();
    }
}

function addOwnGoal(team, id) {
    const score = getScore(currentGame);
    const opponent = team === 'red' ? 'white' : 'red';

    if (score[opponent] < 3) {
        const player = currentGame[team].find(p => p.id === id);
        player.ownGoals++;
        const playerScore = getPlayerScore(id);

        if (!playerScore) {
            playersScore.push({
                id: id,
                name: playersList.find(p => p.id === id).name,
                goals: 0,
                ownGoals: 1
            });
        } else {
            playerScore.ownGoals += 1;
        }
        updateScoreBoard();
        celebrateGoal(team, player, true);
        saveState();
        checkWinner();
    }
}

function removeOwnGoal(team, id) {
    const player = currentGame[team].find(p => p.id === id);
    if (player.ownGoals > 0) {
        player.ownGoals--;
        const playerScore = getPlayerScore(id);
        if (playerScore) playerScore.ownGoals -= 1;
        updateScoreBoard();
        saveState();
        checkWinner();
    }
}

// =====================
// Gestão de Seleções
// =====================
function onChangeSelect(id) {
    switch (id) {
        case 'random-players':
            {
                const randomPlayers = document.getElementById("random-players");
                const selectedPlayers = Array.from(randomPlayers.selectedOptions).map(o => o.value);
                const randomButton = document.getElementById('random-btn');
                randomButton.disabled = selectedPlayers.length !== 4;
            }
            break;
        case 'player-red-1':
        case 'player-red-2':
        case 'player-white-1':
        case 'player-white-2':
            checkPlayers();
            break;
        case 'next-player-1':
        case 'next-player-2':
            checkNextPlayers();
            break;
        case 'winner-team': {
            const winnerTeamSelect = document.getElementById('winner-team');
            const endGameButton = document.getElementById('end-game-button');
            endGameButton.disabled = (winnerTeamSelect.value === "")
        }
            break;
    }
    saveState();
}

function checkPlayers() {
    const selectIds = ["player-red-1", "player-red-2", "player-white-1", "player-white-2"];
    const selects = selectIds.map(id => document.getElementById(id));

    // Obter todos os valores selecionados
    const selectedValues = selects
        .map(s => s.value)
        .filter(v => v !== "");

    // Atualizar opções nas outras selects
    selects.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === "") return; // ignorar vazio
            option.disabled = selectedValues.includes(option.value) && option.value !== select.value;
        });
    });

    // Os próximos jogadores podem ser qualquer um (inclusive quem está em jogo,
    // por exemplo os que vierem a perder); só se impedem repetidos entre si.
    checkNextPlayers(false);

    // Habilitar ou desabilitar o botão
    const allSelected = selects.every(s => s.value !== "");
    document.getElementById("start-button").disabled = !allSelected;
}

function checkNextPlayers(scroll = true) {
    const nextPlayersSelectIds = ["next-player-1", "next-player-2"];
    const nextPlayersSelect = nextPlayersSelectIds.map(id => document.getElementById(id));

    const selectedValues = nextPlayersSelect
        .map(s => s.value)
        .filter(v => v !== "");

    nextPlayersSelect.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === "") return; // ignorar vazio
            option.disabled = selectedValues.includes(option.value) && option.value !== select.value;
        });
    });

    if (scroll && selectedValues.length === 2) { document.getElementById('view-game').scrollIntoView({ behavior: "smooth" }); }
}

function checkWinner() {
    const score = getScore(currentGame);
    const redGoals = score.red;
    const whiteGoals = score.white;

    if ((redGoals === 3 && whiteGoals < 3) || (whiteGoals === 3 && redGoals < 3)) {
        currentGame.winner = redGoals > whiteGoals ? 'red' : 'white';
        pauseTimer();
        endGame();
    } else if (timeLeft <= 0 && redGoals === whiteGoals && redGoals != 3) {
        document.getElementById('game').style.display = 'none';
        document.getElementById('tie-breaker').style.display = 'block';
        saveState();
    } else if (timeLeft <= 0 && redGoals != whiteGoals) {
        currentGame.winner = redGoals > whiteGoals ? 'red' : 'white';
        pauseTimer();
        endGame();
    }
}

// =====================
// Modal de Confirmação
// =====================
function openConfirmModal(message, callback) {
    lastFocusedElement = document.activeElement;
    document.getElementById("modalMessage").innerText = message;
    document.getElementById("customModal").style.display = "flex";
    document.getElementById("btnConfirm").focus();
    confirmCallback = callback;
}

document.getElementById("btnConfirm").addEventListener("click", function () {
    const callback = confirmCallback;
    closeModal();
    if (callback) callback();
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.getElementById("customModal").style.display === 'flex') closeModal();
});

// =====================
// Estatísticas e Torneio
// =====================
function computeStats(data) {
    const players = {};
    const gamesSummary = data.map((game, idx) => {
        const score = getScore(game);

        ['red', 'white'].forEach(team => {
            game[team].forEach(player => {
                if (!players[player.name]) players[player.name] = { name: player.name, goals: 0, ownGoals: 0, wins: 0, losses: 0, ties: 0 };
                const stats = players[player.name];
                stats.goals += player.goals;
                stats.ownGoals += player.ownGoals;
                if (game.isTie) stats.ties++;
                else if (game.winner === team) stats.wins++;
                else if (game.winner) stats.losses++;
            });
        });

        return { id: idx + 1, redGoals: score.red, whiteGoals: score.white, winner: game.winner, isTie: game.isTie };
    });

    return { gamesSummary, playersArr: Object.values(players) };
}

function timeToSeconds(time) {
    const [mins, secs] = String(time || '0:0').split(':').map(Number);
    return (mins || 0) * 60 + (secs || 0);
}

/** Builds the list of end-of-tournament awards from the finished games. */
function computeAwards() {
    const { playersArr } = computeStats(games);
    const awards = [];
    const namesWithMax = (items, field) => {
        const max = Math.max(...items.map(p => p[field]));
        return { max, names: items.filter(p => p[field] === max).map(p => p.name) };
    };
    if (playersArr.length === 0) return awards;

    const topScorer = namesWithMax(playersArr, 'goals');
    if (topScorer.max > 0) {
        awards.push({ icon: '🥇', title: 'Melhor marcador', text: `${topScorer.names.join(' & ')} (${topScorer.max} golos)` });
    }

    const mostWins = namesWithMax(playersArr, 'wins');
    if (mostWins.max > 0) {
        awards.push({ icon: '🏆', title: 'Mais vitórias', text: `${mostWins.names.join(' & ')} (${mostWins.max})` });
    }

    const ownGoalKing = namesWithMax(playersArr, 'ownGoals');
    if (ownGoalKing.max > 0) {
        awards.push({ icon: '🤦', title: 'Rei do autogolo', text: `${ownGoalKing.names.join(' & ')} (${ownGoalKing.max})` });
    }

    // Longest winning streak (a tie or a loss breaks it)
    const current = {};
    const best = {};
    games.forEach(game => {
        ['red', 'white'].forEach(team => game[team].forEach(player => {
            if (!game.isTie && game.winner === team) current[player.name] = (current[player.name] || 0) + 1;
            else current[player.name] = 0;
            best[player.name] = Math.max(best[player.name] || 0, current[player.name]);
        }));
    });
    const streakList = Object.keys(best).map(name => ({ name, streak: best[name] }));
    const streak = namesWithMax(streakList, 'streak');
    if (streak.max >= 2) {
        awards.push({ icon: '🔥', title: 'Maior sequência de vitórias', text: `${streak.names.join(' & ')} (${streak.max} seguidas)` });
    }

    // Clutch: goals in the last seconds of a game
    const clutchTotals = {};
    games.forEach(game => ['red', 'white'].forEach(team => game[team].forEach(p => {
        if (p.clutch) clutchTotals[p.name] = (clutchTotals[p.name] || 0) + p.clutch;
    })));
    const clutchList = Object.keys(clutchTotals).map(name => ({ name, clutch: clutchTotals[name] }));
    if (clutchList.length > 0) {
        const clutch = namesWithMax(clutchList, 'clutch');
        awards.push({ icon: '⏱️', title: 'Clutch (golo no último segundo)', text: `${clutch.names.join(' & ')} (${clutch.max})` });
    }

    // Clean sheets: won without conceding
    const cleanSheets = {};
    games.forEach(game => {
        if (game.isTie || !game.winner) return;
        const score = getScore(game);
        const conceded = game.winner === 'red' ? score.white : score.red;
        if (conceded === 0) game[game.winner].forEach(p => { cleanSheets[p.name] = (cleanSheets[p.name] || 0) + 1; });
    });
    const sheetList = Object.keys(cleanSheets).map(name => ({ name, sheets: cleanSheets[name] }));
    if (sheetList.length > 0) {
        const sheets = namesWithMax(sheetList, 'sheets');
        awards.push({ icon: '🧤', title: 'Baliza limpa (3-0)', text: `${sheets.names.join(' & ')} (${sheets.max})` });
    }

    // Unbeaten pairs: at least two wins together and no losses
    const pairs = {};
    games.forEach(game => {
        if (!game.winner) return;
        ['red', 'white'].forEach(team => {
            const key = game[team].map(p => p.name).sort().join(' & ');
            if (!pairs[key]) pairs[key] = { name: key, wins: 0, losses: 0 };
            if (game.isTie) return;
            if (game.winner === team) pairs[key].wins++;
            else pairs[key].losses++;
        });
    });
    const unbeaten = Object.values(pairs).filter(p => p.losses === 0 && p.wins >= 2);
    if (unbeaten.length > 0) {
        const pair = namesWithMax(unbeaten, 'wins');
        awards.push({ icon: '🤝', title: 'Dupla imbatível', text: `${pair.names.join(' | ')} (${pair.max} vitórias)` });
    }

    // Fastest win
    let fastest = null;
    games.forEach(game => {
        if (game.isTie || !game.winner || !game.time) return;
        const secs = timeToSeconds(game.time);
        if (!fastest || secs < fastest.secs) fastest = { secs, game };
    });
    if (fastest) {
        const team = fastest.game.winner;
        awards.push({
            icon: '⚡', title: 'Vitória mais rápida',
            text: `${fastest.game[team].map(p => p.name).join(' & ')} em ${fastest.game.time}`
        });
    }

    return awards;
}

function renderAwards() {
    const container = document.getElementById('awards');
    const awards = computeAwards();
    if (awards.length === 0) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = '<h3>🏅 Prémios do torneio</h3>' + awards.map(a =>
        `<div class="award"><span class="award-icon" aria-hidden="true">${a.icon}</span>` +
        `<div><strong>${escapeHtml(a.title)}</strong><br>${escapeHtml(a.text)}</div></div>`).join('');
}

function renderTournamentSummary() {
    document.getElementById('retify-game-button').disabled = true;
    document.getElementById('end-tournament-button').disabled = true;
    document.getElementById('new-game-button').style.display = 'none';
    document.getElementById('new-tournament-button').style.display = 'block';
    document.getElementById('file-download-button').style.display = 'block';
    document.getElementById('share-image-button').style.display = 'block';
    document.getElementById('share-text-button').style.display = 'block';
    document.getElementById('tournament-summary').style.display = 'block';

    const { gamesSummary, playersArr } = computeStats(games);
    document.getElementById('games-list').innerHTML =
        `<div>Total de jogos: ${gamesSummary.length} </div>` +
        gamesSummary.map(g => `<div>Jogo ${g.id}: 🔴 ${g.redGoals} – ${g.whiteGoals} ⚪️ </div>`).join('');
    renderAwards();

    playersArr.sort((a, b) => b.goals - a.goals);
    const gridDiv = document.getElementById("tournament-summary-grid");
    if (gridApi) gridApi.destroy();
    gridDiv.innerHTML = ``;
    gridApi = agGrid.createGrid(gridDiv, {
        columnDefs,
        rowData: playersArr,
        defaultColDef: {
            cellStyle: { textAlign: "center" }
        },
        animateRows: true,
        theme: themeQuartz, // tema novo
    });

    const container = document.getElementById("tables-container");
    container.innerHTML = '';
    games.forEach((game, idx) => {
        container.appendChild(createTable(game, idx + 1));
    });
}

function endTournament() {
    finalizeGame(true);
    tournamentEnded = true;
    renderTournamentSummary();
    celebrateWinner(currentGame.winner);
    saveState();
    fileDownload();
}

function downloadBlob(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function fileDownload() {
    const dados = {
        jogos: games,
        golos: playersScore
    };
    const conteudo = JSON.stringify(dados, null, 2);
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    downloadBlob(new Blob([conteudo], { type: 'application/json' }), `jogos_${stamp}.json`);
}

// Function to create a game table
function createTable(game, gameNumber) {
    const table = document.createElement("table");

    table.classList.add("game-table"); // adiciona a classe específica
    const score = getScore(game);

    // Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Jogo ${gameNumber}</th>
        <th colspan = "2">🔴 ${score.red} – ${score.white} ⚪️</th>
        <th>${game.time}</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    for (let i = 0; i < Math.max(game.red.length, game.white.length); i++) {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td colspan = "2">${game.red[i] ? escapeHtml(game.red[i].name) : ""}</td>
        <td colspan = "2" >${game.white[i] ? escapeHtml(game.white[i].name) : ""}</td>
      `;
        tbody.appendChild(row);
    }
    table.appendChild(tbody);

    return table;
}

// =====================
// Partilha (WhatsApp)
// =====================
function rankedPlayers() {
    const { playersArr } = computeStats(games);
    return [...playersArr].sort((a, b) => b.wins - a.wins || b.goals - a.goals || a.losses - b.losses);
}

/** Short display names; first name only unless two players share it. */
function buildShortNames() {
    const names = rankedPlayers().map(p => p.name);
    const firstCount = {};
    names.forEach(n => { const first = n.split(' ')[0]; firstCount[first] = (firstCount[first] || 0) + 1; });
    const shortNames = {};
    names.forEach(n => {
        const parts = n.split(' ');
        const last = parts[parts.length - 1];
        if (firstCount[parts[0]] === 1) shortNames[n] = parts[0];
        else shortNames[n] = /^\d+$/.test(last) ? n : `${parts[0]} ${last[0]}.`;
    });
    return shortNames;
}

function buildShareText() {
    const shortNames = buildShortNames();
    const short = name => shortNames[name] || name;
    const lines = [`⚽ *NIUP - Matraquilhos* - ${new Date().toLocaleDateString('pt-PT')}`, `${games.length} jogo(s)`, ''];

    const awards = computeAwards();
    if (awards.length > 0) {
        lines.push('🏅 *Prémios*');
        awards.forEach(a => lines.push(`${a.icon} ${a.title}: ${a.text}`));
        lines.push('');
    }

    lines.push('📊 *Classificação*');
    rankedPlayers().forEach((p, i) => {
        const nicknames = getNicknames(p.name);
        lines.push(`${i + 1}. ${short(p.name)} - ${p.wins}V ${p.losses}D ${p.ties}E | ${p.goals} golos, ${p.ownGoals} autogolos${nicknames ? ` (${nicknames})` : ''}`);
    });
    lines.push('');

    lines.push('🎮 *Jogos*');
    games.forEach((game, idx) => {
        const score = getScore(game);
        const red = game.red.map(p => short(p.name)).join(' & ');
        const white = game.white.map(p => short(p.name)).join(' & ');
        lines.push(`${idx + 1}. 🔴 ${red} ${score.red}-${score.white} ${white} ⚪️`);
    });
    return lines.join('\n');
}

function fitText(ctx, text, maxWidth, size, weight = '') {
    let fontSize = size;
    do {
        ctx.font = `${weight} ${fontSize}px Inter, -apple-system, "Segoe UI", sans-serif`.trim();
        fontSize -= 2;
    } while (ctx.measureText(text).width > maxWidth && fontSize > 16);
}

function buildShareImage() {
    const shortNames = buildShortNames();
    const short = name => shortNames[name] || name;
    const awards = computeAwards();
    const ranking = rankedPlayers();

    const width = 1080;
    const pad = 48;
    const height = 250
        + (awards.length ? 90 + awards.length * 92 : 0)
        + 90 + (ranking.length + 1) * 58
        + 90 + games.length * 54
        + 60;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const textWidth = width - pad * 2;

    ctx.fillStyle = '#fefefe';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#0061A8';
    ctx.fillRect(0, 0, width, 200);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    fitText(ctx, '⚽ NIUP - Matraquilhos', textWidth, 64, '800');
    ctx.fillText('⚽ NIUP - Matraquilhos', pad, 100);
    fitText(ctx, '', textWidth, 34);
    ctx.fillText(`${new Date().toLocaleDateString('pt-PT')}  •  ${games.length} jogo(s)`, pad, 155);

    let y = 250;
    const sectionTitle = text => {
        ctx.fillStyle = '#0061A8';
        fitText(ctx, text, textWidth, 42, '800');
        ctx.fillText(text, pad, y);
        y += 30;
    };

    if (awards.length) {
        sectionTitle('🏅 Prémios');
        awards.forEach(a => {
            y += 62;
            ctx.fillStyle = '#222';
            const line = `${a.icon} ${a.title}: ${a.text}`;
            fitText(ctx, line, textWidth, 30);
            ctx.fillText(line, pad, y);
            y += 30;
        });
        y += 60;
    }

    sectionTitle('📊 Classificação');
    const cols = [width - 520, width - 420, width - 320, width - 220, width - 120];
    y += 54;
    ctx.fillStyle = '#0061A8';
    ctx.font = '800 28px Inter, -apple-system, "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Jogador', pad, y);
    ctx.textAlign = 'center';
    ['G', 'AG', 'V', 'D', 'E'].forEach((h, i) => ctx.fillText(h, cols[i] + 40, y));
    ranking.forEach((p, i) => {
        y += 58;
        if (i % 2 === 0) {
            ctx.fillStyle = '#eef5fb';
            ctx.fillRect(pad - 12, y - 40, textWidth + 24, 54);
        }
        ctx.fillStyle = '#222';
        ctx.textAlign = 'left';
        fitText(ctx, `${i + 1}. ${short(p.name)}`, cols[0] - pad - 20, 30);
        ctx.fillText(`${i + 1}. ${short(p.name)}`, pad, y);
        ctx.font = '30px Inter, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        [p.goals, p.ownGoals, p.wins, p.losses, p.ties].forEach((v, c) => ctx.fillText(String(v), cols[c] + 40, y));
    });
    y += 60;
    ctx.textAlign = 'left';

    sectionTitle('🎮 Jogos');
    games.forEach((game, idx) => {
        y += 54;
        const score = getScore(game);
        const red = game.red.map(p => short(p.name)).join(' & ');
        const white = game.white.map(p => short(p.name)).join(' & ');
        const line = `${idx + 1}. 🔴 ${red}  ${score.red} - ${score.white}  ${white} ⚪️`;
        ctx.fillStyle = '#222';
        fitText(ctx, line, textWidth, 30);
        ctx.fillText(line, pad, y);
    });

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function shareImage() {
    const text = buildShareText();
    try {
        const blob = await buildShareImage();
        const file = new File([blob], 'matraquilhos.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], text, title: 'NIUP - Matraquilhos' });
            return;
        }
        // No file sharing support (e.g. desktop): save the image so it can be attached manually
        downloadBlob(blob, 'matraquilhos.png');
    } catch (e) {
        if (e.name !== 'AbortError') shareText();
    }
}

function shareText() {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildShareText())}`, '_blank');
}

// =====================
// Inicialização
// =====================
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    populateRandomPlayerSelect('random-players');
    const popup = document.getElementById('popup');
    popup.remove();
    checkSavedTournament();
});

const overlay = document.getElementById('notch-overlay');
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const maxScroll = 200; // altura em px até o efeito máximo
    const ratio = Math.min(scrollY / maxScroll, 1); // de 0 a 1

    // Opacidade dinâmica
    const opacity = 0.8 * ratio; // até 80%
    overlay.style.background = `rgba(255, 255, 255, ${opacity})`;

    // Blur dinâmico
    const blur = 10 * ratio; // até 10px
    overlay.style.backdropFilter = `blur(${blur}px)`;
    overlay.style.webkitBackdropFilter = `blur(${blur}px)`;

    // Sombra dinâmica
    const shadowOpacity = 0.2 * ratio;
    overlay.style.boxShadow = `0 2px 10px rgba(0,0,0,${shadowOpacity})`;
});
