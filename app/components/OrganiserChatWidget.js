'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '../organiser/organiser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faXmark, faChevronLeft, faChevronRight,
  faDoorOpen, faUsers, faExclamationTriangle, faLightbulb, faPaperPlane, faGlobe
} from '@fortawesome/free-solid-svg-icons';

export default function OrganiserChatWidget({ chatHook }) {
  const {
    isChatOpen, setIsChatOpen,
    chatInput, setChatInput,
    isTyping, chatMessages,
    messagesEndRef, handleSendMessage
  } = chatHook;

  const chipsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateScrollArrows = () => {
    const el = chipsRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        updateScrollArrows();
      }, 150);
      window.addEventListener('resize', updateScrollArrows);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateScrollArrows);
      };
    }
  }, [isChatOpen]);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDragging = useRef(false);

  const handleMouseDown = (e) => {
    const el = chipsRef.current;
    isDown.current = true;
    isDragging.current = false;
    el.classList.add(styles.dragActive);
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseLeave = () => {
    if (!isDown.current) return;
    isDown.current = false;
    const el = chipsRef.current;
    el.classList.remove(styles.dragActive);
  };

  const handleMouseUp = () => {
    if (!isDown.current) return;
    isDown.current = false;
    const el = chipsRef.current;
    el.classList.remove(styles.dragActive);
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const el = chipsRef.current;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(x - startX.current) > 5) {
      isDragging.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleChipClick = (e, text) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleSendMessage(text);
  };

  if (!isChatOpen) return null;

  return (
    <div className={styles.chatWindow} id="chat-window">
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderInfo}>
          <div className={styles.chatAvatar}>
            <FontAwesomeIcon icon={faRobot} />
            <span className={styles.avatarOnline} />
          </div>
          <div>
            <h4 className={styles.chatTitle}>Operations Assistant</h4>
            <p className={styles.chatSubtitle}>AI Support • Online</p>
          </div>
        </div>
        <button className={styles.chatCloseBtn} onClick={() => setIsChatOpen(false)} aria-label="Close chat">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* Messages */}
      <div className={styles.chatMessagesContainer}>
        {chatMessages.map(msg => (
          <div key={msg.id} className={`${styles.chatMessage} ${msg.sender === 'user' ? styles.chatMessageUser : styles.chatMessageBot}`}>
            {msg.sender === 'bot' && (
              <div className={styles.msgAvatar}>
                <FontAwesomeIcon icon={faRobot} />
              </div>
            )}
            <div className={styles.msgBubble}>
              <p className={styles.msgText}>{msg.text}</p>
              <span className={styles.msgTime}>{msg.time}</span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.chatMessage} ${styles.chatMessageBot}`}>
            <div className={styles.msgAvatar}>
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className={styles.msgBubble}>
              <div className={styles.typingIndicator}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Options / Chips */}
      <div className={styles.chatQuickChipsContainer}>
        {showLeftArrow && (
          <button
            className={`${styles.chatScrollBtn} ${styles.chatScrollBtnLeft}`}
            onClick={() => {
              const el = chipsRef.current;
              el.scrollBy({ left: -120, behavior: 'smooth' });
            }}
            type="button"
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        )}
        <div
          className={styles.chatQuickChips}
          id="chat-quick-chips"
          ref={chipsRef}
          onScroll={updateScrollArrows}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Check congested gates")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faDoorOpen} /></span> Congested Gates</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Show gate flow stats")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faUsers} /></span> Gate Flows</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Any active incidents?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faExclamationTriangle} /></span> Incidents Feed</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Provide crowd recommendations")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faLightbulb} /></span> Recommendations</button>
        </div>
        {showRightArrow && (
          <button
            className={`${styles.chatScrollBtn} ${styles.chatScrollBtnRight}`}
            onClick={() => {
              const el = chipsRef.current;
              el.scrollBy({ left: 120, behavior: 'smooth' });
            }}
            type="button"
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
      </div>

      {/* Input Footer */}
      <div className={styles.chatMultilingualHint}>
        <FontAwesomeIcon icon={faGlobe} /> Type in any language — I&apos;ll reply in yours
      </div>
      <form className={styles.chatInputArea} onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
        <input
          type="text"
          className={styles.chatInput}
          placeholder="Ask operations assistant..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          aria-label="Ask operations assistant"
        />
        <button type="submit" className={styles.chatSendBtn} aria-label="Send message">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
}
