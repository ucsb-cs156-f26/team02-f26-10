import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import RecommendationRequestForm from "main/components/RecommendationRequest/RecommendationRequestForm";
import { Navigate } from "react-router";
import { useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function RecommendationRequestCreatePage({ storybook = false }) {
  const objectToAxiosParams = (request) => ({
    url: "/api/recommendationrequests/post",
    method: "POST",
    params: {
      requesterEmail: request.requesterEmail,
      professorEmail: request.professorEmail,
      explanation: request.explanation,
      dateRequested: request.dateRequested,
      dateNeeded: request.dateNeeded,
      done: request.done,
    },
  });

  const onSuccess = (request) => {
    toast(`New RecommendationRequest created - id: ${request.id}`);
  };

  const mutation = useBackendMutation(objectToAxiosParams, { onSuccess }, [
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
        <h1>Create New RecommendationRequest</h1>
        <RecommendationRequestForm submitAction={onSubmit} />
      </div>
    </BasicLayout>
  );
}
