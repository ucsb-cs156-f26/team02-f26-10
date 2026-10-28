import OurTable, { ButtonColumn } from "main/components/OurTable";

import { useBackendMutation } from "main/utils/useBackend";
import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/helpRequestUtils";
import { useNavigate } from "react-router";
import { hasRole } from "main/utils/useCurrentUser";

export default function HelpRequestTable({
  helpRequests,
  currentUser,
  testIdPrefix = "HelpRequestTable",
}) {
  const navigate = useNavigate();

  const editCallback = (cell) => {
    navigate(`/helprequest/edit/${cell.row.original.id}`);
  };

  const deleteMutation = useBackendMutation(
    cellToAxiosParamsDelete,
    { onSuccess: onDeleteSuccess },
    ["/api/helprequests/all"],
  );

  const deleteCallback = (cell) => {
    deleteMutation.mutate(cell);
  };

  const columns = [
    { header: "ID", accessorKey: "id" },
    { header: "Requester Email", accessorKey: "requesterEmail" },
    { header: "Team ID", accessorKey: "teamId" },
    { header: "Table or Breakout Room", accessorKey: "tableOrBreakoutRoom" },
    { header: "Request Time", accessorKey: "requestTime" },
    { header: "Explanation", accessorKey: "explanation" },
    {
      header: "Solved",
      accessorKey: "solved",
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
    <OurTable data={helpRequests} columns={columns} testid={testIdPrefix} />
  );
}
