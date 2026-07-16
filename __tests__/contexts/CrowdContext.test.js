import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrowdProvider, useCrowd } from '@/app/contexts/CrowdContext';

function TestComponent() {
  const { 
    gates, incidents, stats, climate, isAutoSimulating, setIsAutoSimulating, transportation,
    handleUpdateGateDensity, handleSimulateOverflow, handleReset, handleSimulateClimate,
    handleEmergencyOpenAllGates, handleDeployStaffToBin
  } = useCrowd();

  return (
    <div>
      <div data-testid="climate">{climate}</div>
      <div data-testid="gates-length">{gates.length}</div>
      <div data-testid="incidents-length">{incidents.length}</div>
      <button onClick={() => handleUpdateGateDensity('Gate A', 90)}>Update Gate High</button>
      <button onClick={() => handleUpdateGateDensity('Gate A', 0)}>Update Gate Closed</button>
      <button onClick={() => handleUpdateGateDensity('Gate A', 20)}>Update Gate Low</button>
      <button onClick={() => handleUpdateGateDensity('Gate X', 50)}>Update Nonexistent Gate</button>
      <button onClick={() => handleSimulateOverflow()}>Simulate Overflow</button>
      <button onClick={() => handleSimulateClimate('HEATWAVE')}>Heatwave</button>
      <button onClick={() => handleSimulateClimate('STORM')}>Storm</button>
      <button onClick={() => handleSimulateClimate('CLEAR')}>Clear</button>
      <button onClick={() => handleEmergencyOpenAllGates()}>Emergency</button>
      <button onClick={() => setIsAutoSimulating(true)}>Auto Sim</button>
      <button onClick={() => handleDeployStaffToBin('bin-1')}>Deploy Bin</button>
    </div>
  );
}

function TestNoProvider() {
  useCrowd();
  return null;
}

describe('CrowdContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('provides default values and updates gate density', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );

    expect(screen.getByTestId('climate')).toHaveTextContent('CLEAR');
    expect(screen.getByTestId('gates-length')).not.toHaveTextContent('0');

    await user.click(screen.getByText('Update Gate High'));
    await user.click(screen.getByText('Update Gate Closed'));
    await user.click(screen.getByText('Update Gate Low'));
    await user.click(screen.getByText('Update Nonexistent Gate'));
  });

  it('throws error when useCrowd is used outside of provider', () => {
    // Suppress console.error expected from React boundary error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestNoProvider />)).toThrow('useCrowd must be used within a CrowdProvider');
    spy.mockRestore();
  });

  it('simulates overflow', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );
    await user.click(screen.getByText('Simulate Overflow'));
  });

  it('handles climate changes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );
    await user.click(screen.getByText('Heatwave'));
    expect(screen.getByTestId('climate')).toHaveTextContent('HEATWAVE');

    await user.click(screen.getByText('Storm'));
    expect(screen.getByTestId('climate')).toHaveTextContent('STORM');

    await user.click(screen.getByText('Clear'));
    expect(screen.getByTestId('climate')).toHaveTextContent('CLEAR');
  });

  it('handles emergency open all gates', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );
    await user.click(screen.getByText('Emergency'));
  });

  it('runs auto simulation intervals', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );
    
    await user.click(screen.getByText('Auto Sim'));
    
    act(() => {
      jest.advanceTimersByTime(5000); // Trigger 4s interval
    });
    
    act(() => {
      // Trigger 2.5m interval multiple times to exhaust inactive templates
      jest.advanceTimersByTime(150000 * 15);
    });
  });

  it('deploys staff to bin', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <CrowdProvider>
        <TestComponent />
      </CrowdProvider>
    );
    await user.click(screen.getByText('Deploy Bin'));
  });
});
