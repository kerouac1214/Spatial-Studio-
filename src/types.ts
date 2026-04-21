export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isVisible: boolean;
}

export interface SceneState {
  backgroundUrl: string;
  characters: Character[];
  lighting: {
    intensity: number;
    color: string;
    position: [number, number, number];
  };
  camera: {
    fov: number;
    position: [number, number, number];
    target: [number, number, number];
  };
  visualMode: 'cinematic' | 'spatial-map';
  snapshot: string | null;
  generationSettings: {
    ratio: '9:16' | '16:9';
    characterImages: Record<string, string>; // Maps character ID to image URL
  };
}
