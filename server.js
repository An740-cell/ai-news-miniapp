import express from 'express';
import { google } from 'googleapis';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Загружаем credentials из переменной окружения или файла
let auth;
try {
  let credentials;

  // Пробуем загрузить из переменной окружения (для продакшена)
  if (process.env.SERVICE_ACCOUNT_JSON) {
    console.log('Loading credentials from environment variable');
    credentials = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
  } else {
    // Загружаем из файла (для локальной разработки)
    console.log('Loading credentials from file');
    credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'service-account.json'), 'utf8'));
  }

  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  console.log('Google Auth initialized successfully');
} catch (error) {
  console.error('Error loading service account credentials:', error.message);
  console.log('Please set SERVICE_ACCOUNT_JSON environment variable or create service-account.json file');
}

const SHEET_ID = '11w7CYyPr5R-nqe7PY43MfAj5gv531GkBruxAxzQ6_pQ';
const SHEET_NAME = 'News for MiniApp';
const DIGEST_SHEET_NAME = 'Digest for MiniApp';

app.get('/api/news', async (req, res) => {
  try {
    if (!auth) {
      return res.status(500).json({ error: 'Service account not configured' });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const allNews = [];

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${SHEET_NAME}!A:E`,
      });

      const rows = response.data.values;
      console.log(`Sheet: ${SHEET_NAME}, Rows: ${rows ? rows.length : 0}`);

      if (rows && rows.length > 1) {
        // Пропускаем первую строку (заголовки)
        console.log('Headers:', rows[0]);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];

          // Пропускаем пустые строки
          if (!row[0] && !row[1]) continue;

          // Структура: A=Текст, B=Дата
          const text = row[0] || '';
          const date = row[1] || '';

          // Извлекаем URL из текста
          const url = extractUrl(text);

          console.log(`Row ${i}:`, { text: text.substring(0, 50), date, hasUrl: !!url });

          // Берем все записи с текстом
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
    } catch (error) {
      console.error(`Error fetching sheet ${SHEET_NAME}:`, error.message);
    }

    console.log(`Total news found: ${allNews.length}`);

    // Сортируем по дате (новые первыми)
    allNews.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA;
    });

    res.json({ news: allNews });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/digest', async (req, res) => {
  try {
    if (!auth) {
      return res.status(500).json({ error: 'Service account not configured' });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const allDigests = [];

    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${DIGEST_SHEET_NAME}!A:E`,
      });

      const rows = response.data.values;
      console.log(`Sheet: ${DIGEST_SHEET_NAME}, Rows: ${rows ? rows.length : 0}`);

      if (rows && rows.length > 1) {
        console.log('Digest Headers:', rows[0]);

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];

          // Пропускаем пустые строки
          if (!row[0] && !row[1]) continue;

          // Структура: A=Текст, B=Дата
          const text = row[0] || '';
          const date = row[1] || '';

          console.log(`Digest Row ${i}:`, { text: text.substring(0, 50), date });

          // Берем все записи с текстом
          if (text) {
            allDigests.push({
              url: '', // У дайджестов нет единой ссылки
              text,
              date,
              source: 'Дайджест',
              tags: extractTags(text),
              title: extractTitle(text),
              type: 'digest'
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching sheet ${DIGEST_SHEET_NAME}:`, error.message);
    }

    console.log(`Total digests found: ${allDigests.length}`);

    // Сортируем по дате (новые первыми)
    allDigests.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA;
    });

    res.json({ news: allDigests });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

function getSourceFromSheet(sheetName) {
  if (sheetName.includes('Linkedin')) return 'TechCrunch';
  if (sheetName.includes('Facebook')) return 'Artificial Intelligence News';
  if (sheetName.includes('VK')) return 'VK';
  if (sheetName.includes('Telegram')) return 'Telegram';
  return 'Unknown';
}

function extractUrl(text) {
  // Ищем URL в тексте (http, https)
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
  // Берем первую строку или первое предложение как заголовок
  const firstLine = text.split('\n')[0];

  // Для карточек обрезаем, для модального окна будет полный заголовок
  // В карточке показываем до 150 символов
  if (firstLine.length > 150) {
    return firstLine.substring(0, 147) + '...';
  }
  return firstLine;
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(0);

  // Пробуем парсить формат DD.MM.YYYY
  const ddmmyyyyRegex = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
  const match = dateStr.match(ddmmyyyyRegex);

  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // месяцы с 0
    const year = parseInt(match[3]);
    return new Date(year, month, day);
  }

  // Пробуем стандартный парсинг
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(0);
}

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
