'use client';

import { dateStringToDate, dateToDateString, getReadableTextColor, truncate } from '@workspace/core/utils/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar';
import { Button } from '@workspace/ui/components/button';
import { Calendar } from '@workspace/ui/components/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@workspace/ui/components/hover-card';
import PaginationRow from '@workspace/ui/components/pagination-row';
import { Popover, PopoverContent, PopoverTrigger } from '@workspace/ui/components/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { add, format, isAfter, isBefore, isFuture, isToday, isYesterday, sub } from 'date-fns';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuChevronDown, LuChevronLeft, LuChevronRight, LuLoaderCircle, LuUser } from 'react-icons/lu';
import { TbUserDown } from 'react-icons/tb';

import HoverDevCard from '~/components/HoverDevCard';
import { useAuth } from '~/providers/auth-providers';
import { api } from '~/trpc/client';

import RankNumber from './components/rank-number';

export default function PageClient({ initialMetric }: { initialMetric?: string }) {
  return (
    <main className="container mx-auto my-8 px-4 md:px-12">
      <LeadersTable initialMetric={initialMetric} />
    </main>
  );
}

const FROM_DTAE = new Date(2025, 0, 1);
const TO_DTAE = new Date();
const METRICS = {
  aiLines: 'AI Lines of code',
  humanLines: 'Human lines of code',
  aiSpend: 'AI Spend',
  totalCodeTime: 'Code time',
} as const;
type Metric = keyof typeof METRICS;
const METRIC_COOKIE = 'leaderboard-metric';

function saveMetric(metric: Metric) {
  document.cookie = `${METRIC_COOKIE}=${metric}; path=/; max-age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

function LeadersTable({ initialMetric }: { initialMetric?: string }) {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const pathname = usePathname();
  const hasRetried = useRef(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [savedMetric, setSavedMetric] = useState<Metric>(initialMetric && initialMetric in METRICS ? (initialMetric as Metric) : 'aiLines');
  const router = useRouter();

  const currentDate = useMemo(() => {
    const dateStr = searchParams.get('date');
    if (!dateStr) {
      return new Date();
    }
    try {
      const date = dateStringToDate(dateStr);
      if (isBefore(date, FROM_DTAE) || isAfter(date, TO_DTAE)) {
        return new Date();
      }
      return date;
    } catch (error) {
      console.error(error);
      return new Date();
    }
  }, [searchParams]);

  const page = useMemo(() => {
    const page = searchParams.get('page');
    if (!page || isNaN(Number(page)) || Number(page) < 1) {
      return 1;
    }
    return Number(page);
  }, [searchParams]);

  const dateString = useMemo(() => dateToDateString(currentDate), [currentDate]);
  const metricParam = searchParams.get('metric');
  const metric: Metric = metricParam && metricParam in METRICS ? (metricParam as Metric) : savedMetric;

  useEffect(() => {
    saveMetric(metric);
    if (metricParam && metricParam in METRICS) {
      // Keep a shared URL's choice when navigating back to a URL without a metric.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedMetric(metric);
    }
  }, [metric, metricParam]);

  const leadersQuery = api.leaderboard.getLeaders.useQuery({ date: dateString, page, metric });
  const programLanguagesQuery = api.languages.getAllProgramLanguages.useQuery();
  const editorsQuery = api.editors.getAllEditors.useQuery();

  const languages = useMemo(() => {
    return new Map<string, string | null>(programLanguagesQuery.data?.map((lang) => [lang.name, lang.color]) ?? []);
  }, [programLanguagesQuery.data]);

  const editors = useMemo(() => {
    return new Map<string, string | null>(editorsQuery.data?.map((editor) => [editor.name, editor.color]) ?? []);
  }, [editorsQuery.data]);

  const previousDate = useMemo(() => {
    return sub(currentDate, { days: 1 });
  }, [currentDate]);

  const nextDate = useMemo(() => {
    return add(currentDate, { days: 1 });
  }, [currentDate]);

  const currentUserRank = useMemo(() => {
    const index = currentUser ? (leadersQuery.data?.items.findIndex((leader) => leader.user.id === currentUser.id) ?? -1) : -1;
    return index < 0 ? 0 : (page - 1) * (leadersQuery.data?.limit ?? 500) + index + 1;
  }, [currentUser, leadersQuery.data?.items, leadersQuery.data?.limit, page]);

  const handleSetPage = useCallback(
    (page: number, replace?: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set('page', String(page));
      } else {
        params.delete('page');
      }
      const url = `${pathname}${params.size ? `?${params.toString()}` : ''}`;
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [pathname, router, searchParams],
  );

  const handleSetDate = useCallback(
    (date: Date, replace?: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (isToday(date)) {
        params.delete('date');
      } else {
        params.set('date', dateToDateString(date));
      }

      const url = `${pathname}${params.size ? `?${params.toString()}` : ''}`;
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [pathname, router, searchParams],
  );

  const handleSetMetric = useCallback(
    (value: string) => {
      if (!(value in METRICS)) return;
      setSavedMetric(value as Metric);
      saveMetric(value as Metric);
      const params = new URLSearchParams(searchParams.toString());
      params.set('metric', value);
      params.delete('page');
      router.push(`${pathname}${params.size ? `?${params.toString()}` : ''}`);
    },
    [pathname, router, searchParams],
  );

  // refetch leaders once if we don't have any for the current day, because it syncs with WakaTime on the first fetch
  useEffect(() => {
    if (leadersQuery.isSuccess && !hasRetried.current) {
      if (leadersQuery.data.totalItems === 0) {
        hasRetried.current = true;
        void utils.leaderboard.getLeaders.refetch();
      }
    }
  }, [leadersQuery.isSuccess, leadersQuery.data?.totalItems, utils.leaderboard.getLeaders]);

  // If search params date is a future date (after TO_DATE) or before 2025 (before FROM_DATE) we will revert back to today
  useEffect(() => {
    const date = searchParams.get('date');
    if (!date) {
      return;
    }

    const jsDate = dateStringToDate(date);
    if (isBefore(jsDate, FROM_DTAE) || isAfter(jsDate, TO_DTAE)) {
      handleSetDate(new Date(), true);
    }
  }, [handleSetDate, searchParams]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer gap-2" aria-label={`Leaderboard metric: ${METRICS[metric]}`}>
              {METRICS[metric]}
              <LuChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value={metric} onValueChange={handleSetMetric}>
              {Object.entries(METRICS).map(([value, label]) => (
                <DropdownMenuRadioItem key={value} value={value} className="cursor-pointer">
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                disabled={isBefore(previousDate, new Date(2025, 0, 1))}
                onClick={() => handleSetDate(previousDate)}
                className="cursor-pointer"
              >
                <LuChevronLeft />
                <div className="sr-only">{isYesterday(previousDate) ? 'Yesterday' : formatDate(previousDate)}</div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isYesterday(previousDate) ? 'Yesterday' : formatDate(previousDate)}</TooltipContent>
          </Tooltip>

          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                {formatDate(currentDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  const d = new Date();
                  d.setUTCFullYear(date.getFullYear());
                  d.setUTCMonth(date.getMonth());
                  d.setUTCDate(date.getDate());
                  handleSetDate(d);
                  setDatePickerOpen(false);
                }}
                autoFocus
                required
                startMonth={FROM_DTAE}
                endMonth={TO_DTAE}
                disabled={{ before: FROM_DTAE, after: TO_DTAE }}
              />
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                disabled={isFuture(nextDate)}
                onClick={() => handleSetDate(nextDate)}
                className="cursor-pointer"
              >
                <LuChevronRight />
                <div className="sr-only">{isToday(nextDate) ? 'Today' : formatDate(nextDate)}</div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isToday(nextDate) ? 'Today' : formatDate(nextDate)}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow noHover={true}>
              <TableHead className="pl-4">
                <div className="flex items-center gap-1">
                  Position
                  {!!currentUser && currentUserRank > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`#@${currentUser.username ?? currentUser.id}`}>
                          <TbUserDown />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>{`${isToday(currentDate) ? 'You’re' : 'You'} ranked ${formatRank(currentUserRank)}`}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>{`${METRICS[metric]}${isToday(currentDate) ? ' Today' : ''}`}</TableHead>
              <TableHead>Languages</TableHead>
              <TableHead>Editors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadersQuery.isPending ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex items-center justify-center px-4 py-16">
                    <LuLoaderCircle className="size-6 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : leadersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="text-muted-foreground p-4 text-center">{leadersQuery.error.message}</div>
                </TableCell>
              </TableRow>
            ) : leadersQuery.data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="text-muted-foreground p-4 text-center">
                    {isToday(currentDate)
                      ? metric === 'totalCodeTime'
                        ? `It’s a new day, the clock resets at midnight ${leadersQuery.data.timezone}. Get your coding on!`
                        : `No ${METRICS[metric].toLowerCase()} data available today.`
                      : `No ${METRICS[metric].toLowerCase()} data available for this date.`}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leadersQuery.data.items.map((leader, i) => (
                <TableRow key={leader.user.id} id={`@${leader.user.username ?? leader.user.id}`}>
                  <TableCell className="pl-4">
                    <RankNumber rank={(page - 1) * leadersQuery.data.limit + i + 1} />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-0 max-w-md items-center gap-2">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Avatar className="size-10">
                            {leader.user.avatarUrl ? (
                              <Link href={leader.user.url}>
                                <AvatarImage src={leader.user.avatarUrl} />
                              </Link>
                            ) : null}
                            <AvatarFallback>
                              <LuUser className="size-5" />
                            </AvatarFallback>
                          </Avatar>
                        </HoverCardTrigger>
                        <HoverCardContent className="pointer-events-auto">
                          <HoverDevCard user={leader.user} />
                        </HoverCardContent>
                      </HoverCard>
                      <div className="min-w-0 flex-1">
                        {!leader.user.name && !leader.user.username && (
                          <p className="flex-1 truncate font-semibold">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Link href={leader.user.url}>@{truncate(leader.user.id, 13)}</Link>
                              </HoverCardTrigger>
                              <HoverCardContent className="pointer-events-auto">
                                <HoverDevCard user={leader.user} />
                              </HoverCardContent>
                            </HoverCard>
                          </p>
                        )}
                        {leader.user.name && (
                          <p className="flex-1 truncate font-semibold">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Link href={leader.user.url}>{truncate(leader.user.name, 20)}</Link>
                              </HoverCardTrigger>
                              <HoverCardContent className="pointer-events-auto">
                                <HoverDevCard user={leader.user} />
                              </HoverCardContent>
                            </HoverCard>
                          </p>
                        )}
                        {leader.user.username && (
                          <p
                            className={cn('flex-1 truncate', {
                              'text-muted-foreground': leader.user.name,
                              'font-semibold': !leader.user.name,
                            })}
                          >
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <Link href={leader.user.url}>@{truncate(leader.user.username, 20)}</Link>
                              </HoverCardTrigger>
                              <HoverCardContent className="pointer-events-auto">
                                <HoverDevCard user={leader.user} />
                              </HoverCardContent>
                            </HoverCard>
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg">{formatMetricValue(leader.metricValue ?? 0, metric)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-xs flex max-w-md flex-wrap gap-2">
                      {leader.languages.map((language, index) => {
                        if (language.totalSeconds < 60 && index > 0) {
                          return null;
                        }
                        const bgColor = languages.get(language.programLanguageName) ?? undefined;
                        const color = getReadableTextColor(bgColor, theme === 'dark' ? 'white' : 'black');
                        return (
                          <Button
                            key={language.programLanguageName}
                            size="sm"
                            variant="secondary"
                            className="h-fit px-2 py-1.5 text-xs"
                            style={{ backgroundColor: bgColor, color }}
                          >
                            {`${language.programLanguageName} - ${formatSeconds(language.totalSeconds)}`}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-xs flex max-w-md flex-wrap gap-2">
                      {leader.editors.map((editor, index) => {
                        if (editor.totalSeconds < 60 && index > 0) {
                          return null;
                        }
                        const bgColor = editors.get(editor.editorName) ?? undefined;
                        const color = getReadableTextColor(bgColor, theme === 'dark' ? 'white' : 'black');
                        return (
                          <Button
                            key={editor.editorName}
                            size="sm"
                            variant="secondary"
                            className="h-fit px-2 py-1.5 text-xs"
                            style={{ backgroundColor: bgColor, color }}
                          >
                            {`${editor.editorName} - ${formatSeconds(editor.totalSeconds)}`}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {leadersQuery.isSuccess && leadersQuery.data.totalPages > 1 ? (
        <PaginationRow className="mt-4" page={page} totalPages={leadersQuery.data.totalPages} onPageChange={handleSetPage} />
      ) : null}
    </>
  );
}

function numberWithCommas(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatMetricValue(value: number, metric: Metric) {
  if (metric.endsWith('Time')) return formatSeconds(value);
  if (metric === 'aiSpend') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 0.01 ? 4 : 2,
    }).format(value);
  }
  return numberWithCommas(value);
}

function formatSeconds(totalSeconds: number) {
  let text = '';

  if (totalSeconds < 60) {
    return '0 m';
  }

  const hours = Math.floor(totalSeconds / 3600.0);
  const minutes = Math.floor(totalSeconds / 60.0) % 60;
  if (hours > 0) {
    text += numberWithCommas(hours) + ' h';
  }
  if (minutes > 0) {
    text += ' ' + minutes + ' m';
  }
  return text.trim();
}

function formatDate(date: Date) {
  return format(date, 'E MMM do yyyy');
}

function formatRank(rank: number): string {
  switch (rank) {
    case 1:
      return '1st place';
    case 2:
      return '2nd place';
    case 3:
      return '3rd place';
    default:
      return rank.toString();
  }
}
