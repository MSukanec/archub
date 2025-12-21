export interface Pin {
  id: string;
  title: string | null;
  source_url: string | null;
  image_url: string | null;
  created_at: string;
}

export interface PinInput {
  title?: string | null;
  source_url?: string | null;
  image_url?: string | null;
}
