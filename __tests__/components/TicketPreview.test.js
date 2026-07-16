import { render, screen } from '@testing-library/react';
import TicketPreview from '@/app/components/TicketPreview';
import '@testing-library/jest-dom';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

describe('TicketPreview', () => {
  const mockTicket = {
    category: 'Standard',
    gate: 'Gate A',
    row: 'A',
    seat: '12',
    match: 'USA vs BRAZIL',
    matchDate: 'July 4, 2026',
    stadium: 'MetLife Stadium',
    section: 'North Stand',
    holderName: 'John Doe',
    barcode: '123456789'
  };

  it('renders ticket details', () => {
    render(<TicketPreview ticket={mockTicket} animating={false} />);
    expect(screen.getByText('USA vs BRAZIL')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getAllByText('A')[0]).toBeInTheDocument(); // Gate without "Gate "
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });

  it('renders fallback colors for unknown category', () => {
    render(<TicketPreview ticket={{...mockTicket, category: 'Unknown'}} animating={false} />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
