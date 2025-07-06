import { useEffect, useRef } from 'react';

export function useTableScrollIndicator() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const checkScrollable = () => {
      const isScrollable = container.scrollWidth > container.clientWidth;
      container.classList.toggle('scrollable', isScrollable);
    };

    // Check on mount
    checkScrollable();

    // Check on window resize
    const resizeObserver = new ResizeObserver(checkScrollable);
    resizeObserver.observe(container);

    // Check on content changes
    const mutationObserver = new MutationObserver(checkScrollable);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return containerRef;
} 