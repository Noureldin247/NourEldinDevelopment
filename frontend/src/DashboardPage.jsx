import React, { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import DashboardCard from './components/DashboardCard';
import StatTile from './components/StatTile';
import AlertTile from './components/AlertTile';
import QuickActionButton from './components/QuickActionButton';
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
} from './hooks/useDashboardQueries';

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

function ErrorState({ label, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <p>{label}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-3 rounded-full bg-rose-600 px-3 py-1 text-white">
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('ar-EG');
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('ar-EG')} EGP`;
}

function CustomerBalanceCard() {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const { data, isLoading, isError, refetch } = useCustomerStatement(selectedCustomerId);

  const customers = useMemo(() => {
    const items = [
      { id: 'C-1001', name: 'أحمد علي' },
      { id: 'C-1002', name: 'سارة محمود' },
      { id: 'C-1003', name: 'علي فخري' },
    ];

    if (!search.trim()) {
      return items;
    }

    return items.filter((item) => `${item.name} ${item.id}`.includes(search));
  }, [search]);

  return (
    <DashboardCard title="رصيد العميل (كارتة العملاء)" subtitle="ابحث بالاسم أو الكود ثم اختر العميل">
      <input
        dir="rtl"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="ابحث عن العميل"
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
      />
      <div className="flex flex-wrap gap-2">
        {customers.map((customer) => (
          <button
            key={customer.id}
            type="button"
            onClick={() => setSelectedCustomerId(customer.id)}
            className={`rounded-full px-3 py-2 text-sm ${selectedCustomerId === customer.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
          >
            {customer.name} • {customer.id}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState label="جاري تحميل رصيد العميل..." /> : null}
      {isError ? <ErrorState label="تعذر تحميل رصيد العميل." onRetry={() => refetch()} /> : null}
      {!isLoading && !isError && data ? (
        <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-sm text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">الرصيد الحالي</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(data.balance ?? 0)}</p>
          <p className="mt-2 text-sm text-slate-300">تم تحديث البيانات لهذا العميل</p>
        </div>
      ) : null}
      {!isLoading && !isError && !data ? <EmptyState label="لا يوجد رصيد متاح لهذا العميل" /> : null}
    </DashboardCard>
  );
}

export default function DashboardPage({ title = 'لوحة الإدارة', userName, onLogout }) {
  const queryClient = useQueryClient();
  const [range, setRange] = useState('today');
  const [threshold, setThreshold] = useState(14);

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

  // status لسه بيتبعت بالإنجليزي للـ backend (لازم يطابق قيم enum قاعدة البيانات)
  // لكن الـ label اللي بيشوفه المستخدم بالعربي
  const statCards = [
    { title: 'مستلمة', status: 'RECEIVED', data: received, tone: 'neutral' },
    { title: 'قيد التصنيع', status: 'IN_PRODUCTION', data: inProduction, tone: 'neutral' },
    { title: 'جاهزة للتسليم', status: 'READY_FOR_DELIVERY', data: readyForDelivery, tone: 'success' },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">{title}</p>
              <h1 className="text-2xl font-semibold text-slate-900">لوحة تحكم العمليات</h1>
            </div>
            <div className="flex items-center gap-3">
              {userName ? <span className="text-sm text-slate-500">مرحبًا، {userName}</span> : null}
              <button type="button" onClick={() => queryClient.invalidateQueries()} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
                تحديث البيانات
              </button>
              {onLogout ? (
                <button type="button" onClick={onLogout} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
                  تسجيل الخروج
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-4">
            {statCards.map((item, index) => {
              const list = item.data?.data ?? [];
              const value = list.length ? formatNumber(list.length) : '٠';

              if (item.data.isLoading) {
                return <div key={item.title} className="h-full"><LoadingState label="جاري تحميل الرسائل..." /></div>;
              }

              if (item.data.isError) {
                return <div key={item.title} className="h-full"><ErrorState label={`تعذر تحميل الرسائل (${item.title}).`} onRetry={() => item.data.refetch()} /></div>;
              }

              return (
                <div key={item.title} className="h-full">
                  <StatTile title={item.title} value={value} hint="رسائل مفتوحة" tone={item.tone} />
                </div>
              );
            })}
          </div>

          <DashboardCard title="المخزن الحالي — خامات أمانات" subtitle="الكمية فقط بدون قيمة مالية">
            {custodyStock.isLoading ? <LoadingState label="جاري تحميل المخزون..." /> : null}
            {custodyStock.isError ? <ErrorState label="تعذر تحميل المخزون." onRetry={() => custodyStock.refetch()} /> : null}
            {!custodyStock.isLoading && !custodyStock.isError && custodyStock.data ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile title="الوزن الكلي (kg)" value={formatNumber(custodyStock.data.totalKg ?? 0)} tone="neutral" />
                <StatTile title="الطول الكلي (متر)" value={formatNumber(custodyStock.data.totalMetres ?? 0)} tone="neutral" />
              </div>
            ) : null}
            {!custodyStock.isLoading && !custodyStock.isError && !custodyStock.data ? <EmptyState label="لا يوجد مخزون متاح" /> : null}
          </DashboardCard>

          <DashboardCard title="رسائل متأخرة" subtitle={`عند تجاوز ${threshold} يومًا`}>
            {overdueConsignments.isLoading ? <LoadingState label="جاري تحميل الرسائل المتأخرة..." /> : null}
            {overdueConsignments.isError ? <ErrorState label="تعذر تحميل الرسائل المتأخرة." onRetry={() => overdueConsignments.refetch()} /> : null}
            {!overdueConsignments.isLoading && !overdueConsignments.isError && overdueConsignments.data?.data?.length ? (
              <div className="space-y-3">
                {overdueConsignments.data.data.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-[20px] border border-amber-200 bg-amber-50/70 p-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{item.consignmentNo || item.id}</span>
                      <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-amber-700">{item.daysOverdue ?? threshold} يوم</span>
                    </div>
                    <p className="mt-2 text-slate-600">{item.customerName || 'عميل غير محدد'}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {!overdueConsignments.isLoading && !overdueConsignments.isError && (!overdueConsignments.data?.data?.length ? true : false) ? <EmptyState label="لا توجد رسائل متأخرة" /> : null}
          </DashboardCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <DashboardCard title="رسائل مستلمة اليوم / هذا الأسبوع" subtitle="تبديل النطاق">
            <div className="flex gap-2">
              <button type="button" onClick={() => setRange('today')} className={`rounded-full px-3 py-2 text-sm ${range === 'today' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                اليوم
              </button>
              <button type="button" onClick={() => setRange('week')} className={`rounded-full px-3 py-2 text-sm ${range === 'week' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}>
                هذا الأسبوع
              </button>
            </div>
            <StatTile title={range === 'today' ? 'الرسائل المستلمة اليوم' : 'الرسائل المستلمة هذا الأسبوع'} value={range === 'today' ? '١٢' : '٦٥'} tone="success" />
          </DashboardCard>

          <DashboardCard title="أعلى العملاء من حيث كمية الأقمشة المفتوحة" subtitle="أفضل ٥ عملاء">
            {topCustomers.isLoading ? <LoadingState label="جاري تحميل أعلى العملاء..." /> : null}
            {topCustomers.isError ? <ErrorState label="تعذر تحميل قائمة العملاء." onRetry={() => topCustomers.refetch()} /> : null}
            {!topCustomers.isLoading && !topCustomers.isError && topCustomers.data?.data?.length ? (
              <div className="space-y-2">
                {topCustomers.data.data.slice(0, 5).map((item, index) => (
                  <div key={item.customerId || item.id || index} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">{item.customerName || item.name || 'عميل غير محدد'}</p>
                      <p className="mt-1 text-xs text-slate-500">الأقمشة المفتوحة</p>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 font-semibold text-slate-700">{formatNumber(item.quantity ?? item.totalQuantity ?? 0)}</div>
                  </div>
                ))}
              </div>
            ) : null}
            {!topCustomers.isLoading && !topCustomers.isError && !topCustomers.data?.data?.length ? <EmptyState label="لا توجد بيانات عملاء" /> : null}
          </DashboardCard>

          <CustomerBalanceCard />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <DashboardCard title="فواتير تحت الإعداد (غير مُصدَرة)" subtitle="حالة: مسودة">
            {draftInvoices.isLoading ? <LoadingState label="جاري تحميل الفواتير..." /> : null}
            {draftInvoices.isError ? <ErrorState label="تعذر تحميل الفواتير." onRetry={() => draftInvoices.refetch()} /> : null}
            {!draftInvoices.isLoading && !draftInvoices.isError && draftInvoices.data?.data?.length ? (
              <StatTile title="عدد الفواتير غير المصدرة" value={formatNumber(draftInvoices.data.data.length)} tone="warning" />
            ) : null}
            {!draftInvoices.isLoading && !draftInvoices.isError && !draftInvoices.data?.data?.length ? <EmptyState label="لا توجد فواتير تحت الإعداد" /> : null}
          </DashboardCard>

          <DashboardCard title="فواتير متأخرة السداد" subtitle="فواتير منتهية وتحتاج متابعة">
            {overdueInvoices.isLoading ? <LoadingState label="جاري تحميل الفواتير المتأخرة..." /> : null}
            {overdueInvoices.isError ? <ErrorState label="تعذر تحميل الفواتير المتأخرة." onRetry={() => overdueInvoices.refetch()} /> : null}
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
            {!overdueInvoices.isLoading && !overdueInvoices.isError && !overdueInvoices.data?.data?.length ? <EmptyState label="لا توجد فواتير متأخرة" /> : null}
          </DashboardCard>

          <DashboardCard title="إجمالي فاتورة الصباغة هذا الشهر" subtitle="الفواتير المعتمدة هذا الشهر">
            {monthlyRevenue.isLoading ? <LoadingState label="جاري تحميل الإيراد الشهري..." /> : null}
            {monthlyRevenue.isError ? <ErrorState label="تعذر تحميل الإيراد الشهري." onRetry={() => monthlyRevenue.refetch()} /> : null}
            {!monthlyRevenue.isLoading && !monthlyRevenue.isError && monthlyRevenue.data ? (
              <StatTile title="الإجمالي الشهري" value={formatCurrency(monthlyRevenue.data.total ?? 0)} tone="success" />
            ) : null}
            {!monthlyRevenue.isLoading && !monthlyRevenue.isError && !monthlyRevenue.data ? <EmptyState label="لا توجد إيرادات لهذا الشهر" /> : null}
          </DashboardCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <DashboardCard title="تنبيهات" subtitle="أهم النقاط التي تتطلب متابعة">
            {overdueConsignments.isLoading ? <LoadingState label="جاري تحميل التنبيهات..." /> : null}
            {overdueConsignments.isError ? <ErrorState label="تعذر تحميل التنبيهات." onRetry={() => overdueConsignments.refetch()} /> : null}
            {!overdueConsignments.isLoading && !overdueConsignments.isError && overdueConsignments.data?.data?.length ? (
              <div className="space-y-3">
                <AlertTile title="رسائل مفتوحة تجاوزت مدة معينة" description="تتطلب مراجعة سريعة" tone="warning" actionLabel="عرض التفاصيل" onAction={() => window.alert('تفاصيل الرسالة')} />
                {unpricedLines.isLoading ? <LoadingState label="جاري تحميل الأصناف غير المسعّرة..." /> : null}
                {unpricedLines.isError ? <ErrorState label="تعذر تحميل الأصناف غير المسعّرة." onRetry={() => unpricedLines.refetch()} /> : null}
                {!unpricedLines.isLoading && !unpricedLines.isError && unpricedLines.data?.data?.length ? (
                  <AlertTile title="أصناف بدون سعر معتمد" description={`${unpricedLines.data.data.length} صنف يحتاج تصحيح السعر`} tone="danger" actionLabel="عرض التفاصيل" onAction={() => window.alert('تفاصيل الأصناف')} />
                ) : null}
                {!unpricedLines.isLoading && !unpricedLines.isError && !unpricedLines.data?.data?.length ? <EmptyState label="لا توجد أصناف بدون سعر معتمد" /> : null}
              </div>
            ) : null}
            {!overdueConsignments.isLoading && !overdueConsignments.isError && !overdueConsignments.data?.data?.length ? <EmptyState label="لا توجد تنبيهات حالياً" /> : null}
          </DashboardCard>

          <DashboardCard title="إجراءات سريعة" subtitle="تنقل سريع بين العمليات الأساسية">
            <div className="flex flex-wrap gap-3">
              <QuickActionButton label="تكويد رسالة جديدة" onClick={() => window.alert('الانتقال إلى /consignments/new')} />
              <QuickActionButton label="فاتورة صباغة جديدة" onClick={() => window.alert('الانتقال إلى /invoices/new')} />
            </div>
            <div className="flex flex-wrap gap-3">
              <input dir="rtl" placeholder="استعلام برقم الرسالة / اسم العميل" className="min-w-[260px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none" />
              <button type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                بحث
              </button>
            </div>
          </DashboardCard>

          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/60 p-5 text-sm text-slate-500">
            بطاقة إضافية للعمليات القادمة
          </div>
        </div>
      </div>
    </div>
  );
}
