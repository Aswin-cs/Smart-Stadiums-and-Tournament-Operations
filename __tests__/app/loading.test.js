import { render, screen } from '@testing-library/react';
import Loading from '@/app/loading';
import '@testing-library/jest-dom';

describe('Loading Component', () => {
  it('renders loading spinner', () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
