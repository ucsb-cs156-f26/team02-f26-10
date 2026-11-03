package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
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
public class ArticleWebIT extends WebTestCase {
  @Test
  public void admin_user_can_create_an_article() throws Exception {
    // Arrange
    setupUser(true);
    page.getByRole(AriaRole.LINK, new Page.GetByRoleOptions().setName("Articles").setExact(true))
        .click();
    page.getByRole(
            AriaRole.BUTTON, new Page.GetByRoleOptions().setName("Create Article").setExact(true))
        .click();
    assertThat(page.getByRole(AriaRole.HEADING)).hasText("Create New Article");

    // Act
    page.getByTestId("ArticlesForm-title").fill("UCSB Research News");
    page.getByTestId("ArticlesForm-url").fill("https://www.ucsb.edu/news");
    page.getByTestId("ArticlesForm-explanation").fill("News about research at UCSB");
    page.getByTestId("ArticlesForm-email").fill("gaucho@ucsb.edu");
    page.getByTestId("ArticlesForm-dateAdded").fill("2026-10-21T12:00");
    page.getByTestId("ArticlesForm-submit").click();

    // Assert
    assertThat(page.getByRole(AriaRole.HEADING)).hasText("Articles");
    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-title"))
        .hasText("UCSB Research News");

    page.reload();
    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-title"))
        .hasText("UCSB Research News");
    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-url"))
        .hasText("https://www.ucsb.edu/news");
    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-explanation"))
        .hasText("News about research at UCSB");
    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-email")).hasText("gaucho@ucsb.edu");
    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-dateAdded"))
        .hasText("2026-10-21T12:00:00");
  }
}
