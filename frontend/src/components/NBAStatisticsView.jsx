import { useState, useEffect } from 'react'
import './PlayerStats.css'

const COLS = [
  { key: 'PLAYER_NAME', label: 'Player', numeric: false },
  { key: 'TEAM_ABBREVIATION', label: 'Team', numeric: false },
  { key: 'GP', label: 'GP', numeric: true },
  { key: 'MIN', label: 'MIN', numeric: true },
  { key: 'PTS', label: 'PTS', numeric: true },
  { key: 'REB', label: 'REB', numeric: true },
  { key: 'AST', label: 'AST', numeric: true },
  { key: 'STL', label: 'STL', numeric: true },
  { key: 'BLK', label: 'BLK', numeric: true },
  { key: 'TOV', label: 'TO', numeric: true },
  { key: 'FG_PCT', label: 'FG%', numeric: true },
  { key: 'FG3_PCT', label: '3P%', numeric: true },
  { key: 'FT_PCT', label: 'FT%', numeric: true },
  { key: 'PLUS_MINUS', label: '+/-', numeric: true },
]

function NBAStatisticsView({ onBack, playerId = null }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortCol, setSortCol] = useState('PTS')
  const [sortAsc, setSortAsc] = useState(false)

  useEffect(() => {
    fetch('/api/nba/player-stats')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch player stats')
        return res.json()
      })
      .then(data => {
        setPlayers(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const handleSort = (col) => {
    if (sortCol === col) setSortAsc(a => !a)
    else { setSortCol(col); setSortAsc(false) }
  }

  const fmt = (v) => v == null ? '-' : typeof v === 'number' ? v.toFixed(1) : v
  const fmtPct = (v) => v == null ? '-' : (v * 100).toFixed(1) + '%'

  let rows = [...players]
  if (playerId != null) rows = rows.filter(p => p.PLAYER_ID === playerId)

  rows.sort((a, b) => {
    const av = a[sortCol] ?? 0
    const bv = b[sortCol] ?? 0
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortAsc ? cmp : -cmp
  })

  if (loading) return <div className="player-stats"><div className="loading">Loading stats...</div></div>
  if (error) return <div className="player-stats"><div className="error">{error}</div></div>

  // Single player view (drilldown from Rosters)
  if (playerId != null) {
    const p = rows[0]
    if (!p) return (
      <div className="player-stats">
        <button className="back-btn" onClick={onBack}>&larr; Back to Rosters</button>
        <p className="empty">No stats available for this player.</p>
      </div>
    )
    return (
      <div className="player-stats">
        <button className="back-btn" onClick={onBack}>&larr; Back to Rosters</button>
        <div className="ps-profile">
          <img
            src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${p.PLAYER_ID}.png`}
            alt={p.PLAYER_NAME}
            className="ps-avatar"
            onError={e => { e.target.style.display = 'none' }}
          />
          <div className="ps-bio">
            <div className="ps-name">{p.PLAYER_NAME}</div>
            <div className="ps-team-row">
              <img
                src={`https://cdn.nba.com/logos/nba/${p.TEAM_ID}/primary/L/logo.svg`}
                alt=""
                className="ps-team-logo"
              />
              <span className="ps-team-name">{p.TEAM_ABBREVIATION}</span>
            </div>
            <div className="ps-meta">Age {p.AGE} &middot; {p.GP} games</div>
          </div>
        </div>

        <div className="ps-overview">
          {[['PTS', 'PPG'], ['REB', 'RPG'], ['AST', 'APG'], ['STL', 'SPG'], ['BLK', 'BPG']].map(([k, lbl]) => (
            <div key={k} className="ps-overview-item">
              <span className="ps-overview-value">{fmt(p[k])}</span>
              <span className="ps-overview-label">{lbl}</span>
            </div>
          ))}
        </div>

        <div className="ps-stats-grid">
          <div className="ps-stat-group">
            <h4>Scoring</h4>
            <div className="ps-stat-items">
              <div className="ps-stat"><span className="ps-stat-label">FG</span><span className="ps-stat-value">{fmt(p.FGM)}/{fmt(p.FGA)} ({fmtPct(p.FG_PCT)})</span></div>
              <div className="ps-stat"><span className="ps-stat-label">3PT</span><span className="ps-stat-value">{fmt(p.FG3M)}/{fmt(p.FG3A)} ({fmtPct(p.FG3_PCT)})</span></div>
              <div className="ps-stat"><span className="ps-stat-label">FT</span><span className="ps-stat-value">{fmt(p.FTM)}/{fmt(p.FTA)} ({fmtPct(p.FT_PCT)})</span></div>
            </div>
          </div>
          <div className="ps-stat-group">
            <h4>Rebounds</h4>
            <div className="ps-stat-items">
              <div className="ps-stat"><span className="ps-stat-label">OFF</span><span className="ps-stat-value">{fmt(p.OREB)}</span></div>
              <div className="ps-stat"><span className="ps-stat-label">DEF</span><span className="ps-stat-value">{fmt(p.DREB)}</span></div>
              <div className="ps-stat"><span className="ps-stat-label">TOT</span><span className="ps-stat-value">{fmt(p.REB)}</span></div>
            </div>
          </div>
          <div className="ps-stat-group">
            <h4>Other</h4>
            <div className="ps-stat-items">
              <div className="ps-stat"><span className="ps-stat-label">AST</span><span className="ps-stat-value">{fmt(p.AST)}</span></div>
              <div className="ps-stat"><span className="ps-stat-label">STL</span><span className="ps-stat-value">{fmt(p.STL)}</span></div>
              <div className="ps-stat"><span className="ps-stat-label">BLK</span><span className="ps-stat-value">{fmt(p.BLK)}</span></div>
              <div className="ps-stat"><span className="ps-stat-label">TO</span><span className="ps-stat-value">{fmt(p.TOV)}</span></div>
              <div className="ps-stat"><span className="ps-stat-label">+/-</span><span className="ps-stat-value">{fmt(p.PLUS_MINUS)}</span></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // League-wide stats table
  return (
    <div className="player-stats">
      <button className="back-btn" onClick={onBack}>&larr; Back to Menu</button>
      <h2>NBA Statistics</h2>

      <div className="st-table-wrap">
        <table className="st-table">
          <thead>
            <tr>
              {COLS.map(c => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  {c.label}{sortCol === c.key ? (sortAsc ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={i}>
                <td>{p.PLAYER_NAME}</td>
                <td>{p.TEAM_ABBREVIATION}</td>
                <td>{p.GP}</td>
                <td>{fmt(p.MIN)}</td>
                <td>{fmt(p.PTS)}</td>
                <td>{fmt(p.REB)}</td>
                <td>{fmt(p.AST)}</td>
                <td>{fmt(p.STL)}</td>
                <td>{fmt(p.BLK)}</td>
                <td>{fmt(p.TOV)}</td>
                <td>{fmtPct(p.FG_PCT)}</td>
                <td>{fmtPct(p.FG3_PCT)}</td>
                <td>{fmtPct(p.FT_PCT)}</td>
                <td>{fmt(p.PLUS_MINUS)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default NBAStatisticsView
