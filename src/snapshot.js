/* Wraps a jsdom call and returns the full page */

import jsdom from 'jsdom'

export default (protocol, host, path, delay, options) => {
  return new Promise((resolve, reject) => {
    let reactSnapshotRenderCalled = false
    jsdom.env({
      url: `${protocol}//${host}${path}`,
      headers: { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" },
      resourceLoader(resource, callback) {
        const skipPattern = options.skipScriptPaths
          .map(x => (new RegExp(x)).test(resource.url.pathname))
          .some(x => x);
        
        if (skipPattern) {
          callback()
        } else if (resource.url.host === host) {
          resource.defaultFetch(callback);
        } else {
          callback()
        }
      },
      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"],
        SkipExternalResources: false
      },
      virtualConsole: jsdom.createVirtualConsole().sendTo(console),
      created: (err, window) => {
        if (err) reject(err)
        window.reactSnapshotRender = () => {
          reactSnapshotRenderCalled = true
          setTimeout(() => {
            resolve(window)
          }, delay)
        }
      },
      done: (err, window) => {
        if (!reactSnapshotRenderCalled) {
          reject("'render' from react-snapshot was never called. Did you replace the call to ReactDOM.render()?")
        }
      }
    })
  })
}
