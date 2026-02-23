const axios = require('axios');
const { readCache, writeCache, appendCache } = require('../provider');

const STATS_ENDPOINT = 'https://stats.nba.com/stats';
const CDN_ENDPOINT = 'https://cdn.nba.com/static/json';
const SEASON = '2025-26';

// Required headers — NBA.com returns 403 without these
const NBA_HEADERS = {
    'Host': 'stats.nba.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
    'Connection': 'keep-alive',
};

// Cache files
const STATS_FILE = './cache/nba/player_stats';
const ROSTERS_FILE = './cache/nba/rosters';
const SCHEDULE_FILE = './cache/nba/schedule';
const BOX_SCORE_FILE = './cache/nba/box_score';
const STANDINGS_FILE = './cache/nba/standings';

// Convert NBA resultSet (headers + rowSet) to array of plain objects
const toObjects = (resultSet) => {
    const { headers, rowSet } = resultSet;
    return rowSet.map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
    });
};

const teamLogoUrl = (teamId) =>
    `https://cdn.nba.com/logos/nba/${teamId}/primary/L/logo.svg`;


const initStats = async () => {
    if (readCache(STATS_FILE)) {
        console.log('[NBA] Player stats loaded from cache');
        return;
    }
    console.log('[NBA] Fetching player stats...');
    const res = await axios.get(
        `${STATS_ENDPOINT}/leaguedashplayerstats?Season=${SEASON}&SeasonType=Regular+Season&PerMode=PerGame&MeasureType=Base&LeagueID=00`,
        { headers: NBA_HEADERS, timeout: 60000 }
    );
    writeCache(STATS_FILE, res.data);
    console.log('[NBA] Player stats cached');
};

const initRosters = async () => {
    if (readCache(ROSTERS_FILE)) {
        console.log('[NBA] Rosters loaded from cache');
        return;
    }
    console.log('[NBA] Fetching rosters...');
    const res = await axios.get(
        `${STATS_ENDPOINT}/commonallplayers?LeagueID=00&Season=${SEASON}&IsOnlyCurrentSeason=1`,
        { headers: NBA_HEADERS, timeout: 60000 }
    );
    const players = toObjects(res.data.resultSets[0]);

    // Group players by team
    const teamMap = {};
    for (const p of players) {
        if (!p.TEAM_ID || p.TEAM_ID === 0) continue;
        if (!teamMap[p.TEAM_ID]) {
            teamMap[p.TEAM_ID] = {
                teamId: p.TEAM_ID,
                name: `${p.TEAM_CITY} ${p.TEAM_NAME}`,
                tricode: p.TEAM_ABBREVIATION,
                logo: teamLogoUrl(p.TEAM_ID),
                roster: [],
            };
        }
        teamMap[p.TEAM_ID].roster.push({
            playerId: p.PERSON_ID,
            name: p.DISPLAY_FIRST_LAST,
        });
    }
    const teams = Object.values(teamMap);
    writeCache(ROSTERS_FILE, teams);
    console.log(`[NBA] Rosters cached (${teams.length} teams, ${players.length} players)`);
};

const initSchedule = async () => {
    if (readCache(SCHEDULE_FILE)) {
        console.log('[NBA] Schedule loaded from cache');
        return;
    }
    console.log('[NBA] Fetching schedule...');
    // CDN schedule — no special headers required
    const res = await axios.get(`${CDN_ENDPOINT}/staticData/scheduleLeagueV2.json`);
    const gameDates = res.data.leagueSchedule.gameDates;

    // Group all games by calendar date (YYYY-MM-DD)
    const dateMap = {};
    for (const dateEntry of gameDates) {
        for (const game of dateEntry.games) {
            const dateKey = game.gameDateTimeUTC.split('T')[0]; // "2025-11-04"
            if (!dateMap[dateKey]) dateMap[dateKey] = { gameday: dateKey, games: [] };
            dateMap[dateKey].games.push(game);
        }
    }

    // Sort by date string and store as array
    const rounds = Object.values(dateMap).sort((a, b) => a.gameday.localeCompare(b.gameday));
    writeCache(SCHEDULE_FILE, rounds);
    console.log(`[NBA] Schedule cached (${rounds.length} game days)`);
};

const getPlayerStats = async () => {
    console.log('[NBA] getPlayerStats');
    const data = readCache(STATS_FILE);
    if (!data) return null;
    return toObjects(data.resultSets[0]);
};

const getSchedule = async () => {
    console.log('[NBA] getSchedule');
    const data = readCache(SCHEDULE_FILE);
    if (!data) return null;
    return data.map(week => ({
        gameday: week.gameday,
        games: week.games.map(g => ({
            gamecode: g.gameId,
            date: g.gameDateTimeUTC,
            played: g.gameStatus === 3,
            hometeam: `${g.homeTeam.teamCity} ${g.homeTeam.teamName}`,
            awayteam: `${g.awayTeam.teamCity} ${g.awayTeam.teamName}`,
            homeCode: g.homeTeam.teamTricode,
            awayCode: g.awayTeam.teamTricode,
            homeLogo: teamLogoUrl(g.homeTeam.teamId),
            awayLogo: teamLogoUrl(g.awayTeam.teamId),
            homescore: g.gameStatus === 3 ? g.homeTeam.score : null,
            awayscore: g.gameStatus === 3 ? g.awayTeam.score : null,
        }))
    }));
};

// Parse ISO 8601 duration "PT22M46.00S" → "22:46"
const parseDuration = (iso) => {
    if (!iso) return null;
    const m = iso.match(/PT(\d+)M([\d.]+)S/);
    if (!m) return null;
    return `${m[1]}:${String(Math.floor(parseFloat(m[2]))).padStart(2, '0')}`;
};

const getBoxScore = async (gameId) => {
    console.log(`[NBA] getBoxScore ${gameId}`);
    const games = readCache(BOX_SCORE_FILE) || [];
    const cached = games.find(g => g.gameId === gameId && g.local?.players?.some(p => p.stats?.min != null));
    if (cached) {
        console.log(`[NBA] Box score for ${gameId} served from cache`);
        return cached;
    }

    console.log(`[NBA] Fetching box score for ${gameId} from CDN...`);
    const res = await axios.get(
        `${CDN_ENDPOINT}/liveData/boxscore/boxscore_${gameId}.json`,
        { timeout: 30000 }
    );

    const game = res.data.game;
    if (!game) {
        console.error(`[NBA] No game data in CDN response for ${gameId}`);
        return null;
    }

    const formatTeam = (teamData) => ({
        teamId: teamData.teamId,
        teamName: `${teamData.teamCity} ${teamData.teamName}`,
        logo: teamLogoUrl(teamData.teamId),
        players: teamData.players.map(p => ({
            name: `${p.firstName} ${p.familyName}`,
            position: p.position,
            stats: {
                min: parseDuration(p.statistics.minutes),
                pts: p.statistics.points,
                reb: p.statistics.reboundsTotal,
                ast: p.statistics.assists,
                stl: p.statistics.steals,
                blk: p.statistics.blocks,
                to: p.statistics.turnovers,
                fgm: p.statistics.fieldGoalsMade,
                fga: p.statistics.fieldGoalsAttempted,
                fg3m: p.statistics.threePointersMade,
                fg3a: p.statistics.threePointersAttempted,
                ftm: p.statistics.freeThrowsMade,
                fta: p.statistics.freeThrowsAttempted,
                plusMinus: p.statistics.plusMinusPoints,
            }
        }))
    });

    const boxScore = {
        gameId,
        local: formatTeam(game.homeTeam),
        road: formatTeam(game.awayTeam),
    };
    appendCache(BOX_SCORE_FILE, boxScore);
    console.log(`[NBA] Box score for ${gameId} cached (home: ${game.homeTeam.players.length} players)`);
    return boxScore;
};

const getRosters = async () => {
    console.log('[NBA] getRosters');
    return readCache(ROSTERS_FILE);
};

// Returns the latest date string where the majority of games have been played
const getLatestPlayedRound = () => {
    const data = readCache(SCHEDULE_FILE);
    if (!data) return null;
    let latest = null;
    for (const day of data) {
        const played = day.games.filter(g => g.gameStatus === 3).length;
        if (played > day.games.length / 2) latest = day.gameday;
    }
    return latest;
};

const getStandings = async (round) => {
    console.log(`[NBA] getStandings${round ? ` round=${round}` : ''}`);
    const cache = readCache(STANDINGS_FILE) || {};
    const key = String(round || 'current');
    if (cache[key]) {
        console.log(`[NBA] Standings served from cache (key=${key})`);
        return cache[key];
    }

    console.log('[NBA] Fetching standings...');
    const res = await axios.get(
        `${STATS_ENDPOINT}/leaguestandingsv3?LeagueID=00&Season=${SEASON}&SeasonType=Regular+Season`,
        { headers: NBA_HEADERS, timeout: 60000 }
    );

    const rows = toObjects(res.data.resultSets[0]);
    const standings = rows.map(r => ({
        position: r.PlayoffRank,
        teamId: r.TeamID,
        name: `${r.TeamCity} ${r.TeamName}`,
        tricode: r.TeamSlug,
        logo: teamLogoUrl(r.TeamID),
        conference: r.Conference,
        gamesPlayed: r.WINS + r.LOSSES,
        gamesWon: r.WINS,
        gamesLost: r.LOSSES,
        winPercentage: r.WinPCT,
        gamesBehind: r.ConferenceGamesBack,
        homeRecord: r.HOME,
        roadRecord: r.ROAD,
        last10: r.L10,
        streak: r.strCurrentStreak,
    }));

    cache[key] = standings;
    writeCache(STANDINGS_FILE, cache);
    console.log(`[NBA] Standings cached (${standings.length} teams)`);
    return standings;
};

const init = async () => {
    console.log('[NBA] Initializing...');
    try { await initRosters(); } catch (e) { console.error('[NBA] Rosters init error:', e.message); }
    try { await initStats(); } catch (e) { console.error('[NBA] Stats init error:', e.message); }
    try { await initSchedule(); } catch (e) { console.error('[NBA] Schedule init error:', e.message); }
    console.log('[NBA] Initialization complete');
};

module.exports = { init, getRosters, getPlayerStats, getSchedule, getBoxScore, getStandings, getLatestPlayedRound };
