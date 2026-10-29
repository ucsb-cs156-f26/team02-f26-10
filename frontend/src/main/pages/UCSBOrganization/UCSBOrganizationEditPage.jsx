import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import UCSBOrganizationForm from "main/components/UCSBOrganization/UCSBOrganizationForm";
import { Navigate, useParams } from "react-router";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function UCSBOrganizationEditPage({ storybook = false }) {
  const { id } = useParams();

  const { data: organization } = useBackend(
    [`/api/ucsborganizations?orgCode=${id}`],
    {
      // Stryker disable next-line all: GET is the default HTTP method.
      method: "GET",
      url: "/api/ucsborganizations",
      params: {
        orgCode: id,
      },
    },
  );

  const objectToAxiosPutParams = (data) => ({
    url: "/api/ucsborganizations",
    method: "PUT",
    params: {
      orgCode: id,
    },
    data: {
      orgTranslationShort: data.orgTranslationShort,
      orgTranslation: data.orgTranslation,
      inactive: data.inactive,
    },
  });

  const onSuccess = (updatedOrganization) => {
    toast(`UCSBOrganization Updated - orgCode: ${updatedOrganization.orgCode}`);
  };

  const mutation = useBackendMutation(objectToAxiosPutParams, { onSuccess }, [
    `/api/ucsborganizations?orgCode=${id}`,
  ]);

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (mutation.isSuccess && !storybook) {
    return <Navigate to="/ucsborganization" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit UCSBOrganization</h1>
        {organization && (
          <UCSBOrganizationForm
            initialContents={organization}
            submitAction={onSubmit}
            buttonLabel="Update"
          />
        )}
      </div>
    </BasicLayout>
  );
}
