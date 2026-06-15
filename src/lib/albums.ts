import { Album } from "./types";
import { fetchFolderMetadata, fetchDrivePhotos } from "./drive";

export function getAlbums(): Album[] {
  const data = localStorage.getItem("my_albums");
  return data ? JSON.parse(data) : [];
}

export function saveAlbums(albums: Album[]) {
  localStorage.setItem("my_albums", JSON.stringify(albums));
}

function extractFolderId(url: string): string | null {
  const regex = /folders\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function addAlbumFromUrl(url: string): Promise<Album> {
  const folderId = extractFolderId(url) || url; // Fallback to raw string if they pasted just the ID

  // Avoid duplicates
  const existing = getAlbums();
  if (existing.find(a => a.id === folderId)) {
    throw new Error("Album already exists.");
  }

  // Fetch metadata to get title
  const metadata = await fetchFolderMetadata(folderId);
  
  const newAlbum: Album = {
    id: metadata.id,
    title: metadata.name,
    addedAt: new Date().toISOString()
  };

  saveAlbums([...existing, newAlbum]);
  return newAlbum;
}

export async function loadAlbumPhotos(folderId: string) {
  const { files } = await fetchDrivePhotos(folderId);
  return files;
}
