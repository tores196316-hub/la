import React, { createContext, useContext, useState, useEffect, ReactNode, MouseEvent } from 'react';

export type AppRoute =
  | '/'
  | '/giris'
  | '/kayit'
  | '/profil'
  | '/premium'
  | '/gecmis'
  | '/yardim'
  | '/admin'
  | '/404';

interface RouterContextType {
  path: string;
  navigate: (to: string, replace?: boolean) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (to: string, replace = false) => {
    if (to === path) return;
    if (replace) {
      window.history.replaceState({}, '', to);
    } else {
      window.history.pushState({}, '', to);
    }
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  return (
    <RouterContext.Provider value={{ path, navigate, goBack }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export interface LinkProps {
  key?: React.Key;
  to: string;
  children?: ReactNode;
  className?: string;
  replace?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
  id?: string;
  title?: string;
}

export function Link({ to, children, className = '', replace = false, onClick, target, rel, id, title }: LinkProps) {
  const { navigate } = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (!e.defaultPrevented && !target && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      navigate(to, replace);
    }
  };

  return (
    <a href={to} onClick={handleClick} className={className} target={target} rel={rel} id={id} title={title}>
      {children}
    </a>
  );
}
