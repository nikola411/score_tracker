import { useState, useEffect } from 'react'
import './PlayerStats.css'

function PlayerStats({ playerCode, onBack }) {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/euroleague/player-stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch player stats')
        return res.json()
      })
      .then(data => {
        const found = data.players?.find(p => p.player.code === playerCode)
        setPlayer(found || null)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [playerCode])

  const fmt = (v) => v == null ? '-' : typeof v === 'number' ? v.toFixed(1) : v

  const formatName = (name) => {
    const parts = name.split(', ')
    if (parts.length === 2) return `${parts[1]} ${parts[0]}`
    return name
  }

  if (loading) return <div className="player-stats"><div className="loading">Loading player stats...</div></div>
  if (error) return <div className="player-stats"><div className="error">{error}</div></div>
  if (!player) return (
    <div className="player-stats">
      <button className="back-btn" onClick={onBack}>&larr; Back to Rosters</button>
      <p className="empty">No stats available for this player.</p>
    </div>
  )

  const p = player

  return (
    <div className="player-stats">
      <button className="back-btn" onClick={onBack}>&larr; Back to Rosters</button>

      <div className="ps-profile">
        <img src={p.player.imageUrl} alt={p.player.name} className="ps-avatar" />
        <div className="ps-bio">
          <div className="ps-name">{formatName(p.player.name)}</div>
          <div className="ps-team-row">
            <img src={p.player.team.imageUrl} alt="" className="ps-team-logo" />
            <span className="ps-team-name">{p.player.team.name}</span>
          </div>
          <div className="ps-meta">
            Age {p.player.age} &middot; Rank #{p.playerRanking}
          </div>
        </div>
      </div>

      <div className="ps-overview">
        <div className="ps-overview-item">
          <span className="ps-overview-value">{p.gamesPlayed}</span>
          <span className="ps-overview-label">GP</span>
        </div>
        <div className="ps-overview-item">
          <span className="ps-overview-value">{p.gamesStarted}</span>
          <span className="ps-overview-label">GS</span>
        </div>
        <div className="ps-overview-item">
          <span className="ps-overview-value">{fmt(p.minutesPlayed)}</span>
          <span className="ps-overview-label">MPG</span>
        </div>
        <div className="ps-overview-item">
          <span className="ps-overview-value">{fmt(p.pointsScored)}</span>
          <span className="ps-overview-label">PPG</span>
        </div>
        <div className="ps-overview-item">
          <span className="ps-overview-value">{fmt(p.pir)}</span>
          <span className="ps-overview-label">PIR</span>
        </div>
      </div>

      <div className="ps-stats-grid">
        <div className="ps-stat-group">
          <h4>Scoring</h4>
          <div className="ps-stat-items">
            <div className="ps-stat"><span className="ps-stat-label">2PT</span><span className="ps-stat-value">{fmt(p.twoPointersMade)}/{fmt(p.twoPointersAttempted)} ({p.twoPointersPercentage})</span></div>
            <div className="ps-stat"><span className="ps-stat-label">3PT</span><span className="ps-stat-value">{fmt(p.threePointersMade)}/{fmt(p.threePointersAttempted)} ({p.threePointersPercentage})</span></div>
            <div className="ps-stat"><span className="ps-stat-label">FT</span><span className="ps-stat-value">{fmt(p.freeThrowsMade)}/{fmt(p.freeThrowsAttempted)} ({p.freeThrowsPercentage})</span></div>
          </div>
        </div>

        <div className="ps-stat-group">
          <h4>Rebounds</h4>
          <div className="ps-stat-items">
            <div className="ps-stat"><span className="ps-stat-label">OFF</span><span className="ps-stat-value">{fmt(p.offensiveRebounds)}</span></div>
            <div className="ps-stat"><span className="ps-stat-label">DEF</span><span className="ps-stat-value">{fmt(p.defensiveRebounds)}</span></div>
            <div className="ps-stat"><span className="ps-stat-label">TOT</span><span className="ps-stat-value">{fmt(p.totalRebounds)}</span></div>
          </div>
        </div>

        <div className="ps-stat-group">
          <h4>Other</h4>
          <div className="ps-stat-items">
            <div className="ps-stat"><span className="ps-stat-label">AST</span><span className="ps-stat-value">{fmt(p.assists)}</span></div>
            <div className="ps-stat"><span className="ps-stat-label">STL</span><span className="ps-stat-value">{fmt(p.steals)}</span></div>
            <div className="ps-stat"><span className="ps-stat-label">BLK</span><span className="ps-stat-value">{fmt(p.blocks)}</span></div>
            <div className="ps-stat"><span className="ps-stat-label">TO</span><span className="ps-stat-value">{fmt(p.turnovers)}</span></div>
            <div className="ps-stat"><span className="ps-stat-label">PF</span><span className="ps-stat-value">{fmt(p.foulsCommited)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerStats
