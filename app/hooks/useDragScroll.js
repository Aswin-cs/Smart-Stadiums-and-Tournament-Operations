import { useState, useRef, useEffect, useCallback } from 'react';

export function useDragScroll({ deps = [], dragActiveClass = null } = {}) {
  const containerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateScrollArrows = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollArrows();
    }, 150);
    window.addEventListener('resize', updateScrollArrows);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScrollArrows);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDragging = useRef(false);

  const handleMouseDown = (e) => {
    const el = containerRef.current;
    if (!el) return;
    isDown.current = true;
    isDragging.current = false;
    if (dragActiveClass) el.classList.add(dragActiveClass);
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseLeave = () => {
    if (!isDown.current) return;
    isDown.current = false;
    const el = containerRef.current;
    if (el && dragActiveClass) el.classList.remove(dragActiveClass);
  };

  const handleMouseUp = () => {
    if (!isDown.current) return;
    isDown.current = false;
    const el = containerRef.current;
    if (el && dragActiveClass) el.classList.remove(dragActiveClass);
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(x - startX.current) > 5) {
      isDragging.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const scrollBy = (amount) => {
    const el = containerRef.current;
    if (el) el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return {
    containerRef,
    showLeftArrow,
    showRightArrow,
    updateScrollArrows,
    handleMouseDown,
    handleMouseLeave,
    handleMouseUp,
    handleMouseMove,
    scrollBy,
    isDragging
  };
}
