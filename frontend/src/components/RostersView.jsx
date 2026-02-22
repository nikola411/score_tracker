import { useState, useEffect } from 'react'

function RostersView({ onBack, onPlayerClick }) {
  const [rosters, setRosters] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTeam, setExpandedTeam] = useState(null)

  useEffect(() => {
    fetch('/api/euroleague/rosters')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setRosters(data)
        setLoading(false)
      })
      .catch(() => {
        setRosters([])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <button className="back-btn" onClick={onBack}>Back to Leagues</button>
      <h2>Euroleague Rosters</h2>

      {loading && <div className="loading">Loading rosters...</div>}

      <div className="rosters-list">
        {rosters.map((team, i) => (
          <div key={i} className="roster-card">
            <div
              className="roster-header"
              onClick={() => setExpandedTeam(expandedTeam === i ? null : i)}
            >
              <h3>{team.name}</h3>
              <span className="roster-count">{team.roster?.length || 0} players</span>
              <span className="roster-toggle">{expandedTeam === i ? '▲' : '▼'}</span>
            </div>

            {expandedTeam === i && team.roster && (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Country</th>
                  </tr>
                </thead>
                <tbody>
                  {team.roster.map((player, j) => (
                    <tr key={j}>
                      <td>{player['@_dorsal'] || '-'}</td>
                      <td>
                        <span
                          className="player-link"
                          onClick={() => onPlayerClick(player['@_code'])}
                        >
                          {player['@_name'] || '-'}
                        </span>
                      </td>
                      <td>{player['@_position'] || '-'}</td>
                      <td>{player['@_countryname'] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default RostersView
