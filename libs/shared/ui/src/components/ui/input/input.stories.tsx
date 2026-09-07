import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
  component: Input,
  title: "Shadcn/Input",
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof Input>;

export const Default = {
  args: {
    placeholder: "Enter your email",
  },
} satisfies Story;

export const Filled = {
  args: {
    defaultValue: "hello@rustic.app",
  },
} satisfies Story;

export const Disabled = {
  args: {
    disabled: true,
    placeholder: "Unavailable",
  },
} satisfies Story;

export const Invalid = {
  args: {
    "aria-invalid": true,
    defaultValue: "not-an-email",
  },
} satisfies Story;

export const ReadOnly = {
  args: {
    defaultValue: "Read-only value",
    readOnly: true,
  },
} satisfies Story;

export const Password = {
  args: {
    defaultValue: "secret-password",
    type: "password",
  },
} satisfies Story;

export const AllStates = {
  render: () => (
    <div className="grid w-80 gap-3">
      <Input placeholder="Default" />
      <Input defaultValue="Filled value" />
      <Input aria-invalid="true" defaultValue="Invalid value" />
      <Input disabled placeholder="Disabled" />
      <Input readOnly defaultValue="Read-only value" />
    </div>
  ),
} satisfies Story;
