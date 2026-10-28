const helpRequestFixtures = {
  oneHelpRequest: {
    id: 1,
    requesterEmail: "student1@ucsb.edu",
    teamId: "f26-10",
    tableOrBreakoutRoom: "10",
    requestTime: "2026-10-28T15:20:00",
    explanation: "Need help configuring a Dokku deployment",
    solved: false,
  },
  threeHelpRequests: [
    {
      id: 1,
      requesterEmail: "student1@ucsb.edu",
      teamId: "f26-10",
      tableOrBreakoutRoom: "10",
      requestTime: "2026-10-28T15:20:00",
      explanation: "Need help configuring a Dokku deployment",
      solved: false,
    },
    {
      id: 2,
      requesterEmail: "student2@ucsb.edu",
      teamId: "f26-02",
      tableOrBreakoutRoom: "Breakout Room 2",
      requestTime: "2026-10-28T15:30:00",
      explanation: "Need help resolving a Git merge conflict",
      solved: true,
    },
    {
      id: 3,
      requesterEmail: "student3@ucsb.edu",
      teamId: "f26-05",
      tableOrBreakoutRoom: "5",
      requestTime: "2026-10-28T15:40:00",
      explanation: "Need help testing a React component",
      solved: false,
    },
  ],
};

export { helpRequestFixtures };
