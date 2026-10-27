// Điểm vào cho Passenger (cPanel Node.js App): ứng dụng là ESM nên nạp bằng import() động.
import('./dist/main.js').catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
