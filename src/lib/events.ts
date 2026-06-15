import { DriveFile, fetchDrivePhotos } from "./drive";
import { PhotoEvent } from "./types";
import { differenceInDays, parseISO } from "date-fns";
import { getAlbums } from "./albums";

export function getCustomDates(): Record<string, string> {
  const data = localStorage.getItem("custom_photo_dates");
  return data ? JSON.parse(data) : {};
}

export function saveCustomDate(photoId: string, isoString: string) {
  const dates = getCustomDates();
  dates[photoId] = isoString;
  localStorage.setItem("custom_photo_dates", JSON.stringify(dates));
}

export async function loadAndClusterPhotos(): Promise<PhotoEvent[]> {
    const albums = getAlbums();
    if (albums.length === 0) return [];

    let allFiles: DriveFile[] = [];
    
    // Fetch photos from each added album in parallel
    const fetchPromises = albums.map(async (album) => {
        try {
            const { files } = await fetchDrivePhotos(album.id);
            return files;
        } catch (e) {
            console.error(`Failed to fetch photos for album ${album.id}:`, e);
            return [];
        }
    });

    const results = await Promise.all(fetchPromises);
    allFiles = results.flat();

    const customDates = getCustomDates();

    // Sort by capturing date (Drive createdTime or original metadata) desc
    allFiles.sort((a, b) => {
      const dateA = customDates[a.id] || a.createdTime;
      const dateB = customDates[b.id] || b.createdTime;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    const events: PhotoEvent[] = [];
    let currentEvent: PhotoEvent | null = null;

    // Cluster photos if difference > 3 days
    for (const file of allFiles) {
        if (!file.thumbnailLink) continue; // Skip files without thumbnails
        const dateStr = customDates[file.id] || file.createdTime;
        const date = parseISO(dateStr);

        if (!currentEvent) {
            currentEvent = {
                id: file.id, // using first photo id as event id
                title: null,
                startDate: date,
                endDate: date,
                photos: [file]
            };
        } else {
            // Check diff with last photo in current event (which is earliest so far)
            const diff = differenceInDays(currentEvent.startDate, date);
            if (diff <= 3) {
                currentEvent.startDate = date; // Expand interval backwards
                currentEvent.photos.push(file);
            } else {
                events.push(currentEvent);
                currentEvent = {
                    id: file.id,
                    title: null,
                    startDate: date,
                    endDate: date,
                    photos: [file]
                };
            }
        }
    }
    if (currentEvent) {
        events.push(currentEvent);
    }
    return events;
}

export async function generateEventTitle(photos: DriveFile[]): Promise<string> {
   try {
       // Take up to 3 thumbnails to send to Gemini
       const thumbnails = photos.slice(0, 3).map(p => p.thumbnailLink).filter(Boolean);
       if (thumbnails.length === 0) return "Memória Especial";

       const res = await fetch("/api/analyze", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ images: thumbnails })
       });

       if (!res.ok) return "Evento Especial";
       
       const { title } = await res.json();
       return title;
   } catch {
       return "Memória Especial";
   }
}
