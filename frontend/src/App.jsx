import { useState, useEffect } from 'react'
import GamesView from './components/GamesView'
import GameStats from './components/GameStats'
import RostersView from './components/RostersView'
import PlayerStats from './components/PlayerStats'
import NBAStatisticsView from './components/NBAStatisticsView'
import ScheduleView from './components/ScheduleView'
import BoxScore from './components/BoxScore'
import NextGameday from './components/NextGameday'
import StandingsView from './components/StandingsView'
import './App.css'

const SPORTS = [
  { key: 'BASKETBALL', label: 'Basketball' },
  { key: 'FOOTBALL', label: 'Football' },
]

// Views: 'leagues' -> 'games' -> 'gameStats'
function App() {
  const [sport, setSport] = useState('BASKETBALL')
  const [leagues, setLeagues] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Navigation state
  const [view, setView] = useState('leagues')
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState(null)
  const [selectedPlayerCode, setSelectedPlayerCode] = useState(null)
  const [selectedEuroleagueGame, setSelectedEuroleagueGame] = useState(null)
  const [elBoxScoreSource, setElBoxScoreSource] = useState('euroleagueGames')

  // NBA state
  const [selectedNBAGame, setSelectedNBAGame] = useState(null)
  const [selectedNBAPlayer, setSelectedNBAPlayer] = useState(null)
  const [nbaBoxScoreSource, setNBABoxScoreSource] = useState('nbaGames')

  useEffect(() => {
    setLoading(true)
    setError(null)
    setView('leagues')
    setSelectedLeague(null)
    setSelectedGame(null)
    setSeasons([])
    setSelectedSeason(null)

    fetch(`/api/leagues?sport=${sport}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch leagues')
        return res.json()
      })
      .then(data => {
        setLeagues(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLeagues([])
        setLoading(false)
      })
  }, [sport])

  const handleLeagueClick = (league) => {
    setSelectedLeague(league)

    if (league.name === 'Euroleague') {
      setView('euroleagueMenu')
      return
    }

    if (league.name === 'NBA') {
      setView('nbaMenu')
      return
    }

    // Fetch seasons for this league
    fetch(`/api/seasons?league=${encodeURIComponent(league.name)}&sport=${sport}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const sorted = data.sort((a, b) => b.season - a.season)
        setSeasons(sorted)
        const currentYear = new Date().getFullYear()
        const current = sorted.find(s => s.season === currentYear) || sorted[0] || null
        setSelectedSeason(current)
      })
      .catch(() => {
        setSeasons([])
        setSelectedSeason(null)
      })

    setView('games')
  }

  const handleGameClick = (game) => {
    setSelectedGame(game)
    fetch(`/api/euroleague/boxscore/${encodeURIComponent(game.gamecode)}`)
      .then(res => res.ok ? res.json() : [])
      .then(res => console.log(res))
    setView('gameStats')
  }

  const handleBackToLeagues = () => {
    setView('leagues')
    setSelectedLeague(null)
    setSelectedGame(null)
    setSeasons([])
    setSelectedSeason(null)
  }

  const handleBackToGames = () => {
    setView('games')
    setSelectedGame(null)
  }

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={handleBackToLeagues} style={{ cursor: 'pointer' }}>Score Tracker</h1>
        <nav className="sport-tabs">
          {SPORTS.map(s => (
            <button
              key={s.key}
              className={`tab ${sport === s.key ? 'active' : ''}`}
              onClick={() => setSport(s.key)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {error && <div className="error">{error}</div>}

        {view === 'leagues' && (
          <section className="leagues">
            <h2>Leagues</h2>
            {loading && <div className="loading">Loading...</div>}
            {leagues.length === 0 && !loading && (
              <p className="empty">No leagues found for this sport.</p>
            )}
            <div className="league-grid">
              {leagues.map(league => (
                <div
                  key={league.id}
                  className="league-card"
                  onClick={() => handleLeagueClick(league)}
                >
                  <img src={league.logo} alt={league.name} className="league-logo" />
                  <div className="league-info">
                    <h3>{league.name}</h3>
                    <span className="league-type">{league.type}</span>
                    {league.country && (
                      <span className="league-country">
                        {league.country.flag && (
                          <img src={league.country.flag} alt="" className="country-flag" />
                        )}
                        {league.country.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'games' && selectedLeague && (
          <GamesView
            league={selectedLeague}
            sport={sport}
            seasons={seasons}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
            onGameClick={handleGameClick}
            onBack={handleBackToLeagues}
          />
        )}

        {/* ── Euroleague ── */}

        {view === 'euroleagueMenu' && (
          <section className="euroleague-menu">
            <button className="back-btn" onClick={handleBackToLeagues}>Back to Leagues</button>
            <h2>Euroleague</h2>
            <div className="menu-grid">
              {['Games', 'Standings', 'Rosters'].map(option => (
                <div
                  key={option}
                  className="menu-card"
                  onClick={() => setView(`euroleague${option}`)}
                >
                  <h3>{option}</h3>
                </div>
              ))}
            </div>
            <NextGameday
              onGameClick={(game) => {
                setSelectedEuroleagueGame(game)
                setElBoxScoreSource('euroleagueMenu')
                setView('euroleagueBoxScore')
              }}
              onViewAll={() => setView('euroleagueGames')}
            />
          </section>
        )}

        {view === 'euroleagueRosters' && (
          <RostersView
            onBack={() => setView('euroleagueMenu')}
            onPlayerClick={(code) => {
              setSelectedPlayerCode(code)
              setView('euroleaguePlayerStats')
            }}
          />
        )}

        {view === 'euroleaguePlayerStats' && selectedPlayerCode && (
          <PlayerStats
            playerCode={selectedPlayerCode}
            onBack={() => {
              setSelectedPlayerCode(null)
              setView('euroleagueRosters')
            }}
          />
        )}

        {view === 'euroleagueGames' && (
          <ScheduleView
            onBack={() => setView('euroleagueMenu')}
            onGameClick={(game) => {
              setSelectedEuroleagueGame(game)
              setElBoxScoreSource('euroleagueGames')
              setView('euroleagueBoxScore')
            }}
          />
        )}

        {view === 'euroleagueBoxScore' && selectedEuroleagueGame && (
          <BoxScore
            game={selectedEuroleagueGame}
            onBack={() => {
              setSelectedEuroleagueGame(null)
              setView(elBoxScoreSource)
            }}
          />
        )}

        {view === 'euroleagueStandings' && (
          <StandingsView onBack={() => setView('euroleagueMenu')} />
        )}

        {view === 'euroleagueStatistics' && (
          <PlayerStats onBack={() => setView('euroleagueMenu')} />
        )}

        {/* ── NBA ── */}

        {view === 'nbaMenu' && (
          <section className="euroleague-menu">
            <button className="back-btn" onClick={handleBackToLeagues}>Back to Leagues</button>
            <h2>NBA</h2>
            <div className="menu-grid">
              {['Games', 'Standings', 'Rosters'].map(option => (
                <div
                  key={option}
                  className="menu-card"
                  onClick={() => setView(`nba${option}`)}
                >
                  <h3>{option}</h3>
                </div>
              ))}
            </div>
            <NextGameday
              apiBase="/api/nba"
              onGameClick={(game) => {
                setSelectedNBAGame(game)
                setNBABoxScoreSource('nbaMenu')
                setView('nbaBoxScore')
              }}
              onViewAll={() => setView('nbaGames')}
            />
          </section>
        )}

        {view === 'nbaGames' && (
          <ScheduleView
            apiBase="/api/nba"
            onBack={() => setView('nbaMenu')}
            onGameClick={(game) => {
              setSelectedNBAGame(game)
              setNBABoxScoreSource('nbaGames')
              setView('nbaBoxScore')
            }}
          />
        )}

        {view === 'nbaBoxScore' && selectedNBAGame && (
          <BoxScore
            game={selectedNBAGame}
            apiBase="/api/nba"
            onBack={() => {
              setSelectedNBAGame(null)
              setView(nbaBoxScoreSource)
            }}
          />
        )}

        {view === 'nbaStandings' && (
          <StandingsView
            apiBase="/api/nba"
            onBack={() => setView('nbaMenu')}
          />
        )}

        {view === 'nbaRosters' && (
          <RostersView
            apiBase="/api/nba"
            onBack={() => setView('nbaMenu')}
            onPlayerClick={(playerId) => {
              setSelectedNBAPlayer(playerId)
              setView('nbaPlayerStats')
            }}
          />
        )}

        {view === 'nbaPlayerStats' && selectedNBAPlayer != null && (
          <NBAStatisticsView
            playerId={selectedNBAPlayer}
            onBack={() => {
              setSelectedNBAPlayer(null)
              setView('nbaRosters')
            }}
          />
        )}

        {view === 'nbaStatistics' && (
          <NBAStatisticsView onBack={() => setView('nbaMenu')} />
        )}

        {view === 'gameStats' && selectedGame && (
          <GameStats
            game={selectedGame}
            sport={sport}
            onBack={handleBackToGames}
          />
        )}
      </main>
    </div>
  )
}

export default App
