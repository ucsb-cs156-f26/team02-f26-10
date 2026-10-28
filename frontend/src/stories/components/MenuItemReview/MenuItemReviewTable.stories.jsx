import MenuItemReviewTable from "main/components/MenuItemReview/MenuItemReviewTable";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

export default {
  title: "components/MenuItemReview/MenuItemReviewTable",
  component: MenuItemReviewTable,
};

const Template = (args) => <MenuItemReviewTable {...args} />;

export const Empty = Template.bind({});
Empty.args = {
  reviews: [],
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsOrdinaryUser = Template.bind({});
ThreeItemsOrdinaryUser.args = {
  reviews: menuItemReviewFixtures.threeMenuItemReviews,
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsAdminUser = Template.bind({});
ThreeItemsAdminUser.args = {
  reviews: menuItemReviewFixtures.threeMenuItemReviews,
  currentUser: currentUserFixtures.adminUser,
  editCallback: (cell) => {
    window.alert(`Edit review ${cell.row.original.id}`);
  },
  deleteCallback: (cell) => {
    window.alert(`Delete review ${cell.row.original.id}`);
  },
};
