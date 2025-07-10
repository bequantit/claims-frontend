// setupSession.ts
export const setupSessionId = () => {
    // Clear session ID on reload
    window.addEventListener("beforeunload", () => {
      sessionStorage.removeItem("session_id");
    });
  
    // Generate new if missing
    let id = sessionStorage.getItem("session_id");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("session_id", id);
    }
  
    return id;
  };
  