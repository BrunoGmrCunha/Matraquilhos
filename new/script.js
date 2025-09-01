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
    { id: "EB41296B-5BF3-4624-AFDD-B0BB91007802", name: "Vera Silva" },
    { id: "EA83D6DD-0409-47BF-936B-B58D325599BD", name: "Alexandre Abreu" },
    { id: "0271D9AE-13D1-4607-8F72-B9368BE2CAC2", name: "Diogo Melo" },
    { id: "86CFA583-4F61-47EB-ACB0-CBBADB75A754", name: "Rui Silva" },
    { id: "44D286DF-8714-4AA8-8337-F621F5C21098", name: "Jean-Marc Barbosa" },
    { id: "604702FC-41B0-4672-85E1-F994508227F2", name: "Bernardo Barbosa" },
    { id: "62f3f4e9-2219-47a8-b6fe-06c2b90588b0", name: "Zequinha 1" },
    { id: "1dceb530-8d3f-4b0c-84ce-e220754f3e4f", name: "Zequinha 2" }
];

// =====================
// Variáveis Globais
// =====================
let games = [];
let playersScore = [];
let currentGame = null;
let timer = null;
let timeLeft = 0;
let gameTime = 150;
let audioContext = null;
let gridApi;
let isPaused = false;
let confirmCallback = null;
let longPressTimer;
let longPressDuration = 600; // em milissegundos
let isLongPress = false;

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
function debug(msg) {
    document.getElementById('debug').textContent += msg + '\n';
}

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function closeModal() {
    document.getElementById("customModal").style.display = "none";
    confirmCallback = null;
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    document.getElementById('next-player-1').value = ""
    document.getElementById('next-player-2').value = "";
    document.getElementById('winner-team').value = ""

    showView('view-game');
    document.getElementById('view-game').scrollIntoView({ behavior: "smooth" });
}

function endGame() {
    document.getElementById('winner-team-label').innerHTML = ''

    if (currentGame.winner === null) {
        currentGame.isTie = true;
        document.getElementById('winner-team-label').innerHTML = document.getElementById('winner-team').value === 'red' ? `🔴 Equipa Vermelha` : `⚪ Equipa Branca`;
    } else {

        document.getElementById('winner-team-label').innerHTML = currentGame.winner === 'red' ? `🔴 Equipa Vermelha` : `⚪ Equipa Branca`;
    }

    showView('view-summary');
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
    if (currentGame.winner === 'red') {
        document.getElementById('team-red').style.display = 'block';
        document.getElementById('team-white').style.display = 'block';
        document.getElementById('player-red-1').disabled = true;
        document.getElementById('player-red-2').disabled = true;
        document.getElementById('player-white-1').disabled = false;
        document.getElementById('player-white-2').disabled = false;
        populatePlayerSelect('player-white-1', document.getElementById('next-player-1').value);
        populatePlayerSelect('player-white-2', document.getElementById('next-player-2').value);
        populatePlayerSelect('player-red-1', winningTeam[0].id);
        populatePlayerSelect('player-red-2', winningTeam[1].id);
    } else {
        document.getElementById('team-red').style.display = 'block';
        document.getElementById('team-white').style.display = 'block';
        document.getElementById('player-white-1').disabled = true;
        document.getElementById('player-white-2').disabled = true;
        document.getElementById('player-red-1').disabled = false;
        document.getElementById('player-red-2').disabled = false;
        populatePlayerSelect('player-red-1', document.getElementById('next-player-1').value);
        populatePlayerSelect('player-red-2', document.getElementById('next-player-2').value);
        populatePlayerSelect('player-white-1', winningTeam[0].id);
        populatePlayerSelect('player-white-2', winningTeam[1].id);
    }
    checkPlayers();
    showView('view-select');
}

function newTournament() {
    window.location.reload();
}

function reftifyGame() {
    document.getElementById('score-board').style.display = 'block';
    document.getElementById('game').style.display = 'block';
    currentGame.winner = null;
    const winnerTeamSelect = document.getElementById('winner-team');
    if (winnerTeamSelect.value === "") {
        document.getElementById('tie-breaker').style.display = 'none';
    }
    else {
        document.getElementById('tie-breaker').style.display = 'block';
    }
    showView('view-game');
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
        }
        if (timeLeft === 0) {
            beep(1500, 1000);
            clearInterval(timer);
            checkWinner();
        }
    }, 1000);
}

function pauseResumeTimer() { isPaused = !isPaused; }

function pauseTimer() { isPaused = true; }

function beep(frequency = 1000, duration = 200) {
    if (!audioContext) return
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, duration);
}

function updateTimerDisplay() {
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    document.getElementById('game-timer').textContent = `${mins}:${secs}`;
}

// =====================
// Scoreboard
// =====================
function updateScoreBoard() {
    const board = document.getElementById('score-board');
    const resultGame = document.getElementById('result');
    board.innerHTML = '';
    resultGame.innerHTML = ''
    const redGoals = currentGame.red.reduce((sum, p) => sum + p.goals, 0) + currentGame.white.reduce((sum, p) => sum + p.ownGoals, 0);
    const whiteGoals = currentGame.white.reduce((sum, p) => sum + p.goals, 0) + currentGame.red.reduce((sum, p) => sum + p.ownGoals, 0);
    resultGame.textContent = `🔴 ${redGoals} - ${whiteGoals} ⚪ `;

    ['red', 'white'].forEach(team => {
        const wrapper = document.createElement('div');
        // wrapper.className = team === 'red' ? 'team-section red' : 'team-section white';
        wrapper.classList.add('team-section')
        wrapper.classList.add(team === 'red' ? 'red' : 'white')

        const title = document.createElement('h3');
        title.textContent = team === 'red' ? `🔴 Equipa Vermelha` : `⚪ Equipa Branca`;

        wrapper.appendChild(title);

        currentGame[team].forEach(player => {
            const div = document.createElement('div');
            div.classList.add('score-controls')
            div.innerHTML = `<span class="player-name">${player.name}</span> - ${player.goals} Golo(s) | ${player.ownGoals} Autogolo(s)` +
                `<div class="score-controls-buttons">
                            <button onclick="addGoal('${team}', '${player.id}')" onTouchStart="touchStartGoal('${team}', '${player.id}')" onTouchEnd="touchEnd()">+ Golo</button>
                            <button  style="background-color:#ff4646" onclick="addOwnGoal('${team}', '${player.id}')" onTouchStart="touchStartOwnGoal('${team}', '${player.id}')" onTouchEnd="touchEnd()">+ Autogolo</button>
                        </div>`;
            wrapper.appendChild(div);
        });

        board.appendChild(wrapper);
    });
}

function addGoal(team, id) {
    const redGoals = currentGame.red.reduce((sum, p) => sum + p.goals, 0) + currentGame.white.reduce((sum, p) => sum + p.ownGoals, 0);
    const whiteGoals = currentGame.white.reduce((sum, p) => sum + p.goals, 0) + currentGame.red.reduce((sum, p) => sum + p.ownGoals, 0);

    if ((team === 'red' && redGoals < 3) || (team === 'white' && whiteGoals < 3)) {
        const player = currentGame[team].find(p => p.id === id);
        player.goals++;
        const playerScore = playersScore.find(player => player.id === id);

        if (!playerScore) {
            playersScore.push({
                id: id,
                name: playersList.find(player => player.id === id).name,
                goals: 1,
                ownGoals: 0
            });
        } else {
            playerScore.goals += 1;
        }

        updateScoreBoard();
        checkWinner();
    }
}

function removeGoal(team, id) {
    const player = currentGame[team].find(p => p.id === id);
    if (player.goals > 0) {
        player.goals--;
        const playerScore = playersScore.find(player => player.id === id);
        if (!playerScore) {
            playersScore.push({
                id: id,
                name: playersList.find(player => player.id === id).name,
                goals: 1,
                ownGoals: 0
            });
        } else {
            playerScore.goals -= 1;
        }
        updateScoreBoard();
        checkWinner();
    }
}

function addOwnGoal(team, id) {
    const redGoals = currentGame.red.reduce((sum, p) => sum + p.goals, 0) + currentGame.white.reduce((sum, p) => sum + p.ownGoals, 0);
    const whiteGoals = currentGame.white.reduce((sum, p) => sum + p.goals, 0) + currentGame.red.reduce((sum, p) => sum + p.ownGoals, 0);

    if ((team === 'red' && whiteGoals < 3) || (team === 'white' && redGoals < 3)) {
        const player = currentGame[team].find(p => p.id === id);
        player.ownGoals++;
        const playerScore = playersScore.find(player => player.id === id);

        if (!playerScore) {
            playersScore.push({
                id: id,
                name: playersList.find(player => player.id === id).name,
                goals: 0,
                ownGoals: 1
            });
        } else {
            playerScore.ownGoals += 1;
        }
        updateScoreBoard();
        checkWinner();
    }
}

function removeOwnGoal(team, id) {
    const player = currentGame[team].find(p => p.id === id);
    if (player.ownGoals > 0) {
        player.ownGoals--;
        const playerScore = playersScore.find(player => player.id === id);

        if (!playerScore) {
            playersScore.push({
                id: id,
                name: playersList.find(player => player.id === id).name,
                goals: 0,
                ownGoals: 1
            });
        } else {
            playerScore.ownGoals -= 1;
        }
        updateScoreBoard();
        checkWinner();
    }
}



function touchStartGoal(team, id) {
    isLongPress = false;

    longPressTimer = setTimeout(() => {
        isLongPress = true;
        removeGoal(team, id);
    }, longPressDuration);

}

function touchStartOwnGoal(team, id) {
    isLongPress = false;

    longPressTimer = setTimeout(() => {
        isLongPress = true;
        removeOwnGoal(team, id);
    }, longPressDuration);

}

function touchEnd() {
    clearTimeout(longPressTimer);
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
                if (selectedPlayers.length !== 4) {
                    randomButton.disabled = true;
                }
                else {
                    randomButton.disabled = false;
                }
            }
            break;
        case 'player-red-1':
            {
                checkPlayers()
            }
            break;
        case 'player-red-2':
            {
                checkPlayers()
            }
            break;
        case 'player-white-1':
            {
                checkPlayers()
            }
            break;
        case 'player-white-2':
            {
                checkPlayers()
            }
            break;
        case 'next-player-1':
            {
                checkNextPlayers()
            }
            break;
        case 'next-player-2':
            {
                checkNextPlayers()
            }
            break;
        case 'winner-team': {
            const winnerTeamSelect = document.getElementById('winner-team');
            const endGameButton = document.getElementById('end-game-button');
            endGameButton.disabled = (winnerTeamSelect.value === "")
        }
            break;
    }
}
function checkPlayers() {
    const selectIds = ["player-red-1", "player-red-2", "player-white-1", "player-white-2"];
    const selects = selectIds.map(id => document.getElementById(id));

    const nextPlayersSelectIds = ["next-player-1", "next-player-2"];
    const nextPlayersSelect = nextPlayersSelectIds.map(id => document.getElementById(id));


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

    nextPlayersSelect.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === "") return; // ignorar vazio
            option.disabled = selectedValues.includes(option.value) && option.value !== select.value;
        });
    });

    // Habilitar ou desabilitar o botão
    const allSelected = selects.every(s => s.value !== "");
    document.getElementById("start-button").disabled = !allSelected;
}
function checkNextPlayers() {
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

    if (selectedValues.length === 2) { document.getElementById('view-game').scrollIntoView({ behavior: "smooth" }); }
}

function checkWinner() {
    const redGoals = currentGame.red.reduce((sum, p) => sum + p.goals, 0) + currentGame.white.reduce((sum, p) => sum + p.ownGoals, 0);
    const whiteGoals = currentGame.white.reduce((sum, p) => sum + p.goals, 0) + currentGame.red.reduce((sum, p) => sum + p.ownGoals, 0);

    if ((redGoals === 3 && whiteGoals < 3) || (whiteGoals === 3 && redGoals < 3)) {
        currentGame.winner = redGoals > whiteGoals ? 'red' : 'white';
        pauseTimer();
        endGame();
    } else if (timeLeft <= 0 && redGoals === whiteGoals && redGoals != 3) {
        // document.getElementById('score-board').style.display = 'none';

        // document.getElementById('next-players').style.display = 'none';
        // document.getElementById('next-players').style.display = 'none';
        document.getElementById('game').style.display = 'none';
        document.getElementById('tie-breaker').style.display = 'block';
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
    document.getElementById("modalMessage").innerText = message;
    document.getElementById("customModal").style.display = "flex";
    confirmCallback = callback;
}

document.getElementById("btnConfirm").addEventListener("click", function () {
    if (confirmCallback) confirmCallback();
    closeModal();
});

// =====================
// Estatísticas e Torneio
// =====================
function computeStats(data) {
    const players = {};
    const gamesSummary = data.map((game, idx) => {
        const redGoals = game.red.reduce((sum, p) => sum + p.goals, 0) + game.white.reduce((sum, p) => sum + p.ownGoals, 0);
        const whiteGoals = game.white.reduce((sum, p) => sum + p.goals, 0) + game.red.reduce((sum, p) => sum + p.ownGoals, 0);

        [...game.red, ...game.white].forEach(player => {
            if (!players[player.name]) players[player.name] = { name: player.name, goals: 0, ownGoals: 0, wins: 0, losses: 0, ties: 0 };
            players[player.name].goals += player.goals;
            players[player.name].ownGoals += player.ownGoals;
            if (game.isTie && (game.red.some(p => p.name === player.name) || game.white.some(p => p.name === player.name))) players[player.name].ties++;
            else {
                if (game.winner === 'red' && game.red.some(p => p.name === player.name) && !game.isTie) players[player.name].wins++;
                if (game.winner === 'white' && game.white.some(p => p.name === player.name) && !game.isTie) players[player.name].wins++;
                if (game.winner === 'red' && game.white.some(p => p.name === player.name)) players[player.name].losses++;
                if (game.winner === 'white' && game.red.some(p => p.name === player.name)) players[player.name].losses++;
            }

        });

        return { id: idx + 1, redGoals, whiteGoals, winner: game.winner, isTie: game.isTie };
    });

    return { gamesSummary, playersArr: Object.values(players) };
}
async function endTournament() {
    finalizeGame(true);

    const summary = document.getElementById('tournament-summary');
    document.getElementById('retify-game-button').disabled = true;
    document.getElementById('end-tournament-button').disabled = true;

    document.getElementById('new-game-button').style.display = 'none';
    document.getElementById('new-tournament-button').style.display = 'block';
    document.getElementById('file-download-button').style.display = 'block';
    const { gamesSummary, playersArr } = computeStats(games);
    document.getElementById('tournament-summary').innerHTML += (`<div>Total de jogos: ${gamesSummary.length} </div>`);
    document.getElementById('tournament-summary').innerHTML += gamesSummary.map(g => `<div>Jogo ${g.id}: 🔴 ${g.redGoals} – ${g.whiteGoals} ⚪️ </div>`).join('');
    playersArr.sort((a, b) => b.goals - a.goals);

    const gridOptions = {
        columnDefs,
        rowData: playersArr,
        defaultColDef: {
            cellStyle: { textAlign: "center" }
        },

        animateRows: true,
        theme: themeQuartz, // tema novo

    };

    const gridDiv = document.getElementById("tournament-summary-grid");
    gridDiv.innerHTML = ``;
    gridApi = agGrid.createGrid(gridDiv, gridOptions);
    console.log("array: " + playersArr)
    playersArr.forEach((p, i) => {
        console.log(`Index ${i}:`, p);
        console.log("Nome:", p.name, "Golos:", p.goals, "Vitórias:", p.wins);
    });

    let text = '';
    games.forEach((game, idx) => {
        const redGoals = game.red.reduce((s, p) => s + p.goals, 0) + game.white.reduce((s, p) => s + p.ownGoals, 0);
        const whiteGoals = game.white.reduce((s, p) => s + p.goals, 0) + game.red.reduce((s, p) => s + p.ownGoals, 0);
        text += `Jogo ${idx + 1}\nEquipa Vermelha: ${redGoals} | Equipa Branca: ${whiteGoals}\n`;
        game.red.forEach(p => text += `  ${p.name} - Golos: ${p.goals} | Autogolos: ${p.ownGoals}\n`);
        game.white.forEach(p => text += `  ${p.name} - Golos: ${p.goals} | Autogolos: ${p.ownGoals}\n`);
        text += `Vencedor: ${game.winner === 'red' ? 'Equipa Vermelha' : 'Equipa Branca'}\n---\n`;
    });
    playersScore.forEach((player, idx) => {
        text += `${player.name} -> Golos: ${player.goals} | Autogolos: ${player.ownGoals}\n`;
    });
    //summary.textContent = text;
    console.log(playersScore);
    console.log(games);

    // Render tables in container
    const container = document.getElementById("tables-container");
    games.forEach((game, idx) => {
        container.appendChild(createTable(game, idx + 1));
    });


    const dados = {
        jogos: games,
        golos: playersScore
    };
    const conteudo = JSON.stringify(dados, null, 2);
    const blob = new Blob([conteudo], { type: 'application/json' });

    // Criar um link temporário
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jogos_${new Date()}.json`; // Nome do ficheiro

    // Adicionar e clicar no link
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
async function _endTournament() {
    finalizeGame();
    const summary = document.getElementById('tournament-summary');
    let text = '';
    games.forEach((game, idx) => {
        const redGoals = game.red.reduce((s, p) => s + p.goals, 0) + game.white.reduce((s, p) => s + p.ownGoals, 0);
        const whiteGoals = game.white.reduce((s, p) => s + p.goals, 0) + game.red.reduce((s, p) => s + p.ownGoals, 0);
        text += `Jogo ${idx + 1}\nEquipa Vermelha: ${redGoals} | Equipa Branca: ${whiteGoals}\n`;
        game.red.forEach(p => text += `  ${p.name} - Golos: ${p.goals} | Autogolos: ${p.ownGoals}\n`);
        game.white.forEach(p => text += `  ${p.name} - Golos: ${p.goals} | Autogolos: ${p.ownGoals}\n`);
        text += `Vencedor: ${game.winner === 'red' ? 'Equipa Vermelha' : 'Equipa Branca'}\n---\n`;
    });
    playersScore.forEach((player, idx) => {
        text += `${player.name} -> Golos: ${player.goals} | Autogolos: ${player.ownGoals}\n`;
    });
    summary.textContent = text;
    console.log(playersScore);
    console.log(games);

    const dados = {
        jogos: games,
        golos: playersScore
    };
    const conteudo = JSON.stringify(dados, null, 2);
    await sendTextToApi(conteudo);

    // Criar um blob
    const blob = new Blob([conteudo], { type: 'application/json' });

    // Criar um link temporário
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jogos_${new Date()}.json`; // Nome do ficheiro

    // Adicionar e clicar no link
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}
function fileDownload() {
    const dados = {
        jogos: games,
        golos: playersScore
    };
    const conteudo = JSON.stringify(dados, null, 2);
    const blob = new Blob([conteudo], { type: 'application/json' });

    // Criar um link temporário
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jogos_${new Date()}.json`; // Nome do ficheiro

    // Adicionar e clicar no link
    document.body.appendChild(link);
    link.click();

    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// Function to create a game table
function createTable(game, gameNumber) {
    const table = document.createElement("table");
    
    table.classList.add("game-table"); // adiciona a classe específica
    // Calculate score (red team always first)
    const redGoals = currentGame.red.reduce((sum, p) => sum + p.goals, 0) + currentGame.white.reduce((sum, p) => sum + p.ownGoals, 0);
    const whiteGoals = currentGame.white.reduce((sum, p) => sum + p.goals, 0) + currentGame.red.reduce((sum, p) => sum + p.ownGoals, 0);

    // Define result with winner mark (*)
    let result;
    if (redGoals > whiteGoals) {
        result = `*${redGoals} - ${whiteGoals}`;
    } else if (whiteGoals > redGoals) {
        result = `${redGoals} - ${whiteGoals}*`;
    } else {
        result = `${redGoals} - ${whiteGoals}`; // tie
    }
    // Header
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Jogo ${gameNumber}</th>
        <th colspan = "2">🔴 ${redGoals} – ${whiteGoals} ⚪️</th>
        <th>${game.time}</th>
      </tr>
    `;
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    for (let i = 0; i < Math.max(game.red.length, game.white.length); i++) {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td colspan = "2">${game.red[i] ? game.red[i].name : ""}</td>
        <td colspan = "2" >${game.white[i] ? game.white[i].name : ""}</td>
      `;
        tbody.appendChild(row);
    }
    table.appendChild(tbody);

    return table;
}


// =====================
// API externa
// =====================
async function sendTextToApi(text) {
    try {
        const response = await fetch('http://10.16.116.191:5066/save-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`Erro: ${response.status}`);
        }

        const result = await response.json();
        console.log('Resposta da API:', result);
        return result;
    } catch (error) {
        console.error('Erro ao enviar texto:', error);
    }
}

async function login(username, password) {
    const response = await fetch("http://localhost:8004/api/Thebox/Login/Local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) throw new Error("Erro no login");

    const tokenData = await response.json();
    localStorage.setItem("thebox_token", tokenData.accessToken); // ou "token"
    return tokenData;
}


// =====================
// Inicialização
// =====================
document.addEventListener("DOMContentLoaded", () => {
    console.log(login("Admin", "Admin"));
    populateRandomPlayerSelect('random-players');
    const popup = document.getElementById('popup');
    popup.remove();
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

