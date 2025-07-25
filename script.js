
const playersList = [
    { id: "77fa5014-7468-4ccf-a91e-92050c32116a", name: "Bernardo" },
    { id: "980c4d5f-e4c3-4408-859b-13b089ab32d9", name: "Bruno" },
    { id: "cd3e99e4-dda0-46c2-bf3b-e75d52989a2d", name: "João" },
    { id: "0d091081-8906-4bbc-89cd-befce683a5e5", name: "Cátia" },
    { id: "c67bcfd7-bfe8-472f-a0f5-5868c3ea6f64", name: "David" },
    { id: "b91a961a-2229-49ef-8b98-2f3e4b17f764", name: "Rita" },
    { id: "a96679ef-d54f-437b-991f-0715058298a2", name: "Rui Silva" },
    { id: "47c7e177-5847-4361-8c6f-23aa3bd0a8b2", name: "Rui Paulo" },
    { id: "47c7e177-5847-4361-8c6f-23aa3bd0a8b3", name: "Vera" },
    { id: "47c7e177-5847-4361-8c6f-23aa3bd0a8b4", name: "Melo" },
    { id: "47c7e177-5847-4361-8c6f-23aa3bd0a8b5", name: "Jéssica" },
    { id: "47c7e177-5847-4361-8c6d-23aa3bd0a8b8", name: "Alexandre" },
    { id: "84d8c358-2efd-4e38-9eb8-21d671a2aceb", name: "Ricardo Cunha" },
    { id: "62f3f4e9-2219-47a8-b6fe-06c2b90588b0", name: "Zequinha 1" },
    { id: "1dceb530-8d3f-4b0c-84ce-e220754f3e4f", name: "Zequinha 2" }
];

let games = [];
let playersScore = [];
let currentGame = null;
let timer = null;
let timeLeft = 150;
let audioContext = null;

function debug(msg) {
    document.getElementById('debug').textContent += msg + '\n';
}
function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function random() {
    // console.log(document.getElementById("player-1").querySelectorAll('select')[0].value)
    // const selectedPlayers = [
    //     document.getElementById("player-1").querySelectorAll('select')[0].value,
    //     document.getElementById("player-2").querySelectorAll('select')[0].value,
    //     document.getElementById("player-3").querySelectorAll('select')[0].value,
    //     document.getElementById("player-4").querySelectorAll('select')[0].value,
    // ];
    // console.log(selectedPlayers)
    // Validar se todos os jogadores foram selecionados
    // if (selectedPlayers.includes("")) {
    //     alert("Por favor, seleciona os 4 jogadores.");
    //     return;
    // }

    // Embaralhar a lista (algoritmo de Fisher-Yates)
    // for (let i = selectedPlayers.length - 1; i > 0; i--) {
    //     const j = Math.floor(Math.random() * (i + 1));
    //     [selectedPlayers[i], selectedPlayers[j]] = [selectedPlayers[j], selectedPlayers[i]];
    // }

    // Dividir em duas equipas
    // const equipa1 = selectedPlayers.slice(0, 2);
    // const equipa2 = selectedPlayers.slice(2, 4);

    // console.log(equipa1)
    // console.log(equipa2)

    // document.getElementById('team-white').innerHTML = '';
    // winningTeam.forEach((p, i) => {
    //     const select = document.createElement('select');
    //     select.innerHTML = `<option value="${p.id}" selected>${p.name}</option>`;
    //     document.getElementById('team-white').appendChild(select);
    // });
}

function populatePlayerSelect(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    playersList.sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < 2; i++) {
        const select = document.createElement('select');
        select.innerHTML = `<option value="" disabled selected>-- Escolher Jogador --</option>` +
            playersList.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        container.appendChild(select);
    }
}

function initAudioContext(){
    if(!audioContext){
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function populateRandomPlayerSelect(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    playersList.sort((a, b) => a.name.localeCompare(b.name));

    const select = document.createElement('select');
    select.innerHTML = `<option value="" disabled selected>-- Escolher Jogador --</option>` +
        playersList.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    container.appendChild(select);

}


function startGame() {
    const redPlayers = [...document.getElementById('team-red').querySelectorAll('select')].map(s => playersList.find(p => p.id === s.value));
    const whitePlayers = [...document.getElementById('team-white').querySelectorAll('select')].map(s => playersList.find(p => p.id === s.value));

    currentGame = {
        red: redPlayers.map(p => ({ ...p, goals: 0, ownGoals: 0 })),
        white: whitePlayers.map(p => ({ ...p, goals: 0, ownGoals: 0 })),
        winner: null,
        startTime: new Date(),
        endTime: null
    };

    timeLeft = 150;
    startTimer();
    updateScoreBoard();
    document.getElementById('score-board').style.display = 'block';
    document.getElementById('tie-breaker').style.display = 'none';
    showView('view-game');
}

let isPaused = false;

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

function pauseResumeTimer() {
    isPaused = !isPaused;
}
function beep(frequency = 1000, duration = 200) {

    if(!audioContext) return
    //const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
        // audioContext.close(); // Libera recursos
    }, duration);
}

function updateTimerDisplay() {
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');
    document.getElementById('game-timer').textContent = `${mins}:${secs}`;
}


function updateScoreBoard() {
    const board = document.getElementById('score-board');
    board.innerHTML = '';
    const redGoals = currentGame.red.reduce((sum, p) => sum + p.goals, 0) + currentGame.white.reduce((sum, p) => sum + p.ownGoals, 0);
    const whiteGoals = currentGame.white.reduce((sum, p) => sum + p.goals, 0) + currentGame.red.reduce((sum, p) => sum + p.ownGoals, 0);
    ['red', 'white'].forEach(team => {
        const wrapper = document.createElement('div');
        // wrapper.className = team === 'red' ? 'team-section red' : 'team-section white';
        wrapper.classList.add('team-section')
        wrapper.classList.add(team === 'red' ? 'red' : 'white')

        const title = document.createElement('h3');
        title.textContent = team === 'red' ? `Equipa Vermelha - ${redGoals}` : `Equipa Branca - ${whiteGoals}`;

        wrapper.appendChild(title);

        currentGame[team].forEach(player => {
            const div = document.createElement('div');
            div.classList.add('score-controls')
            div.innerHTML = `<span class="player-name">${player.name}</span> - ${player.goals} Golo(s) | ${player.ownGoals} Autogolo(s) ` +
                `<div class="score-controls">
                            <button onclick="addGoal('${team}', '${player.id}')" onTouchStart="touchStartGoal('${team}', '${player.id}')" onTouchEnd="touchEnd()">+ Golo</button>
                            <button onclick="addOwnGoal('${team}', '${player.id}')" onTouchStart="touchStartOwnGoal('${team}', '${player.id}')" onTouchEnd="touchEnd()">+ Autogolo</button>
                        </div>`;
            wrapper.appendChild(div);
        });

        board.appendChild(wrapper);
    });
}
let longPressTimer;
let longPressDuration = 600; // em milissegundos
let isLongPress = false;

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
function addGoal(team, id) {
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


function removeGoal(team, id) {
    const player = currentGame[team].find(p => p.id === id);
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

function addOwnGoal(team, id) {
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

function removeOwnGoal(team, id) {
    const player = currentGame[team].find(p => p.id === id);
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

function checkWinner() {
    const redGoals = currentGame.red.reduce((sum, p) => sum + p.goals, 0) + currentGame.white.reduce((sum, p) => sum + p.ownGoals, 0);
    const whiteGoals = currentGame.white.reduce((sum, p) => sum + p.goals, 0) + currentGame.red.reduce((sum, p) => sum + p.ownGoals, 0);

    if (redGoals >= 3 || whiteGoals >= 3) {
        currentGame.winner = redGoals > whiteGoals ? 'red' : 'white';
        finalizeGame();
    } else if (timeLeft <= 0 && redGoals === whiteGoals) {
        const select = document.getElementById('winner-team');
        select.innerHTML = `
                    <option value="red">Equipa Vermelha</option>
                    <option value="white">Equipa Branca</option>
                `;
        document.getElementById('score-board').style.display = 'none';
        document.getElementById('tie-breaker').style.display = 'block';
    } else if (timeLeft <= 0) {
        currentGame.winner = redGoals > whiteGoals ? 'red' : 'white';
        finalizeGame();
    }
}

function finalizeGame() {
    clearInterval(timer);
    if (!currentGame.winner) {
        currentGame.winner = null
    }
    currentGame.endTime = new Date();
    const durationMs = currentGame.endTime - currentGame.startTime;
    const durationSecs = Math.floor(durationMs / 1000);
    const mins = String(Math.floor(durationSecs / 60)).padStart(2, '0');
    const secs = String(durationSecs % 60).padStart(2, '0');
    currentGame.time = `${mins}:${secs}`;
    // currentGame.time = currentGame.endTime - currentGame.startTime;
    games.push(currentGame);
    if (!currentGame.winner) {
        currentGame.winner = document.getElementById('winner-team').value;
    }
    showSummary();
}

function showSummary() {
    const summary = document.getElementById('tournament-summary');
    let text = '';
    // games.forEach((game, idx) => {
    //     const redGoals = game.red.reduce((s, p) => s + p.goals, 0) + game.white.reduce((s, p) => s + p.ownGoals, 0);
    //     const whiteGoals = game.white.reduce((s, p) => s + p.goals, 0) + game.red.reduce((s, p) => s + p.ownGoals, 0);
    //     text += `Jogo ${idx + 1}\nEquipa Vermelha: ${redGoals} | Equipa Branca: ${whiteGoals}\n`;
    //     game.red.forEach(p => text += `  ${p.name} - Golos: ${p.goals} | Autogolos: ${p.ownGoals}\n`);
    //     game.white.forEach(p => text += `  ${p.name} - Golos: ${p.goals} | Autogolos: ${p.ownGoals}\n`);
    //     text += `Vencedor: ${game.winner === 'red' ? 'Equipa Vermelha' : 'Equipa Branca'}\n---\n`;
    // });
    // playersScore.forEach((player, idx) => {
    //     text += `${player.name} -> Golos: ${player.goals} | Autogolos: ${player.ownGoals}\n`;
    // });
    // summary.textContent = text;
    console.log(playersScore);
    console.log(games);
    showView('view-summary');
}

function newGame() {
    const winningTeam = currentGame[currentGame.winner];
    if (currentGame.winner === 'red') {
        document.getElementById('team-red').style.display = 'none';
        document.getElementById('team-white').style.display = 'block';
        populatePlayerSelect('team-white');
        document.getElementById('team-red').innerHTML = '';
        winningTeam.forEach((p, i) => {
            const select = document.createElement('select');
            select.innerHTML = `<option value="${p.id}" selected>${p.name}</option>`;
            document.getElementById('team-red').appendChild(select);
        });
    } else {
        document.getElementById('team-red').style.display = 'block';
        document.getElementById('team-white').style.display = 'none';
        populatePlayerSelect('team-red');
        document.getElementById('team-white').innerHTML = '';
        winningTeam.forEach((p, i) => {
            const select = document.createElement('select');
            select.innerHTML = `<option value="${p.id}" selected>${p.name}</option>`;
            document.getElementById('team-white').appendChild(select);
        });
    }
    showView('view-select');
}

async function endTournament() {
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

document.addEventListener("DOMContentLoaded", () => {
    populateRandomPlayerSelect('player-1');
    populateRandomPlayerSelect('player-2');
    populateRandomPlayerSelect('player-3');
    populateRandomPlayerSelect('player-4');
    populatePlayerSelect('team-red');
    populatePlayerSelect('team-white');
});
document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
});
// window.addEventListener('beforeunload', function (e) {
//     e.preventDefault(); // Necessário para alguns browsers
//     e.returnValue = ''; // Requerido para mostrar o diálogo de confirmação
// });

