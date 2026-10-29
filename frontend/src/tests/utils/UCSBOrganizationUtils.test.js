import { toast } from "react-toastify";
import {
  cellToAxiosParamsDelete,
  onDeleteSuccess,
} from "main/utils/UCSBOrganizationUtils";

vi.mock("react-toastify", () => ({ toast: vi.fn() }));

describe("UCSBOrganizationUtils tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates a DELETE request using the selected row's string orgCode", () => {
    const cell = {
      row: {
        original: { orgCode: "ABC /1", id: 123 },
      },
    };

    expect(cellToAxiosParamsDelete(cell)).toEqual({
      url: "/api/ucsborganizations",
      method: "DELETE",
      params: { orgCode: "ABC /1" },
    });
  });

  test("displays the message in the backend JSON response", () => {
    const message = "UCSBOrganization with id SKY deleted";
    onDeleteSuccess({ message });
    expect(toast).toHaveBeenCalledExactlyOnceWith(message);
  });
});
