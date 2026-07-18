import { useState, useRef, useEffect } from 'react';

export function useOrganiserChat({ gates, incidents, stats }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Welcome to the FIFA WC 2026 Operations Center. 🛡️ I am your Operations Assistant. How can I help you manage the stadium, gates, or active incidents today?`,
      time: 'Now'
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    const userMsg = {
      id: Date.now() + Math.random(),
      sender: 'user',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'organiser',
          message: msg,
          crowdDensityData: {
            gates: gates,
            incidents: incidents,
            stats: stats
          },
          stream: true
        }),
      });

      if (!response.ok) {
        setIsTyping(false);
        const data = await response.json();
        // Error handled silently
        if (response.status === 429) {
          alert(data?.error || 'Your limit is over. Please try again later.');
          return;
        }
        throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);
      }

      setIsTyping(false);
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        sender: 'bot',
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botReply += decoder.decode(value, { stream: true });
        
        const cleanReply = botReply
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^#+\s*/gm, '')
          .trimStart();

        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = cleanReply;
          return newMsgs;
        });
      }
    } catch (error) {
      setIsTyping(false);
      // Chat AI Error handled by UI fallback
      setChatMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        sender: 'bot',
        text: "Operations Alert: Having trouble reaching the AI Operations Support system. Please check your network connection.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  return {
    isChatOpen, setIsChatOpen,
    chatInput, setChatInput,
    isTyping, chatMessages,
    messagesEndRef, handleSendMessage
  };
}
