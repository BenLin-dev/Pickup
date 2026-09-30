<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import PaymentIcons from './PaymentIcons.vue'
import { site, nav, routeNav, footerKeywords } from '@/data/site'
import { t } from '@/i18n'

const year = computed(() => new Date().getFullYear())

const serviceLinks = nav[1].children
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <!-- brand -->
        <div>
          <RouterLink to="/" class="logo footer__logo">
            <!-- the footer sits on a mid sky blue, so the lockup swaps to the
                 inverse build — the navy wordmark would vanish against it -->
            <img
              class="logo__img"
              src="/logo-inverse.svg"
              alt="CantonPickup"
              width="166"
              height="46"
            />
          </RouterLink>

          <p class="footer__desc">{{ t('Airport transfers, private drivers and factory visit transport in Guangzhou and Foshan. English-speaking drivers, fixed prices and 24/7 support.') }}</p>

          <div class="footer__social">
            <a :href="site.waLink($route.path)" target="_blank" rel="noopener" :aria-label="t('WhatsApp')">
              <AppIcon name="whatsapp" :size="19" :stroke="1.8" />
            </a>
            <a :href="site.mailto" :aria-label="t('Email')">
              <AppIcon name="mail" :size="19" :stroke="1.9" />
            </a>
            <a :href="`tel:${site.phoneRaw}`" :aria-label="t('Phone')">
              <AppIcon name="phone" :size="18" :stroke="1.9" />
            </a>
          </div>
        </div>

        <!-- services -->
        <div>
          <h4>{{ t('Services') }}</h4>
          <div class="footer__links">
            <RouterLink v-for="s in serviceLinks" :key="s.to" :to="s.to">
              {{ s.label }}
            </RouterLink>
            <RouterLink to="/vehicles-pricing">{{ t('Vehicles &amp; Pricing') }}</RouterLink>
          </div>
        </div>

        <!-- company -->
        <div>
          <h4>{{ t('Company') }}</h4>
          <div class="footer__links">
            <RouterLink to="/reviews">{{ t('Reviews &amp; Photos') }}</RouterLink>
            <RouterLink to="/blog">{{ t('Guides') }}</RouterLink>
            <RouterLink to="/about">{{ t('About Us') }}</RouterLink>
            <RouterLink to="/faqs">{{ t('FAQs') }}</RouterLink>
            <RouterLink to="/contact">{{ t('Contact') }}</RouterLink>
            <RouterLink to="/contact#quote">{{ t('Get a Quote') }}</RouterLink>
            <RouterLink to="/privacy-policy">{{ t('Privacy Policy') }}</RouterLink>
            <RouterLink to="/terms">{{ t('Terms &amp; Conditions') }}</RouterLink>
          </div>
        </div>

        <!-- contact -->
        <div>
          <h4>{{ t('Get in touch') }}</h4>
          <div class="footer__links">
            <a :href="site.waLink($route.path)" target="_blank" rel="noopener">
              WhatsApp &amp; WeChat: {{ site.whatsapp }}
            </a>
            <a :href="site.mailto">{{ site.email }}</a>
            <a class="footer__address" :href="site.mapsLink" target="_blank" rel="noopener">
              <AppIcon name="pin" :size="15" :stroke="1.9" />
              {{ site.addressLine }}
            </a>
            <span style="font-size: 0.92rem">Open {{ site.hours }}</span>
          </div>
        </div>
      </div>

      <!-- payment badges — the "We accept" strip from the reference site -->
      <div class="footer__pay">
        <PaymentIcons tone="on-dark" />
        <span class="footer__pay-note">{{ t('A 20% deposit confirms your booking. Free cancellation up to 48 hours before pickup.') }}</span>
      </div>

      <!-- popular routes: gives every intercity landing page a site-wide link -->
      <div
        style="
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 22px;
          padding-bottom: 20px;
        "
      >
        <h4 style="margin-bottom: 12px">{{ t('Popular routes') }}</h4>
        <div class="footer__bottom-links">
          <RouterLink v-for="r in routeNav" :key="r.to" :to="r.to">{{ r.label }}</RouterLink>
        </div>
      </div>

      <!-- keyword footer: helps the long-tail SEO terms the client supplied -->
      <div
        style="
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 22px;
          padding-bottom: 6px;
        "
      >
        <h4 style="margin-bottom: 12px">{{ t('Popular searches') }}</h4>
        <div class="footer__bottom-links">
          <!-- One keyword per destination — see `footerKeywords` in site.js for
               why this is not `seoKeywords.slice(0, 9)` any more. -->
          <RouterLink v-for="k in footerKeywords" :key="k.label" :to="k.to">
            {{ k.label }}
          </RouterLink>
        </div>
      </div>

      <div class="footer__bottom">
        <span>© {{ year }} {{ site.legalName }}. All rights reserved.</span>
        <div class="footer__bottom-links">
          <RouterLink to="/faqs">{{ t('FAQs') }}</RouterLink>
          <RouterLink to="/privacy-policy">{{ t('Privacy Policy') }}</RouterLink>
          <RouterLink to="/terms">{{ t('Terms') }}</RouterLink>
          <span>{{ t('Guangzhou · Foshan · Dongguan · Shenzhen') }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
