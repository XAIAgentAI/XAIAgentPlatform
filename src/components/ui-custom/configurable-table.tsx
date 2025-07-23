import React, { useState, useMemo } from "react";
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Column configuration type
export type ColumnConfig<T> = {
  id: string;                    // Column unique identifier
  header: string;                // Column header
  width?: string;                // Column width
  align?: 'left' | 'center' | 'right'; // Alignment
  sortable?: boolean;            // Whether sortable
  cell: (row: T, index: number) => React.ReactNode; // Cell render function
  cellClassName?: string;        // Cell class name
  headerClassName?: string;      // Header class name
};

// Table configuration type
export type TableConfig<T> = {
  columns: ColumnConfig<T>[];    // Table column configuration
  data: T[];                     // Table data
  rowKey?: keyof T | ((row: T) => string); // Row unique key
  emptyText?: string;            // Empty data message
  selectable?: boolean;          // Whether selectable
  loading?: boolean;             // Loading state
  height?: string | number;      // Table height
  maxHeight?: string | number;   // Table max height
  scroll?: {                     // Table scroll settings
    x?: boolean | number | string; // Horizontal scroll
    y?: boolean | number | string; // Vertical scroll
  };
  fixedLeftColumn?: boolean;     // Whether to fix left column
  className?: string;            // Table container class name
  tableClassName?: string;       // Table class name
  headerClassName?: string;      // Header class name
  bodyClassName?: string;        // Body class name
  rowClassName?: string | ((row: T, index: number) => string); // Row class name
  onRowClick?: (row: T, index: number) => void; // Row click event
  onSelectionChange?: (selectedRows: T[]) => void; // Selection change event
};

// Badge component supported variants
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Button component supported variants
type ButtonVariant = "destructive" | "outline" | "secondary" | "ghost" | "link" | "colored" | "primary";

// Column renderer types - provides some predefined cell render functions
export const ColumnRenderers = {
  // Text renderer
  text: <T extends object>(field: keyof T) => 
    (row: T) => <span>{String(row[field] ?? '')}</span>,
  
  // Image renderer
  image: <T extends object>(
    field: keyof T, 
    options?: { 
      width?: string, 
      height?: string, 
      className?: string 
    }
  ) => 
    (row: T) => (
      <img 
        src={String(row[field] ?? '')} 
        className={cn("object-cover", options?.className)}
        style={{ 
          width: options?.width || "40px", 
          height: options?.height || "40px" 
        }}
        alt="" 
      />
    ),
  
  // Avatar renderer
  avatar: <T extends object>(
    field: keyof T, 
    nameField?: keyof T, 
    options?: { 
      className?: string, 
      size?: string,
      avatarClassName?: string | ((row: T) => string) 
    }
  ) => 
    (row: T) => {
      const avatarClass = typeof options?.avatarClassName === 'function' 
        ? options.avatarClassName(row) 
        : options?.avatarClassName;

      return (
        <Avatar className={cn(
          "rounded-md mr-3", 
          avatarClass,
          options?.className,
          options?.size || "w-10 h-10"
        )}>
          <img 
            src={String(row[field] ?? '')} 
            alt={nameField ? String(row[nameField] ?? '') : ""} 
            className="object-cover" 
          />
        </Avatar>
      );
    },
  
  // Avatar with name renderer
  avatarWithName: <T extends object>(
    imageField: keyof T, 
    nameField: keyof T, 
    options?: { 
      className?: string, 
      avatarClassName?: string | ((row: T) => string) 
    }
  ) => 
    (row: T) => {
      const avatarClass = typeof options?.avatarClassName === 'function' 
        ? options.avatarClassName(row) 
        : options?.avatarClassName;

      return (
        <div className="flex items-center">
          <Avatar className={cn("w-10 h-10 rounded-md mr-3", avatarClass)}>
            <img 
              src={String(row[imageField] ?? '')} 
              alt={String(row[nameField] ?? '')} 
              className="object-cover" 
            />
          </Avatar>
          <span className={options?.className}>{String(row[nameField] ?? '')}</span>
        </div>
      );
    },
  
  // Badge renderer
  badge: <T extends object>(
    field: keyof T | ((row: T) => string), 
    options?: { 
      colorMap?: Record<string, string>,
      variantMap?: Record<string, BadgeVariant>,
      className?: string
    }
  ) => 
    (row: T) => {
      const value = typeof field === 'function' 
        ? field(row) 
        : String(row[field] ?? '');
      
      return (
        <Badge 
          variant={options?.variantMap?.[value] || "default"}
          className={cn(
            options?.colorMap?.[value],
            options?.className
          )}
        >
          {value}
        </Badge>
      );
    },
    
  // Button renderer
  button: <T extends object>(
    label: string | ((row: T) => string),
    onClick: (row: T) => void,
    options?: {
      variant?: ButtonVariant,
      className?: string,
      disabled?: (row: T) => boolean
    }
  ) => 
    (row: T) => (
      <Button
        variant={options?.variant || "outline"}
        size="sm"
        className={options?.className}
        disabled={options?.disabled ? options.disabled(row) : false}
        onClick={(e) => {
          e.stopPropagation();
          onClick(row);
        }}
      >
        {typeof label === 'function' ? label(row) : label}
      </Button>
    ),
};

export const ConfigurableTable = <T extends object>({
  columns,
  data,
  rowKey = 'id' as keyof T,
  emptyText,
  selectable = false,
  loading = false,
  height,
  maxHeight,
  scroll = { x: false, y: false },
  fixedLeftColumn = false,
  className,
  tableClassName,
  headerClassName,
  bodyClassName,
  rowClassName,
  onRowClick,
  onSelectionChange,
}: TableConfig<T>) => {
  const t = useTranslations('common');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Use translation or default value
  const localizedEmptyText = emptyText || t('noData');

  // Handle row key calculation
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    } else if (rowKey in row) {
      return String(row[rowKey as keyof T]);
    }
    return String(index);
  };

  // Handle table data sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const valueA = sortColumn in a ? a[sortColumn as keyof T] : null;
      const valueB = sortColumn in b ? b[sortColumn as keyof T] : null;
      
      // If values are equal, return 0
      if (valueA === valueB) return 0;
      
      // If value is null or undefined, sort to the end
      if (valueA == null) return 1;
      if (valueB == null) return -1;
      
      // If values are strings, sort alphabetically
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // If values are numbers, sort numerically
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }
      
      // Otherwise, try to convert to string and compare
      const strA = String(valueA);
      const strB = String(valueB);
      
      return sortDirection === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [data, sortColumn, sortDirection]);

  // Handle column sorting
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Handle row selection
  const handleSelectRow = (rowKey: string, checked: boolean) => {
    const newSelectedKeys = new Set(selectedKeys);
    
    if (checked) {
      newSelectedKeys.add(rowKey);
    } else {
      newSelectedKeys.delete(rowKey);
    }
    
    setSelectedKeys(newSelectedKeys);
    
    if (onSelectionChange) {
      const selectedRows = sortedData.filter((row, index) => 
        newSelectedKeys.has(getRowKey(row, index))
      );
      onSelectionChange(selectedRows);
    }
  };

  // Handle select all/deselect all
  const handleSelectAll = (checked: boolean) => {
    const newSelectedKeys = new Set<string>();
    
    if (checked) {
      sortedData.forEach((row, index) => {
        newSelectedKeys.add(getRowKey(row, index));
      });
    }
    
    setSelectedKeys(newSelectedKeys);
    
    if (onSelectionChange) {
      const selectedRows = checked ? [...sortedData] : [];
      onSelectionChange(selectedRows);
    }
  };

  // Check if all rows are selected
  const isAllSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.length === selectedKeys.size;
  }, [data.length, selectedKeys.size]);

  // Get row class name
  const getRowClassName = (row: T, index: number) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row, index);
    }
    return rowClassName || '';
  };

  // Create table container styles
  const tableContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: height || 'auto',
    maxHeight: maxHeight,
    overflow: 'hidden',
  };

  // Create table content styles
  const tableWrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflowX: scroll?.x ? 'auto' : 'hidden',
    overflowY: scroll?.y ? 'auto' : 'hidden',
    height: '100%',
    width: '100%',
  };

  // Create table styles
  const tableStyle: React.CSSProperties = {};
  
  // Set table min-width to support horizontal scrolling
  if (typeof scroll?.x === 'number' || typeof scroll?.x === 'string') {
    tableStyle.minWidth = scroll.x;
  }

  // Check if left column should be fixed
  const shouldFixColumn = fixedLeftColumn && (scroll?.x || false);

  return (
    <div className={cn("w-full rounded-md", className)} style={tableContainerStyle}>
      <div className="rounded-md border h-full" style={tableWrapperStyle}>
        <Table className={tableClassName} style={tableStyle}>
          <TableHeader className={headerClassName}>
            <TableRow>
              {selectable && (
                <TableHead 
                  className={cn(
                    "w-[30px]", 
                    shouldFixColumn && "sticky left-0 z-20 bg-card"
                  )}
                >
                  <Checkbox 
                    id="select-all" 
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    disabled={data.length === 0}
                  />
                </TableHead>
              )}
              
              {columns.map((column, colIndex) => (
                <TableHead 
                  key={column.id}
                  className={cn(
                    {
                      "text-left whitespace-nowrap overflow-hidden text-ellipsis": column.align === 'left' || !column.align,
                      "text-center whitespace-nowrap overflow-hidden text-ellipsis": column.align === 'center',
                      "text-right whitespace-nowrap overflow-hidden text-ellipsis": column.align === 'right',
                      "cursor-pointer": column.sortable,
                      "sticky left-0 z-20 bg-card": shouldFixColumn && colIndex === 0 && !selectable,
                      [`sticky left-[30px] z-20 bg-card`]: shouldFixColumn && colIndex === 0 && selectable,
                    },
                    column.headerClassName,
                    column.width && `w-[${column.width}]`
                  )}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  <div className="flex items-center whitespace-nowrap overflow-hidden text-ellipsis">
                    {column.header}
                    {column.sortable && sortColumn === column.id && (
                      <span className="ml-1 flex-shrink-0">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody className={bodyClassName}>
            {loading && (
              <TableRow>
                <TableCell 
                  colSpan={selectable ? columns.length + 1 : columns.length} 
                  className="text-center py-6"
                >
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4" 
                        fill="none" 
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            )}
            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell 
                  colSpan={selectable ? columns.length + 1 : columns.length} 
                  className="text-center py-6 text-muted-foreground"
                >
                  {localizedEmptyText}
                </TableCell>
              </TableRow>
            )}
            {!loading && data.length > 0 && (
              sortedData.map((row, index) => {
                const key = getRowKey(row, index);
                return (
                  <TableRow 
                    key={key}
                    className={cn(
                      getRowClassName(row, index),
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                  >
                    {selectable && (
                      <TableCell 
                        className={cn(
                          shouldFixColumn && "sticky left-0 z-10 bg-card"
                        )}
                      >
                        <Checkbox 
                          id={`select-${key}`}
                          checked={selectedKeys.has(key)}
                          onCheckedChange={(checked) => handleSelectRow(key, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column, colIndex) => (
                      <TableCell 
                        key={`${key}-${column.id}`}
                        className={cn(
                          {
                            "text-left whitespace-nowrap overflow-hidden text-ellipsis": column.align === 'left' || !column.align,
                            "text-center whitespace-nowrap overflow-hidden text-ellipsis": column.align === 'center',
                            "text-right whitespace-nowrap overflow-hidden text-ellipsis": column.align === 'right',
                            "sticky left-0 z-10 bg-card before:absolute before:left-0 before:top-0 before:h-full before:w-full before:bg-card before:-z-10": shouldFixColumn && colIndex === 0 && !selectable,
                            [`sticky left-[30px] z-10 bg-card before:absolute before:left-0 before:top-0 before:h-full before:w-full before:bg-card before:-z-10`]: shouldFixColumn && colIndex === 0 && selectable,
                          },
                          column.cellClassName
                          
                        )}
                      >
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                          {column.cell(row, index)}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        
        {/* Loading state */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/50 z-50">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
              <span>{t('loading')}</span>
            </div>
          </div>
        )}
        
        {/* Empty data state */}
        {!loading && data.length === 0 && (
          <div className="py-8 flex items-center justify-center text-muted-foreground">
            {localizedEmptyText}
          </div>
        )}
      </div>
    </div>
  );
};