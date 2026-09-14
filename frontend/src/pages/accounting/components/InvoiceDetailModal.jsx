import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../../components/Modal';
import {
  useInvoice,
  usePriceSuggestion,
  useSetLinePrice,
  useIssueInvoice,
  useMarkInvoicePaid,
} from '../../../hooks/useInvoiceQueries';

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function LineRow({ invoiceId, line, isEditable, numberLocale }) {
  const { t } = useTranslation();
  const { data: suggestion } = usePriceSuggestion(line.lineType, line.description);
  const setPrice = useSetLinePrice(invoiceId, line.id);
  const [price, setPriceValue] = useState(line.unitPrice != null ? String(line.unitPrice) : '');
  const [appliedSuggestion, setAppliedSuggestion] = useState(false);

  useEffect(() => {
    if (!appliedSuggestion && line.unitPrice == null && suggestion?.unitPrice != null) {
      setPriceValue(String(suggestion.unitPrice));
      setAppliedSuggestion(true);
    }
  }, [suggestion, appliedSuggestion, line.unitPrice]);

  async function handleBlur() {
    const value = Number(price);
    if (price === '' || Number.isNaN(value) || value === line.unitPrice) return;
    await setPrice.mutateAsync(value);
  }

  const lineTotal = price !== '' && !Number.isNaN(Number(price)) ? Number(price) * Number(line.quantity) : null;

  return (
    <tr className="border-t border-slate-100 text-sm">
      <td className="px-3 py-2 text-slate-600">
        {line.lineType === 'CHEMICAL' ? t('accounting.detail.lineTypeChemical') : t('accounting.detail.lineTypeFabric')}
      </td>
      <td className="px-3 py-2 font-medium text-slate-800">{line.description}</td>
      <td className="px-3 py-2 text-slate-600">
        {Number(line.quantity).toLocaleString(numberLocale)} {line.unit}
      </td>
      <td className="px-3 py-2">
        {isEditable ? (
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPriceValue(event.target.value)}
            onBlur={handleBlur}
            className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-sm outline-none"
          />
        ) : line.unitPrice != null ? (
          Number(line.unitPrice).toLocaleString(numberLocale)
        ) : (
          <span className="text-slate-400">{t('accounting.detail.unitPriceUnset')}</span>
        )}
      </td>
      <td className="px-3 py-2 font-semibold text-slate-800">
        {lineTotal != null ? lineTotal.toLocaleString(numberLocale) : '—'}
      </td>
    </tr>
  );
}

export default function InvoiceDetailModal({ invoiceId, onClose }) {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useInvoice(invoiceId);
  const issueInvoice = useIssueInvoice(invoiceId);
  const markPaid = useMarkInvoicePaid(invoiceId);
  const [dueDate, setDueDate] = useState(defaultDueDate());

  const numberLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';
  const invoice = data?.data;
  const allPriced = invoice?.lines?.every((line) => line.unitPrice != null) ?? false;

  async function handleIssue(event) {
    event.preventDefault();
    try {
      await issueInvoice.mutateAsync(dueDate);
    } catch (error) {
      // surfaced via issueInvoice.error below
    }
  }

  return (
    <Modal title={t('accounting.detail.title')} onClose={onClose} widthClassName="max-w-3xl">
      {isLoading ? <p className="text-sm text-slate-500">{t('accounting.table.loading')}</p> : null}
      {isError ? <p className="text-sm text-rose-600">{t('accounting.table.error')}</p> : null}

      {invoice ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('accounting.detail.invoiceNo')}</p>
              <p className="text-lg font-semibold text-slate-900">{invoice.invoiceNo}</p>
              <p className="mt-1 text-sm text-slate-600">{invoice.customerName}</p>
            </div>
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
              {t(`accounting.status.${invoice.status.toLowerCase()}`)}
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-start">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-start">{t('accounting.detail.lineTypeChemical')}/{t('accounting.detail.lineTypeFabric')}</th>
                  <th className="px-3 py-2 text-start">{t('weighing.detail.chemicalName')}</th>
                  <th className="px-3 py-2 text-start">{t('weighing.detail.chemicalQuantity')}</th>
                  <th className="px-3 py-2 text-start">{t('accounting.detail.priceLabel')}</th>
                  <th className="px-3 py-2 text-start">{t('accounting.detail.total')}</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <LineRow
                    key={line.id}
                    invoiceId={invoiceId}
                    line={line}
                    isEditable={invoice.status === 'DRAFT'}
                    numberLocale={numberLocale}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2 text-lg font-semibold text-slate-900">
            <span>{t('accounting.detail.total')}:</span>
            <span>{Number(invoice.total).toLocaleString(numberLocale)}</span>
          </div>

          {invoice.status === 'DRAFT' ? (
            <form onSubmit={handleIssue} className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">{t('accounting.detail.dueDateLabel')}</span>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!allPriced || issueInvoice.isPending}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                >
                  {t('accounting.detail.issueButton')}
                </button>
              </div>
              {!allPriced ? <p className="text-xs text-amber-600">{t('accounting.detail.issueBlockedHint')}</p> : null}
              {issueInvoice.isError ? <p className="text-sm text-rose-600">{issueInvoice.error.message}</p> : null}
            </form>
          ) : null}

          {invoice.status === 'ISSUED' ? (
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">{t('accounting.detail.issuedBanner')}</p>
              {markPaid.isError ? <p className="text-sm text-rose-600">{markPaid.error.message}</p> : null}
              <button
                type="button"
                onClick={() => markPaid.mutate()}
                disabled={markPaid.isPending}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              >
                {t('accounting.detail.markPaidButton')}
              </button>
            </div>
          ) : null}

          {invoice.status === 'PAID' ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {t('accounting.detail.paidBanner')}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700">
          {t('accounting.detail.close')}
        </button>
      </div>
    </Modal>
  );
}
