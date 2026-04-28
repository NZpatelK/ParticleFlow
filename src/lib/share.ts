export type AnimationData = {
  text: string;
  colorHex: string;
};

export function encodeAnimationData(data: AnimationData): string {
  return btoa(JSON.stringify(data));
}

export function decodeAnimationData(encoded: string): AnimationData | null {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}
