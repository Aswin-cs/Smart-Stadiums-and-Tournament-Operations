import { render, screen, act } from '@testing-library/react';
import OrganiserStadiumMap from '@/app/components/OrganiserStadiumMap';
import '@testing-library/jest-dom';

describe('OrganiserStadiumMap', () => {
  const mockGates = [
    { id: 1, x: 100, y: 100, density: 45, label: 'Gate A' },
    { id: 2, x: 200, y: 200, density: 85, label: 'Gate B' },
    { id: 3, x: 250, y: 250, density: 60, label: 'Gate C' }
  ];
  
  const mockIncidents = [
    { id: 1, type: 'WARNING', shortLabel: 'Spill', x: 300, y: 300 },
    { id: 2, type: 'CRITICAL', shortLabel: 'Fight', x: 400, y: 400 },
    { id: 3, type: 'INFO', shortLabel: 'Cleanup', x: 500, y: 500 },
    { id: 4, type: 'UNKNOWN', shortLabel: 'Mystery' } // Test undefined x/y and default color
  ];

  it('renders gates and incidents correctly', () => {
    render(
      <OrganiserStadiumMap gates={mockGates} incidents={mockIncidents} climate="CLEAR" />
    );
    
    expect(screen.getByText('Gate A')).toBeInTheDocument();
    expect(screen.getByText('Gate B')).toBeInTheDocument();
    expect(screen.getByText('Spill')).toBeInTheDocument();
    expect(screen.getByText('Fight')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
  });

  it('handles window resize for mobile view', () => {
    render(<OrganiserStadiumMap gates={mockGates} incidents={[]} climate="STORM" />);
    
    act(() => {
      window.innerWidth = 500;
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(screen.getByText('Gate A')).toBeInTheDocument();
  });

  it('renders different climates correctly', () => {
    const { rerender } = render(<OrganiserStadiumMap gates={[]} incidents={[]} climate="HEATWAVE" />);
    expect(screen.getByText('FIELD')).toBeInTheDocument();

    rerender(<OrganiserStadiumMap gates={[]} incidents={[]} climate="STORM" />);
    expect(screen.getByText('FIELD')).toBeInTheDocument();
    
    rerender(<OrganiserStadiumMap gates={[]} incidents={[]} climate="CLEAR" />);
    expect(screen.getByText('FIELD')).toBeInTheDocument();
  });
});
