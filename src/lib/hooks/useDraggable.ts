import { useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

export function useDraggable(initialPosition: Position = { x: 100, y: 100 }, enabled: boolean = true) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0
  });

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY
    });
  };

  const handleDragEnd = () => {
    dragRef.current.isDragging = false;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current.isDragging) {
        setPosition({
          x: e.clientX - dragRef.current.startX,
          y: e.clientY - dragRef.current.startY
        });
      }
    };

    const onMouseUp = () => {
      dragRef.current.isDragging = false;
    };

    if (enabled) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [enabled]);

  return {
    position,
    handleDragStart,
    handleDrag,
    handleDragEnd
  };
}
