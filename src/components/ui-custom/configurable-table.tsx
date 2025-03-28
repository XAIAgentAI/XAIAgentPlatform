import React, { useState, useMemo } from "react";
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

// 表格列配置类型
export type ColumnConfig<T> = {
  id: string;                    // 列唯一标识
  header: string;                // 列标题
  width?: string;                // 列宽度
  align?: 'left' | 'center' | 'right'; // 对齐方式
  sortable?: boolean;            // 是否可排序
  cell: (row: T, index: number) => React.ReactNode; // 单元格渲染函数
  cellClassName?: string;        // 单元格类名
  headerClassName?: string;      // 表头类名
};

// 表格配置类型
export type TableConfig<T> = {
  columns: ColumnConfig<T>[];    // 表格列配置
  data: T[];                     // 表格数据
  rowKey?: keyof T | ((row: T) => string); // 行唯一键
  emptyText?: string;            // 空数据提示
  selectable?: boolean;          // 是否可选择
  loading?: boolean;             // 加载状态
  height?: string | number;      // 表格高度
  maxHeight?: string | number;   // 表格最大高度
  scroll?: {                     // 表格滚动设置
    x?: boolean | number | string; // 横向滚动
    y?: boolean | number | string; // 纵向滚动
  };
  fixedLeftColumn?: boolean;     // 是否固定左侧列
  className?: string;            // 表格容器类名
  tableClassName?: string;       // 表格类名
  headerClassName?: string;      // 表头类名
  bodyClassName?: string;        // 表体类名
  rowClassName?: string | ((row: T, index: number) => string); // 行类名
  onRowClick?: (row: T, index: number) => void; // 行点击事件
  onSelectionChange?: (selectedRows: T[]) => void; // 选择变化事件
};

// Badge组件支持的变体类型
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

// Button组件支持的变体类型
type ButtonVariant = "destructive" | "outline" | "secondary" | "ghost" | "link" | "colored" | "primary";

// 列渲染器类型 - 提供一些预定义的单元格渲染函数
export const ColumnRenderers = {
  // 文本渲染器
  text: <T extends object>(field: keyof T) => 
    (row: T) => <span>{String(row[field] ?? '')}</span>,
  
  // 图片渲染器
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
  
  // 头像渲染器
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
          options?.size || "w-8 h-8"
        )}>
          <img 
            src={String(row[field] ?? '')} 
            alt={nameField ? String(row[nameField] ?? '') : ""} 
            className="object-cover" 
          />
        </Avatar>
      );
    },
  
  // 带头像的名称渲染器  
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
          <Avatar className={cn("w-8 h-8 rounded-md mr-3", avatarClass)}>
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
  
  // 徽章渲染器
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
    
  // 按钮渲染器
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
  emptyText = "暂无数据",
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 处理行键计算
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    } else if (rowKey in row) {
      return String(row[rowKey as keyof T]);
    }
    return String(index);
  };

  // 处理表格数据排序
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    
    return [...data].sort((a, b) => {
      const valueA = sortColumn in a ? a[sortColumn as keyof T] : null;
      const valueB = sortColumn in b ? b[sortColumn as keyof T] : null;
      
      // 如果值相等，返回0
      if (valueA === valueB) return 0;
      
      // 如果值为null或undefined，则排在最后
      if (valueA == null) return 1;
      if (valueB == null) return -1;
      
      // 如果值是字符串，则按字母顺序排序
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // 如果值是数字，则按数值大小排序
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortDirection === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }
      
      // 其他情况，尝试转换为字符串比较
      const strA = String(valueA);
      const strB = String(valueB);
      
      return sortDirection === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [data, sortColumn, sortDirection]);

  // 处理列排序
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // 处理行选择
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

  // 处理全选/取消全选
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

  // 判断是否全选
  const isAllSelected = useMemo(() => {
    if (data.length === 0) return false;
    return data.length === selectedKeys.size;
  }, [data.length, selectedKeys.size]);

  // 获取行类名
  const getRowClassName = (row: T, index: number) => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row, index);
    }
    return rowClassName || '';
  };

  // 创建表格容器样式
  const tableContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: height || 'auto',
    maxHeight: maxHeight,
    overflow: 'hidden',
  };

  // 创建表格内容样式
  const tableWrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflowX: scroll?.x ? 'auto' : 'hidden',
    overflowY: scroll?.y ? 'auto' : 'hidden',
    height: '100%',
    width: '100%',
  };

  // 创建表格样式
  const tableStyle: React.CSSProperties = {};
  
  // 设置表格最小宽度，以支持水平滚动
  if (typeof scroll?.x === 'number' || typeof scroll?.x === 'string') {
    tableStyle.minWidth = scroll.x;
  }

  // 判断是否要固定左侧列
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
                    "w-[50px]", 
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
                      "text-left": column.align === 'left' || !column.align,
                      "text-center": column.align === 'center',
                      "text-right": column.align === 'right',
                      "cursor-pointer": column.sortable,
                      "sticky left-0 z-20 bg-card": shouldFixColumn && colIndex === 0 && !selectable,
                      [`sticky left-[50px] z-20 bg-card`]: shouldFixColumn && colIndex === 0 && selectable,
                    },
                    column.headerClassName,
                    column.width && `w-[${column.width}]`
                  )}
                  onClick={column.sortable ? () => handleSort(column.id) : undefined}
                >
                  <div className="flex items-center">
                    {column.header}
                    {column.sortable && sortColumn === column.id && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody className={bodyClassName}>
            {loading ? (
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
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={selectable ? columns.length + 1 : columns.length} 
                  className="text-center py-6 text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
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
                            "text-left": column.align === 'left' || !column.align,
                            "text-center": column.align === 'center',
                            "text-right": column.align === 'right',
                            "sticky left-0 z-10 bg-card": shouldFixColumn && colIndex === 0 && !selectable,
                            [`sticky left-[50px] z-10 bg-card`]: shouldFixColumn && colIndex === 0 && selectable,
                          },
                          column.cellClassName
                        )}
                      >
                        {column.cell(row, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};