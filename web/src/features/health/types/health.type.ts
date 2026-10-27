export type DatabaseStatus = 'UP' | 'DOWN'

export type Health = {
  db: DatabaseStatus
}
