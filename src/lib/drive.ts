export interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webContentLink?: string;
  createdTime: string;
  description?: string;
}

export async function fetchDrivePhotos(folderId?: string, pageToken?: string): Promise<{ files: DriveFile[], nextPageToken?: string }> {
  let url = `/api/drive/files`;
  const params = new URLSearchParams();
  if (folderId) params.append("folderId", folderId);
  if (pageToken) params.append("pageToken", pageToken);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    console.error("Drive API Proxy Error:", errorData);
    throw new Error(`Failed to fetch photos: ${errorData.error}`);
  }

  return await res.json();
}

export async function fetchFolderMetadata(folderId: string): Promise<{ id: string, name: string }> {
  const url = `/api/drive/metadata?folderId=${encodeURIComponent(folderId)}`;
  const res = await fetch(url);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Failed to fetch folder metadata: ${errorData.error}`);
  }

  return await res.json();
}
