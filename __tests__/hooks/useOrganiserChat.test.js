import { render, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOrganiserChat } from '@/app/hooks/useOrganiserChat';

global.fetch = jest.fn();
const mockScrollIntoView = jest.fn();
window.HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

function TestOrganiserChat() {
  const {
    isChatOpen, setIsChatOpen,
    chatInput, setChatInput,
    isTyping, chatMessages,
    handleSendMessage
  } = useOrganiserChat({
    gates: [],
    incidents: [],
    stats: []
  });

  return (
    <div>
      <div data-testid="chat-length">{chatMessages.length}</div>
      <input 
        data-testid="input" 
        value={chatInput} 
        onChange={(e) => setChatInput(e.target.value)} 
      />
      <button onClick={() => handleSendMessage()}>Send</button>
      <button onClick={() => handleSendMessage('Hello AI')} data-testid="send-direct">Send Direct</button>
    </div>
  );
}

describe('useOrganiserChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles successful API request', async () => {
    const mockResponse = {
      ok: true,
      body: {
        getReader: () => {
          let called = false;
          return {
            read: () => {
              if (!called) {
                called = true;
                return Promise.resolve({ done: false, value: new TextEncoder().encode('Hello organiser') });
              }
              return Promise.resolve({ done: true });
            }
          };
        }
      }
    };
    global.fetch.mockResolvedValue(mockResponse);

    const user = userEvent.setup();
    render(<TestOrganiserChat />);

    await user.type(screen.getByTestId('input'), 'Hi');
    await user.click(screen.getByText('Send'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('handles API error response', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Limit over' })
    });
    
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<TestOrganiserChat />);

    await user.click(screen.getByTestId('send-direct'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(alertSpy).toHaveBeenCalledWith('Limit over');
    alertSpy.mockRestore();
  });
  
  it('handles network error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));
    
    const user = userEvent.setup();
    render(<TestOrganiserChat />);

    await user.click(screen.getByTestId('send-direct'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
  });

  it('handles API 429 error without data.error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({})
    });
    
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<TestOrganiserChat />);

    await user.click(screen.getByTestId('send-direct'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    expect(alertSpy).toHaveBeenCalledWith('Your limit is over. Please try again later.');
    alertSpy.mockRestore();
  });

  it('handles API 500 error fallback', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({})
    });
    
    const user = userEvent.setup();
    render(<TestOrganiserChat />);

    await user.click(screen.getByTestId('send-direct'));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });
  });
});
