export class ProxySandbox {

  constructor() {
    const fakeWindow = Object.create(null)
    const proxy = new Proxy(fakeWindow, {
      set: (target, p, value) => {
        if (this.running) {
          target[p] = value
        }
        return true
      },
      get(target, p) {
        switch (p) {
          case 'window':
          case 'self':
          case 'globalThis':
            return proxy
        }
        if (
          !window.hasOwnProperty.call(target, p) &&
          window.hasOwnProperty(p)
        ) {
          // @ts-ignore
          const value = window[p]
          if (typeof value === 'function') return value.bind(window)
          return value
        }
        return target[p]
      },
      has() {
        return true
      },
    })
    this.proxy = proxy
  }
  active() {
    this.running = true
  }
  inactive() {
    this.running = false
  }
}
