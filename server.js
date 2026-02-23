const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// --- Config ---

const CACHE = {
  BASKETBALL: {
    leaguesFile: './cache/basketball/leagues',
    gamesFile: './cache/basketball/games',
    favoriteLeagues: ['Euroleague', 'NBA'],
  },
  FOOTBALL: {
    leaguesFile: './cache/football/leagues',
    gamesFile: './cache/football/games',
    favoriteLeagues: [
      { name: 'Premier League', country: 'England' },
      { name: 'UEFA Champions League', country: 'World' },
    ],
  },
};

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// --- Helpers ---

function getLeagues(sport) {
  const cfg = CACHE[sport];
  if (!cfg) throw new Error(`Unknown sport: ${sport}`);

  const data = readJson(cfg.leaguesFile);
  if (!data) return [];

  const items = Array.isArray(data) ? data : (data.response || []);
  const favs = cfg.favoriteLeagues;

  if (sport === 'BASKETBALL') {
    return items.filter(item => item.name && favs.includes(item.name));
  }
  return items.filter(item =>
    favs.some(f => f.name === item.league?.name && f.country === item.country?.name)
  );
}

function getSeasons(leagueName, sport) {
  const leagues = getLeagues(sport);

  const league = sport === 'BASKETBALL'
    ? leagues.find(l => l.name === leagueName)
    : leagues.find(l => l.league?.name === leagueName);

  if (!league || !league.seasons) return [];

  return league.seasons
    .filter(s => s.coverage?.players === true && s.coverage?.standings === true)
    .sort((a, b) => a.season > b.season ? 1 : a.season < b.season ? -1 : 0);
}

function getGames(leagueName, sport) {
  const cfg = CACHE[sport];
  if (!cfg) return [];

  const data = readJson(cfg.gamesFile);
  if (!data) return [];

  return (data.response || []).filter(g => g.league?.name === leagueName);
}

function getGameById(gameId, sport) {
  const cfg = CACHE[sport];
  if (!cfg) return null;

  const data = readJson(cfg.gamesFile);
  if (!data) return null;

  return (data.response || []).find(g => {
    const id = g.id || g.fixture?.id;
    return String(id) === String(gameId);
  }) || null;
}

// --- Euroleague ---

const euroleague = require('./backend/handlers/euroleague');
euroleague.init(); // fetch and cache data on startup

// --- NBA ---

const nba = require('./backend/handlers/nba');
nba.init(); // fetch and cache data on startup

// --- Routes ---

app.get('/api/leagues', (req, res) => {
  try {
    const sport = (req.query.sport || 'BASKETBALL').toUpperCase();
    res.json(getLeagues(sport));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/seasons', (req, res) => {
  try {
    const { league, sport = 'BASKETBALL' } = req.query;
    if (!league) return res.status(400).json({ error: 'league parameter is required' });
    res.json(getSeasons(league, sport.toUpperCase()));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/leagues/:league/games', (req, res) => {
  try {
    const sport = (req.query.sport || 'BASKETBALL').toUpperCase();
    res.json(getGames(req.params.league, sport));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/games/:game', (req, res) => {
  try {
    const sport = (req.query.sport || 'BASKETBALL').toUpperCase();
    const game = getGameById(req.params.game, sport);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/euroleague/player-stats', async (req, res) => {
  try {
    const stats = await euroleague.getPlayerStats();
    if (!stats) return res.status(404).json({ error: 'Player stats not available' });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/euroleague/boxscore/:gameCode', async (req, res) => {
  try {
    console.log("gamecodeclick")
    const data = await euroleague.getBoxScore(req.params.gameCode);
    console.log(data);
    if (!data) return res.status(404).json({ error: 'Box score not available' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/euroleague/schedule', async (req, res) => {
  try {
    const schedule = await euroleague.getSchedule();
    if (!schedule) return res.status(404).json({ error: 'Schedule not available' });
    res.json(schedule);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/euroleague/standings', async (req, res) => {
  try {
    const round = req.query.round ? parseInt(req.query.round) : null;
    const data = await euroleague.getStandings(round);
    if (!data) return res.status(404).json({ error: 'Standings not available' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/euroleague/rosters', async (req, res) => {
  try {
    const rosters = await euroleague.getRosters();
    if (!rosters) return res.status(404).json({ error: 'Rosters not available' });
    res.json(rosters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nba/player-stats', async (req, res) => {
  try {
    const stats = await nba.getPlayerStats();
    if (!stats) return res.status(404).json({ error: 'Player stats not available' });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nba/boxscore/:gameId', async (req, res) => {
  try {
    const data = await nba.getBoxScore(req.params.gameId);
    if (!data) return res.status(404).json({ error: 'Box score not available' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nba/schedule', async (req, res) => {
  try {
    const schedule = await nba.getSchedule();
    if (!schedule) return res.status(404).json({ error: 'Schedule not available' });
    res.json(schedule);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nba/standings', async (req, res) => {
  try {
    const data = await nba.getStandings();
    if (!data) return res.status(404).json({ error: 'Standings not available' });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/nba/rosters', async (req, res) => {
  try {
    const rosters = await nba.getRosters();
    if (!rosters) return res.status(404).json({ error: 'Rosters not available' });
    res.json(rosters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
