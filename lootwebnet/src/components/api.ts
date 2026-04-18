// src/components/api.ts
// (Adjust path depending on where you actually placed it)

const BASE_URL = '/api'; // Vite proxy will route this to https://localhost:7124

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // 1. Create a native Headers object and merge any incoming options.headers
    const headers = new Headers(options.headers);

    // 2. Set default Content-Type if it hasn't been set yet
    if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    // 3. Attach the Authorization token if the user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // 4. Perform the initial fetch request
    let response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // 5. JWT Refresh Interceptor
    if (response.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken) {
            try {
                // Call the backend refresh endpoint
                const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // C# DTOs typically expect an object wrapper, adjust if your specific endpoint expects just a string
                    body: JSON.stringify({ refreshToken })
                });

                if (refreshRes.ok) {
                    const newAuth = await refreshRes.json();

                    // Save the new tokens
                    localStorage.setItem('token', newAuth.token);
                    localStorage.setItem('refreshToken', newAuth.refreshToken);

                    // Update the header with the NEW token
                    headers.set('Authorization', `Bearer ${newAuth.token}`);

                    // RETRY the original request transparently
                    response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
                } else {
                    // Refresh token is invalid/expired
                    forceLogout();
                    throw new Error("Session expired. Please log in again.");
                }
            } catch (e) {
                forceLogout();
                throw new Error("Session expired. Please log in again.");
            }
        } else {
            // No refresh token available
            forceLogout();
            throw new Error("Unauthorized. Please log in.");
        }
    }

    // 6. General Error handling
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API Request Failed with status ${response.status}`);
    }

    // 7. Return parsed JSON
    return response.json() as Promise<T>;
}

// Helper to clear state and kick user back to login screen
function forceLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.reload();
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
};