const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// --- Hardcoded leagues ---

const LEAGUES = {
  BASKETBALL: [
    {
      id: 120,
      name: 'Euroleague',
      type: 'cup',
      logo: 'https://media.api-sports.io/basketball/leagues/120.png',
      country: { name: 'Europe', flag: null },
    },
    {
      id: 12,
      name: 'NBA',
      type: 'League',
      logo: 'https://media.api-sports.io/basketball/leagues/12.png',
      country: { name: 'USA', flag: null },
    },
  ],
  FOOTBALL: [],
};

function getLeagues(sport) {
  return LEAGUES[sport] || [];
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
