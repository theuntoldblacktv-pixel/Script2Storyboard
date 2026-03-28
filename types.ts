
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface Scene {
  id: string;
  title: string;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ScriptAnalysis {
  scenes: Scene[];
}
