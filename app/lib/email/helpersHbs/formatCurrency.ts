export default function formatCurrency(amount: number | string, currency: string): string {
  const num = parseFloat(amount as string);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(num);
}