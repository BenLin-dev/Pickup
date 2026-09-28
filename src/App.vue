<script setup>
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import FloatingContact from './components/FloatingContact.vue'
</script>

<template>
  <a class="skip-link" href="#main">Skip to content</a>

  <SiteHeader />

  <main id="main">
    <!-- Keyed on the path on purpose.
         `/guangzhou-to-:city` is one route record, so vue-router reuses the
         RouteLandingView instance when you hop from one city to another (same
         for `/blog/:slug` + ArticleView). Everything those views do once in
         setup — `routePageBySlug(route.params.city)`, `useSeo()`, the JSON-LD
         blocks — therefore never ran again: the address bar changed while the
         page kept showing the previous city until a hard refresh.
         Re-creating the view on every path change makes client-side navigation
         land in exactly the state the prerendered page is in. -->
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </RouterView>
  </main>

  <SiteFooter />
  <FloatingContact />
</template>
