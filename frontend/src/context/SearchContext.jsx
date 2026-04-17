import { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [query, setQuery] = useState('');

  const clearSearch = useCallback(() => setQuery(''), []);

  return (
    <SearchContext.Provider value={{ query, setQuery, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
