const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Fetch backend health status.
 */
export async function getHealth() {
  try {
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
 */
export async function validateRoomCode(code) {
  try {
    const res = await fetch(`${API_URL}/api/rooms/validate-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    });
    const data = await res.json();
    return {
      status: res.status,
      ...data,
    };
  } catch (err) {
    return {
      valid: false,
      available: false,
      message: err.message || "Failed to reach server.",
    };
  }
}
