export default async function handler(req: any, res: any) {
  try {
    const { folderId, pageToken } = req.query;
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not configured on the server." });
    }

    let q = "(mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/gif' or mimeType = 'image/heic' or mimeType = 'image/webp')";
    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }

    let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${apiKey}&fields=nextPageToken,files(id,name,thumbnailLink,webContentLink,createdTime)&orderBy=createdTime desc&pageSize=100`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const driveRes = await fetch(url);
    if (!driveRes.ok) {
      const errorText = await driveRes.text();
      return res.status(driveRes.status).json({ error: errorText });
    }

    const data = await driveRes.json();
    res.status(200).json(data);
  } catch (err: any) {
    console.error("Drive API error:", err);
    res.status(500).json({ error: err.message });
  }
}
