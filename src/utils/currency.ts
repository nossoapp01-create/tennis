// Centralized traditional European currency formatting for Euros (€)

export const formatCurrency = (value: number | undefined | null): string => {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  // Formato tradicional europeu: € 429,00
  const formattedNumber = num.toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `€ ${formattedNumber}`;
};

export const formatCurrencyCompact = (value: number | undefined | null): string => {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  // Formato compacto tradicional: € 429
  return `€ ${Math.round(num).toLocaleString('pt-PT')}`;
};
