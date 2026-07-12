import { useState } from "react";
import Chat from "./components/Chat.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(text) {
    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response.text },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-meesho-pink to-meesho-purple text-white py-6 px-4 shadow-md">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold">Meesho Pragati Agent</h1>
          <p className="text-sm opacity-90 mt-1">
            AI-powered assistant for seller growth
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-4">
        <Chat messages={messages} onSend={sendMessage} loading={loading} />
      </main>
    </div>
  );
}
