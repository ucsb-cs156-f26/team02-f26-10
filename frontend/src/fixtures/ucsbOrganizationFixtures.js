const ucsbOrganizationFixtures = {
  oneOrganization: {
    orgCode: "SKY",
    orgTranslationShort: "SKYDIVING CLUB",
    orgTranslation: "SKYDIVING CLUB AT UCSB",
    inactive: false,
  },
  threeOrganizations: [
    {
        orgCode: "ZPR",
        orgTranslationShort: "ZPRRR",
        orgTranslation: "ZPPRCLUB AT UCSB",
        inactive: false,
    },
    {
        orgCode: "GGG",
        orgTranslationShort: "GGGCLUB",
        orgTranslation: "GGG CLUB AT UCSB",
        inactive: false,
    },
    {
        orgCode: "HHH",
        orgTranslationShort: "HHH Club",
        orgTranslation: "HHH CLUB AT UCSB",
        inactive: true,
    },
  ],
};

export { ucsbOrganizationFixtures };
