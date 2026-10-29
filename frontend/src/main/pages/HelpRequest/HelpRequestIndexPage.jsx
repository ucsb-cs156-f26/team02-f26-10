import { Button } from "react-bootstrap";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import HelpRequestTable from "main/components/HelpRequest/HelpRequestTable";
import { useBackend } from "main/utils/useBackend";
import { hasRole, useCurrentUser } from "main/utils/useCurrentUser";

export default function HelpRequestIndexPage() {
  const currentUser = useCurrentUser();
  const { data: helpRequests } = useBackend(
    ["/api/helprequests/all"],
    { method: "GET", url: "/api/helprequests/all" },
    [],
  );

  return (
    <BasicLayout>
      <div className="pt-2">
        {hasRole(currentUser, "ROLE_ADMIN") && (
          <Button
            variant="primary"
            href="/helprequest/create"
            style={{ float: "right" }}
          >
            Create HelpRequest
          </Button>
        )}
        <h1>HelpRequests</h1>
        <div className="table-responsive">
          <HelpRequestTable
            helpRequests={helpRequests}
            currentUser={currentUser}
          />
        </div>
      </div>
    </BasicLayout>
  );
}
