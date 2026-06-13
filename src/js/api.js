// VPN App - API Module

class VPNAPI {
	constructor() {
		this.baseUrl = CONFIG.API_URL;
		this.token = localStorage.getItem("vpn_token");
	}

	// Authenticate user via Telegram
	async authenticate(telegramAuthToken) {
		try {
			const response = await this.post("/auth/telegram", {
				token: telegramAuthToken,
			});
			if (response.token) {
				this.token = response.token;
				localStorage.setItem("vpn_token", response.token);
			}
			return response;
		} catch (error) {
			console.error("Auth error:", error);
			throw error;
		}
	}

	// Get user profile
	async getProfile() {
		return this.get("/user/profile");
	}

	// Get subscription status
	async getSubscription() {
		return this.get("/subscription/status");
	}

	// Get WireGuard config
	async getWireGuardConfig() {
		return this.get("/subscription/config");
	}

	// Extend subscription
	async extendSubscription(planId) {
		return this.post("/subscription/extend", { plan_id: planId });
	}

	// Get available servers
	async getServers() {
		return this.get("/servers");
	}

	// Get connection statistics
	async getStats() {
		return this.get("/user/stats");
	}

	// Generic GET request
	async get(endpoint) {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: "GET",
			headers: this.getHeaders(),
		});
		return this.handleResponse(response);
	}

	// Generic POST request
	async post(endpoint, data) {
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method: "POST",
			headers: this.getHeaders(),
			body: JSON.stringify(data),
		});
		return this.handleResponse(response);
	}

	// Get headers with auth token
	getHeaders() {
		const headers = {
			"Content-Type": "application/json",
		};
		if (this.token) {
			headers["Authorization"] = `Bearer ${this.token}`;
		}
		return headers;
	}

	// Handle response
	async handleResponse(response) {
		const data = await response.json();

		if (!response.ok) {
			if (response.status === 401) {
				// Token expired, clear it
				this.logout();
				throw new Error("SESSION_EXPIRED");
			}
			throw new Error(data.message || "API Error");
		}

		return data;
	}

	// Logout
	logout() {
		this.token = null;
		localStorage.removeItem("vpn_token");
		localStorage.removeItem("vpn_user");
	}

	// Check if authenticated
	isAuthenticated() {
		return !!this.token;
	}

	// Get stored user data
	getStoredUser() {
		const userData = localStorage.getItem("vpn_user");
		return userData ? JSON.parse(userData) : null;
	}

	// Store user data
	storeUser(userData) {
		localStorage.setItem("vpn_user", JSON.stringify(userData));
	}
}

// Telegram Auth Helper
class TelegramAuth {
	// Generate auth URL for Telegram Login Widget
	static getAuthUrl(botUsername) {
		const redirectUri = encodeURIComponent(window.location.origin + "/auth");
		return `https://oauth.telegram.org/auth?bot_id=${CONFIG.BOT_TOKEN}&origin=${encodeURIComponent(window.location.origin)}&request_access=write&return_url=${redirectUri}`;
	}

	// Parse Telegram init data (for Web App integration)
	static parseInitData(initData) {
		const params = new URLSearchParams(initData);
		const hash = params.get("hash");
		params.delete("hash");

		// In production, verify hash on server
		const dataCheckString = Array.from(params.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => `${key}=${value}`)
			.join("\n");

		return {
			hash,
			data: Object.fromEntries(params),
			isValid: true, // Verify on server in production
		};
	}

	// Check if running inside Telegram
	static isTelegramWebApp() {
		return window.Telegram?.WebApp?.initData;
	}

	// Get user from Telegram WebApp
	static getTelegramUser() {
		if (TelegramAuth.isTelegramWebApp()) {
			return window.Telegram.WebApp.initDataUnsafe?.user;
		}
		return null;
	}

	// Open Telegram auth
	static openAuth(botUsername) {
		const url = TelegramAuth.getAuthUrl(botUsername);

		// Try to use Telegram Mini App auth if available
		if (window.Telegram?.WebApp) {
			window.Telegram.WebApp.openTelegramLink(url);
		} else {
			window.open(url, "telegram_auth", "width=500,height=600");
		}
	}
}

// Global API instance
const api = new VPNAPI();
