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
          <a href="example.html">Threatened Plant Species</a>
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
            <a href="example.html?species=${encodedName}" title="${this.escapeHtml(
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
    return content;
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
    }
  }

  generateFactsheetHTML(data) {
    const escapedScientificName = this.escapeHtml(
      data.scientific_name || "Unknown Species"
    );

    // Helper function to render sections only if content exists
    const renderSection = (title, content, htmlClass = "") => {
      if (!content) return "";
      const renderedContent = this.renderContent(content, this.allowHtml);
      return `
        <div class="factsheet-section ${htmlClass}">
          <h3>${this.escapeHtml(title)}</h3>
          <div class="section-content">${renderedContent}</div>
        </div>
      `;
    };

    // Conservation status badge helper
    const getStatusBadge = (status, label) => {
      if (!status) return "";
      const statusClass = status.toLowerCase().replace(/\s+/g, "-");
      return `<span class="status-badge status-${statusClass}">${label}: ${this.escapeHtml(
        status
      )}</span>`;
    };

    // Build HTML sections
    let html = `<div class="factsheet-container">`;

    // Title and basic info
    html += `<h2 class="factsheet-title"><em>${escapedScientificName}</em></h2>`;

    // Common name and family
    if (data.common_name || data.family_name) {
      html += `<div class="factsheet-meta">`;
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
      html += `</div>`;
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

    // Distribution map
    if (data.map_image_name) {
      const mapUrl = `https://nt.gov.au/environment/native-plants/threatened-plants/maps/${encodeURIComponent(
        data.map_image_name
      )}`;
      html += `
        <div class="distribution-map">
          <img src="${mapUrl}" 
               alt="Distribution map for ${escapedScientificName}" 
               onerror="this.style.display='none'"
               loading="lazy">
        </div>
      `;
    }

    // Content sections
    html += `<div class="factsheet-content">`;
    html += renderSection("Description", data.description, "description");
    html += renderSection("Distribution", data.distribution, "distribution");
    html += renderSection(
      "Ecology and Life History",
      data.ecology_and_life_history,
      "ecology"
    );
    html += renderSection(
      "Threatening Processes",
      data.threatening_processes,
      "threats"
    );
    html += renderSection(
      "Conservation Objectives and Management",
      data.conservation_objectives_and_management,
      "conservation"
    );
    html += renderSection("References", data.references, "references");
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
