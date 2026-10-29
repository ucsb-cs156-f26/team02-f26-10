import HelpRequestTable from "main/components/HelpRequest/HelpRequestTable";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "components/HelpRequest/HelpRequestTable",
  component: HelpRequestTable,
};

const Template = (args) => <HelpRequestTable {...args} />;

export const Empty = Template.bind({});
Empty.args = {
  helpRequests: [],
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsOrdinaryUser = Template.bind({});
ThreeItemsOrdinaryUser.args = {
  helpRequests: helpRequestFixtures.threeHelpRequests,
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsAdminUser = Template.bind({});
ThreeItemsAdminUser.args = {
  helpRequests: helpRequestFixtures.threeHelpRequests,
  currentUser: currentUserFixtures.adminUser,
};
ThreeItemsAdminUser.parameters = {
  msw: {
    handlers: [
      http.delete("/api/helprequests", () => {
        return HttpResponse.json("HelpRequest deleted successfully");
      }),
    ],
  },
};
