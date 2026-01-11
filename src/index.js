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
      : "https://nt.gov.au/environment/dev/threatened-species/get-threatened-plant-species";

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
          species.scientific_name.toLowerCase() === speciesLower
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
   * Populate sidebar navigation with species list
   * @param {Array} speciesList - Array of all species
   * @param {string|null} currentSpecies - Currently selected species name
   */
  populateSidebarNavigation(speciesList, currentSpecies = null) {
    const sidebar = document.querySelector(".col-md-4.my-4.d-print-none");
    if (!sidebar) return;

    const currentSpeciesLower = currentSpecies
      ? currentSpecies.toLowerCase()
      : null;

    // Sort species alphabetically by scientific name
    const sortedSpecies = [...speciesList].sort((a, b) => {
      const nameA = (a.scientific_name || "").toLowerCase();
      const nameB = (b.scientific_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    let navHTML = `
      <section class="ntg-sidenav">
        <div class="ntg-sidenav__title">
          <a href="?">Threatened plant species</a>
        </div>
        <ul class="list-group list-group-flush pt-0">
    `;

    sortedSpecies.forEach((species) => {
      const scientificName = species.scientific_name || "Unknown";
      const isActive =
        currentSpeciesLower &&
        scientificName.toLowerCase() === currentSpeciesLower;
      const activeClass = isActive ? " active" : "";
      const encodedName = encodeURIComponent(scientificName.replace(/ /g, "+"));

      navHTML += `
          <li class="list-group-item${activeClass}">
            <a href="?species=${encodedName}" title="${this.escapeHtml(
        scientificName
      )}">
              <em>${this.escapeHtml(scientificName)}</em>
            </a>
          </li>
      `;
    });

    navHTML += `
        </ul>
      </section>
    `;

    sidebar.innerHTML = navHTML;
  }

  /**
   * Update page metadata with species name
   * @param {string} scientificName - Scientific name of the species
   */
  updatePageMetadata(scientificName) {
    if (!scientificName) return;

    const escapedName = this.escapeHtml(scientificName);

    // Update document title
    document.title = `${escapedName} - Factsheet | NT.GOV.AU`;

    // Update h1 heading
    const h1 = document.querySelector("h1");
    if (h1) {
      h1.innerHTML = `<em>${escapedName}</em>`;
    }

    // Update breadcrumb active item
    const breadcrumbActive = document.querySelector(".breadcrumb-item.active");
    if (breadcrumbActive) {
      breadcrumbActive.innerHTML = `<em>${escapedName}</em>`;
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
          scientificName
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
    // Find all accordion togglers
    const accordionTogglers = document.querySelectorAll(".accordion-toggler");

    accordionTogglers.forEach((toggler) => {
      const accordionId = toggler.id.replace("accordionToggle-", "");
      const accordion = document.querySelector(
        `[data-accordion-id="${accordionId}"]`
      );

      if (!accordion) return;

      const openLink = toggler.querySelector(".open");
      const closeLink = toggler.querySelector(".close");

      if (openLink) {
        openLink.addEventListener("click", (e) => {
          e.preventDefault();
          const collapses = accordion.querySelectorAll(".accordion-collapse");
          collapses.forEach((collapse) => {
            const bsCollapse = new bootstrap.Collapse(collapse, {
              toggle: false,
            });
            bsCollapse.show();
          });
        });
      }

      if (closeLink) {
        closeLink.addEventListener("click", (e) => {
          e.preventDefault();
          const collapses = accordion.querySelectorAll(".accordion-collapse");
          collapses.forEach((collapse) => {
            const bsCollapse = new bootstrap.Collapse(collapse, {
              toggle: false,
            });
            bsCollapse.hide();
          });
        });
      }
    });
  }

  generateFactsheetHTML(data) {
    const escapedScientificName = this.escapeHtml(
      data.scientific_name || "Unknown Species"
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
      prependContent = ""
    ) => {
      if (!content) return "";
      const renderedContent = this.renderContent(content, this.allowHtml);
      return `
        <div class="factsheet-section ${htmlClass}">
          <h2>${this.escapeHtml(
            title
          )}</h2>          ${prependContent}          <div class="section-content">${renderedContent}</div>
        </div>
      `;
    };

    // Helper function to render sections without heading
    const renderSectionWithoutHeading = (
      content,
      htmlClass = "",
      prependContent = ""
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
          <div class="accordion-header my-0" id="heading-${id}">
            <button class="accordion-button rounded-0 collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="false" aria-controls="collapse-${id}">
              ${this.escapeHtml(title)}
            </button>
          </div>
          <div id="collapse-${id}" class="accordion-collapse d-print-block collapse" aria-labelledby="heading-${id}">
            <div class="accordion-body">
              ${prependContent}
              ${renderedContent}
            </div>
          </div>
        </div>
      `;
    };

    // Conservation status badge helper
    const getStatusBadge = (status, label) => {
      if (!status) return "";
      const statusClass = status.toLowerCase().replace(/\s+/g, "-");

      // NOT LISTED uses different styling (white background with outline)
      if (statusClass === "not-listed") {
        return `<div style="float: left; height: 100%; padding-left: 8px; padding-right: 8px; padding-top: 4px; padding-bottom: 4px; background: var(--clr-tag-tag-subtle, white); overflow: hidden; outline: 1px var(--clr-stroke-subtle, #D4D4D2) solid; outline-offset: -1px; justify-content: center; align-items: center; gap: 10px; display: inline-flex">
          <div style="color: var(--clr-text-body, #3B3B3A); font-size: 12px; font-family: Lato; font-weight: 700; text-transform: uppercase; line-height: 16px; letter-spacing: 2px; word-wrap: break-word">${label}: ${this.escapeHtml(
          status
        )}</div>
        </div>`;
      }

      // ENDANGERED uses different styling (white text on dark background)
      if (statusClass === "endangered") {
        return `<div style="float: left; height: 100%; padding-left: 8px; padding-right: 8px; padding-top: 4px; padding-bottom: 4px; background: var(--clr-tag-tag-7, #D2430F); overflow: hidden; justify-content: center; align-items: center; gap: 10px; display: inline-flex">
          <div style="color: var(--clr-text-inverse, white); font-size: 12px; font-family: Lato; font-weight: 700; text-transform: uppercase; line-height: 16px; letter-spacing: 2px; word-wrap: break-word">${label}: ${this.escapeHtml(
          status
        )}</div>
        </div>`;
      }

      // CRITICALLY ENDANGERED uses different styling (white text on dark pink background)
      if (statusClass === "critically-endangered") {
        return `<div style="float: left; height: 100%; padding-left: 8px; padding-right: 8px; padding-top: 4px; padding-bottom: 4px; background: var(--clr-tag-tag-8, #E8114B); overflow: hidden; justify-content: center; align-items: center; gap: 10px; display: inline-flex">
          <div style="color: var(--clr-text-inverse, white); font-size: 12px; font-family: Lato; font-weight: 700; text-transform: uppercase; line-height: 16px; letter-spacing: 2px; word-wrap: break-word">${label}: ${this.escapeHtml(
          status
        )}</div>
        </div>`;
      }

      // Define colors for other statuses (VULNERABLE only)
      const statusColors = {
        vulnerable: "#FCB414",
      };

      const bgColor = statusColors[statusClass] || "#6C757D";

      return `<div style="float: left; height: 100%; padding-left: 8px; padding-right: 8px; padding-top: 4px; padding-bottom: 4px; background: ${bgColor}; overflow: hidden; justify-content: center; align-items: center; gap: 10px; display: inline-flex">
        <div style="color: #3B3B3A; font-size: 12px; font-family: Lato; font-weight: 700; text-transform: uppercase; line-height: 16px; letter-spacing: 2px; word-wrap: break-word">${label}: ${this.escapeHtml(
        status
      )}</div>
      </div>`;
    };

    // Build HTML sections
    let html = `<div class="factsheet-container">`;

    // Species image (before metadata)
    if (data.scientific_name) {
      const imageFilename = getImageFilename(data.scientific_name);
      const imageUrl = `https://nt.gov.au/environment/dev/threatened-species/images/${imageFilename}.webp`;

      // Image credit (if available)
      let figcaptionHtml = "";
      if (data.image_credit) {
        // Remove all HTML tags and escape HTML
        const creditText = data.image_credit.replace(/<[^>]*>/g, "").trim();
        const escapedCredit = this.escapeHtml(creditText);
        figcaptionHtml = `<figcaption>Photo credits: ${escapedCredit}</figcaption>`;
      }

      html += `
        <figure class="species-image">
          <img src="${imageUrl}" 
               alt="${escapedScientificName}" 
               onerror="this.parentElement.style.display='none'"
               loading="lazy">
          ${figcaptionHtml}
        </figure>
      `;

      // Only show metadata callout if there's data
      if (data.common_name || data.family_name) {
        html += `
      <section>
        <div class="ntg-callout my-3">
          <div class="ntg-callout__content">
            <div class="factsheet-meta">`;
        if (data.common_name) {
          html += `<p class="common-name"><strong>Common Name:</strong> ${this.escapeHtml(
            data.common_name
          )}</p>`;
        }
        if (data.family_name) {
          html += `<p class="family-name"><strong>Family:</strong> ${this.escapeHtml(
            data.family_name
          )}</p>`;
        }
        html += `</div>
          </div>
        </div>
      </section>`;
      }
    }

    // Conservation status badges
    if (data.conservation_status_nt || data.conservation_status_australia) {
      html += `<div class="conservation-status">`;
      html += getStatusBadge(data.conservation_status_nt, "NT Status");
      html += getStatusBadge(
        data.conservation_status_australia,
        "Australian Status"
      );
      html += `</div>`;
    }

    // Content sections
    html += `<div class="factsheet-content">`;
    html += renderSectionWithoutHeading(data.description, "description");

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

    // Distribution section with map
    let distributionMapHtml = "";
    if (data.map_image_name && data.scientific_name) {
      const imageFilename = getImageFilename(data.scientific_name);
      const mapUrl = `https://nt.gov.au/environment/dev/threatened-species/maps/${imageFilename}.webp`;
      distributionMapHtml = `
        <div class="distribution-map">
          <img src="${mapUrl}" 
               alt="Distribution map for ${escapedScientificName}" 
               onerror="this.parentElement.style.display='none'"
               loading="lazy">
        </div>
      `;
    }
    html += renderAccordionItem(
      "Distribution",
      data.distribution,
      "distribution",
      distributionMapHtml
    );
    html += renderAccordionItem(
      "Ecology and life history",
      data.ecology_and_life_history,
      "ecology"
    );
    html += renderAccordionItem(
      "Threatening processes",
      data.threatening_processes,
      "threats"
    );
    html += renderAccordionItem(
      "Conservation objectives and management",
      data.conservation_objectives_and_management,
      "conservation"
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
    if (data && data.scientific_name) {
      this.updatePageMetadata(data.scientific_name);
    }
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

        // Fetch all species for sidebar navigation
        const allSpecies = await factsheet.fetchAllSpecies();
        factsheet.populateSidebarNavigation(allSpecies, speciesName);

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
          "Failed to load species data. Please check your internet connection and try again."
        );
      }
    }
  });
}
