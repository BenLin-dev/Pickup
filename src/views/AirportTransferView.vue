<script setup>
import HeroSection from '@/components/HeroSection.vue'
import ProcessSteps from '@/components/ProcessSteps.vue'
import FaqAccordion from '@/components/FaqAccordion.vue'
import CtaBand from '@/components/CtaBand.vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSeo, useJsonLd, useBreadcrumbs } from '@/composables/useSeo'
import { pages, airportAdvantages, airportSteps, faqGroups, ctaBands, heroBadges } from '@/data/content'
import { site, popularRoutes, vehicleOptions } from '@/data/site'
import { money } from '@/utils/price'
import { t } from '@/i18n'

const page = pages.airportTransfer
useSeo(page)

const airportFaq = faqGroups.find((g) => g.id === 'airport')

useJsonLd('faq-airport', {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: airportFaq.items.map((i) => ({
    '@type': 'Question',
    name: i.q,
    acceptedAnswer: { '@type': 'Answer', text: i.a },
  })),
})

/**
 * Service block for the airport transfer page. The service is `Service` with
 * an `areaServed` that lists both airport and station catchments, and a
 * `provider` reference back to the LocalBusiness on the home page.
 */
useJsonLd('service-airport', {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${site.domain}/airport-transfer#service`,
  name: 'Guangzhou Baiyun Airport (CAN) Transfer & Pickup',
  serviceType: 'AirportTransfer',
  description: page.description,
  url: `${site.domain}/airport-transfer`,
  provider: { '@id': `${site.domain}#business` },
  areaServed: [
    { '@type': 'Airport', name: 'Guangzhou Baiyun International Airport (CAN)', iataCode: 'CAN' },
    { '@type': 'Airport', name: 'Shenzhen Bao\u2019an International Airport (SZX)', iataCode: 'SZX' },
    { '@type': 'TrainStation', name: 'Guangzhou South Railway Station' },
    { '@type': 'TrainStation', name: 'Guangzhou East Railway Station' },
    { '@type': 'City', name: 'Guangzhou' },
    { '@type': 'City', name: 'Foshan' },
    { '@type': 'City', name: 'Dongguan' },
  ],
  offers: { '@type': 'Offer', priceCurrency: 'USD', price: '57', url: `${site.domain}/vehicles-pricing` },
})

useBreadcrumbs('airport-transfer', [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/airport-transfer' },
  { name: 'Airport Transfer', path: null },
])
</script>

<template>
  <HeroSection
    variant="media"
    image="/images/hero/airport.jpg"
    :image-alt="t('Terminal at Guangzhou Baiyun International Airport')"
    :eyebrow="t('Airport Transfer')"
    :title="page.h1"
    :lead="page.lead"
    :badges="heroBadges.airportTransfer"
    priority
    :crumbs="[{ label: t('Home'), to: '/' }, { label: t('Airport Transfer') }]"
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
        <h2>{{ t('Why Choose Us') }}</h2>
        <p class="lead">{{ t('Airport pickups are the part of the trip where things go wrong most easily. We plan around that.') }}</p>
      </div>

      <div class="grid grid--4">
        <div v-for="(a, i) in airportAdvantages" :key="a.title" class="card" v-reveal="{ delay: i * 70 }">
          <span class="icon-badge">
            <AppIcon :name="a.icon" :size="24" :stroke="1.9" />
          </span>
          <h3 class="card__title">{{ a.title }}</h3>
          <p class="card__text">{{ a.text }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- ---------------------------------------------------- popular routes -->
  <!-- `id="fares"` is a deep-link target: the footer sends the
       "guangzhou south station transfer" keyword here because this table
       prices Guangzhou South Station by name. -->
  <section id="fares" class="section section--soft">
    <div class="container">
      <div class="section-head" v-reveal>
        <p class="eyebrow">{{ t('Fixed prices') }}</p>
        <h2>{{ t('Popular Routes') }}</h2>
        <p class="lead">{{ t('One price per vehicle — not per person. Tolls and airport parking are already included.') }}</p>
      </div>

      <div class="grid grid--3">
        <article v-for="(r, i) in popularRoutes" :key="r.from + r.to" class="card" v-reveal="{ delay: i * 80 }">
          <p class="eyebrow" style="margin-bottom: 10px">
            <AppIcon name="route" :size="15" :stroke="2.2" />
            {{ r.duration }}
          </p>

          <h3 class="card__title" style="font-size: 1.05rem">
            {{ r.from }}
            <br />
            <AppIcon name="arrow" :size="16" :stroke="2.2" style="transform: rotate(90deg)" />
            {{ r.to }}
          </h3>

          <div class="mt-24">
            <template v-if="r.sedan">
              <p class="price" style="font-size: 1.45rem">
                From {{ money(r.sedan) }}
                <small>sedan</small>
              </p>
              <p class="card__text" style="margin-top: 4px">
                {{ money(r.mpv) }} for a 7-seat MPV — per vehicle
              </p>
            </template>
            <p v-else class="price" style="font-size: 1.3rem">{{ t('On request') }}</p>
          </div>

          <p v-if="r.note" class="pill pill--accent" style="align-self: flex-start">{{ r.note }}</p>

          <RouterLink to="/contact" class="btn btn--outline btn--sm">{{ t('Book this route') }}<AppIcon name="arrow" :size="16" :stroke="2.2" class="btn__arrow" />
          </RouterLink>
        </article>
      </div>

      <p class="table-note">{{ t('Need a different destination? Send us your address and we will quote a fixed price — usually the same day.') }}</p>
    </div>
  </section>

  <!-- --------------------------------------------------- vehicle options -->
  <section class="section">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Comfort and space') }}</p>
        <h2>{{ t('Vehicle Options') }}</h2>
        <p class="lead">{{ t('Choose the size that matches your group and luggage.') }}</p>
      </div>

      <div class="grid grid--2" style="max-width: 860px; margin: 0 auto">
        <article v-for="(v, i) in vehicleOptions" :key="v.label" class="vehicle" v-reveal="{ delay: i * 80 }">
          <div class="vehicle__media">
            <img :src="v.image" :alt="t('{label} airport transfer vehicle', { label: v.label })" loading="lazy" decoding="async" />
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
            <p v-if="v.from" class="price" style="font-size: 1.2rem">
              From {{ money(v.from) }} <small>{{ t('per vehicle') }}</small>
            </p>
            <p v-else class="price" style="font-size: 1.1rem">{{ t('On request') }}</p>
          </div>
        </article>
      </div>

      <div class="btn-row mt-32" style="justify-content: center">
        <RouterLink to="/vehicles-pricing" class="btn btn--outline">{{ t('See full fleet &amp; prices') }}<AppIcon name="arrow" :size="17" :stroke="2.2" class="btn__arrow" />
        </RouterLink>
      </div>
    </div>
  </section>

  <!-- --------------------------------------------------------- how to book -->
  <section class="section section--mint">
    <div class="container">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Step by step') }}</p>
        <h2>{{ t('How to Book') }}</h2>
        <p class="lead">{{ t('From landing to leaving the terminal, we keep it simple.') }}</p>
      </div>

      <ProcessSteps :steps="airportSteps" />
    </div>
  </section>

  <!-- ---------------------------------------------------------------- faq -->
  <section class="section">
    <div class="container container--narrow">
      <div class="section-head section-head--center" v-reveal>
        <p class="eyebrow">{{ t('Good to know') }}</p>
        <h2>{{ t('Airport Transfer FAQs') }}</h2>
      </div>

      <FaqAccordion :items="airportFaq.items" id-prefix="ap" :open-index="0" />

      <div class="btn-row mt-32" style="justify-content: center">
        <RouterLink to="/faqs" class="btn btn--outline btn--sm">{{ t('All frequently asked questions') }}</RouterLink>
      </div>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
      <CtaBand v-bind="ctaBands.airport" image="/images/hero/airport.jpg" />
    </div>
  </section>
</template>
