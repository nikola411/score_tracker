import { useState, useEffect } from 'react'
import './StandingsView.css'

const CHANGE_ICON  = { Up: '↑', Down: '↓', Equal: '–' }
const CHANGE_CLASS = { Up: 'pos-up', Down: 'pos-down', Equal: 'pos-eq' }

function Form({ results }) {
  if (!results?.length) return null
  return (
    <div className="form-dots">
      {results.map((r, i) => (
        <span key={i} className={`form-dot ${r === 'W' ? 'form-w' : 'form-l'}`}>{r}</span>
      ))}
    </div>
  )
}

function StandingsView({ onBack }) {
  const [standings, setStandings] = useState([])
  const [round, setRound] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStandings = (r) => {
    setLoading(true)
    setError(null)
    const url = r ? `/api/euroleague/standings?round=${r}` : '/api/euroleague/standings'
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Standings not available')
        return res.json()
      })
      .then(data => {
        const rows = Array.isArray(data) ? data : (data.teams || [])
        setStandings(rows)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => { fetchStandings(null) }, [])

  const handleRoundChange = (e) => {
    const val = e.target.value === '' ? null : parseInt(e.target.value)
    setRound(val)
    fetchStandings(val)
  }

  return (
    <div className="standings-view">
      <div className="sv-topbar">
        <button className="back-btn" onClick={onBack}>&larr; Back to Menu</button>
        <div className="sv-round-select">
          <label>Round</label>
          <select value={round ?? ''} onChange={handleRoundChange}>
            <option value="">Latest</option>
            {Array.from({ length: 38 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <h2>Euroleague Standings</h2>

      {loading && <div className="loading">Loading standings...</div>}
      {error && <p className="empty">{error}</p>}

      {!loading && standings.length > 0 && (
        <div className="st-table-wrap">
          <table className="st-table">
            <thead>
              <tr>
                <th className="st-pos">#</th>
                <th className="st-team-col">Team</th>
                <th>GP</th>
                <th>W</th>
                <th>L</th>
                <th>Win%</th>
                <th>+/-</th>
                <th>Home</th>
                <th>Away</th>
                <th>L10</th>
                <th>Last 5</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.position}>
                  <td className="st-pos">
                    <span className="st-pos-num">{row.position}</span>
                    {row.positionChange && (
                      <span className={`st-change ${CHANGE_CLASS[row.positionChange] || 'pos-eq'}`}>
                        {CHANGE_ICON[row.positionChange] || '–'}
                      </span>
                    )}
                  </td>
                  <td className="st-team-col">
                    <div className="st-team-cell">
                      {row.club?.images?.crest && (
                        <img src={row.club.images.crest} alt="" className="st-logo" />
                      )}
                      <span className="st-team-name">{row.club?.abbreviatedName || row.club?.name}</span>
                    </div>
                  </td>
                  <td>{row.gamesPlayed}</td>
                  <td className="st-w">{row.gamesWon}</td>
                  <td className="st-l">{row.gamesLost}</td>
                  <td>{row.winPercentage}</td>
                  <td className={String(row.pointsDifference).startsWith('-') ? 'st-neg-diff' : 'st-pos-diff'}>
                    {row.pointsDifference}
                  </td>
                  <td>{row.homeRecord ?? '-'}</td>
                  <td>{row.awayRecord ?? '-'}</td>
                  <td>{row.lastTenRecord ?? '-'}</td>
                  <td><Form results={row.last5Form} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default StandingsView
