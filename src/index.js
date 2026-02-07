// Import styles
import "./styles/main.scss";

/**
 * Threatened Species Factsheet
 * Main entry point for the threatened species factsheet component
 */
class ThreatenedSpeciesFactsheet {
  constructor(options = {}) {
    this.element = options.element || null;
    this.data = options.data || null;
    this.allowHtml = options.allowHtml || false;

    // Use local JSON file for localhost, API for production
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    this.apiUrl = isLocalhost
      ? "/get-threatened-plant-species.json"
      : "https://nt.gov.au/environment/dev/threatened-species-folder/configuration/api/get-data-from-flora-and-fauna-atlas-database";

    if (this.element) {
      this.init();
    }
  }

  /**
   * Get species name from URL query string
   * @returns {string|null} Species scientific name or null if not found
   */
  getSpeciesFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const species = params.get("species");
    return species ? decodeURIComponent(species.replace(/\+/g, " ")) : null;
  }

  /**
   * Fetch species data from API
   * @param {string|null} scientificName - Scientific name to search for, or null for first species
   * @returns {Promise<Object|null>} Species data object or null if not found
   */
  async fetchSpeciesData(scientificName = null) {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid API response");
      }

      // If no scientific name provided, return first species
      if (!scientificName) {
        return data[0];
      }

      // Case-insensitive search for species
      const speciesLower = scientificName.toLowerCase();
      const foundSpecies = data.find(
        (species) =>
          species.scientific_name &&
          species.scientific_name.toLowerCase() === speciesLower,
      );

      return foundSpecies || null;
    } catch (error) {
      console.error("Error fetching species data:", error);
      throw error;
    }
  }

  /**
   * Fetch all species for navigation
   * @returns {Promise<Array>} Array of all species
   */
  async fetchAllSpecies() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid API response");
      }

      return data;
    } catch (error) {
      console.error("Error fetching species list:", error);
      throw error;
    }
  }

  /**
   * Populate sidebar with media (images, maps, and credits)
   * @param {Object|null} speciesData - Current species data object
   */
  populateSidebarNavigation(speciesData = null) {
    const sidebar = document.querySelector(".col-md-4.my-4.d-print-none");
    if (!sidebar) {
      console.warn("Sidebar element not found");
      return;
    }

    // Clear existing content
    sidebar.innerHTML = "";

    if (!speciesData) {
      return;
    }

    this.renderSidebarMedia(speciesData, sidebar);
  }

  /**
   * Render sidebar media content
   * @param {Object} speciesData - Species data object
   * @param {HTMLElement} container - Container element for sidebar
   */
  renderSidebarMedia(speciesData, container) {
    const mediaHTML = `
      <div class="factsheet-sidebar-media">
        ${this.renderSidebarImage(speciesData)}
        ${this.renderSidebarMap(speciesData)}
        ${this.renderSidebarRelatedInfo(speciesData)}
      </div>
    `;

    container.innerHTML = mediaHTML;
  }

  /**
   * Render sidebar species image
   * @param {Object} data - Species data object
   * @returns {string} HTML for species image
   */
  renderSidebarImage(data) {
    if (!data.scientific_name) {
      return "";
    }

    const altText = this.escapeHtml(data.common_name || data.scientific_name);
    const imageFilename = data.scientific_name.replace(/\s+/g, "-");
    const imagePath = `https://nt.gov.au/_media/docs/environment/threatened-species/images/${imageFilename}.webp`;

    // Build figcaption with optional photo credit
    let figcaptionText = "";
    if (data.common_name) {
      figcaptionText = this.escapeHtml(data.common_name);
    }

    if (data.image_credit) {
      const creditText = data.image_credit.replace(/<[^>]*>/g, "").trim();
      const escapedCredit = this.escapeHtml(creditText);
      const separator = figcaptionText ? ". " : "";
      figcaptionText += `${separator}Photo credit: ${escapedCredit}`;
    }

    return `
      <figure class="sidebar-image mb-4">
        <div class="sidebar-image-container">
          <img src="${imagePath}" 
               alt="${altText}" 
               loading="lazy"
               onerror="this.parentElement.parentElement.style.display='none'" />
        </div>
        ${figcaptionText ? `<figcaption>${figcaptionText}</figcaption>` : ""}
      </figure>
    `;
  }

  /**
   * Render sidebar distribution map
   * @param {Object} data - Species data object
   * @returns {string} HTML for distribution map
   */
  renderSidebarMap(data) {
    if (!data.map_image_name || !data.scientific_name) {
      return "";
    }

    const imageFilename = data.scientific_name.replace(/\s+/g, "-");
    const mapPath = `https://nt.gov.au/_media/docs/environment/threatened-species/maps/${imageFilename}.webp`;
    const altText = `Distribution map for ${this.escapeHtml(data.common_name || data.scientific_name)}`;

    // Use common name if available, otherwise italicized scientific name
    const speciesName = data.common_name
      ? this.escapeHtml(data.common_name)
      : `<em>${this.escapeHtml(data.scientific_name)}</em>`;

    return `
      <figure class="sidebar-map mb-4">
        <img src="${mapPath}" 
             alt="${altText}" 
             class="img-fluid" 
             loading="lazy"
             onerror="this.parentElement.style.display='none'" />
        <figcaption>Known locations of ${speciesName} in the NT (<a href="http://nrmaps.nt.gov.au" target="_blank" rel="noopener noreferrer">nrmaps.nt.gov.au</a>)</figcaption>
      </figure>
    `;
  }

  /**
   * Render sidebar related information
   * @param {Object} data - Species data object
   * @returns {string} HTML for related information
   */
  renderSidebarRelatedInfo(data) {
    if (!data.related_information) {
      return "";
    }

    const relatedContent = this.renderContent(
      data.related_information,
      this.allowHtml,
    );

    // Replace <strong> tags with <h3> for proper semantic heading structure (WCAG)
    const processedContent = relatedContent.replace(
      /<strong>(.*?)<\/strong>/gi,
      '<h3 class="sidebar-subheading">$1</h3>',
    );

    return `
      <div class="sidebar-related-info mb-4">
        <h2 class="sidebar-heading">Related information</h2>
        <div class="sidebar-content">
          ${processedContent}
        </div>
      </div>
    `;
  }

  /**
   * Update page metadata with display name
   * @param {string} displayName - Display name of the species
   * @param {boolean} isScientificName - Whether the display name is scientific
   * @param {string|null} scientificName - Scientific name to show as subtitle (if H1 is common name)
   */
  updatePageMetadata(
    displayName,
    isScientificName = false,
    scientificName = null,
  ) {
    if (!displayName) return;

    const escapedName = this.escapeHtml(displayName);
    const formattedName = isScientificName
      ? `<em>${escapedName}</em>`
      : escapedName;

    // Update document title
    document.title = `${escapedName} - Factsheet | NT.GOV.AU`;

    // Update h1 heading
    const h1 = document.querySelector("h1");
    if (h1) {
      h1.innerHTML = formattedName;

      // Add scientific name subtitle if H1 shows common name
      let subtitle = h1.nextElementSibling;
      if (subtitle && subtitle.classList.contains("factsheet-subtitle")) {
        subtitle.remove();
      }

      if (!isScientificName && scientificName) {
        subtitle = document.createElement("p");
        subtitle.className = "factsheet-subtitle";
        subtitle.innerHTML = `<em>${this.escapeHtml(scientificName)}</em>`;
        h1.parentNode.insertBefore(subtitle, h1.nextSibling);
      }
    }

    // Update breadcrumb active item
    const breadcrumbActive = document.querySelector(".breadcrumb-item.active");
    if (breadcrumbActive) {
      breadcrumbActive.innerHTML = formattedName;
    }
  }

  init() {
    if (!this.element) {
      console.error("ThreatenedSpeciesFactsheet: No element provided");
      return;
    }

    this.render();
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Safely render content - escapes HTML by default unless allowHtml is true
   * @param {string} content - Content to render
   * @param {boolean} allowHtml - Whether to allow HTML in content
   * @returns {string} Safe content
   */
  renderContent(content, allowHtml = false) {
    if (!allowHtml) {
      return this.escapeHtml(content);
    }
    // If allowHtml is true, content should be pre-sanitized by the caller
    // Remove empty paragraphs like <p><br></p> or <p></p>
    return content
      .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, "")
      .replace(/<p>\s*<\/p>/gi, "");
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (!this.element) return;
    this.element.innerHTML = `
      <div class="factsheet-loading">
        <div class="loading-spinner"></div>
        <p>Loading species information...</p>
      </div>
    `;
  }

  /**
   * Show error state
   * @param {string} message - Error message to display
   */
  showError(message = "An error occurred while loading species data") {
    if (!this.element) return;
    this.element.innerHTML = `
      <div class="factsheet-error">
        <h3>Error</h3>
        <p>${this.escapeHtml(message)}</p>
        <p>Please try again later.</p>
      </div>
    `;
  }

  /**
   * Show not found state
   * @param {string} scientificName - The species name that was not found
   */
  showNotFound(scientificName) {
    if (!this.element) return;
    this.element.innerHTML = `
      <div class="factsheet-not-found">
        <h3>Species Not Found</h3>
        <p>The species "${this.escapeHtml(
          scientificName,
        )}" was not found in the database.</p>
        <p>Please check the species name and try again.</p>
      </div>
    `;
  }

  render() {
    // Placeholder render method
    this.element.classList.add("threatened-species-factsheet");

    if (this.data) {
      this.element.innerHTML = this.generateFactsheetHTML(this.data);
      // Initialize accordion toggle functionality
      this.initAccordionToggles();
    }
  }

  initAccordionToggles() {
    // Find all accordion containers
    const accordions = document.querySelectorAll(".ntg-accordion");

    accordions.forEach((accordion) => {
      const buttons = accordion.querySelectorAll(".accordion-button");

      buttons.forEach((button, index) => {
        // Click/Space/Enter toggle
        button.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleAccordionItem(button);
        });

        // Keyboard navigation
        button.addEventListener("keydown", (e) => {
          const key = e.key;
          let handled = false;

          switch (key) {
            case "ArrowDown":
            case "ArrowRight":
              e.preventDefault();
              this.focusNextAccordionButton(buttons, index);
              handled = true;
              break;
            case "ArrowUp":
            case "ArrowLeft":
              e.preventDefault();
              this.focusPreviousAccordionButton(buttons, index);
              handled = true;
              break;
            case "Home":
              e.preventDefault();
              buttons[0]?.focus();
              handled = true;
              break;
            case "End":
              e.preventDefault();
              buttons[buttons.length - 1]?.focus();
              handled = true;
              break;
          }
        });
      });
    });

    // Open/Close all functionality
    const accordionTogglers = document.querySelectorAll(".accordion-toggler");
    accordionTogglers.forEach((toggler) => {
      const accordionId = toggler.id.replace("accordionToggle-", "");
      const accordion = document.querySelector(
        `[data-accordion-id="${accordionId}"]`,
      );

      if (!accordion) return;

      const openLink = toggler.querySelector(".open");
      const closeLink = toggler.querySelector(".close");

      if (openLink) {
        openLink.addEventListener("click", (e) => {
          e.preventDefault();
          const buttons = accordion.querySelectorAll(".accordion-button");
          buttons.forEach((btn) => {
            const panel = document.getElementById(
              btn.getAttribute("aria-controls"),
            );
            if (panel && panel.hasAttribute("hidden")) {
              this.toggleAccordionItem(btn);
            }
          });
        });
      }

      if (closeLink) {
        closeLink.addEventListener("click", (e) => {
          e.preventDefault();
          const buttons = accordion.querySelectorAll(".accordion-button");
          buttons.forEach((btn) => {
            const panel = document.getElementById(
              btn.getAttribute("aria-controls"),
            );
            if (panel && !panel.hasAttribute("hidden")) {
              this.toggleAccordionItem(btn);
            }
          });
        });
      }
    });
  }

  /**
   * Toggle accordion item state
   * @param {HTMLElement} button - Accordion button element
   */
  toggleAccordionItem(button) {
    const panelId = button.getAttribute("aria-controls");
    const panel = document.getElementById(panelId);

    if (!panel) return;

    const isExpanded = button.getAttribute("aria-expanded") === "true";

    // Toggle ARIA state
    button.setAttribute("aria-expanded", !isExpanded);

    // Toggle hidden attribute and CSS class
    if (isExpanded) {
      panel.setAttribute("hidden", "");
      button.classList.add("collapsed");
    } else {
      panel.removeAttribute("hidden");
      button.classList.remove("collapsed");
    }
  }

  /**
   * Focus next accordion button
   * @param {NodeList} buttons - All accordion buttons
   * @param {number} currentIndex - Current button index
   */
  focusNextAccordionButton(buttons, currentIndex) {
    const nextIndex = (currentIndex + 1) % buttons.length;
    buttons[nextIndex]?.focus();
  }

  /**
   * Focus previous accordion button
   * @param {NodeList} buttons - All accordion buttons
   * @param {number} currentIndex - Current button index
   */
  focusPreviousAccordionButton(buttons, currentIndex) {
    const prevIndex =
      currentIndex === 0 ? buttons.length - 1 : currentIndex - 1;
    buttons[prevIndex]?.focus();
  }

  generateFactsheetHTML(data) {
    const escapedScientificName = this.escapeHtml(
      data.scientific_name || "Unknown Species",
    );

    // Helper function to generate image-friendly filename from scientific name
    const getImageFilename = (scientificName) => {
      if (!scientificName) return "";
      // Replace spaces with hyphens for image filenames
      return scientificName.replace(/\s+/g, "-");
    };

    // Helper function to render sections only if content exists
    const renderSection = (
      title,
      content,
      htmlClass = "",
      prependContent = "",
    ) => {
      if (!content) return "";
      const renderedContent = this.renderContent(content, this.allowHtml);
      return `
        <div class="factsheet-section ${htmlClass}">
          <h2>${this.escapeHtml(
            title,
          )}</h2>          ${prependContent}          <div class="section-content">${renderedContent}</div>
        </div>
      `;
    };

    // Helper function to render sections without heading
    const renderSectionWithoutHeading = (
      content,
      htmlClass = "",
      prependContent = "",
    ) => {
      if (!content) return "";
      const renderedContent = this.renderContent(content, this.allowHtml);
      return `
        <div class="factsheet-section ${htmlClass}">
          ${prependContent}          <div class="section-content">${renderedContent}</div>
        </div>
      `;
    };

    // Helper function to render accordion item
    const renderAccordionItem = (title, content, id, prependContent = "") => {
      if (!content) return "";
      const renderedContent = this.renderContent(content, this.allowHtml);
      return `
        <div class="accordion-item border-0 border-bottom">
          <h3 class="accordion-header my-0" id="heading-${id}">
            <button class="accordion-button rounded-0 collapsed" type="button" id="btn-${id}" aria-expanded="false" aria-controls="panel-${id}">
              ${this.escapeHtml(title)}
            </button>
          </h3>
          <div id="panel-${id}" role="region" aria-labelledby="btn-${id}" class="accordion-collapse d-print-block" hidden>
            <div class="accordion-body">
              ${prependContent}
              ${renderedContent}
            </div>
          </div>
        </div>
      `;
    };

    // Conservation status text helper
    const getStatusText = (status, label, jurisdiction, act) => {
      if (!status) return "";
      const statusClass = status.toLowerCase().replace(/\s+/g, "-");

      const severityLevels = {
        "critically-endangered": "critical",
        endangered: "high",
        vulnerable: "medium",
        "not-listed": "none",
      };

      const severity = severityLevels[statusClass] || "unknown";

      return `
        <div role="status" 
             aria-label="${jurisdiction} conservation status: ${this.escapeHtml(status)}"
             data-severity="${severity}"
             class="conservation-status-item">
          <div>
            <div class="status-line">
              <span class="status-text">${label}: ${this.escapeHtml(status)}</span>
            </div>
            <div class="status-act"><em>${this.escapeHtml(act)}</em></div>
          </div>
        </div>
      `;
    };

    // Build HTML sections
    let html = `<div class="factsheet-container">`;

    // Conservation status section (placed at top, under subtitle)
    if (data.conservation_status_nt || data.conservation_status_australia) {
      html += `
        <section class="conservation-status-section" aria-labelledby="status-heading">
          <h2 id="status-heading">Conservation status</h2>
          <div class="conservation-status">
      `;
      // Australia listed first (as per design)
      if (data.conservation_status_australia) {
        html += getStatusText(
          data.conservation_status_australia,
          "Australia",
          "Australia",
          "Environment Protection and Biodiversity Conservation Act 1999",
        );
      }
      // Northern Territory listed second
      if (data.conservation_status_nt) {
        html += getStatusText(
          data.conservation_status_nt,
          "Northern Territory",
          "Northern Territory",
          "Territory Parks and Wildlife Conservation Act 1976",
        );
      }
      html += `
          </div>
        </section>
      `;
    }

    // Content sections
    html += `<div class="factsheet-content">`;

    // Family name prepended to Description section
    const familyNameHtml = data.family_name
      ? `<p class="family-name">Family: ${this.escapeHtml(data.family_name)}</p>`
      : "";
    html += renderSection(
      "Description",
      data.description,
      "description",
      familyNameHtml,
    );

    // Accordion sections (Distribution to References)
    const accordionId = "accordion-" + Date.now();
    html += `
      <div class="accordion-toggler ntg-accordion-toggler pt-2 pb-2" id="accordionToggle-${accordionId}">
        <div class="row g-2 justify-content-end">
          <div class="col-auto">
            <a href="#" class="open" aria-expanded="false">
              <strong class="me-1">Open all</strong>
            </a>
          </div>
          <div class="col-auto">
            <a href="#" class="close" aria-expanded="true">
              <strong class="ms-1">Close all</strong>
            </a>
          </div>
        </div>
      </div>
      <div class="ntg-accordion-container">
        <section class="accordion ntg-accordion" data-accordion-id="${accordionId}">
    `;

    html += renderAccordionItem(
      "Distribution",
      data.distribution,
      "distribution",
    );
    html += renderAccordionItem(
      "Ecology and life history",
      data.ecology_and_life_history,
      "ecology",
    );
    html += renderAccordionItem(
      "Threatening processes",
      data.threatening_processes,
      "threats",
    );
    html += renderAccordionItem(
      "Conservation objectives and management",
      data.conservation_objectives_and_management,
      "conservation",
    );
    html += renderAccordionItem("References", data.references, "references");

    html += `
        </section>
      </div>
    `;
    html += `</div>`;

    html += `</div>`;

    return html;
  }

  update(data) {
    this.data = data;
    this.render();

    // Update page metadata
    if (data) {
      const commonName = (data.common_name || "").trim();
      const displayName = commonName || data.scientific_name;
      const isScientificName = !commonName && !!data.scientific_name;
      this.updatePageMetadata(
        displayName,
        isScientificName,
        data.scientific_name,
      );
    }

    // Update sidebar with media instead of navigation
    this.populateSidebarNavigation(data);
  }
}

export default ThreatenedSpeciesFactsheet;

// Auto-initialize on page load
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    const contentArea = document.getElementById("content_area");

    if (contentArea) {
      const factsheet = new ThreatenedSpeciesFactsheet({
        element: contentArea,
        allowHtml: true,
      });

      try {
        factsheet.showLoading();

        const speciesName = factsheet.getSpeciesFromUrl();

        // Fetch and display current species
        const speciesData = await factsheet.fetchSpeciesData(speciesName);

        if (speciesData) {
          factsheet.update(speciesData);
        } else if (speciesName) {
          factsheet.showNotFound(speciesName);
        } else {
          factsheet.showError("No species data available");
        }
      } catch (error) {
        console.error("Failed to load species data:", error);
        factsheet.showError(
          "Failed to load species data. Please check your internet connection and try again.",
        );
      }
    }
  });
}
