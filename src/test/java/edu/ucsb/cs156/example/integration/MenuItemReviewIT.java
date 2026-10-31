package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.MenuItemReview;
import edu.ucsb.cs156.example.repositories.MenuItemReviewRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.testconfig.TestConfig;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("integration")
@Import(TestConfig.class)
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class MenuItemReviewIT {

  @Autowired MenuItemReviewRepository menuItemReviewRepository;

  @Autowired MockMvc mockMvc;

  @Autowired ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void admin_can_post_a_new_menu_item_review() throws Exception {

    long countBefore = menuItemReviewRepository.count();

    MvcResult response =
        mockMvc
            .perform(
                post("/api/MenuItemReview/post")
                    .param("itemId", "1")
                    .param("reviewerEmail", "test@ucsb.edu")
                    .param("stars", "5")
                    .param("dateReviewed", "2026-10-29T12:00:00")
                    .param("comments", "Great food")
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    MenuItemReview created =
        mapper.readValue(response.getResponse().getContentAsString(), MenuItemReview.class);

    assertTrue(created.getId() > 0);

    MenuItemReview saved = menuItemReviewRepository.findById(created.getId()).orElseThrow();

    assertEquals(1L, saved.getItemId());
    assertEquals("test@ucsb.edu", saved.getReviewerEmail());
    assertEquals(5, saved.getStars());
    assertEquals(LocalDateTime.parse("2026-10-29T12:00:00"), saved.getDateReviewed());
    assertEquals("Great food", saved.getComments());
    assertEquals(countBefore + 1, menuItemReviewRepository.count());
  }
}
