import React from "react";
import OurTable, { ButtonColumn } from "main/components/OurTable";

import { useBackendMutation } from "main/utils/useBackend";
import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/UCSBDiningCommonsMenuItemUtils";
import { useNavigate } from "react-router";
import { hasRole } from "main/utils/useCurrentUser";

export default function UCSBDiningCommonsMenuItemTable({
  items,
  currentUser,
  testIdPrefix = "UCSBDiningCommonsMenuItemTable",
}) {
  const navigate = useNavigate();

  const editCallback = (cell) => {
    navigate(`/ucsbdiningcommonsmenuitem/edit/${cell.row.original.id}`);
  };

  // Stryker disable all : hard to test for query caching

  const deleteMutation = useBackendMutation(
    cellToAxiosParamsDelete,
    { onSuccess: onDeleteSuccess },
    ["/api/ucsbdiningcommonsmenuitems/all"],
  );
  // Stryker restore all

  // Stryker disable next-line all : TODO try to make a good test for this
  const deleteCallback = async (cell) => {
    deleteMutation.mutate(cell);
  };

  const columns = [
    {
      header: "id",
      accessorKey: "id", // accessor is the "key" in the data
    },

    {
      header: "Dining Commons Code",
      accessorKey: "diningCommonsCode",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Station",
      accessorKey: "station",
    },
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(ButtonColumn("Edit", "primary", editCallback, testIdPrefix));
    columns.push(
      ButtonColumn("Delete", "danger", deleteCallback, testIdPrefix),
    );
  }

  return <OurTable data={items} columns={columns} testid={testIdPrefix} />;
}
