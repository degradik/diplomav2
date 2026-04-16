<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="auth-layout">
    <section class="auth-layout__brand">
      <h1>Система регистрации участников мероприятий</h1>
      <p>
        Удобный вход для участников, быстрый доступ к профилю и списку доступных мероприятий.
      </p>
    </section>

    <section class="auth-layout__panel">
      <header class="auth-layout__header">
        <h2>{{ title }}</h2>
        <p>{{ subtitle }}</p>
      </header>
      <slot />
    </section>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  padding: 18px;
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(340px, 1fr);
  gap: 18px;
  background:
    radial-gradient(circle at 12% 10%, #c9e8ff 0, transparent 32%),
    radial-gradient(circle at 78% 8%, #d7f2e5 0, transparent 28%),
    #dce1ea;
}

.auth-layout__brand {
  border-radius: 28px;
  padding: 34px;
  background: linear-gradient(145deg, #0f1e38, #17294b 55%, #214575);
  color: #eef4ff;
  box-shadow: 0 20px 42px rgba(16, 28, 52, 0.25);
  display: grid;
  align-content: end;
  gap: 14px;
}

.auth-layout__brand h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 46px);
  line-height: 1.1;
}

.auth-layout__brand p {
  margin: 0;
  color: #c6d5ef;
  max-width: 520px;
}

.auth-layout__panel {
  border-radius: 28px;
  background: rgba(248, 251, 255, 0.94);
  border: 1px solid #d4dceb;
  box-shadow: 0 18px 36px rgba(53, 66, 90, 0.12);
  padding: 32px;
  align-self: center;
}

.auth-layout__header h2 {
  margin: 0;
  font-size: clamp(28px, 3.8vw, 40px);
  color: #16243e;
}

.auth-layout__header p {
  margin: 8px 0 0;
  color: #6a7892;
}

@media (max-width: 1040px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }

  .auth-layout__brand {
    min-height: 240px;
    align-content: end;
  }
}

@media (max-width: 640px) {
  .auth-layout {
    padding: 10px;
  }

  .auth-layout__brand,
  .auth-layout__panel {
    border-radius: 20px;
    padding: 20px;
  }
}
</style>
