const recommendationRequestFixtures = {
  oneRecommendationRequest: {
    id: 1,
    requesterEmail: "student1@ucsb.edu",
    professorEmail: "prof1@ucsb.edu",
    explanation: "Letter for PhD applications",
    dateRequested: "2026-10-01T10:00:00",
    dateNeeded: "2026-12-01T17:00:00",
    done: false,
  },
  threeRecommendationRequests: [
    {
      id: 1,
      requesterEmail: "student1@ucsb.edu",
      professorEmail: "prof1@ucsb.edu",
      explanation: "Letter for PhD applications",
      dateRequested: "2026-10-01T10:00:00",
      dateNeeded: "2026-12-01T17:00:00",
      done: false,
    },
    {
      id: 2,
      requesterEmail: "student2@ucsb.edu",
      professorEmail: "prof2@ucsb.edu",
      explanation: "Letter for a summer internship",
      dateRequested: "2026-10-05T09:30:00",
      dateNeeded: "2026-11-15T12:00:00",
      done: true,
    },
    {
      id: 3,
      requesterEmail: "student3@ucsb.edu",
      professorEmail: "prof3@ucsb.edu",
      explanation: "Letter for a scholarship",
      dateRequested: "2026-10-10T14:15:00",
      dateNeeded: "2027-01-10T23:59:00",
      done: false,
    },
  ],
};

export { recommendationRequestFixtures };
