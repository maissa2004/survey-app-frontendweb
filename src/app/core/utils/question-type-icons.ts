export const getIconForType = (code: string): string => {
  const icons: { [key: string]: string } = {
    'TEXT': 'bi bi-type',
    'TEXTAREA': 'bi bi-paragraph',
    'CHECKBOX': 'bi bi-check-square',
    'RADIO': 'bi bi-circle',
    'LIST': 'bi bi-list',
    'MULTI_SELECT': 'bi bi-list-ul',
    'DATE': 'bi bi-calendar',
    'DATE_RANGE': 'bi bi-calendar-range',
    'DATETIME': 'bi bi-calendar-clock',
    'TABLE': 'bi bi-table',
    'NUMBER': 'bi bi-123'
  };
  return icons[code] || 'bi bi-question-circle';
};