import React from 'react';
import { render } from '@testing-library/react';
import TicketBarcode from '../../app/components/TicketBarcode';

describe('TicketBarcode', () => {
  it('renders correctly and matches snapshot', () => {
    const { container } = render(<TicketBarcode />);
    
    // Check if the barcode container is rendered
    const barcodeContainer = container.querySelector('div');
    expect(barcodeContainer).toBeInTheDocument();
    
    // Ensure all 22 bars are rendered
    const bars = container.querySelectorAll('div.barcodeBar');
    expect(bars).toHaveLength(22);
    
    // Snapshot test for visual regression
    expect(container).toMatchSnapshot();
  });
});
