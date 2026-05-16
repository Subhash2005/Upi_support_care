import { useState, useRef, useEffect } from 'react'

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I am the AI UPI Support Agent. How can I help you with your transaction today?",
      sender: "bot"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef(null)
  
  // Initialize Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  
  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const sendMessage = async (textToSend) => {
    // Add user message to UI immediately
    const newMessages = [
      ...messages, 
      { id: Date.now(), text: textToSend, sender: "user" }
    ]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSend }),
      })

      const data = await response.json()
      
      setMessages([
        ...newMessages,
        { id: Date.now() + 1, text: data.reply, sender: "bot" }
      ])
      
      // Text-to-Speech the response
      speakText(data.reply);

    } catch (error) {
      console.error("Error communicating with API:", error)
      const errorMsg = "Sorry, I am having trouble connecting to the server. Please ensure the backend is running.";
      setMessages([
        ...newMessages,
        { id: Date.now() + 1, text: errorMsg, sender: "bot" }
      ])
      speakText(errorMsg);
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userText = input.trim();
    setInput('');
    await sendMessage(userText);
  }

  // Speak Text Function
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Optional: Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle Microphone Function
  const toggleMicrophone = () => {
    if (!recognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      // Stop any AI speech if user starts talking
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      recognition.start();
      setIsRecording(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsRecording(false);
        // Automatically send the transcribed text
        sendMessage(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
    }
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c0 1.1-.9 2-2 2s-2-.9-2-2a2 2 0 0 1 2-2z" />
            <path d="M19 12h-2c-1.1 0-2 .9-2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4c0-1.1-.9-2-2-2H7" />
            <path d="M22 12a10 10 0 1 0-20 0 10 10 0 0 0 20 0z" />
          </svg>
        </div>
        <div className="header-title">
          <h1>AI UPI Support</h1>
          <p>Online & Ready</p>
        </div>
      </div>

      <div className="chat-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form onSubmit={handleSend} className="input-form">
          <button 
            type="button" 
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleMicrophone}
            title={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your issue (e.g. Money debited but not received...)"
            className="input-field"
            disabled={isLoading}
          />
          <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
