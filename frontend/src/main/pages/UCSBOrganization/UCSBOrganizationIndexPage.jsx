import { Button } from "react-bootstrap";
import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import UCSBOrganizationTable from "main/components/UCSBOrganization/UCSBOrganizationTable";
import { useBackend } from "main/utils/useBackend";
import { useCurrentUser, hasRole } from "main/utils/useCurrentUser";

export default function UCSBOrganizationIndexPage() {
  const currentUser = useCurrentUser();

  const { data: organizations } = useBackend(
    ["/api/ucsborganizations/all"],
    {
      method: "GET",
      url: "/api/ucsborganizations/all",
    },
    [],
  );

  const createButton = () => {
    if (hasRole(currentUser, "ROLE_ADMIN")) {
      return (
        <Button
          variant="primary"
          href="/ucsborganization/create"
          style={{ float: "right" }}
        >
          Create UCSBOrganization
        </Button>
      );
    }
  };

  return (
    <BasicLayout>
      <div className="pt-2">
        {createButton()}
        <h1>UCSB Organizations</h1>
        <UCSBOrganizationTable
          organizations={organizations}
          currentUser={currentUser}
        />
      </div>
    </BasicLayout>
  );
}
