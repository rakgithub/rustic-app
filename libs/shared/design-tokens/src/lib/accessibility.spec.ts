import { describe, expect, it } from 'vitest';

import primitives from '../../tokens/primitives.tokens.json';
import darkTokens from '../../tokens/semantic-dark.tokens.json';
import lightTokens from '../../tokens/semantic-light.tokens.json';

type TokenFile = Record<string, unknown>;

const pairs = [
  ['primary button', 'color.action.primary.foreground', 'color.action.primary.default'],
  ['danger button', 'color.action.danger.foreground', 'color.action.danger.default'],
  ['primary text', 'color.text.primary', 'color.surface.default'],
  ['link text', 'color.text.link', 'color.surface.default'],
  ['success status', 'color.status.success.foreground', 'color.status.success.surface'],
  ['warning status', 'color.status.warning.foreground', 'color.status.warning.surface'],
  ['danger status', 'color.status.danger.foreground', 'color.status.danger.surface'],
] as const;

describe('theme contrast', () => {
  const themes = { dark: darkTokens, light: lightTokens };

  for (const [theme, tokens] of Object.entries(themes)) {

    for (const [name, foregroundPath, backgroundPath] of pairs) {
      it(`${theme} ${name} meets the WCAG AA 4.5:1 contrast threshold`, () => {
        const foreground = resolveToken(tokens, foregroundPath);
        const background = resolveToken(tokens, backgroundPath);

        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

function resolveToken(tokens: TokenFile, tokenPath: string): string {
  let value = getValue(tokens, tokenPath);

  while (isReference(value)) {
    value = getValue(primitives, value.slice(1, -1));
  }

  if (typeof value !== 'string' || !value.startsWith('#')) {
    throw new Error(`Expected ${tokenPath} to resolve to a hexadecimal colour.`);
  }

  return value;
}

function getValue(tokens: TokenFile, tokenPath: string): unknown {
  const token = tokenPath.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined;

    return (current as Record<string, unknown>)[segment];
  }, tokens) as Record<string, unknown> | undefined;

  return token?.$value;
}

function isReference(value: unknown): value is string {
  return typeof value === 'string' && /^\{.+\}$/.test(value);
}

function contrastRatio(foreground: string, background: string): number {
  const [foregroundLuminance, backgroundLuminance] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((left, right) => right - left);

  return (foregroundLuminance + 0.05) / (backgroundLuminance + 0.05);
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Expected a six-digit hexadecimal colour, received ${hex}.`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
