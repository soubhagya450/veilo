const RAW_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";
const DERIVED_API_URL = RAW_SOCKET_URL
  ? RAW_SOCKET_URL.replace(/^wss:\/\//i, "https://").replace(/^ws:\/\//i, "http://")
  : "";
const RAW_API_URL = import.meta.env.VITE_API_URL || DERIVED_API_URL || "";
const API_URL = RAW_API_URL.replace(/\/+$/, "");

/**
 * Fetch backend health status.
 */
export async function getHealth() {
  try {
    if (!API_URL) return null;
    const res = await fetch(`${API_URL}/api/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Health check error:", err);
    return null;
  }
}

/**
 * Request an anonymous session token and guest alias.
 */
export async function getSession(existingToken = null) {
  try {
    if (!API_URL) return null;
    const headers = { "Content-Type": "application/json" };
    if (existingToken) {
      headers["Authorization"] = `Bearer ${existingToken}`;
    }
    const res = await fetch(`${API_URL}/api/session`, {
      method: "POST",
      headers,
    });
    if (!res.ok) throw new Error(`Session request failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Session fetch error:", err);
    return null;
  }
}

/**
 * Check if a room code is valid and available.
 * Gracefully delegates to Socket.IO if REST API is unreachable or waking from cold start.
 */
export async function validateRoomCode(code) {
  const cleanCode = code ? code.trim().toUpperCase() : "";
  if (!cleanCode || cleanCode.length !== 8) {
    return {
      valid: false,
      available: false,
      message: "Room code must be 8 alphanumeric characters.",
    };
  }

  try {
    if (!API_URL) {
      // If no backend API URL is configured, let Socket.IO handle validation directly
      return { valid: true, available: true, message: "Validating via socket..." };
    }
    const res = await fetch(`${API_URL}/api/rooms/validate-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: cleanCode }),
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      // If server returned non-JSON (e.g. HTML 404 or proxy page), fallback to socket validation
      return { valid: true, available: true, message: "Connecting to room..." };
    }

    const data = await res.json();
    return {
      status: res.status,
      ...data,
    };
  } catch (err) {
    // If backend is sleeping/waking up on Render free tier or REST fetch timed out,
    // do NOT block user! Fallback gracefully to socket connection!
    return {
      valid: true,
      available: true,
      message: "Connecting via real-time channel...",
    };
  }
}
