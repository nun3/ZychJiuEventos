import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open(redirectTo?: string) {
    await this.page.goto(redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login');
    await expect(this.page.getByRole('button', { name: 'Entrar na conta', exact: true })).toBeEnabled();
  }

  async login(email: string, password: string) {
    await this.page.locator('#login-email').fill(email);
    await this.page.locator('#login-password').fill(password);
    await this.page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
  }

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/login(?:\?|$)/);
    await expect(this.page.getByRole('textbox', { name: 'nome@exemplo.com' })).toBeVisible();
    await expect(this.page.getByRole('textbox', { name: 'Digite sua senha' })).toBeVisible();
  }
}
