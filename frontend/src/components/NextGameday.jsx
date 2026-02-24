import { useState, useEffect } from 'react'
import './NextGameday.css'

function NextGameday({ onGameClick, onViewAll, apiBase = '/api/euroleague' }) {
  const [round, setRound] = useState(null)
  const [loading, setLoading] = useState(true)

  const isNBA = apiBase.includes('nba')

  useEffect(() => {
    fetch(`${apiBase}/schedule`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const idx = data.findIndex(r => {
          const future = r.games.filter(g => new Date(g.date) >= today).length
          return future > r.games.length / 2
        })
        let next
        if (idx === -1) {
          next = data[data.length - 1]
        } else if (idx > 0 && !data[idx].games.some(g => g.played)) {
          // Next round hasn't started yet — show the previous (latest results) instead
          next = data[idx - 1]
        } else {
          next = data[idx]
        }
        setRound(next || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [apiBase])

  if (loading) return <div className="ng-loading">Loading gameday...</div>
  if (!round) return null

  const hasUnplayed = round.games.some(g => !g.played)

  const formatRoundLabel = () => {
    if (!isNBA) return `Round ${round.gameday}`
    const d = new Date(round.gameday + 'T12:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="ng-wrap">
      <div className="ng-header">
        <span className="ng-label">{hasUnplayed ? 'Next Gameday' : 'Latest Results'}</span>
        <span className="ng-round">{formatRoundLabel()}</span>
        <button className="ng-all-btn" onClick={onViewAll}>Full Schedule →</button>
      </div>
      <div className="ng-games">
        {round.games.map((g, i) => (
          <div
            key={i}
            className={`ng-game ${g.played ? 'ng-played' : 'ng-upcoming'}`}
            onClick={() => g.played && onGameClick(g)}
          >
            <div className="ng-date">
            {isNBA
              ? new Date(g.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              : `${g.date} · ${g.startime}`
            }
          </div>
            <div className="ng-matchup">
              <div className="ng-team ng-home">
                <span className="ng-team-name">{g.hometeam}</span>
                {g.homeLogo && <img src={g.homeLogo} alt="" className="ng-logo" />}
              </div>
              <div className="ng-score">
                {g.played && g.homescore != null
                  ? <><span className="ng-pts">{g.homescore}</span><span className="ng-div">–</span><span className="ng-pts">{g.awayscore}</span></>
                  : <span className="ng-vs">vs</span>
                }
              </div>
              <div className="ng-team ng-away">
                {g.awayLogo && <img src={g.awayLogo} alt="" className="ng-logo" />}
                <span className="ng-team-name">{g.awayteam}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NextGameday
