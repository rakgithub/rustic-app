import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';
import { formats, transformGroups } from 'style-dictionary/enums';

const libraryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const tokensDirectory = path.join(libraryRoot, 'tokens');
const generatedDirectory = path.join(libraryRoot, 'src', 'generated');

const tokenFile = (fileName) => path.join(tokensDirectory, fileName);
const isFrom = (fileName) => (token) => token.filePath.endsWith(fileName);

async function buildCss({ include = [], source, destination, selector, filter }) {
  const dictionary = new StyleDictionary({
    include: include.map(tokenFile),
    source: source.map(tokenFile),
    log: {
      warnings: 'disabled',
    },
    platforms: {
      css: {
        transformGroup: transformGroups.css,
        buildPath: `${generatedDirectory}/`,
        files: [
          {
            destination,
            filter,
            format: formats.cssVariables,
            options: {
              outputReferences: true,
              outputReferenceFallbacks: true,
              selector,
            },
          },
        ],
      },
    },
  });

  await dictionary.buildAllPlatforms();
}

const primitives = 'primitives.tokens.json';
const lightTheme = 'semantic-light.tokens.json';
const darkTheme = 'semantic-dark.tokens.json';
const components = 'components.tokens.json';

await buildCss({
  source: [primitives],
  destination: 'primitives.css',
  selector: ':root',
  filter: isFrom(primitives),
});

await buildCss({
  include: [primitives],
  source: [lightTheme],
  destination: '.theme-light.css',
  selector: ':root,\n[data-theme="light"]',
  filter: isFrom(lightTheme),
});

await buildCss({
  include: [primitives],
  source: [darkTheme],
  destination: '.theme-dark.css',
  selector: '[data-theme="dark"]',
  filter: isFrom(darkTheme),
});

await buildCss({
  include: [primitives, lightTheme],
  source: [components],
  destination: 'components.css',
  selector: ':root',
  filter: isFrom(components),
});

const [lightCss, darkCss] = await Promise.all([
  readFile(path.join(generatedDirectory, '.theme-light.css'), 'utf8'),
  readFile(path.join(generatedDirectory, '.theme-dark.css'), 'utf8'),
]);

await writeFile(
  path.join(generatedDirectory, 'themes.css'),
  `${lightCss.trim()}\n\n${darkCss.trim()}\n`,
);
await Promise.all([
  rm(path.join(generatedDirectory, '.theme-light.css')),
  rm(path.join(generatedDirectory, '.theme-dark.css')),
]);
