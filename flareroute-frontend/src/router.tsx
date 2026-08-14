import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'

interface RouterContextType {
  path: string
  search: string
  navigate: (to: string) => void
}

const RouterContext = createContext<RouterContextType>({
  path: '/',
  search: '',
  navigate: () => {},
})

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [currentUrl, setCurrentUrl] = useState(() => ({
    path: window.location.pathname || '/',
    search: window.location.search || '',
  }))
  const [, startTransition] = useTransition()

  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        setCurrentUrl({
          path: window.location.pathname || '/',
          search: window.location.search || '',
        })
      })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (to: string) => {
    const [newPath, newSearch = ''] = to.split('?')
    if (newPath !== currentUrl.path || (newSearch ? `?${newSearch}` : '') !== currentUrl.search) {
      window.history.pushState(null, '', to)
      startTransition(() => {
        setCurrentUrl({
          path: newPath.startsWith('/') ? newPath : `/${newPath}`,
          search: newSearch ? `?${newSearch}` : '',
        })
      })
    }
  }

  return (
    <RouterContext.Provider
      value={{
        path: currentUrl.path,
        search: currentUrl.search,
        navigate,
      }}
    >
      {children}
    </RouterContext.Provider>
  )
}

export function useLocation() {
  const { path, search } = useContext(RouterContext)
  return { pathname: path, search }
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext)
  return navigate
}

export function useSearchParams(): [URLSearchParams, (params: Record<string, string>) => void] {
  const { search, path, navigate } = useContext(RouterContext)
  const searchParams = new URLSearchParams(search)

  const setSearchParams = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params)
    const queryString = sp.toString()
    navigate(`${path}${queryString ? `?${queryString}` : ''}`)
  }

  return [searchParams, setSearchParams]
}

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  className?: string
  children: React.ReactNode
}

export function Link({ to, className, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useContext(RouterContext)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e)
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault()
      navigate(to)
    }
  }

  return (
    <a href={to} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  )
}

interface NavLinkProps extends Omit<LinkProps, 'className'> {
  className?: string | ((props: { isActive: boolean }) => string)
}

export function NavLink({ to, className, children, ...rest }: NavLinkProps) {
  const { path } = useContext(RouterContext)
  const [targetPath] = to.split('?')
  const isActive = path === targetPath || (targetPath !== '/' && path.startsWith(targetPath))

  const computedClassName = typeof className === 'function' ? className({ isActive }) : className

  return (
    <Link to={to} className={computedClassName} {...rest}>
      {children}
    </Link>
  )
}
