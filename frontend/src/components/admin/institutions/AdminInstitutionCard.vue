<script setup>
const props = defineProps({
  institution: {
    type: Object,
    required: true,
  },
  deleting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["edit", "delete"]);

function onEdit() {
  emit("edit", props.institution);
}

function onDelete() {
  emit("delete", props.institution.id);
}
</script>

<template>
  <article class="institution-card">
    <div class="institution-card__main">
      <h3>{{ institution.name }}</h3>
      <div class="institution-card__meta">
        <p>
          <span>Пользователей</span>
          <strong>{{ institution._count?.users ?? 0 }}</strong>
        </p>
        <p>
          <span>Мероприятий</span>
          <strong>{{ institution._count?.events ?? 0 }}</strong>
        </p>
      </div>
    </div>

    <div class="institution-card__actions">
      <button type="button" class="action-btn" @click="onEdit">Редактировать</button>
      <button type="button" class="action-btn action-btn-danger" :disabled="deleting" @click="onDelete">
        {{ deleting ? "Удаляем..." : "Удалить" }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.institution-card {
  border: 1px solid #d8e2ef;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff, #f7faff);
  box-shadow: 0 10px 24px rgba(31, 47, 74, 0.08);
  padding: 14px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.institution-card__main h3 {
  margin: 0;
  color: #1c2f4d;
  font-size: 22px;
}

.institution-card__meta {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 8px;
}

.institution-card__meta p {
  margin: 0;
  border: 1px solid #dbe6f5;
  border-radius: 12px;
  background: #eef4fd;
  padding: 8px 10px;
  display: grid;
  gap: 2px;
}

.institution-card__meta span {
  color: #607492;
  font-size: 12px;
}

.institution-card__meta strong {
  color: #263b59;
}

.institution-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 760px) {
  .institution-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .institution-card__meta {
    grid-template-columns: 1fr;
  }
}
</style>
