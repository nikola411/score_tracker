import { useState } from 'react'
import GamesView from './components/GamesView'
import GameStats from './components/GameStats'
import RostersView from './components/RostersView'
import PlayerStats from './components/PlayerStats'
import NBAStatisticsView from './components/NBAStatisticsView'
import ScheduleView from './components/ScheduleView'
import BoxScore from './components/BoxScore'
import NextGameday from './components/NextGameday'
import StandingsView from './components/StandingsView'
import LiveView from './components/LiveView'
import './App.css'

function App() {
  const [view, setView] = useState('home')
  const [selectedGame, setSelectedGame] = useState(null)
  const [selectedPlayerCode, setSelectedPlayerCode] = useState(null)
  const [selectedEuroleagueGame, setSelectedEuroleagueGame] = useState(null)
  const [elBoxScoreSource, setElBoxScoreSource] = useState('euroleagueGames')

  // NBA state
  const [selectedNBAGame, setSelectedNBAGame] = useState(null)
  const [selectedNBAPlayer, setSelectedNBAPlayer] = useState(null)
  const [nbaBoxScoreSource, setNBABoxScoreSource] = useState('nbaGames')

  return (
    <div className="app">
      <header className="header">
        <h1 onClick={() => setView('home')} style={{ cursor: 'pointer' }}>Score Tracker</h1>
      </header>

      <main className="content">
        {view === 'home' && (
          <section className="leagues">
            <h2>Select a League</h2>
            <div className="league-grid">
              <div className="league-card" onClick={() => setView('euroleagueMenu')}>
                <div className="league-info">
                  <h3>Euroleague</h3>
                  <span className="league-type">Basketball</span>
                </div>
              </div>
              <div className="league-card" onClick={() => setView('nbaMenu')}>
                <div className="league-info">
                  <h3>NBA</h3>
                  <span className="league-type">Basketball</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Euroleague ── */}

        {view === 'euroleagueMenu' && (
          <section className="euroleague-menu">
            <button className="back-btn" onClick={() => setView('home')}>Back</button>
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
              <div
                className="menu-card menu-card-live"
                onClick={() => setView('euroleagueLive')}
              >
                <h3>Live</h3>
              </div>
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

        {view === 'euroleagueLive' && (
          <LiveView
            onBack={() => setView('euroleagueMenu')}
            onGameClick={(game) => {
              setSelectedEuroleagueGame(game)
              setElBoxScoreSource('euroleagueLive')
              setView('euroleagueBoxScore')
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
            <button className="back-btn" onClick={() => setView('home')}>Back</button>
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
      </main>
      <footer className="site-footer">
        This site is intended strictly for personal, non-commercial use. All sports data and trademarks belong to their respective owners.
      </footer>
    </div>
  )
}

export default App
