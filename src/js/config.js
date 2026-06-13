// VPN App - Configuration

export const CONFIG = {
	// API Server URL - change this to your deployed server
	API_URL: "http://localhost:8080/api",

	// Telegram Bot Token for auth
	BOT_TOKEN: "8977450083:AAGJ1wy_MfdL0NVP1B6GjKM2dOVRJKs0UfI",

	// App settings
	APP_NAME: "VPN App",

	// WireGuard settings
	WG_PORT: 51820,
	WG_DNS: "1.1.1.1",

	// Reconnection settings
	RECONNECT_DELAY: 3000,
	MAX_RECONNECT_ATTEMPTS: 3,

	// Servers list
	SERVERS: [
		{
			id: "us-1",
			name: "US Server 1",
			location: "New York, USA",
			flag: "🇺🇸",
			ip: "wg-us-1.example.com",
			ping: 45,
		},
		{
			id: "us-2",
			name: "US Server 2",
			location: "Los Angeles, USA",
			flag: "🇺🇸",
			ip: "wg-us-2.example.com",
			ping: 78,
		},
		{
			id: "eu-1",
			name: "EU Server 1",
			location: "Frankfurt, Germany",
			flag: "🇩🇪",
			ip: "wg-eu-1.example.com",
			ping: 25,
		},
		{
			id: "eu-2",
			name: "EU Server 2",
			location: "Amsterdam, Netherlands",
			flag: "🇳🇱",
			ip: "wg-eu-2.example.com",
			ping: 30,
		},
		{
			id: "ru-1",
			name: "RU Server 1",
			location: "Moscow, Russia",
			flag: "🇷🇺",
			ip: "wg-ru-1.example.com",
			ping: 15,
		},
		{
			id: "asia-1",
			name: "Asia Server 1",
			location: "Tokyo, Japan",
			flag: "🇯🇵",
			ip: "wg-asia-1.example.com",
			ping: 120,
		},
	],
};

// Freeze config
Object.freeze(CONFIG);
