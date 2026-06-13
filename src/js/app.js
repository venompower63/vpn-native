// VPN App - Simple Version
import { api } from './api.js';
import { wireguard } from './wireguard.js';
import { CONFIG } from './config.js';

class VPNApp {
	constructor() {
		this.elements = {};
		this.selectedServer = localStorage.getItem("vpn_server") || "eu-1";
		this.init();
	}

	init() {
		console.log('VPN App: Starting...');
		
		// Cache DOM elements
		this.cacheElements();
		console.log('VPN App: Elements cached');
		
		// Setup event listeners
		this.setupEventListeners();
		console.log('VPN App: Events setup');
		
		// Check auth status
		this.checkAuth();
		console.log('VPN App: Auth checked');
		
		// Setup PWA
		this.setupPWA();
		console.log('VPN App: PWA setup');
		
		// Hide splash screen immediately
		this.hideSplash();
		console.log('VPN App: Ready');
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
			telegramAuth: document.getElementById("telegramAuth"),
			changeServerBtn: document.getElementById("changeServerBtn"),
			downloadConfigBtn: document.getElementById("downloadConfigBtn"),
			helpBtn: document.getElementById("helpBtn"),
			modalClose: document.getElementById("modalClose"),
			statusCard: document.getElementById("statusCard"),
			statusIndicator: document.getElementById("statusIndicator"),
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
		if (this.elements.connectBtn) {
			this.elements.connectBtn.addEventListener("click", () => this.toggleConnection());
		}
		if (this.elements.telegramAuth) {
			this.elements.telegramAuth.addEventListener("click", () => this.simulateAuth());
		}
		if (this.elements.modalClose) {
			this.elements.modalClose.addEventListener("click", () => this.closeModal());
		}
		if (this.elements.modal) {
			this.elements.modal.addEventListener("click", (e) => {
				if (e.target === this.elements.modal) this.closeModal();
			});
		}
		if (this.elements.changeServerBtn) {
			this.elements.changeServerBtn.addEventListener("click", () => this.showServerList());
		}
		if (this.elements.downloadConfigBtn) {
			this.elements.downloadConfigBtn.addEventListener("click", () => this.downloadConfig());
		}
		if (this.elements.helpBtn) {
			this.elements.helpBtn.addEventListener("click", () => this.showHelp());
		}
		if (this.elements.profileBtn) {
			this.elements.profileBtn.addEventListener("click", () => this.showProfile());
		}
	}

	setupPWA() {
		if ("serviceWorker" in navigator) {
			console.log('SW: supported');
		}
	}

	hideSplash() {
		console.log('Hiding splash...');
		if (this.elements.splash) {
			this.elements.splash.style.display = "none";
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
		if (this.elements.auth) this.elements.auth.style.display = "none";
		if (this.elements.app) this.elements.app.style.display = "flex";
	}

	showAuth() {
		if (this.elements.app) this.elements.app.style.display = "none";
		if (this.elements.auth) this.elements.auth.style.display = "flex";
	}

	simulateAuth() {
		const demoUser = { id: 7875416316, first_name: "Demo", last_name: "User", username: "demo_user" };
		api.storeUser(demoUser);
		localStorage.setItem("vpn_token", "demo_token_" + Date.now());
		this.showApp();
		this.loadUserData();
		this.showToast("Демо-режим!", "success");
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
		const daysLeft = Math.ceil((new Date(expires_at) - new Date()) / (1000 * 60 * 60 * 24));
		const progress = ((days_total - daysLeft) / days_total) * 100;

		if (this.elements.subBadge) {
			this.elements.subBadge.textContent = active ? "Активна" : "Истекла";
			this.elements.subBadge.className = `card-badge ${active ? "active" : "expired"}`;
		}
		if (this.elements.subPlan) this.elements.subPlan.textContent = plan;
		if (this.elements.subExpiry) this.elements.subExpiry.textContent = `До ${new Date(expires_at).toLocaleDateString("ru-RU")}`;
		if (this.elements.subProgress) this.elements.subProgress.style.width = `${100 - progress}%`;
		if (this.elements.subDays) this.elements.subDays.textContent = `${daysLeft} дней осталось`;
	}

	updateUI() {
		this.updateConnectionStatus(false);
	}

	updateConnectionStatus(connected, connecting = false) {
		if (this.elements.statusText) this.elements.statusText.textContent = connected ? "Подключено" : connecting ? "Подключение..." : "Отключено";
		if (this.elements.statusSubtext) this.elements.statusSubtext.textContent = connected ? "Ваше соединение защищено" : connecting ? "Пожалуйста, подождите" : "Нажмите для подключения";
		
		if (this.elements.connectBtn) {
			this.elements.connectBtn.className = `connect-btn ${connected ? "connected" : "disconnected"}`;
			const btnText = this.elements.connectBtn.querySelector(".btn-text");
			if (btnText) btnText.textContent = connected ? "Отключить" : "Подключить";
			this.elements.connectBtn.disabled = connecting;
		}
		
		if (this.elements.connectionInfo && connected) {
			this.elements.connectionInfo.style.display = "block";
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
			if (this.elements.ipAddress) this.elements.ipAddress.textContent = "10.0.0.2";
			if (this.elements.location) this.elements.location.textContent = "🇩🇪 Frankfurt";
			this.updateConnectionStatus(true);
			this.showToast("VPN подключен!", "success");
		}, 1500);
	}

	disconnect() {
		this.updateConnectionStatus(false);
		this.showToast("VPN отключен");
	}

	showServerList() {
		const servers = CONFIG.SERVERS.map((s) => 
			`<li class="server-item ${s.id === this.selectedServer ? "selected" : ""}" data-id="${s.id}">
				<span class="server-flag">${s.flag}</span>
				<div class="server-info">
					<div class="server-name">${s.name}</div>
					<div class="server-location">${s.location}</div>
				</div>
				<span class="server-ping">${s.ping}ms</span>
			</li>`
		).join("");

		if (this.elements.modalBody) {
			this.elements.modalBody.innerHTML = `<h3 class="modal-title">Выбор сервера</h3><ul class="server-list">${servers}</ul>`;
			const items = this.elements.modalBody.querySelectorAll(".server-item");
			items.forEach((item) => {
				item.addEventListener("click", () => {
					this.selectServer(item.dataset.id);
					this.closeModal();
				});
			});
		}
		this.openModal();
	}

	selectServer(serverId) {
		this.selectedServer = serverId;
		localStorage.setItem("vpn_server", serverId);
		this.showToast(`Сервер: ${CONFIG.SERVERS.find((s) => s.id === serverId)?.name}`);
	}

	downloadConfig() {
		const configText = wireguard.generateConfig({
			private_key: "demo_key",
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
		
		if (this.elements.modalBody) {
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
		}
		this.openModal();
	}

	showHelp() {
		if (this.elements.modalBody) {
			this.elements.modalBody.innerHTML = `
				<h3 class="modal-title">Помощь</h3>
				<div style="color: var(--text-secondary); line-height: 1.6;">
					<p><strong>Как подключиться?</strong></p>
					<p style="margin: 0.5rem 0;">1. Нажмите "Подключить"<br>2. Скачайте конфиг<br>3. Импортируйте в WireGuard</p>
					<p><strong>Проблемы?</strong></p>
					<p>@VenompowerVPN_bot</p>
				</div>
			`;
		}
		this.openModal();
	}

	openModal() {
		if (this.elements.modal) this.elements.modal.style.display = "flex";
	}

	closeModal() {
		if (this.elements.modal) this.elements.modal.style.display = "none";
	}

	showToast(message, type = "info") {
		if (this.elements.toast && this.elements.toastText) {
			this.elements.toastText.textContent = message;
			this.elements.toast.className = `toast ${type}`;
			this.elements.toast.style.display = "block";
			setTimeout(() => {
				if (this.elements.toast) this.elements.toast.style.display = "none";
			}, 3000);
		}
	}
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
	console.log('DOM Ready - Creating VPNApp');
	window.vpnApp = new VPNApp();
});
