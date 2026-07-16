import { render, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFanChat } from '@/app/hooks/useFanChat';

global.fetch = jest.fn();
const mockScrollIntoView = jest.fn();
document.getElementById = jest.fn(() => ({ scrollIntoView: mockScrollIntoView }));
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

function TestFanChat() {
  const {
    isChatOpen, setIsChatOpen,
    chatInput, setChatInput,
    isTyping, chatMessages,
    handleSendMessage
  } = useFanChat({
    ticket: { section: '101' },
    matches: [],
    gates: [],
    incidents: [],
    stats: [],
    transportation: [],
    setRouteMode: jest.fn(),
    setSelectedAmenityId: jest.fn(),
    setAmenityFilter: jest.fn()
  });

  return (
    <div>
      <div data-testid="chat-length">{chatMessages.length}</div>
      <div data-testid="is-typing">{String(isTyping)}</div>
      <input 
        data-testid="input" 
        value={chatInput} 
        onChange={(e) => setChatInput(e.target.value)} 
      />
      <button onClick={() => handleSendMessage()}>Send</button>
      <button onClick={() => handleSendMessage('Where is food?')} data-testid="send-direct">Send Direct Food</button>
      <button onClick={() => handleSendMessage('Where is the restroom?')} data-testid="send-direct-restroom">Send Direct Restroom</button>
      <button onClick={() => handleSendMessage('Where is the exit?')} data-testid="send-direct-exit">Send Direct Exit</button>
      <button onClick={() => handleSendMessage('Where is gate 5 seat 3?')} data-testid="send-direct-route">Send Direct Route</button>
    </div>
  );
}

describe('useFanChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles sending messages and AI stream', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => {
          let called = false;
          return {
            read: () => {
              if (!called) {
                called = true;
                return Promise.resolve({ done: false, value: new TextEncoder().encode('Hello **bold** user!') });
              }
              return Promise.resolve({ done: true });
            }
          };
        }
      }
    };
    global.fetch.mockResolvedValue(mockResponse);

    const user = userEvent.setup();
    render(<TestFanChat />);

    expect(screen.getByTestId('chat-length')).toHaveTextContent('1');
    
    await user.type(screen.getByTestId('input'), 'Hi');
    await user.click(screen.getByText('Send'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(global.fetch).toHaveBeenCalled();
  });
  
  it('handles different route intents (food, restroom, exit, route)', async () => {
     global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Failed' })
    });
    
    const user = userEvent.setup();
    render(<TestFanChat />);
    
    await user.click(screen.getByTestId('send-direct'));
    await user.click(screen.getByTestId('send-direct-restroom'));
    await user.click(screen.getByTestId('send-direct-exit'));
    await user.click(screen.getByTestId('send-direct-route'));
    await user.click(screen.getByText('Send'));
  });

  it('handles API 429 error without data.error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({})
    });
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    const user = userEvent.setup();
    render(<TestFanChat />);
    await user.click(screen.getByTestId('send-direct'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
    
    expect(alertSpy).toHaveBeenCalledWith('Your limit is over. Please try again later.');
    alertSpy.mockRestore();
  });
});
