const metaPath = 'meta.json'

const createCard = log => {
  const card = document.createElement('div')
  card.className = `card ${getStatus(log)}`

  const events = log.events || []
  card.innerHTML = `<div class="count">${events.length}</div><h3>${log.label}</h3></div>`

  const progressBar = createProgressBar(log)
  card.appendChild(progressBar)

  if (getDaysBehind(log)) card.innerHTML += `<div>${getDaysBehind(log)} behind</div>`

  return card
}

const createProgressBar = log => {
  const progressBar = document.createElement('div')
  progressBar.className = 'progress'

  const bar = document.createElement('div')
  progressBar.appendChild(bar)
  bar.className = 'bar'

  const progress = calculateProgress(log)
  bar.style.width = `${progress}%`

  return progressBar
}

const calculateProgress = log => {
  const events = log.events || []
  const target = log.target || 100
  const progress = (events.length / target) * 100
  return Math.min(progress, 100) // Cap at 100%
}

const today = dayjs()
const jan1 = dayjs().startOf('year')
const dec31 = dayjs().endOf('year')
const remaining = dec31.diff(today, 'day')

const getElapsed = log => (log.events.length ? today.diff(dayjs(log.events[0].date), 'day') : 7)

const getProjection = log => {
  const tally = log.events.length || 1
  return Math.floor((tally / getElapsed(log)) * 365)
}

const getDaysBehind = log => {
  let days = 0
  const tally = log.events.length
  let daysLeft = remaining
  let shortfall = log.target - tally

  // troubleshooting
  // console.log(`${tally} + ${days} / ${getElapsed(log)} = ${((tally + days) / getElapsed(log)).toFixed(2)} per day`)
  // console.warn(`needed: ${shortfall} / ${daysLeft} = ${(shortfall / daysLeft).toFixed(2)} per day`)

  while ((tally + days) / (getElapsed(log) + days) < shortfall / daysLeft) {
    days++
    daysLeft--
    shortfall--
  }

  return days
}

const getStatus = log => {
  const { events, label, status, target } = log
  const tally = events.length

  if (status) return status
  if (tally >= target) return 'complete'
  if (target > remaining) return 'impossible'

  if (getProjection(log) >= target) return 'nominal'
  return 'ambitious'
}

fetch(metaPath)
  .then(response => response.json())
  .then(meta => {
    const fetchPromises = meta.logs.map(log => {
      return fetch(log.file)
        .then(response => response.json())
        .then(events => {
          log.events = events
          return log
        })
    })

    Promise.all(fetchPromises)
      .then(logs => {
        const dashboard = document.getElementById('dashboard')

        logs.forEach(log => dashboard.appendChild(createCard(log)))
      })
      .catch(console.error)
  })
  .catch(console.error)
