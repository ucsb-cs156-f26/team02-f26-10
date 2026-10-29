import { Button } from "react-bootstrap";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import RecommendationRequestTable from "main/components/RecommendationRequest/RecommendationRequestTable";
import { useBackend } from "main/utils/useBackend";
import { hasRole, useCurrentUser } from "main/utils/useCurrentUser";

export default function RecommendationRequestIndexPage() {
  const currentUser = useCurrentUser();
  const { data: recommendationRequests } = useBackend(
    ["/api/recommendationrequests/all"],
    { method: "GET", url: "/api/recommendationrequests/all" },
    [],
  );

  return (
    <BasicLayout>
      <div className="pt-2">
        {hasRole(currentUser, "ROLE_ADMIN") && (
          <Button
            variant="primary"
            href="/recommendationrequest/create"
            style={{ float: "right" }}
          >
            Create RecommendationRequest
          </Button>
        )}
        <h1>RecommendationRequests</h1>
        <div className="table-responsive">
          <RecommendationRequestTable
            recommendationRequests={recommendationRequests}
            currentUser={currentUser}
          />
        </div>
      </div>
    </BasicLayout>
  );
}
