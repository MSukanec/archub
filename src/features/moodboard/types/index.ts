export interface Pin {
  id: string;
  title: string | null;
  source_url: string | null;
  image_url: string | null;
  organization_id: string | null;
  project_id: string | null;
  media_file_id: string | null;
  created_at: string;
  signed_url?: string | null;
}

export interface PinInput {
  title?: string | null;
  source_url?: string | null;
  image_url?: string | null;
  organization_id?: string | null;
  project_id?: string | null;
}

export interface PinBoard {
  id: string;
  organization_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  _count?: {
    pins?: number;
  };
}

export interface PinBoardItem {
  id: string;
  board_id: string;
  pin_id: string;
  position: number | null;
  created_at: string;
}
