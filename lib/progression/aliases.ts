const adjectives = [
  "Flaming",
  "Mighty",
  "Swift",
  "Shadow",
  "Electric",
  "Steel",
  "Cosmic",
  "Lucky",
  "Neon",
  "Solar",
]

const creatures = [
  "Panther",
  "Falcon",
  "Lynx",
  "Drake",
  "Mantis",
  "Wolf",
  "Orca",
  "Phoenix",
  "Tiger",
  "Viper",
]

const suffixes = [
  "001",
  "101",
  "222",
  "333",
  "404",
  "505",
  "707",
  "808",
  "909",
  "999",
]

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const generateAlias = (seed: string) => {
  if (!seed) {
    return "Rogue Athlete"
  }
  const hash = hashString(seed)
  const adjective = adjectives[hash % adjectives.length]
  const creature = creatures[(hash >> 3) % creatures.length]
  const suffix = suffixes[(hash >> 5) % suffixes.length]
  return `${adjective} ${creature} ${suffix}`
}
