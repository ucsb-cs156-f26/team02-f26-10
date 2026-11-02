package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.Articles;
import edu.ucsb.cs156.example.repositories.ArticlesRepository;
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
import org.springframework.test.annotation.DirtiesContext.ClassMode;
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
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class ArticleIT {
  @Autowired ArticlesRepository articlesRepository;

  @Autowired MockMvc mockMvc;

  @Autowired ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @Test
  @WithMockUser(roles = {"ADMIN", "USER"})
  public void an_admin_can_create_an_article_in_the_database() throws Exception {
    // arrange
    long countBefore = articlesRepository.count();
    Articles expected =
        Articles.builder()
            .title("UCSB Research News")
            .url("https://www.ucsb.edu/news")
            .explanation("News about research at UCSB")
            .email("gaucho@ucsb.edu")
            .dateAdded(LocalDateTime.parse("2026-10-21T12:00:00"))
            .build();

    // act
    MvcResult response =
        mockMvc
            .perform(
                post("/api/Articles/post")
                    .param("title", expected.getTitle())
                    .param("url", expected.getUrl())
                    .param("explanation", expected.getExplanation())
                    .param("email", expected.getEmail())
                    .param("dateAdded", expected.getDateAdded().toString())
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    Articles created =
        mapper.readValue(response.getResponse().getContentAsString(), Articles.class);
    try {
      // assert
      assertTrue(created.getId() > 0);
      expected.setId(created.getId());
      assertEquals(expected, created);

      // assert
      assertEquals(countBefore + 1, articlesRepository.count());
      Articles saved = articlesRepository.findById(created.getId()).orElseThrow();
      assertEquals(expected, saved);
    } finally {
      articlesRepository.deleteById(created.getId());
    }
  }
}
