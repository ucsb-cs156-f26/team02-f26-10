import { toast } from "react-toastify";

export function onDeleteSuccess(response) {
  toast(response.message);
}

export function cellToAxiosParamsDelete(cell) {
  return {
    url: "/api/Articles",
    method: "DELETE",
    params: {
      id: cell.row.original.id,
    },
  };
}
