<script setup>
import HeroSection from '@/components/HeroSection.vue'
import LegalArticle from '@/components/LegalArticle.vue'
import { useSeo } from '@/composables/useSeo'
import { t } from '@/i18n'
import { pages, privacySections, legalUpdated } from '@/data/content'

const page = pages.privacy
useSeo(page)
</script>

<template>
  <HeroSection
    variant="split"
    :title="page.h1"
    :lead="page.lead"
    :crumbs="[{ label: t('Home'), to: '/' }, { label: t('Privacy Policy') }]"
  />

  <LegalArticle :sections="privacySections" :updated="legalUpdated" />
</template>
