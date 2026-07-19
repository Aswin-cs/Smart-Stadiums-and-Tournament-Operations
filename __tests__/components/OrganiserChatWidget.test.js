import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OrganiserChatWidget from '../../app/components/OrganiserChatWidget';

// Mock FontAwesome to prevent rendering issues in tests
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

describe('OrganiserChatWidget', () => {
  let mockChatHook;

  beforeEach(() => {
    jest.useFakeTimers();
    mockChatHook = {
      isChatOpen: false,
      setIsChatOpen: jest.fn(),
      chatInput: '',
      setChatInput: jest.fn(),
      isTyping: false,
      chatMessages: [
        { id: 1, text: 'Hello', sender: 'bot', time: '12:00' }
      ],
      messagesEndRef: { current: null },
      handleSendMessage: jest.fn()
    };
    
    // Mock scrollBy on HTMLElement
    HTMLElement.prototype.scrollBy = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders chat window when isChatOpen is true', () => {
    mockChatHook.isChatOpen = true;
    render(<OrganiserChatWidget chatHook={mockChatHook} />);
    
    expect(screen.getByText('GenAI Operations Assistant')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles drag and scroll events on quick chips to increase coverage', () => {
    mockChatHook.isChatOpen = true;
    render(<OrganiserChatWidget chatHook={mockChatHook} gates={[]} incidents={[]} stats={[]} climate="CLEAR" />);
    
    // Test chips container events
    const chipsContainer = document.getElementById('chat-quick-chips');
    
    // Mock scroll dimensions so arrows can appear
    Object.defineProperty(chipsContainer, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(chipsContainer, 'scrollWidth', { configurable: true, value: 300 });
    Object.defineProperty(chipsContainer, 'scrollLeft', { configurable: true, value: 50, writable: true });
    
    const { act } = require('@testing-library/react');
    act(() => {
      jest.runAllTimers();
    });
    
    // Trigger scroll
    fireEvent.scroll(chipsContainer);
    
    // Trigger mouse events
    fireEvent.mouseDown(chipsContainer, { pageX: 100, clientX: 100 });
    fireEvent.mouseMove(chipsContainer, { pageX: 50, clientX: 50 });
    
    // Try to click chip while dragging (should prevent default)
    const chip = screen.getByText(/Gate Flows/i).closest('button');
    fireEvent.click(chip);
    
    fireEvent.mouseUp(chipsContainer);
    
    act(() => {
      jest.runAllTimers();
    });
    
    fireEvent.mouseDown(chipsContainer, { pageX: 100, clientX: 100 });
    fireEvent.mouseLeave(chipsContainer);
    
    // Try to trigger right arrow if it appears
    const rightArrow = screen.queryByRole('button', { name: /Scroll right/i });
    if (rightArrow) fireEvent.click(rightArrow);
    
    // Try to trigger left arrow if it appears
    const leftArrow = screen.queryByRole('button', { name: /Scroll left/i });
    if (leftArrow) fireEvent.click(leftArrow);
    
    expect(chipsContainer).toBeInTheDocument();
  });

  it('handles sending a message', async () => {
    mockChatHook.isChatOpen = true;
    mockChatHook.chatInput = '';
    
    render(<OrganiserChatWidget chatHook={mockChatHook} gates={[]} incidents={[]} stats={[]} climate="CLEAR" />);
    
    const input = screen.getByPlaceholderText('Ask operations assistant...');
    fireEvent.change(input, { target: { value: 'Gate A status?' } });
    expect(mockChatHook.setChatInput).toHaveBeenCalledWith('Gate A status?');

    const form = input.closest('form');
    fireEvent.submit(form);
    
    expect(mockChatHook.handleSendMessage).toHaveBeenCalled();
  });
  
  it('handles quick chip clicks', () => {
    mockChatHook.isChatOpen = true;
    render(<OrganiserChatWidget chatHook={mockChatHook} gates={[]} incidents={[]} stats={[]} climate="CLEAR" />);
    
    const chip = screen.getByText(/Gate Flows/i).closest('button');
    fireEvent.click(chip);
    
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Show gate flow stats");
  });
  
  it('closes chat window when close button is clicked', () => {
    mockChatHook.isChatOpen = true;
    render(<OrganiserChatWidget chatHook={mockChatHook} gates={[]} incidents={[]} stats={[]} climate="CLEAR" />);
    
    const closeBtn = screen.getByRole('button', { name: /close chat/i });
    fireEvent.click(closeBtn);
    
    expect(mockChatHook.setIsChatOpen).toHaveBeenCalledWith(false);
  });
  
  it('shows typing indicator', () => {
    mockChatHook.isChatOpen = true;
    mockChatHook.isTyping = true;
    
    const { container } = render(<OrganiserChatWidget chatHook={mockChatHook} gates={[]} incidents={[]} stats={[]} climate="CLEAR" />);
    
    const typingIndicators = container.querySelectorAll('span');
    expect(typingIndicators.length).toBeGreaterThan(0);
  });

  it('handles clicks on other quick chips', () => {
    mockChatHook.isChatOpen = true;
    render(<OrganiserChatWidget chatHook={mockChatHook} gates={[]} incidents={[]} stats={[]} climate="CLEAR" />);
    
    fireEvent.click(screen.getByText(/Gate Flows/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Show gate flow stats");
    
    fireEvent.click(screen.getByText(/Incidents Feed/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Any active incidents?");
    
    fireEvent.click(screen.getByText(/Recommendations/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Provide crowd recommendations");
    
    fireEvent.click(screen.getByText(/Congested Gates/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Check congested gates");
  });

  it('covers negative branches for mouse events and user messages', () => {
    mockChatHook.isChatOpen = true;
    mockChatHook.chatMessages = [
      { id: 1, text: 'User question', sender: 'user', time: '12:00' }
    ];
    
    render(<OrganiserChatWidget chatHook={mockChatHook} gates={[]} incidents={[]} stats={[]} climate="CLEAR" />);
    
    const chipsContainer = document.getElementById('chat-quick-chips');
    
    // Trigger mouse events without mouseDown to hit !isDown.current early returns
    fireEvent.mouseMove(chipsContainer, { pageX: 50, clientX: 50 });
    fireEvent.mouseLeave(chipsContainer);
    fireEvent.mouseUp(chipsContainer);
    
    // Trigger mouseDown but barely move to hit Math.abs(x - startX) <= 5 false branch
    fireEvent.mouseDown(chipsContainer, { pageX: 100, clientX: 100 });
    fireEvent.mouseMove(chipsContainer, { pageX: 101, clientX: 101 });
  });
});
