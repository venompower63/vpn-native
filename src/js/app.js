// VPN App - Main Application
import { api } from "./api.js";
import { wireguard } from "./wireguard.js";
import { CONFIG } from "./config.js";

class VPNApp {
	constructor() {
		this.elements = {};
		this.selectedServer = localStorage.getItem("vpn_server") || "eu-1";
		this.connectionTimer = null;
		this.init();
	}

	init() {
		try {
			console.log("VPN App: Initializing...");

			// Cache DOM elements
			this.cacheElements();
			console.log("VPN App: Elements cached");

			// Setup event listeners
			this.setupEventListeners();
			console.log("VPN App: Events setup");

			// Check auth status - sync call
			this.checkAuth();
			console.log("VPN App: Auth checked");

			// Setup PWA
			this.setupPWA();
			console.log("VPN App: PWA setup");
		} catch (error) {
			console.error("VPN App init error:", error);
			alert("Error: " + error.message);
		} finally {
			// Always hide splash screen after short delay
			setTimeout(() => this.hideSplash(), 500);
			console.log("VPN App: Ready");
		}
	}

	cacheElements() {
		this.elements = {
			splash: document.getElementById("splash"),
			app: document.getElementById("app"),
			auth: document.getElementById("auth"),
			modal: document.getElementById("modal"),
			toast: document.getElementById("toast"),
			connectBtn: document.getElementById("connectBtn"),
			profileBtn: document.getElementById("profileBtn"),
			settingsBtn: document.getElementById("settingsBtn"),
			telegramAuth: document.getElementById("telegramAuth"),
			changeServerBtn: document.getElementById("changeServerBtn"),
			downloadConfigBtn: document.getElementById("downloadConfigBtn"),
			helpBtn: document.getElementById("helpBtn"),
			modalClose: document.getElementById("modalClose"),
			statusCard: document.getElementById("statusCard"),
			statusIndicator: document.getElementById("statusIndicator"),
			statusIcon: document.getElementById("statusIcon"),
			statusText: document.getElementById("statusText"),
			statusSubtext: document.getElementById("statusSubtext"),
			connectionInfo: document.getElementById("connectionInfo"),
			ipAddress: document.getElementById("ipAddress"),
			location: document.getElementById("location"),
			connectionTime: document.getElementById("connectionTime"),
			subBadge: document.getElementById("subBadge"),
			subPlan: document.getElementById("subPlan"),
			subExpiry: document.getElementById("subExpiry"),
			subProgress: document.getElementById("subProgress"),
			subDays: document.getElementById("subDays"),
			modalBody: document.getElementById("modalBody"),
			toastText: document.getElementById("toastText"),
		};
	}

	setupEventListeners() {
		this.elements.connectBtn?.addEventListener("click", () =>
			this.toggleConnection(),
		);
		this.elements.telegramAuth?.addEventListener("click", () =>
			this.authenticateWithTelegram(),
		);
		this.elements.modalClose?.addEventListener("click", () =>
			this.closeModal(),
		);
		this.elements.modal?.addEventListener("click", (e) => {
			if (e.target === this.elements.modal) this.closeModal();
		});
		this.elements.changeServerBtn?.addEventListener("click", () =>
			this.showServerList(),
		);
		this.elements.downloadConfigBtn?.addEventListener("click", () =>
			this.downloadConfig(),
		);
		this.elements.helpBtn?.addEventListener("click", () => this.showHelp());
		this.elements.profileBtn?.addEventListener("click", () =>
			this.showProfile(),
		);
		document.querySelectorAll(".nav-item").forEach((item) => {
			item.addEventListener("click", (e) => this.handleNavigation(e));
		});
	}

	setupPWA() {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker
				.register("sw.js")
				.then((reg) => console.log("SW registered"))
				.catch((err) => console.log("SW failed:", err));
		}
	}

	hideSplash() {
		if (this.elements.splash) {
			this.elements.splash.classList.add("fade-out");
			setTimeout(() => {
				this.elements.splash.classList.add("hidden");
			}, 500);
		}
	}

	checkAuth() {
		const storedUser = api.getStoredUser();
		if (api.isAuthenticated() && storedUser) {
			this.showApp();
			this.loadUserData();
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
		this.simulateAuth();
	}

	simulateAuth() {
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

	loadUserData() {
		this.loadSubscription();
		this.updateUI();
	}

	loadSubscription() {
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
		const { active, plan, expires_at, days_total } = this.subscription;
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
		this.updateConnectionStatus(false);
	}

	updateConnectionStatus(connected, connecting = false) {
		const indicator = this.elements.statusIndicator;
		const text = this.elements.statusText;
		const subtext = this.elements.statusSubtext;
		const btn = this.elements.connectBtn;
		const info = this.elements.connectionInfo;

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

	toggleConnection() {
		if (wireguard.connected) {
			this.disconnect();
		} else {
			this.connect();
		}
	}

	connect() {
		this.updateConnectionStatus(false, true);
		setTimeout(() => {
			this.elements.ipAddress.textContent = "10.0.0.2";
			this.elements.location.textContent = this.getServerLocation();
			this.updateConnectionStatus(true);
			this.startConnectionTimer();
			this.showToast("VPN подключен!", "success");
		}, 1000);
	}

	disconnect() {
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
			<li class="server-item ${s.id === this.selectedServer ? "selected" : ""}" data-id="${s.id}">
				<span class="server-flag">${s.flag}</span>
				<div class="server-info">
					<div class="server-name">${s.name}</div>
					<div class="server-location">${s.location}</div>
				</div>
				<span class="server-ping">${s.ping}ms</span>
			</li>
		`,
		).join("");

		this.elements.modalBody.innerHTML = `<h3 class="modal-title">Выбор сервера</h3><ul class="server-list">${servers}</ul>`;
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
	}

	downloadConfig() {
		const configText = wireguard.generateConfig({
			private_key: "demo_private_key",
			address: "10.0.0.2/32",
			server_public_key: "demo_server_key",
			endpoint: "vpn.example.com",
		});
		wireguard.downloadConfig(configText);
		this.showToast("Конфиг скачан!", "success");
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
					<div class="stat-item"><div class="stat-value">150</div><div class="stat-label">Дней использовано</div></div>
					<div class="stat-item"><div class="stat-value">30</div><div class="stat-label">Дней осталось</div></div>
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
				<p style="margin: 0.5rem 0 1rem;">1. Нажмите "Подключить"<br>2. Скачайте конфиг<br>3. Импортируйте в WireGuard</p>
				<p><strong>Проблемы?</strong></p>
				<p>@VenompowerVPN_bot</p>
			</div>
		`;
		this.openModal();
	}

	handleNavigation(e) {
		const tab = e.currentTarget.dataset.tab;
		document.querySelectorAll(".nav-item").forEach((item) => {
			item.classList.toggle("active", item.dataset.tab === tab);
		});
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
		setTimeout(() => toast.classList.add("hidden"), 3000);
	}
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	window.vpnApp = new VPNApp();
});
