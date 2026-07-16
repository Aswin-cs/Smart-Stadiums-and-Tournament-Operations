import { render, screen } from '@testing-library/react';
import Page from '@/app/page';
import '@testing-library/jest-dom';

describe('Home Page', () => {
  it('renders the home page', () => {
    render(<Page />);
    expect(screen.getByText(/WORLD CUP 2026/i)).toBeInTheDocument();
  });
});
