import { useState, useEffect } from 'react'
import './ScheduleView.css'

function LiveView({ onBack, onGameClick }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLive = () => {
    setLoading(true)
    setError(null)
    fetch('/api/euroleague/live')
      .then(res => res.json().then(body => ({ ok: res.ok, body })))
      .then(({ ok, body }) => {
        if (!ok) throw new Error(body?.error || 'Live data not available')
        setData(body)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }

  useEffect(() => { fetchLive() }, [])

  return (
    <div className="schedule-view">
      <button className="back-btn" onClick={onBack}>&larr; Back to Menu</button>
      <h2>Euroleague Live</h2>

      {loading && <div className="loading">Fetching live data...</div>}
      {error && <div className="error">{error}</div>}

      {data && (
        <div className="sv-live-container">
          <div className="sv-live-header">
            <span className="sv-live-round-label">Round {data.gameday}</span>
            <button className="sv-refresh-btn" onClick={fetchLive} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <div className="sv-games">
            {data.games.map((g, i) => (
              <div
                key={i}
                className={`sv-game ${g.hasStarted ? 'clickable' : 'upcoming'}`}
                onClick={() => g.hasStarted && onGameClick(g)}
              >
                <div className="sv-date">
                  {g.date} · {g.startime}
                  {g.isLive && <span className="sv-live-badge">LIVE</span>}
                  {g.played && <span className="sv-ft-badge">FT</span>}
                </div>
                <div className="sv-matchup">
                  <div className="sv-team sv-home">
                    <span className="sv-team-name">{g.hometeam}</span>
                    {g.homeLogo && <img src={g.homeLogo} alt="" className="sv-team-logo" />}
                  </div>
                  <div className="sv-score">
                    {g.hasStarted && g.homescore != null
                      ? <><span className="sv-pts">{g.homescore}</span><span className="sv-divider">-</span><span className="sv-pts">{g.awayscore}</span></>
                      : <span className="sv-vs-text">vs</span>
                    }
                  </div>
                  <div className="sv-team sv-away">
                    {g.awayLogo && <img src={g.awayLogo} alt="" className="sv-team-logo" />}
                    <span className="sv-team-name">{g.awayteam}</span>
                  </div>
                </div>
                <div className="sv-venue">{g.arenaname}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveView
