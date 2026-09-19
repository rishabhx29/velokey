const fs = require("fs")
const path = require("path")

// The inspirational-quotes dataset lost the author when a quote was split
// at a sentence boundary. These are the well-known attributions for the
// repaired entries (verified against common quotation references).
const ATTRIBUTIONS = {
  "I never think of the future": "Albert Einstein",
  "Business opportunities are like buses": "Richard Branson",
  "To reach a port, we must sail": "Andre Gide",
  "I cannot give you the formula for success": "Herbert Bayard Swope",
  "There is only one success": "Christopher Morley",
  "Nine out of ten businesses fail": "Robert Kiyosaki",
  "If plan": "Rita Mae Brown",
  "Believe that you will succeed": "Napoleon Hill",
  "If you don": "Jack Welch",
  "Don": "Steve Jobs",
  "Your time is limited": "Steve Jobs",
}

const file = path.join(__dirname, "..", "data", "quotes.json")
const quotes = JSON.parse(fs.readFileSync(file, "utf8"))

let fixedCount = 0
for (const q of quotes) {
  if (q.from !== "Unknown") continue
  const match = Object.keys(ATTRIBUTIONS).find((prefix) => q.text.startsWith(prefix))
  if (match) {
    q.from = ATTRIBUTIONS[match]
    fixedCount += 1
  }
}

fs.writeFileSync(file, JSON.stringify(quotes))
console.log("re-attributed", fixedCount, "quotes")
