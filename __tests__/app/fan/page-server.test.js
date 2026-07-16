import { render } from '@testing-library/react';
import FanPage from '@/app/fan/page';
import '@testing-library/jest-dom';

jest.mock('@/app/fan/FanDashboard', () => {
  return function MockFanDashboard() {
    return <div data-testid="fan-dashboard">Fan Dashboard</div>;
  };
});

describe('FanPage Server Component', () => {
  it('renders FanDashboard', () => {
    const { getByTestId } = render(<FanPage />);
    expect(getByTestId('fan-dashboard')).toBeInTheDocument();
  });

  it('exports correct revalidate value', async () => {
    const pageModule = await import('@/app/fan/page');
    expect(pageModule.revalidate).toBe(60);
  });
});
