// All images now served from Garage (S3). This file kept for the pick() utility only.
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
