import { useState, useEffect, useRef } from "react";

function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!prompt.trim()) return;

  const userMessage = { sender: "user", text: prompt };
  setMessages((prev) => [...prev, userMessage]);
  setPrompt("");
  setLoading(true);
 console.log(userMessage.text);
  try {
    const res = await fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userMessage.text }),
    });

    // Try parsing as JSON, fallback to text if it fails
    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { answer: text || "No answer." };
    }

    const aiMessage = { sender: "ai", text: data.answer || "No answer." };
    setMessages((prev) => [...prev, aiMessage]);
  } catch (err) {
    console.error(err);
    const errorMessage = { sender: "ai", text: "Something went wrong 😢" };
    setMessages((prev) => [...prev, errorMessage]);
  }

  setLoading(false);
};


  return (
    <div style={styles.container}>
      <header style={styles.header}>
        🌤️ Weather Assistant <span style={styles.sub}>– Powered by AI Agents</span>
      </header>

      <div style={styles.chatBox}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={msg.sender === "user" ? styles.userMessage : styles.aiMessage}
          >
            {msg.text}
          </div>
        ))}

        {loading && (
          <div style={styles.aiMessage}>
            <span className="typing">...</span>
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <input
          style={styles.input}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask me about the weather..."
          required
        />
        <button style={styles.button} type="submit">
          Ask
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "50px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    borderRadius: "15px",
    border: "2px solid #4CAF50",
    background: "linear-gradient(to bottom, #e0f7fa, #ffffff)",
    display: "flex",
    flexDirection: "column",
    height: "80vh",
  },
  header: {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: "20px",
    color: "#00695c",
  },
  sub: {
    fontSize: "14px",
    color: "#004d40",
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    backgroundColor: "#ffffff",
  },
  userMessage: {
    textAlign: "right",
    backgroundColor: "#c8e6c9",
    color: "#1b5e20",
    padding: "10px",
    borderRadius: "15px",
    margin: "5px 0",
    maxWidth: "80%",
    alignSelf: "flex-end",
  },
  aiMessage: {
    textAlign: "left",
    backgroundColor: "#b2dfdb",
    color: "#004d40",
    padding: "10px",
    borderRadius: "15px",
    margin: "5px 0",
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  form: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#00695c",
    color: "white",
    cursor: "pointer",
  },
};

export default App;
