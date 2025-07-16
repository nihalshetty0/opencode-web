import { customAlphabet } from "nanoid"

const randomBase62 = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
)

export const ID = {
  SESSION: "ses",
  MESSAGE: "msg",
  USER: "usr",
  PART: "prt",
}

// export const generateNewID = (prefix: string) => {
//   return `${prefix}_${ulid()}`
// }

let lastTimestamp = 0
let counter = 0

// TODO: use a more established way to do this, ig?
export function generateNewID(
  prefix: string,
  descending: boolean = false
): string {
  const currentTimestamp = Date.now() // JavaScript equivalent of time.Now().UnixMilli()

  if (currentTimestamp !== lastTimestamp) {
    lastTimestamp = currentTimestamp
    counter = 0
  }
  counter++

  let now = BigInt(currentTimestamp) * BigInt(0x1000) + BigInt(counter)

  if (descending) {
    // For 48-bit value, we need to mask to 6 bytes
    now = ~now & BigInt(0xffffffffffff)
  }

  const timeBytes = new Uint8Array(6)
  for (let i = 0; i < 6; i++) {
    timeBytes[i] = Number((now >> BigInt(40 - 8 * i)) & BigInt(0xff))
  }

  const hexString = Array.from(timeBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")

  // Generate random suffix
  const randomSuffix = randomBase62(length - 12) // 12 = prefix + "_" + hex(6 bytes)

  return `${prefix}_${hexString}${randomSuffix}`
}
