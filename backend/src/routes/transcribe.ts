import { Router, Request, Response } from 'express';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

const router = Router();

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ?? '';

router.post('/', upload.single('audio'), async (req: Request, res: Response): Promise<void> => {
  if (!DEEPGRAM_API_KEY) {
    res.status(500).json({ error: 'Deepgram API key not configured' });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No audio file provided' });
    return;
  }

  const language = (req.query['language'] as string) || 'it';

  try {
    const params = new URLSearchParams({
      model: 'nova-3',
      language,
      punctuate: 'true',
      smart_format: 'true',
      utterances: 'false',
    });

    const dgRes = await fetch(`https://api.deepgram.com/v1/listen?${params.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': file.mimetype || 'audio/webm',
      },
      body: new Uint8Array(file.buffer),
    });

    if (!dgRes.ok) {
      const errBody = await dgRes.text();
      console.error('[Deepgram] Error:', dgRes.status, errBody);
      res.status(502).json({ error: `Deepgram error: ${dgRes.status}` });
      return;
    }

    const json = await dgRes.json() as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{ transcript?: string }>;
        }>;
      };
    };

    const transcript =
      json.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? '';

    res.json({ data: { transcript } });
  } catch (err) {
    console.error('[Deepgram] Exception:', err);
    res.status(500).json({ error: 'Transcription failed' });
  }
});

export default router;
