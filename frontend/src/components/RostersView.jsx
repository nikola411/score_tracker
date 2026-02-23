import { useState, useEffect } from 'react'

function RostersView({ onBack, onPlayerClick, apiBase = '/api/euroleague' }) {
  const [rosters, setRosters] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTeam, setExpandedTeam] = useState(null)

  const isNBA = apiBase.includes('nba')

  useEffect(() => {
    fetch(`${apiBase}/rosters`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setRosters(data)
        setLoading(false)
      })
      .catch(() => {
        setRosters([])
        setLoading(false)
      })
  }, [apiBase])

  return (
    <div>
      <button className="back-btn" onClick={onBack}>Back to Menu</button>
      <h2>{isNBA ? 'NBA' : 'Euroleague'} Rosters</h2>

      {loading && <div className="loading">Loading rosters...</div>}

      <div className="rosters-list">
        {rosters.map((team, i) => (
          <div key={i} className="roster-card">
            <div
              className="roster-header"
              onClick={() => setExpandedTeam(expandedTeam === i ? null : i)}
            >
              {team.logo && <img src={team.logo} alt="" className="roster-logo" />}
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
                    {!isNBA && <th>Position</th>}
                    {!isNBA && <th>Country</th>}
                  </tr>
                </thead>
                <tbody>
                  {team.roster.map((player, j) => {
                    const dorsal = player['@_dorsal'] ?? '-'
                    const name = player['@_name'] || player.name || '-'
                    const code = player['@_code'] || player.playerId
                    return (
                      <tr key={j}>
                        <td>{dorsal}</td>
                        <td>
                          <span
                            className="player-link"
                            onClick={() => onPlayerClick(code)}
                          >
                            {name}
                          </span>
                        </td>
                        {!isNBA && <td>{player['@_position'] || '-'}</td>}
                        {!isNBA && <td>{player['@_countryname'] || '-'}</td>}
                      </tr>
                    )
                  })}
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
