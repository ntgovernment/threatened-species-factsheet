// Import styles
import "./styles/main.scss";
import ntgLogo from "../ntg-logo.jpg";

// Import PDF generation libraries
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

/**
 * Threatened Species Factsheet
 * Main entry point for the threatened species factsheet component
 */
class ThreatenedSpeciesFactsheet {
  constructor(options = {}) {
    this.element = options.element || null;
    this.data = options.data || null;
    this.allowHtml = options.allowHtml || false;
    this.totalPages = 0;
    this.isGeneratingPDF = false;

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
   * @param {string|null} scientificName - Species name to search for (common name for fauna, scientific name for flora), or null for first species
   * @returns {Promise<Object|null>} Species data object or null if not found
   */
  async fetchSpeciesData(taxonID = null) {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid API response");
      }

      // If no taxon ID provided, return first species
      if (!taxonID) {
        return data[0];
      }

      // Case-insensitive search for species
      //const speciesLower = taxonID.toLowerCase();

      // First, try matching by common_name (for fauna)
      let foundSpecies = data.find(
        (species) =>
          species.category === "Fauna" &&
          species.taxon_id &&
          species.taxon_id === taxonID,
      );

      // If not found by common name, try matching by scientific_name (fallback for fauna or primary search for flora)
      if (!foundSpecies) {
        foundSpecies = data.find(
          (species) => species.taxon_id && species.taxon_id === taxonID,
        );
      }

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
   * Fetch images for a species from Matrix endpoint
   * @param {string} species - Scientific name of the species used to filter images
   * @returns {Promise<Array<{url: string, name: string}>>}
   * Array of image objects containing URL and file name, or empty array if none found
   */
  async fetchImages(species) {
    try {
      const url = `https://nt.gov.au/environment/dev/threatened-species-folder/configuration/listing/images2/_nocache?species=${encodeURIComponent(species)}`;

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid image response");
      }

      return data;
    } catch (err) {
      console.error("Error fetching images:", err);
      return [];
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

    // Initialize PDF button after sidebar is rendered
    this.initPrintButton();
  }

  /**
   * Render sidebar media content
   * @param {Object} speciesData - Species data object
   * @param {HTMLElement} container - Container element for sidebar
   */
  renderSidebarMedia(speciesData, container) {
    const mediaHTML = `
      <div class="factsheet-sidebar-media">
        ${this.renderSidebarPDFButton()}
        ${this.renderSidebarImage(speciesData)}
        ${this.renderSidebarMap(speciesData)}
        ${this.renderSidebarRelatedInfo(speciesData)}
      </div>
    `;

    container.innerHTML = mediaHTML;
  }

  /**
   * Render sidebar PDF button
   * @returns {string} HTML for PDF button
   */
  renderSidebarPDFButton() {
    return `
      <div class="mb-4 d-print-none">
        <button type="button" class="btn ntg-btn btn-primary factsheet-pdf-button" id="openPrintModal">
          <i class="fa-light fa-file-pdf me-2"></i>
          Export to PDF
        </button>
      </div>
    `;
  }

  /**
   * Render sidebar species image
   * @param {Object} data - Species data object
   * @returns {string} HTML for species image
   */
  renderSidebarImage(data) {
    if (!data.scientific_name || !data.taxon_id) {
      return "";
    }

    const altText = this.escapeHtml(data.common_name || data.scientific_name);

    const images = data.images || [];

    const imageHtml = images
      .filter((img) => /_photo\d*\.webp$/i.test(img.url))
      .sort((a, b) => {
        const getIndex = (url) => {
          const m = url.match(/_photo(\d*)\.webp$/i);
          return m ? (m[1] ? parseInt(m[1], 10) : 0) : 999;
        };
        return getIndex(a.url) - getIndex(b.url);
      })
      .map(
        (img) => `
    <img src="${img.url}" alt="${altText}" loading="lazy">
  `,
      )
      .join("");

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
                    <div class="fotorama" data-auto="false" data-loop="true" data-keyboard="true" data-nav="thumbs" data-width="100%" data-height="350" data-fit="contain" data-thumbwidth="64" data-thumbheight="48" data-thumbfit="cover" data-background="#fff">
                      ${imageHtml}
                    </div>
                  </div>
                 ${
                   figcaptionText && images.length > 0
                     ? `<figcaption>${figcaptionText}</figcaption>`
                     : ""
                 }
                </figure>
                        `;
  }

  /**
   * Render sidebar distribution map
   * @param {Object} data - Species data object
   * @returns {string} HTML for distribution map
   */
  renderSidebarMap(data) {
    if (!data.scientific_name || !data.taxon_id) {
      return "";
    }

    // Always derive map filename from scientific_name (spaces to hyphens, add .webp extension)
    const mapFilename = `${data.scientific_name.replace(/\s+/g, "_")}_${data.taxon_id}.webp`;
    const mapPath = `https://nt.gov.au/_media/docs/environment/threatened-species/maps/${mapFilename}`;
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

  /**
   * Initialize print button event listener
   */
  initPrintButton() {
    const printButton = document.getElementById("openPrintModal");
    if (printButton) {
      printButton.addEventListener("click", () => {
        this.openPrintModal();
      });
    }
  }

  /**
   * Open print preview modal
   */
  async openPrintModal() {
    // Check if modal already exists
    let modalElement = document.getElementById("factsheet-print-modal");

    if (!modalElement) {
      // Create modal and append to body
      const modalHTML = this.generateModalHTML();
      document.body.insertAdjacentHTML("beforeend", modalHTML);
      modalElement = document.getElementById("factsheet-print-modal");
    }

    // Populate modal content with printable HTML
    const modalBody = modalElement.querySelector(".modal-body");
    if (modalBody && this.data) {
      modalBody.innerHTML = this.generatePrintableHTML(this.data);
    }

    // Initialize pagination
    await this.initializePagination(modalElement);

    // Initialize and show Bootstrap modal
    if (typeof window.bootstrap !== "undefined" && window.bootstrap.Modal) {
      const modal = new window.bootstrap.Modal(modalElement);
      modal.show();

      // Add PDF download button event listener
      const modalPDFBtn = modalElement.querySelector("#modalPDFButton");
      if (modalPDFBtn) {
        modalPDFBtn.onclick = () => {
          this.generatePDF();
        };
      }
    } else {
      console.error("Bootstrap Modal not available");
    }
  }

  /**
   * Generate Bootstrap modal HTML structure
   * @returns {string} Modal HTML
   */
  generateModalHTML() {
    const commonName = (this.data?.common_name || "").trim();
    const displayName =
      commonName || this.data?.scientific_name || "Species Factsheet";
    const escapedName = this.escapeHtml(displayName);

    return `
      <div class="modal fade" id="factsheet-print-modal" tabindex="-1" aria-labelledby="factsheetModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="factsheetModalLabel">PDF Preview: ${escapedName}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body print-preview">
              <!-- Content will be inserted here -->
            </div>
            <div class="modal-footer d-print-none">
              <div class="pagination-controls me-auto">
                <span class="page-indicator" id="pageIndicator"></span>
              </div>
              <div class="action-buttons">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                <button type="button" class="btn btn-primary" id="modalPDFButton">
                  <svg width="16" height="16" fill="currentColor" class="me-2" style="vertical-align: text-bottom;">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                  </svg>
                  <span id="pdfButtonText">Export to PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate printable HTML (flattened, no accordions) for modal
   * @param {Object} data - Species data
   * @returns {string} Printable HTML
   */
  generatePrintableHTML(data) {
    const commonName = (data.common_name || "").trim();
    const isFlora = data.category === "Flora";
    const displayName = (isFlora ? "" : commonName) || data.scientific_name;
    const isScientificName =
      !!data.scientific_name && (isFlora || !commonName);
    const escapedName = this.escapeHtml(displayName);
    const formattedName = isScientificName
      ? `<em>${escapedName}</em>`
      : escapedName;

    // Helper function to render sections with H1 headings (promoted from H2)
    const renderSection = (title, content, prependContent = "") => {
      if (!content) return "";
      const renderedContent = this.renderContent(content, this.allowHtml);
      return `
        <section class="print-section">
          <h1>${this.escapeHtml(title)}</h1>
          <div class="section-content">${prependContent}${renderedContent}</div>
        </section>
      `;
    };

    // Helper to render sidebar image
    const renderSidebarImage = () => {
      if (!data.scientific_name || !data.taxon_id) {
        return "";
      }

      const images = (data.images || [])
        .filter(
          (image) =>
            typeof image.url === "string" && /_photo\d*\.webp$/i.test(image.url),
        )
        .sort((a, b) => {
          const getIndex = (url) => {
            const match = url.match(/_photo(\d*)\.webp$/i);
            return match ? (match[1] ? parseInt(match[1], 10) : 0) : 999;
          };
          return getIndex(a.url) - getIndex(b.url);
        })
        .slice(0, 3);

      if (images.length === 0) {
        return "";
      }

      const altText = this.escapeHtml(commonName || data.scientific_name);
      //const imageFilename = `${data.scientific_name.replace(/\s+/g, "_")}_${data.taxon_id}`;
      //const imagePath = `https://nt.gov.au/_media/docs/environment/threatened-species/images/${imageFilename}_photo.webp`;

      const imageHtml = images
        .map(
          (image) => `
            <div class="sidebar-photo">
              <img src="${image.url}"
                   alt="${altText}"
                   class="img-fluid"
                   style="max-width: 100%; height: auto;"
                   onerror="this.parentElement.style.display='none'" />
            </div>
          `,
        )
        .join("");

      let figcaptionText = "";
      if (commonName) {
        figcaptionText = this.escapeHtml(commonName);
      }
      if (data.image_credit) {
        const creditText = data.image_credit.replace(/<[^>]*>/g, "").trim();
        const escapedCredit = this.escapeHtml(creditText);
        const separator = figcaptionText ? ". " : "";
        figcaptionText += `${separator}Photo credit: ${escapedCredit}`;
      }

      return `
        <figure class="sidebar-image mb-3">
          ${imageHtml}
          ${figcaptionText ? `<figcaption class="small mt-2">${figcaptionText}</figcaption>` : ""}
        </figure>
      `;
    };

    // Helper to render sidebar map
    const renderSidebarMap = () => {
      if (!data.scientific_name || !data.taxon_id) return "";

      // Always derive map filename from scientific_name (spaces to underscores, add taxon_id and .webp extension)
      const mapFilename = `${data.scientific_name.replace(/\s+/g, "_")}_${data.taxon_id}.webp`;
      const mapPath = `https://nt.gov.au/_media/docs/environment/threatened-species/maps/${mapFilename}`;
      const altText = `Distribution map for ${this.escapeHtml(commonName || data.scientific_name)}`;
      const speciesName = commonName
        ? this.escapeHtml(commonName)
        : `<em>${this.escapeHtml(data.scientific_name)}</em>`;

      return `
        <figure class="sidebar-map mb-3">
          <img src="${mapPath}" 
               alt="${altText}" 
               class="img-fluid"
               style="max-width: 100%; height: auto;"
               onerror="this.parentElement.style.display='none'" />
          <figcaption class="small mt-2">Known locations of ${speciesName} in the NT (<a href="http://nrmaps.nt.gov.au" target="_blank" rel="noopener noreferrer">nrmaps.nt.gov.au</a>)</figcaption>
        </figure>
      `;
    };

    // Helper to render sidebar related info
    const renderSidebarRelatedInfo = () => {
      if (!data.related_information) return "";

      const relatedContent = this.renderContent(
        data.related_information,
        this.allowHtml,
      );
      const processedContent = relatedContent.replace(
        /<strong>(.*?)<\/strong>/gi,
        '<h2 class="sidebar-subheading">$1</h2>',
      );

      return `
        <div class="sidebar-related-info mb-3">
          <h1 class="sidebar-heading">Related information</h1>
          <div class="sidebar-content small">${processedContent}</div>
        </div>
      `;
    };

    // Conservation status helper - simplified format
    const getStatusText = (status, label, act) => {
      if (!status) return "";
      return `<h2 class="conservation-status-line">${label}: ${this.escapeHtml(status)}</h2><p><em>${this.escapeHtml(act)}</em></p>`;
    };

    // Build printable HTML with continuous content flow
    let html = `<div class="printable-factsheet" id="continuous-content">`;

    // First page structure with sidebar - all content will flow through pagination
    html += `<div class="print-page-first" data-species-title="${this.escapeHtml(formattedName)}">`;

    // Page header with large title
    html += `<div class="print-page-header">`;
    html += `<div class="print-title-large">${formattedName}</div>`;
    if (!isScientificName && data.scientific_name) {
      html += `<p class="print-subtitle"><em>${this.escapeHtml(data.scientific_name)}</em></p>`;
    }
    html += `</div>`;

    // Two-column layout
    html += `<div class="print-layout">`;

    // Main content column - ALL content sections go here for pagination
    html += `<div class="print-main-content">`;

    // Sidebar column (appears on first page only)
    html += `<aside class="print-sidebar">`;
    html += renderSidebarImage();
    html += renderSidebarMap();
    html += renderSidebarRelatedInfo();
    html += `</aside>`;

    // Conservation status
    if (data.conservation_status_nt || data.conservation_status_australia) {
      html += `<section class="print-section conservation-status-section conservation-status-alert">`;
      html += `<h1>Conservation status</h1>`;
      html += `<div class="section-content">`;

      if (data.conservation_status_australia) {
        html += getStatusText(
          data.conservation_status_australia,
          "Australia",
          "Environment Protection and Biodiversity Conservation Act 1999",
        );
      }
      if (data.conservation_status_nt) {
        html += getStatusText(
          data.conservation_status_nt,
          "Northern Territory",
          "Territory Parks and Wildlife Conservation Act 1976",
        );
      }
      html += `</div></section>`;
    }

    // All remaining sections as continuous flow
    html += renderSection("Distribution", data.distribution);
    html += renderSection(
      "Ecology and life history",
      data.ecology_and_life_history,
    );
    html += renderSection("Threatening processes", data.threatening_processes);
    html += renderSection(
      "Conservation objectives and management",
      data.conservation_objectives_and_management,
    );
    html += renderSection("References", data.references);

    // Close main content column
    html += `</div>`;

    // Close two-column layout
    html += `</div>`;

    // Close first page wrapper
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  /**
   * Initialize pagination for modal preview
   * @param {HTMLElement} modalElement - Modal DOM element
   */
  async initializePagination(modalElement) {
    const continuousContent = modalElement.querySelector("#continuous-content");
    if (!continuousContent) return;

    await this.calculatePageBreaks(continuousContent);

    const pages = modalElement.querySelectorAll(".page-container");
    this.totalPages = pages.length;

    const indicator = modalElement.querySelector("#pageIndicator");
    if (indicator) {
      indicator.textContent = `${pages.length} ${pages.length === 1 ? "page" : "pages"}`;
    }
  }

  /**
   * Paginate by measuring real layout so each page is filled to the footer.
   * @param {HTMLElement} contentElement - Continuous content element
   */
  async calculatePageBreaks(contentElement) {
    const first = contentElement.querySelector(".print-page-first");
    const mainContent = first?.querySelector(".print-main-content");
    if (!first || !mainContent) return;

    const speciesTitle = first.getAttribute("data-species-title") || "";
    const headerTemplate = first.querySelector(".print-page-header");
    const sidebarTemplate = first.querySelector(".print-sidebar");

    // Flatten sections into headings and content blocks
    const queue = [];
    Array.from(mainContent.children).forEach((section) => {
      if (section.matches(".print-sidebar")) return;
      if (section.matches(".conservation-status-alert")) {
        queue.push({ type: "content", element: section.cloneNode(true) });
        return;
      }

      const heading = section.querySelector("h1");
      const content = section.querySelector(".section-content");
      if (heading) {
        queue.push({ type: "heading", element: heading.cloneNode(true) });
      }
      if (content) {
        Array.from(content.children).forEach((child) => {
          queue.push({ type: "content", element: child.cloneNode(true) });
        });
      }
    });

    // Sidebar image heights depend on load state
    await this.waitForImages(first);

    // Off-screen host so page CSS (scoped under .print-preview) applies
    const host = document.createElement("div");
    host.className = "print-preview";
    host.style.cssText =
      "position:absolute;left:-10000px;top:0;visibility:hidden;width:21cm;min-height:0;max-height:none;overflow:visible;padding:0;display:block;";
    const stage = document.createElement("div");
    stage.className = "printable-factsheet";
    stage.style.transform = "none";
    stage.style.setProperty("--preview-scale", "1");
    host.appendChild(stage);
    document.body.appendChild(host);

    const pages = [];
    const bodyContent = (body) =>
      Array.from(body.children).filter((el) => !el.matches(".print-sidebar"));

    const createPage = (pageNumber) => {
      const body = document.createElement("div");
      body.className = "page-content-body";
      let page;
      if (pageNumber === 1) {
        if (sidebarTemplate) body.appendChild(sidebarTemplate.cloneNode(true));
        const layout = document.createElement("div");
        layout.className = "print-layout";
        layout.appendChild(body);
        page = document.createElement("div");
        page.className = "page-container";
        page.setAttribute("data-page", "1");
        if (headerTemplate) page.appendChild(headerTemplate.cloneNode(true));
        page.appendChild(layout);
        page.appendChild(this.createPageFooter(1));
      } else {
        page = this.createPageWithHeaderFooter(pageNumber, speciesTitle, body);
      }
      stage.appendChild(page);
      return { page, body };
    };

    const fits = ({ page, body }) => {
      const items = bodyContent(body);
      const last = items[items.length - 1];
      if (!last) return true;
      const footerTop = page
        .querySelector(".print-page-footer")
        .getBoundingClientRect().top;
      return last.getBoundingClientRect().bottom <= footerTop - 8;
    };

    try {
      let pageNumber = 1;
      let current = createPage(pageNumber);

      const finishPage = () => {
        // Never leave a heading stranded at the bottom of a page
        const items = bodyContent(current.body);
        const last = items[items.length - 1];
        if (items.length > 1 && /^H[1-6]$/.test(last.tagName)) {
          current.body.removeChild(last);
          queue.unshift({ type: "heading", element: last });
        }
        pages.push(current.page);
        pageNumber++;
        current = createPage(pageNumber);
      };

      while (queue.length > 0) {
        const item = queue.shift();
        current.body.appendChild(item.element);
        if (fits(current)) continue;

        const isAlone = bodyContent(current.body).length === 1;
        const isHeading = /^H[1-6]$/.test(item.element.tagName);

        if (!isHeading) {
          const tail = this.splitBlockToFit(item.element, current.body, () =>
            fits(current),
          );
          if (tail) {
            queue.unshift({ type: "content", element: tail });
            finishPage();
            continue;
          }
        }

        if (isAlone) {
          // Too tall for any page; keep it rather than loop forever
          finishPage();
          continue;
        }

        current.body.removeChild(item.element);
        queue.unshift(item);
        finishPage();
      }

      if (bodyContent(current.body).length > 0) {
        pages.push(current.page);
      }

      contentElement.innerHTML = "";
      pages.forEach((page) => contentElement.appendChild(page));
    } finally {
      document.body.removeChild(host);
    }
  }

  /**
   * Resolve once images are loaded (or failed), with a safety timeout.
   * @param {HTMLElement} root - Element containing images
   */
  waitForImages(root) {
    const pending = Array.from(root.querySelectorAll("img"))
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          }),
      );
    if (pending.length === 0) return Promise.resolve();
    return Promise.race([
      Promise.all(pending),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }

  /**
   * Split an overflowing block so the head fills the page. The head replaces
   * `element` in `body`; the returned tail belongs on the next page.
   * @param {HTMLElement} element - Block currently appended to body
   * @param {HTMLElement} body - Page body
   * @param {Function} fits - Returns true if the page content fits
   * @returns {HTMLElement|null} Tail element, or null if it can't be split
   */
  splitBlockToFit(element, body, fits) {
    if (/^(UL|OL)$/.test(element.tagName)) {
      return this.splitListToFit(element, body, fits);
    }
    if (element.querySelector("p,ul,ol,div,table,figure,img,li")) return null;
    return this.splitTextToFit(element, body, fits);
  }

  splitListToFit(list, body, fits) {
    const items = Array.from(list.children);
    const startAttr = parseInt(list.getAttribute("start"), 10) || 1;
    let head = list;

    for (let count = items.length - 1; count >= 1; count--) {
      const candidate = list.cloneNode(false);
      items
        .slice(0, count)
        .forEach((li) => candidate.appendChild(li.cloneNode(true)));
      body.replaceChild(candidate, head);
      head = candidate;
      if (!fits()) continue;

      const tail = list.cloneNode(false);
      items
        .slice(count)
        .forEach((li) => tail.appendChild(li.cloneNode(true)));
      if (list.tagName === "OL") tail.setAttribute("start", startAttr + count);
      return tail;
    }

    body.replaceChild(list, head);
    return null;
  }

  splitTextToFit(element, body, fits) {
    const style = window.getComputedStyle(element);
    const lineHeight =
      parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.3;
    const lines = Math.round(element.getBoundingClientRect().height / lineHeight);
    // Too short to split without leaving an orphan or widow
    if (lines < 4) return null;

    const text = element.textContent;
    const charsPerLine = text.length / lines;
    const maxOffset = text.length - 2 * charsPerLine;

    const breaks = [];
    for (let i = 1; i < text.length; i++) {
      if (/\s/.test(text[i]) && !/\s/.test(text[i - 1])) breaks.push(i);
    }

    const original = element.cloneNode(true);
    const buildParts = (offset) => {
      const head = original.cloneNode(true);
      const walker = document.createTreeWalker(head, NodeFilter.SHOW_TEXT);
      let seen = 0;
      let node;
      while ((node = walker.nextNode())) {
        const length = node.nodeValue.length;
        if (seen + length >= offset) {
          const range = document.createRange();
          range.setStart(node, offset - seen);
          range.setEnd(head, head.childNodes.length);
          const tail = head.cloneNode(false);
          tail.appendChild(range.extractContents());
          return { head, tail };
        }
        seen += length;
      }
      return null;
    };

    let shown = element;
    let best = null;
    let lo = 0;
    let hi = breaks.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const parts = breaks[mid] <= maxOffset ? buildParts(breaks[mid]) : null;
      if (!parts) {
        hi = mid - 1;
        continue;
      }
      body.replaceChild(parts.head, shown);
      shown = parts.head;
      if (fits()) {
        best = parts;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (best) {
      body.replaceChild(best.head, shown);
      shown = best.head;
      if (best.head.getBoundingClientRect().height >= 2 * lineHeight - 1) {
        return best.tail;
      }
    }

    body.replaceChild(element, shown);
    return null;
  }

  /**
   * Create page with header (smaller title) and footer
   * @param {number} pageNumber - Page number
   * @param {string} title - Species title
   * @param {HTMLElement} content - Page content
   * @returns {HTMLElement} Page container element
   */
  createPageWithHeaderFooter(pageNumber, title, content) {
    const page = document.createElement("div");
    page.className = "page-container";
    page.setAttribute("data-page", pageNumber.toString());

    // Add page header with smaller title
    const header = document.createElement("div");
    header.className = "print-page-header-small";
    header.innerHTML = `<div class="print-title-small">${title}</div>`;

    // Add footer with logo
    const footer = this.createPageFooter(pageNumber);

    page.appendChild(header);
    page.appendChild(content);
    page.appendChild(footer);

    return page;
  }

  /**
   * Create page footer with NT Government logo
   * @param {number} pageNumber - Page number
   * @returns {HTMLElement} Footer element
   */
  createPageFooter(pageNumber) {
    const footer = document.createElement("div");
    footer.className = "print-page-footer";
    const updatedDate = this.data?.updated ? new Date(this.data.updated) : null;
    const dateLabel =
      updatedDate && !Number.isNaN(updatedDate.getTime())
        ? updatedDate.toLocaleDateString("en-AU", {
            month: "long",
            timeZone: "UTC",
            year: "numeric",
          })
        : "";
    footer.innerHTML = `
      <div class="footer-content">
        <div class="footer-left">
          <div class="footer-department">Department of Lands, Planning and Environment</div>
          <div class="footer-meta">${dateLabel ? `${dateLabel} | ` : ""}Page ${pageNumber}</div>
        </div>
        <div class="footer-right">
          <img src="${ntgLogo}" alt="Northern Territory Government" class="ntg-logo" />
        </div>
      </div>
    `;
    return footer;
  }

  /**
   * Measure element height by temporarily rendering it
   * @param {HTMLElement} element - Element to measure
   * @returns {number} Height in pixels
   */
  measureElementHeight(element) {
    const tempDiv = document.createElement("div");
    tempDiv.style.position = "absolute";
    tempDiv.style.visibility = "hidden";
    tempDiv.style.width = "21cm";
    tempDiv.style.padding = "1.5cm";
    tempDiv.appendChild(element.cloneNode(true));
    document.body.appendChild(tempDiv);

    const height = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);

    return height;
  }

  /**
   * Generate and download PDF
   */
  addSearchableTextAndLinks(pdf, page, pageBounds, imageWidth, imageHeight) {
    if (!pageBounds.width || !pageBounds.height) return;

    const scaleX = imageWidth / pageBounds.width;
    const scaleY = imageHeight / pageBounds.height;
    const toPdfRect = (rect) => {
      const left = Math.max(0, rect.left - pageBounds.left);
      const top = Math.max(0, rect.top - pageBounds.top);
      const right = Math.min(pageBounds.width, rect.right - pageBounds.left);
      const bottom = Math.min(pageBounds.height, rect.bottom - pageBounds.top);

      if (right <= left || bottom <= top) return null;

      return {
        x: left * scaleX,
        y: top * scaleY,
        w: (right - left) * scaleX,
        h: (bottom - top) * scaleY,
      };
    };

    const textWalker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    let textNode;

    while ((textNode = textWalker.nextNode())) {
      const parent = textNode.parentElement;
      if (!parent || !textNode.nodeValue.trim()) continue;
      if (parent.closest("script, style, noscript, [aria-hidden='true']")) {
        continue;
      }

      const style = window.getComputedStyle(parent);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const lines = new Map();
      const range = document.createRange();
      for (let index = 0; index < textNode.nodeValue.length; index++) {
        range.setStart(textNode, index);
        range.setEnd(textNode, index + 1);
        const rect = range.getBoundingClientRect();
        if (!rect.width || !rect.height) continue;

        const lineKey = Math.round(rect.top);
        const line = lines.get(lineKey) || {
          text: "",
          left: rect.left,
          bottom: rect.bottom,
        };
        line.text += textNode.nodeValue[index];
        line.left = Math.min(line.left, rect.left);
        line.bottom = Math.max(line.bottom, rect.bottom);
        lines.set(lineKey, line);
      }

      for (const line of lines.values()) {
        if (!line.text.trim()) continue;
        const left = Math.max(pageBounds.left, line.left);
        const bottom = Math.min(pageBounds.bottom, line.bottom);
        if (left >= pageBounds.right || bottom <= pageBounds.top) continue;

        const fontSize =
          (parseFloat(style.fontSize) * scaleX * 72) / 25.4;
        const fontStyle =
          `${parseInt(style.fontWeight, 10) >= 600 ? "bold" : ""}${style.fontStyle === "italic" ? "italic" : ""}` ||
          "normal";
        pdf.setFont("helvetica", fontStyle);
        pdf.setFontSize(fontSize);
        pdf.text(
          line.text,
          (left - pageBounds.left) * scaleX,
          (bottom - pageBounds.top) * scaleY,
          { baseline: "bottom", renderingMode: "invisible" },
        );
      }
    }

    page.querySelectorAll("a[href]").forEach((anchor) => {
      let url;
      try {
        url = new URL(anchor.href, document.baseURI);
      } catch {
        return;
      }

      if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) {
        return;
      }

      Array.from(anchor.getClientRects()).forEach((rect) => {
        const pdfRect = toPdfRect(rect);
        if (pdfRect) {
          pdf.link(pdfRect.x, pdfRect.y, pdfRect.w, pdfRect.h, {
            url: url.href,
          });
        }
      });
    });
  }

  async generatePDF() {
    if (this.isGeneratingPDF) return;

    this.isGeneratingPDF = true;
    const pdfButton = document.getElementById("modalPDFButton");
    const buttonText = document.getElementById("pdfButtonText");

    if (pdfButton) pdfButton.disabled = true;
    if (buttonText) buttonText.textContent = "Generating PDF...";

    try {
      const modalElement = document.getElementById("factsheet-print-modal");
      if (!modalElement) {
        throw new Error("Modal element not found");
      }

      const pages = modalElement.querySelectorAll(".page-container");
      if (pages.length === 0) {
        throw new Error("No pages found to generate PDF");
      }

      // A4 dimensions in mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Wait for all images to load before generating PDF
      await Promise.all(
        Array.from(pages).map((page) => {
          return Promise.all(
            Array.from(page.querySelectorAll("img")).map((img) => {
              if (img.complete) return Promise.resolve();
              return new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Resolve even on error to not block PDF generation
                // Fallback timeout
                setTimeout(resolve, 10000);
              });
            }),
          );
        }),
      );

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Temporarily show page for rendering
        const originalDisplay = page.style.display;
        page.style.display = "block";
        const pageBounds = page.getBoundingClientRect();

        // Generate canvas from page
        const canvas = await html2canvas(page, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true, // Allow cross-origin images
          logging: false,
          backgroundColor: "#ffffff",
          imageTimeout: 15000, // Wait up to 15 seconds for images to load
          onclone: (clonedDoc) => {
            // Ensure images are visible in cloned document for rendering
            const images = clonedDoc.querySelectorAll("img");
            images.forEach((img) => {
              img.style.display = "block";
              img.style.visibility = "visible";
            });
          },
        });

        // Restore original display
        page.style.display = originalDisplay;

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add new page if not first
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
        this.addSearchableTextAndLinks(pdf, page, pageBounds, imgWidth, imgHeight);
      }

      // Generate filename from species name
      const commonName =
        this.data?.common_name || this.data?.scientific_name || "species";
      const filename = `${commonName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-factsheet.pdf`;

      // Save PDF
      pdf.save(filename);

      if (buttonText) buttonText.textContent = "Export to PDF";
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF. Please try again.");
      if (buttonText) buttonText.textContent = "Export to PDF";
    } finally {
      this.isGeneratingPDF = false;
      if (pdfButton) pdfButton.disabled = false;
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

  //initializes Fotorama galleries if the library is loaded
  initFotorama() {
    if (!window.jQuery || !window.jQuery.fn || !window.jQuery.fn.fotorama) {
      return;
    }

    var galleries = document.querySelectorAll(".fotorama");

    for (var i = 0; i < galleries.length; i++) {
      var el = galleries[i];

      if (!el.classList.contains("fotorama-initialized")) {
        window.jQuery(el).fotorama();
      }
    }
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
          <h2 class="accordion-header my-0" id="heading-${id}">
            <button class="accordion-button rounded-0 collapsed" type="button" id="btn-${id}" aria-expanded="false" aria-controls="panel-${id}">
              ${this.escapeHtml(title)}
            </button>
          </h2>
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
        <section class="conservation-status-section conservation-status-alert" aria-labelledby="status-heading">
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

    html += renderSection("Description", data.description, "description");

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
      const isFlora = data.category === "Flora";
      const commonName = isFlora ? "" : (data.common_name || "").trim();
      const displayName = commonName || data.scientific_name;
      const isScientificName =
        isFlora || (!commonName && !!data.scientific_name);
      this.updatePageMetadata(
        displayName,
        isScientificName,
        isFlora ? null : data.scientific_name,
      );
    }

    // Update sidebar with media instead of navigation
    this.populateSidebarNavigation(data);
    // call initFotorama after content is rendered to ensure galleries are initialized correctly
    this.initFotorama();
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

        const taxonID = factsheet.getSpeciesFromUrl();

        // Fetch and display current species
        const speciesData = await factsheet.fetchSpeciesData(taxonID);

        if (speciesData) {
          speciesData.images = await factsheet.fetchImages(taxonID);
          factsheet.update(speciesData);
        } else if (taxonID) {
          factsheet.showNotFound(taxonID);
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
