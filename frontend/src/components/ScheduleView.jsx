import { useState, useEffect } from 'react'
import './ScheduleView.css'

function ScheduleView({ onBack, onGameClick }) {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRound, setSelectedRound] = useState(null)

  useEffect(() => {
    fetch('/api/euroleague/schedule')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch schedule')
        return res.json()
      })
      .then(data => {
        setSchedule(data)
        const current = data.find(r =>
          r.games.some(g => !g.played)
        ) || data[data.length - 1]
        setSelectedRound(current?.gameday || 1)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const currentRound = schedule.find(r => r.gameday === selectedRound)

  return (
    <div className="schedule-view">
      <button className="back-btn" onClick={onBack}>&larr; Back to Menu</button>
      <h2>Euroleague Schedule</h2>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading schedule...</div>}

      {!loading && schedule.length > 0 && (
        <>
          <div className="sv-rounds">
            {schedule.map(r => (
              <button
                key={r.gameday}
                className={`sv-round-btn ${selectedRound === r.gameday ? 'active' : ''}`}
                onClick={() => setSelectedRound(r.gameday)}
              >
                {r.gameday}
              </button>
            ))}
          </div>

          {currentRound && (
            <div className="sv-games">
              {currentRound.games.map((g, i) => (
                <div
                  key={i}
                  className={`sv-game ${g.played ? 'played clickable' : 'upcoming'}`}
                  onClick={() => g.played && onGameClick(g)}
                >
                  <div className="sv-date">{g.date} &middot; {g.startime}</div>
                  <div className="sv-matchup">
                    <div className="sv-team sv-home">
                      <span className="sv-team-name">{g.hometeam}</span>
                      {g.homeLogo && <img src={g.homeLogo} alt="" className="sv-team-logo" />}
                    </div>
                    <div className="sv-score">
                      {g.played && g.homescore != null
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
          )}
        </>
      )}
    </div>
  )
}

export default ScheduleView
