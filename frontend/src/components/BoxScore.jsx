import { useState, useEffect } from 'react'
import './BoxScore.css'

function formatMin(seconds) {
  if (!seconds && seconds !== 0) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function pct(made, att) {
  if (!att) return '-'
  return Math.round((made / att) * 100) + '%'
}

function TeamTable({ teamData }) {
  if (!teamData?.players?.length) return null
  return (
    <div className="bs-team-section">
      <div className="bs-team-header">
        {teamData.club?.images?.crest && (
          <img src={teamData.club.images.crest} alt="" className="bs-table-logo" />
        )}
        <span className="bs-team-title">{teamData.club?.name}</span>
        {teamData.coach && (
          <span className="bs-coach">Coach: {teamData.coach.name}</span>
        )}
      </div>
      <div className="bs-table-wrap">
        <table className="bs-table">
          <thead>
            <tr>
              <th>#</th>
              <th className="bs-name-col">Player</th>
              <th>MIN</th>
              <th>PTS</th>
              <th>2PT</th>
              <th>3PT</th>
              <th>FT</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>TO</th>
              <th>BLK</th>
              <th>PIR</th>
            </tr>
          </thead>
          <tbody>
            {teamData.players.map((entry, i) => {
              const p = entry.player
              const s = entry.stats
              return (
                <tr key={i}>
                  <td>{p.dorsal}</td>
                  <td className="bs-name-col">
                    <div className="bs-player-cell">
                      {p.images?.headshot && (
                        <img src={p.images.headshot} alt="" className="bs-headshot" />
                      )}
                      <div>
                        <div className="bs-player-name">{p.person?.name}</div>
                        <div className="bs-position">{p.positionName}</div>
                      </div>
                    </div>
                  </td>
                  <td>{formatMin(s.timePlayed)}</td>
                  <td className="bs-pts-cell">{s.points}</td>
                  <td>{s.fieldGoalsMade2}/{s.fieldGoalsAttempted2} <span className="bs-pct">{pct(s.fieldGoalsMade2, s.fieldGoalsAttempted2)}</span></td>
                  <td>{s.fieldGoalsMade3}/{s.fieldGoalsAttempted3} <span className="bs-pct">{pct(s.fieldGoalsMade3, s.fieldGoalsAttempted3)}</span></td>
                  <td>{s.freeThrowsMade}/{s.freeThrowsAttempted} <span className="bs-pct">{pct(s.freeThrowsMade, s.freeThrowsAttempted)}</span></td>
                  <td>{s.totalRebounds}</td>
                  <td>{s.assistances}</td>
                  <td>{s.steals}</td>
                  <td>{s.turnovers}</td>
                  <td>{s.blocksFavour}</td>
                  <td className={s.valuation >= 0 ? 'bs-pir-pos' : 'bs-pir-neg'}>{s.valuation}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BoxScore({ game, onBack }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/euroleague/boxscore/${game.gamecode}`)
      .then(res => {
        if (!res.ok) throw new Error('Box score not available')
        return res.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [game.gamecode])

  return (
    <div className="box-score">
      <button className="back-btn" onClick={onBack}>&larr; Back to Schedule</button>

      <div className="bs-header">
        <div className="bs-team">
          {game.homeLogo && <img src={game.homeLogo} alt="" className="bs-logo" />}
          <span className="bs-team-name">{game.hometeam}</span>
        </div>
        <div className="bs-final">
          <span className="bs-pts">{game.homescore}</span>
          <span className="bs-divider">-</span>
          <span className="bs-pts">{game.awayscore}</span>
        </div>
        <div className="bs-team">
          {game.awayLogo && <img src={game.awayLogo} alt="" className="bs-logo" />}
          <span className="bs-team-name">{game.awayteam}</span>
        </div>
      </div>
      <div className="bs-meta">{game.date} &middot; {game.arenaname}</div>

      {loading && <div className="loading">Loading box score...</div>}
      {error && <p className="empty">{error}</p>}
      {data && (
        <div className="bs-tables">
          <TeamTable teamData={data.local} />
          <TeamTable teamData={data.road} />
        </div>
      )}
    </div>
  )
}

export default BoxScore
