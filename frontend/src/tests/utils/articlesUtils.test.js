import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/articlesUtils";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({ toast: vi.fn() }));

describe("articlesUtils tests", () => {
  test("builds a delete request for the selected article", () => {
    const cell = { row: { original: { id: 17 } } };
    expect(cellToAxiosParamsDelete(cell)).toEqual({
      url: "/api/Articles",
      method: "DELETE",
      params: { id: 17 },
    });
  });

  test("shows the message returned by the backend", () => {
    onDeleteSuccess({ message: "record 17 deleted" });
    expect(toast).toHaveBeenCalledWith("record 17 deleted");
  });
});
