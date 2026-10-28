import HelpRequestForm from "main/components/HelpRequest/HelpRequestForm";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";

export default {
  title: "components/HelpRequest/HelpRequestForm",
  component: HelpRequestForm,
};

const Template = (args) => <HelpRequestForm {...args} />;

const submitAction = (data) => {
  console.log("Submit was clicked with data: ", data);
  window.alert("Submit was clicked with data: " + JSON.stringify(data));
};

export const Create = Template.bind({});
Create.args = { submitAction };

export const Update = Template.bind({});
Update.args = {
  initialContents: helpRequestFixtures.oneHelpRequest,
  buttonLabel: "Update",
  submitAction,
};
