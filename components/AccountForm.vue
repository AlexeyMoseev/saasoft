<template>
  <div class="app-wrapper">
    <UContainer>
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Учетные записи
        </h1>
        <UButton
          icon="i-heroicons-plus"
          size="lg"
          color="primary"
          variant="outline"
          square
          class="cursor-pointer flex items-center justify-center"
          @click="addDraft"
        />
      </div>

      <UAlert
        icon="i-heroicons-information-circle"
        color="info"
        variant="soft"
        title="Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;"
        class="mb-6"
      />

      <div v-if="rowIds.length" class="space-y-4">
        <div
          class="hidden sm:grid sm:grid-cols-[2fr_1.5fr_2fr_2fr_50px] gap-3 px-2 text-sm text-gray-600 dark:text-gray-400 font-medium"
        >
          <div v-for="field in fields" :key="field.key">
            {{ field.label }}
            <span v-if="field.required" class="text-red-500">*</span>
          </div>
          <div />
        </div>

        <div
          v-for="id in rowIds"
          :key="id"
          class="flex flex-col gap-3 sm:grid sm:grid-cols-[2fr_1.5fr_2fr_2fr_50px] sm:gap-3 sm:items-start"
        >
          <div
            v-for="field in fields"
            :key="field.key"
            class="flex flex-col gap-1"
          >
            <!-- Field label (mobile view) -->
            <div
              class="text-sm text-gray-600 dark:text-gray-400 font-medium sm:hidden"
            >
              {{ field.label }}
              <span v-if="field.required" class="text-red-500">*</span>
            </div>

            <UTextarea
              v-if="field.key === 'tagsInput'"
              v-model="inputs.get(id)![field.key]"
              :rows="1"
              autoresize
              :maxrows="3"
              size="lg"
              :maxlength="50"
              @input="onFieldInput(id)"
              @blur="onBlur(id)"
            />

            <USelect
              v-else-if="field.key === 'type'"
              v-model="inputs.get(id)![field.key]"
              :items="typeOptions"
              size="lg"
              @change="onTypeChange(id)"
            />

            <UInput
              v-else-if="field.key === 'login'"
              v-model="inputs.get(id)![field.key]"
              size="lg"
              maxlength="100"
              :color="loginError(id) ? 'error' : 'primary'"
              :highlight="loginError(id)"
              @input="onFieldInput(id)"
              @blur="onBlur(id)"
            />

            <UInput
              v-else-if="field.key === 'password'"
              v-model="inputs.get(id)![field.key]"
              :type="showPasswords.get(id) ? 'text' : 'password'"
              size="lg"
              maxlength="100"
              :color="passwordError(id) ? 'error' : 'primary'"
              :highlight="passwordError(id)"
              :disabled="inputs.get(id)!.type === 'LDAP'"
              :ui="{
                base: 'disabled:bg-gray-50 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed',
                trailing: 'pe-1',
              }"
              @input="onFieldInput(id)"
              @blur="onBlur(id)"
            >
              <template
                v-if="inputs.get(id)!.type === ACCOUNT_TYPES.LOCAL"
                #trailing
              >
                <UButton
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="
                    showPasswords.get(id)
                      ? 'i-heroicons-eye-slash'
                      : 'i-heroicons-eye'
                  "
                  :aria-pressed="showPasswords.get(id)"
                  class="cursor-pointer"
                  @click="togglePasswordVisibility(id)"
                />
              </template>
            </UInput>
          </div>

          <UButton
            icon="i-heroicons-trash"
            size="lg"
            color="error"
            variant="soft"
            square
            class="cursor-pointer flex items-center justify-center sm:self-start"
            @click="removeRow(id)"
          />
        </div>
      </div>

      <div v-else class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">
          Нет добавленных учетных записей. Нажмите "+" чтобы добавить.
        </p>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Draft, FieldErrors } from '~/types/account';
import { ACCOUNT_TYPES } from '~/types/account';
import { useAccountsStore } from '@/stores/accounts';

const accountsStore = useAccountsStore();

// Local form state
const inputs = ref<Map<string, Draft>>(new Map());
const errors = ref<Map<string, FieldErrors>>(new Map());
const showPasswords = ref<Map<string, boolean>>(new Map());

const typeOptions = [
  { label: ACCOUNT_TYPES.LOCAL, value: ACCOUNT_TYPES.LOCAL },
  { label: ACCOUNT_TYPES.LDAP, value: ACCOUNT_TYPES.LDAP },
];

const fields = [
  { key: 'tagsInput', label: 'Метки', required: false },
  { key: 'type', label: 'Тип записи', required: false },
  { key: 'login', label: 'Логин', required: true },
  { key: 'password', label: 'Пароль', required: true },
] as const;

// ========== Helpers ==========

function validate(row: Draft): FieldErrors {
  return {
    login: !row.login.trim(),
    password: row.type === ACCOUNT_TYPES.LDAP ? false : !row.password.trim(),
  };
}

function getRow(id: string): Draft | undefined {
  return inputs.value.get(id);
}

function validateAndSet(id: string): void {
  const row = getRow(id);
  if (!row) return;
  errors.value.set(id, validate(row));
}

// Getters for instant UI highlighting
const loginError = (id: string): boolean => {
  const row = getRow(id);
  return row ? !row.login.trim() : false;
};

const passwordError = (id: string): boolean => {
  const row = getRow(id);
  if (!row || row.type === ACCOUNT_TYPES.LDAP) return false;
  return !row.password.trim();
};

// ========== Initialization ==========

// Load existing accounts from store
for (const acc of accountsStore.accounts) {
  const draft: Draft = {
    tagsInput: acc.tags.map((t) => t.text).join('; '),
    type: acc.type,
    login: acc.login,
    password: acc.password ?? '',
  };
  inputs.value.set(acc.id, draft);
  errors.value.set(acc.id, validate(draft));
  showPasswords.value.set(acc.id, false);
}

const rowIds = computed<string[]>(() => Array.from(inputs.value.keys()));

// ========== Actions ==========

function addDraft(): void {
  const id = crypto.randomUUID();
  const draft: Draft = {
    tagsInput: '',
    type: ACCOUNT_TYPES.LOCAL,
    login: '',
    password: '',
  };
  inputs.value.set(id, draft);
  errors.value.set(id, validate(draft));
  showPasswords.value.set(id, false);
}

function removeRow(id: string): void {
  inputs.value.delete(id);
  errors.value.delete(id);
  showPasswords.value.delete(id);
  accountsStore.deleteAccount(id);
}

function togglePasswordVisibility(id: string): void {
  showPasswords.value.set(id, !showPasswords.value.get(id));
}

function sync(id: string): void {
  const row = getRow(id);
  if (!row) return;

  const err = validate(row);
  if (err.login || err.password) return;

  const tags = accountsStore.parseTags(row.tagsInput);
  const password = row.type === ACCOUNT_TYPES.LDAP ? null : row.password;

  const exists = accountsStore.accounts.some((a) => a.id === id);
  if (exists) {
    accountsStore.updateAccount(id, {
      tags,
      type: row.type,
      login: row.login,
      password,
    });
  } else {
    accountsStore.addAccountWithId({
      id,
      tags,
      type: row.type,
      login: row.login,
      password,
    });
  }
}

// ========== Event handlers ==========

function onFieldInput(id: string): void {
  validateAndSet(id);
}

function onBlur(id: string): void {
  validateAndSet(id);
  sync(id);
}

function onTypeChange(id: string): void {
  const row = getRow(id);
  if (!row) return;
  if (row.type === ACCOUNT_TYPES.LDAP) row.password = '';
  validateAndSet(id);
  sync(id);
}
</script>

<style scoped>
.app-wrapper {
  padding: 2rem 1rem;
}
@media (min-width: 640px) {
  .app-wrapper {
    padding: 2rem 3rem;
  }
}
.cursor-pointer {
  cursor: pointer !important;
}
</style>
