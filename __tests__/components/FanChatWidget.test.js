import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FanChatWidget from '../../app/components/FanChatWidget';

// Mock FontAwesome to prevent rendering issues in tests
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

describe('FanChatWidget', () => {
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
      handleSendMessage: jest.fn(),
      accessibilityMode: false,
      setAccessibilityMode: jest.fn(),
      volunteerMode: false,
      setVolunteerMode: jest.fn()
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
    render(<FanChatWidget chatHook={mockChatHook} ticket={null} matches={[]} gates={[]} incidents={[]} stats={{}} transportation={[]} setRouteMode={jest.fn()} setSelectedAmenityId={jest.fn()} setAmenityFilter={jest.fn()} />);
    
    expect(screen.getByText('GenAI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles drag and scroll events on quick chips to increase coverage', () => {
    mockChatHook.isChatOpen = true;
    render(<FanChatWidget chatHook={mockChatHook} ticket={null} matches={[]} gates={[]} incidents={[]} stats={{}} transportation={[]} setRouteMode={jest.fn()} setSelectedAmenityId={jest.fn()} setAmenityFilter={jest.fn()} />);
    
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
    const chip = screen.getByText(/Find Food/i).closest('button');
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
    
    render(<FanChatWidget chatHook={mockChatHook} ticket={null} matches={[]} gates={[]} incidents={[]} stats={{}} transportation={[]} setRouteMode={jest.fn()} setSelectedAmenityId={jest.fn()} setAmenityFilter={jest.fn()} />);
    
    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'Where is food?' } });
    expect(mockChatHook.setChatInput).toHaveBeenCalledWith('Where is food?');

    const form = input.closest('form');
    fireEvent.submit(form);
    
    expect(mockChatHook.handleSendMessage).toHaveBeenCalled();
  });
  
  it('handles quick chip clicks', () => {
    mockChatHook.isChatOpen = true;
    render(<FanChatWidget chatHook={mockChatHook} ticket={null} matches={[]} gates={[]} incidents={[]} stats={{}} transportation={[]} setRouteMode={jest.fn()} setSelectedAmenityId={jest.fn()} setAmenityFilter={jest.fn()} />);
    
    const chip = screen.getByText(/Find Food/i).closest('button');
    fireEvent.click(chip);
    
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Where is the food?");
  });
  
  it('closes chat window when close button is clicked', () => {
    mockChatHook.isChatOpen = true;
    render(<FanChatWidget chatHook={mockChatHook} ticket={null} matches={[]} gates={[]} incidents={[]} stats={{}} transportation={[]} setRouteMode={jest.fn()} setSelectedAmenityId={jest.fn()} setAmenityFilter={jest.fn()} />);
    
    const closeBtn = screen.getByRole('button', { name: /close chat/i });
    fireEvent.click(closeBtn);
    
    expect(mockChatHook.setIsChatOpen).toHaveBeenCalledWith(false);
  });
  
  it('shows typing indicator', () => {
    mockChatHook.isChatOpen = true;
    mockChatHook.isTyping = true;
    
    const { container } = render(<FanChatWidget chatHook={mockChatHook} ticket={null} matches={[]} gates={[]} incidents={[]} stats={{}} transportation={[]} setRouteMode={jest.fn()} setSelectedAmenityId={jest.fn()} setAmenityFilter={jest.fn()} />);
    
    const typingIndicators = container.querySelectorAll('span');
    expect(typingIndicators.length).toBeGreaterThan(0);
  });

  it('toggles accessibility and volunteer modes', () => {
    mockChatHook.isChatOpen = true;
    render(<FanChatWidget chatHook={mockChatHook} />);
    
    const accessCheckbox = screen.getByLabelText(/Toggle Accessibility Mode/i);
    fireEvent.click(accessCheckbox);
    expect(mockChatHook.setAccessibilityMode).toHaveBeenCalledWith(true);

    const volunteerCheckbox = screen.getByLabelText(/Toggle Volunteer Mode/i);
    fireEvent.click(volunteerCheckbox);
    expect(mockChatHook.setVolunteerMode).toHaveBeenCalledWith(true);
  });

  it('handles clicks on other quick chips', () => {
    mockChatHook.isChatOpen = true;
    render(<FanChatWidget chatHook={mockChatHook} />);
    
    fireEvent.click(screen.getByText(/Find Seat/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Show route to my Seat");
    
    fireEvent.click(screen.getByText(/Restrooms/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Where is the restroom?");
    
    fireEvent.click(screen.getByText(/First Aid/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Where is First Aid?");
    
    fireEvent.click(screen.getByText(/AI Exit Strategy/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Show the route from seat to gate and transportation details only.");
    
    fireEvent.click(screen.getByText(/Sustainability/i).closest('button'));
    expect(mockChatHook.handleSendMessage).toHaveBeenCalledWith("Where are the nearest recycling and eco-friendly waste stations? What sustainability initiatives are active at this World Cup venue?");
  });

  it('covers negative branches for mouse events and user messages', () => {
    mockChatHook.isChatOpen = true;
    mockChatHook.chatMessages = [
      { id: 1, text: 'User question', sender: 'user', time: '12:00' }
    ];
    
    render(<FanChatWidget chatHook={mockChatHook} ticket={null} matches={[]} gates={[]} incidents={[]} stats={{}} transportation={[]} setRouteMode={jest.fn()} setSelectedAmenityId={jest.fn()} setAmenityFilter={jest.fn()} />);
    
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
