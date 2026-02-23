import { useState, useEffect, useRef } from 'react'
import './ScheduleView.css'

const CAL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const CAL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function MonthGrid({ schedule, selectedDate, onSelectDate }) {
  const initDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date()
  const [year, setYear] = useState(initDate.getFullYear())
  const [month, setMonth] = useState(initDate.getMonth())

  const gameDates = new Set(schedule.map(r => r.gameday))
  const todayStr = new Date().toISOString().split('T')[0]

  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const toDateStr = (d) => {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  return (
    <div className="cal-popup-inner">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <span className="cal-title">{CAL_MONTHS[month]} {year}</span>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>
      <div className="cal-grid">
        {CAL_DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell empty" />
          const dateStr = toDateStr(d)
          const hasGames = gameDates.has(dateStr)
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr
          return (
            <div
              key={i}
              className={[
                'cal-cell',
                hasGames ? 'has-games' : '',
                isSelected ? 'selected' : '',
                isToday ? 'today' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => hasGames && onSelectDate(dateStr)}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CalendarPicker({ schedule, selectedDate, onSelectDate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const sortedDates = schedule.map(r => r.gameday).sort()
  const idx = sortedDates.indexOf(selectedDate)
  const prevDate = idx > 0 ? sortedDates[idx - 1] : null
  const nextDate = idx < sortedDates.length - 1 ? sortedDates[idx + 1] : null

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Close popup when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="cal-compact" ref={ref}>
      <div className="cal-compact-row">
        <button
          className="cal-arr"
          onClick={() => prevDate && onSelectDate(prevDate)}
          disabled={!prevDate}
        >‹</button>

        <button className="cal-date-btn" onClick={() => setOpen(o => !o)}>
          <span className="cal-date-text">{formatDate(selectedDate)}</span>
          <span className="cal-date-icon">▾</span>
        </button>

        <button
          className="cal-arr"
          onClick={() => nextDate && onSelectDate(nextDate)}
          disabled={!nextDate}
        >›</button>
      </div>

      {open && (
        <div className="cal-popup">
          <MonthGrid
            schedule={schedule}
            selectedDate={selectedDate}
            onSelectDate={(d) => { onSelectDate(d); setOpen(false) }}
          />
        </div>
      )}
    </div>
  )
}

function ScheduleView({ onBack, onGameClick, apiBase = '/api/euroleague' }) {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRound, setSelectedRound] = useState(null)

  const isNBA = apiBase.includes('nba')

  useEffect(() => {
    fetch(`${apiBase}/schedule`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch schedule')
        return res.json()
      })
      .then(data => {
        setSchedule(data)
        const current = data.find(r => r.games.some(g => !g.played)) || data[data.length - 1]
        setSelectedRound(current?.gameday ?? null)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [apiBase])

  const currentRound = schedule.find(r => r.gameday === selectedRound)

  return (
    <div className="schedule-view">
      <button className="back-btn" onClick={onBack}>&larr; Back to Menu</button>
      <h2>{isNBA ? 'NBA' : 'Euroleague'} Schedule</h2>

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Loading schedule...</div>}

      {!loading && schedule.length > 0 && (
        <>
          {isNBA ? (
            <CalendarPicker
              schedule={schedule}
              selectedDate={selectedRound}
              onSelectDate={setSelectedRound}
            />
          ) : (
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
          )}

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
