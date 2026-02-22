import { useState, useEffect } from 'react'
import './GameStats.css'

function GameStats({ game, sport, onBack }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch(`/api/games/${game.id}?sport=${sport}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch game details')
        return res.json()
      })
      .then(data => {
        setDetails(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [game.id, sport])

  const g = details || game

  const homeScore = g.scores?.home?.total ?? g.scores?.home ?? '-'
  const awayScore = g.scores?.away?.total ?? g.scores?.away ?? '-'

  // Extract quarter/half scores if available
  const getQuarterScores = (side) => {
    const s = g.scores?.[side]
    if (!s || typeof s !== 'object') return null
    const quarters = []
    if (s.quarter_1 != null) quarters.push({ label: 'Q1', val: s.quarter_1 })
    if (s.quarter_2 != null) quarters.push({ label: 'Q2', val: s.quarter_2 })
    if (s.quarter_3 != null) quarters.push({ label: 'Q3', val: s.quarter_3 })
    if (s.quarter_4 != null) quarters.push({ label: 'Q4', val: s.quarter_4 })
    if (s.over_time != null && s.over_time > 0) quarters.push({ label: 'OT', val: s.over_time })
    // Football halves
    if (s.halftime != null) quarters.push({ label: 'HT', val: s.halftime })
    if (s.fulltime != null) quarters.push({ label: 'FT', val: s.fulltime })
    if (s.extratime != null) quarters.push({ label: 'ET', val: s.extratime })
    if (s.penalty != null) quarters.push({ label: 'PEN', val: s.penalty })
    return quarters.length > 0 ? quarters : null
  }

  const homeQuarters = getQuarterScores('home')
  const awayQuarters = getQuarterScores('away')

  // Extract statistics if available
  const stats = g.statistics || []

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    })
  }

  return (
    <div className="game-stats">
      <button className="back-btn" onClick={onBack}>&larr; Back to games</button>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading game details...</div>}

      <div className="stats-scoreboard">
        <div className="stats-date">{formatDate(g.date)}</div>
        {g.league && (
          <div className="stats-league">
            {g.league.logo && <img src={g.league.logo} alt="" className="stats-league-logo" />}
            {g.league.name}
          </div>
        )}
        {g.country && <div className="stats-venue">{g.country.name}</div>}

        <div className="scoreboard">
          <div className="sb-team">
            {g.teams?.home?.logo && (
              <img src={g.teams.home.logo} alt="" className="sb-logo" />
            )}
            <span className="sb-name">{g.teams?.home?.name || 'Home'}</span>
          </div>
          <div className="sb-score">
            <span className="sb-points">{homeScore}</span>
            <span className="sb-divider">-</span>
            <span className="sb-points">{awayScore}</span>
          </div>
          <div className="sb-team">
            {g.teams?.away?.logo && (
              <img src={g.teams.away.logo} alt="" className="sb-logo" />
            )}
            <span className="sb-name">{g.teams?.away?.name || 'Away'}</span>
          </div>
        </div>

        {g.status && (
          <div className="stats-status">
            {g.status.long || g.status.short || g.status}
          </div>
        )}
      </div>

      {/* Quarter/Period breakdown */}
      {homeQuarters && awayQuarters && (
        <div className="stats-section">
          <h3>Score Breakdown</h3>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Team</th>
                {homeQuarters.map(q => <th key={q.label}>{q.label}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="breakdown-team">{g.teams?.home?.name}</td>
                {homeQuarters.map(q => <td key={q.label}>{q.val}</td>)}
                <td className="breakdown-total">{homeScore}</td>
              </tr>
              <tr>
                <td className="breakdown-team">{g.teams?.away?.name}</td>
                {awayQuarters.map(q => <td key={q.label}>{q.val}</td>)}
                <td className="breakdown-total">{awayScore}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Team statistics */}
      {stats.length > 0 && (
        <div className="stats-section">
          <h3>Team Statistics</h3>
          {stats.map((teamStat, idx) => (
            <div key={idx} className="team-stats-block">
              <h4>{teamStat.team?.name || `Team ${idx + 1}`}</h4>
              <div className="stat-grid">
                {teamStat.statistics?.map((stat, sIdx) => (
                  <div key={sIdx} className="stat-item">
                    <span className="stat-label">{stat.type}</span>
                    <span className="stat-value">{stat.value ?? '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !details && (
        <div className="stats-section">
          <p className="empty">Detailed stats not available. Game data may need to be fetched via the backend.</p>
        </div>
      )}
    </div>
  )
}

export default GameStats
