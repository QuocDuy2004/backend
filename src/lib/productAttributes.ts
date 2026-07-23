export type ProductAttributeInput = {
  name: string;
  values: string[];
};

const splitValues = (value: unknown) =>
  (Array.isArray(value) ? value : String(value || '').split(','))
    .map((item) => String(item).trim())
    .filter(Boolean);

const stripVietnameseMarks = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

const normalizeAttributeName = (name: string) => {
  const rawName = name.trim();
  const comparable = stripVietnameseMarks(rawName).toLowerCase().replace(/\s+/g, ' ');

  if (['mau sac', 'mau', 'color', 'colors'].includes(comparable)) return 'Mau sac';
  if (['kich thuoc', 'size', 'sizes'].includes(comparable)) return 'Size';

  return rawName;
};

const normalizeAttribute = (name: string, values: unknown): ProductAttributeInput | null => {
  const normalizedName = normalizeAttributeName(name);
  const normalizedValues = splitValues(values);

  if (!normalizedName || normalizedValues.length === 0) return null;

  return {
    name: normalizedName,
    values: normalizedValues,
  };
};

export const parseProductAttributes = (text: string): ProductAttributeInput[] => {
  const content = text.trim();
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeAttribute(String(item?.name || ''), item?.values))
        .filter((item): item is ProductAttributeInput => Boolean(item));
    }

    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([name, values]) => normalizeAttribute(name, values))
        .filter((item): item is ProductAttributeInput => Boolean(item));
    }
  } catch {
    // Fall through to text import formats.
  }

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      if (!line.includes(':')) {
        return normalizeAttribute(index === 0 ? 'Mau sac' : 'Size', line);
      }

      const [name, ...valueParts] = line.split(':');
      return normalizeAttribute(name, valueParts.join(':'));
    })
    .filter((item): item is ProductAttributeInput => Boolean(item));
};
