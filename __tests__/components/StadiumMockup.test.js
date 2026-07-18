import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StadiumMockup from '@/app/components/StadiumMockup';
import '@testing-library/jest-dom';

// Mock FontAwesomeIcon to prevent SVGs from cluttering the DOM / throwing errors
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

// Mock useCrowd so StadiumMockup doesn't fail
jest.mock('@/app/contexts/CrowdContext', () => ({
  useCrowd: jest.fn(() => ({ gates: [], handleUpdateGateDensity: jest.fn() }))
}));

describe('StadiumMockup', () => {
  const mockTicket = { gate: 'Gate A', section: 'North Stand', row: 'A', seat: '12' };
  
  it('renders stadium mockup and toggles day/night', async () => {
    const user = userEvent.setup();
    render(<StadiumMockup ticket={mockTicket} routeMode="hide" setRouteMode={jest.fn()} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={jest.fn()} />);

    expect(screen.getByText('Day')).toBeInTheDocument();
    
    const dayBtn = screen.getByRole('button', { name: /Day Mode/i });
    await user.click(dayBtn);

    const nightBtn = screen.getByRole('button', { name: /Night Mode/i });
    await user.click(nightBtn);
  });

  it('calls setRouteMode when route dropdown changes', async () => {
    const setRouteMode = jest.fn();
    const user = userEvent.setup();
    render(<StadiumMockup ticket={mockTicket} routeMode="hide" setRouteMode={setRouteMode} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={jest.fn()} />);

    const routeSelect = screen.getByLabelText('Stadium Routing Mode');
    await user.selectOptions(routeSelect, 'gate-seat');
    
    expect(setRouteMode).toHaveBeenCalledWith('gate-seat');
  });

  it('calls setAmenityFilter when amenity filter changes', async () => {
    const setAmenityFilter = jest.fn();
    const user = userEvent.setup();
    render(<StadiumMockup ticket={mockTicket} routeMode="hide" setRouteMode={jest.fn()} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={setAmenityFilter} onSelectGate={jest.fn()} />);

    const filterSelect = screen.getByLabelText('Filter Amenities');
    await user.selectOptions(filterSelect, 'food');
    
    expect(setAmenityFilter).toHaveBeenCalledWith('food');
  });

  it('handles gate selection', async () => {
    const onSelectGate = jest.fn();
    const user = userEvent.setup();
    render(<StadiumMockup ticket={mockTicket} routeMode="hide" setRouteMode={jest.fn()} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={onSelectGate} />);

    const gateB = screen.getByLabelText('Select Gate B');
    await user.click(gateB);
    expect(onSelectGate).toHaveBeenCalledWith('Gate B');
    
    fireEvent.keyDown(gateB, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onSelectGate).toHaveBeenCalledTimes(2);
  });

  it('renders different route modes', () => {
    const { rerender } = render(<StadiumMockup ticket={mockTicket} routeMode="gate-seat" setRouteMode={jest.fn()} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={jest.fn()} />);
    expect(screen.getByText('SEAT A-12')).toBeInTheDocument();

    rerender(<StadiumMockup ticket={mockTicket} routeMode="gate-amenity" setRouteMode={jest.fn()} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={jest.fn()} />);
    rerender(<StadiumMockup ticket={mockTicket} routeMode="gate-seat-amenity" setRouteMode={jest.fn()} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={jest.fn()} />);
  });

  it('renders congested gates correctly', () => {
    const { useCrowd } = require('@/app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [{ id: 'Gate B', status: 'CONGESTED' }],
      handleUpdateGateDensity: jest.fn()
    });

    render(<StadiumMockup ticket={mockTicket} routeMode="hide" setRouteMode={jest.fn()} selectedAmenityId="Pizza" setSelectedAmenityId={jest.fn()} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={jest.fn()} />);
    
    // Gate B should be congested
    const gateBTitle = screen.getByText(/WARNING: High Congestion at Gate B/i);
    expect(gateBTitle).toBeInTheDocument();
  });

  it('handles amenity clicks and keydowns', async () => {
    const setSelectedAmenityId = jest.fn();
    const setRouteMode = jest.fn();
    const user = userEvent.setup();
    
    render(<StadiumMockup ticket={mockTicket} routeMode="hide" setRouteMode={setRouteMode} selectedAmenityId="Pizza" setSelectedAmenityId={setSelectedAmenityId} amenityFilter="All" setAmenityFilter={jest.fn()} onSelectGate={jest.fn()} />);
    
    const amenity = screen.getByLabelText('Select Burgers');
    await user.click(amenity);
    expect(setSelectedAmenityId).toHaveBeenCalledWith('Burgers');
    expect(setRouteMode).toHaveBeenCalledWith('seat-amenity');
    
    fireEvent.keyDown(amenity, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(setSelectedAmenityId).toHaveBeenCalledTimes(2);
  });
});
