<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { api } from "../api";
import AdminShell from "../components/AdminShell.vue";
import ToastMessage from "../components/ToastMessage.vue";
import UiSegmentTabs from "../components/ui/UiSegmentTabs.vue";
import UiStatCard from "../components/ui/UiStatCard.vue";
import AdminEventEditor from "../components/admin/events/AdminEventEditor.vue";
import AdminEventCard from "../components/admin/events/AdminEventCard.vue";
import AdminParticipantsPanel from "../components/admin/events/AdminParticipantsPanel.vue";

const loading = ref(false);
const submitting = ref(false);
const participantsLoading = ref(false);
const error = ref("");
const success = ref("");

const dashboard = ref({
  users: 0,
  institutions: 0,
  events: 0,
  registrations: 0,
});

const institutions = ref([]);
const events = ref([]);
const participants = ref([]);

const editingEventId = ref(null);
const eventSearch = ref("");
const eventStatusFilter = ref("ALL");
const selectedEventId = ref("");
const participantSearch = ref("");
const participantInstitutionId = ref("");

const actionState = ref({
  archivingId: null,
  deletingId: null,
  restoringId: null,
  removingParticipantId: null,
});

const form = ref(makeEmptyForm());

const statusFilters = [
  { value: "ALL", label: "Все" },
  { value: "DRAFT", label: "Черновики" },
  { value: "PUBLISHED", label: "Опубликованные" },
  { value: "ARCHIVED", label: "Архив" },
];

const statusSummary = computed(() => {
  return events.value.reduce(
    (acc, item) => {
      if (item.status === "DRAFT") acc.draft += 1;
      if (item.status === "PUBLISHED") acc.published += 1;
      if (item.status === "ARCHIVED") acc.archived += 1;
      return acc;
    },
    { draft: 0, published: 0, archived: 0 }
  );
});

const filteredEvents = computed(() => {
  const query = eventSearch.value.trim().toLowerCase();
  return events.value.filter((item) => {
    const matchesStatus = eventStatusFilter.value === "ALL" || item.status === eventStatusFilter.value;
    if (!matchesStatus) return false;
    if (!query) return true;
    const title = String(item.title || "").toLowerCase();
    const institutionName = String(item.institution?.name || "").toLowerCase();
    return title.includes(query) || institutionName.includes(query);
  });
});

function makeEmptyForm() {
  return {
    title: "",
    content: "",
    imageUrl: "",
    startAt: "",
    endAt: "",
    institutionId: "",
    isPublic: true,
    status: "DRAFT",
  };
}

function toLocalInputValue(isoString) {
  const date = new Date(isoString);
  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function resetForm() {
  editingEventId.value = null;
  form.value = makeEmptyForm();
}

function startEdit(eventItem) {
  editingEventId.value = eventItem.id;
  form.value = {
    title: eventItem.title || "",
    content: eventItem.content || "",
    imageUrl: eventItem.imageUrl || "",
    startAt: toLocalInputValue(eventItem.startAt),
    endAt: toLocalInputValue(eventItem.endAt),
    institutionId: eventItem.institutionId ? String(eventItem.institutionId) : "",
    isPublic: Boolean(eventItem.isPublic),
    status: eventItem.status || "DRAFT",
  };
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadInitial() {
  loading.value = true;
  error.value = "";
  try {
    const [dashboardResponse, eventsResponse, institutionsResponse] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/events"),
      api.get("/institutions"),
    ]);

    dashboard.value = dashboardResponse.data;
    events.value = eventsResponse.data;
    institutions.value = institutionsResponse.data;

    if (selectedEventId.value && !events.value.some((item) => String(item.id) === selectedEventId.value)) {
      selectedEventId.value = "";
      participants.value = [];
    }
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить данные админ-панели.";
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  submitting.value = true;
  error.value = "";
  success.value = "";
  try {
    if (!form.value.title.trim()) {
      throw new Error("Укажите название мероприятия.");
    }
    if (!form.value.content.trim()) {
      throw new Error("Добавьте контент мероприятия.");
    }
    if (!form.value.startAt || !form.value.endAt) {
      throw new Error("Заполните дату и время начала и окончания.");
    }

    const start = new Date(form.value.startAt);
    const end = new Date(form.value.endAt);
    if (start.getTime() >= end.getTime()) {
      throw new Error("Дата начала должна быть раньше даты окончания.");
    }

    if (!form.value.isPublic && !form.value.institutionId) {
      throw new Error("Для непубличного мероприятия выберите учебное заведение.");
    }

    const payload = {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      imageUrl: form.value.imageUrl.trim(),
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      institutionId: form.value.institutionId ? Number(form.value.institutionId) : null,
      isPublic: Boolean(form.value.isPublic),
      status: form.value.status,
    };

    if (editingEventId.value) {
      await api.patch(`/admin/events/${editingEventId.value}`, payload);
      success.value = "Мероприятие обновлено.";
    } else {
      await api.post("/admin/events", payload);
      success.value = "Мероприятие создано.";
    }

    resetForm();
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || err?.message || "Не удалось сохранить мероприятие.";
  } finally {
    submitting.value = false;
  }
}

async function archiveEvent(eventId) {
  actionState.value.archivingId = eventId;
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/events/${eventId}`, { params: { mode: "archive" } });
    success.value = "Мероприятие переведено в архив.";
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось архивировать мероприятие.";
  } finally {
    actionState.value.archivingId = null;
  }
}

async function restoreEvent(eventId) {
  actionState.value.restoringId = eventId;
  error.value = "";
  success.value = "";
  try {
    await api.patch(`/admin/events/${eventId}`, { status: "DRAFT" });
    success.value = "Мероприятие восстановлено из архива в статус «Черновик».";
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось восстановить мероприятие.";
  } finally {
    actionState.value.restoringId = null;
  }
}

async function deleteEvent(eventId) {
  const shouldDelete = window.confirm("Удалить мероприятие без возможности восстановления?");
  if (!shouldDelete) return;

  actionState.value.deletingId = eventId;
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/events/${eventId}`, { params: { mode: "delete" } });
    if (selectedEventId.value === String(eventId)) {
      selectedEventId.value = "";
      participants.value = [];
    }
    success.value = "Мероприятие удалено.";
    await loadInitial();
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось удалить мероприятие.";
  } finally {
    actionState.value.deletingId = null;
  }
}

async function loadParticipants() {
  if (!selectedEventId.value) {
    participants.value = [];
    return;
  }

  participantsLoading.value = true;
  error.value = "";
  try {
    const { data } = await api.get(`/admin/events/${selectedEventId.value}/participants`, {
      params: {
        q: participantSearch.value.trim() || undefined,
        institutionId: participantInstitutionId.value || undefined,
      },
    });
    participants.value = data;
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось загрузить участников.";
  } finally {
    participantsLoading.value = false;
  }
}

function selectEventForParticipants(eventId) {
  selectedEventId.value = String(eventId);
}

async function removeParticipant(userId) {
  if (!selectedEventId.value) return;
  actionState.value.removingParticipantId = userId;
  error.value = "";
  success.value = "";
  try {
    await api.delete(`/admin/events/${selectedEventId.value}/participants/${userId}`);
    success.value = "Участник удален.";
    await Promise.all([loadParticipants(), loadInitial()]);
  } catch (err) {
    error.value = err?.response?.data?.message || "Не удалось удалить участника.";
  } finally {
    actionState.value.removingParticipantId = null;
  }
}

onMounted(loadInitial);

watch(selectedEventId, (newValue) => {
  if (!newValue) {
    participants.value = [];
    return;
  }
  loadParticipants();
});
</script>

<template>
  <AdminShell title="Админка: мероприятия">
    <ToastMessage :error="error" :success="success" />

    <section class="admin-events-hero">
      <div>
        <h2>Центр управления мероприятиями</h2>
        <p>Создание, публикация, архив и контроль участников в одном рабочем экране.</p>
      </div>
      <button type="button" class="action-btn action-btn-soft" @click="resetForm">Новое мероприятие</button>
    </section>

    <section class="admin-events-stats">
      <UiStatCard label="Всего мероприятий" :value="dashboard.events" />
      <UiStatCard label="Всего регистраций" :value="dashboard.registrations" />
      <UiStatCard label="Пользователей" :value="dashboard.users" />
      <UiStatCard label="Учебных заведений" :value="dashboard.institutions" />
      <UiStatCard label="Черновики" :value="statusSummary.draft" />
      <UiStatCard label="Опубликованные" :value="statusSummary.published" />
      <UiStatCard label="Архив" :value="statusSummary.archived" />
    </section>

    <section class="admin-events-workspace">
      <AdminEventEditor
        v-model="form"
        :institutions="institutions"
        :submitting="submitting"
        :editing="Boolean(editingEventId)"
        @submit="submitForm"
        @reset="resetForm"
      />
      <AdminParticipantsPanel
        :events="events"
        :institutions="institutions"
        :selected-event-id="selectedEventId"
        :search="participantSearch"
        :institution-id="participantInstitutionId"
        :participants="participants"
        :loading="participantsLoading"
        :removing-participant-id="actionState.removingParticipantId"
        @update:selected-event-id="selectedEventId = $event"
        @update:search="participantSearch = $event"
        @update:institution-id="participantInstitutionId = $event"
        @apply="loadParticipants"
        @remove="removeParticipant"
      />
    </section>

    <section class="admin-events-list">
      <header class="admin-events-list__header">
        <h2>Реестр мероприятий</h2>
        <p>Быстрый поиск и массовая навигация по текущим карточкам.</p>
      </header>

      <div class="admin-events-list__filters">
        <UiSegmentTabs v-model="eventStatusFilter" :items="statusFilters" />
        <input v-model.trim="eventSearch" type="text" placeholder="Поиск по названию или учебному заведению" />
      </div>

      <div v-if="loading" class="empty-state">Загружаем мероприятия...</div>
      <div v-else-if="filteredEvents.length === 0" class="empty-state">По выбранным условиям ничего не найдено.</div>
      <div v-else class="admin-events-grid">
        <AdminEventCard
          v-for="item in filteredEvents"
          :key="item.id"
          :event="item"
          :selected="selectedEventId === String(item.id)"
          :archiving="actionState.archivingId === item.id"
          :deleting="actionState.deletingId === item.id"
          :restoring="actionState.restoringId === item.id"
          @edit="startEdit"
          @archive="archiveEvent"
          @restore="restoreEvent"
          @delete="deleteEvent"
          @participants="selectEventForParticipants"
        />
      </div>
    </section>
  </AdminShell>
</template>

<style scoped>
.admin-events-hero {
  border: 1px solid #d7e1ef;
  background:
    radial-gradient(circle at 8% 12%, rgba(117, 178, 248, 0.16), transparent 38%),
    radial-gradient(circle at 88% 10%, rgba(67, 196, 170, 0.14), transparent 34%),
    linear-gradient(180deg, #ffffff, #f6faff);
  border-radius: 24px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  box-shadow: 0 12px 26px rgba(30, 48, 77, 0.08);
}

.admin-events-hero h2 {
  margin: 0;
  color: #1b2f4c;
  font-size: clamp(26px, 2.8vw, 38px);
}

.admin-events-hero p {
  margin: 8px 0 0;
  color: #596e8b;
}

.admin-events-stats {
  margin-top: 14px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.admin-events-workspace {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 12px;
  align-items: start;
}

.admin-events-list {
  margin-top: 14px;
  border: 1px solid #d7e1ee;
  border-radius: 24px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 12px 30px rgba(30, 45, 73, 0.09);
  padding: 18px;
}

.admin-events-list__header h2 {
  margin: 0;
  color: #1c2f4d;
  font-size: clamp(24px, 2.2vw, 32px);
}

.admin-events-list__header p {
  margin: 8px 0 0;
  color: #576b88;
}

.admin-events-list__filters {
  margin-top: 12px;
  display: grid;
  grid-template-columns: auto minmax(260px, 1fr);
  gap: 10px;
  align-items: center;
}

.admin-events-list__filters input {
  border: 1px solid #d4deec;
  border-radius: 14px;
  padding: 11px 12px;
  background: #edf3fb;
  color: #233554;
  outline: none;
}

.admin-events-grid {
  margin-top: 12px;
  display: grid;
  gap: 12px;
}

.action-btn-soft {
  background: #e7eef9;
  color: #1f3658;
}

.action-btn-soft:hover:not(:disabled) {
  background: #dbe7f8;
}

:deep(.section-tabs) {
  background: #eaf0fa;
}

:deep(.seg-btn.active) {
  background: #0f1f37;
}

@media (max-width: 1280px) {
  .admin-events-workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .admin-events-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .admin-events-list__filters {
    grid-template-columns: 1fr;
  }
}
</style>
