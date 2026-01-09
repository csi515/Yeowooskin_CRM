import type { StorybookConfig } from '@storybook/react-webpack5'
import path from 'path'

const config: StorybookConfig = {
  stories: ['../shared/ui/**/*.stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-webpack5-compiler-swc',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  webpackFinal: async (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@': path.resolve(__dirname, '..'),
      '@shared': path.resolve(__dirname, '../shared'),
    }

    // Tailwind v4 (@import "tailwindcss") 처리를 위해 PostCSS 적용
    config.module = config.module ?? { rules: [] }
    config.module.rules = (config.module.rules ?? []).filter((rule) => {
      if (!rule || typeof rule !== 'object') return true
      const test = (rule as { test?: unknown }).test
      return !(test instanceof RegExp && test.source.includes('\\.css'))
    })

    config.module.rules.push({
      test: /\.css$/i,
      sideEffects: true,
      use: [
        require.resolve('style-loader'),
        {
          loader: require.resolve('css-loader'),
          options: { importLoaders: 1 },
        },
        {
          loader: require.resolve('postcss-loader'),
          options: {
            postcssOptions: {
              config: path.resolve(__dirname, '../postcss.config.js'),
            },
          },
        },
      ],
    })

    return config
  },
}

export default config

