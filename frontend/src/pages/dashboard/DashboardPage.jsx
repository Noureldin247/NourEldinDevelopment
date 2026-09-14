import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import DashboardCard from '../../components/DashboardCard';
import StatTile from '../../components/StatTile';
import AlertTile from '../../components/AlertTile';
import QuickActionButton from '../../components/QuickActionButton';
import {
  useOpenConsignments,
  useCustodyStock,
  useTopCustomers,
  useCustomerStatement,
  useDraftInvoices,
  useOverdueInvoices,
  useMonthlyRevenue,
  useOverdueConsignments,
  useUnpricedLines,
  useLowStockItems,
} from '../../hooks/useDashboardQueries';
import { useCustomerNames } from '../../hooks/useInvoiceQueries';

function LoadingState({ label }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
      {label}
    </div>
  );
}

function EmptyState({ label }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{label}</div>;
}

function ErrorState({ label, onRetry, retryLabel }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p>{label}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-3 rounded-full bg-rose-600 px-3 py-1 text-white">
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

function CustomerBalanceCard() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const { data: customerNames } = useCustomerNames(search);
  const { data, isLoading, isError, refetch } = useCustomerStatement(selectedCustomerName);

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const formatCurrency = (value) => `${Number(value || 0).toLocaleString(numberLocale)} ${t('common.currency')}`;

  return (
    <DashboardCard title={t('dashboard.customerBalance.title')} subtitle={t('dashboard.customerBalance.subtitle')}>
      <input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setSelectedCustomerName('');
        }}
        placeholder={t('dashboard.customerBalance.searchPlaceholder')}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
      />
      <div className="flex flex-wrap gap-2">
        {(customerNames?.data ?? []).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setSelectedCustomerName(name)}
            className={`rounded-full px-3 py-2 text-sm ${selectedCustomerName === name ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {name}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState label={t('dashboard.customerBalance.loading')} /> : null}
      {isError ? <ErrorState label={t('dashboard.customerBalance.error')} retryLabel={t('common.retry')} onRetry={() => refetch()} /> : null}
      {!isLoading && !isError && data ? (
        <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-sm text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">{t('dashboard.customerBalance.currentBalance')}</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(data.balance ?? 0)}</p>
          <p className="mt-2 text-sm text-slate-300">{t('dashboard.customerBalance.updated')}</p>
        </div>
      ) : null}
      {!isLoading && !isError && !data ? <EmptyState label={t('dashboard.customerBalance.empty')} /> : null}
    </DashboardCard>
  );
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const role = session?.role;
  const queryClient = useQueryClient();
  const [range, setRange] = useState('today');
  const [threshold] = useState(14);

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const formatNumber = (value) => Number(value || 0).toLocaleString(numberLocale);
  const formatCurrency = (value) => `${Number(value || 0).toLocaleString(numberLocale)} ${t('common.currency')}`;

  const received = useOpenConsignments('RECEIVED');
  const inProduction = useOpenConsignments('IN_PRODUCTION');
  const readyForDelivery = useOpenConsignments('READY_FOR_DELIVERY');
  const custodyStock = useCustodyStock();
  const topCustomers = useTopCustomers();
  const draftInvoices = useDraftInvoices();
  const overdueInvoices = useOverdueInvoices();
  const monthlyRevenue = useMonthlyRevenue();
  const overdueConsignments = useOverdueConsignments();
  const unpricedLines = useUnpricedLines();
  const lowStockItems = useLowStockItems();

  // status لسه بيتبعت بالإنجليزي للـ backend (لازم يطابق قيم enum قاعدة البيانات)
  // لكن الـ label اللي بيشوفه المستخدم بيتترجم حسب اللغة الحالية
  const statCards = [
    { title: t('dashboard.stat.received'), status: 'RECEIVED', data: received, tone: 'neutral' },
    { title: t('dashboard.stat.inProduction'), status: 'IN_PRODUCTION', data: inProduction, tone: 'neutral' },
    { title: t('dashboard.stat.readyForDelivery'), status: 'READY_FOR_DELIVERY', data: readyForDelivery, tone: 'success' },
  ];

  const roleTitle = t(`dashboard.roleLabel.${role}`, { defaultValue: t('dashboard.title') });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">{roleTitle}</p>
            <h1 className="text-2xl font-semibold text-slate-900">{t('dashboard.title')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => queryClient.invalidateQueries()} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
              {t('app.refreshData')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-4">
          {statCards.map((item) => {
            const list = item.data?.data ?? [];
            const value = list.length ? formatNumber(list.length) : formatNumber(0);

            if (item.data.isLoading) {
              return <div key={item.title} className="h-full"><LoadingState label={t('dashboard.stat.loading')} /></div>;
            }

            if (item.data.isError) {
              return (
                <div key={item.title} className="h-full">
                  <ErrorState label={t('dashboard.stat.error', { title: item.title })} retryLabel={t('common.retry')} onRetry={() => item.data.refetch()} />
                </div>
              );
            }

            return (
              <div key={item.title} className="h-full">
                <StatTile title={item.title} value={value} hint={t('dashboard.stat.openHint')} tone={item.tone} />
              </div>
            );
          })}
        </div>

        <DashboardCard title={t('dashboard.custody.title')} subtitle={t('dashboard.custody.subtitle')}>
          {custodyStock.isLoading ? <LoadingState label={t('dashboard.custody.loading')} /> : null}
          {custodyStock.isError ? <ErrorState label={t('dashboard.custody.error')} retryLabel={t('common.retry')} onRetry={() => custodyStock.refetch()} /> : null}
          {!custodyStock.isLoading && !custodyStock.isError && custodyStock.data ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <StatTile title={t('dashboard.custody.totalKg')} value={formatNumber(custodyStock.data.totalKg ?? 0)} tone="neutral" />
              <StatTile title={t('dashboard.custody.totalMetres')} value={formatNumber(custodyStock.data.totalMetres ?? 0)} tone="neutral" />
            </div>
          ) : null}
          {!custodyStock.isLoading && !custodyStock.isError && !custodyStock.data ? <EmptyState label={t('dashboard.custody.empty')} /> : null}
        </DashboardCard>

        <DashboardCard title={t('dashboard.overdueConsignments.title')} subtitle={t('dashboard.overdueConsignments.subtitle', { threshold })}>
          {overdueConsignments.isLoading ? <LoadingState label={t('dashboard.overdueConsignments.loading')} /> : null}
          {overdueConsignments.isError ? <ErrorState label={t('dashboard.overdueConsignments.error')} retryLabel={t('common.retry')} onRetry={() => overdueConsignments.refetch()} /> : null}
          {!overdueConsignments.isLoading && !overdueConsignments.isError && overdueConsignments.data?.data?.length ? (
            <div className="space-y-3">
              {overdueConsignments.data.data.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-amber-200 bg-amber-50/70 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{item.consignmentNo || item.id}</span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      {t('dashboard.overdueConsignments.daysOverdue', { count: item.daysOverdue ?? threshold })}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600">{item.customerName || t('dashboard.overdueConsignments.unknownCustomer')}</p>
                </div>
              ))}
            </div>
          ) : null}
          {!overdueConsignments.isLoading && !overdueConsignments.isError && !overdueConsignments.data?.data?.length ? (
            <EmptyState label={t('dashboard.overdueConsignments.empty')} />
          ) : null}
        </DashboardCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardCard title={t('dashboard.receivedRange.title')} subtitle={t('dashboard.receivedRange.subtitle')}>
          <div className="flex gap-2">
            <button type="button" onClick={() => setRange('today')} className={`rounded-full px-3 py-2 text-sm ${range === 'today' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {t('dashboard.receivedRange.today')}
            </button>
            <button type="button" onClick={() => setRange('week')} className={`rounded-full px-3 py-2 text-sm ${range === 'week' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
              {t('dashboard.receivedRange.week')}
            </button>
          </div>
          <StatTile
            title={range === 'today' ? t('dashboard.receivedRange.todayLabel') : t('dashboard.receivedRange.weekLabel')}
            value={range === 'today' ? formatNumber(12) : formatNumber(65)}
            tone="success"
          />
        </DashboardCard>

        <DashboardCard title={t('dashboard.topCustomers.title')} subtitle={t('dashboard.topCustomers.subtitle', { count: formatNumber(5) })}>
          {topCustomers.isLoading ? <LoadingState label={t('dashboard.topCustomers.loading')} /> : null}
          {topCustomers.isError ? <ErrorState label={t('dashboard.topCustomers.error')} retryLabel={t('common.retry')} onRetry={() => topCustomers.refetch()} /> : null}
          {!topCustomers.isLoading && !topCustomers.isError && topCustomers.data?.data?.length ? (
            <div className="space-y-2">
              {topCustomers.data.data.slice(0, 5).map((item, index) => (
                <div key={item.customerId || item.id || index} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{item.customerName || item.name || t('dashboard.topCustomers.unknownCustomer')}</p>
                    <p className="mt-1 text-xs text-slate-500">{t('dashboard.topCustomers.openFabrics')}</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">{formatNumber(item.quantity ?? item.totalQuantity ?? 0)}</div>
                </div>
              ))}
            </div>
          ) : null}
          {!topCustomers.isLoading && !topCustomers.isError && !topCustomers.data?.data?.length ? <EmptyState label={t('dashboard.topCustomers.empty')} /> : null}
        </DashboardCard>

        <CustomerBalanceCard />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardCard title={t('dashboard.draftInvoices.title')} subtitle={t('dashboard.draftInvoices.subtitle')}>
          {draftInvoices.isLoading ? <LoadingState label={t('dashboard.draftInvoices.loading')} /> : null}
          {draftInvoices.isError ? <ErrorState label={t('dashboard.draftInvoices.error')} retryLabel={t('common.retry')} onRetry={() => draftInvoices.refetch()} /> : null}
          {!draftInvoices.isLoading && !draftInvoices.isError && draftInvoices.data?.data?.length ? (
            <StatTile title={t('dashboard.draftInvoices.count')} value={formatNumber(draftInvoices.data.data.length)} tone="warning" />
          ) : null}
          {!draftInvoices.isLoading && !draftInvoices.isError && !draftInvoices.data?.data?.length ? <EmptyState label={t('dashboard.draftInvoices.empty')} /> : null}
        </DashboardCard>

        <DashboardCard title={t('dashboard.overdueInvoices.title')} subtitle={t('dashboard.overdueInvoices.subtitle')}>
          {overdueInvoices.isLoading ? <LoadingState label={t('dashboard.overdueInvoices.loading')} /> : null}
          {overdueInvoices.isError ? <ErrorState label={t('dashboard.overdueInvoices.error')} retryLabel={t('common.retry')} onRetry={() => overdueInvoices.refetch()} /> : null}
          {!overdueInvoices.isLoading && !overdueInvoices.isError && overdueInvoices.data?.data?.length ? (
            <div className="space-y-3">
              {overdueInvoices.data.data.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-[20px] border border-rose-200 bg-rose-50/70 p-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{item.invoiceNo || item.id}</span>
                    <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-rose-700">{item.dueDate || '—'}</span>
                  </div>
                  <p className="mt-2 font-semibold text-rose-700">{formatCurrency(item.total ?? 0)}</p>
                </div>
              ))}
            </div>
          ) : null}
          {!overdueInvoices.isLoading && !overdueInvoices.isError && !overdueInvoices.data?.data?.length ? <EmptyState label={t('dashboard.overdueInvoices.empty')} /> : null}
        </DashboardCard>

        <DashboardCard title={t('dashboard.monthlyRevenue.title')} subtitle={t('dashboard.monthlyRevenue.subtitle')}>
          {monthlyRevenue.isLoading ? <LoadingState label={t('dashboard.monthlyRevenue.loading')} /> : null}
          {monthlyRevenue.isError ? <ErrorState label={t('dashboard.monthlyRevenue.error')} retryLabel={t('common.retry')} onRetry={() => monthlyRevenue.refetch()} /> : null}
          {!monthlyRevenue.isLoading && !monthlyRevenue.isError && monthlyRevenue.data ? (
            <StatTile title={t('dashboard.monthlyRevenue.total')} value={formatCurrency(monthlyRevenue.data.total ?? 0)} tone="success" />
          ) : null}
          {!monthlyRevenue.isLoading && !monthlyRevenue.isError && !monthlyRevenue.data ? <EmptyState label={t('dashboard.monthlyRevenue.empty')} /> : null}
        </DashboardCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DashboardCard title={t('dashboard.alerts.title')} subtitle={t('dashboard.alerts.subtitle')}>
          {overdueConsignments.isLoading ? <LoadingState label={t('dashboard.alerts.loading')} /> : null}
          {overdueConsignments.isError ? <ErrorState label={t('dashboard.alerts.error')} retryLabel={t('common.retry')} onRetry={() => overdueConsignments.refetch()} /> : null}
          {!overdueConsignments.isLoading && !overdueConsignments.isError && overdueConsignments.data?.data?.length ? (
            <div className="space-y-3">
              <AlertTile
                title={t('dashboard.alerts.overdueTitle')}
                description={t('dashboard.alerts.overdueDescription')}
                tone="warning"
                actionLabel={t('dashboard.alerts.viewDetails')}
                onAction={() => window.alert(t('dashboard.alerts.consignmentAlertBody'))}
              />
              {unpricedLines.isLoading ? <LoadingState label={t('dashboard.alerts.loadingUnpriced')} /> : null}
              {unpricedLines.isError ? <ErrorState label={t('dashboard.alerts.errorUnpriced')} retryLabel={t('common.retry')} onRetry={() => unpricedLines.refetch()} /> : null}
              {!unpricedLines.isLoading && !unpricedLines.isError && unpricedLines.data?.data?.length ? (
                <AlertTile
                  title={t('dashboard.alerts.unpricedTitle')}
                  description={t('dashboard.alerts.unpricedDescription', { count: unpricedLines.data.data.length })}
                  tone="danger"
                  actionLabel={t('dashboard.alerts.viewDetails')}
                  onAction={() => window.alert(t('dashboard.alerts.unpricedAlertBody'))}
                />
              ) : null}
              {!unpricedLines.isLoading && !unpricedLines.isError && !unpricedLines.data?.data?.length ? <EmptyState label={t('dashboard.alerts.emptyUnpriced')} /> : null}
            </div>
          ) : null}
          {!overdueConsignments.isLoading && !overdueConsignments.isError && !overdueConsignments.data?.data?.length ? <EmptyState label={t('dashboard.alerts.empty')} /> : null}

          {lowStockItems.isLoading ? <LoadingState label={t('dashboard.alerts.loadingLowStock')} /> : null}
          {lowStockItems.isError ? <ErrorState label={t('dashboard.alerts.errorLowStock')} retryLabel={t('common.retry')} onRetry={() => lowStockItems.refetch()} /> : null}
          {!lowStockItems.isLoading && !lowStockItems.isError && lowStockItems.data?.data?.length ? (
            <AlertTile
              title={t('dashboard.alerts.lowStockTitle')}
              description={t('dashboard.alerts.lowStockDescription', { count: lowStockItems.data.data.length })}
              tone="danger"
              actionLabel={t('dashboard.alerts.viewDetails')}
              onAction={() => window.alert(t('dashboard.alerts.lowStockAlertBody'))}
            />
          ) : null}
        </DashboardCard>

        <DashboardCard title={t('dashboard.quickActions.title')} subtitle={t('dashboard.quickActions.subtitle')}>
          <div className="flex flex-wrap gap-3">
            <QuickActionButton label={t('dashboard.quickActions.newConsignment')} onClick={() => window.alert(t('dashboard.quickActions.newConsignmentAlert'))} />
            <QuickActionButton label={t('dashboard.quickActions.newInvoice')} onClick={() => window.alert(t('dashboard.quickActions.newInvoiceAlert'))} />
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              placeholder={t('dashboard.quickActions.searchPlaceholder')}
              className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
            />
            <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              {t('dashboard.quickActions.searchButton')}
            </button>
          </div>
        </DashboardCard>

        <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-500">
          {t('dashboard.upcomingCardPlaceholder')}
        </div>
      </div>
    </div>
  );
}
