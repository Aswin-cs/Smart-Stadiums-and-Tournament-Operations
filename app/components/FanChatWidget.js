'use client';

import { useRef } from 'react';
import { useDragScroll } from '../hooks/useDragScroll';
import styles from '../fan/fan.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot, faXmark, faChevronLeft, faChevronRight,
  faTicket, faHamburger, faRestroom, faKitMedical,
  faTrainSubway, faPaperPlane, faLeaf, faGlobe
} from '@fortawesome/free-solid-svg-icons';

export default function FanChatWidget({ chatHook }) {
  const {
    isChatOpen, setIsChatOpen,
    chatInput, setChatInput,
    isTyping, chatMessages,
    messagesEndRef, handleSendMessage,
    accessibilityMode, setAccessibilityMode,
    volunteerMode, setVolunteerMode
  } = chatHook;

  const {
    containerRef: chipsRef,
    showLeftArrow,
    showRightArrow,
    updateScrollArrows,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
    scrollBy,
    isDragging
  } = useDragScroll({ deps: [isChatOpen], dragActiveClass: styles.dragActive });

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
            <div className={styles.chatHeaderTexts}>
              <h4 className={styles.chatTitle}>GenAI Assistant</h4>
              <p className={styles.chatSubtitle}>Multilingual • Online</p>
            </div>
          </div>
          <div className={styles.chatControls}>
            <label className={`${styles.chatToggleLabel} ${accessibilityMode ? styles.activeAccess : ''}`}>
              <input 
                type="checkbox" 
                checked={accessibilityMode} 
                onChange={(e) => setAccessibilityMode(e.target.checked)} 
                aria-label="Toggle Accessibility Mode"
                className={styles.hiddenCheckbox}
              />
              Access Mode
            </label>
            <label className={`${styles.chatToggleLabel} ${volunteerMode ? styles.activeVolunteer : ''}`}>
              <input 
                type="checkbox" 
                checked={volunteerMode} 
                onChange={(e) => setVolunteerMode(e.target.checked)} 
                aria-label="Toggle Volunteer Mode"
                className={styles.hiddenCheckbox}
              />
              Volunteer
            </label>
            <button className={styles.chatCloseBtn} onClick={() => setIsChatOpen(false)} aria-label="Close Chat">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
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
            <div className={`${styles.msgBubble} ${/[\u0600-\u06FF]/.test(msg.text) ? styles.rtlText : ''}`}>
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
            onClick={() => scrollBy(-120)}
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
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Show route to my Seat")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faTicket} /></span> Find Seat</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Where is the food?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faHamburger} /></span> Find Food</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Where is the restroom?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faRestroom} /></span> Restrooms</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Where is First Aid?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faKitMedical} /></span> First Aid</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Show the route from seat to gate and transportation details only.")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faTrainSubway} /></span> AI Exit Strategy</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Where are the nearest recycling and eco-friendly waste stations? What sustainability initiatives are active at this World Cup venue?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faLeaf} /></span> Sustainability</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "¿Dónde está la comida?")}><span className={styles.chipIcon}>🇪🇸</span> ¿Dónde está la comida?</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Où sont les toilettes ?")}><span className={styles.chipIcon}>🇫🇷</span> Où sont les toilettes ?</button>
          <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "أين المخرج؟")}><span className={styles.chipIcon}>🇸🇦</span> أين المخرج؟</button>
        </div>
        {showRightArrow && (
          <button
            className={`${styles.chatScrollBtn} ${styles.chatScrollBtnRight}`}
            onClick={() => scrollBy(120)}
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
          placeholder="Ask a question..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          aria-label="Ask a question"
        />
        <button type="submit" className={styles.chatSendBtn} aria-label="Send message">
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
      </form>
    </div>
  );
}
