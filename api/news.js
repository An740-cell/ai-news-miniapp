import { google } from 'googleapis';

const SHEET_ID = '11w7CYyPr5R-nqe7PY43MfAj5gv531GkBruxAxzQ6_pQ';
const SHEET_NAME = 'News for MiniApp';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!process.env.SERVICE_ACCOUNT_JSON) {
      return res.status(500).json({ error: 'Service account not configured' });
    }

    const credentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const allNews = [];

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:E`,
    });

    const rows = response.data.values;

    if (rows && rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        // Skip empty rows
        if (!row[0] && !row[1]) continue;

        const text = row[0] || '';
        const date = row[1] || '';

        // Extract URL from text
        const url = extractUrl(text);

        // Take all entries with text
        if (text) {
          allNews.push({
            url,
            text,
            date,
            source: 'AI News',
            tags: extractTags(text),
            title: extractTitle(text),
            type: 'news'
          });
        }
      }
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA;
    });

    res.status(200).json({ news: allNews });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}

function extractUrl(text) {
  const urlRegex = /(https?:\/\/[^\s\)]+)/gi;
  const match = text.match(urlRegex);
  return match ? match[0] : '';
}

function extractTags(text) {
  const tags = [];
  const hashtagRegex = /#(\w+)/g;
  let match;

  while ((match = hashtagRegex.exec(text)) !== null) {
    tags.push(match[1]);
  }

  return tags;
}

function extractTitle(text) {
  const firstLine = text.split('\n')[0];

  if (firstLine.length > 150) {
    return firstLine.substring(0, 147) + '...';
  }
  return firstLine;
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(0);

  const ddmmyyyyRegex = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
  const match = dateStr.match(ddmmyyyyRegex);

  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const year = parseInt(match[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(0);
}
