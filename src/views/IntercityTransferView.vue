<script setup>
import HeroSection from '@/components/HeroSection.vue'
import ProcessSteps from '@/components/ProcessSteps.vue'
import FaqAccordion from '@/components/FaqAccordion.vue'
import CtaBand from '@/components/CtaBand.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSeo, useJsonLd, useBreadcrumbs } from '@/composables/useSeo'
import { pages, intercityAdvantages, intercitySteps, faqGroups, ctaBands, heroBadges } from '@/data/content'
import { site, intercityRoutes, vehicleOptions } from '@/data/site'
import { money } from '@/utils/price'
import { t } from '@/i18n'

const page = pages.intercityTransfer
useSeo(page)

const faq = faqGroups.find((g) => g.id === 'intercity')

useJsonLd('faq-intercity', {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.items.map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
})

useJsonLd('service-intercity', {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${site.domain}/intercity-transfer#service`,
  name: 'Intercity Transfer in Guangdong',
  serviceType: 'IntercityTransfer',
  description: page.description,
  url: `${site.domain}/intercity-transfer`,
  provider: { '@id': `${site.domain}#business` },
  areaServed: [
    { '@type': 'City', name: 'Guangzhou' },
    { '@type': 'City', name: 'Foshan' },
    { '@type': 'City', name: 'Dongguan' },
    { '@type': 'City', name: 'Zhongshan' },
    { '@type': 'City', name: 'Shenzhen' },
    { '@type': 'City', name: 'Zhuhai' },
    { '@type': 'City', name: 'Huizhou' },
  ],
})

useBreadcrumbs('intercity-transfer', [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/airport-transfer' },
  { name: 'Intercity Transfer', path: null },
])
</script>

<template>
  <HeroSection
    variant="media"
    image="/images/hero/highway-dusk.jpg"
    :image-alt="t('Highway interchange at dusk in Guangdong province')"
    :eyebrow="t('Intercity Transfer')"
    :title="page.h1"
    :lead="page.lead"
    :badges="heroBadges.intercityTransfer"
    priority
    :crumbs="[{ label: t('Home'), to: '/' }, { label: t('Intercity Transfer') }]"
  >
    <template #actions>
      <RouterLink to="/contact" class="btn btn--light btn--lg">{{ t('Get a Quote') }}<AppIcon name="arrow" :size="18" :stroke="2.2" class="btn__arrow" />
      </RouterLink>
      <a :href="site.waLink($route.path)" target="_blank" rel="noopener" class="btn btn--ghost-light btn--lg">
        <AppIcon name="whatsapp" :size="18" :stroke="1.8" />{{ t('WhatsApp us') }}</a>
    </template>
  </HeroSection>

  <!-- ---------------------------------------------------------- why us -->
  <section class="section">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('What you get') }}</p>
        <h2>{{ t('Why Book a Fixed Route') }}</h2>
        <p class="lead">{{ t('Long-distance driving in Guangdong is easy to underestimate. We price it up front and give you a realistic arrival window.') }}</p>
      </div>

      <div class="grid grid--4">
        <div v-for="(a, i) in intercityAdvantages" :key="a.title" class="card" v-reveal="{ delay: i * 70 }">
          <span class="icon-badge">
            <AppIcon :name="a.icon" :size="24" :stroke="1.9" />
          </span>
          <h3 class="card__title">{{ a.title }}</h3>
          <p class="card__text">{{ a.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- -------------------------------------------------------- fixed prices -->
  <section class="section section--soft">
    <div class="container">
      <div class="section-head" v-reveal>
        <p class="eyebrow">{{ t('Fixed prices') }}</p>
        <h2>{{ t('Routes &amp; Prices') }}</h2>
        <p class="lead">{{ t('One-way fares, the same price in either direction. Fuel, highway tolls and city parking are already inside the figure.') }}</p>
      </div>

      <div class="price-table-wrap">
        <table class="price-table">
          <thead>
            <tr>
              <th scope="col">{{ t('Route') }}</th>
              <th scope="col">{{ t('Sedan (1–3)') }}</th>
              <th scope="col">{{ t('7-seat MPV (1–6)') }}</th>
              <th scope="col">{{ t('Luxury (1–6)') }}</th>
              <th scope="col">{{ t('9-seat (1–8)') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in intercityRoutes" :key="r.from + r.to">
              <td data-label="Route">{{ r.from }} → {{ r.to }}</td>
              <td data-label="Sedan">{{ money(r.sedan) }}</td>
              <td data-label="7-seat MPV">{{ money(r.mpv) }}</td>
              <td data-label="Luxury">{{ money(r.luxury) }}</td>
              <td data-label="9-seat">
                <span class="price">{{ money(r.van9) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="table-note">{{ t('Prices are per vehicle, not per person. A short stop on the way costs nothing extra — a longer detour is quoted before you confirm. Going somewhere else in Guangdong?') }}<RouterLink to="/contact">{{ t('Send us both addresses') }}</RouterLink>{{ t('and we will come back with a figure.') }}</p>
    </div>
  </section>

  <!-- --------------------------------------------------- vehicle options -->
  <section class="section">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Comfort and space') }}</p>
        <h2>{{ t('Vehicle Options') }}</h2>
        <p class="lead">{{ t('Two hours on the motorway is a lot more pleasant with the right car.') }}</p>
      </div>

      <div class="grid grid--2" style="max-width: 860px; margin: 0 auto">
        <article v-for="(v, i) in vehicleOptions" :key="v.label" class="vehicle" v-reveal="{ delay: i * 80 }">
          <div class="vehicle__media">
            <img :src="v.image" :alt="t('{label} intercity transfer vehicle', { label: v.label })" loading="lazy" decoding="async" />
          </div>
          <div class="vehicle__body">
            <h3 class="vehicle__name">{{ v.label }}</h3>
            <div class="vehicle__specs">
              <span class="vehicle__spec">
                <AppIcon name="users" :size="17" />
                {{ v.seats }}
              </span>
            </div>
            <p class="vehicle__desc">{{ v.text }}</p>
            <p class="price" style="font-size: 1.2rem">
              From {{ money(v.from) }} <small>{{ t('per vehicle') }}</small>
            </p>
          </div>
        </article>
      </div>

      <div class="btn-row mt-32" style="justify-content: center">
        <RouterLink to="/vehicles-pricing" class="btn btn--outline">{{ t('See full fleet &amp; prices') }}<AppIcon name="arrow" :size="17" :stroke="2.2" class="btn__arrow" />
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- ------------------------------------------------------- how to book -->
  <section class="section section--mint">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Step by step') }}</p>
        <h2>{{ t('How to Book') }}</h2>
        <p class="lead">{{ t('Four steps, and no meter to watch on the day.') }}</p>
      </div>

      <ProcessSteps :steps="intercitySteps" />
    </div>
  </section>

  <!-- ---------------------------------------------------------------- faq -->
  <section class="section">
    <div class="container container--narrow">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Good to know') }}</p>
        <h2>{{ t('Intercity Transfer FAQs') }}</h2>
      </div>

      <FaqAccordion :items="faq.items" id-prefix="ic" :open-index="0" />

      <div class="btn-row mt-32" style="justify-content: center">
        <RouterLink to="/faqs" class="btn btn--outline btn--sm">{{ t('All frequently asked questions') }}</RouterLink>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <CtaBand v-bind="ctaBands.intercity" image="/images/hero/highway-dusk.jpg" />
    </div>
  </section>
</template>
