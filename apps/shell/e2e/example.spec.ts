import { test, expect } from '@playwright/test';

test('loads the shell and both federated providers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'shell' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rustic marketplace' })).toBeVisible();
});
