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

    const rivalries = computeRivalries();
    if (rivalries.length > 0) {
        lines.push('⚔️ *Rivalidades*');
        rivalries.forEach(r => lines.push(`${r.icon} ${r.title}: ${r.text}`));
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
    const awards = computeAwards().concat(computeRivalries());
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
        sectionTitle('🏅 Prémios e rivalidades');
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
