// Real-time timestamp
function updateTimestamp() {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  document.getElementById("timestamp").textContent = `${hours}:${minutes}:${seconds}`
}

// Cursor position tracking
function updateCursorPosition(e) {
  const x = String(Math.floor(e.clientX)).padStart(4, "0")
  const y = String(Math.floor(e.clientY)).padStart(4, "0")
  document.getElementById("cursor-pos").textContent = `${x} / ${y}`
}

// Mood filtering system
function setupFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn")
  const items = document.querySelectorAll("[data-mood]")

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mood = button.dataset.mood

      // Update active button
      filterButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Filter items
      let visibleCount = 0
      items.forEach((item) => {
        if (mood === "all" || item.dataset.mood === mood) {
          item.classList.remove("hidden")
          visibleCount++
        } else {
          item.classList.add("hidden")
        }
      })

      // Update status bar
      document.getElementById("active-filter").textContent = mood.toUpperCase()
      document.getElementById("visible-count").textContent = visibleCount
    })
  })
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Start timestamp updates
  updateTimestamp()
  setInterval(updateTimestamp, 1000)

  // Track cursor
  document.addEventListener("mousemove", updateCursorPosition)

  // Setup filters
  setupFilters()

  // Set initial visible count
  const totalItems = document.querySelectorAll("[data-mood]").length
  document.getElementById("visible-count").textContent = totalItems
})
