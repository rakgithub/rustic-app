import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ui  } from './ui';
import { expect } from 'storybook/test';

const meta = {
  component: Ui,
  title: 'Ui',
} satisfies Meta<typeof Ui>;
export default meta;

type Story = StoryObj<typeof Ui>;

export const Primary = {
  args: {
  },
} satisfies Story;

export const Heading = {
  args: {
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Ui/gi)).toBeTruthy();
  },
} satisfies Story;

