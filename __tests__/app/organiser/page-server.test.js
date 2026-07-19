import { render } from '@testing-library/react';
import OrganiserPage from '@/app/organiser/page';
import '@testing-library/jest-dom';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/app/organiser/OrganiserDashboard', () => {
  return function MockOrganiserDashboard() {
    return <div data-testid="org-dashboard">Organiser Dashboard</div>;
  };
});

describe('OrganiserPage Server Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to login if there is no session', async () => {
    getServerSession.mockResolvedValueOnce(null);
    
    await OrganiserPage();
    
    expect(getServerSession).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/login?callbackUrl=/organiser');
  });

  it('renders OrganiserDashboard if user is authenticated', async () => {
    getServerSession.mockResolvedValueOnce({ user: { name: 'Test' } });
    
    const jsx = await OrganiserPage();
    const { getByTestId } = render(jsx);
    
    expect(getByTestId('org-dashboard')).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
