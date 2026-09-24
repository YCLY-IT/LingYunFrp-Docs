import type { GlobalThemeOverrides } from 'naive-ui'

export const brand = {
  50: '#fbf5ff',
  100: '#f5e8ff',
  200: '#ebd2ff',
  300: '#ddaaff',
  400: '#cb7aff',
  500: '#be56ff',
  600: '#a832ef',
  700: '#8f21cd',
  800: '#771fa8',
  900: '#611c86',
}

export const fontFamily =
  "'Inter var', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif"

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: brand[500],
    primaryColorHover: brand[400],
    primaryColorPressed: brand[700],
    primaryColorSuppl: brand[400],
    borderRadius: '8px',
    borderRadiusSmall: '6px',
    fontFamily,
    fontSize: '14px',
    lineHeight: '1.6',
  },
  Alert: {
    borderRadius: '12px',
    padding: '12px 16px',
  },
  Input: {
    borderRadius: '9px',
  },
  Popover: {
    borderRadius: '10px',
  },
  Modal: {
    borderRadius: '14px',
  },
  Tooltip: {
    borderRadius: '8px',
  },
}
