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
        isGameOfDay: false,
        goalHistory: []
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
    document.getElementById('undo-button').disabled = !(currentGame.goalHistory && currentGame.goalHistory.length > 0);

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

function recordGoalEvent(team, id, isOwnGoal) {
    if (!currentGame.goalHistory) currentGame.goalHistory = [];
    currentGame.goalHistory.push({ team, id, isOwnGoal });
}

function forgetGoalEvent(team, id, isOwnGoal) {
    const history = currentGame.goalHistory || [];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].team === team && history[i].id === id && history[i].isOwnGoal === isOwnGoal) {
            history.splice(i, 1);
            return;
        }
    }
}

/** Reverts the last goal or own goal of the current game. */
function undoLastGoal() {
    const history = currentGame && currentGame.goalHistory;
    if (!history || history.length === 0) return;
    const last = history[history.length - 1];
    if (last.isOwnGoal) removeOwnGoal(last.team, last.id);
    else removeGoal(last.team, last.id);
    vibrate(40);
}

function getPlayerScore(id) {
    return playersScore.find(player => player.id === id);
}

function addGoal(team, id) {
    const score = getScore(currentGame);

    if (score[team] < 3) {
        const player = currentGame[team].find(p => p.id === id);
        player.goals++;
        recordGoalEvent(team, id, false);
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
        forgetGoalEvent(team, id, false);
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
        recordGoalEvent(team, id, true);
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
        forgetGoalEvent(team, id, true);
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
