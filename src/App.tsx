import { useState, useRef, useEffect, ChangeEvent } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Chunk {
  id: string;
  content: string;
}

function App() {
  const [ragMode, setRagMode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [retrievedChunks, setRetrievedChunks] = useState<Chunk[]>([]);
  const [characterDescription, setCharacterDescription] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: characterDescription },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatHistory");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleClearKnowledgeBase = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://chatbotbe-7db4db575f60.herokuapp.com/clear",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Knowledge base cleared");
      setRetrievedChunks([]); // Clear the retrieved chunks
      setUploadedFile(null); // Clear the uploaded file
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the file input
      }
    } catch (error) {
      console.error("Error clearing knowledge base:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToKnowledgeBase = async () => {
    if (!uploadedFile) return;
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileContent = event.target?.result as string;

      try {
        const response = await fetch(
          "https://chatbotbe-7db4db575f60.herokuapp.com/chunk",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              document: fileContent,
              fileName: uploadedFile.name,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Create notification message with first 5 chunks
        const chunkPreview = data
          .slice(0, 5)
          .map((chunk: any) => chunk.text.substring(0, 50) + "...")
          .join("\n\n");
        const message = `Successfully chunked document:\n\n${chunkPreview}${
          data.length > 5 ? "\n\n..." : ""
        }`;
        toast.success(message, {
          position: "top-right",
          autoClose: 5000,
          closeOnClick: true,
          pauseOnHover: true,
          style: { whiteSpace: "pre-line" },
        });
      } catch (error) {
        console.error("Error chunking document:", error);
        toast.error("Failed to chunk document. Please try again.", {
          position: "top-right",
          autoClose: 5000,
        });
      } finally {
        setIsLoading(false);
        setUploadedFile(null);
      }
    };

    reader.readAsText(uploadedFile);
  };

  const toggleRagMode = () => {
    setRagMode(!ragMode);
  };

  const handleStartChat = () => {
    if (characterDescription.trim() === "") return;
    setIsChatEnabled(true);
  };

  const handleResetChat = () => {
    setCharacterDescription("");
    setMessages([{ role: "system", content: "" }]);
    setIsChatEnabled(false);
  };

  const handleSend = async () => {
    if (input.trim() === "" || !isChatEnabled) return;

    const newMessages = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMessages as Message[]);
    setInput("");
    setIsLoading(true);

    try {
      if (ragMode) {
        const response = await fetch(
          "https://chatbotbe-7db4db575f60.herokuapp.com/ragchat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: newMessages,
              model: "hermes3-405b",
            }),
          }
        );

        const data = await response.json();
        // Update retrieved chunks with the chunks from the response
        if (data.chunks) {
          setRetrievedChunks(data.chunks);
        }

        setMessages([
          ...newMessages,
          { role: "assistant", content: data.choices[0].message.content },
        ] as Message[]);
      } else {
        const response = await fetch(
          "https://chatbotbe-7db4db575f60.herokuapp.com/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: newMessages,
              model: "hermes3-405b",
            }),
          }
        );

        const data = await response.json();
        setMessages([
          ...newMessages,
          { role: "assistant", content: data.choices[0].message.content },
        ] as Message[]);
        setRetrievedChunks([]);
      }
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
    if (!isChatEnabled) {
      const newSystemPrompt = e.target.value;
      setCharacterDescription(newSystemPrompt);
      setMessages([{ role: "system", content: newSystemPrompt }]);
    }
  };

  return (
    <div className="app-container">
      <ToastContainer />
      <div className="sidebar">
        <h2>Character Description</h2>
        <textarea
          value={characterDescription}
          onChange={handleSystemPromptChange}
          placeholder="Enter character description here..."
          disabled={isChatEnabled}
        />
        <div className="chat-controls">
          <button
            onClick={handleStartChat}
            disabled={isChatEnabled || characterDescription.trim() === ""}
          >
            Start Chat
          </button>
          <button onClick={handleResetChat}>Reset Chat</button>
        </div>
        <h2>RAG Mode</h2>
        <div className={`rag-mode-panel ${ragMode ? "enabled" : ""}`}>
          <div className="file-upload-row">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={!ragMode}
              ref={fileInputRef}
            />
            <button
              className={`toggle-rag-button ${ragMode ? "enabled" : ""}`}
              onClick={toggleRagMode}
            >
              {ragMode ? "Disable RAG" : "Enable RAG"}
            </button>
          </div>
          <div className="knowledge-base-controls">
            <button
              onClick={handleAddToKnowledgeBase}
              disabled={!ragMode || !uploadedFile}
            >
              Add Document
            </button>
            <button onClick={handleClearKnowledgeBase} disabled={!ragMode}>
              Clear Documents
            </button>
          </div>
          <div className="retrieved-chunks">
            <h3>Retrieved Chunks</h3>
            {retrievedChunks.map((chunk) => (
              <div key={chunk.id} className="chunk">
                {chunk.content}
              </div>
            ))}
            {retrievedChunks.length === 0 && (
              <div className="chunk">No chunks retrieved</div>
            )}
          </div>
        </div>
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
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isChatEnabled
                ? "Type your message here... (Shift + Enter for new line)"
                : "Chat disabled. Enter character description to enable chat"
            }
            disabled={!isChatEnabled}
          />
          <button onClick={handleSend} disabled={isLoading || !isChatEnabled}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
