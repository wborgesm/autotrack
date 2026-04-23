interface TraccarConfig {
  url: string;
  port: number;
  username: string;
  password: string;
}

export class TraccarService {
  private baseUrl: string;
  private port: number;
  private username: string;
  private password: string;

  constructor(config: TraccarConfig) {
    this.baseUrl = config.url.replace(/\/$/, "");
    this.port = config.port || 443;
    this.username = config.username;
    this.password = config.password;
  }

  private get headers(): HeadersInit {
    const auth = Buffer.from(`${this.username}:${this.password}`).toString("base64");
    return { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };
  }

  private getUrl(path: string): string {
    const protocol = this.port === 443 ? "https" : "http";
    const portPart = (this.port === 80 || this.port === 443) ? "" : `:${this.port}`;
    return `${protocol}://${this.baseUrl}${portPart}${path}`;
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = this.getUrl(path);
    const res = await fetch(url, { ...options, headers: { ...this.headers, ...options?.headers } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Traccar API error (${res.status}): ${text}`);
    }
    if (res.status === 204) return {} as T;
    return res.json();
  }

  async testConnection(): Promise<boolean> {
    try { await this.request("/api/devices"); return true; } catch { return false; }
  }
  async getDevices() { return this.request<any[]>("/api/devices"); }
  async getPositions(deviceId?: number) {
    const path = deviceId ? `/api/positions?deviceId=${deviceId}` : "/api/positions";
    return this.request<any[]>(path);
  }
  async getRoute(deviceId: number, from: Date, to: Date) {
    return this.request(`/api/reports/route?deviceId=${deviceId}&from=${from.toISOString()}&to=${to.toISOString()}`);
  }
}
