/**
 * Logger utility that respects the no-console linting rule
 * Only logs in development environment to avoid production console output
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  error: (message: string, error?: unknown) => {
    if (isDevelopment) {
      if (error !== undefined) {
        // eslint-disable-next-line no-console
        console.error(message, error)
      } else {
        // eslint-disable-next-line no-console
        console.error(message)
      }
    }
    // In production, you could send to external logging service here
  },
  
  warn: (message: string, data?: unknown) => {
    if (isDevelopment) {
      if (data !== undefined) {
        // eslint-disable-next-line no-console
        console.warn(message, data)
      } else {
        // eslint-disable-next-line no-console
        console.warn(message)
      }
    }
  },
  
  info: (message: string, data?: unknown) => {
    if (isDevelopment) {
      if (data !== undefined) {
        // eslint-disable-next-line no-console
        console.info(message, data)
      } else {
        // eslint-disable-next-line no-console
        console.info(message)
      }
    }
  },
  
  debug: (message: string, data?: unknown) => {
    if (isDevelopment) {
      if (data !== undefined) {
        // eslint-disable-next-line no-console
        console.debug(message, data)
      } else {
        // eslint-disable-next-line no-console
        console.debug(message)
      }
    }
  }
}