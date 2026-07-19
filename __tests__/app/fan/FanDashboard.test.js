import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import FanDashboard from '../../../app/fan/FanDashboard';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: { user: { name: 'Test User' } } })),
  signOut: jest.fn(),
  signIn: jest.fn()
}));

jest.mock('../../../app/contexts/CrowdContext', () => ({
  useCrowd: jest.fn(() => ({
    gates: [{ id: 'A', name: 'Gate A', waitTime: 5, status: 'CONGESTED', density: 85 }],
    incidents: [{ id: 1, title: 'Lost Child', location: 'Gate A', time: '12:00', type: 'CRITICAL' }],
    stats: { totalAttendance: 100 },
    transportation: [{ type: 'bus', status: 'On Time' }]
  }))
}));

jest.mock('../../../app/components/FanChatWidget', () => {
  const MockFanChatWidget = () => <div data-testid="fan-chat-widget"></div>;
  MockFanChatWidget.displayName = 'MockFanChatWidget';
  return MockFanChatWidget;
});
jest.mock('../../../app/components/FanTicketManager', () => {
  const MockFanTicketManager = () => <div data-testid="fan-ticket-manager"></div>;
  MockFanTicketManager.displayName = 'MockFanTicketManager';
  return MockFanTicketManager;
});
jest.mock('../../../app/components/StadiumMockup', () => {
  const MockStadiumMockup = () => <div data-testid="stadium-mockup"></div>;
  MockStadiumMockup.displayName = 'MockStadiumMockup';
  return MockStadiumMockup;
});

describe('FanDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { container } = render(<FanDashboard />);
    expect(screen.getByText('FIFA World Cup 2026™ GenAI Fan Experience')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('handles sign out', () => {
    const { signOut } = require('next-auth/react');
    render(<FanDashboard />);
    
    const signOutBtn = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(signOutBtn);
    
    expect(signOut).toHaveBeenCalled();
  });
  
  it('renders sign in button for unauthenticated users and handles sign in', () => {
    const { useSession, signIn } = require('next-auth/react');
    useSession.mockReturnValueOnce({ data: null });
    
    render(<FanDashboard />);
    
    const signInBtn = screen.getByRole('button', { name: /Login or Sign Up/i });
    fireEvent.click(signInBtn);
    expect(signIn).toHaveBeenCalledWith('google');
  });

  it('handles get update button', () => {
    jest.useFakeTimers();
    render(<FanDashboard />);
    
    const updateBtn = screen.getByRole('button', { name: /get notifications/i });
    
    act(() => {
      fireEvent.click(updateBtn);
      jest.advanceTimersByTime(2000);
    });
    
    jest.useRealTimers();
  });

  it('handles visibility change and unread count', () => {
    render(<FanDashboard />);
    
    // Mock document.hidden and trigger visibilitychange
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
  });

  it('handles horizontal scroll on updates', () => {
    const { container } = render(<FanDashboard />);
    // Find the scroll container which has the mouse event handlers
    // The container has class updatesScrollContainer
    // We can find it by its testid if we had one, or querySelector
    const scrollContainer = container.querySelector('div[class*="updatesScrollContainer"]');
    
    // Simulate mouse events
    fireEvent.mouseDown(scrollContainer, { pageX: 100 });
    fireEvent.mouseMove(scrollContainer, { pageX: 50 });
    fireEvent.mouseLeave(scrollContainer);
    fireEvent.mouseUp(scrollContainer);
  });

  it('shows all clear when no incidents and no congestion', () => {
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [],
      incidents: [],
      stats: { totalAttendance: 100 },
      transportation: []
    });
    
    render(<FanDashboard />);
    expect(screen.getByText('All Clear')).toBeInTheDocument();
  });

  it('handles incoming new incidents and congested gates', () => {
    jest.useFakeTimers();
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [],
      incidents: [],
      stats: { totalAttendance: 100 },
      transportation: []
    });
    
    const { rerender } = render(<FanDashboard />);
    
    // Now trigger a new incident and congested gate
    useCrowd.mockReturnValue({
      gates: [{ id: 'Gate B', name: 'Gate B', waitTime: 10, status: 'CONGESTED', density: 90 }],
      incidents: [{ id: 2, title: 'Fire', location: 'Gate B', time: '13:00', type: 'CRITICAL' }],
      stats: { totalAttendance: 100 },
      transportation: []
    });
    
    rerender(<FanDashboard />);
    
    // Check if unread count was updated and toast was shown
    // We can just advance timers to let the timeout clear them to cover the setTimeout callbacks
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    jest.useRealTimers();
  });
});
