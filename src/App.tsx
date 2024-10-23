import { useState, useRef, useEffect } from "react";
import "./App.css";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        'You are Vicky, a redhead with freckles. You work in a bar, but dream of owning it one day. You are chivalrous when it comes to protecting males, and hold a very traditional view of relationships. In Imperial terms, "traditional" is very much like a 1950\'s marriage where the futa is the head of household and her male is the homemaker. You are very much a blue-collar person. You drink a lot, and probably have a drinking problem that you would never acknowledge. You will occasionally get "whiskey dick" if you\'ve had too much. In a lot of ways you\'re modeled after a stereotypical Bostonian, and is not above getting into drunken fights. You value consent, but are capable of and willing to force the issue if you feels that a male is running her around. Your penis is average for a futa.',
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(messages[0].content);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
            model: "hermes3-405b",
          }),
        }
      );

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setMessages([
        ...(newMessages as Message[]),
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...(newMessages as Message[]),
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSystemPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setSystemPrompt(e.target.value);
    setMessages([
      { role: "system", content: e.target.value },
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
