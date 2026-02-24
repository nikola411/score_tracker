const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { readCache, writeCache, appendCache } = require('../provider');
const { setTimeout } = require('node:timers/promises');

const ENDPOINT = 'https://api-live.euroleague.net';

const CLUBS_ALL = `/v2/clubs`;
const CLUBS_SINGLE = CLUBS_ALL + `/{clubCode}`;
const CLUBS_INFO = CLUBS_SINGLE + `/info`;

const COMPETITIONS = `/v2/competitions`;
const COMPETITIONS_SINGLE = `/v2/competitions/{competitionCode}`;

const GAMES_ALL = COMPETITIONS_SINGLE + `/seasons/{seasonCode}/games`;
const GAMES_SINGLE = GAMES_ALL + `/{gameCode}`;

const SEASON_RESULTS = '/v1/results';
const SCHEDULES = '/v1/schedules';
const TEAMS = '/v1/teams?seasonCode=E2025';

const PLAYER_STATS = '/v3/competitions/E/statistics/players/traditional?SeasonMode=Single&SeasonCode=E2025&limit=324';
const SCHEDULE_BY_ROUND = '/v1/schedules?seasonCode=E2025&gameNumber=';
const RESULTS_BY_ROUND = '/v1/results?seasonCode=E2025&gameNumber=';
const GAME_STATS = '/v2/competitions/E/seasons/E2025/games/';

const TEAM_FILE = './cache/euroleague/teams';
const ROSTER_FILE = './cache/euroleague/rosters';
const CLUBS_DATA_FILE = './cache/euroleague/clubs_data';
const STATS_FILE = './cache/euroleague/player_stats';
const SCHEDULES_FILE = './cache/euroleague/schedule';
const RESULTS_FILE = './cache/euroleague/results';
const GAMES_FILE = './cache/euroleague/box_score';
const STANDINGS_FILE = './cache/euroleague/standings';
const STANDINGS_BY_ROUND = '/v2/competitions/E/seasons/E2025/rounds/';

const parser = new XMLParser({
    ignoreAttributes: false,
    isArray: (name) => {
        return ['club', 'player'].includes(name);
    },
});

const initStats = async () => {
    var stats = await readCache(STATS_FILE);
    if (stats == null)
    {
        const res = await axios.get(ENDPOINT + PLAYER_STATS);
        await writeCache(STATS_FILE, res.data);
    }
}
const initRosters = async () => {
    var rosters = await readCache(ROSTER_FILE);
    if (rosters == null) {
        const res = await axios.get(ENDPOINT + TEAMS);
        const parsed = parser.parse(res.data);
        rosters = parsed.clubs.club.map(item => ({ name: item.name, roster: item.roster.player }));
        await writeCache(ROSTER_FILE, rosters);
    }

    var teams = await readCache(TEAM_FILE);
    if (teams == null) {
        const club_names = rosters.clubs.club.map(item => item.name);
        await writeCache(TEAM_FILE, club_names);
    }
}

const initClubs = async () => {
    var clubs = await readCache(CLUBS_DATA_FILE);
    if (clubs == null)
    {
        const res = await axios.get(ENDPOINT + CLUBS_ALL);
        const parsed = res.data.data;
        await writeCache(CLUBS_DATA_FILE, parsed);
    }
}

const initSchedule = async () => {
    var schedule = await readCache(SCHEDULES_FILE);
    if (schedule == null) {
        const rounds = [];
        for (let i = 1; i <= 38; i++) {
            const res = await axios.get(ENDPOINT + SCHEDULE_BY_ROUND + i);
            rounds.push(parser.parse(res.data));
            await setTimeout(1000);
        }
        await writeCache(SCHEDULES_FILE, rounds);
    }

    var results = await readCache(RESULTS_FILE);
    if (results == null) {
        const allResults = [];
        for (let i = 1; i <= 38; i++) {
            const res = await axios.get(ENDPOINT + RESULTS_BY_ROUND + i);
            const parsed = parser.parse(res.data);
            const games = parsed.results?.game;
            if (games) allResults.push(...(Array.isArray(games) ? games : [games]));
            await setTimeout(1000);
        }
        await writeCache(RESULTS_FILE, allResults);
    }
}

const getPlayerStats = async () => {
    return await readCache(STATS_FILE);
}

const getSchedule = async () => {
    const data = await readCache(SCHEDULES_FILE);
    if (!data) return null;
    const clubs = await readCache(CLUBS_DATA_FILE);
    const clubMap = {};
    if (clubs) clubs.forEach(c => { clubMap[c.code] = c; });
    const results = await readCache(RESULTS_FILE) || [];
    const resultMap = {};
    results.forEach(r => { resultMap[r.gamecode] = r; });
    return data.map(round => ({
        gameday: round.schedule.item[0]?.gameday,
        group: round.schedule.item[0]?.group,
        games: round.schedule.item.map(g => {
            const result = resultMap[g.gamecode];
            return {
                ...g,
                homeLogo: clubMap[g.homecode]?.images?.crest || null,
                awayLogo: clubMap[g.awaycode]?.images?.crest || null,
                homescore: result?.homescore ?? null,
                awayscore: result?.awayscore ?? null,
            };
        })
    }));
}

const getBoxScore = async (gameCode) => {
    const games = await readCache(GAMES_FILE) || [];
    const cached = games.find(g => g.gameNumber === gameCode);
    if (cached) return cached;

    const gameNumber = gameCode.split('_')[1];
    const res = await axios.get(ENDPOINT + GAME_STATS + gameNumber + '/stats');
    const boxScore = { ...res.data, gameNumber: gameCode };
    await appendCache(GAMES_FILE, boxScore);
    return boxScore;
}

const getRosters = async () => {
    return await readCache(ROSTER_FILE);
};

const getLatestPlayedRound = async () => {
    const data = await readCache(SCHEDULES_FILE);
    if (!data) return 1;
    const today = new Date();
    today.setHours(23, 59, 59, 999); // include all of today
    let latest = 1;
    for (const round of data) {
        const items = round.schedule?.item;
        if (!items) continue;
        const arr = Array.isArray(items) ? items : [items];
        // Round is current/past if any game is scheduled on or before today
        const hasGameToday = arr.some(g => new Date(g.date) <= today);
        if (hasGameToday) latest = arr[0]?.gameday ?? latest;
    }
    return latest;
}

const getStandings = async (round) => {
    const r = round || await getLatestPlayedRound();
    const cache = await readCache(STANDINGS_FILE) || {};
    const key = String(r);
    if (cache[key]) {
        const cached = cache[key];
        return cached.teams || cached;
    }

    const res = await axios.get(ENDPOINT + STANDINGS_BY_ROUND + r + '/standings');
    const group = Array.isArray(res.data) ? res.data.find(g => g.standings) : null;
    const raw = group ? group.standings : [];
    const standings = raw.map(entry => ({
        position: entry.data.position,
        gamesPlayed: entry.data.gamesPlayed,
        gamesWon: entry.data.gamesWon,
        gamesLost: entry.data.gamesLost,
        pointsFor: entry.data.pointsFavour,
        pointsAgainst: entry.data.pointsAgainst,
        pointsDifference: entry.data.pointsFavour - entry.data.pointsAgainst,
        winPercentage: entry.data.gamesPlayed
            ? Math.round((entry.data.gamesWon / entry.data.gamesPlayed) * 100) + '%'
            : '0%',
        qualified: entry.data.qualified,
        club: entry.club,
    }));
    cache[key] = standings;
    await writeCache(STANDINGS_FILE, cache);
    return standings;
}

const init = async () => {
    try {
        await initRosters();
        await initClubs();
        await initStats();
        await initSchedule();

    } catch (err) {
        console.error('Error fetching teams:', err.message);
        return null;
    }
};

module.exports = { init, getRosters, getPlayerStats, getSchedule, getBoxScore, getStandings };
