import { useState, useEffect } from 'react'
import './GamesView.css'

function GamesView({ league, sport, seasons, selectedSeason, onSeasonChange, onGameClick, onBack }) {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const seasonParam = selectedSeason ? `&season=${selectedSeason.season}` : ''
    fetch(`/api/leagues/${encodeURIComponent(league.name)}/games?sport=${sport}${seasonParam}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch games')
        return res.json()
      })
      .then(data => {
        setGames(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [league.name, sport, selectedSeason])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusClass = (status) => {
    if (!status) return ''
    const s = status.short || status
    if (s === 'FT' || s === 'AOT') return 'finished'
    if (s === 'LIVE' || s === 'Q1' || s === 'Q2' || s === 'Q3' || s === 'Q4' || s === 'HT') return 'live'
    return 'scheduled'
  }

  const getStatusLabel = (status) => {
    if (!status) return 'TBD'
    return status.long || status.short || status
  }

  // Group games by date
  const gamesByDate = games.reduce((acc, game) => {
    const date = game.date ? game.date.split('T')[0] : 'Unknown'
    if (!acc[date]) acc[date] = []
    acc[date].push(game)
    return acc
  }, {})

  const sortedDates = Object.keys(gamesByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="games-view">
      <div className="games-header">
        <button className="back-btn" onClick={onBack}>&larr; Back</button>
        <div className="games-title">
          <img src={league.logo} alt={league.name} className="games-league-logo" />
          <h2>{league.name} Games</h2>
        </div>
        {seasons.length > 0 && (
          <select
            className="season-picker"
            value={selectedSeason?.season || ''}
            onChange={(e) => {
              const s = seasons.find(s => String(s.season) === e.target.value)
              if (s) onSeasonChange(s)
            }}
          >
            {seasons.map(s => (
              <option key={s.season} value={s.season}>
                {s.season}{s.season === new Date().getFullYear() ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading games...</div>}

      {!loading && games.length === 0 && (
        <div className="empty-state">
          <p>No games found for this league.</p>
          <p className="empty-hint">Games data may not be cached yet. Fetch it via your backend API.</p>
        </div>
      )}

      {sortedDates.map(date => (
        <div key={date} className="date-group">
          <h3 className="date-label">{formatDate(date)}</h3>
          <div className="games-list">
            {gamesByDate[date].map(game => (
              <div
                key={game.id}
                className="game-card"
                onClick={() => onGameClick(game)}
              >
                <div className={`game-status ${getStatusClass(game.status)}`}>
                  {getStatusLabel(game.status)}
                </div>
                <div className="game-matchup">
                  <div className="team home">
                    {game.teams?.home?.logo && (
                      <img src={game.teams.home.logo} alt="" className="team-logo" />
                    )}
                    <span className="team-name">{game.teams?.home?.name || 'Home'}</span>
                    <span className="team-score">
                      {game.scores?.home?.total ?? game.scores?.home ?? '-'}
                    </span>
                  </div>
                  <div className="team away">
                    {game.teams?.away?.logo && (
                      <img src={game.teams.away.logo} alt="" className="team-logo" />
                    )}
                    <span className="team-name">{game.teams?.away?.name || 'Away'}</span>
                    <span className="team-score">
                      {game.scores?.away?.total ?? game.scores?.away ?? '-'}
                    </span>
                  </div>
                </div>
                <div className="game-time">{formatTime(game.date)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default GamesView
