<script setup lang="ts">
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  ENAMAD,
  SITE_NAME,
  SOCIAL_LINKS,
  STORE_HOURS,
} from '~/constants/site';
import { toPersianDigits } from '~/composables/useFormat';

type Channel = {
  key: string;
  label: string;
  value: string;
  href: string;
  icon: string;
};

const phoneHref = CONTACT_PHONE ? `tel:${CONTACT_PHONE.replace(/\D/g, '')}` : '';
const phoneDisplay = CONTACT_PHONE ? toPersianDigits(CONTACT_PHONE) : '';

const channels = computed(() => {
  const items: Channel[] = [
    {
      key: 'phone',
      label: 'تماس تلفنی',
      value: phoneDisplay || CONTACT_PHONE,
      href: phoneHref,
      icon: 'lucide:phone',
    },
    {
      key: 'whatsapp',
      label: 'واتساپ پشتیبانی',
      value: 'پیام سریع برای مشاوره خرید',
      href: SOCIAL_LINKS.whatsapp,
      icon: 'lucide:message-circle',
    },
    {
      key: 'rubika-admin',
      label: 'آیدی ادمین روبیکا',
      value: 'Aytay_irr',
      href: SOCIAL_LINKS.rubikaAdmin,
      icon: 'lucide:user-round',
    },
    {
      key: 'rubika-channel',
      label: 'کانال روبیکا',
      value: 'aytayir',
      href: SOCIAL_LINKS.rubikaChannel,
      icon: 'lucide:radio',
    },
    {
      key: 'whatsapp-group',
      label: 'گروه واتساپ',
      value: 'خبر بار جدید و شارژ انبار',
      href: SOCIAL_LINKS.whatsappGroup,
      icon: 'lucide:users',
    },
    {
      key: 'email',
      label: 'ایمیل',
      value: CONTACT_EMAIL,
      href: CONTACT_EMAIL ? `mailto:${CONTACT_EMAIL}` : '',
      icon: 'lucide:mail',
    },
  ];

  return items.filter((item) => Boolean(item.href));
});

const primaryWhatsapp = computed(
  () => channels.value.find((c) => c.key === 'whatsapp') || null
);

usePageSeo({
  title: 'تماس با ما',
  description: `ارتباط با ${SITE_NAME} برای مشاوره خرید لاستیک، پیگیری سفارش و دریافت آدرس حضوری.`,
  path: '/contact',
});
</script>

<template>
  <div class="contact">
    <header class="contact__intro">
      <div class="contact__intro-text">
        <p class="contact__brand">{{ SITE_NAME }}</p>
        <h1 class="contact__title">تماس با ما</h1>
        <p class="contact__lead">
          برای مشاوره سایز، موجودی و سفارش با پشتیبانی در ارتباط باشید.
        </p>
        <div class="contact__quick">
          <a
            v-if="primaryWhatsapp"
            :href="primaryWhatsapp.href"
            target="_blank"
            rel="noopener noreferrer"
            class="contact__btn contact__btn--main"
          >
            <AppIcon name="lucide:message-circle" size="sm" />
            پیام در واتساپ
          </a>
          <a
            v-if="phoneHref"
            :href="phoneHref"
            class="contact__btn contact__btn--line"
            dir="ltr"
          >
            <AppIcon name="lucide:phone" size="sm" />
            {{ phoneDisplay }}
          </a>
        </div>
      </div>
      <div class="contact__intro-photo">
        <img
          src="/images/tire/hero-warehouse.jpg"
          alt="انبار لاستیک‌شاپ"
          width="720"
          height="480"
          loading="lazy"
          decoding="async"
        />
      </div>
    </header>

    <div class="contact__grid">
      <section class="contact__panel" aria-labelledby="contact-channels-title">
        <h2 id="contact-channels-title" class="contact__panel-title">راه‌های ارتباط</h2>
        <ul class="contact__list">
          <li v-for="channel in channels" :key="channel.key">
            <a
              :href="channel.href"
              class="contact__row"
              :target="channel.href.startsWith('http') ? '_blank' : undefined"
              :rel="channel.href.startsWith('http') ? 'noopener noreferrer' : undefined"
            >
              <span class="contact__row-icon" aria-hidden="true">
                <AppIcon :name="channel.icon" size="md" />
              </span>
              <span class="contact__row-copy">
                <span class="contact__row-label">{{ channel.label }}</span>
                <span
                  class="contact__row-value"
                  :dir="channel.key === 'phone' || channel.key === 'email' ? 'ltr' : undefined"
                >
                  {{ channel.value }}
                </span>
              </span>
              <AppIcon name="lucide:chevron-left" size="sm" class="contact__row-chevron" />
            </a>
          </li>
        </ul>
      </section>

      <aside class="contact__side">
        <div class="contact__meta">
          <div class="contact__meta-item">
            <AppIcon name="lucide:clock-3" size="md" class="contact__meta-icon" />
            <div>
              <p class="contact__meta-label">ساعات کاری</p>
              <p class="contact__meta-value">{{ STORE_HOURS }}</p>
            </div>
          </div>
          <div class="contact__meta-item">
            <AppIcon name="lucide:map-pin" size="md" class="contact__meta-icon" />
            <div>
              <p class="contact__meta-label">آدرس حضوری</p>
              <p class="contact__meta-value">
                برای دریافت آدرس، در روبیکا یا واتساپ پیام بدهید.
              </p>
            </div>
          </div>
        </div>

        <p class="contact__hint">
          برای خبر شدن از بارهای جدید، عضو گروه واتساپ و کانال روبیکا شوید.
        </p>

        <div class="contact__foot">
          <a
            v-if="ENAMAD.href"
            :href="ENAMAD.href"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="نماد اعتماد الکترونیکی"
          >
            <img
              src="/enamad.png"
              alt="نماد اعتماد الکترونیکی"
              width="125"
              height="136"
              class="contact__enamad"
            />
          </a>
          <NuxtLink to="/shop" class="contact__shop">
            بازگشت به فروشگاه
            <AppIcon name="lucide:arrow-left" size="sm" />
          </NuxtLink>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.contact {
  max-width: 68rem;
  margin: 0 auto;
  padding: 1.25rem 1rem 5.5rem;
  color: #0f172a;
}

.contact__intro {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.contact__intro-text {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.35rem 1.2rem;
  border-inline-start: 4px solid #dc2626;
}

.contact__brand {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.contact__title {
  margin: 0.45rem 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #475569;
}

.contact__lead {
  margin: 0.7rem 0 0;
  max-width: 28rem;
  font-size: 0.9rem;
  line-height: 1.85;
  color: #64748b;
}

.contact__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1.1rem;
}

.contact__btn {
  display: inline-flex;
  min-height: 2.7rem;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  border-radius: 0.75rem;
  padding: 0.55rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
}

.contact__btn--main {
  background: #dc2626;
  color: #fff;
}

.contact__btn--main:hover {
  background: #b91c1c;
}

.contact__btn--line {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #0f172a;
}

.contact__btn--line:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.contact__intro-photo {
  overflow: hidden;
  border-radius: 1.25rem;
  border: 1px solid #e2e8f0;
  background: #e2e8f0;
  min-height: 11rem;
}

.contact__intro-photo img {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 11rem;
  object-fit: cover;
}

.contact__grid {
  display: grid;
  gap: 1rem;
}

.contact__panel,
.contact__meta {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 1.25rem;
}

.contact__panel {
  padding: 1rem 0.85rem 0.85rem;
}

.contact__panel-title {
  margin: 0 0.35rem 0.75rem;
  font-size: 0.95rem;
  font-weight: 800;
}

.contact__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.contact__row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  min-height: 3.6rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.9rem;
  background: #f8fafc;
  border: 1px solid transparent;
}

.contact__row:hover {
  border-color: #fecaca;
  background: #fff;
}

.contact__row-icon {
  display: grid;
  place-items: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.7rem;
  background: #0f172a;
  color: #fff;
}

.contact__row-copy {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.contact__row-label {
  font-size: 0.72rem;
  color: #64748b;
}

.contact__row-value {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact__row-chevron {
  color: #94a3b8;
}

.contact__side {
  display: grid;
  gap: 0.85rem;
  align-content: start;
}

.contact__meta {
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.contact__meta-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.75rem;
  align-items: start;
}

.contact__meta-icon {
  color: #dc2626;
  margin-top: 0.1rem;
}

.contact__meta-label {
  margin: 0;
  font-size: 0.72rem;
  color: #64748b;
}

.contact__meta-value {
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.7;
  color: #0f172a;
}

.contact__hint {
  margin: 0;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  font-size: 0.84rem;
  line-height: 1.8;
  color: #9a3412;
}

.contact__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.contact__enamad {
  display: block;
  height: 5rem;
  width: auto;
}

.contact__shop {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.6rem;
  padding: 0.45rem 0.85rem;
  border-radius: 0.7rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.contact__shop:hover {
  border-color: #dc2626;
  color: #dc2626;
}

@media (min-width: 768px) {
  .contact {
    padding: 1.75rem 1.25rem 4rem;
  }

  .contact__intro {
    grid-template-columns: 1.15fr 0.85fr;
    align-items: stretch;
    gap: 1.15rem;
  }

  .contact__intro-text {
    padding: 1.75rem 1.5rem;
  }

  .contact__brand {
    font-size: 2rem;
  }

  .contact__intro-photo img {
    min-height: 100%;
  }

  .contact__grid {
    grid-template-columns: 1.35fr 0.9fr;
    gap: 1.15rem;
    align-items: start;
  }

  .contact__panel {
    padding: 1.15rem;
  }
}
</style>
