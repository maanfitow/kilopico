import prefixesData from '../../data/prefixes.json';
import { useI18n } from '../i18n/I18nContext.jsx';
import { toSuperscript } from '../lib/format.js';

function formatDecimalFactor(exponent) {
  if (exponent === 0) return '1';
  if (exponent > 0) {
    const raw = `1${'0'.repeat(exponent)}`;
    return raw.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  const zeros = '0'.repeat(Math.abs(exponent) - 1);
  return `0.${zeros}1`;
}

export default function PrefixTable({ headingId }) {
  const { language, t } = useI18n();
  const ordered = [...prefixesData].sort((a, b) => b.exponent - a.exponent);

  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-labelledby={headingId}>
      <table className="data-table" aria-labelledby={headingId}>
        <thead>
          <tr>
            <th scope="col">{t('theory.colPrefix')}</th>
            <th scope="col">{t('theory.colSymbol')}</th>
            <th scope="col">{t('theory.colPower')}</th>
            <th scope="col">{t('theory.colDecimal')}</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((prefix) => (
            <tr key={prefix.symbol}>
              <td>{prefix.name[language]}</td>
              <td>
                <code>{prefix.symbol}</code>
              </td>
              <td>10{toSuperscript(prefix.exponent)}</td>
              <td className="mono-cell">{formatDecimalFactor(prefix.exponent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
