import { useEffect, useMemo, useRef, useState } from 'react';
import prefixesData from '../../data/prefixes.json';
import translationsData from '../../data/translations.json';
import unitsData from '../../data/units.json';
import { DEFAULT_PRECISION, MAX_PRECISION, MIN_PRECISION, STORAGE_KEYS } from '../config.js';
import { useI18n } from '../i18n/I18nContext.jsx';
import { convertSimple } from '../lib/converter.js';
import { formatResult, toSuperscript } from '../lib/format.js';
import Sources from './Sources.jsx';

const SIMPLE_QUANTITIES = [
  'length',
  'mass',
  'time',
  'temperature',
  'speed',
  'volume',
  'area',
  'energy',
  'power',
  'pressure',
  'force',
  'density',
  'data_storage',
  'angle',
  'frequency',
  'flow_rate',
  'acceleration',
  'area_density',
  'momentum',
];

const QUANTITY_DEFAULTS = {
  length: { fromKey: 'in', fromPrefix: '', toKey: 'ft', toPrefix: '' },
  mass: { fromKey: 'g', fromPrefix: 'k', toKey: 'lb', toPrefix: '' },
  time: { fromKey: 'h', fromPrefix: '', toKey: 's', toPrefix: '' },
  temperature: { fromKey: '°C', fromPrefix: '', toKey: 'K', toPrefix: '' },
  speed: { fromKey: 'km/h', fromPrefix: '', toKey: 'm/s', toPrefix: '' },
  volume: { fromKey: 'm3', fromPrefix: 'd', toKey: 'L', toPrefix: '' },
  area: { fromKey: 'ft2', fromPrefix: '', toKey: 'm2', toPrefix: 'c' },
  energy: { fromKey: 'cal', fromPrefix: 'k', toKey: 'J', toPrefix: '' },
  power: { fromKey: 'W', fromPrefix: 'k', toKey: 'hp', toPrefix: '' },
  pressure: { fromKey: 'Pa', fromPrefix: 'k', toKey: 'atm', toPrefix: '' },
  force: { fromKey: 'N', fromPrefix: '', toKey: 'lbf', toPrefix: '' },
  density: { fromKey: 'g/cm3', fromPrefix: '', toKey: 'kg/m3', toPrefix: '' },
  data_storage: { fromKey: 'GiB', fromPrefix: '', toKey: 'GB', toPrefix: '' },
  angle: { fromKey: 'deg', fromPrefix: '', toKey: 'rad', toPrefix: '' },
  frequency: { fromKey: 'Hz', fromPrefix: 'M', toKey: 'rpm', toPrefix: '' },
  flow_rate: { fromKey: 'L/min', fromPrefix: '', toKey: 'm3/s', toPrefix: '' },
  acceleration: { fromKey: 'm/s2', fromPrefix: '', toKey: 'g0', toPrefix: '' },
  area_density: { fromKey: 'g/cm2', fromPrefix: '', toKey: 'mg/mm2', toPrefix: '' },
  momentum: { fromKey: 'kg·m/s', fromPrefix: '', toKey: 'g·cm/s', toPrefix: '' },
};

function normalizeSearchText(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function readStoredPrecision() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.precision);
    const parsed = Number(raw);
    if (Number.isInteger(parsed) && parsed >= MIN_PRECISION && parsed <= MAX_PRECISION) {
      return parsed;
    }
  } catch {
    // Ignore storage errors in restricted browsing contexts.
  }
  return DEFAULT_PRECISION;
}

function writeStoredPrecision(value) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.precision, String(value));
  } catch {
    // Ignore storage errors in restricted browsing contexts.
  }
}

function getSimpleOptionsForQuantity(quantity) {
  if (quantity === 'area') {
    return [
      { key: 'm2', unitId: 'm', exponent: 2, acceptsPrefixes: true },
      { key: 'ft2', unitId: 'ft', exponent: 2, acceptsPrefixes: false },
      { key: 'in2', unitId: 'in', exponent: 2, acceptsPrefixes: false },
      { key: 'yd2', unitId: 'yd', exponent: 2, acceptsPrefixes: false },
      { key: 'acre', unitId: 'acre', exponent: 1, acceptsPrefixes: false },
    ];
  }
  if (quantity === 'volume') {
    return [
      { key: 'm3', unitId: 'm', exponent: 3, acceptsPrefixes: true },
      { key: 'L', unitId: 'L', exponent: 1, acceptsPrefixes: true },
      { key: 'gal', unitId: 'gal', exponent: 1, acceptsPrefixes: false },
      { key: 'ft3', unitId: 'ft', exponent: 3, acceptsPrefixes: false },
      { key: 'in3', unitId: 'in', exponent: 3, acceptsPrefixes: false },
    ];
  }
  return Object.entries(unitsData.units)
    .filter(([, unit]) => unit.quantity === quantity)
    .map(([unitId, unit]) => ({
      key: unitId,
      unitId,
      exponent: 1,
      acceptsPrefixes: unit.accepts_prefixes,
    }));
}

function getDefaultsForQuantity(quantity) {
  if (QUANTITY_DEFAULTS[quantity]) {
    return QUANTITY_DEFAULTS[quantity];
  }
  const options = getSimpleOptionsForQuantity(quantity);
  return {
    fromKey: options[0]?.key || '',
    fromPrefix: '',
    toKey: options[1]?.key || options[0]?.key || '',
    toPrefix: '',
  };
}

export default function Calculator() {
  const { language, t } = useI18n();
  const [quantity, setQuantity] = useState('length');
  const [rawValue, setRawValue] = useState('25');
  const [precision, setPrecision] = useState(() => readStoredPrecision());
  const [copied, setCopied] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const comboboxRef = useRef(null);
  const inputRef = useRef(null);

  const initialDefaults = getDefaultsForQuantity('length');
  const [fromKey, setFromKey] = useState(initialDefaults.fromKey);
  const [fromPrefix, setFromPrefix] = useState(initialDefaults.fromPrefix);
  const [toKey, setToKey] = useState(initialDefaults.toKey);
  const [toPrefix, setToPrefix] = useState(initialDefaults.toPrefix);

  const unitOptions = useMemo(() => getSimpleOptionsForQuantity(quantity), [quantity]);
  const orderedPrefixes = useMemo(
    () => [...prefixesData].sort((a, b) => b.exponent - a.exponent),
    []
  );

  const fromOption = unitOptions.find((o) => o.key === fromKey) || unitOptions[0];
  const toOption = unitOptions.find((o) => o.key === toKey) || unitOptions[0];

  const activeQuantityLabel = t(`quantities.${quantity}`);

  const filteredQuantities = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return SIMPLE_QUANTITIES;
    return SIMPLE_QUANTITIES.filter((q) => {
      const localLabel = normalizeSearchText(t(`quantities.${q}`));
      const englishLabel = normalizeSearchText(translationsData.en.quantities[q]);
      return localLabel.includes(normalizedQuery) || englishLabel.includes(normalizedQuery);
    });
  }, [query, t]);

  const activeOptionId =
    isOpen && highlightedIndex >= 0 && filteredQuantities[highlightedIndex]
      ? `quantity-option-${filteredQuantities[highlightedIndex]}`
      : undefined;

  const openCombobox = () => {
    setIsOpen(true);
    setQuery('');
    const currentIdx = SIMPLE_QUANTITIES.indexOf(quantity);
    setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
  };

  const closeCombobox = () => {
    setIsOpen(false);
    setQuery('');
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutsideMouseDown = (event) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        closeCombobox();
      }
    };
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !activeOptionId) return;
    const el = document.getElementById(activeOptionId);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, activeOptionId]);

  const handleQuantityChange = (nextQty) => {
    setQuantity(nextQty);
    const defaults = getDefaultsForQuantity(nextQty);
    setFromKey(defaults.fromKey);
    setFromPrefix(defaults.fromPrefix);
    setToKey(defaults.toKey);
    setToPrefix(defaults.toPrefix);
  };

  const selectQuantity = (nextQty) => {
    handleQuantityChange(nextQty);
    closeCombobox();
  };

  const handleComboboxKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openCombobox();
        return;
      }
      if (filteredQuantities.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredQuantities.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        openCombobox();
        return;
      }
      if (filteredQuantities.length > 0) {
        setHighlightedIndex((prev) =>
          prev <= 0 ? filteredQuantities.length - 1 : prev - 1
        );
      }
    } else if (e.key === 'Enter') {
      if (!isOpen) return;
      e.preventDefault();
      const target =
        filteredQuantities[highlightedIndex] ??
        (filteredQuantities.length === 1 ? filteredQuantities[0] : null);
      if (target) {
        selectQuantity(target);
      }
    } else if (e.key === 'Escape') {
      if (!isOpen) return;
      e.preventDefault();
      closeCombobox();
    }
  };

  const handleSwap = () => {
    setFromKey(toKey);
    setFromPrefix(toPrefix);
    setToKey(fromKey);
    setToPrefix(fromPrefix);
  };

  const updatePrecision = (delta) => {
    setPrecision((prev) => {
      const next = Math.min(MAX_PRECISION, Math.max(MIN_PRECISION, prev + delta));
      writeStoredPrecision(next);
      return next;
    });
  };

  const conversion = useMemo(() => {
    if (!fromOption || !toOption) return null;
    return convertSimple({
      rawValue,
      from: {
        unitId: fromOption.unitId,
        prefix: fromOption.acceptsPrefixes ? fromPrefix || null : null,
        exponent: fromOption.exponent,
      },
      to: {
        unitId: toOption.unitId,
        prefix: toOption.acceptsPrefixes ? toPrefix || null : null,
        exponent: toOption.exponent,
      },
      unitsData,
      prefixesData,
    });
  }, [rawValue, fromOption, fromPrefix, toOption, toPrefix]);

  const formattedOutput =
    conversion && conversion.ok ? formatResult(conversion.value, precision) : '';

  const targetDisplayUnit = useMemo(() => {
    if (!toOption) return '';
    const unit = unitsData.units[toOption.unitId];
    const prefixStr = toOption.acceptsPrefixes ? toPrefix : '';
    const expStr = toOption.exponent > 1 ? toSuperscript(toOption.exponent) : '';
    return `${prefixStr}${unit.symbol}${expStr}`;
  }, [toOption, toPrefix]);

  const handleCopy = async () => {
    if (!formattedOutput || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(formattedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard rejection in restricted contexts.
    }
  };

  const formatOptionLabel = (opt) => {
    const unit = unitsData.units[opt.unitId];
    const expSuffix = opt.exponent > 1 ? toSuperscript(opt.exponent) : '';
    return `${unit.symbol}${expSuffix} — ${unit.name[language]}${expSuffix}`;
  };

  const precisionExceeds =
    conversion?.ok &&
    !conversion.exact &&
    typeof conversion.minSignificantDigits === 'number' &&
    precision > conversion.minSignificantDigits;

  const hasError = Boolean(conversion && !conversion.ok);

  return (
    <div className="page-stack">
      <header className="hero-header">
        <h1 className="page-title">{t('calculator.title')}</h1>
        <p className="hero-subtitle">{t('app.tagline')}</p>
      </header>

      <section className="converter-panel" aria-label={t('calculator.title')}>
        <div className="calc-form">
          <div className="calc-top-row">
            <div className="field-group">
              <label id="quantity-label" htmlFor="quantity-select">
                {t('calculator.quantityLabel')}
              </label>
              <div
                ref={comboboxRef}
                className="combobox-wrap"
                onBlur={(e) => {
                  if (!comboboxRef.current?.contains(e.relatedTarget)) {
                    closeCombobox();
                  }
                }}
              >
                <div className="combobox-control">
                  <input
                    id="quantity-select"
                    ref={inputRef}
                    type="text"
                    className="combobox-input"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={isOpen}
                    aria-controls="quantity-listbox"
                    aria-activedescendant={activeOptionId}
                    value={isOpen ? query : activeQuantityLabel}
                    placeholder={isOpen ? activeQuantityLabel : t('calculator.quantityPlaceholder')}
                    autoComplete="off"
                    onFocus={() => {
                      if (!isOpen) openCombobox();
                    }}
                    onClick={() => {
                      if (!isOpen) openCombobox();
                    }}
                    onChange={(e) => {
                      const nextQuery = e.target.value;
                      setQuery(nextQuery);
                      if (!isOpen) setIsOpen(true);
                      if (normalizeSearchText(nextQuery) === '') {
                        const currentIdx = SIMPLE_QUANTITIES.indexOf(quantity);
                        setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
                      } else {
                        setHighlightedIndex(0);
                      }
                    }}
                    onKeyDown={handleComboboxKeyDown}
                  />
                  <button
                    type="button"
                    className="combobox-toggle"
                    tabIndex={-1}
                    aria-label={t('calculator.quantityLabel')}
                    aria-expanded={isOpen}
                    aria-controls="quantity-listbox"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (isOpen) {
                        closeCombobox();
                      } else {
                        openCombobox();
                        inputRef.current?.focus();
                      }
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="4 6 8 10 12 6" />
                    </svg>
                  </button>
                </div>

                {isOpen && (
                  <ul
                    id="quantity-listbox"
                    role="listbox"
                    aria-labelledby="quantity-label"
                    className="combobox-list"
                  >
                    {filteredQuantities.length === 0 ? (
                      <li className="combobox-empty" role="status">
                        {t('calculator.noQuantityMatch')}
                      </li>
                    ) : (
                      filteredQuantities.map((q, idx) => {
                        const isSelected = q === quantity;
                        const isHighlighted = idx === highlightedIndex;
                        const optionClass = [
                          'combobox-option',
                          isSelected ? 'is-selected' : '',
                          isHighlighted ? 'is-highlighted' : '',
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return (
                          <li
                            key={q}
                            id={`quantity-option-${q}`}
                            role="option"
                            aria-selected={isSelected}
                            className={optionClass}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => selectQuantity(q)}
                          >
                            <span>{t(`quantities.${q}`)}</span>
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="value-input">{t('calculator.valueLabel')}</label>
              <input
                id="value-input"
                className="numeric-input"
                type="text"
                inputMode="text"
                value={rawValue}
                onChange={(e) => setRawValue(e.target.value)}
                placeholder={t('calculator.valuePlaceholder')}
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? 'conversion-error' : undefined}
              />
            </div>
          </div>

          <div className="unit-pair-grid">
            <div className="unit-column">
              <div className="field-group">
                <label htmlFor="from-unit">{t('calculator.fromUnitLabel')}</label>
                <select
                  id="from-unit"
                  value={fromOption?.key || ''}
                  onChange={(e) => {
                    setFromKey(e.target.value);
                    setFromPrefix('');
                  }}
                >
                  {unitOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {formatOptionLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>

              {fromOption?.acceptsPrefixes && (
                <div className="field-group">
                  <label htmlFor="from-prefix">{t('calculator.fromPrefixLabel')}</label>
                  <select
                    id="from-prefix"
                    value={fromPrefix}
                    onChange={(e) => setFromPrefix(e.target.value)}
                  >
                    <option value="">{t('calculator.noPrefix')}</option>
                    {orderedPrefixes.map((p) => (
                      <option key={p.symbol} value={p.symbol}>
                        {p.symbol} — {p.name[language]} (10{toSuperscript(p.exponent)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="swap-wrap">
              <button
                type="button"
                className="swap-btn"
                onClick={handleSwap}
                aria-label={t('calculator.swapUnits')}
                title={t('calculator.swapUnits')}
              >
                ⇄
              </button>
            </div>

            <div className="unit-column">
              <div className="field-group">
                <label htmlFor="to-unit">{t('calculator.toUnitLabel')}</label>
                <select
                  id="to-unit"
                  value={toOption?.key || ''}
                  onChange={(e) => {
                    setToKey(e.target.value);
                    setToPrefix('');
                  }}
                >
                  {unitOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {formatOptionLabel(opt)}
                    </option>
                  ))}
                </select>
              </div>

              {toOption?.acceptsPrefixes && (
                <div className="field-group">
                  <label htmlFor="to-prefix">{t('calculator.toPrefixLabel')}</label>
                  <select
                    id="to-prefix"
                    value={toPrefix}
                    onChange={(e) => setToPrefix(e.target.value)}
                  >
                    <option value="">{t('calculator.noPrefix')}</option>
                    {orderedPrefixes.map((p) => (
                      <option key={p.symbol} value={p.symbol}>
                        {p.symbol} — {p.name[language]} (10{toSuperscript(p.exponent)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="result-band" aria-label={t('calculator.resultLabel')}>
        <div className="result-header">
          <span className="result-label micro-label">{t('calculator.resultLabel')}</span>
        </div>

        {conversion && !conversion.ok && (
          <p id="conversion-error" className="error-message" role="alert">
            {t(`errors.${conversion.error}`, { token: conversion.token || '' })}
          </p>
        )}

        {conversion?.ok && (
          <div className="result-value-row">
            <div className="result-output" aria-live="polite">
              <strong className="result-number">{formattedOutput}</strong>
              <span className="result-unit">{targetDisplayUnit}</span>
            </div>
            <button type="button" className="copy-btn" onClick={handleCopy}>
              {copied ? t('calculator.copiedButton') : t('calculator.copyButton')}
            </button>
          </div>
        )}

        {precisionExceeds && (
          <p className="notice-message">
            {t('notices.precisionExceedsSource', { digits: conversion.minSignificantDigits })}
          </p>
        )}

        {conversion?.ok &&
          conversion.notices.map((notice, idx) => (
            <p key={idx} className="notice-message">
              {t(`notices.${notice.type}`, notice.params)}
            </p>
          ))}

        <div className="result-footer">
          <div className="precision-bar">
            <span id="precision-label" className="precision-label micro-label">
              {t('calculator.precisionLabel')}
            </span>
            <div className="precision-controls" role="group" aria-labelledby="precision-label">
              <button
                type="button"
                className="step-btn"
                onClick={() => updatePrecision(-1)}
                disabled={precision <= MIN_PRECISION}
                aria-label={t('calculator.decreasePrecision')}
              >
                −
              </button>
              <span className="precision-value" aria-live="polite">
                {precision}
              </span>
              <button
                type="button"
                className="step-btn"
                onClick={() => updatePrecision(1)}
                disabled={precision >= MAX_PRECISION}
                aria-label={t('calculator.increasePrecision')}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </section>

      {conversion?.ok && <Sources usedUnits={conversion.usedUnits} />}
    </div>
  );
}
