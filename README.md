# AI News Telegram Mini App

Telegram Mini App для отображения AI новостей из Google Sheets.

## Настройка

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Google Sheets API

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API
4. Создайте API ключ в разделе "Credentials"
5. Откройте файл `src/services/sheets.js` и замените:
   - `YOUR_SHEET_ID` на ID вашей Google таблицы
   - `YOUR_API_KEY` на ваш API ключ

**Как найти SHEET_ID:**
В URL вашей таблицы: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

**Важно:** Убедитесь, что таблица доступна для чтения по ссылке (настройки доступа).

### 3. Структура таблицы

Приложение ожидает следующие листы:
- Linkedin Архив
- Facebooke Архив
- VK Архив
- Telegram Архив

Структура колонок:
- A: URL
- B: Текст
- C: Статус (должен быть "post")
- D: Дата

## Запуск локально

```bash
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Сборка для продакшена

```bash
npm run build
```

Собранные файлы будут в папке `dist/`.

## Деплой

Для деплоя в Telegram Mini App:

1. Соберите проект: `npm run build`
2. Загрузите содержимое папки `dist/` на хостинг (например, GitHub Pages, Vercel, Netlify)
3. В BotFather настройте ваш бот и укажите URL Mini App

## Функционал

- 📰 Просмотр всех новостей
- 🔍 Фильтрация по источникам (LinkedIn, Facebook, VK, Telegram)
- 📊 Режим дайджеста с фильтрами по времени (7, 14, 30 дней)
- 📖 Просмотр полного текста новости
- 🔗 Ссылка на источник
- 📢 Ссылка на Telegram канал

## Технологии

- Vanilla JavaScript
- Vite
- Telegram Web App API
- Google Sheets API
