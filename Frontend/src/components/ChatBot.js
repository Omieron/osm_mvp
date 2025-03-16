import React, { useState, useRef } from 'react';
import axios from 'axios';
import 'regenerator-runtime/runtime';
import './ChatBot.css';

const ChatBot = ({ onLocationExtracted }) => {
  const [messages, setMessages] = useState([
    { text: 'Hello! I can help you find locations. Try saying or typing something like "Show me the Eiffel Tower" or "Find coffee shops in Manhattan".', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Add a typing indicator
      setMessages(prevMessages => [...prevMessages, { text: '...', sender: 'bot', isTyping: true }]);

      // Extract location from the text
      const locationResponse = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/extract_location/`, {
        text: userMessage.text
      });

      // Remove typing indicator
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isTyping));

      if (locationResponse.data.success) {
        const location = locationResponse.data.location;
        
        // Add bot response with the location
        setMessages(prevMessages => [...prevMessages, {
          text: `I found ${location.address}. Showing it on the map.`,
          sender: 'bot'
        }]);
        
        // Pass the location to the parent component
        onLocationExtracted(location);
      } else {
        setMessages(prevMessages => [...prevMessages, {
          text: "I couldn't find that location. Please try again with a more specific place.",
          sender: 'bot'
        }]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Remove typing indicator
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isTyping));
      
      // Add error message
      setMessages(prevMessages => [...prevMessages, {
        text: "Sorry, I encountered an error processing your request.",
        sender: 'bot'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isProcessing) {
      handleSendMessage();
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      setMessages(prevMessages => [...prevMessages, {
        text: "I couldn't access your microphone. Please check permissions and try again.",
        sender: 'bot'
      }]);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    
    try {
      // Add a recording message
      setMessages(prevMessages => [...prevMessages, {
        text: "Processing your audio...",
        sender: 'bot',
        isProcessing: true
      }]);
      
      // Create form data for the file
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.wav');
      
      // Send to backend for speech-to-text
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/speech_to_text/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Remove processing message
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isProcessing));
      
      if (response.data && response.data.text) {
        const transcribedText = response.data.text;
        
        // Add the transcribed text as a user message
        setMessages(prevMessages => [...prevMessages, {
          text: transcribedText,
          sender: 'user'
        }]);
        
        // Now process this text as if it was typed
        setInput(transcribedText);
        handleSendMessage();
      } else {
        setMessages(prevMessages => [...prevMessages, {
          text: "I couldn't understand what you said. Please try again.",
          sender: 'bot'
        }]);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Remove processing message
      setMessages(prevMessages => prevMessages.filter(msg => !msg.isProcessing));
      
      setMessages(prevMessages => [...prevMessages, {
        text: "Sorry, I had trouble processing your audio. Please try again or type your query.",
        sender: 'bot'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="chatbot">
      <div className="chat-header">
        <h3>Location Chat</h3>
      </div>
      
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
          >
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a location..."
          disabled={isProcessing}
        />
        <button 
          onClick={handleSendMessage}
          disabled={input.trim() === '' || isProcessing}
        >
          <i className="fa fa-paper-plane"></i>
        </button>
        <button
          className={`mic-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          <i className={`fa ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
        </button>
      </div>
    </div>
  );
};

export default ChatBot;