import './styles/main.css';
import { fetchNews, fetchDigests, filterNewsByTimeframe } from './services/sheets.js';
import { createNewsItem, createNewsModal } from './components/NewsItem.js';

let allNews = [];
let allDigests = [];
let currentView = 'news'; // 'news' or 'digest'
let currentDigestDays = 30;

async function init() {
  const app = document.getElementById('app');

  app.innerHTML = `
    <header class="header">
      <h1>AI News</h1>
      <p class="author">by Jemal Hamidun</p>
    </header>

    <div class="view-toggle">
      <button class="toggle-btn active" data-view="news">📰 Новости</button>
      <button class="toggle-btn" data-view="digest">📊 Дайджест</button>
    </div>

    <div class="news-count"></div>

    <div class="content">
      <div class="loading">Загрузка новостей...</div>
    </div>
  `;

  // Initialize Telegram WebApp
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    tg.setHeaderColor('#000000');
    tg.setBackgroundColor('#000000');
  }

  // Set up event listeners
  setupEventListeners();

  // Load news
  await loadNews();
}

function setupEventListeners() {
  // View toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentView = e.target.dataset.view;
      renderNews();
    });
  });
}

async function loadNews() {
  try {
    allNews = await fetchNews();
    allDigests = await fetchDigests();
    renderNews();
  } catch (error) {
    document.querySelector('.content').innerHTML = `
      <div class="error">
        Ошибка загрузки новостей. Пожалуйста, проверьте настройки Google Sheets API.
      </div>
    `;
  }
}

function renderNews() {
  const content = document.querySelector('.content');
  const newsCount = document.querySelector('.news-count');

  // Выбираем источник данных в зависимости от текущего вида
  let filteredNews = currentView === 'digest' ? allDigests : allNews;

  // Для дайджестов НЕ применяем фильтр по времени - показываем все
  // (фильтр по времени только для обычных новостей, если нужно)

  newsCount.textContent = `Найдено новостей: ${filteredNews.length}`;

  if (filteredNews.length === 0) {
    content.innerHTML = '<div class="loading">Новости не найдены</div>';
    return;
  }

  content.innerHTML = '<div class="news-list"></div>';
  const newsList = content.querySelector('.news-list');

  if (currentView === 'digest') {
    // Group by date for digest view
    const grouped = groupNewsByDate(filteredNews);
    Object.entries(grouped).forEach(([date, newsItems]) => {
      const dateHeader = document.createElement('div');
      dateHeader.className = 'digest-date-header';
      dateHeader.textContent = date;
      newsList.appendChild(dateHeader);

      newsItems.forEach(news => {
        const newsItem = createNewsItem(news, (clickedNews) => {
          showNewsModal(clickedNews);
        });
        newsList.appendChild(newsItem);
      });
    });
  } else {
    // Regular news view
    filteredNews.forEach(news => {
      const newsItem = createNewsItem(news, (clickedNews) => {
        showNewsModal(clickedNews);
      });
      newsList.appendChild(newsItem);
    });
  }
}

function groupNewsByDate(news) {
  const grouped = {};

  news.forEach(item => {
    const date = formatDateHeader(item.date);
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });

  return grouped;
}

function formatDateHeader(dateStr) {
  if (!dateStr) return 'Без даты';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const itemDate = new Date(date);
  itemDate.setHours(0, 0, 0, 0);

  const diffTime = today - itemDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '🗓️ Сегодня';
  if (diffDays === 1) return '🗓️ Вчера';
  if (diffDays < 7) return `🗓️ ${diffDays} дн. назад`;

  return '🗓️ ' + date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
}

function showNewsModal(news) {
  const modal = createNewsModal(news, () => {
    modal.remove();
  });
  document.body.appendChild(modal);
}

// Start the app
init();
