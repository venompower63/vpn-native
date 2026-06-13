# VPN App - Mobile Application

Нативное Android-приложение для VPN-подключения с интеграцией в Telegram-бот.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установите зависимости
npm install

# Запустите dev сервер
npm run dev

# Сборка веб-приложения
npm run build

# Добавление платформы Android
npx cap add android

# Синхронизация с Android
npx cap sync android

# Открыть в Android Studio
npx cap open android
```

### Сборка APK

```bash
cd android
./gradlew assembleDebug
```

APK будет находиться в: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📱 GitHub Actions

При пуше в `main` автоматически:
1. Собирается веб-приложение
2. Собирается Debug APK
3. Выкладывается артефакт

Для Release сборки:
1. Перейдите в **Actions** → **Build Android APK**
2. Нажмите **Run workflow**
3. После успешной сборки скачайте APK из артефактов

## 📁 Структура проекта

```
vpn-native/
├── src/                  # Исходный код веб-приложения
│   ├── js/              # JavaScript модули
│   └── css/             # Стили
├── android/             # Android проект (Capacitor)
├── dist/                 # Собранное веб-приложение
├── .github/
│   └── workflows/       # GitHub Actions
└── capacitor.config.json
```

## ⚙️ Настройка

### Telegram Bot

Укажите токен бота в `src/js/config.js`:

```javascript
const CONFIG = {
    BOT_TOKEN: 'YOUR_BOT_TOKEN',
    API_URL: 'https://your-api.com/api'
};
```

### API Server

Для работы приложения нужен бэкенд-сервер. Запустите:

```bash
cd ../vpn-bot
python bot.py
```

## 📦 Установка на устройство

1. Скачайте APK из GitHub Releases или Actions
2. Разрешите установку из неизвестных источников
3. Установите APK

## 🛠 Технологии

- **Frontend**: Vanilla JS + Vite
- **Mobile**: Capacitor
- **Backend**: Python (aiogram 3)
- **VPN**: WireGuard

## 📄 Лицензия

MIT
