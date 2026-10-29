import { Alert } from "react-bootstrap";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import HelpRequestForm from "main/components/HelpRequest/HelpRequestForm";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function HelpRequestEditPage({ storybook = false }) {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: helpRequest, isError } = useBackend(
    [`/api/helprequests?id=${id}`],
    { method: "GET", url: "/api/helprequests", params: { id } },
  );

  const objectToAxiosPutParams = (data) => ({
    url: "/api/helprequests",
    method: "PUT",
    params: { id },
    data: {
      requesterEmail: data.requesterEmail,
      teamId: data.teamId,
      tableOrBreakoutRoom: data.tableOrBreakoutRoom,
      requestTime: data.requestTime,
      explanation: data.explanation,
      solved: data.solved,
    },
  });

  const onSuccess = (updatedHelpRequest) => {
    queryClient.setQueryData(
      [`/api/helprequests?id=${id}`],
      updatedHelpRequest,
    );
    toast(`HelpRequest updated - id: ${updatedHelpRequest.id}`);
  };

  const mutation = useBackendMutation(objectToAxiosPutParams, { onSuccess }, [
    "/api/helprequests/all",
  ]);

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (mutation.isSuccess && !storybook) {
    return <Navigate to="/helprequest" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit HelpRequest</h1>
        {isError && (
          <Alert variant="danger">Unable to load this HelpRequest.</Alert>
        )}
        {helpRequest && (
          <HelpRequestForm
            key={id}
            initialContents={helpRequest}
            submitAction={onSubmit}
            buttonLabel="Update"
          />
        )}
      </div>
    </BasicLayout>
  );
}
