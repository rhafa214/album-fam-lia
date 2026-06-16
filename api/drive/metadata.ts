export default async function handler(req: any, res: any) {
  try {
    const { folderId } = req.query;
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not configured on the server." });
    }

    const url = `https://www.googleapis.com/drive/v3/files/${folderId}?key=${apiKey}&fields=id,name`;
    const driveRes = await fetch(url);
    
    if (!driveRes.ok) {
      const errorText = await driveRes.text();
      return res.status(driveRes.status).json({ error: errorText });
    }
    
    const data = await driveRes.json();
    res.status(200).json(data);
  } catch (err: any) {
    console.error("Drive API metadata error:", err);
    res.status(500).json({ error: err.message });
  }
}
