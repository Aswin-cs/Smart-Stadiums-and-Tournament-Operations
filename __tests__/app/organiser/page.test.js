import { render, screen } from '@testing-library/react';
import OrganiserDashboard from '@/app/organiser/OrganiserDashboard';
import '@testing-library/jest-dom';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>Icon</span>,
}));

jest.mock('@/app/contexts/CrowdContext', () => ({
  useCrowd: () => ({
    gates: [],
    incidents: [],
    stats: [],
    climate: 'CLEAR',
    isAutoSimulating: false,
    setIsAutoSimulating: jest.fn(),
    handleUpdateGateDensity: jest.fn(),
    handleSimulateOverflow: jest.fn(),
    handleReset: jest.fn(),
    handleSimulateClimate: jest.fn(),
    handleEmergencyOpenAllGates: jest.fn(),
  }),
}));

window.HTMLElement.prototype.scrollIntoView = jest.fn();
window.HTMLElement.prototype.scrollBy = jest.fn();

describe('Organiser Page', () => {
  it('renders correctly', () => {
    render(<OrganiserDashboard />);
    expect(screen.getByText('CROWD & VENUE')).toBeInTheDocument();
  });
});
