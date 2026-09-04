import { render } from '@testing-library/react';

import FeatureCheckout from './feature-checkout';

describe('FeatureCheckout', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<FeatureCheckout />);
    expect(baseElement).toBeTruthy();
  });
  
});
