/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { useStadiumRoute, StadiumRouteProvider } from '@/app/contexts/StadiumRouteContext';

// Helper component that consumes the context
const TestComponent = () => {
  const routeContext = useStadiumRoute();
  return <div>{routeContext ? 'Has Context' : 'No Context'}</div>;
};

describe('StadiumRouteContext', () => {
  beforeEach(() => {
    // Suppress console.error for expected React errors during the throw test
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should throw an error when useStadiumRoute is used outside of StadiumRouteProvider', () => {
    expect(() => render(<TestComponent />)).toThrow(
      'useStadiumRoute must be used within a StadiumRouteProvider'
    );
  });

  it('should provide the context value when used within StadiumRouteProvider', () => {
    const { getByText } = render(
      <StadiumRouteProvider value={{ currentRoute: 'A' }}>
        <TestComponent />
      </StadiumRouteProvider>
    );
    expect(getByText('Has Context')).toBeInTheDocument();
  });
});
