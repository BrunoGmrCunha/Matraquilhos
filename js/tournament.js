// =====================
// Streaks e alcunhas
// =====================
let toastTimer = null;
const RPS_STREAK = 6; // wins in a row that trigger the rock-paper-scissors

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

/**
 * Consecutive wins of the same pair of players, counting the game being played.
 * A tie-breaker win counts as a win; a loss or a different pair breaks the streak.
 */
function getTeamWinStreak(winnerTeam) {
    const pairKey = players => players.map(p => p.id).sort().join('|');
    const key = pairKey(currentGame[winnerTeam]);
    const finished = games.includes(currentGame) ? games : [...games, currentGame];
    let streak = 0;
    for (let i = finished.length - 1; i >= 0; i--) {
        const game = finished[i];
        const winner = game === currentGame ? winnerTeam : game.winner;
        if (!winner || pairKey(game[winner]) !== key) break;
        streak++;
    }
    return streak;
}

/** Adds every player currently in a selector or in the current game to the tournament roster. */
function registerParticipants() {
    const ids = [...getPicked('red'), ...getPicked('white'), ...getPicked('next')];
    if (currentGame) ['red', 'white'].forEach(team => currentGame[team].forEach(p => ids.push(p.id)));
    ids.filter(id => id && !roster.includes(id)).forEach(id => roster.push(id));
}

/** Finished games since the player last played (the current game counts); never played = the most. */
function getIdleGames(id) {
    const finished = games.includes(currentGame) ? games : [...games, currentGame];
    for (let i = finished.length - 1; i >= 0; i--) {
        if (['red', 'white'].some(team => finished[i][team].some(p => p.id === id))) {
            return finished.length - 1 - i;
        }
    }
    return finished.length;
}

/**
 * Every 6 wins in a row the two winners play rock-paper-scissors: the winner stays and the
 * loser is replaced by a random player who is out. Returns true while it applies to this game.
 */
function renderRockPaperScissors(winnerTeam) {
    const section = document.getElementById('rps-section');
    const streak = winnerTeam ? getTeamWinStreak(winnerTeam) : 0;
    if (winnerTeam) registerParticipants();
    // Needs a partner and two opponents besides the player who stays
    const applies = streak > 0 && streak % RPS_STREAK === 0 && roster.length >= 4;
    const newGameButton = document.getElementById('new-game-button');
    const text = document.getElementById('rps-text');
    const buttons = document.getElementById('rps-buttons');
    section.style.display = applies ? 'block' : 'none';
    newGameButton.disabled = false;
    if (!applies) return false;

    buttons.innerHTML = '';
    const drawArea = document.getElementById('rps-draw');
    drawArea.style.display = 'none';
    const rps = currentGame.rps;
    if (rps && rps.partnerId) {
        text.textContent = `✅ ${playerName(rps.stayId)} fica com ${playerName(rps.partnerId)}\n`
            + `🆚 ${playerName(rps.nextTeam[0])} & ${playerName(rps.nextTeam[1])}`;
        return true;
    }
    if (rps) {
        text.textContent = `${playerName(rps.stayId)} fica.\nEscolhe os jogadores para o parceiro e as próximas equipas.`;
        populateRpsPlayers(rps.stayId);
        drawArea.style.display = 'block';
        newGameButton.disabled = true;
        return true;
    }

    text.textContent = '✊✋✌️ Quem ganhou?';
    currentGame[winnerTeam].forEach(player => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = player.name;
        button.onclick = () => resolveRockPaperScissors(winnerTeam, player.id);
        buttons.appendChild(button);
    });
    newGameButton.disabled = true;
    return true;
}

/** Lists every player; the ones taking part in the tournament (except who stays) come selected. */
function populateRpsPlayers(stayId) {
    const select = document.getElementById('rps-players');
    select.innerHTML = '';
    appendPlayerOptions(select, sortedPlayers().filter(player => player.id !== stayId), roster);
    select.size = select.options.length + select.querySelectorAll("optgroup").length;
    updateRpsDrawButton();
}

function updateRpsDrawButton() {
    const selected = document.getElementById('rps-players').selectedOptions.length;
    document.getElementById('rps-draw-button').disabled = selected < 3;
}

/** Step 1: the winner of the rock-paper-scissors stays, the other one leaves. */
function resolveRockPaperScissors(winnerTeam, stayId) {
    const outId = currentGame[winnerTeam].map(p => p.id).find(id => id !== stayId);
    currentGame.rps = { stayId, outId };
    renderRockPaperScissors(winnerTeam);
    saveState();
}

/** Step 2: draws the partner, the opponents and the waiting teams from the selected list. */
function drawAfterRockPaperScissors() {
    const { stayId, outId } = currentGame.rps;
    const selected = Array.from(document.getElementById('rps-players').selectedOptions).map(o => o.value);
    if (selected.length < 3) return;
    selected.filter(id => !roster.includes(id)).forEach(id => roster.push(id));

    // Those idle for longest face the winner (random order breaks ties); the rest is drawn
    // for the partner and the waiting teams
    const candidates = [...selected];
    shuffle(candidates);
    candidates.sort((a, b) => getIdleGames(b) - getIdleGames(a));
    const nextTeam = candidates.slice(0, 2);
    const rest = candidates.slice(2);
    shuffle(rest);

    // The player who lost the rock-paper-scissors does not come back as the partner
    if (rest[0] === outId) {
        const swapIndex = nextTeam.findIndex(id => id !== outId);
        [rest[0], nextTeam[swapIndex]] = [nextTeam[swapIndex], rest[0]];
    }
    const partnerId = rest[0];
    const waiting = rest.slice(1);
    const waitingTeams = [];
    for (let i = 0; i + 1 < waiting.length; i += 2) waitingTeams.push([waiting[i], waiting[i + 1]]);
    const soloPlayer = waiting.length % 2 === 1 ? waiting[waiting.length - 1] : null;

    currentGame.rps = { stayId, outId, partnerId, nextTeam, waitingTeams, soloPlayer };
    roster = roster.filter(id => id === stayId || selected.includes(id));
    saveState();
    // Straight to the teams: the table, the next opponents and the waiting teams are already set
    newGame();
}

/** Shows (or hides) the notice that the winning team must swap goalkeeper and striker. */
function renderSwapPositionsNotice(winnerTeam, rpsApplies = false) {
    const notice = document.getElementById('swap-positions-notice');
    const streak = winnerTeam ? getTeamWinStreak(winnerTeam) : 0;
    const mustSwap = streak > 0 && streak % 3 === 0 && !rpsApplies;
    notice.style.display = mustSwap ? 'block' : 'none';
    notice.textContent = mustSwap
        ? '🔄 Trocar guarda-redes ↔ avançado'
        : '';
    return mustSwap;
}

function teamLabel(team) {
    return team === 'red' ? '🔴 Equipa Vermelha' : '⚪ Equipa Branca';
}

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

/** Head-to-head and partnership stats, for this tournament only. */
function computeRivalries() {
    const rivalries = [];
    const duels = {};
    const partners = {};

    games.forEach(game => {
        if (game.isTie || !game.winner) return;
        const loserTeam = game.winner === 'red' ? 'white' : 'red';

        game[game.winner].forEach(winner => game[loserTeam].forEach(loser => {
            const key = [winner.name, loser.name].sort().join('|');
            if (!duels[key]) duels[key] = { names: key.split('|'), wins: {} };
            duels[key].wins[winner.name] = (duels[key].wins[winner.name] || 0) + 1;
        }));

        [game.winner, loserTeam].forEach(team => {
            const key = game[team].map(p => p.name).sort().join(' & ');
            if (!partners[key]) partners[key] = { name: key, wins: 0, losses: 0 };
            if (team === game.winner) partners[key].wins++;
            else partners[key].losses++;
        });
    });

    const duelList = Object.values(duels).map(d => {
        const [a, b] = d.names;
        const aWins = d.wins[a] || 0;
        const bWins = d.wins[b] || 0;
        return { a, b, aWins, bWins, total: aWins + bWins };
    });

    // Most played duel (closest score wins the tie)
    const played = duelList.filter(d => d.total >= 2)
        .sort((x, y) => y.total - x.total || Math.abs(x.aWins - x.bWins) - Math.abs(y.aWins - y.bWins));
    if (played.length > 0) {
        const d = played[0];
        rivalries.push({ icon: '⚔️', title: 'Maior rivalidade', text: `${d.a} vs ${d.b} (${d.aWins}-${d.bWins})` });
    }

    // Someone who never beat someone else, with at least two games between them
    const neverWon = [];
    duelList.forEach(d => {
        if (d.total < 2) return;
        if (d.aWins === 0) neverWon.push({ loser: d.a, winner: d.b, wins: d.bWins });
        if (d.bWins === 0) neverWon.push({ loser: d.b, winner: d.a, wins: d.aWins });
    });
    neverWon.sort((x, y) => y.wins - x.wins).slice(0, 2).forEach(n => {
        rivalries.push({ icon: '😤', title: 'Ainda não ganhou', text: `${n.loser} ainda não ganhou ao ${n.winner} (0-${n.wins})` });
    });

    // Worst partnership: at least two losses together and no wins
    const worst = Object.values(partners).filter(p => p.wins === 0 && p.losses >= 2)
        .sort((x, y) => y.losses - x.losses)[0];
    if (worst) {
        rivalries.push({ icon: '💔', title: 'Pior dupla', text: `${worst.name} (${worst.losses} derrotas, nenhuma vitória)` });
    }

    return rivalries;
}

function renderAwards() {
    const container = document.getElementById('awards');
    const card = a => `<div class="award"><span class="award-icon" aria-hidden="true">${a.icon}</span>` +
        `<div><strong>${escapeHtml(a.title)}</strong><br>${escapeHtml(a.text)}</div></div>`;
    const awards = computeAwards();
    const rivalries = computeRivalries();
    container.innerHTML =
        (awards.length ? '<h3>🏅 Prémios do torneio</h3>' + awards.map(card).join('') : '') +
        (rivalries.length ? '<h3>⚔️ Rivalidades</h3>' + rivalries.map(card).join('') : '');
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
