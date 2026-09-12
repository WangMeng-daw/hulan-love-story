// Standalone letter furniture keeps its conventional alignment within prose.
export function proseParagraphClass(text: string) {
  const line = text.trim();
  if (/^[\p{Script=Han}]{1,6}[：:，,]$/u.test(line)) {
    return 'prose-salutation';
  }
  if (/^(——\s*.+|爸|爷爷|建军|陆建军|陆守义|陆禾|知遥|许知遥)$/.test(line)) {
    return 'prose-signature';
  }
  if (/^\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日$/.test(line)) {
    return 'prose-date';
  }
  return undefined;
}
