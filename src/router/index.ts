import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Portfolio from '../views/Portfolio.vue'
import Tasks from '../views/Tasks.vue'
import Schedule from '../views/Schedule.vue'
import Pomodoro from '../views/Pomodoro.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'portfolio',
      component: Portfolio,
      // Temporarily remove auth requirement
      meta: { requiresAuth: false }
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: Tasks,
      meta: { requiresAuth: false }
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: Schedule,
      meta: { requiresAuth: false }
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: Pomodoro,
      meta: { requiresAuth: false }
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { guest: true }
    }
  ]
})

// Temporarily disable navigation guard
router.beforeEach((to, from, next) => {
  next()
})

export default router