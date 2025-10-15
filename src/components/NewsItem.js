export function createNewsItem(news, onClick) {
  const article = document.createElement('article');
  article.className = 'news-item';

  article.innerHTML = `
    <h3 class="news-title">${escapeHtml(news.title)}</h3>
    <div class="news-meta">
      <span class="news-source">${escapeHtml(news.source)}</span>
      <span class="news-date">${formatDate(news.date)}</span>
    </div>
    <p class="news-text">${escapeHtml(truncateText(news.text, 200))}</p>
    ${news.tags.length > 0 ? `
      <div class="news-tags">
        ${news.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
      </div>
    ` : ''}
    <div class="news-actions">
      <button class="btn-primary read-source">
        📖 Читать источник
      </button>
      <button class="btn-secondary channel-btn">
        📢 Канал
      </button>
    </div>
  `;

  article.querySelector('.read-source').addEventListener('click', (e) => {
    e.stopPropagation();
    if (news.url) {
      window.open(news.url, '_blank');
    }
  });

  article.querySelector('.channel-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    window.open('https://t.me/jemal_hamidun', '_blank');
  });

  article.addEventListener('click', () => onClick(news));

  return article;
}

export function createNewsModal(news, onClose) {
  const modal = document.createElement('div');
  modal.className = 'modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 style="flex: 1; margin: 0; font-size: 20px;">AI News</h2>
        <button class="close-btn">×</button>
      </div>
      <article class="news-item" style="cursor: default; background: transparent; padding: 0;">
        <h3 class="news-title" style="font-size: 18px; line-height: 1.4; margin-bottom: 12px; word-wrap: break-word; white-space: normal; overflow-wrap: break-word;">${escapeHtml(getFullTitle(news.text))}</h3>
        <div class="news-meta" style="margin-bottom: 20px;">
          <span class="news-source">${escapeHtml(news.source)}</span>
          <span class="news-date">${formatDate(news.date)}</span>
        </div>
        <div class="news-text" style="white-space: pre-wrap; font-size: 15px; line-height: 1.7; color: #e0e0e0;">${escapeHtml(news.text)}</div>
        ${news.tags.length > 0 ? `
          <div class="news-tags" style="margin-top: 20px;">
            ${news.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
          </div>
        ` : ''}
        <div class="news-actions" style="margin-top: 24px;">
          ${news.url ? `
            <button class="btn-primary read-source">
              📖 Читать источник
            </button>
          ` : ''}
          <button class="btn-${news.url ? 'secondary' : 'primary'} channel-btn">
            📢 Канал
          </button>
        </div>
      </article>
    </div>
  `;

  modal.querySelector('.close-btn').addEventListener('click', onClose);

  const readSourceBtn = modal.querySelector('.read-source');
  if (readSourceBtn) {
    readSourceBtn.addEventListener('click', () => {
      if (news.url) {
        window.open(news.url, '_blank');
      }
    });
  }

  modal.querySelector('.channel-btn').addEventListener('click', () => {
    window.open('https://t.me/jemal_hamidun', '_blank');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      onClose();
    }
  });

  return modal;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function formatDate(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Вчера';
  if (days < 7) return `${days} дн. назад`;

  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function getFullTitle(text) {
  // Берем первую строку полностью без обрезания
  const firstLine = text.split('\n')[0];
  return firstLine;
}
