import { useState, useRef, useEffect } from "react";
import "./App.css";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function App() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: systemPrompt },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "") return;

    const newMessages = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMessages as Message[]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://chatbotbe-7db4db575f60.herokuapp.com/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            model: "hermes3-405b-fp8-128k",
          }),
        }
      );

      const data = await response.json();
      setMessages([
        ...newMessages,
        { role: "assistant", content: data.choices[0].message.content },
      ] as Message[]);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ] as Message[]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const newSystemPrompt = e.target.value;
    setSystemPrompt(newSystemPrompt);
    setMessages([
      { role: "system", content: newSystemPrompt },
      ...messages.slice(1),
    ]);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Character Description</h2>
        <textarea
          value={systemPrompt}
          onChange={handleSystemPromptChange}
          placeholder="Enter character description here..."
        />
      </div>
      <div className="chat-container">
        <header className="chat-header">
          <h1>Futadomworld Character Chatbot</h1>
        </header>
        <div className="chat-messages">
          {messages.slice(1).map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message here..."
          />
          <button onClick={handleSend} disabled={isLoading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
