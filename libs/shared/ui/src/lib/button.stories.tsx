import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Continue",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Danger: Story = {
  args: {
    children: "Delete listing",
    variant: "danger",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
