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
