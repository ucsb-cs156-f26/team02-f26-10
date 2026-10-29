import { Alert } from "react-bootstrap";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import RecommendationRequestForm from "main/components/RecommendationRequest/RecommendationRequestForm";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function RecommendationRequestEditPage({ storybook = false }) {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: recommendationRequest, isError } = useBackend(
    [`/api/recommendationrequests?id=${id}`],
    { method: "GET", url: "/api/recommendationrequests", params: { id } },
  );

  const objectToAxiosPutParams = (data) => ({
    url: "/api/recommendationrequests",
    method: "PUT",
    params: { id },
    data: {
      requesterEmail: data.requesterEmail,
      professorEmail: data.professorEmail,
      explanation: data.explanation,
      dateRequested: data.dateRequested,
      dateNeeded: data.dateNeeded,
      done: data.done,
    },
  });

  const onSuccess = (updated) => {
    queryClient.setQueryData([`/api/recommendationrequests?id=${id}`], updated);
    toast(`RecommendationRequest updated - id: ${updated.id}`);
  };

  const mutation = useBackendMutation(objectToAxiosPutParams, { onSuccess }, [
    "/api/recommendationrequests/all",
  ]);

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  if (mutation.isSuccess && !storybook) {
    return <Navigate to="/recommendationrequest" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit RecommendationRequest</h1>
        {isError && (
          <Alert variant="danger">
            Unable to load this RecommendationRequest.
          </Alert>
        )}
        {recommendationRequest && (
          <RecommendationRequestForm
            key={id}
            initialContents={recommendationRequest}
            submitAction={onSubmit}
            buttonLabel="Update"
          />
        )}
      </div>
    </BasicLayout>
  );
}
