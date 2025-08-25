
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
let timeLeft = 0;
let gameTime = 150;
let audioContext = null;

function debug(msg) {
    document.getElementById('debug').textContent += msg + '\n';
}

function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

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

function populatePlayerSelect(selectId, selectedPlayer = null) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "seleciona um jogador"
    defaultOption.disabled = true;
    if (!selectedPlayer) defaultOption.selected = true;

    select.appendChild(defaultOption);
    playersList.sort((a, b) => a.name.localeCompare(b.name));
    playersList.forEach(player => {
        const option = document.createElement("option");
        option.value = player.id;
        option.text = player.name;
        if (player.id === selectedPlayer) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function backToTeam() {
    showView("view-select");
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function populateRandomPlayerSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "seleciona 4 jogadores"
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

    if(currentGame.winner===null){
            document.getElementById('winner-team-label').innerHTML = document.getElementById('winner-team').value === 'red' ? `🔴 Equipa Vermelha` : `⚪ Equipa Branca`;

    }else{

    document.getElementById('winner-team-label').innerHTML = currentGame.winner === 'red' ? `🔴 Equipa Vermelha` : `⚪ Equipa Branca`;
    // title.textContent = team === 'red' ? `🔴 Equipa Vermelha` : `⚪ Equipa Branca`;
}
    showView('view-summary');
}

// function populateNextPlayers() {
//     const selectIds = ["next-payer-1", "naext-player-2"];
//     const selects = selectIds.map(id => document.getElementById(id));

//     // Obter todos os valores selecionados
//     const selectedValues = selects
//         .map(s => s.value)
//         .filter(v => v !== "");

//     // Atualizar opções nas outras selects
//     selects.forEach(select => {
//         Array.from(select.options).forEach(option => {
//             if (option.value === "") return; // ignorar vazio
//             option.disabled = selectedValues.includes(option.value) && option.value !== select.value;
//         });
//     });
// }

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

function pauseTimer() {
    isPaused = true;
}

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


    // Obter todos os valores selecionados
    const selectedValues = nextPlayersSelect
        .map(s => s.value)
        .filter(v => v !== "");


    nextPlayersSelect.forEach(select => {
        Array.from(select.options).forEach(option => {
            if (option.value === "") return; // ignorar vazio
            option.disabled = selectedValues.includes(option.value) && option.value !== select.value;
        });
    });

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


function newGame() {
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

async function endTournament() {
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
    populateRandomPlayerSelect('random-players');
    // populatePlayerSelect('team-red');
    // populatePlayerSelect('team-white');
// usarVideoFallback()

    const popup = document.getElementById('popup');
    popup.remove();
    // popup.classList.add('show');

    // setTimeout(() => {
    // popup.classList.remove('show');
    // popup.remove();
    //       }, 5000);

});




// function usarVideoFallback() {
//   const video = document.createElement("video");
//   video.src = "blank.mp4"; // caminho para o vídeo de 1 min
//   video.autoplay = true;
//   video.muted = true;
//   video.loop = true;        // roda infinitamente
//   video.playsInline = true;
//   video.style.display = "none"; // escondido
//   document.body.appendChild(video);
// }
