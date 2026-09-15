import React, { useState } from 'react';

// كومبوننت بحث واختيار عام — يُستخدم لاختيار عميل أو قماش أو مادة كيميائية من كتالوج موجود،
// مع خيار "إضافة جديد" مباشرة لو الاسم اللي بيدور عليه المستخدم مش موجود.
// Generic search-and-select component — used to pick a customer/fabric/chemical from an
// existing catalog, with an inline "add new" option if what the user is looking for doesn't exist yet.
export default function CatalogPicker({
  label,
  placeholder,
  selectedLabel,
  search,
  onSearchChange,
  items,
  isLoading,
  onSelect,
  getOptionLabel,
  getOptionSubLabel,
  quickCreateLabel,
  onQuickCreate,
  isCreating,
}) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleQuickCreate() {
    const created = await onQuickCreate(search);
    if (created) {
      onSelect(created);
      setIsOpen(false);
    }
  }

  return (
    <label className="relative block space-y-1">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <input
        value={selectedLabel || search}
        onChange={(event) => {
          onSearchChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
      />
      {isOpen ? (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
          {isLoading ? <div className="p-3 text-sm text-slate-400">…</div> : null}
          {!isLoading &&
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setIsOpen(false);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-start text-sm hover:bg-slate-50"
              >
                <span className="font-medium text-slate-800">{getOptionLabel(item)}</span>
                {getOptionSubLabel ? <span className="text-xs text-slate-400">{getOptionSubLabel(item)}</span> : null}
              </button>
            ))}
          {!isLoading && search && onQuickCreate ? (
            <button
              type="button"
              disabled={isCreating}
              onClick={handleQuickCreate}
              className="w-full border-t border-slate-100 px-3 py-2 text-start text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
            >
              {isCreating ? '…' : `${quickCreateLabel} "${search}"`}
            </button>
          ) : null}
        </div>
      ) : null}
    </label>
  );
}
