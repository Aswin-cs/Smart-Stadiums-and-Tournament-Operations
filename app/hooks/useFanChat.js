import { useState, useRef, useEffect } from 'react';
import { getNearestAmenity } from '../lib/data/fan-data';
import { getCsrfToken } from '../lib/utils/csrf';

export function useFanChat({ ticket, matches, gates, incidents, stats, transportation, setRouteMode, setSelectedAmenityId, setAmenityFilter }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [volunteerMode, setVolunteerMode] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hi! ⚽ I'm your Stadium Assistant. I can help you navigate BMO Field, find restrooms, check emergency exits, or locate your seat. What do you need today?`,
      time: 'Now'
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    const stadiumSection = document.getElementById('stadium-mockup-section');
    if (stadiumSection) {
      stadiumSection.scrollIntoView({ behavior: 'smooth' });
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    const lower = msg.toLowerCase();
    const hasAny = (str, words) => words.some(w => new RegExp(`\\b${w}\\b`).test(str));

    const wantsFood = hasAny(lower, ['food', 'eat', 'burger', 'burgers', 'pizza', 'beer', 'snack', 'snacks', 'coffee', 'hotdog', 'hotdogs']);
    const wantsFacility = hasAny(lower, ['toilet', 'restroom', 'washroom', 'loo', 'bathroom']);
    const wantsEmergency = hasAny(lower, ['exit', 'emergency', 'medical', 'first aid']);
    const wantsAccessibility = hasAny(lower, ['wheelchair', 'accessible', 'sensory', 'disability', 'ramp']);
    const wantsAmenity = wantsFood || wantsFacility || wantsEmergency || wantsAccessibility;

    const fromGate = hasAny(lower, ['gate', 'entrance']);
    const fromSeat = hasAny(lower, ['seat', 'sit', 'row']);
    const isGenericRoute = hasAny(lower, ['route', 'path', 'ticket', 'direction', 'go to']);

    let targetFood = 'Burgers';
    let targetFacility = 'Restroom North';
    let targetEmergency = 'First Aid';
    let targetAccessibility = 'Wheelchair Ramp A';

    if (wantsAmenity) {
      targetFood = getNearestAmenity(ticket.section, 'food');
      targetFacility = getNearestAmenity(ticket.section, 'facility');
      targetEmergency = getNearestAmenity(ticket.section, 'emergency');
      targetAccessibility = getNearestAmenity(ticket.section, 'accessibility');
    }

    if (hasAny(lower, ['burger', 'burgers'])) targetFood = 'Burgers';
    if (hasAny(lower, ['pizza'])) targetFood = 'Pizza';
    if (hasAny(lower, ['hotdog', 'hotdogs'])) targetFood = 'Hot Dogs';
    if (hasAny(lower, ['beer'])) targetFood = 'Beer';
    if (hasAny(lower, ['snack', 'snacks'])) targetFood = 'Snacks';
    if (hasAny(lower, ['coffee'])) targetFood = 'Coffee';

    if (wantsFood) {
      setAmenityFilter('food');
      setSelectedAmenityId(targetFood);
    } else if (wantsFacility) {
      setAmenityFilter('facility');
      setSelectedAmenityId(targetFacility);
    } else if (wantsEmergency) {
      setAmenityFilter('emergency');
      setSelectedAmenityId(targetEmergency);
    } else if (wantsAccessibility) {
      setAmenityFilter('accessibility');
      setSelectedAmenityId(targetAccessibility);
      setAccessibilityMode(true);
    }

    if (wantsAmenity) {
      if (fromGate && fromSeat) setRouteMode('gate-seat-amenity');
      else if (fromGate) setRouteMode('gate-amenity');
      else setRouteMode('seat-amenity');
    } else if (fromGate || fromSeat || isGenericRoute) {
      setRouteMode('gate-seat');
    }

    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({ 
          from: 'fan', 
          message: msg, 
          ticket, 
          matches, 
          crowdDensityData: { gates, incidents, stats },
          transportationData: transportation,
          accessibilityMode: accessibilityMode,
          volunteerMode: volunteerMode,
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
        id: Date.now() + 1,
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
        id: Date.now() + 1,
        sender: 'bot',
        text: "I'm having trouble connecting right now, but I've updated the map for you if you asked for directions!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  return {
    isChatOpen, setIsChatOpen,
    chatInput, setChatInput,
    isTyping, chatMessages,
    messagesEndRef, handleSendMessage,
    accessibilityMode, setAccessibilityMode,
    volunteerMode, setVolunteerMode
  };
}
