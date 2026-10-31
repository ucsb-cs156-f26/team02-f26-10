package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import edu.ucsb.cs156.example.WebTestCase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("integration")
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class MenuItemReviewWebIT extends WebTestCase {

  @Test
  public void admin_can_create_menu_item_review() throws Exception {
    setupUser(true);

    page.getByText("MenuItemReview").click();
    page.getByText("Create MenuItemReview").click();

    assertThat(page.getByText("Create New MenuItemReview")).isVisible();

    page.getByTestId("MenuItemReviewForm-itemId").fill("1");
    page.getByTestId("MenuItemReviewForm-reviewerEmail").fill("test@ucsb.edu");
    page.getByTestId("MenuItemReviewForm-stars").fill("5");
    page.getByTestId("MenuItemReviewForm-dateReviewed").fill("2026-10-29T12:00");
    page.getByTestId("MenuItemReviewForm-comments").fill("E2E review created by Playwright");

    page.getByTestId("MenuItemReviewForm-submit").click();

    assertThat(page.getByText("MenuItemReviews")).isVisible();
    assertThat(page.getByText("E2E review created by Playwright")).isVisible();
  }
}
