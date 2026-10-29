import RecommendationRequestTable from "main/components/RecommendationRequest/RecommendationRequestTable";
import { recommendationRequestFixtures } from "fixtures/recommendationRequestFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "components/RecommendationRequest/RecommendationRequestTable",
  component: RecommendationRequestTable,
};

const Template = (args) => <RecommendationRequestTable {...args} />;

export const Empty = Template.bind({});
Empty.args = {
  recommendationRequests: [],
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsOrdinaryUser = Template.bind({});
ThreeItemsOrdinaryUser.args = {
  recommendationRequests:
    recommendationRequestFixtures.threeRecommendationRequests,
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsAdminUser = Template.bind({});
ThreeItemsAdminUser.args = {
  recommendationRequests:
    recommendationRequestFixtures.threeRecommendationRequests,
  currentUser: currentUserFixtures.adminUser,
};
ThreeItemsAdminUser.parameters = {
  msw: {
    handlers: [
      http.delete("/api/recommendationrequests", () => {
        return HttpResponse.json("RecommendationRequest deleted successfully");
      }),
    ],
  },
};
