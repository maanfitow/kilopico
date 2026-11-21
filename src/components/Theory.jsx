import unitsData from '../../data/units.json';
import { useI18n } from '../i18n/I18nContext.jsx';
import { formatResult } from '../lib/format.js';
import PrefixTable from './PrefixTable.jsx';

const BASE_UNIT_ITEMS = [
  { quantity: 'length', unitId: 'm', symbol: 'm' },
  { quantity: 'mass', unitId: 'g', symbol: 'kg', isKilogram: true },
  { quantity: 'time', unitId: 's', symbol: 's' },
  { quantity: 'electric_current', unitId: 'A', symbol: 'A' },
  { quantity: 'temperature', unitId: 'K', symbol: 'K' },
  { quantity: 'amount_of_substance', unitId: 'mol', symbol: 'mol' },
  { quantity: 'luminous_intensity', unitId: 'cd', symbol: 'cd' },
];

export default function Theory() {
  const { language, t } = useI18n();
  const usageRules = t('theory.usageRules');
  const noFractionExamples = t('theory.noFractionExamples');

  const equivalenceUnits = Object.entries(unitsData.units).filter(
    ([id, unit]) => unit.factor !== 1 || (unit.offset ?? 0) !== 0 || id === 'g'
  );

  return (
    <div className="page-stack prose">
      <header className="hero-header">
        <h1 className="page-title">{t('theory.title')}</h1>
        <p className="hero-subtitle">{t('theory.intro')}</p>
      </header>

      <section className="instrument-sheet">
        <h2 id="base-units-heading" className="section-title">{t('theory.baseUnitsTitle')}</h2>
        <div
          className="table-wrap"
          tabIndex={0}
          role="region"
          aria-labelledby="base-units-heading"
        >
          <table className="data-table" aria-labelledby="base-units-heading">
            <thead>
              <tr>
                <th scope="col">{t('theory.colQuantity')}</th>
                <th scope="col">{t('theory.colUnit')}</th>
                <th scope="col">{t('theory.colSymbol')}</th>
              </tr>
            </thead>
            <tbody>
              {BASE_UNIT_ITEMS.map((item) => {
                const unit = unitsData.units[item.unitId];
                const name = item.isKilogram ? t('theory.kilogramName') : unit.name[language];
                return (
                  <tr key={item.symbol}>
                    <td>{t(`quantities.${item.quantity}`)}</td>
                    <td>{name}</td>
                    <td>
                      <code>{item.symbol}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="instrument-sheet">
        <h2 className="section-title">{t('theory.prefixesIntroTitle')}</h2>
        <p>{t('theory.prefixesIntroBody')}</p>
        <h3 id="prefix-table-heading" className="sub-title">{t('theory.prefixTableTitle')}</h3>
        <PrefixTable headingId="prefix-table-heading" />
      </section>

      <section className="instrument-sheet">
        <h2 className="section-title">{t('theory.sciNotationTitle')}</h2>
        <p>{t('theory.sciNotationBody')}</p>

        <h3 className="sub-title">{t('theory.usageRulesTitle')}</h3>
        <ul className="bullet-list">
          {Array.isArray(usageRules) && usageRules.map((rule, idx) => <li key={idx}>{rule}</li>)}
        </ul>

        <h3 className="sub-title">{t('theory.noFractionTitle')}</h3>
        <p>{t('theory.noFractionBody')}</p>
        <ul className="bullet-list mono-list">
          {Array.isArray(noFractionExamples) &&
            noFractionExamples.map((example, idx) => <li key={idx}>{example}</li>)}
        </ul>
      </section>

      <section className="instrument-sheet">
        <h2 id="equivalences-heading" className="section-title">{t('theory.equivalencesTitle')}</h2>
        <div
          className="table-wrap"
          tabIndex={0}
          role="region"
          aria-labelledby="equivalences-heading"
        >
          <table className="data-table" aria-labelledby="equivalences-heading">
            <thead>
              <tr>
                <th scope="col">{t('theory.colUnit')}</th>
                <th scope="col">{t('theory.colSystem')}</th>
                <th scope="col">{t('theory.colEquivalent')}</th>
                <th scope="col">{t('theory.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {equivalenceUnits.map(([id, unit]) => {
                const base = unitsData.quantities[unit.quantity]?.base || '';
                const eqText =
                  unit.quantity === 'temperature'
                    ? `K = x × ${formatResult(unit.factor, 10)} + ${formatResult(unit.offset || 0, 10)}`
                    : `1 ${unit.symbol} ${unit.exact ? '=' : '≈'} ${formatResult(unit.factor, 12)} ${base}`;

                return (
                  <tr key={id}>
                    <td>
                      <code>{unit.symbol}</code> ({unit.name[language]})
                    </td>
                    <td>{t(`theory.systemNames.${unit.system}`)}</td>
                    <td className="mono-cell">{eqText}</td>
                    <td>
                      <span className={unit.exact ? 'status-tag status-exact' : 'status-tag status-approx'}>
                        {unit.exact
                          ? t('sources.exact')
                          : t('sources.approximate', { digits: unit.significant_digits })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
