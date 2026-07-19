import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '@/app/login/page';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login content correctly', () => {
    // Mock useSearchParams to return a specific callbackUrl
    const mockGet = jest.fn().mockReturnValue('/organiser');
    useSearchParams.mockReturnValue({ get: mockGet });

    render(<LoginPage />);

    // Check if essential elements are rendered
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to access your dashboard/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return to Home/i })).toBeInTheDocument();
    expect(screen.getByAltText('FIFA World Cup Trophy')).toBeInTheDocument();
  });

  it('calls signIn with google provider and callbackUrl when button is clicked', () => {
    const mockGet = jest.fn().mockReturnValue('/organiser');
    useSearchParams.mockReturnValue({ get: mockGet });

    render(<LoginPage />);

    const button = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/organiser' });
  });

  it('defaults callbackUrl to "/" if not provided in search params', () => {
    // Mock useSearchParams to return null for callbackUrl
    const mockGet = jest.fn().mockReturnValue(null);
    useSearchParams.mockReturnValue({ get: mockGet });

    render(<LoginPage />);

    const button = screen.getByRole('button', { name: /Continue with Google/i });
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
  });
});
