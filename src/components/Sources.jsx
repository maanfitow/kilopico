import sourcesData from '../../data/sources.json';
import unitsData from '../../data/units.json';
import { useI18n } from '../i18n/I18nContext.jsx';
import { formatResult } from '../lib/format.js';

export default function Sources({ usedUnits }) {
  const { language, t } = useI18n();

  if (!usedUnits || usedUnits.length === 0) {
    return null;
  }

  return (
    <section className="instrument-sheet sources-sheet" aria-labelledby="sources-heading">
      <h2 id="sources-heading" className="section-title">
        {t('calculator.sourcesHeading')}
      </h2>
      <ul className="sources-list">
        {usedUnits.map((entry) => {
          const { unitId, unit, prefix } = entry;
          const source = sourcesData[unit.source];
          const quantity = unitsData.quantities[unit.quantity];
          const displaySymbol = `${prefix ? prefix.symbol : ''}${unit.symbol}`;
          const prefixName = prefix ? `${prefix.name[language]} ` : '';
          const unitName = `${prefixName}${unit.name[language]}`;
          const prefixScale = prefix ? Math.pow(10, prefix.exponent) : 1;
          const totalFactor = prefixScale * unit.factor;

          return (
            <li key={`${unitId}-${prefix?.symbol || 'base'}`} className="source-item">
              <div className="source-item-header">
                <span className="source-unit-title">
                  {displaySymbol} — {unitName}
                </span>
                <span className={unit.exact ? 'status-tag status-exact' : 'status-tag status-approx'}>
                  {unit.exact
                    ? t('sources.exact')
                    : t('sources.approximate', { digits: unit.significant_digits })}
                </span>
              </div>

              <div className="source-factor">
                <strong>{t('sources.factorLabel')}:</strong>{' '}
                {unit.quantity === 'temperature' ? (
                  <span>
                    K = value × {formatResult(unit.factor, 10)} + {formatResult(unit.offset || 0, 10)}
                  </span>
                ) : (
                  <span>
                    1 {displaySymbol} {unit.exact ? '=' : '≈'} {formatResult(totalFactor, 12)}{' '}
                    {quantity?.base || ''}
                  </span>
                )}
              </div>

              {unit.note && <p className="source-note">{unit.note}</p>}

              {source && (
                <div className="source-citation">
                  <strong>{t('sources.sourceLabel')}:</strong>{' '}
                  {source.authors && source.authors.length > 0 && `${source.authors.join(', ')}. `}
                  <span>{source.title}</span>
                  {source.publisher ? ` (${source.publisher}${source.year ? `, ${source.year}` : ''})` : ''}
                  {'. '}
                  <span className="source-location">
                    {unit.location ? unit.location : t('sources.locationPending')}
                  </span>
                  {source.url && (
                    <>
                      {' · '}
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t('sources.openLink')}: ${source.title}`}
                      >
                        {t('sources.openLink')}
                      </a>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
