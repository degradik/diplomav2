import { createRouter, createWebHistory } from "vue-router";
import {
  clearAuthSession,
  getStoredUser,
  isAdmin,
  isLoggedIn,
} from "./api";
import LoginPage from "./pages/auth/LoginPage.vue";
import RegisterPage from "./pages/auth/RegisterPage.vue";
import ProfilePage from "./pages/ProfilePage.vue";
import EventsPage from "./pages/EventsPage.vue";
import EventDetailsPage from "./pages/EventDetailsPage.vue";
import AdminLoginPage from "./pages/AdminLoginPage.vue";
import AdminEventsPage from "./pages/AdminEventsPage.vue";
import AdminInstitutionsPage from "./pages/AdminInstitutionsPage.vue";
import AdminUsersPage from "./pages/AdminUsersPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      redirect: () => (isLoggedIn() ? "/events" : "/login"),
    },
    {
      path: "/login",
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: "/register",
      component: RegisterPage,
      meta: { guestOnly: true },
    },
    {
      path: "/profile",
      component: ProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: "/events",
      component: EventsPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/events/:id",
      component: EventDetailsPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/admin",
      component: AdminLoginPage,
    },
    {
      path: "/admin/events",
      component: AdminEventsPage,
      meta: { requiresAdmin: true },
    },
    {
      path: "/admin/institutions",
      component: AdminInstitutionsPage,
      meta: { requiresAdmin: true },
    },
    {
      path: "/admin/users",
      component: AdminUsersPage,
      meta: { requiresAdmin: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: () => (isLoggedIn() ? "/events" : "/login"),
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.guestOnly && isLoggedIn()) {
    return isAdmin() ? "/admin/events" : "/events";
  }

  if (to.meta.requiresAuth && !isLoggedIn()) {
    return "/login";
  }

  if (to.meta.requiresAdmin) {
    if (!isLoggedIn()) {
      return "/admin";
    }
    if (!isAdmin()) {
      clearAuthSession();
      return "/admin";
    }
  }

  if (to.path === "/admin" && isAdmin()) {
    const user = getStoredUser();
    if (user?.role === "ADMIN") {
      return "/admin/events";
    }
  }

  return true;
});

export default router;
