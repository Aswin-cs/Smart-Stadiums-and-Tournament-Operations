import { render } from '@testing-library/react';
import OrganiserPage from '@/app/organiser/page';
import '@testing-library/jest-dom';

jest.mock('@/app/organiser/OrganiserDashboard', () => {
  return function MockOrganiserDashboard() {
    return <div data-testid="org-dashboard">Organiser Dashboard</div>;
  };
});

describe('OrganiserPage Server Component', () => {
  it('renders OrganiserDashboard', () => {
    const { getByTestId } = render(<OrganiserPage />);
    expect(getByTestId('org-dashboard')).toBeInTheDocument();
  });

  it('exports correct revalidate value', async () => {
    const module = await import('@/app/organiser/page');
    expect(module.revalidate).toBe(60);
  });
});
