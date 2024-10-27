import { useState, useRef, useEffect, ChangeEvent } from "react";
import "./App.css";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Character {
  name: string;
  description: string;
  avatar: string;
}

interface Chunk {
  id: string;
  content: string;
}

function App() {
  const [ragMode, setRagMode] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [retrievedChunks, setRetrievedChunks] = useState<Chunk[]>([]);
  const [characters, setCharacters] = useState<Character[]>([
    {
      name: "Vicky",
      description:
        "Vicky is a redhead with freckles. She works in a bar, but dreams of owning it one day. She is chivalrous when it comes to protecting males, and holds a very traditional view of relationships. She has a drinking problem and values consent, but is capable of forcing the issue if she feels a male is running her around. Her penis is average for a futa.",
      avatar: "/avatars/vicky-avatar.png",
    },
    {
      name: "Suni",
      description:
        "Suni is a slender, athletic futa with short dark hair. She is very kind and sweet, and a big supporter of male rights. She is a gold-medal figure skater, into indie music and trivia/riddles. She has a female girlfriend named Sara. Her penis is small for a futa.",
      avatar: "/avatars/suni-avatar.png",
    },
    {
      name: "Shauna",
      description:
        "Shauna is a yandere character who becomes obsessed with the player. She views her male as a pet and will use extreme measures to train him. She has a history of violence. Her penis is average for a futa.",
      avatar: "/avatars/shauna-avatar.png",
    },
    {
      name: "Rye",
      description:
        "Rye is a wealthy noble's daughter who enjoys partying and casual encounters. She's sarcastic and snarky, but secretly prefers males with self-respect. Her penis is above average for a futa and thicker than most.",
      avatar: "/avatars/rye-avatar.png",
    },
    {
      name: "Claudia",
      description:
        "Claudia is a captain in the MREA (police equivalent). She believes in rewarding compliance and punishing resistance. She's skilled in various sexual techniques and is secretly in a relationship with Demetria. Her penis is above average for a futa.",
      avatar: "/avatars/claudia-avatar.png",
    },
    {
      name: "Demetria",
      description:
        "Demetria is the head of the Imperial Temple. She teaches male obedience and incorporates BDSM in spiritual relationships. She's in a secret relationship with Claudia and can be cold at first. Her penis is above average for a futa.",
      avatar: "/avatars/demetria-avatar.png",
    },
    {
      name: "Mallory",
      description:
        "Mallory is a devout temple acolyte who believes strongly in using pain to correct male behavior. She's sexually dominant but caring, and has ambitions for temple reform. Her penis is slightly above average for a futa.",
      avatar: "/avatars/mallory-avatar.png",
    },
    {
      name: "Sally",
      description:
        "Sally is the strongest futa alive, but somewhat dimwitted. She enjoys building dollhouses and wants to care for and dress up her male. She can accidentally hurt males due to her strength. Her penis is the largest of all characters.",
      avatar: "/avatars/sally-avatar.png",
    },
  ]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(
    characters[0]
  );
  const [systemPrompt, setSystemPrompt] = useState(characters[0].description);
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: systemPrompt },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = "/default-avatar.png"; // Set a default avatar image
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCharacters = characters.map((char) =>
          char.name === selectedCharacter.name
            ? { ...char, avatar: reader.result as string }
            : char
        );
        setCharacters(newCharacters);
        setSelectedCharacter({
          ...selectedCharacter,
          avatar: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleChunkAndAddToKnowledgeBase = async () => {
    if (!uploadedFile) return;

    // Here you would implement the logic to chunk the document and add it to the knowledge base
    // For this example, we'll just simulate it with a timeout
    setIsLoading(true);
    setTimeout(() => {
      const simulatedChunks: Chunk[] = [
        { id: "1", content: "Simulated chunk 1 from " + uploadedFile.name },
        { id: "2", content: "Simulated chunk 2 from " + uploadedFile.name },
      ];
      setChunks((prevChunks) => [...prevChunks, ...simulatedChunks]);
      setIsLoading(false);
      setUploadedFile(null);
    }, 2000);
  };

  const toggleRagMode = () => {
    setRagMode(!ragMode);
  };

  const handleSend = async () => {
    if (input.trim() === "") return;

    const newMessages = [...messages, { role: "user", content: input.trim() }];
    setMessages(newMessages as Message[]);
    setInput("");
    setIsLoading(true);

    try {
      // If RAG mode is on, we'll retrieve relevant chunks here
      if (ragMode) {
        // Simulating chunk retrieval
        const relevantChunks = chunks.slice(0, 2);
        setRetrievedChunks(relevantChunks);
      } else {
        // Clear retrieved chunks if RAG mode is off
        setRetrievedChunks([]);
      }

      // Rest of the existing handleSend logic...
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

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCharacter = characters.find(
      (char) => char.name === e.target.value
    );
    if (newCharacter) {
      setSelectedCharacter(newCharacter);
      setSystemPrompt(newCharacter.description);
      setMessages([
        { role: "system", content: newCharacter.description },
        ...messages.slice(1),
      ]);
    }
  };

  const clearChat = () => {
    setMessages([{ role: "system", content: systemPrompt }]);
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>Character Selection</h2>
        <select value={selectedCharacter.name} onChange={handleCharacterChange}>
          {characters.map((char) => (
            <option key={char.name} value={char.name}>
              {char.name}
            </option>
          ))}
        </select>
        <h2>Character Description</h2>
        <textarea
          value={systemPrompt}
          onChange={handleSystemPromptChange}
          placeholder="Enter character description here..."
        />
        <h2>RAG Mode</h2>
        <input type="file" onChange={handleFileUpload} />
        <button
          onClick={handleChunkAndAddToKnowledgeBase}
          disabled={!uploadedFile}
        >
          Chunk and Add to Knowledge Base
        </button>
        <button onClick={toggleRagMode}>
          {ragMode ? "Disable RAG Mode" : "Enable RAG Mode"}
        </button>
        {ragMode && (
          <div className="retrieved-chunks">
            <h3>Retrieved Chunks</h3>
            {retrievedChunks.map((chunk) => (
              <div key={chunk.id} className="chunk">
                {chunk.content}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="chat-container">
        <header className="chat-header">
          <h1>Futadomworld Character Chatbot</h1>
          <button onClick={clearChat}>Clear Chat</button>
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
            placeholder="Type your message here... (Shift + Enter for new line)"
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
