import { render, screen } from '@testing-library/react';

import { Button } from './button';

describe('Button', () => {
  it('renders a button with a safe default type', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' }).getAttribute('type')).toBe(
      'button',
    );
  });

  it('passes through the selected variant and native properties', () => {
    render(
      <Button aria-label="Delete listing" disabled variant="danger">
        Delete
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Delete listing' }).disabled).toBe(
      true,
    );
  });
});
