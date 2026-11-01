package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.UCSBOrganization;
import edu.ucsb.cs156.example.repositories.UCSBOrganizationRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.testconfig.TestConfig;
import java.util.UUID;
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
public class UCSBOrganizationIT {

  @Autowired UCSBOrganizationRepository ucsbOrganizationRepository;

  @Autowired MockMvc mockMvc;

  @Autowired ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @Test
  @WithMockUser(roles = {"ADMIN", "USER"})
  public void an_admin_can_create_an_organization_in_the_database() throws Exception {

    // Arrange: use a unique code so repeated test runs do not conflict.
    String orgCode = "IT-" + UUID.randomUUID();

    UCSBOrganization expected =
        UCSBOrganization.builder()
            .orgCode(orgCode)
            .orgTranslationShort("TEST CLUB")
            .orgTranslation("TEST CLUB AT UCSB")
            .inactive(false)
            .build();

    assertFalse(ucsbOrganizationRepository.existsById(orgCode));

    try {
      // Act: create the organization through the controller.
      MvcResult response =
          mockMvc
              .perform(
                  post("/api/ucsborganizations/post")
                      .param("orgCode", orgCode)
                      .param("orgTranslationShort", "TEST CLUB")
                      .param("orgTranslation", "TEST CLUB AT UCSB")
                      .param("inactive", "false")
                      .with(csrf()))
              .andExpect(status().isOk())
              .andReturn();

      // Assert: the response contains the expected organization.
      assertEquals(
          mapper.readTree(mapper.writeValueAsString(expected)),
          mapper.readTree(response.getResponse().getContentAsString()));

      // Assert: the record was actually saved in the real test database.
      UCSBOrganization saved = ucsbOrganizationRepository.findById(orgCode).orElseThrow();

      assertEquals(expected, saved);
    } finally {
      // Clean up the record created by this test.
      ucsbOrganizationRepository.deleteById(orgCode);
    }
  }
}
