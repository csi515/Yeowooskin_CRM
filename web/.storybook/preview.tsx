import type { Preview } from '@storybook/react'
import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '../app/lib/theme/mui-theme'
import '../app/globals.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { expanded: true },
    a11y: {
      // 기본값은 충분하지만, 공용 UI라 접근성은 항상 켜두는 방향으로 유지
    },
    viewport: {
      defaultViewport: 'mobile1', // Mobile-First 기본
    },
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ padding: 16, maxWidth: 560 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}

export default preview

