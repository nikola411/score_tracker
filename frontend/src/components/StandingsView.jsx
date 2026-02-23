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

function StandingsView({ onBack, apiBase = '/api/euroleague' }) {
  const [standings, setStandings] = useState([])
  const [round, setRound] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isNBA = apiBase.includes('nba')

  const fetchStandings = (r) => {
    setLoading(true)
    setError(null)
    const url = (!isNBA && r) ? `${apiBase}/standings?round=${r}` : `${apiBase}/standings`
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

  useEffect(() => { fetchStandings(null) }, [apiBase])

  const handleRoundChange = (e) => {
    const val = e.target.value === '' ? null : parseInt(e.target.value)
    setRound(val)
    fetchStandings(val)
  }

  const fmtWinPct = (v) => {
    if (v == null) return '-'
    if (typeof v === 'number') return (v * 100).toFixed(1) + '%'
    return v
  }

  return (
    <div className="standings-view">
      <div className="sv-topbar">
        <button className="back-btn" onClick={onBack}>&larr; Back to Menu</button>
        {!isNBA && (
          <div className="sv-round-select">
            <label>Round</label>
            <select value={round ?? ''} onChange={handleRoundChange}>
              <option value="">Latest</option>
              {Array.from({ length: 38 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <h2>{isNBA ? 'NBA' : 'Euroleague'} Standings</h2>

      {loading && <div className="loading">Loading standings...</div>}
      {error && <p className="empty">{error}</p>}

      {!loading && standings.length > 0 && (() => {
        const renderTable = (rows) => (
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
                  <th>{isNBA ? 'GB' : '+/-'}</th>
                  <th>Home</th>
                  <th>Away</th>
                  <th>L10</th>
                  {!isNBA && <th>Last 5</th>}
                  {isNBA && <th>Streak</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const logo = row.club?.images?.crest || row.logo
                  const name = row.club?.abbreviatedName || row.club?.name || row.name
                  const awayRec = row.awayRecord ?? row.roadRecord ?? '-'
                  const l10 = row.lastTenRecord ?? row.last10 ?? '-'
                  const diff = isNBA ? (row.gamesBehind ?? '-') : row.pointsDifference

                  return (
                    <tr key={i}>
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
                          {logo && <img src={logo} alt="" className="st-logo" />}
                          <span className="st-team-name">{name}</span>
                        </div>
                      </td>
                      <td>{row.gamesPlayed}</td>
                      <td className="st-w">{row.gamesWon}</td>
                      <td className="st-l">{row.gamesLost}</td>
                      <td>{fmtWinPct(row.winPercentage)}</td>
                      <td className={!isNBA && String(diff).startsWith('-') ? 'st-neg-diff' : 'st-pos-diff'}>
                        {diff}
                      </td>
                      <td>{row.homeRecord ?? '-'}</td>
                      <td>{awayRec}</td>
                      <td>{l10}</td>
                      {!isNBA && <td><Form results={row.last5Form} /></td>}
                      {isNBA && <td>{row.streak ?? '-'}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )

        if (!isNBA) return renderTable(standings)

        const east = standings.filter(r => r.conference === 'East').sort((a, b) => a.position - b.position)
        const west = standings.filter(r => r.conference === 'West').sort((a, b) => a.position - b.position)
        return (
          <>
            <h3 className="st-conf-title">Eastern Conference</h3>
            {renderTable(east)}
            <h3 className="st-conf-title">Western Conference</h3>
            {renderTable(west)}
          </>
        )
      })()}
    </div>
  )
}

export default StandingsView
