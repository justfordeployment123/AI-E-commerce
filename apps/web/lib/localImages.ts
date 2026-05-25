import registry from "../public/image-registry.json";

export const imageRegistry = registry;

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
