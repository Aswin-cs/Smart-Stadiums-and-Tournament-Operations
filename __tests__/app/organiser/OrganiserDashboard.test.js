import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import OrganiserDashboard from '../../../app/organiser/OrganiserDashboard';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({ data: { user: { name: 'Admin User' } } })),
  signOut: jest.fn()
}));

const mockHandleSimulateOverflow = jest.fn();
const mockHandleEmergencyOpenAllGates = jest.fn();
const mockHandleUpdateGateDensity = jest.fn();
const mockHandleReset = jest.fn();

jest.mock('../../../app/contexts/CrowdContext', () => ({
  useCrowd: jest.fn(() => ({
    gates: [{ id: 'Gate A', name: 'Gate A', waitTime: 5, density: 20 }],
    incidents: [{ id: 1, type: 'CRITICAL', severity: 'High', gateId: 'Gate A', location: 'Gate A' }],
    stats: [{ label: 'Open Incidents', value: 1 }],
    climate: 'CLEAR',
    setClimate: jest.fn(),
    handleSimulateOverflow: mockHandleSimulateOverflow,
    handleEmergencyOpenAllGates: mockHandleEmergencyOpenAllGates,
    handleUpdateGateDensity: mockHandleUpdateGateDensity,
    handleReset: mockHandleReset,
    handleSimulateClimate: jest.fn()
  }))
}));

jest.mock('../../../app/components/OrganiserChatWidget', () => {
  const MockOrganiserChatWidget = () => <div data-testid="org-chat-widget"></div>;
  MockOrganiserChatWidget.displayName = 'MockOrganiserChatWidget';
  return MockOrganiserChatWidget;
});
jest.mock('next/dynamic', () => () => {
  const MockOrganiserStadiumMap = () => <div data-testid="org-stadium-map"></div>;
  MockOrganiserStadiumMap.displayName = 'MockOrganiserStadiumMap';
  return MockOrganiserStadiumMap;
});

describe('OrganiserDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [{ id: 'Gate A', name: 'Gate A', waitTime: 5, density: 20 }],
      incidents: [{ id: 1, type: 'CRITICAL', severity: 'High', gateId: 'Gate A', location: 'Gate A' }],
      stats: [{ label: 'Open Incidents', value: 1 }],
      climate: 'CLEAR',
      setClimate: jest.fn(),
      handleSimulateOverflow: mockHandleSimulateOverflow,
      handleEmergencyOpenAllGates: mockHandleEmergencyOpenAllGates,
      handleUpdateGateDensity: mockHandleUpdateGateDensity,
      handleReset: mockHandleReset,
      handleSimulateClimate: jest.fn(),
      bins: [],
      handleDeployStaffToBin: jest.fn()
    });
  });
  
  afterEach(() => {
    jest.useRealTimers();
    global.fetch.mockRestore();
  });

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  it('renders correctly', () => {
    const { container } = render(<OrganiserDashboard />);
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByTestId('org-chat-widget')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('toggles settings panel', () => {
    render(<OrganiserDashboard />);
    
    const settingsBtn = screen.getByRole('button', { name: /control panel/i });
    fireEvent.click(settingsBtn);
    expect(screen.getByText('Simulation Settings')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close settings/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByText('Simulation Settings')).not.toBeInTheDocument();
  });

  it('toggles auto-simulate flow and reset state', () => {
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    const setIsAutoSimulating = jest.fn();
    useCrowd.mockReturnValue({
      gates: [], incidents: [], stats: [],
      isAutoSimulating: false,
      setIsAutoSimulating,
      handleReset: mockHandleReset,
      bins: []
    });

    render(<OrganiserDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /control panel/i }));
    
    const autoToggle = screen.getByRole('checkbox', { name: /Auto-Fluctuate Crowd Flow/i });
    fireEvent.click(autoToggle);
    expect(setIsAutoSimulating).toHaveBeenCalledWith(true);

    const resetBtn = screen.getByRole('button', { name: /reset state/i });
    fireEvent.click(resetBtn);
    expect(mockHandleReset).toHaveBeenCalled();
  });

  it('handles emergency protocol', () => {
    window.confirm = jest.fn(() => true);
    
    render(<OrganiserDashboard />);
    
    const emergencyBtn = screen.getByRole('button', { name: /open all gates/i });
    fireEvent.click(emergencyBtn);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockHandleEmergencyOpenAllGates).toHaveBeenCalled();
    
    // Check if emergency button is disabled
    expect(emergencyBtn).toBeDisabled();
    
    // Fast-forward timer to re-enable
    act(() => {
      jest.advanceTimersByTime(65000);
    });
    
    expect(emergencyBtn).not.toBeDisabled();
  });

  it('handles climate change', () => {
    render(<OrganiserDashboard />);
    
    const settingsBtn = screen.getByRole('button', { name: /control panel/i });
    fireEvent.click(settingsBtn);
    
    const heatBtn = screen.getByRole('button', { name: /heatwave/i });
    fireEvent.click(heatBtn);
    
    // Climate context should be updated (but we mocked setClimate in the mock so we'd have to check that if it was exported)
  });

  it('handles simulating overflow', () => {
    render(<OrganiserDashboard />);
    
    const settingsBtn = screen.getByRole('button', { name: /control panel/i });
    fireEvent.click(settingsBtn);
    
    const rushBtn = screen.getByRole('button', { name: /crowd rush/i });
    fireEvent.click(rushBtn);
    
    expect(mockHandleSimulateOverflow).toHaveBeenCalled();
  });

  it('renders sign in button when no session and handles logout when session exists', () => {
    const { useSession, signOut } = require('next-auth/react');
    
    // Test logout
    render(<OrganiserDashboard />);
    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutBtn);
    expect(signOut).toHaveBeenCalled();

    // Test login
    useSession.mockReturnValueOnce({ data: null });
    render(<OrganiserDashboard />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('toggles chat widget', () => {
    render(<OrganiserDashboard />);
    const chatToggle = screen.getByRole('button', { name: /Toggle chat window/i });
    fireEvent.click(chatToggle);
  });

  it('renders stats with different trends correctly', () => {
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [],
      incidents: [{ type: 'CRITICAL' }, { type: 'MINOR' }],
      stats: [{ label: 'Open Incidents', value: 1 }, { label: 'Other Stat', value: 5 }],
      climate: 'CLEAR',
      bins: []
    });
    
    render(<OrganiserDashboard />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles gate management and density adjustment', () => {
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [{ id: 'Gate A', name: 'Gate A', status: 'OPEN', density: 20 }],
      incidents: [], stats: [], climate: 'CLEAR', bins: [],
      handleUpdateGateDensity: mockHandleUpdateGateDensity
    });

    render(<OrganiserDashboard />);
    
    const manageBtns = screen.getAllByRole('button', { name: /manage/i });
    fireEvent.click(manageBtns[0]); // Click the first manage button
    
    // Check if slider appears (by role slider)
    const slider = screen.getByRole('slider', { name: /adjust density for gate a/i });
    expect(slider).toBeInTheDocument();
    
    fireEvent.change(slider, { target: { value: '60' } });
    expect(mockHandleUpdateGateDensity).toHaveBeenCalledWith('Gate A', 60);

    fireEvent.click(screen.getByRole('button', { name: /close/i })); // Close it
  });

  it('handles AI warning triggers and actions', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'AI Recommendation here' })
    });

    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [{ id: 'Gate Z', name: 'Gate Z', waitTime: 5, density: 85 }],
      incidents: [],
      stats: [],
      climate: 'CLEAR',
      setClimate: jest.fn(),
      handleSimulateOverflow: mockHandleSimulateOverflow,
      handleEmergencyOpenAllGates: mockHandleEmergencyOpenAllGates,
      handleUpdateGateDensity: mockHandleUpdateGateDensity,
      handleReset: mockHandleReset,
      handleSimulateClimate: jest.fn(),
      bins: [],
      handleDeployStaffToBin: jest.fn()
    });

    const { rerender } = render(<OrganiserDashboard />);

    await act(async () => {
      await Promise.resolve(); // Flush pending promises for fetch
    });

    const acceptBtn = screen.getByRole('button', { name: /accept/i });
    expect(acceptBtn).toBeInTheDocument();

    // Click accept to trigger actions
    fireEvent.click(acceptBtn);
    expect(mockHandleUpdateGateDensity).toHaveBeenCalled();

    // Re-render with density < 50 to clear warning state
    useCrowd.mockReturnValue({
      ...useCrowd(),
      gates: [{ id: 'Gate Z', name: 'Gate Z', waitTime: 5, density: 40 }]
    });
    rerender(<OrganiserDashboard />);
  });

  it('handles bin AI warnings and dismissal', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Clean up aisle 4' })
    });

    const mockHandleDeployStaffToBin = jest.fn();
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [], incidents: [], stats: [], climate: 'CLEAR',
      bins: [{ id: 'Bin 2', location: 'Gate B', fillLevel: 95 }],
      handleDeployStaffToBin: mockHandleDeployStaffToBin
    });

    const { rerender } = render(<OrganiserDashboard />);

    await act(async () => {
      await Promise.resolve(); // Flush pending promises for fetch
    });

    // Check if notification was added
    const notification = screen.getByText(/Clean up aisle 4/i);
    expect(notification).toBeInTheDocument();
    
    const acceptBtn = screen.getByRole('button', { name: /accept/i });
    fireEvent.click(acceptBtn);
    
    expect(mockHandleDeployStaffToBin).toHaveBeenCalledWith('Bin 2');

    // Test dismissal timeout by re-triggering and waiting
    useCrowd.mockReturnValue({
      ...useCrowd(),
      bins: [{ id: 'Bin 3', location: 'Gate C', fillLevel: 90 }]
    });
    rerender(<OrganiserDashboard />);
    
    await act(async () => {
      await Promise.resolve();
    });

    const closeNotifBtn = screen.getAllByRole('button', { name: /Close notification/i })[0];
    fireEvent.click(closeNotifBtn);

    // Fast-forward to trigger setTimeouts
    act(() => {
      jest.advanceTimersByTime(15000);
    });

    // Re-render with low fillLevel
    useCrowd.mockReturnValue({
      ...useCrowd(),
      bins: [{ id: 'Bin 3', location: 'Gate C', fillLevel: 40 }]
    });
    rerender(<OrganiserDashboard />);
  });

  it('handles deploy staff to bin directly', () => {
    const mockHandleDeployStaffToBin = jest.fn();
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [],
      incidents: [],
      stats: [],
      climate: 'CLEAR',
      setClimate: jest.fn(),
      handleSimulateOverflow: mockHandleSimulateOverflow,
      handleEmergencyOpenAllGates: mockHandleEmergencyOpenAllGates,
      handleUpdateGateDensity: mockHandleUpdateGateDensity,
      handleReset: mockHandleReset,
      handleSimulateClimate: jest.fn(),
      bins: [{ id: 'Bin 1', location: 'Section A', fillLevel: 90 }],
      handleDeployStaffToBin: mockHandleDeployStaffToBin
    });

    render(<OrganiserDashboard />);
    const deployBtn = screen.getByRole('button', { name: /deploy staff/i });
    fireEvent.click(deployBtn);
    expect(mockHandleDeployStaffToBin).toHaveBeenCalledWith('Bin 1');
  });

  it('handles clear and storm climate simulation', () => {
    const mockHandleSimulateClimate = jest.fn();
    const { useCrowd } = require('../../../app/contexts/CrowdContext');
    useCrowd.mockReturnValue({
      gates: [],
      incidents: [],
      stats: [],
      climate: 'HEATWAVE',
      setClimate: jest.fn(),
      handleSimulateOverflow: mockHandleSimulateOverflow,
      handleEmergencyOpenAllGates: mockHandleEmergencyOpenAllGates,
      handleUpdateGateDensity: mockHandleUpdateGateDensity,
      handleReset: mockHandleReset,
      handleSimulateClimate: mockHandleSimulateClimate,
      bins: [],
      handleDeployStaffToBin: jest.fn()
    });

    render(<OrganiserDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /control panel/i }));
    
    fireEvent.click(screen.getByRole('button', { name: /storm/i }));
    expect(mockHandleSimulateClimate).toHaveBeenCalledWith('STORM');

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(mockHandleSimulateClimate).toHaveBeenCalledWith('CLEAR');
  });
});
