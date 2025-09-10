// Autenticação local de desenvolvimento (sem Supabase)
// Troque essas credenciais se quiser:
const LOCAL_ADMIN_EMAIL = "admin@vipi.local";
const LOCAL_ADMIN_PASSWORD = "123456";
const AUTH_KEY = "vipi_auth_v1";
export function localLogin(email, password) {
    if (email === LOCAL_ADMIN_EMAIL && password === LOCAL_ADMIN_PASSWORD) {
        const session = { user: { email }, created_at: new Date().toISOString() };
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return session;
    }
    return null;
}
export function localLogout() {
    localStorage.removeItem(AUTH_KEY);
}
export function getLocalSession() {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function isLocalLoggedIn() {
    return !!getLocalSession();
}
