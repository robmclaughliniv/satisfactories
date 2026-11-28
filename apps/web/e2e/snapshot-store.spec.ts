import { expect, test } from '@playwright/test';

const DEBUG_URL = '/?debug=snapshot';

test('small synthetic snapshot persists across a reload (OPFS sahpool)', async ({ page }) => {
  await page.goto(DEBUG_URL);
  await expect(page.getByTestId('status-vfs')).toHaveText('opfs-sahpool');
  await expect(page.getByTestId('status-persistent')).toHaveText('true');
  await expect(page.getByTestId('status-open-world')).toHaveText('debug-synthetic');

  await page.getByTestId('write-small').click();
  await expect(page.getByTestId('write-total')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('count-buildable')).toHaveText('5,000');
  await expect(page.getByTestId('count-edge')).toHaveText('10,000');
  const snapshotId = await page.getByTestId('current-snapshot').textContent();
  expect(snapshotId).toMatch(/^synthetic-small-/);

  await page.reload();
  await expect(page.getByTestId('status-vfs')).toHaveText('opfs-sahpool');
  await expect(page.getByTestId('status-open-world')).toHaveText('debug-synthetic');
  await expect(page.getByTestId('current-snapshot')).toHaveText(snapshotId!);
  await expect(page.getByTestId('count-buildable')).toHaveText('5,000');
  await expect(page.getByTestId('count-edge')).toHaveText('10,000');
  await expect(page.getByTestId('count-foundation_tile')).toHaveText('1,300');
});

test('a second tab gets the lock banner and the manual UI still renders', async ({ context }) => {
  const first = await context.newPage();
  await first.goto(DEBUG_URL);
  await expect(first.getByTestId('status-vfs')).toHaveText('opfs-sahpool');
  await expect(first.getByTestId('status-locked')).toHaveText('false');

  const second = await context.newPage();
  await second.goto(DEBUG_URL);
  await expect(second.getByTestId('snapshot-banner-locked')).toBeVisible();
  await expect(second.getByTestId('status-locked')).toHaveText('true');
  // The manual UI is localStorage-backed and keeps working in both tabs.
  for (const p of [first, second]) {
    await expect(p.locator('main')).toBeVisible();
  }
  await expect(first.getByTestId('snapshot-banner-locked')).toHaveCount(0);
});
