import { defineStore } from 'pinia';
import type { Account, Tag, Updatable } from '~/types/account';
import { ACCOUNT_TYPES } from '~/types/account';

export const useAccountsStore = defineStore('accounts', {
  state: () => ({
    accounts: [
      {
        id: crypto.randomUUID(),
        tags: [{ text: 'admin' }, { text: 'production' }],
        type: ACCOUNT_TYPES.LOCAL,
        login: 'admin',
        password: 'admin123',
      },
      {
        id: crypto.randomUUID(),
        tags: [{ text: 'test' }],
        type: ACCOUNT_TYPES.LDAP,
        login: 'ldap_user',
        password: null,
      },
      {
        id: crypto.randomUUID(),
        tags: [],
        type: ACCOUNT_TYPES.LOCAL,
        login: 'guest',
        password: 'guest',
      },
    ] as Account[],
  }),

  actions: {
    addAccountWithId(payload: Account): void {
      if (this.accounts.some(a => a.id === payload.id)) return;
      this.accounts.push(this.normalizeAccount(payload));
    },

    updateAccount(id: string, updates: Updatable): void {
      const acc = this.accounts.find(a => a.id === id);
      if (!acc) return;
      const merged = this.normalizeAccount({ ...acc, ...updates });
      Object.assign(acc, merged);
    },

    deleteAccount(id: string): void {
      const index = this.accounts.findIndex(a => a.id === id);
      if (index !== -1) this.accounts.splice(index, 1);
    },

    // Normalize account: LDAP → password null, otherwise string
    normalizeAccount(acc: Account): Account {
      return {
        ...acc,
        password: acc.type === ACCOUNT_TYPES.LDAP ? null : (acc.password ?? ''),
      };
    },

    // Parse tags from string
    parseTags(input: string): Tag[] {
      if (!input.trim()) return [];
      return input
        .split(';')
        .map(s => s.trim())
        .filter(Boolean)
        .map(text => ({ text }));
    },
  },

  persist: true,
});
