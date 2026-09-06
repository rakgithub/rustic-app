import type { Meta, StoryObj } from '@storybook/react-vite';

import { Card } from './card';

const meta = {
  title: 'Components/Card',
  component: Card,
  args: {
    'aria-label': 'Listing summary',
    children: 'A shared surface that automatically follows the selected theme.',
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
