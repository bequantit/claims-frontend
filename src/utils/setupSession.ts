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

export const generateNewSessionId = () => {
    // Generate a new UUID and replace the existing session ID
    const oldId = sessionStorage.getItem("session_id");
    const newId = crypto.randomUUID();
    sessionStorage.setItem("session_id", newId);
    console.log('Generated new session ID:', newId);
    console.log('Previous session ID was:', oldId);
    console.log('sessionStorage now contains:', sessionStorage.getItem("session_id"));
    return newId;
};
  