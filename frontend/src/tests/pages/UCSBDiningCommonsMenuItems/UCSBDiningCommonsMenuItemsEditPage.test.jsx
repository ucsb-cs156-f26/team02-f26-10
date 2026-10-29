import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import UCSBDiningCommonsMenuItemsEditPage from "main/pages/UCSBDiningCommonsMenuItems/UCSBDiningCommonsMenuItemsEditPage";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import mockConsole from "tests/testutils/mockConsole";

const mockToast = vi.fn();
vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    toast: vi.fn((x) => mockToast(x)),
  };
});

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    useParams: vi.fn(() => ({
      id: 17,
    })),
    Navigate: vi.fn((x) => {
      mockNavigate(x);
      return null;
    }),
  };
});

let axiosMock;
describe("UCSBDiningCommonsMenuItemsEditPage tests", () => {
  describe("when the backend doesn't return data", () => {
    beforeEach(() => {
      axiosMock = new AxiosMockAdapter(axios);
      axiosMock.reset();
      axiosMock.resetHistory();
      axiosMock
        .onGet("/api/currentUser")
        .reply(200, apiCurrentUserFixtures.userOnly);
      axiosMock
        .onGet("/api/systemInfo")
        .reply(200, systemInfoFixtures.showingNeither);
      axiosMock
        .onGet("/api/ucsbdiningcommonsmenuitems", { params: { id: 17 } })
        .timeout();
    });

    afterEach(() => {
      mockToast.mockClear();
      mockNavigate.mockClear();
      axiosMock.restore();
      axiosMock.resetHistory();
    });

    const queryClient = new QueryClient();
    test("renders header but table is not present", async () => {
      const restoreConsole = mockConsole();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UCSBDiningCommonsMenuItemsEditPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      await screen.findByText("Edit UCSB Dining Commons Menu Item");
      expect(
        screen.queryByTestId("UCSBDiningCommonsMenuItemForm-name"),
      ).not.toBeInTheDocument();
      restoreConsole();
    });
  });

  describe("tests where backend is working normally", () => {
    beforeEach(() => {
      axiosMock = new AxiosMockAdapter(axios);
      axiosMock.reset();
      axiosMock.resetHistory();
      axiosMock
        .onGet("/api/currentUser")
        .reply(200, apiCurrentUserFixtures.userOnly);
      axiosMock
        .onGet("/api/systemInfo")
        .reply(200, systemInfoFixtures.showingNeither);
      axiosMock
        .onGet("/api/ucsbdiningcommonsmenuitems", { params: { id: 17 } })
        .reply(200, {
          id: 17,
          diningCommonsCode: "ortega",
          name: "Tofu Banh Mi Sandwich (v)",
          station: "Entree Specials",
        });
      axiosMock.onPut("/api/ucsbdiningcommonsmenuitems").reply(200, {
        id: "17",
        diningCommonsCode: "ortega",
        name: "Chicken Caesar Salad",
        station: "Entrees",
      });
    });

    afterEach(() => {
      mockToast.mockClear();
      mockNavigate.mockClear();
      axiosMock.restore();
      axiosMock.resetHistory();
    });

    const queryClient = new QueryClient();

    test("Is populated with the data provided", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UCSBDiningCommonsMenuItemsEditPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByTestId("UCSBDiningCommonsMenuItemForm-id");

      const idField = screen.getByTestId("UCSBDiningCommonsMenuItemForm-id");
      const diningCommonsCodeField = screen.getByLabelText(
        "Dining Commons Code",
      );
      const nameField = screen.getByLabelText("Name");
      const stationField = screen.getByLabelText("Station");
      const submitButton = screen.getByRole("button", { name: "Update" });

      expect(idField).toBeInTheDocument();
      expect(idField).toHaveValue("17");
      expect(diningCommonsCodeField).toBeInTheDocument();
      expect(diningCommonsCodeField).toHaveValue("ortega");
      expect(nameField).toBeInTheDocument();
      expect(nameField).toHaveValue("Tofu Banh Mi Sandwich (v)");
      expect(stationField).toBeInTheDocument();
      expect(stationField).toHaveValue("Entree Specials");

      expect(submitButton).toHaveTextContent("Update");

      fireEvent.change(diningCommonsCodeField, {
        target: { value: "ortega" },
      });
      fireEvent.change(nameField, {
        target: { value: "Chicken Caesar Salad" },
      });
      fireEvent.change(stationField, {
        target: { value: "Entrees" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => expect(mockToast).toBeCalled());
      expect(mockToast).toBeCalledWith(
        "UCSB Dining Commons Menu Item Updated - id: 17 name: Chicken Caesar Salad",
      );

      expect(mockNavigate).toBeCalledWith({ to: "/diningcommonsmenuitem" });

      expect(axiosMock.history.put.length).toBe(1); // times called
      expect(axiosMock.history.put[0].params).toEqual({ id: 17 });
      expect(axiosMock.history.put[0].data).toBe(
        JSON.stringify({
          diningCommonsCode: "ortega",
          name: "Chicken Caesar Salad",
          station: "Entrees",
        }),
      ); // posted object
    });

    test("Changes when you click Update", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UCSBDiningCommonsMenuItemsEditPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByTestId("UCSBDiningCommonsMenuItemForm-id");

      const idField = screen.getByTestId("UCSBDiningCommonsMenuItemForm-id");
      const diningCommonsCodeField = screen.getByLabelText(
        "Dining Commons Code",
      );
      const nameField = screen.getByLabelText("Name");
      const stationField = screen.getByLabelText("Station");
      const submitButton = screen.getByRole("button", { name: "Update" });

      expect(idField).toHaveValue("17");
      expect(diningCommonsCodeField).toHaveValue("ortega");
      expect(nameField).toHaveValue("Tofu Banh Mi Sandwich (v)");
      expect(stationField).toHaveValue("Entree Specials");
      expect(submitButton).toBeInTheDocument();

      fireEvent.change(diningCommonsCodeField, {
        target: { value: "ortega" },
      });
      fireEvent.change(nameField, {
        target: { value: "Chicken Caesar Salad" },
      });
      fireEvent.change(stationField, { target: { value: "Entrees" } });

      fireEvent.click(submitButton);

      await waitFor(() => expect(mockToast).toBeCalled());
      expect(mockToast).toBeCalledWith(
        "UCSB Dining Commons Menu Item Updated - id: 17 name: Chicken Caesar Salad",
      );
      expect(mockNavigate).toBeCalledWith({ to: "/diningcommonsmenuitem" });
    });
  });
});
