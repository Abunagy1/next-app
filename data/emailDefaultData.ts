const emailDefaultData = {
  branding: {
    logoImageUrl: 'https://via.placeholder.com/200x50?text=GoBye',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  },
  socialIcons: {
    facebookIconUrl:
      "https://s68ty.mjt.lu/img2/s68ty/3e251711-c52b-4997-9e56-6dd9d3419304/content",
    twitterIconUrl:
      "https://s68ty.mjt.lu/img2/s68ty/47b060fc-4b2b-41c5-97a8-b93987ab033c/content",
    instagramIconUrl:
      "https://s68ty.mjt.lu/img2/s68ty/1dde75ec-9e90-4899-97c4-cb63d50b14c4/content",
    youtubeIconUrl:
      "https://s68ty.mjt.lu/img2/s68ty/403f436f-ade0-4743-97cf-072a84ce40f6/content",
  },
  socialLinks: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
  },
  footer: {
    currentYear: new Date().getFullYear(),
    footerLinks: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/privacy-policy`,
        text: "Privacy Policy",
      },
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/terms-and-conditions`,
        text: "Terms & Conditions",
      },
    ],
    companyAddress: "GoBye, 1, rue de la République, 75001 Paris, France",
  },
};

export default emailDefaultData;
