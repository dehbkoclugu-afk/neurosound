/**
 * Ambient Sound Configuration
 * Maps noise types to local audio files
 */

// Local sound file mappings using require() for Metro bundler
export const localSounds: Record<string, any> = {
  rain: require('@/assets/sounds/rain.mp3'),
  ocean: require('@/assets/sounds/ocean.mp3'),
  thunder: require('@/assets/sounds/thunder.mp3'),
  fire: require('@/assets/sounds/fire.mp3'),
  wind: require('@/assets/sounds/wind.mp3'),
  forest: require('@/assets/sounds/forest.mp3'),
  stream: require('@/assets/sounds/stream.mp3'),
  fan: require('@/assets/sounds/fan.mp3'),
  train: require('@/assets/sounds/train.mp3'),
  airplane: require('@/assets/sounds/airplane.mp3'),
};

// Check if a noise type has a real sound file
export function hasRealSound(noiseType: string): boolean {
  return noiseType in localSounds;
}

// Get the local sound asset for a noise type
export function getLocalSound(noiseType: string): any | null {
  return localSounds[noiseType] || null;
}

// List of noise types that use procedural generation (no real file)
export const proceduralNoiseTypes = ['white', 'pink', 'brown'];

// Check if noise type uses procedural generation
export function isProceduralNoise(noiseType: string): boolean {
  return proceduralNoiseTypes.includes(noiseType);
}
