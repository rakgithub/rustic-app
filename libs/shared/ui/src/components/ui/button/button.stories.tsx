import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
  component: Button,
  title: "Shadcn/Button",
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary = {
  args: {
    children: "Primary",
  },
} satisfies Story;

export const Secondary = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
} satisfies Story;

export const Outline = {
  args: {
    children: "Outline",
    variant: "outline",
  },
} satisfies Story;

export const Destructive = {
  args: {
    children: "Destructive",
    variant: "destructive",
  },
} satisfies Story;

export const Ghost = {
  args: {
    children: "Ghost",
    variant: "ghost",
  },
} satisfies Story;

export const Link = {
  args: {
    children: "Link",
    variant: "link",
  },
} satisfies Story;

export const Disabled = {
  args: {
    children: "Disabled",
    disabled: true,
  },
} satisfies Story;

export const Sizes = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">Extra small</Button>
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
} satisfies Story;

export const AllVariants = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
} satisfies Story;
