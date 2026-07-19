import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FanTicketManager from '../../app/components/FanTicketManager';
import { defaultTicket } from '../../app/lib/data/fan-data';

// Mock TicketPreview to simplify testing
jest.mock('../../app/components/TicketPreview', () => {
  return function DummyTicketPreview(props) {
    return <div data-testid="ticket-preview">{JSON.stringify(props.ticket)}</div>;
  };
});

describe('FanTicketManager', () => {
  let mockSetTicket;

  beforeEach(() => {
    mockSetTicket = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders correctly with default props and matches snapshot', () => {
    const { container } = render(
      <FanTicketManager ticket={defaultTicket} setTicket={mockSetTicket} />
    );
    expect(container).toMatchSnapshot();
    
    expect(screen.getByText('MY TICKET')).toBeInTheDocument();
    expect(screen.getByTestId('ticket-preview')).toBeInTheDocument();
  });

  it('switches between tabs and renders relevant fields', () => {
    render(<FanTicketManager ticket={defaultTicket} setTicket={mockSetTicket} />);
    
    // Seat info is default
    expect(screen.getByText('Category')).toBeInTheDocument();
    
    // Switch to match tab
    fireEvent.click(screen.getByText('Match'));
    expect(screen.getByLabelText('Match')).toBeInTheDocument();
    expect(screen.queryByText('Category')).not.toBeInTheDocument();
    
    // Switch to holder tab
    fireEvent.click(screen.getByText('Holder'));
    expect(screen.getByLabelText('Ticket Holder Name')).toBeInTheDocument();
  });

  it('calls setTicket on input change', async () => {
    const user = userEvent.setup({ delay: null });
    render(<FanTicketManager ticket={defaultTicket} setTicket={mockSetTicket} />);
    
    const rowInput = screen.getByPlaceholderText('e.g. 12');
    await user.type(rowInput, '1');
    
    expect(mockSetTicket).toHaveBeenCalledTimes(1);
    // Ensure that it was called with a function that updates state
    expect(mockSetTicket.mock.calls[0][0]).toBeInstanceOf(Function);
  });

  it('handles save button click and visual feedback', () => {
    render(<FanTicketManager ticket={defaultTicket} setTicket={mockSetTicket} />);
    
    const saveBtn = screen.getByText('Save Ticket');
    fireEvent.click(saveBtn);
    
    expect(screen.getByText('Saved!')).toBeInTheDocument();
    
    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });
    
    // Expect button to return to normal
    expect(screen.getByText('Save Ticket')).toBeInTheDocument();
  });

  it('handles reset button click', () => {
    render(<FanTicketManager ticket={defaultTicket} setTicket={mockSetTicket} />);
    
    const resetBtn = screen.getByText('Reset');
    fireEvent.click(resetBtn);
    
    expect(mockSetTicket).toHaveBeenCalledWith(defaultTicket);
  });
});
