import OurTable, { ButtonColumn } from "main/components/OurTable";
import { useNavigate } from "react-router";
import { useBackendMutation } from "main/utils/useBackend";
import { hasRole } from "main/utils/useCurrentUser";
import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/UCSBOrganizationUtils";

export default function UCSBOrganizationTable({ organizations, currentUser }) {
  const navigate = useNavigate();
  const testIdPrefix = "UCSBOrganizationTable";

  const editCallback = (cell) => {
    navigate(
      `/ucsborganization/edit/${encodeURIComponent(cell.row.original.orgCode)}`,
    );
  };

  const deleteMutation = useBackendMutation(
    cellToAxiosParamsDelete,
    { onSuccess: onDeleteSuccess },
    ["/api/ucsborganizations/all"],
  );

  const deleteCallback = (cell) => {
    deleteMutation.mutate(cell);
  };

  const columns = [
    {
      header: "Organization Code",
      accessorKey: "orgCode",
    },
    {
      header: "Short Name",
      accessorKey: "orgTranslationShort",
    },
    {
      header: "Full Name",
      accessorKey: "orgTranslation",
    },
    {
      header: "Inactive",
      accessorKey: "inactive",
      cell: (info) => String(info.getValue()),
    },
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(ButtonColumn("Edit", "primary", editCallback, testIdPrefix));
    columns.push(
      ButtonColumn("Delete", "danger", deleteCallback, testIdPrefix),
    );
  }

  return (
    <OurTable data={organizations} columns={columns} testid={testIdPrefix} />
  );
}
