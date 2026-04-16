<script setup>
import { computed, onMounted, ref } from "vue";
import UserShell from "../components/UserShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import UiInputField from "../components/ui/UiInputField.vue";
import UiButton from "../components/ui/UiButton.vue";
import UiAutocompleteSelect from "../components/ui/UiAutocompleteSelect.vue";
import { api, getAuthToken, refreshMe, setAuthSession } from "../api";

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const institutionError = ref("");
const institutions = ref([]);
const me = ref(null);
const avatarInputRef = ref(null);
const form = ref({
  phone: "",
  institutionId: null,
  avatarUrl: "",
});

const userInitial = computed(() => (me.value?.fullName || "П").slice(0, 1).toUpperCase());
const avatarPreview = computed(() => form.value.avatarUrl || me.value?.avatarUrl || "");

function formatPhoneMask(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);
  if (!digits) return "";

  let result = "+7";
  if (digits.length > 0) result += ` (${digits.slice(0, 3)}`;
  if (digits.length >= 3) result += ")";
  if (digits.length > 3) result += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) result += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) result += `-${digits.slice(8, 10)}`;
  return result;
}

function onPhoneInput(value) {
  form.value.phone = formatPhoneMask(value);
}

function onInstitutionChange(value) {
  form.value.institutionId = value === null ? null : Number(value);
  institutionError.value = "";
}

function openAvatarPicker() {
  avatarInputRef.value?.click();
}

function onAvatarSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    error.value = "Можно загрузить только изображение.";
    event.target.value = "";
    return;
  }
  if (file.size > 500 * 1024) {
    error.value = "Аватар слишком большой. Максимум 500 КБ.";
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      form.value.avatarUrl = reader.result;
      error.value = "";
    }
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

async function loadData() {
  loading.value = true;
  error.value = "";
  try {
    const [meData, institutionsData] = await Promise.all([
      refreshMe(),
      api.get("/institutions").then((response) => response.data),
    ]);
    me.value = meData;
    institutions.value = institutionsData;
    form.value.phone = formatPhoneMask(meData.phone || "");
    form.value.institutionId = meData.institutionId ?? null;
    form.value.avatarUrl = meData.avatarUrl || "";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить профиль.";
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  institutionError.value = "";
  if (!form.value.institutionId) {
    institutionError.value = "Выберите учебное заведение из списка.";
    return;
  }

  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const payload = {
      phone: form.value.phone.trim(),
      avatarUrl: form.value.avatarUrl || null,
      institutionId: Number(form.value.institutionId),
    };
    const { data } = await api.patch("/users/me", payload);
    me.value = data;
    const token = getAuthToken();
    if (token) {
      setAuthSession(token, data);
    }
    success.value = "Профиль успешно обновлен.";
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось сохранить профиль.";
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <UserShell title="Профиль">
    <ToastMessage :error="error" :success="success" />

    <section v-if="loading" class="block">
      <p>Загружаем данные профиля...</p>
    </section>

    <section v-else class="block profile-layout">
      <aside class="profile-card">
        <button type="button" class="profile-card__avatar-button" @click="openAvatarPicker">
          <div class="profile-card__avatar">
            <img v-if="avatarPreview" :src="avatarPreview" alt="Аватар пользователя" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <span class="profile-card__avatar-plus">+</span>
        </button>
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          class="profile-card__file-input"
          @change="onAvatarSelected"
        />
        <h2>{{ me?.fullName }}</h2>
      </aside>

      <article class="profile-editor">
        <header class="profile-editor__head">
          <h3>Настройки профиля</h3>
          <p>Обновите контактные данные и выберите учебное заведение.</p>
        </header>

        <form class="profile-editor__form" @submit.prevent="saveProfile">
          <div class="profile-editor__grid">
            <UiInputField label="ФИО" :model-value="me?.fullName || ''" type="text" disabled />
            <UiInputField label="Email" :model-value="me?.email || ''" type="email" disabled />
            <UiInputField
              :model-value="form.phone"
              label="Телефон"
              type="text"
              placeholder="+7 (999) 999-99-99"
              required
              @update:model-value="onPhoneInput"
            />
            <UiAutocompleteSelect
              :model-value="form.institutionId"
              :options="institutions"
              label="Учебное заведение"
              placeholder="Начните вводить название..."
              :error="institutionError"
              @update:model-value="onInstitutionChange"
            />
          </div>

          <div class="profile-editor__actions">
            <UiButton type="submit" :loading="saving">Сохранить изменения</UiButton>
          </div>
        </form>
      </article>
    </section>
  </UserShell>
</template>

<style scoped>
.profile-layout {
  display: grid;
  grid-template-columns: minmax(240px, 320px) 1fr;
  gap: 14px;
}

.profile-card,
.profile-editor {
  border: 1px solid #d9e2ef;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff, #f6f9fe);
}

.profile-card {
  padding: 18px;
  display: grid;
  gap: 10px;
  align-content: start;
}

.profile-card__avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 800;
  color: #eef4ff;
  background: linear-gradient(135deg, #13243f, #244879);
  overflow: hidden;
}

.profile-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.profile-card__avatar-button {
  width: fit-content;
  border: none;
  background: transparent;
  padding: 0;
  position: relative;
  cursor: pointer;
}

.profile-card__avatar-plus {
  position: absolute;
  right: -6px;
  bottom: -3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #f0f5fe;
  border: 1px solid #c8d7ee;
  color: #25476f;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.profile-card__file-input {
  display: none;
}

.profile-card h2 {
  margin: 4px 0 0;
  font-size: 28px;
  line-height: 1.1;
}

.profile-editor {
  padding: 18px;
  display: grid;
  gap: 14px;
}

.profile-editor__head h3 {
  margin: 0;
  font-size: 24px;
}

.profile-editor__head p {
  margin: 6px 0 0;
  color: #627491;
}

.profile-editor__form {
  display: grid;
  gap: 12px;
}

.profile-editor__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.profile-editor__actions {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 980px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}
</style>
