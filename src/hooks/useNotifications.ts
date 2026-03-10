import { useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/hooks/usePreferences';
import { fetchPersonalBills } from '@/lib/api';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

type NotificationPermission = 'default' | 'granted' | 'denied';

function getPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

export function useNotificationPermission() {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }, []);

  return {
    permission: getPermission(),
    isSupported: typeof Notification !== 'undefined',
    requestPermission,
  };
}

interface DueBill {
  id: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  amount: number;
}

function showBillNotification(bill: DueBill) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  const tag = `bill-due-${bill.id}`;
  let body: string;

  if (bill.daysUntilDue < 0) {
    body = `"${bill.description}" está vencida há ${Math.abs(bill.daysUntilDue)} dia(s)!`;
  } else if (bill.daysUntilDue === 0) {
    body = `"${bill.description}" vence HOJE!`;
  } else {
    body = `"${bill.description}" vence em ${bill.daysUntilDue} dia(s).`;
  }

  try {
    new Notification('JáPaguei - Lembrete', {
      body,
      icon: '/pwa-icon-192.png',
      tag,
    } as NotificationOptions);
  } catch {
    // SW notification fallback
    navigator.serviceWorker?.ready?.then((reg) => {
      reg.showNotification('JáPaguei - Lembrete', {
        body,
        icon: '/pwa-icon-192.png',
        tag,
        renotify: false,
      });
    });
  }
}

export function useBillDueNotifications() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const notifiedRef = useRef<Set<string>>(new Set());

  const { data: bills } = useQuery({
    queryKey: ['personal-bills', user?.id],
    queryFn: () => fetchPersonalBills(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!bills || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const today = startOfDay(new Date());
    const pendingBills = bills.filter(
      (b: { status: string; due_date: string | null }) => b.status === 'pendente' && b.due_date
    );

    const dueBills: DueBill[] = [];

    for (const bill of pendingBills) {
      const dueDate = startOfDay(parseISO(bill.due_date!));
      const days = differenceInDays(dueDate, today);

      const shouldNotify =
        (preferences.notify_overdue && days < 0) ||
        (preferences.notify_due_1day && days >= 0 && days <= 1) ||
        (preferences.notify_due_3days && days >= 0 && days <= 3) ||
        (preferences.notify_due_7days && days >= 0 && days <= 7);

      if (shouldNotify) {
        dueBills.push({
          id: bill.id,
          description: bill.description,
          dueDate: bill.due_date!,
          daysUntilDue: days,
          amount: bill.amount,
        });
      }
    }

    // Show notifications with a small stagger
    dueBills.forEach((bill, i) => {
      if (notifiedRef.current.has(bill.id)) return;
      notifiedRef.current.add(bill.id);

      setTimeout(() => showBillNotification(bill), i * 1500);
    });
  }, [bills, preferences]);
}
