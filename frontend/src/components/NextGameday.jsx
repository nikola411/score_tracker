import { useState, useEffect } from 'react'
import './NextGameday.css'

function NextGameday({ onGameClick, onViewAll }) {
  const [round, setRound] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/euroleague/schedule')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const next = data.find(r => {
          const future = r.games.filter(g => new Date(g.date) >= today).length
          return future > r.games.length / 2
        }) || data[data.length - 1]
        setRound(next || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="ng-loading">Loading gameday...</div>
  if (!round) return null

  const hasUnplayed = round.games.some(g => !g.played)

  return (
    <div className="ng-wrap">
      <div className="ng-header">
        <span className="ng-label">{hasUnplayed ? 'Next Gameday' : 'Latest Results'}</span>
        <span className="ng-round">Round {round.gameday}</span>
        <button className="ng-all-btn" onClick={onViewAll}>Full Schedule →</button>
      </div>
      <div className="ng-games">
        {round.games.map((g, i) => (
          <div
            key={i}
            className={`ng-game ${g.played ? 'ng-played' : 'ng-upcoming'}`}
            onClick={() => g.played && onGameClick(g)}
          >
            <div className="ng-date">{g.date} · {g.startime}</div>
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
