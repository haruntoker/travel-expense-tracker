/**
 * Application Configuration
 * Controls debug logging and other environment-specific settings
 */

export const config = {
  // Debug logging - only enabled in development
  debug: process.env.NODE_ENV === 'development',
  
  // Log levels
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  
  // Feature flags
  features: {
    debugLogging: process.env.NODE_ENV === 'development',
    verboseErrors: process.env.NODE_ENV === 'development',
    performanceMonitoring: process.env.NODE_ENV === 'production',
  },
  
  // Security settings
  security: {
    hideUserIds: true,
    hideInternalErrors: process.env.NODE_ENV === 'production',
    sanitizeLogs: true,
  }
}

/**
 * Safe logging utility that respects production settings
 */
export const safeLog = {
  debug: (message: string, ...args: any[]) => {
    if (config.debug) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (config.logLevel === 'debug' || config.logLevel === 'error') {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (config.logLevel === 'debug' || config.logLevel === 'warn') {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (config.logLevel === 'debug' || config.logLevel === 'info') {
      console.info(`[INFO] ${message}`, ...args)
    }
  }
}
