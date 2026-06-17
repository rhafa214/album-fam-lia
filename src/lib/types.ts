import { DriveFile } from "./drive";

export interface PhotoEvent {
  id: string;
  title: string | null;
  startDate: Date;
  endDate: Date;
  photos: DriveFile[];
}

export interface Album {
  id: string; // The drive folder ID
  title: string;
  addedAt: string;
  coverUrl?: string;
  customDate?: string;
}
