// Google Sheets API service - now using backend API
const NEWS_API_URL = 'http://localhost:3001/api/news';
const DIGEST_API_URL = 'http://localhost:3001/api/digest';

export async function fetchNews() {
  try {
    console.log('Fetching news from backend API...');
    const response = await fetch(NEWS_API_URL);
    const data = await response.json();

    console.log('Received news:', data.news?.length || 0);

    if (data.error) {
      throw new Error(data.error);
    }

    return data.news || [];
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}

export async function fetchDigests() {
  try {
    console.log('Fetching digests from backend API...');
    const response = await fetch(DIGEST_API_URL);
    const data = await response.json();

    console.log('Received digests:', data.news?.length || 0);

    if (data.error) {
      throw new Error(data.error);
    }

    return data.news || [];
  } catch (error) {
    console.error('Error fetching digests:', error);
    throw error;
  }
}

function parseDate(dateStr) {
  if (!dateStr) return new Date(0);

  // Пытаемся распарсить разные форматы дат
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(0);
}

export function filterNewsByTimeframe(news, days) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  console.log('Filtering news:', {
    total: news.length,
    days,
    cutoff: cutoff.toISOString(),
    now: now.toISOString()
  });

  const filtered = news.filter(item => {
    const itemDate = parseDate(item.date);
    const isValid = itemDate >= cutoff;

    console.log('News item:', {
      title: item.title?.substring(0, 50),
      date: item.date,
      parsedDate: itemDate.toISOString(),
      cutoffDate: cutoff.toISOString(),
      isValid
    });

    return isValid;
  });

  console.log(`Filtered: ${filtered.length} of ${news.length}`);
  return filtered;
}
