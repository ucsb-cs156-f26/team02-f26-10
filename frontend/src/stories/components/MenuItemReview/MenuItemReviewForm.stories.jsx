import MenuItemReviewForm from "main/components/MenuItemReview/MenuItemReviewForm";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";

export default {
  title: "components/MenuItemReview/MenuItemReviewForm",
  component: MenuItemReviewForm,
};

const Template = (args) => {
  return <MenuItemReviewForm {...args} />;
};

const submitAction = (data) => {
  window.alert("Submitted: " + JSON.stringify(data));
};

export const Create = Template.bind({});
Create.args = {
  buttonLabel: "Create",
  submitAction,
};

export const Update = Template.bind({});
Update.args = {
  initialContents: menuItemReviewFixtures.oneMenuItemReview,
  buttonLabel: "Update",
  submitAction,
};
