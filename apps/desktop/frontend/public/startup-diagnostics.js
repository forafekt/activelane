;(() => {
  var enabled = true

  function serializeError(error) {
    if (!error) return error
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      fileName: error.fileName,
      lineNumber: error.lineNumber,
      columnNumber: error.columnNumber,
    }
  }

  function recentResources(filename) {
    if (!window.performance || !performance.getEntriesByType) return []
    var entries = performance.getEntriesByType('resource')
    var matching = []
    for (var i = Math.max(0, entries.length - 30); i < entries.length; i++) {
      var entry = entries[i]
      if (
        !filename ||
        entry.name === filename ||
        entry.name.indexOf(filename) >= 0 ||
        filename.indexOf(entry.name) >= 0
      ) {
        matching.push({
          name: entry.name,
          initiatorType: entry.initiatorType,
          startTime: Math.round(entry.startTime),
          duration: Math.round(entry.duration),
          transferSize: entry.transferSize,
        })
      }
    }
    return matching
  }

  function sourceContext(url, line, column) {
    if (!url || !window.fetch) return
    fetch(url, { cache: 'no-store' })
      .then((response) =>
        response.text().then((text) => {
          var lines = text.split(/\r?\n/)
          var lineNumber = Number(line) || 1
          var start = Math.max(1, lineNumber - 2)
          var end = Math.min(lines.length, lineNumber + 2)
          var context = []
          for (var i = start; i <= end; i++) {
            context.push({
              line: i,
              source: lines[i - 1],
              marker:
                i === lineNumber && column
                  ? new Array(Math.max(1, Number(column))).join(' ') + '^'
                  : '',
            })
          }
          log('[ActiveLane source context]', {
            url: url,
            status: response.status,
            contentType: response.headers.get('content-type'),
            line: line,
            column: column,
            firstCharacters: text.slice(0, 200),
            context: context,
          })
        }),
      )
      .catch((error) => {
        log('[ActiveLane source context unavailable]', {
          url: url,
          error: serializeError(error),
        })
      })
  }

  function stripComments(source) {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
  }

  function moduleSpecifiers(source) {
    var stripped = stripComments(source)
    var regex =
      /(?:import|export)\s+(?:[^'"()]*?\s+from\s*)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g
    var matches = []
    var match
    while ((match = regex.exec(stripped))) matches.push(match[1] || match[2])
    return matches
  }

  function resolveModuleUrl(specifier, fromUrl) {
    if (!specifier || specifier.indexOf('data:') === 0 || specifier.indexOf('blob:') === 0)
      return ''
    try {
      return new URL(specifier, fromUrl).href
    } catch (_) {
      return ''
    }
  }

  function moduleGraphContext(entryUrl) {
    if (!entryUrl || !window.fetch) return
    var seen = {}
    var queue = [entryUrl]
    var suspicious = []
    var visitedUrls = []
    var visited = 0

    function next() {
      var url = queue.shift()
      if (!url || seen[url] || visited > 600) return Promise.resolve()
      seen[url] = true
      visitedUrls.push(url)
      visited += 1
      return fetch(url, { cache: 'no-store' })
        .then((response) =>
          response.text().then((text) => {
            var contentType = response.headers.get('content-type') || ''
            var firstCharacters = text.trim().slice(0, 200)
            if (
              !response.ok ||
              (contentType.indexOf('javascript') < 0 && contentType.indexOf('css') < 0) ||
              firstCharacters.indexOf('{') === 0 ||
              firstCharacters.indexOf('<') === 0
            ) {
              suspicious.push({
                url: url,
                status: response.status,
                contentType: contentType,
                firstCharacters: firstCharacters,
              })
            }
            if (contentType.indexOf('javascript') >= 0) {
              moduleSpecifiers(text).forEach((specifier) => {
                var nextUrl = resolveModuleUrl(specifier, url)
                if (nextUrl && !seen[nextUrl]) queue.push(nextUrl)
              })
            }
          }),
        )
        .then(next)
    }

    next()
      .then(() => {
        log('[ActiveLane module graph context]', {
          entryUrl: entryUrl,
          visited: visited,
          visitedUrls: visitedUrls,
          suspicious: suspicious,
        })
      })
      .catch((error) => {
        log('[ActiveLane module graph context unavailable]', {
          entryUrl: entryUrl,
          error: serializeError(error),
        })
      })
  }

  function log(label, payload) {
    if (!enabled) return
    console.error(label, payload)
  }

  window.__ACTIVELANE_DIAGNOSTICS__ = {
    mark: (phase, detail) => {
      if (!enabled) return
      console.error('[ActiveLane startup]', { phase: phase, detail: detail || '' })
    },
    moduleImport: (specifier, phase) => {
      if (!enabled) return
      console.error('[ActiveLane module import]', { phase: phase, specifier: specifier })
    },
  }

  window.addEventListener(
    'error',
    (event) => {
      var target = event.target
      if (target && target !== window && (target.src || target.href)) {
        log('[ActiveLane resource error]', {
          tagName: target.tagName,
          url: target.src || target.href,
          outerHTML: target.outerHTML,
          recentResources: recentResources(target.src || target.href),
        })
        sourceContext(target.src || target.href)
        if (target.tagName === 'SCRIPT' && target.type === 'module') {
          moduleGraphContext(target.src)
        }
        return
      }
      log('[ActiveLane script error]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: serializeError(event.error),
        recentResources: recentResources(event.filename),
      })
      sourceContext(event.filename, event.lineno, event.colno)
    },
    true,
  )

  window.addEventListener('unhandledrejection', (event) => {
    var reason = event.reason
    var url = reason && (reason.fileName || reason.filename)
    log('[ActiveLane unhandled rejection]', {
      reason:
        reason instanceof Error
          ? serializeError(reason)
          : {
              type: typeof reason,
              value: reason,
            },
      recentResources: recentResources(url),
    })
    sourceContext(url, reason && reason.lineNumber, reason && reason.columnNumber)
  })
})()
