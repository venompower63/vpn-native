// VPN App - WireGuard Module
// Handles WireGuard VPN connection in browser

class WireGuardManager {
	constructor() {
		this.connected = false;
		this.config = null;
		this.stats = {
			bytesReceived: 0,
			bytesSent: 0,
			lastHandshake: null,
		};
		this.connectionStart = null;
		this.reconnectAttempts = 0;
	}

	// Parse WireGuard config file
	parseConfig(configText) {
		try {
			const config = {
				interface: {},
				peer: {},
			};

			let section = null;
			const lines = configText.split("\n");

			for (const line of lines) {
				const trimmed = line.trim();

				if (trimmed === "[Interface]") {
					section = "interface";
				} else if (trimmed === "[Peer]") {
					section = "peer";
				} else if (section && trimmed && !trimmed.startsWith("#")) {
					const [key, ...valueParts] = trimmed.split("=");
					const value = valueParts.join("=").trim();

					if (section === "interface") {
						config.interface[key.trim()] = value;
					} else {
						config.peer[key.trim()] = value;
					}
				}
			}

			return config;
		} catch (error) {
			console.error("Config parse error:", error);
			throw new Error("Неверный формат конфига");
		}
	}

	// Generate config from server response
	generateConfig(serverConfig) {
		return `[Interface]
PrivateKey = ${serverConfig.private_key}
Address = ${serverConfig.address}
DNS = ${CONFIG.WG_DNS}

[Peer]
PublicKey = ${serverConfig.server_public_key}
Endpoint = ${serverConfig.endpoint}:${CONFIG.WG_PORT}
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 25
`;
	}

	// Import config from file
	async importConfigFromFile() {
		return new Promise((resolve, reject) => {
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".conf";

			input.onchange = async (e) => {
				const file = e.target.files[0];
				if (!file) {
					reject(new Error("Файл не выбран"));
					return;
				}

				try {
					const text = await file.text();
					const config = this.parseConfig(text);
					this.config = config;
					resolve(config);
				} catch (error) {
					reject(error);
				}
			};

			input.click();
		});
	}

	// Connect to VPN (using available browser APIs)
	async connect() {
		if (this.connected) {
			console.log("Already connected");
			return true;
		}

		try {
			// Check if WebAssembly WireGuard is available
			if (this.checkNativeSupport()) {
				await this.connectNative();
			} else {
				// Fallback: Download config for manual import
				await this.connectFallback();
			}

			this.connected = true;
			this.connectionStart = new Date();
			this.reconnectAttempts = 0;

			return true;
		} catch (error) {
			console.error("Connection error:", error);
			throw error;
		}
	}

	// Check for native browser support
	checkNativeSupport() {
		// Check for WireGuard in-browser implementation
		// This could be wg-js or similar library
		return typeof window.WireGuard !== "undefined";
	}

	// Native connection (requires wg-js library)
	async connectNative() {
		// This would use an actual WireGuard implementation
		// For now, we'll use the fallback
		return this.connectFallback();
	}

	// Fallback: Open WireGuard app with config
	async connectFallback() {
		if (!this.config) {
			throw new Error("Конфиг не загружен");
		}

		// Generate config text
		const configText = this.generateConfig({
			private_key: this.config.interface.PrivateKey,
			address: this.config.interface.Address,
			server_public_key: this.config.peer.PublicKey,
			endpoint: this.config.peer.Endpoint.split(":")[0],
		});

		// Create and download config file
		this.downloadConfig(configText);

		// Try to open WireGuard app on mobile
		this.openWireGuardApp();

		// Mark as connected (user needs to import config manually)
		this.connected = true;
		this.connectionStart = new Date();

		return true;
	}

	// Download config file
	downloadConfig(configText) {
		const blob = new Blob([configText], { type: "application/x-wireguard" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = "vpn-config.conf";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Open WireGuard app
	openWireGuardApp() {
		// Try to detect mobile platform and open WireGuard app
		const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
		const isAndroid = /Android/.test(navigator.userAgent);

		if (isIOS) {
			// iOS: Use custom URL scheme
			window.location.href = "wireguard://import-config";
		} else if (isAndroid) {
			// Android: Use custom URL scheme or intent
			window.location.href = "wireguard://import-config";
		}
	}

	// Disconnect
	disconnect() {
		if (!this.connected) return;

		this.connected = false;
		this.connectionStart = null;
		this.stats = {
			bytesReceived: 0,
			bytesSent: 0,
			lastHandshake: null,
		};

		// Disconnect native implementation if available
		if (this.nativeConnection) {
			this.nativeConnection.close();
			this.nativeConnection = null;
		}
	}

	// Get connection status
	getStatus() {
		return {
			connected: this.connected,
			uptime: this.connected ? this.getUptime() : 0,
			stats: this.stats,
		};
	}

	// Get uptime in seconds
	getUptime() {
		if (!this.connectionStart) return 0;
		return Math.floor((new Date() - this.connectionStart) / 1000);
	}

	// Format uptime
	formatUptime(seconds) {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}ч ${minutes}м ${secs}с`;
		} else if (minutes > 0) {
			return `${minutes}м ${secs}с`;
		}
		return `${secs}с`;
	}

	// Reconnect on failure
	async reconnect() {
		if (this.reconnectAttempts >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
			throw new Error("Превышено максимальное количество попыток");
		}

		this.reconnectAttempts++;
		this.disconnect();

		await new Promise((resolve) => setTimeout(resolve, CONFIG.RECONNECT_DELAY));
		return this.connect();
	}

	// Check if VPN is allowed in browser
	checkBrowserSupport() {
		// Check for required APIs
		const hasWebAssembly = typeof WebAssembly !== "undefined";
		const hasWebSocket = typeof WebSocket !== "undefined";
		const hasFileReader = typeof FileReader !== "undefined";

		return hasWebAssembly && hasWebSocket && hasFileReader;
	}

	// Get supported connection methods
	getSupportedMethods() {
		const methods = [];

		if (this.checkNativeSupport()) {
			methods.push("native");
		}

		if ("createObjectURL" in URL) {
			methods.push("download");
		}

		if (this.checkBrowserSupport()) {
			methods.push("wasm");
		}

		return methods;
	}
}

// VPN State Manager
class VPNStateManager {
	constructor() {
		this.state = {
			connected: false,
			connecting: false,
			server: null,
			lastError: null,
		};
		this.listeners = [];
	}

	subscribe(callback) {
		this.listeners.push(callback);
		return () => {
			this.listeners = this.listeners.filter((l) => l !== callback);
		};
	}

	notify() {
		this.listeners.forEach((callback) => callback(this.state));
	}

	setState(updates) {
		this.state = { ...this.state, ...updates };
		this.notify();
	}

	getState() {
		return this.state;
	}
}

// Global instances
export const wireguard = new WireGuardManager();
export const vpnState = new VPNStateManager();
