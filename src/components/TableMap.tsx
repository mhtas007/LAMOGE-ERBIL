import React, { useRef, useState, useEffect } from 'react';
import { Table } from '../types';
import { Users, GripHorizontal, Edit3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TableMapProps {
  tables: Table[];
  isEditMode: boolean;
  onTableClick: (tableId: string) => void;
  onTableUpdate: (tableId: string, updates: Partial<Table>) => void;
  onEditTable?: (table: Table) => void;
}

export const TableMap: React.FC<TableMapProps> = ({ tables, isEditMode, onTableClick, onTableUpdate, onEditTable }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent, tableId: string) => {
    if (!isEditMode) return;
    e.preventDefault();
    setDraggingId(tableId);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingId || !containerRef.current || !isEditMode) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    // Constrain to container
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    onTableUpdate(draggingId, { positionX: x, positionY: y });
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId]);

  // Initial positioning logic if no position is set
  useEffect(() => {
    tables.forEach((table, index) => {
      if (table.positionX === undefined || table.positionY === undefined) {
        // Place in a grid automatically for the first time
        const cols = 5;
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = (col * 20) + 10;
        const y = (row * 20) + 10;
        onTableUpdate(table.id, { positionX: x, positionY: y });
      }
    });
  }, [tables, onTableUpdate]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full min-h-[600px] bg-natural-surface rounded-[2rem] border-2 border-natural-border overflow-hidden transition-all duration-300 ${isEditMode ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZTFkYWQ1Ii8+Cjwvc3ZnPg==")] shadow-inner ring-4 ring-natural-accent/20' : ''}`}
    >
      {isEditMode && (
        <div className="absolute top-4 left-4 right-4 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-center font-medium z-0">
          <GripHorizontal className="mr-2" size={18} />
          Drag tables to reposition. Click the edit icon on a table to change its shape or capacity.
        </div>
      )}

      {tables.map(table => {
        const x = table.positionX ?? 50;
        const y = table.positionY ?? 50;
        
        const shape = table.shape || (table.capacity <= 4 ? 'round' : 'rectangle');
        
        let widthClass = 'w-24';
        let heightClass = 'h-24';
        let shapeClass = 'rounded-full';

        if (shape === 'round') {
          widthClass = table.capacity > 4 ? 'w-28' : 'w-24';
          heightClass = table.capacity > 4 ? 'h-28' : 'h-24';
          shapeClass = 'rounded-full';
        } else if (shape === 'square') {
          widthClass = table.capacity > 4 ? 'w-28' : 'w-24';
          heightClass = table.capacity > 4 ? 'h-28' : 'h-24';
          shapeClass = 'rounded-[1rem]';
        } else if (shape === 'rectangle') {
          widthClass = 'w-36';
          heightClass = 'h-24';
          shapeClass = 'rounded-[1rem]';
        }
        
        const statusStyles = {
          available: 'bg-natural-surface border-natural-border text-natural-text',
          occupied: 'bg-natural-dark border-natural-dark text-natural-dark-text',
          reserved: 'bg-amber-100 border-amber-300 text-amber-900',
        };

        const isDraggingThis = draggingId === table.id;

        // Render chairs
        const chairs = [];
        const numChairs = table.capacity;
        
        if (shape === 'round') {
           const angleStep = 360 / numChairs;
           for (let i = 0; i < numChairs; i++) {
             chairs.push(
               <div key={i} className="absolute w-4 h-4 rounded-full bg-natural-border/60 -z-10" style={{
                 transform: `rotate(${i * angleStep}deg) translateY(-120%)`,
                 transformOrigin: 'center'
               }} />
             );
           }
        } else if (shape === 'square') {
           // Distribute evenly on 4 sides
           const chairsPerSide = Math.ceil(numChairs / 4);
           // Simple approach: just put them around using absolute positioning or just a dotted border
        }

        return (
          <motion.div
            key={table.id}
            layoutId={table.id}
            onMouseDown={(e) => handleMouseDown(e as unknown as React.MouseEvent, table.id)}
            onClick={() => !isEditMode && onTableClick(table.id)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-pointer hover:-translate-y-2 hover:scale-105'} transition-transform duration-300`}
            style={{ 
              left: `${x}%`, 
              top: `${y}%`,
              zIndex: isDraggingThis ? 50 : 10,
              scale: isDraggingThis ? 1.1 : 1
            }}
          >
            {/* Table Surface */}
            <div className={`relative flex flex-col items-center justify-center border-[3px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${widthClass} ${heightClass} ${shapeClass} ${statusStyles[table.status]}`}>
              {isEditMode && onEditTable && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditTable(table); }}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-natural-surface border-2 border-natural-border rounded-full flex items-center justify-center text-natural-text hover:text-blue-600 hover:border-blue-200 shadow-sm z-20 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
              )}

              <span className="text-2xl font-black mb-0.5 tracking-tight">T{table.number}</span>
              <div className="flex items-center gap-1 opacity-60 text-[10px] font-bold uppercase tracking-wider">
                <Users size={10} />
                <span>{table.capacity}</span>
              </div>
              
              {/* Outer decorative ring */}
              <div className={`absolute inset-[-8px] border-2 border-dashed border-black/10 pointer-events-none ${shapeClass}`}></div>

              {table.status === 'occupied' && table.occupiedAt && (
                <div className="absolute -bottom-3 bg-rose-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-md whitespace-nowrap tracking-widest uppercase">
                  Active
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
