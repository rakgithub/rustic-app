import type { Preview } from "@storybook/react-vite";

import "design-tokens/theme.css";
import { resolveTheme, type ThemePreference } from "design-tokens";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Theme applied to the component preview",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "system", title: "System" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const preference = context.globals.theme as ThemePreference;
      const theme = resolveTheme(preference);

      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;

      return Story();
    },
  ],
};

export default preview;
