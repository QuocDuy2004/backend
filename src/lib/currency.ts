export function formatVnd(value: number | string | null | undefined) {
  const amount = Number(value || 0);

  return `${amount.toLocaleString('vi-VN', {
    maximumFractionDigits: 0,
  })} đ`;
}
