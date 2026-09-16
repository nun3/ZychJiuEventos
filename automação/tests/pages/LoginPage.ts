import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(redirectTo?: string) {
    await this.page.goto(redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login');
    await expect(this.page.getByRole('button', { name: 'Acessar', exact: true })).toBeEnabled();
  }

  async login(email: string, password: string) {
    await this.page.getByRole('textbox', { name: 'nome@exemplo.com' }).fill(email);
    await this.page.getByRole('textbox', { name: 'Digite sua senha' }).fill(password);
    await this.page.getByRole('button', { name: 'Acessar', exact: true }).click();
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/login(?:\?|$)/);
    await expect(this.page.getByRole('textbox', { name: 'nome@exemplo.com' })).toBeVisible();
    await expect(this.page.getByRole('textbox', { name: 'Digite sua senha' })).toBeVisible();
  }
}
