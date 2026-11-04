package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import edu.ucsb.cs156.example.WebTestCase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("integration")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class UCSBDiningCommonsMenuItemWebIT extends WebTestCase {
  @Test
  public void admin_user_can_create_edit_delete_UCSBDiningCommonsMenuItem() throws Exception {
    setupUser(true);

    page.getByText("UCSB Dining Commons Menu Item").click();

    page.getByText("Create UCSB Dining Commons Menu Item").click();
    assertThat(page.getByText("Create New UCSB Dining Commons Menu Item")).isVisible();
    page.getByTestId("UCSBDiningCommonsMenuItemForm-diningCommonsCode").fill("ortega");
    page.getByTestId("UCSBDiningCommonsMenuItemForm-name").fill("Tofu Banh Mi Sandwich (v)");
    page.getByTestId("UCSBDiningCommonsMenuItemForm-station").fill("Entree Specials");
    page.getByTestId("UCSBDiningCommonsMenuItemForm-submit").click();

    assertThat(page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-name"))
        .hasText("Tofu Banh Mi Sandwich (v)");

    page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-Edit-button").click();
    assertThat(page.getByText("Edit UCSB Dining Commons Menu Item")).isVisible();
    page.getByTestId("UCSBDiningCommonsMenuItemForm-diningCommonsCode").fill("ortega");
    page.getByTestId("UCSBDiningCommonsMenuItemForm-name").fill("Baked Pesto Pasta with Chicken");
    page.getByTestId("UCSBDiningCommonsMenuItemForm-station").fill("Entree Specials");
    page.getByTestId("UCSBDiningCommonsMenuItemForm-submit").click();

    assertThat(page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-name"))
        .hasText("Baked Pesto Pasta with Chicken");

    page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-Delete-button").click();

    assertThat(page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-name"))
        .not()
        .isVisible();
  }

  @Test
  public void regular_user_cannot_create_item() throws Exception {
    setupUser(false);

    page.getByText("UCSB Dining Commons Menu Item").click();

    assertThat(page.getByText("Create UCSB Dining Commons Menu Item")).not().isVisible();
    assertThat(page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-name"))
        .not()
        .isVisible();
  }
}
