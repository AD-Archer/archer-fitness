/**
 * Logger utility that respects the no-console linting rule
 * Only logs in development environment to avoid production console output
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  error: (message: string, error?: unknown) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(message, error)
    }
    // In production, you could send to external logging service here
  },
  
  warn: (message: string, data?: unknown) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(message, data)
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.info(message, data)
    }
  },
  
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(message, data)
    }
  }
}