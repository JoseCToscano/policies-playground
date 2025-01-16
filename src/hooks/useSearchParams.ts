'use client';

import { usePathname, useRouter, useSearchParams as useNextSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function useSearchParams<T extends Record<string, string>>() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useNextSearchParams();

  const createQueryString = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(searchParams.toString());
      
      // Update or delete params based on the updates object
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      return params.toString();
    },
    [searchParams]
  );

  const setParams = useCallback(
    (updates: Partial<T>) => {
        console.log('updates', updates);
      const queryString = createQueryString(updates);
      router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
    },
    [pathname, router, createQueryString]
  );

  const getParam = useCallback(
    (key: keyof T) => searchParams.get(key as string) ?? undefined,
    [searchParams]
  );

  return {
    params: searchParams,
    setParams,
    getParam,
  };
}