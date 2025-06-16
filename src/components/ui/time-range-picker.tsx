"use client";

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { useState } from "react";
import { toZonedTime, format as formatInTimeZone } from 'date-fns-tz';
import { useTranslations } from 'next-intl';

interface Timezone {
  value: string;
  label: string;
  offset: string;
  region: string;
  primary?: boolean;
}

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 获取用户当前时区
const getUserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    return 'Asia/Shanghai'; // 仅在获取失败时作为后备选项
  }
};

interface DateTimePickerProps {
  value?: Date;
  onChange?: (timestamp: number) => void;
  label?: string;
  description?: string;
  showTimezone?: boolean;
  timezone?: string;
  onTimezoneChange?: (timezone: string) => void;
  disabled?: boolean;
}

export function DateTimePicker({ 
  value = (() => {
    const today = new Date();
    today.setHours(6, 0, 0, 0);
    return today;
  })(), 
  onChange, 
  label = "选择日期和时间",
  description,
  showTimezone = true,
  timezone: externalTimezone,
  onTimezoneChange,
  disabled
}: DateTimePickerProps) {
  const t = useTranslations('create.datePicker');
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(value);
  const [internalTimezone, setInternalTimezone] = useState<string>(getUserTimeZone());
  
  // 使用外部传入的时区或内部状态
  const timezone = externalTimezone || internalTimezone;

  const TIMEZONES: Timezone[] = [
    { value: 'Asia/Shanghai', label: t('timezones.beijing'), offset: 'UTC+8', region: 'asia', primary: true },
    { value: 'Asia/Tokyo', label: t('timezones.tokyo'), offset: 'UTC+9', region: 'asia' },
    { value: 'Asia/Singapore', label: t('timezones.singapore'), offset: 'UTC+8', region: 'asia' },
    { value: 'America/New_York', label: t('timezones.newYork'), offset: 'UTC-5', region: 'america' },
    { value: 'America/Los_Angeles', label: t('timezones.losAngeles'), offset: 'UTC-8', region: 'america' },
    { value: 'Europe/London', label: t('timezones.london'), offset: 'UTC+0', region: 'europe' },
    { value: 'Europe/Paris', label: t('timezones.paris'), offset: 'UTC+1', region: 'europe' },
    { value: 'Australia/Sydney', label: t('timezones.sydney'), offset: 'UTC+10', region: 'oceania' },
    { value: 'UTC', label: t('timezones.utc'), offset: 'UTC+0', region: 'global' }
  ];

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
    const timestamp = newDate.getTime();
    onChange?.(timestamp);
  };

  function handleDateSelect(selectedDate: Date | undefined) {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      handleDateChange(newDate);
    }
  }

  function handleTimeChange(type: "hour" | "minute" | "ampm", value: string) {
    const newDate = new Date(date);

    if (type === "hour") {
      const hour = parseInt(value, 10);
      const isPM = newDate.getHours() >= 12;
      newDate.setHours(isPM ? hour + 12 : hour);
    } else if (type === "minute") {
      newDate.setMinutes(parseInt(value, 10));
    } else if (type === "ampm") {
      const hours = newDate.getHours();
      const hour = hours % 12;
      if (value === "AM" && hours >= 12) {
        newDate.setHours(hour);
      } else if (value === "PM" && hours < 12) {
        newDate.setHours(hour + 12);
      }
    }

    handleDateChange(newDate);
  }

  const handleTimezoneChange = (newTimezone: string) => {
    if (onTimezoneChange) {
      onTimezoneChange(newTimezone);
    } else {
      setInternalTimezone(newTimezone);
    }
  };

  const formatDateTime = (date: Date) => {
    try {
      const currentTimezone = TIMEZONES.find(tz => tz.value === timezone);
      
      // 使用 date-fns 格式化，确保服务端和客户端一致
      const formattedDate = format(date, 'yyyy/MM/dd HH:mm:ss');
      
      return `${formattedDate} ${currentTimezone?.label || ''}`;
    } catch (e) {
      console.error("时间格式化错误:", e);
      return date.toLocaleString();
    }
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full pl-3 text-left font-normal text-[16px] bg-white dark:bg-[#1a1a1a] p-2 rounded-lg focus:outline-none border border-black dark:border-white border-opacity-10 dark:border-opacity-10",
              !date && "text-muted-foreground",
              disabled && "opacity-70 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {date ? formatDateTime(date) : <span>{t('selectDateTime')}</span>}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white dark:bg-[#1a1a1a] rounded-lg border border-black dark:border-white border-opacity-10 dark:border-opacity-10">
          <div className="sm:flex flex-col">
            {showTimezone && (
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('selectTimezone')} />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectGroup>
                      <SelectLabel>{t('commonTimezones')}</SelectLabel>
                      {TIMEZONES.map((tz: Timezone) => (
                        <SelectItem 
                          key={tz.value} 
                          value={tz.value}
                          className={cn(
                            tz.primary && "bg-card font-medium text-primary",
                            `timezone-${tz.region}`
                          )}
                        >
                          {`${tz.label} (${tz.offset})`}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="sm:flex">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
              <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex sm:flex-col p-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1)
                      .map((hour) => (
                        <Button
                          key={hour}
                          size="icon"
                          variant={
                            date &&
                              date.getHours() % 12 === hour % 12
                              ? "primary"
                              : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square text-[16px]"
                          onClick={() => {
                            handleTimeChange("hour", hour.toString());
                          }}
                        >
                          {hour}
                        </Button>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
                <ScrollArea className="w-64 sm:w-auto">
                  <div className="flex sm:flex-col p-2">
                    {Array.from({ length: 12 }, (_, i) => i * 5).map(
                      (minute) => (
                        <Button
                          key={minute}
                          size="icon"
                          variant={
                            date &&
                              date.getMinutes() === minute
                              ? "primary"
                              : "ghost"
                          }
                          className="sm:w-full shrink-0 aspect-square text-[16px]"
                          onClick={() => {
                            handleTimeChange("minute", minute.toString());
                          }}
                        >
                          {minute.toString().padStart(2, '0')}
                        </Button>
                      )
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" className="sm:hidden" />
                </ScrollArea>
                <ScrollArea className="">
                  <div className="flex sm:flex-col p-2">
                    {["AM", "PM"].map((ampm) => (
                      <Button
                        key={ampm}
                        size="icon"
                        variant={
                          date &&
                            ((ampm === "AM" &&
                              date.getHours() < 12) ||
                              (ampm === "PM" &&
                                date.getHours() >= 12))
                            ? "primary"
                            : "ghost"
                        }
                        className="sm:w-full shrink-0 aspect-square text-[16px]"
                        onClick={() => {
                          handleTimeChange("ampm", ampm);
                        }}
                      >
                        {ampm}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  );
}
