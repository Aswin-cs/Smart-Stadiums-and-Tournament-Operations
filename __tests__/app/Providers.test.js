import { render } from '@testing-library/react';
import Providers from '@/app/Providers';
import '@testing-library/jest-dom';

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => <div data-testid="session-provider">{children}</div>,
}));

describe('Providers', () => {
  it('renders SessionProvider', () => {
    const { getByTestId } = render(<Providers><div>Test</div></Providers>);
    expect(getByTestId('session-provider')).toBeInTheDocument();
  });
});
