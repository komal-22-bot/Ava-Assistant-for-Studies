// ─────────────────────────────────────────────────────────────
//  Ava Chatbot — app.js
//  Talks to your Python FastAPI backend at localhost:8000
// ─────────────────────────────────────────────────────────────

const API_URL = "http://127.0.0.1:8000/chat";

// Stores full conversation so the backend keeps context
let history = [];
let busy    = false;

// ── Auto-grow textarea as user types ──────────────────────────
function autoGrow(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 100) + "px";
}

// ── Send on Enter (Shift+Enter = new line) ────────────────────
function onKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}

// ── Quick-reply chip clicked ──────────────────────────────────
function onChip(el) {
  document.getElementById("chatInput").value = el.textContent.trim();
  send();
}

// ── Scroll messages to bottom ─────────────────────────────────
function scrollBottom() {
  const el = document.getElementById("messages");
  el.scrollTop = el.scrollHeight;
}

// ── Show / hide the typing dots ───────────────────────────────
function showTyping(on) {
  document.getElementById("typingRow").classList.toggle("show", on);
  document.getElementById("sendBtn").disabled = on;
  scrollBottom();
}

// ── Add a chat bubble to the DOM ──────────────────────────────
function addBubble(role, text) {
  const messages = document.getElementById("messages");
  const typing   = document.getElementById("typingRow");

  const row = document.createElement("div");
  row.className = "msg-row " + role;

  // Light markdown: **bold** → <strong>, newline bullets
  const html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n- /g, "<br>• ")
    .replace(/\n/g, "<br>");

  if (role === "bot") {
    row.innerHTML = `
      <div class="msg-bot-avatar">🤖</div>
      <div class="bubble bot">${html}</div>
    `;
  } else {
    row.innerHTML = `<div class="bubble user">${html}</div>`;
  }

  // Insert before the typing indicator so dots stay at the bottom
  messages.insertBefore(row, typing);

  // Hide quick-reply chips after the first user message
  if (role === "user") {
    document.getElementById("chipsArea").style.display = "none";
  }

  scrollBottom();
}

// ── Main send function ────────────────────────────────────────
async function send() {
  const input = document.getElementById("chatInput");
  const text  = input.value.trim();

  if (!text || busy) return;

  busy = true;
  input.value = "";
  input.style.height = "auto";

  // Show user bubble immediately
  addBubble("user", text);
  history.push({ role: "user", content: text });

  // Show typing dots while waiting
  showTyping(true);

  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: text, history }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${res.status}`);
    }

    const data  = await res.json();
    const reply = data.reply || "Sorry, I had trouble responding.";

    // Add reply to history so context is preserved
    history.push({ role: "assistant", content: reply });

    showTyping(false);
    addBubble("bot", reply);

  } catch (err) {
    showTyping(false);
    addBubble(
      "bot",
      "⚠️ Couldn't reach the server. Make sure the backend is running on port 8000."
    );
    console.error("Ava error:", err);
  }

  busy = false;
  input.focus();
}