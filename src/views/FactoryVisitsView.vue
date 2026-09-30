<script setup>
import HeroSection from '@/components/HeroSection.vue'
import ProcessSteps from '@/components/ProcessSteps.vue'
import VehicleFleet from '@/components/VehicleFleet.vue'
import FaqAccordion from '@/components/FaqAccordion.vue'
import CtaBand from '@/components/CtaBand.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSeo, useJsonLd, useBreadcrumbs } from '@/composables/useSeo'
import { pages, factorySupport, factorySteps, faqGroups, ctaBands, heroBadges } from '@/data/content'
import { site } from '@/data/site'
import { t } from '@/i18n'

const page = pages.factoryVisits
useSeo(page)

const faq = faqGroups.find((g) => g.id === 'factory')

useJsonLd('faq-factory', {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.items.map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
})

useJsonLd('service-factory', {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${site.domain}/factory-visits#service`,
  name: 'Private Driver for Factory Visits in Guangzhou & Foshan',
  serviceType: 'FactoryVisitTransport',
  description: page.description,
  url: `${site.domain}/factory-visits`,
  provider: { '@id': `${site.domain}#business` },
  areaServed: [
    { '@type': 'City', name: 'Foshan' },
    { '@type': 'AdministrativeArea', name: 'Shunde District, Foshan' },
    { '@type': 'AdministrativeArea', name: 'Nanhai District, Foshan' },
    { '@type': 'AdministrativeArea', name: 'Chancheng District, Foshan' },
    { '@type': 'City', name: 'Dongguan' },
    { '@type': 'City', name: 'Guangzhou' },
  ],
})

useBreadcrumbs('factory-visits', [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/airport-transfer' },
  { name: 'Factory Visits', path: null },
])

const businessSupport = [
  t('Interpreting and translation for meetings and negotiations'),
  t('Local phone calls and confirmations with suppliers'),
  t('Help finding showrooms, markets and testing labs'),
  t('Practical advice on payment, shipping and samples'),
  t('Flexible schedules when a meeting overruns'),
  t('Same driver across several days so you never repeat yourself'),
]

const areas = [
  t('Shunde — furniture and home appliances'),
  t('Nanhai — hardware, lighting, aluminium'),
  t('Chancheng — ceramics, sanitary ware, tiles'),
  t('Sanshui — textiles, packaging, building materials'),
  t('Baiyun & Panyu — Guangzhou trading markets'),
  t('Dongguan — electronics and mould making'),
]
</script>

<template>
  <HeroSection
    variant="media"
    image="/images/hero/factory.jpg"
    :image-alt="t('Modern factory building in Foshan, China')"
    :eyebrow="t('Business Travel & Factory Visits')"
    :title="page.h1"
    :lead="page.lead"
    :badges="heroBadges.factoryVisits"
    priority
    :crumbs="[{ label: t('Home'), to: '/' }, { label: t('Business Travel & Factory Visits') }]"
  >
    <template #actions>
      <RouterLink to="/contact" class="btn btn--light btn--lg">{{ t('Get a Quote') }}<AppIcon name="arrow" :size="18" :stroke="2.2" class="btn__arrow" />
      </RouterLink>
      <RouterLink to="/private-driver" class="btn btn--ghost-light btn--lg">{{ t('Full-day driver') }}</RouterLink>
    </template>
  </HeroSection>

  <!-- -------------------------------------------------------- our support -->
  <section class="section">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Sourcing trips') }}</p>
        <h2>{{ t('Our Support') }}</h2>
        <p class="lead">{{ t('Foshan\'s factories are spread across several districts. Getting between them is the part of a sourcing trip that eats the most time — we plan around it.') }}</p>
      </div>

      <div class="grid grid--4">
        <div v-for="(s, i) in factorySupport" :key="s.title" class="card" v-reveal="{ delay: i * 70 }">
          <span class="icon-badge">
            <AppIcon :name="s.icon" :size="24" :stroke="1.9" />
          </span>
          <h3 class="card__title">{{ s.title }}</h3>
          <p class="card__text">{{ s.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ---------------------------------------------------------- visit flow -->
  <section class="section section--soft">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('How it works') }}</p>
        <h2>{{ t('Your Visit, Planned') }}</h2>
        <p class="lead">{{ t('Hours of driving saved by grouping the right visits together.') }}</p>
      </div>

      <ProcessSteps :steps="factorySteps" />
    </div>
  </section>

  <!-- --------------------------------------------------------- where we go -->
  <section class="section">
    <div class="container">
      <div class="split">
        <div v-reveal>
          <p class="eyebrow">{{ t('Local knowledge') }}</p>
          <h2>{{ t('Districts We Know Well') }}</h2>
          <p class="lead">{{ t('Every district has its own speciality, and traffic behaves differently in each one. We build your route with that in mind.') }}</p>

          <ul class="check-list mt-24" style="font-size: 1rem">
            <li v-for="a in areas" :key="a">
              <AppIcon name="pin" :size="17" :stroke="2.2" />
              {{ a }}
            </li>
          </ul>
        </div>

        <div v-reveal="{ delay: 120 }">
          <img
            src="/images/hero/guangzhou-aerial.jpg"
            :alt="t('Aerial view of the Pearl River Delta industrial region')"
            loading="lazy"
            decoding="async"
            style="border-radius: var(--r-xl); box-shadow: var(--sh-lg); width: 100%"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- ------------------------------------------------------------- vehicles -->
  <section class="section section--mint">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Comfort between stops') }}</p>
        <h2>{{ t('Vehicle Options') }}</h2>
        <p class="lead">{{ t('Your driver waits at every stop with the air conditioning on, so you can take calls or review samples between visits.') }}</p>
      </div>

      <VehicleFleet :limit="3" />

      <div class="btn-row mt-32" style="justify-content: center">
        <RouterLink to="/vehicles-pricing" class="btn btn--outline">{{ t('See full fleet &amp; prices') }}<AppIcon name="arrow" :size="17" :stroke="2.2" class="btn__arrow" />
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- ----------------------------------------------------- business support -->
  <section class="section">
    <div class="container">
      <div class="split">
        <div v-reveal>
          <p class="eyebrow">{{ t('Beyond driving') }}</p>
          <h2>{{ t('Business Support') }}</h2>
          <p class="lead">{{ t('A car and driver is often not quite enough. If you need a hand with the practical side of doing business here, ask — we do this every week.') }}</p>

          <ul class="check-list mt-24" style="font-size: 1rem">
            <li v-for="b in businessSupport" :key="b">
              <AppIcon name="check" :size="17" :stroke="2.6" />
              {{ b }}
            </li>
          </ul>

          <div class="btn-row mt-32">
            <a :href="site.waLink($route.path)" target="_blank" rel="noopener" class="btn">
              <AppIcon name="whatsapp" :size="18" :stroke="1.8" />{{ t('Tell us what you need') }}</a>
            <a :href="site.mailto" class="btn btn--outline">
              <AppIcon name="mail" :size="18" :stroke="1.8" />{{ t('Email us') }}</a>
          </div>
        </div>

        <div v-reveal="{ delay: 120 }">
          <img
            src="/images/hero/highway-dusk.jpg"
            :alt="t('Highway at dusk in Guangdong province')"
            loading="lazy"
            decoding="async"
            style="border-radius: var(--r-xl); box-shadow: var(--sh-lg); width: 100%"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- ---------------------------------------------------------------- faq -->
  <section class="section section--soft">
    <div class="container container--narrow">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Good to know') }}</p>
        <h2>{{ t('Business Travel &amp; Factory Visit FAQs') }}</h2>
      </div>

      <FaqAccordion :items="faq.items" id-prefix="fv" :open-index="0" />

      <div class="btn-row mt-32" style="justify-content: center">
        <RouterLink to="/faqs" class="btn btn--outline btn--sm">{{ t('All frequently asked questions') }}</RouterLink>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <CtaBand v-bind="ctaBands.factory" image="/images/hero/factory.jpg" />
    </div>
  </section>
</template>
