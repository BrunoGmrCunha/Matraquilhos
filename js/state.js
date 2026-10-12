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
