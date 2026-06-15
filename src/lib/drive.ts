import { getAccessToken } from "../auth";

export interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webContentLink?: string;
  createdTime: string;
}

export async function fetchDrivePhotos(folderId?: string, pageToken?: string): Promise<{ files: DriveFile[], nextPageToken?: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token available.");

  let q = "(mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/gif' or mimeType = 'image/heic' or mimeType = 'image/webp')";
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,thumbnailLink,webContentLink,createdTime)&orderBy=createdTime desc&pageSize=100`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Drive API Error:", errorText);
    throw new Error(`Failed to fetch photos: ${res.statusText} - ${errorText}`);
  }

  return await res.json();
}

export async function fetchFolderMetadata(folderId: string): Promise<{ id: string, name: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("No access token available.");

  const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch folder: ${res.statusText}`);
  }

  return await res.json();
}
