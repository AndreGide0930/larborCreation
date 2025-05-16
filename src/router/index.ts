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
      meta: { requiresAuth: true }
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: Tasks,
      meta: { requiresAuth: true }
    },
    {
      path: '/schedule',
      name: 'schedule',
      component: Schedule,
      meta: { requiresAuth: true }
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: Pomodoro,
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: true }
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

// // Navigation guard
// router.beforeEach((to, from, next) => {
//   const authStore = useAuthStore()
  
//   if (to.matched.some(record => record.meta.requiresAuth)) {
//     if (!authStore.isAuthenticated) {
//       next({
//         path: '/login',
//         query: { redirect: to.fullPath }
//       })
//     } else {
//       next()
//     }
//   } else if (to.matched.some(record => record.meta.guest)) {
//     if (authStore.isAuthenticated) {
//       next('/')
//     } else {
//       next()
//     }
//   } else {
//     next()
//   }
// })

export default router