import { render } from '@testing-library/react';

import FeatureSelling from './feature-selling';

describe('FeatureSelling', () => {
  
  it('should render successfully', () => {
    const { baseElement } = render(<FeatureSelling />);
    expect(baseElement).toBeTruthy();
  });
  
});
