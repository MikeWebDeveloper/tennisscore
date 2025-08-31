// Service worker utilities
export const serviceWorkerUtils = {
  register: async (scriptURL: string) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(scriptURL)
        console.log('ServiceWorker registration successful:', registration)
        return registration
      } catch (error) {
        console.error('ServiceWorker registration failed:', error)
        throw error
      }
    }
    throw new Error('Service workers not supported')
  },
  
  unregister: async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    }
  },
  
  update: async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' })
    }
  }
}

export default serviceWorkerUtils