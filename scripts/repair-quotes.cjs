const fs = require("fs")
const path = require("path")

const file = path.join(__dirname, "..", "data", "quotes.json")
const quotes = JSON.parse(fs.readFileSync(file, "utf8"))

let repaired = 0
const fixed = quotes.map((q) => {
  let { text, from } = q
  // The inspirational-quotes source dataset sometimes splits a quote at a
  // sentence boundary, putting the tail into the "from" (author) field.
  // Heuristic: the tail begins lowercase (a continuation, not a person name).
  if (from && /^[a-z]/.test(from)) {
    text = `${text} ${from.replace(/\u201d+$/, "")}`.replace(/\s+/g, " ").trim()
    from = "Unknown"
    repaired += 1
  }
  return { text, from }
})

// Basic sanity: drop any empty entries produced by the repair
const cleaned = fixed.filter((q) => q.text && q.text.trim().length > 0)

fs.writeFileSync(file, JSON.stringify(cleaned))
console.log("repaired", repaired, "quotes; total", cleaned.length)
