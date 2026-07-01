import { useEffect, useState } from 'react'

export type AppRoute = 'admin' | 'display' | 'summary' | 'settings'

const routeSet = new Set<AppRoute>(['admin', 'display', 'summary', 'settings'])

function readRoute(): AppRoute {
  const hash = window.location.hash.replace('#', '')
  return routeSet.has(hash as AppRoute) ? (hash as AppRoute) : 'admin'
}

export function useRoute() {
  const [route, setRoute] = useState<AppRoute>(readRoute)

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

export function routeHref(route: AppRoute) {
  return `#${route}`
}
