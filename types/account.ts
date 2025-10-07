export const ACCOUNT_TYPES = {
  LOCAL: 'Локальная',
  LDAP: 'LDAP',
} as const;

export type AccountType = typeof ACCOUNT_TYPES[keyof typeof ACCOUNT_TYPES];

export type Tag = { text: string; };

export type Account = {
  id: string;
  tags: Tag[];
  type: AccountType;
  login: string;
  password: string | null;
};

export type Updatable = Partial<Omit<Account, 'id'>> & { id?: never; };

export type Draft = {
  tagsInput: string;
  type: AccountType;
  login: string;
  password: string;
};

export type FieldErrors = {
  login: boolean;
  password: boolean;
};
