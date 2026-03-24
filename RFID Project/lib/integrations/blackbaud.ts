// Blackbaud SKY API client — OAuth 2.0 with client credentials / refresh token flow.
// NOTE: Blackbaud SKY API uses OAuth 2.0 Authorization Code flow (not client credentials).
// In production, the access token must be obtained via an admin consent flow and the
// refresh token stored securely. This implementation stores the token in-memory and
// refreshes before each API call when near expiry.
//
// If the SKY API does not expose the required endpoints (student list, schedule),
// fall back to CSV import: place a roster.csv / schedule.csv in /data/imports/ and
// set BLACKBAUD_USE_CSV_FALLBACK=true. The CSV format is documented in docs/integrations/.

const TOKEN_EXPIRY_BUFFER_MS = 60_000; // refresh 1 minute before expiry

export interface BlackbaudStudent {
  sisStudentKey: string;
  firstName: string;
  lastName: string;
  grade: string;
}

export interface BlackbaudSession {
  externalId: string;
  label: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  studentKeys: string[];
}

// Injectable HTTP fetch for testing
type FetchFn = typeof globalThis.fetch;

interface TokenResponse {
  access_token: string;
  expires_in: number; // seconds
  refresh_token?: string;
}

export class BlackbaudClient {
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;
  private refreshToken: string | null = null;

  private clientId: string;
  private clientSecret: string;
  private subscriptionKey: string;
  private _fetch: FetchFn;

  constructor(options?: {
    clientId?: string;
    clientSecret?: string;
    subscriptionKey?: string;
    fetch?: FetchFn;
    accessToken?: string;     // For testing — pre-set token
    refreshToken?: string;    // For testing — pre-set refresh token
  }) {
    this.clientId = options?.clientId ?? process.env.BLACKBAUD_CLIENT_ID ?? '';
    this.clientSecret = options?.clientSecret ?? process.env.BLACKBAUD_CLIENT_SECRET ?? '';
    this.subscriptionKey = options?.subscriptionKey ?? process.env.BLACKBAUD_SUBSCRIPTION_KEY ?? '';
    this._fetch = options?.fetch ?? globalThis.fetch;

    if (options?.accessToken) {
      this.accessToken = options.accessToken;
      this.tokenExpiresAt = Date.now() + 3600_000; // assume 1h
    }
    if (options?.refreshToken) {
      this.refreshToken = options.refreshToken;
    }
  }

  // ─── Token management ───────────────────────────────────────────────────────

  async ensureToken(): Promise<void> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS) {
      return; // token is still valid
    }

    if (this.refreshToken) {
      await this._refreshAccessToken();
    } else {
      throw new Error(
        'No Blackbaud access token or refresh token available. ' +
        'Complete the OAuth authorization flow first.',
      );
    }
  }

  private async _refreshAccessToken(): Promise<void> {
    const res = await this._fetch('https://oauth2.sky.blackbaud.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken!,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!res.ok) {
      throw new Error(`Blackbaud token refresh failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as TokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000;
    if (data.refresh_token) this.refreshToken = data.refresh_token;
  }

  // ─── API calls ──────────────────────────────────────────────────────────────

  private async _get<T>(path: string): Promise<T> {
    await this.ensureToken();

    const res = await this._fetch(`https://api.sky.blackbaud.com${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Bb-Api-Subscription-Key': this.subscriptionKey,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Blackbaud API error: ${res.status} ${res.statusText} — ${path}`);
    }

    return res.json() as Promise<T>;
  }

  // Fetch all active students from Blackbaud
  // NOTE: Adjust the endpoint path based on your Blackbaud environment configuration
  async getStudents(): Promise<BlackbaudStudent[]> {
    interface SkyStudentResponse {
      value: Array<{
        id: string;
        first_name: string;
        last_name: string;
        grade_level_label?: string;
      }>;
    }

    const data = await this._get<SkyStudentResponse>('/school/v1/users?roles=Student&marker=0');
    return data.value.map((s) => ({
      sisStudentKey: String(s.id),
      firstName: s.first_name,
      lastName: s.last_name,
      grade: s.grade_level_label ?? 'Unknown',
    }));
  }

  // Fetch gym schedule sessions from Blackbaud
  async getGymSchedule(): Promise<BlackbaudSession[]> {
    interface SkyScheduleResponse {
      value: Array<{
        id: string;
        room_name: string;
        start_time: string;
        end_time: string;
        student_ids?: string[];
      }>;
    }

    const data = await this._get<SkyScheduleResponse>('/school/v1/schedules/rooms');
    return data.value
      .filter((s) => /gym|gymnasium/i.test(s.room_name))
      .map((s) => ({
        externalId: String(s.id),
        label: s.room_name,
        scheduledStart: new Date(s.start_time),
        scheduledEnd: new Date(s.end_time),
        studentKeys: s.student_ids ?? [],
      }));
  }

  // For testing — expose token state
  getTokenState(): { hasToken: boolean; expiresAt: number } {
    return { hasToken: !!this.accessToken, expiresAt: this.tokenExpiresAt };
  }
}
