// Autenticação local de desenvolvimento (sem Supabase)
// Troque essas credenciais se quiser:
const LOCAL_ADMIN_EMAIL = "admin@vipi.local";
const LOCAL_ADMIN_PASSWORD = "123456";

const AUTH_KEY = "vipi_auth_v1";

export interface LocalSession {
    user: { email: string };
    created_at: string;
}

export function localLogin(email: string, password: string): LocalSession | null {
    if (email === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD) {
        const session: LocalSession = { user: { email }, created_at: new Date().toISOString() };
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return session;
    }
    return null;
}

export function localLogout() {
    localStorage.removeItem(AUTH_KEY);
}

export function getLocalSession(): LocalSession | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as LocalSession; } catch { return null; }
}

export function isLocalLoggedIn(): boolean {
    return !!getLocalSession();
}
