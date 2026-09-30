<script setup>
import AppIcon from '@/components/AppIcon.vue'
import { useSeo } from '@/composables/useSeo'
import { site } from '@/data/site'
import { t } from '@/i18n'

useSeo({
  path: '/404',
  title: 'Page not found | CantonPickup',
  description: 'The page you were looking for could not be found. Browse our airport transfer, private driver and factory visit services in Guangzhou and Foshan.',
  keywords: '',
})

const links = [
  { to: '/airport-transfer', label: t('Airport Transfer'), icon: 'plane' },
  { to: '/private-driver', label: t('Private Driver'), icon: 'user' },
  { to: '/factory-visits', label: t('Factory Visits'), icon: 'factory' },
  { to: '/vehicles-pricing', label: t('Vehicles & Pricing'), icon: 'car' },
]
</script>

<template>
  <section class="section" style="padding-top: calc(var(--header-h) + 60px)">
    <div class="container container--narrow text-center">
      <p class="eyebrow" style="justify-content: center">{{ t('Error 404') }}</p>
      <h1>{{ t('This Page Took a Wrong Turn') }}</h1>
      <p class="lead" style="margin-inline: auto">{{ t('The page you were looking for is not here. It may have been moved, or the link may have been mistyped.') }}</p>

      <div class="btn-row mt-32" style="justify-content: center">
        <RouterLink to="/" class="btn btn--lg">{{ t('Back to home') }}<AppIcon name="arrow" :size="18" :stroke="2.2" class="btn__arrow" />
        </RouterLink>
        <RouterLink to="/contact" class="btn btn--outline btn--lg">{{ t('Get a quote') }}</RouterLink>
      </div>

      <div class="grid grid--4 mt-40">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="card card--link"
          style="text-decoration: none; text-align: left"
        >
          <span class="icon-badge icon-badge--sm" style="margin-bottom: 12px">
            <AppIcon :name="l.icon" :size="20" :stroke="1.9" />
          </span>
          <span class="card__title" style="font-size: 1rem">{{ l.label }}</span>
        </RouterLink>
      </div>

      <p class="table-note mt-32">{{ t('Or reach us directly on') }}<a :href="site.waLink($route.path)" target="_blank" rel="noopener">WhatsApp {{ site.whatsapp }}</a>{{ t('or by') }}<a :href="site.mailto">email</a>.
      </p>
    </div>
  </section>
</template>
