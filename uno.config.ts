import { basename } from 'node:path';
import type { IconsOptions } from '@unocss/preset-icons';
import { defineConfig, presetIcons, presetWind } from 'unocss';
import { globSync } from 'fast-glob';
import {
  deOptimisePaths,
  importDirectorySync,
  isEmptyColor,
  parseColors,
  runSVGO,
} from '@iconify/tools';

function loadIconSet(path: string) {
  const iconSet = importDirectorySync(path, {
    prefix: 'svg',
    ignoreImportErrors: true,
  });

  iconSet.forEachSync((name) => {
    const svg = iconSet.toSVG(name)!;
   
      parseColors(svg, {
        defaultColor: 'currentColor',
        callback: (attr, colorStr, color) => {
          return !color || isEmptyColor(color)
            ? colorStr
            : 'currentColor';
        },
      });
    

    runSVGO(svg);


    deOptimisePaths(svg);

    iconSet.fromSVG(name, svg);
  });

  // Return as function
  return () => iconSet.export();
}

function getDirIcons(baseCollectionName: string, iconPath: string) {
  const dirs = globSync(`${iconPath}/*`, {
    onlyDirectories: true,
  });

  let collections = {} as IconsOptions['collections'] & {};

  for (const dir of dirs) {
    const dirname = basename(dir);
    collections[`${baseCollectionName}-${dirname}`] = loadIconSet(dir);

    const subDirs = globSync(`${dir}/*`, {
      onlyDirectories: true,
    });

    if (subDirs.length) {
      collections = {
        ...collections,
        ...getDirIcons(`${baseCollectionName}-${dirname}`, dir),
      };
    }
  }

  collections[baseCollectionName] = loadIconSet(iconPath);

  return collections;
}

export default defineConfig({
  content: { filesystem: ['src/*/*.{ts,tsx,vue}'] },
  presets: [
    presetWind(),
    presetIcons({
      scale: 1,
      prefix: 'i-',
      extraProperties: {
        'display': 'inline-block',
        'min-width': '1em',
      },
      collections: {
        ...getDirIcons('common', 'src/assets/icon/common'),
      },
    }),
  ],
});
