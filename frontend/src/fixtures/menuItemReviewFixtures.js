const menuItemReviewFixtures = {
  oneMenuItemReview: {
    id: 1,
    itemId: 1,
    reviewerEmail: "student1@example.com",
    stars: 5,
    dateReviewed: "2026-10-27T15:00:00",
    comments: "Great food and excellent service!",
  },

  threeMenuItemReviews: [
    {
      id: 1,
      itemId: 1,
      reviewerEmail: "student1@example.com",
      stars: 5,
      dateReviewed: "2026-10-27T15:00:00",
      comments: "Great food and excellent service!",
    },
    {
      id: 2,
      itemId: 2,
      reviewerEmail: "student2@example.com",
      stars: 4,
      dateReviewed: "2026-10-26T12:30:00",
      comments: "Good food, but service could be faster.",
    },
    {
      id: 3,
      itemId: 3,
      reviewerEmail: "student3@example.com",
      stars: 3,
      dateReviewed: "2026-10-25T18:45:00",
      comments: "Average experience, but worth trying.",
    },
  ],
};

export { menuItemReviewFixtures };
