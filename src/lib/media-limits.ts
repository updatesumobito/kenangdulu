/** The guest experience caps video at 30 seconds without raising a session's allowance. */
export function guestVideoLimit(sessionLimit: number): number {
 return Math.min(30, Number.isFinite(sessionLimit) && sessionLimit > 0 ? sessionLimit : 30);
}
