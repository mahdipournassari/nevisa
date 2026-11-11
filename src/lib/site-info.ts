export const siteInfo = {
  name: 'نویسا',
  description: 'دستیار هوشمند تولید، ویرایش و تحلیل محتوا',
  designerName: 'نام طراح و توسعه‌دهنده',
  designerBio: 'این بخش را می‌توانید با نام، تخصص و معرفی کوتاه طراح و توسعه‌دهنده نویسا تکمیل کنید.',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || '',
  socialLinks: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    telegram: process.env.NEXT_PUBLIC_TELEGRAM_URL || '',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '',
  },
};
