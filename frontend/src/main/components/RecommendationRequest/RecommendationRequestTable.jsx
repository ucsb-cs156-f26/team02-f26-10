import OurTable, { ButtonColumn } from "main/components/OurTable";

import { useBackendMutation } from "main/utils/useBackend";
import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/recommendationRequestUtils";
import { useNavigate } from "react-router";
import { hasRole } from "main/utils/useCurrentUser";

export default function RecommendationRequestTable({
  recommendationRequests,
  currentUser,
  testIdPrefix = "RecommendationRequestTable",
}) {
  const navigate = useNavigate();

  const editCallback = (cell) => {
    navigate(`/recommendationrequest/edit/${cell.row.original.id}`);
  };

  const deleteMutation = useBackendMutation(
    cellToAxiosParamsDelete,
    { onSuccess: onDeleteSuccess },
    ["/api/recommendationrequests/all"],
  );

  const deleteCallback = (cell) => {
    deleteMutation.mutate(cell);
  };

  const columns = [
    { header: "ID", accessorKey: "id" },
    { header: "Requester Email", accessorKey: "requesterEmail" },
    { header: "Professor Email", accessorKey: "professorEmail" },
    { header: "Explanation", accessorKey: "explanation" },
    { header: "Date Requested", accessorKey: "dateRequested" },
    { header: "Date Needed", accessorKey: "dateNeeded" },
    {
      header: "Done",
      accessorKey: "done",
      cell: ({ getValue }) => (getValue() ? "Yes" : "No"),
    },
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(ButtonColumn("Edit", "primary", editCallback, testIdPrefix));
    columns.push(
      ButtonColumn("Delete", "danger", deleteCallback, testIdPrefix),
    );
  }

  return (
    <OurTable
      data={recommendationRequests}
      columns={columns}
      testid={testIdPrefix}
    />
  );
}
