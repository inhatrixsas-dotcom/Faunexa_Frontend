import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  it('divide datos en páginas por defecto (10 items)', () => {
    const { result } = renderHook(() => usePagination({ data }));

    expect(result.current.paginatedData).toHaveLength(10);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.currentPage).toBe(1);
  });

  it('avanza a la siguiente página', () => {
    const { result } = renderHook(() => usePagination({ data, itemsPerPage: 10 }));

    act(() => result.current.nextPage());

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedData[0].id).toBe(11);
  });

  it('no pasa de la última página', () => {
    const { result } = renderHook(() =>
      usePagination({ data: [1, 2, 3], itemsPerPage: 2 })
    );

    act(() => result.current.nextPage());
    act(() => result.current.nextPage());

    expect(result.current.currentPage).toBe(2);
  });

  it('va a página específica con goToPage', () => {
    const { result } = renderHook(() => usePagination({ data, itemsPerPage: 5 }));

    act(() => result.current.goToPage(3));

    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedData[0].id).toBe(11);
  });
});
