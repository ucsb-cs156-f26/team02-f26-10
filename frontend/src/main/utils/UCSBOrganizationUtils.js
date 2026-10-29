import { toast } from "react-toastify";

export function onDeleteSuccess(response) {
  toast(response.message);
}

export function cellToAxiosParamsDelete(cell) {
  return {
    url: "/api/ucsborganizations",
    method: "DELETE",
    params: {
      orgCode: cell.row.original.orgCode,
    },
  };
}
