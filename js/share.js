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

// NIUP palette, the same as the app (variables.css of the other NIUP apps)
const SHARE_COLORS = {
    primary: '#0B73F5',
    background: '#F6F6F6',
    card: '#FFFFFF',
    border: '#E8E8E8',
    line: '#F2F2F2',
    text: '#181818',
    muted: '#787878',
    red: '#A80000'
};
const SHARE_FONT = 'Inter, -apple-system, "Segoe UI", sans-serif';

function fitText(ctx, text, maxWidth, size, weight = '') {
    let fontSize = size;
    do {
        ctx.font = `${weight} ${fontSize}px ${SHARE_FONT}`.trim();
        fontSize -= 2;
    } while (ctx.measureText(text).width > maxWidth && fontSize > 16);
}

function loadImage(src) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function roundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

async function buildShareImage() {
    const shortNames = buildShortNames();
    const short = name => shortNames[name] || name;
    const awards = computeAwards().concat(computeRivalries());
    const ranking = rankedPlayers();
    const C = SHARE_COLORS;

    // The page font and the logo have to be ready before drawing
    try {
        await Promise.all(['500', '600', '700', '800'].map(w => document.fonts.load(`${w} 30px Inter`)));
    } catch (e) { /* the fallback font is used */ }
    const logo = await loadImage('./images/white-logo.svg');

    const width = 1080;
    const margin = 40;
    const pad = 36;
    const gap = 28;
    const cardX = margin;
    const cardW = width - margin * 2;
    const left = cardX + pad;
    const right = cardX + cardW - pad;
    const innerW = right - left;

    const headerH = 130;
    const cardHead = 110; // title and rule
    const awardsH = awards.length ? cardHead + awards.length * 96 + 16 : 0;
    const rankingH = cardHead + 56 + ranking.length * 64 + 16;
    const gamesH = cardHead + games.length * 76 + 16;
    const height = margin + headerH + gap
        + (awardsH ? awardsH + gap : 0)
        + rankingH + gap + gamesH + margin;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = C.background;
    ctx.fillRect(0, 0, width, height);

    const card = (y, h) => {
        roundedRectPath(ctx, cardX, y, cardW, h, 28);
        ctx.fillStyle = C.card;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = C.border;
        ctx.stroke();
    };

    const cardTitle = (y, text) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = C.text;
        ctx.font = `700 40px ${SHARE_FONT}`;
        ctx.fillText(text, left, y + 68);
        ctx.fillStyle = C.border;
        ctx.fillRect(left, y + 92, innerW, 2);
    };

    // Header: the NIUP logo on its blue block, like the top bar of the app
    let y = margin;
    ctx.save();
    roundedRectPath(ctx, cardX, y, cardW, headerH, 28);
    ctx.clip();
    ctx.fillStyle = C.card;
    ctx.fillRect(cardX, y, cardW, headerH);
    ctx.fillStyle = C.primary;
    ctx.fillRect(cardX, y, 300, headerH);
    ctx.restore();
    roundedRectPath(ctx, cardX, y, cardW, headerH, 28);
    ctx.lineWidth = 2;
    ctx.strokeStyle = C.border;
    ctx.stroke();

    if (logo) {
        ctx.drawImage(logo, cardX + 70, y + headerH / 2 - 21, 160, 160 * 136 / 611);
    } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.font = `800 48px ${SHARE_FONT}`;
        ctx.fillText('NIUP', cardX + 150, y + headerH / 2 + 17);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    ctx.font = `700 48px ${SHARE_FONT}`;
    ctx.fillText('Matraquilhos', cardX + 340, y + 62);
    ctx.fillStyle = C.muted;
    ctx.font = `500 28px ${SHARE_FONT}`;
    ctx.fillText(`${new Date().toLocaleDateString('pt-PT')}  ·  ${games.length} jogo(s)`, cardX + 340, y + 102);
    y += headerH + gap;

    // Awards and rivalries
    if (awards.length) {
        card(y, awardsH);
        cardTitle(y, 'Prémios e rivalidades');
        let rowY = y + cardHead;
        awards.forEach(a => {
            ctx.textAlign = 'left';
            ctx.fillStyle = C.text;
            ctx.font = `40px ${SHARE_FONT}`;
            ctx.fillText(a.icon, left, rowY + 54);
            fitText(ctx, a.title, innerW - 80, 32, '700');
            ctx.fillStyle = C.text;
            ctx.fillText(a.title, left + 80, rowY + 40);
            fitText(ctx, a.text, innerW - 80, 28, '500');
            ctx.fillStyle = C.muted;
            ctx.fillText(a.text, left + 80, rowY + 76);
            rowY += 96;
        });
        y += awardsH + gap;
    }

    // Ranking
    card(y, rankingH);
    cardTitle(y, 'Classificação');
    const colCenters = [0, 1, 2, 3, 4].map(i => right - 45 - (4 - i) * 90);
    let rowY = y + cardHead;
    ctx.fillStyle = C.muted;
    ctx.font = `600 26px ${SHARE_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('Jogador', left, rowY + 38);
    ctx.textAlign = 'center';
    ['G', 'AG', 'V', 'D', 'E'].forEach((h, i) => ctx.fillText(h, colCenters[i], rowY + 38));
    rowY += 56;
    ranking.forEach((p, i) => {
        if (i === 0) {
            roundedRectPath(ctx, left - 14, rowY + 4, innerW + 28, 56, 14);
            ctx.fillStyle = 'rgba(11, 115, 245, 0.08)';
            ctx.fill();
        } else {
            ctx.fillStyle = C.line;
            ctx.fillRect(left, rowY, innerW, 2);
        }
        const baseline = rowY + 42;
        ctx.textAlign = 'left';
        ctx.fillStyle = i === 0 ? C.primary : C.muted;
        ctx.font = `700 30px ${SHARE_FONT}`;
        ctx.fillText(String(i + 1), left, baseline);
        ctx.fillStyle = C.text;
        fitText(ctx, short(p.name), innerW - 450 - 60, 30, i === 0 ? '700' : '600');
        ctx.fillText(short(p.name), left + 50, baseline);
        ctx.textAlign = 'center';
        [p.goals, p.ownGoals, p.wins, p.losses, p.ties].forEach((v, c) => {
            ctx.font = `${c === 2 ? '700' : '500'} 30px ${SHARE_FONT}`;
            ctx.fillStyle = c === 2 ? C.primary : C.text;
            ctx.fillText(String(v), colCenters[c], baseline);
        });
        rowY += 64;
    });
    y += rankingH + gap;

    // Games: red team on the left, white team on the right, the winner in bold
    card(y, gamesH);
    cardTitle(y, 'Jogos');
    rowY = y + cardHead;
    const centerX = (left + right) / 2;
    const sideW = 330;
    games.forEach((game, idx) => {
        if (idx > 0) {
            ctx.fillStyle = C.line;
            ctx.fillRect(left, rowY, innerW, 2);
        }
        const baseline = rowY + 50;
        const score = getScore(game);
        const red = game.red.map(p => short(p.name)).join(' & ');
        const white = game.white.map(p => short(p.name)).join(' & ');
        const redWon = game.winner === 'red';
        const whiteWon = game.winner === 'white';

        ctx.textAlign = 'left';
        ctx.fillStyle = C.muted;
        ctx.font = `600 26px ${SHARE_FONT}`;
        ctx.fillText(String(idx + 1), left, baseline);

        // team dots: filled red, and white with a dark outline
        ctx.beginPath();
        ctx.arc(left + 76, baseline - 10, 11, 0, Math.PI * 2);
        ctx.fillStyle = C.red;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(right - 11, baseline - 10, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = C.text;
        ctx.stroke();

        ctx.fillStyle = C.text;
        ctx.textAlign = 'left';
        fitText(ctx, red, sideW, 30, redWon ? '700' : '500');
        ctx.fillText(red, left + 100, baseline);
        ctx.textAlign = 'right';
        fitText(ctx, white, sideW, 30, whiteWon ? '700' : '500');
        ctx.fillText(white, right - 36, baseline);

        ctx.textAlign = 'center';
        ctx.fillStyle = C.text;
        ctx.font = `800 40px ${SHARE_FONT}`;
        ctx.fillText(`${score.red} - ${score.white}`, centerX + 4, baseline + 2);
        rowY += 76;
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
