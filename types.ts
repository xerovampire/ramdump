
export enum TimerMode {
  STUDY = 'STUDY',
  BREAK = 'BREAK'
}

export interface Message {
  id: string;
  room_id: string;
  sender: string;
  content?: string;
  image_url?: string;
  audio_url?: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  password?: string;
  study_duration: number;
  break_duration: number;
  is_active: boolean;
  timer_mode: TimerMode;
  time_left: number;
}
