// Điểm vào cho Passenger (cPanel Node.js App): bản build Nitro là ESM nên nạp bằng import() động.
import('./.output/server/index.mjs').catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  )
  process.exit(1)
})
