// VPN App - Main Application

class VPNApp {
	constructor() {
		this.elements = {};
		this.selectedServer = localStorage.getItem("vpn_server") || "eu-1";
		this.connectionTimer = null;
		this.init();
	}

	async init() {
		// Cache DOM elements
		this.cacheElements();

		// Setup event listeners
		this.setupEventListeners();

		// Check auth status
		await this.checkAuth();

		// Setup PWA
		this.setupPWA();

		// Hide splash screen
		this.hideSplash();
	}

	cacheElements() {
		this.elements = {
			splash: document.getElementById("splash"),
			app: document.getElementById("app"),
			auth: document.getElementById("auth"),
			modal: document.getElementById("modal"),
			toast: document.getElementById("toast"),

			// Buttons
			connectBtn: document.getElementById("connectBtn"),
			profileBtn: document.getElementById("profileBtn"),
			settingsBtn: document.getElementById("settingsBtn"),
			telegramAuth: document.getElementById("telegramAuth"),
			changeServerBtn: document.getElementById("changeServerBtn"),
			downloadConfigBtn: document.getElementById("downloadConfigBtn"),
			helpBtn: document.getElementById("helpBtn"),
			modalClose: document.getElementById("modalClose"),

			// Status elements
			statusCard: document.getElementById("statusCard"),
			statusIndicator: document.getElementById("statusIndicator"),
			statusIcon: document.getElementById("statusIcon"),
			statusText: document.getElementById("statusText"),
			statusSubtext: document.getElementById("statusSubtext"),
			connectionInfo: document.getElementById("connectionInfo"),
			ipAddress: document.getElementById("ipAddress"),
			location: document.getElementById("location"),
			connectionTime: document.getElementById("connectionTime"),

			// Subscription elements
			subBadge: document.getElementById("subBadge"),
			subPlan: document.getElementById("subPlan"),
			subExpiry: document.getElementById("subExpiry"),
			subProgress: document.getElementById("subProgress"),
			subDays: document.getElementById("subDays"),

			// Modal
			modalBody: document.getElementById("modalBody"),
			toastText: document.getElementById("toastText"),
		};
	}

	setupEventListeners() {
		// Connect button
		this.elements.connectBtn?.addEventListener("click", () =>
			this.toggleConnection(),
		);

		// Auth button
		this.elements.telegramAuth?.addEventListener("click", () =>
			this.authenticateWithTelegram(),
		);

		// Modal
		this.elements.modalClose?.addEventListener("click", () =>
			this.closeModal(),
		);
		this.elements.modal?.addEventListener("click", (e) => {
			if (e.target === this.elements.modal) this.closeModal();
		});

		// Action buttons
		this.elements.changeServerBtn?.addEventListener("click", () =>
			this.showServerList(),
		);
		this.elements.downloadConfigBtn?.addEventListener("click", () =>
			this.downloadConfig(),
		);
		this.elements.helpBtn?.addEventListener("click", () => this.showHelp());

		// Profile
		this.elements.profileBtn?.addEventListener("click", () =>
			this.showProfile(),
		);

		// Bottom navigation
		document.querySelectorAll(".nav-item").forEach((item) => {
			item.addEventListener("click", (e) => this.handleNavigation(e));
		});
	}

	setupPWA() {
		// Register service worker
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("sw.js")
				.then((reg) => console.log("SW registered"))
				.catch((err) => console.log("SW registration failed:", err));
		}

		// PWA install prompt
		let deferredPrompt;
		window.addEventListener("beforeinstallprompt", (e) => {
			e.preventDefault();
			deferredPrompt = e;
			this.showToast("Установите приложение для лучшего опыта!");
		});
	}

	hideSplash() {
		setTimeout(() => {
			this.elements.splash?.classList.add("fade-out");
			setTimeout(() => {
				this.elements.splash?.classList.add("hidden");
			}, 500);
		}, 1000);
	}

	async checkAuth() {
		// Check if user is authenticated
		const storedUser = api.getStoredUser();

		if (api.isAuthenticated() && storedUser) {
			this.showApp();
			await this.loadUserData();
		} else {
			this.showAuth();
		}
	}

	showApp() {
		this.elements.auth?.classList.add("hidden");
		this.elements.app?.classList.remove("hidden");
	}

	showAuth() {
		this.elements.app?.classList.add("hidden");
		this.elements.auth?.classList.remove("hidden");
	}

	authenticateWithTelegram() {
		// Check if inside Telegram
		const tgUser = TelegramAuth.getTelegramUser();

		if (tgUser) {
			// Authenticate with Telegram user data
			this.processTelegramAuth(tgUser);
		} else {
			// Open Telegram auth
			TelegramAuth.openAuth("VenompowerVPN_bot");

			// For demo, simulate auth
			this.simulateAuth();
		}
	}

	async processTelegramAuth(user) {
		try {
			this.showToast("Авторизация...");

			// In production, send to server
			api.storeUser({
				id: user.id,
				first_name: user.first_name,
				last_name: user.last_name,
				username: user.username,
				photo_url: user.photo_url,
			});

			await this.loadUserData();
			this.showApp();
			this.showToast("Успешная авторизация!", "success");
		} catch (error) {
			this.showToast("Ошибка авторизации", "error");
		}
	}

	simulateAuth() {
		// Demo: simulate authentication
		const demoUser = {
			id: 7875416316,
			first_name: "Demo",
			last_name: "User",
			username: "demo_user",
		};

		api.storeUser(demoUser);
		localStorage.setItem("vpn_token", "demo_token_" + Date.now());

		this.showApp();
		this.loadUserData();
		this.showToast("Демо-режим активирован", "success");
	}

	async loadUserData() {
		await this.loadSubscription();
		this.updateUI();
	}

	async loadSubscription() {
		// In production, fetch from API
		// For demo, use mock data
		const mockSubscription = {
			active: true,
			plan: "Оптимум",
			expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
			days_total: 180,
			days_used: 150,
		};

		this.subscription = mockSubscription;
		this.updateSubscriptionUI();
	}

	updateSubscriptionUI() {
		if (!this.subscription) return;

		const { active, plan, expires_at, days_total, days_used } =
			this.subscription;
		const daysLeft = Math.ceil(
			(new Date(expires_at) - new Date()) / (1000 * 60 * 60 * 24),
		);
		const progress = ((days_total - daysLeft) / days_total) * 100;

		this.elements.subBadge.textContent = active ? "Активна" : "Истекла";
		this.elements.subBadge.className = `card-badge ${active ? "active" : "expired"}`;

		this.elements.subPlan.textContent = plan;
		this.elements.subExpiry.textContent = `До ${new Date(expires_at).toLocaleDateString("ru-RU")}`;
		this.elements.subProgress.style.width = `${100 - progress}%`;
		this.elements.subDays.textContent = `${daysLeft} дней осталось`;
	}

	updateUI() {
		const user = api.getStoredUser();
		if (user) {
			// User data loaded
		}
		this.updateConnectionStatus(false);
	}

	updateConnectionStatus(connected, connecting = false) {
		const indicator = this.elements.statusIndicator;
		const text = this.elements.statusText;
		const subtext = this.elements.statusSubtext;
		const btn = this.elements.connectBtn;
		const info = this.elements.connectionInfo;

		// Remove all status classes
		indicator.classList.remove("status-connected", "status-connecting");

		if (connected) {
			indicator.classList.add("status-connected");
			text.textContent = "Подключено";
			subtext.textContent = "Ваше соединение защищено";
			btn.className = "connect-btn connected";
			btn.querySelector(".btn-text").textContent = "Отключить";
			info.classList.remove("hidden");
		} else if (connecting) {
			indicator.classList.add("status-connecting");
			text.textContent = "Подключение...";
			subtext.textContent = "Пожалуйста, подождите";
			btn.className = "connect-btn connecting";
			btn.querySelector(".btn-text").textContent = "Подключение...";
			btn.disabled = true;
		} else {
			text.textContent = "Отключено";
			subtext.textContent = "Нажмите для подключения";
			btn.className = "connect-btn disconnected";
			btn.querySelector(".btn-text").textContent = "Подключить";
			btn.disabled = false;
			info.classList.add("hidden");
		}
	}

	async toggleConnection() {
		if (wireguard.connected) {
			this.disconnect();
		} else {
			await this.connect();
		}
	}

	async connect() {
		try {
			this.updateConnectionStatus(false, true);

			// Get config
			const config = {
				interface: { PrivateKey: "demo_key", Address: "10.0.0.2/32" },
				peer: { PublicKey: "demo_pub", Endpoint: "demo.example.com:51820" },
			};

			wireguard.config = config;

			// Try to connect
			await wireguard.connect();

			// Update local IP (demo)
			this.elements.ipAddress.textContent = "10.0.0.2";
			this.elements.location.textContent = this.getServerLocation();

			this.updateConnectionStatus(true);
			this.startConnectionTimer();
			this.showToast("VPN подключен!", "success");
		} catch (error) {
			console.error("Connection failed:", error);
			this.updateConnectionStatus(false);
			this.showToast("Ошибка подключения: " + error.message, "error");
		}
	}

	disconnect() {
		wireguard.disconnect();
		this.updateConnectionStatus(false);
		this.stopConnectionTimer();
		this.showToast("VPN отключен");
	}

	startConnectionTimer() {
		this.connectionTimer = setInterval(() => {
			const uptime = wireguard.getUptime();
			this.elements.connectionTime.textContent = wireguard.formatUptime(uptime);
		}, 1000);
	}

	stopConnectionTimer() {
		if (this.connectionTimer) {
			clearInterval(this.connectionTimer);
			this.connectionTimer = null;
		}
		this.elements.connectionTime.textContent = "—";
	}

	getServerLocation() {
		const server = CONFIG.SERVERS.find((s) => s.id === this.selectedServer);
		return server ? `${server.flag} ${server.location}` : "—";
	}

	showServerList() {
		const servers = CONFIG.SERVERS.map(
			(s) => `
            <li class="server-item ${s.id === this.selectedServer ? "selected" : ""}" 
                data-id="${s.id}">
                <span class="server-flag">${s.flag}</span>
                <div class="server-info">
                    <div class="server-name">${s.name}</div>
                    <div class="server-location">${s.location}</div>
                </div>
                <span class="server-ping">${s.ping}ms</span>
            </li>
        `,
		).join("");

		this.elements.modalBody.innerHTML = `
            <h3 class="modal-title">Выбор сервера</h3>
            <ul class="server-list">${servers}</ul>
        `;

		// Add click handlers
		this.elements.modalBody.querySelectorAll(".server-item").forEach((item) => {
			item.addEventListener("click", () => {
				this.selectServer(item.dataset.id);
				this.closeModal();
			});
		});

		this.openModal();
	}

	selectServer(serverId) {
		this.selectedServer = serverId;
		localStorage.setItem("vpn_server", serverId);
		this.showToast(
			`Сервер: ${CONFIG.SERVERS.find((s) => s.id === serverId)?.name}`,
		);

		// Reconnect if already connected
		if (wireguard.connected) {
			this.disconnect();
			setTimeout(() => this.connect(), 500);
		}
	}

	async downloadConfig() {
		try {
			// Generate config text
			const configText = wireguard.generateConfig({
				private_key: "demo_private_key_base64",
				address: "10.0.0.2/32",
				server_public_key: "demo_server_public_key",
				endpoint: "vpn.example.com",
			});

			wireguard.downloadConfig(configText);
			this.showToast("Конфиг скачан!", "success");
		} catch (error) {
			this.showToast("Ошибка скачивания", "error");
		}
	}

	showProfile() {
		const user = api.getStoredUser() || {};
		const initials = (user.first_name?.[0] || "") + (user.last_name?.[0] || "");

		this.elements.modalBody.innerHTML = `
            <h3 class="modal-title">Профиль</h3>
            <div class="profile-section">
                <div class="profile-avatar">${initials || "?"}</div>
                <div class="profile-name">${user.first_name || ""} ${user.last_name || ""}</div>
                <div class="profile-username">@${user.username || "unknown"}</div>
                
                <div class="profile-stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.subscription?.days_total - Math.ceil((new Date(this.subscription?.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) || 0}</div>
                        <div class="stat-label">Дней использовано</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Math.ceil((new Date(this.subscription?.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) || 0}</div>
                        <div class="stat-label">Дней осталось</div>
                    </div>
                </div>
            </div>
        `;

		this.openModal();
	}

	showHelp() {
		this.elements.modalBody.innerHTML = `
            <h3 class="modal-title">Помощь</h3>
            <div style="color: var(--text-secondary); line-height: 1.6;">
                <p><strong>Как подключиться?</strong></p>
                <p style="margin: 0.5rem 0 1rem;">1. Нажмите кнопку "Подключить"<br>
                2. Скачайте конфиг файл<br>
                3. Импортируйте в приложение WireGuard<br>
                4. Активируйте соединение</p>
                
                <p><strong>Установка на телефон:</strong></p>
                <p style="margin: 0.5rem 0 1rem;">• Android: Google Play → WireGuard<br>
                • iOS: App Store → WireGuard</p>
                
                <p><strong>Проблемы?</strong></p>
                <p>Напишите в поддержку: @VenompowerVPN_bot</p>
            </div>
        `;

		this.openModal();
	}

	handleNavigation(e) {
		const tab = e.currentTarget.dataset.tab;

		// Update active state
		document.querySelectorAll(".nav-item").forEach((item) => {
			item.classList.toggle("active", item.dataset.tab === tab);
		});

		// Handle tabs
		switch (tab) {
			case "profile":
				this.showProfile();
				break;
			case "servers":
				this.showServerList();
				break;
			case "home":
			default:
				break;
		}
	}

	openModal() {
		this.elements.modal?.classList.remove("hidden");
	}

	closeModal() {
		this.elements.modal?.classList.add("hidden");
	}

	showToast(message, type = "info") {
		const toast = this.elements.toast;
		const text = this.elements.toastText;

		text.textContent = message;
		toast.className = `toast ${type}`;
		toast.classList.remove("hidden");

		setTimeout(() => {
			toast.classList.add("hidden");
		}, 3000);
	}
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	window.vpnApp = new VPNApp();
});
