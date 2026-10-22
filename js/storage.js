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
            roster,
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

    // A saved tournament only makes sense on the same day (e.g. an accidental refresh)
    if (new Date(state.savedAt).toDateString() !== new Date().toDateString()) {
        clearState();
        return;
    }

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
    roster = state.roster || [];
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
