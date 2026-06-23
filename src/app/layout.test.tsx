import { expect, test, vi } from 'vitest';

vi.mock('@/app/components/NotificationWrapper', () => ({
  default: ({ children }: any) => <div>{children}</div>
}));

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'mock-geist-sans' }),
  Geist_Mono: () => ({ variable: 'mock-geist-mono' })
}));

import { metadata, viewport } from './layout';

test('exports correct metadata', () => {
  expect(metadata.title).toBe("OrderEasy Retailer");
  expect(metadata.description).toBe("Retailer management dashboard for OrderEasy");
});

test('exports correct viewport', () => {
  expect(viewport.width).toBe("device-width");
  expect(viewport.initialScale).toBe(1);
  expect((viewport as any).maximumScale).toBeUndefined();
});
